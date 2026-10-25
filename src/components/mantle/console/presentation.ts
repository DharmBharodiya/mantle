import type { DrillingEvent, WellTelemetryReport } from "@/types/telemetry";
import { fmtClock } from "@/lib/mantle/report";

// Presentation only: classification and scenario metrics always come from the canonical report.
export function classPill(event: DrillingEvent, report: WellTelemetryReport) {
  if (event.classification === "NPT") return { label: "NPT", className: "bg-npt/15 text-npt-ink" };
  if (event.classification === "UNKNOWN") return { label: "Unknown", className: "bg-white/5 text-steam-3" };
  if ((report.insights.find(i => i.eventId === event.id)?.iltMinutes ?? 0) > 0) return { label: "Productive · ILT", className: "bg-ilt/15 text-ilt-ink" };
  return { label: "Productive", className: "bg-productive/20 text-productive-ink" };
}
export function sourceReference(event: DrillingEvent) {
  const e = event.evidence;
  return [e.fileName, e.page ? `Page ${e.page}` : "Page unavailable", e.sheet ? `Sheet ${e.sheet}` : "", e.row ? `Row ${e.row}` : ""].filter(Boolean).join(" · ");
}
export function eventTime(event: DrillingEvent) { return `${fmtClock(event.startMinute / 60)}–${fmtClock(event.endMinute / 60)}`; }
export function operation(event: DrillingEvent) { return event.activity.toLowerCase().replaceAll("_", " "); }
