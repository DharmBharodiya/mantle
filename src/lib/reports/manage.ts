import { z } from "zod";
import { buildWellReport } from "@/lib/analytics/compute";
import { SourceKindSchema, ReportMetricsSchema, ScenarioSchema, WellTelemetryReportSchema, type WellTelemetryReport } from "@/types/telemetry";
export const SummarySchema = z.object({ id: z.string().max(100), wellName: z.string().max(250), reportDate: z.string().max(40), sourceKind: SourceKindSchema, eventCount: z.number().int().min(0).max(500), warningCount: z.number().int().min(0), metrics: ReportMetricsSchema, scenario: ScenarioSchema, startDepthFt: z.number().nonnegative().nullable(), endDepthFt: z.number().nonnegative().nullable(), depthObservationCount: z.number().int().nonnegative().default(0), savedAt: z.string().datetime() });
export type ReportSummary = z.infer<typeof SummarySchema>;
export const STORAGE_KEY = "boresight.summary-history.v1";
export const MAX_SAVED_SUMMARIES = 30;
export function summarizeReport(report: WellTelemetryReport, id: string): ReportSummary {
    const sorted = [...report.depthCurve].sort((a, b) => a.minute - b.minute);
    return { id, wellName: report.wellName, reportDate: report.reportDate, sourceKind: report.sourceKind, eventCount: report.events.length, warningCount: report.warnings.length, metrics: report.metrics, scenario: report.scenario, startDepthFt: sorted[0]?.holeDepthFt ?? null, endDepthFt: sorted.at(-1)?.holeDepthFt ?? null, depthObservationCount: sorted.length, savedAt: new Date().toISOString() };
}
export function readSummaries(text: string | null): ReportSummary[] {
    if (!text)
        return [];
    if (text.length > 100000)
        throw new Error("Browser summary history exceeds its storage limit. Clear it to start again.");
    const parsed = z.array(SummarySchema).max(MAX_SAVED_SUMMARIES).safeParse(JSON.parse(text));
    if (!parsed.success)
        throw new Error("Browser summary history is invalid. Clear it to start again.");
    return parsed.data;
}
export function addSummary(existing: ReportSummary[], summary: ReportSummary): ReportSummary[] {
    return [SummarySchema.parse(summary), ...existing.filter(item => item.id !== summary.id)].slice(0, MAX_SAVED_SUMMARIES);
}
export function csvCell(value: string | number | null | undefined): string {
    let text = value == null ? "" : String(value);
    if (typeof value === "string" && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)))
        text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}
export function exportEventsCsv(report: WellTelemetryReport): string {
    const headers = ["source_kind", "well", "report_date", "event_id", "start_minute", "end_minute", "activity", "classification", "confidence", "start_hole_depth_ft", "end_hole_depth_ft", "confirmed_npt_minutes", "ilt_opportunity_minutes_blank_if_unknown", "modeled_cost_usd", "source_file", "source_page", "source_row", "source_sheet", "exact_excerpt", "interpretation", "scenario_rig_usd_per_day", "scenario_drilling_benchmark_ft_hr", "scenario_excess_fuel_gal_hr", "scenario_kg_co2_gal"];
    const rows = report.events.map(event => {
        const insight = report.insights.find(i => i.eventId === event.id);
        return [report.sourceKind, report.wellName, report.reportDate, event.id, event.startMinute, event.endMinute, event.activity, event.classification, event.confidence, event.startHoleDepthFt, event.endHoleDepthFt, insight?.nptMinutes, insight?.iltMinutes, insight?.avoidableCostUsd, event.evidence.fileName, event.evidence.page, event.evidence.row, event.evidence.sheet, event.evidence.snippet, event.explanation, report.scenario.rigDailyUsd, report.scenario.drillBenchmarkFtPerHour, report.scenario.excessFuelGallonsPerHour, report.scenario.kgCo2PerGallon].map(csvCell).join(",");
    });
    return "\uFEFF" + [headers.map(csvCell).join(","), ...rows].join("\r\n");
}
export function exportSnapshot(report: WellTelemetryReport): string { return JSON.stringify({ format: "boresight-report", version: 1, report }, null, 2); }
export function importSnapshot(text: string): WellTelemetryReport {
    if (text.length > 2 * 1024 * 1024)
        throw new Error("Analysis snapshot must be under 2 MB.");
    const snapshot = z.object({ format: z.literal("boresight-report"), version: z.literal(1), report: WellTelemetryReportSchema }).parse(JSON.parse(text));
    if (!snapshot.report.events.length)
        throw new Error("Analysis snapshot contains no drilling events. Your current report is unchanged.");
    const sourceKind = snapshot.report.sourceKind === "SYNTHETIC_DEMO" ? "SYNTHETIC_DEMO" : "PUBLIC_SOURCE_UNREVIEWED";
    return buildWellReport({ ...snapshot.report, warnings: [...snapshot.report.warnings.slice(0, 99), "Imported analysis snapshot: metrics recalculated locally; provenance has not been independently verified."] }, { scenario: snapshot.report.scenario, sourceKind });
}
