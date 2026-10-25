"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { WellTelemetryReport } from "@/types/telemetry";
import { formatMinute } from "@/components/dashboard/report-view";
import { usd } from "@/components/dashboard/KpiStrip";
export function EventDrawer({ report, eventId, onClose }: {
    report: WellTelemetryReport;
    eventId: string;
    onClose: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const event = report.events.find(e => e.id === eventId);
    const insight = report.insights.find(i => i.eventId === eventId);
    useEffect(() => { const origin = document.activeElement as HTMLElement | null; const element = dialog.current; if (event && !element?.open)
        element?.showModal(); return () => { element?.close(); origin?.focus(); }; }, [event]);
    if (!event)
        return null;
    return <dialog ref={dialog} className="evidence-dialog" aria-labelledby="evidence-title" onCancel={onClose} onClick={e => { if (e.target === dialog.current)
        onClose(); }}><div className="drawer-content"><header><div><p className="eyebrow">Original evidence / {event.id}</p><h2 id="evidence-title" style={{ fontSize: 23, marginTop: 10, textTransform: "capitalize" }}>{event.activity.replaceAll("_", " ").toLowerCase()}</h2><p className="caption" style={{ marginTop: 9 }}>{formatMinute(event.startMinute)}–{formatMinute(event.endMinute)} · local report day</p></div><button className="icon-button" aria-label="Close source inspection" onClick={onClose}><X size={18}/></button></header><div className="row"><span className={`badge ${event.classification}`}>{event.classification}</span><span className="badge">{event.confidence} extraction confidence</span></div><h3 style={{ marginTop: 28 }}>Exact source excerpt</h3><blockquote className="source-quote">{event.evidence.snippet || "No verifiable source excerpt available."}</blockquote><p className="caption">{event.evidence.fileName}<br />{event.evidence.page === null ? "Page unavailable" : `Page ${event.evidence.page} · AI-extracted, verify original`}{event.evidence.row ? ` · Row ${event.evidence.row}` : ""}{event.evidence.sheet ? ` · Sheet ${event.evidence.sheet}` : ""}</p><h3 style={{ marginTop: 26 }}>Plain-language interpretation</h3><p style={{ fontSize: 13, lineHeight: 1.9, marginTop: 10, color: "var(--muted)" }}>{event.explanation || "No interpretation available."}</p><dl className="detail-grid"><div><dt>Hole depth start / end</dt><dd>{event.startHoleDepthFt ?? "Unknown"} / {event.endHoleDepthFt ?? "Unknown"} ft</dd></div><div><dt>Confirmed NPT</dt><dd>{insight?.nptMinutes ?? 0} minutes</dd></div><div><dt>Drilling ILT opportunity</dt><dd>{insight?.iltMinutes == null ? "Not available" : `${insight.iltMinutes.toFixed(1)} minutes`}</dd></div><div><dt>Scenario exposure</dt><dd>{usd(insight?.avoidableCostUsd ?? 0)}</dd></div></dl><div className="source-banner" style={{ marginTop: 28 }}><strong>Human review required.</strong><p>{report.sourceKind === "SYNTHETIC_DEMO" ? "This event is synthetic and illustrative. " : "This extraction is not independently verified. "}Financial values use the selected rig-rate scenario. This interpretation is not an equipment diagnosis or field instruction.</p></div></div></dialog>;
}
