import type { WellTelemetryReport } from "@/types/telemetry";
import { fmtMoney, fmtNum } from "@/lib/mantle/report";
import { classPill, eventTime, operation, sourceReference } from "./presentation";

/** Adapted from the kit EvidencePanel. Exact evidence stays complete, with real row/page references only. */
export function EvidencePanel({ report, selectedId }: { report: WellTelemetryReport; selectedId?: string }) {
  const event = report.events.find(e => e.id === selectedId);
  if (!event) return <section className="m-panel"><h2>Source evidence</h2><p className="mt-3 text-steam-3">Select an event to inspect its original excerpt.</p></section>;
  const insight = report.insights.find(i => i.eventId === event.id);
  const pill = classPill(event, report);
  return <section id="selected-evidence" tabIndex={-1} aria-label="Selected event" className="m-panel flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs text-steam-4">{eventTime(event)}</span><span className={`rounded-full px-3 py-1 text-xs ${pill.className}`}>{pill.label}</span></div>
    <div><h2 className="text-2xl capitalize">{operation(event)}</h2><p className="mt-2 text-sm text-steam-3">{event.explanation || event.note || "No interpretation available."}</p></div>
    <dl className="grid grid-cols-2 gap-4 border-y border-m-line py-4 text-sm"><div><dt className="text-steam-4">Hole depth start / end</dt><dd className="mt-1 font-mono">{fmtNum(event.startHoleDepthFt, 0)} / {fmtNum(event.endHoleDepthFt, 0)} ft</dd></div><div><dt className="text-steam-4">Duration</dt><dd className="mt-1 font-mono">{fmtNum((event.endMinute-event.startMinute)/60)} h</dd></div><div><dt className="text-steam-4">Drilling ILT</dt><dd className="mt-1 font-mono">{fmtNum(insight?.iltMinutes == null ? null : insight.iltMinutes/60)}{insight?.iltMinutes == null ? "" : " h"}</dd></div><div><dt className="text-steam-4">Time exposure</dt><dd className="mt-1 font-mono">{insight ? fmtMoney(insight.avoidableCostUsd) : "Not available"}</dd></div></dl>
    <div className="rounded-chip border border-m-line bg-m-ink-2 p-4"><p className="mb-3 break-words text-xs text-steam-4">{sourceReference(event)}</p><blockquote className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed"><mark className={`text-inherit ${pill.className}`}>{event.evidence.snippet || "No verifiable source excerpt available."}</mark></blockquote></div>
    <p className="font-mono text-xs text-steam-4">{event.id} · {event.confidence.toLowerCase()} extraction confidence</p>
  </section>;
}
