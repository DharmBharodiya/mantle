import type { WellTelemetryReport } from "@/types/telemetry";
import { formatMinute } from "./report-view";
export function ActivityTimeline({ report, onSelect }: {
    report: WellTelemetryReport;
    onSelect: (id: string) => void;
}) {
    const colors = { PRODUCTIVE: "#2DD4BF", NPT: "#FB7185", UNKNOWN: "#8293AD" };
    return <section className="card panel"><div className="row between"><div><p className="eyebrow">The whole report day</p><h2 style={{ marginTop: 7 }}>Shift activity</h2></div><span className="caption">Select an interval to inspect its evidence</span></div><div className="timeline-track" aria-label="24-hour activity timeline">{report.events.map(event => <button key={event.id} className="timeline-event" style={{ left: `${event.startMinute / 1440 * 100}%`, width: `${(event.endMinute - event.startMinute) / 1440 * 100}%`, background: colors[event.classification] }} title={`${formatMinute(event.startMinute)}–${formatMinute(event.endMinute)} · ${event.classification} · ${event.activity}`} aria-label={`${event.id}: ${formatMinute(event.startMinute)} to ${formatMinute(event.endMinute)}, ${event.activity}, ${event.classification}`} onClick={() => onSelect(event.id)}/>)}</div><div className="timeline-labels">{[0, 4, 8, 12, 16, 20, 24].map(hour => <span key={hour}>{String(hour).padStart(2, "0")}:00</span>)}</div><div className="chart-legend">{Object.entries(colors).map(([label, color]) => <span key={label}><i className="color-dot" style={{ display: "inline-block", background: color, marginRight: 6 }}/>{label}</span>)}<span>Hatched gaps: unobserved</span></div></section>;
}
