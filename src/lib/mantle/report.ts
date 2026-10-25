import { DEMO_REPORT } from "@/data/demo-report";
import { buildWellReport } from "@/lib/analytics/compute";
import type { WellTelemetryReport } from "@/types/telemetry";

// Homepage presentation adapter only. BoreSight's canonical engine owns all metrics.
// This preview intentionally accepts only its complete, explicitly synthetic fixture.
export type EventClass = "productive" | "npt";
export type EventKind = "drilling" | "flat";
export type Confidence = "high" | "medium" | "low";
export interface DrillEvent {
  id: string; start: number; end: number; startDepth: number; footage: number;
  operation: string; kind: EventKind; cls: EventClass; raw: string; mark: string;
  line: number | null; page?: number; summary: string; confidence: Confidence;
}
export interface Assumptions { dayRate: number; ropBenchmark: number; fuelGalPerHour: number | null; co2KgPerGal: number }
export interface EventMetrics extends DrillEvent { hours: number; rop: number; ilt: number; lost: number; lostCost: number }
export interface DayMetrics { events: EventMetrics[]; observedHours: number; productiveHours: number; nptHours: number; iltHours: number; lostHours: number; effectiveHours: number | null; effectivePct: number | null; benchmarkCoveragePct: number; nptCost: number; iltCost: number; totalCost: number; fuelGal: number | null; co2Tonnes: number | null; startDepth: number; endDepth: number; footage: number }
export const DEFAULT_ASSUMPTIONS: Assumptions = { dayRate: DEMO_REPORT.scenario.rigDailyUsd, ropBenchmark: DEMO_REPORT.scenario.drillBenchmarkFtPerHour, fuelGalPerHour: DEMO_REPORT.scenario.excessFuelGallonsPerHour, co2KgPerGal: DEMO_REPORT.scenario.kgCo2PerGallon };
function previewEvents(report: WellTelemetryReport): DrillEvent[] {
  return report.events.map(event => {
    if(event.classification === "UNKNOWN" || event.startHoleDepthFt === null || event.endHoleDepthFt === null) throw new Error("The homepage preview requires complete synthetic observations; use the canonical console for unknown values.");
    return { id: event.id, start: event.startMinute / 60, end: event.endMinute / 60, startDepth: event.startHoleDepthFt, footage: event.endHoleDepthFt - event.startHoleDepthFt, operation: event.activity.replaceAll("_", " ").toLowerCase(), kind: event.activity === "DRILLING" ? "drilling" : "flat", cls: event.classification === "NPT" ? "npt" : "productive", raw: event.evidence.snippet, mark: event.evidence.snippet, line: event.evidence.row ?? null, ...(event.evidence.page === null ? {} : {page: event.evidence.page}), summary: event.explanation, confidence: event.confidence.toLowerCase() as Confidence };
  });
}
export const DEMO_EVENTS = previewEvents(DEMO_REPORT);
export function computeDay(events: DrillEvent[], assumptions: Assumptions = DEFAULT_ASSUMPTIONS): DayMetrics {
  if(events !== DEMO_EVENTS) throw new Error("Mantle preview is restricted to the synthetic fixture. Use buildWellReport for uploaded report analytics.");
  const report = buildWellReport(DEMO_REPORT, { sourceKind: "SYNTHETIC_DEMO", scenario: { ...DEMO_REPORT.scenario, rigDailyUsd: assumptions.dayRate, drillBenchmarkFtPerHour: assumptions.ropBenchmark, excessFuelGallonsPerHour: assumptions.fuelGalPerHour, kgCo2PerGallon: assumptions.co2KgPerGal } });
  const m = report.metrics;
  return { events: previewEvents(report).map(event => {
    const insight = report.insights.find(item => item.eventId === event.id)!;
    const hours = event.end - event.start;
    return { ...event, hours, rop: event.kind === "drilling" ? event.footage / hours : 0, ilt: (insight.iltMinutes ?? 0) / 60, lost: (insight.nptMinutes + (insight.iltMinutes ?? 0)) / 60, lostCost: insight.avoidableCostUsd };
  }), observedHours: m.observedMinutes/60, productiveHours: m.productiveMinutes/60, nptHours: m.nptMinutes/60, iltHours: m.iltMinutes/60, lostHours: (m.nptMinutes+m.iltMinutes)/60, effectiveHours: m.efficiencyPct===null?null:(m.productiveMinutes-m.iltMinutes)/60, effectivePct: m.efficiencyPct, benchmarkCoveragePct:m.benchmarkCoveragePct, nptCost:m.estimatedNptCostUsd, iltCost:m.estimatedIltOpportunityUsd, totalCost:m.estimatedLossUsd, fuelGal:m.modeledExcessFuelGallons, co2Tonnes:m.modeledExcessCo2Tons, startDepth:DEMO_EVENTS[0].startDepth, endDepth:DEMO_EVENTS.at(-1)!.startDepth+DEMO_EVENTS.at(-1)!.footage, footage:report.events.reduce((sum,event)=>sum+Math.max(0,(event.endHoleDepthFt??0)-(event.startHoleDepthFt??0)),0) };
}
export function fmtClock(hours: number): string { const minute=Math.round(hours*60); return `${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`; }
export function fmtMoney(value: number): string { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value); }
export function fmtNum(value: number | null, digits = 1): string { return value===null?"Not available":value.toLocaleString("en-US",{minimumFractionDigits:digits,maximumFractionDigits:digits}); }
