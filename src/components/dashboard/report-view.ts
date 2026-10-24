import { ExtractionSchema, ScenarioSchema, type WellTelemetryReport } from "../../types/telemetry";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export function validateUpload(file: Pick<File, "name" | "size">): string | null {
  if (!/\.(pdf|csv|xlsx|txt)$/i.test(file.name)) return "Choose a PDF, CSV, XLSX, or TXT drilling report.";
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return "Choose a non-empty file up to 8 MB.";
  return null;
}
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);

// Validate the API boundary without recalculating P2's metrics.
export function readReport(value: unknown): WellTelemetryReport {
  const invalid = () => new Error("The server returned an incomplete report. Your previous report is unchanged.");
  if (!object(value) || !ExtractionSchema.safeParse(value).success || !ScenarioSchema.safeParse(value.scenario).success) throw invalid();
  if (!["SYNTHETIC_DEMO", "PUBLIC_SOURCE_UNREVIEWED", "HUMAN_VERIFIED"].includes(String(value.sourceKind))) throw invalid();
  if (!object(value.metrics) || !Array.isArray(value.insights) || !Array.isArray(value.depthCurve) || typeof value.generatedAt !== "string") throw invalid();
  const extraction = ExtractionSchema.parse(value);
  const ids = new Set(extraction.events.map(event => event.id));
  if (ids.size !== extraction.events.length) throw invalid();
  const metrics = value.metrics;
  for (const key of ["observedMinutes", "classifiedMinutes", "productiveMinutes", "nptMinutes", "iltMinutes", "estimatedLossUsd", "estimatedNptCostUsd", "estimatedIltOpportunityUsd"]) {
    if (!finite(metrics[key])) throw invalid();
  }
  for (const key of ["efficiencyPct", "modeledExcessFuelGallons", "modeledExcessCo2Tons"]) {
    if (metrics[key] !== null && !finite(metrics[key])) throw invalid();
  }
  for (const point of value.depthCurve) {
    if (!object(point) || !finite(point.minute) || !finite(point.holeDepthFt) || typeof point.eventId !== "string" || !ids.has(point.eventId) || !["PRODUCTIVE", "NPT", "UNKNOWN"].includes(String(point.classification))) throw invalid();
  }
  for (const insight of value.insights) {
    if (!object(insight) || typeof insight.eventId !== "string" || !ids.has(insight.eventId) || !finite(insight.nptMinutes) || !finite(insight.avoidableCostUsd) || (insight.iltMinutes !== null && !finite(insight.iltMinutes)) || !["NPT", "ILT", "NORMAL", "UNCERTAIN"].includes(String(insight.category))) throw invalid();
  }
  return { ...value, scenario: ScenarioSchema.parse(value.scenario) } as WellTelemetryReport;
}
export const sourceLabels: Record<WellTelemetryReport["sourceKind"], string> = {
  SYNTHETIC_DEMO: "SYNTHETIC_DEMO",
  PUBLIC_SOURCE_UNREVIEWED: "Uploaded · UNVERIFIED",
  HUMAN_VERIFIED: "HUMAN_VERIFIED",
};
export function formatMinute(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
export function latestHoleDepth(report: WellTelemetryReport): number | null {
  for (const event of [...report.events].sort((a, b) => b.endMinute - a.endMinute)) {
    if (event.endHoleDepthFt !== null) return event.endHoleDepthFt;
    if (event.startHoleDepthFt !== null) return event.startHoleDepthFt;
  }
  return null;
}
export function chartPoints(report: WellTelemetryReport) {
  const points: { minute: number; holeDepthFt: number | null; eventId: string }[] = [];
  for (const event of report.events) {
    const previous = points.at(-1);
    if (previous && previous.minute < event.startMinute) points.push({ minute: previous.minute, holeDepthFt: null, eventId: "" });
    // Missing depths stay missing; the analytics curve can carry prior depths forward.
    points.push({ minute: event.startMinute, holeDepthFt: event.startHoleDepthFt, eventId: event.id });
    points.push({ minute: event.endMinute, holeDepthFt: event.endHoleDepthFt, eventId: event.id });
  }
  return points;
}

export async function ingestReport(file: File, signal: AbortSignal): Promise<WellTelemetryReport> {
  const error = validateUpload(file);
  if (error) throw new Error(error);
  const data = new FormData();
  data.append("file", file);
  const response = await fetch("/api/ingest", { method: "POST", body: data, signal });
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new Error(`Report service returned an unreadable response (HTTP ${response.status}). Please retry.`); }
  if (!response.ok) throw new Error(object(result) && typeof result.error === "string" ? result.error : `Report extraction failed (HTTP ${response.status}).`);
  const report = readReport(result);
  if (report.sourceKind === "SYNTHETIC_DEMO") throw new Error("Upload returned demo data instead of an extracted report. Your previous report is unchanged.");
  return report;
}
