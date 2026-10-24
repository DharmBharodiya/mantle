import { WellTelemetryReportSchema, type WellTelemetryReport } from "../../types/telemetry";

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
  const result = WellTelemetryReportSchema.safeParse(value);
  if (!result.success) throw new Error("The server returned an incomplete report. Your previous report is unchanged.");
  const report = result.data;
  const ids = new Set(report.events.map(event => event.id));
  if (ids.size !== report.events.length || report.insights.some(insight => !ids.has(insight.eventId)) || report.depthCurve.some(point => !ids.has(point.eventId))) throw new Error("The server returned an incomplete report with invalid event references.");
  return report;
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

export function ingestionErrorMessage(error: string): string {
  // The ingestion route can return an SDK error serialized as a JSON string.
  // Preserve the provider's message while making its status readable.
  try {
    const parsed: unknown = JSON.parse(error);
    if (object(parsed) && object(parsed.error) && typeof parsed.error.message === "string") {
      const code = finite(parsed.error.code) ? ` (${parsed.error.code})` : "";
      return `Extraction provider error${code}: ${parsed.error.message}`;
    }
  } catch { /* Plain-text API errors already have a usable message. */ }
  return error;
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
  if (!response.ok) throw new Error(object(result) && typeof result.error === "string" ? ingestionErrorMessage(result.error) : `Report extraction failed (HTTP ${response.status}).`);
  const report = readReport(result);
  if (report.sourceKind === "SYNTHETIC_DEMO" && !/^SYNTHETIC_DEMO/i.test(file.name)) throw new Error("Upload returned demo data instead of an extracted report. Your previous report is unchanged.");
  return report;
}

