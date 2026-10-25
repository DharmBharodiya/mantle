import { bottleneckGroups } from "@/lib/analytics/compute";
import type { WellTelemetryReport } from "@/types/telemetry";
import { usd } from "@/components/dashboard/KpiStrip";
export function Bottlenecks({ report, onSelect }: {
    report: WellTelemetryReport;
    onSelect?: (id: string) => void;
}) {
    const groups = bottleneckGroups(report);
    const max = Math.max(1, ...groups.map(group => group.minutes));
    return <section className="card panel"><div className="panel-head"><div><p className="eyebrow">Where time accumulates</p><h2>Operational opportunities</h2><p className="caption">Ranked evidence-based NPT and benchmarked drilling ILT</p></div><span className="badge">Scenario estimates</span></div>{groups.length ? groups.map(group => <div key={group.label} className="bottleneck"><div className="bottleneck-head"><button className="ghost-button" style={{ padding: 0, minHeight: 24, fontWeight: 500, textAlign: "left", whiteSpace: "normal", color: "var(--text)" }} disabled={!onSelect} onClick={() => onSelect?.(group.eventIds[0])}>{group.label}</button><span className="number">{(group.minutes / 60).toFixed(1)}h · {usd(group.costUsd)}</span></div><div className="track"><div className="track-fill" style={{ width: `${group.minutes / max * 100}%`, background: group.category === "NPT" ? "linear-gradient(90deg,#bd4e77,#FB7185)" : "linear-gradient(90deg,#bc8b24,#FBBF24)" }}/></div></div>) : <div className="empty-state"><h3>No confirmed time exposure</h3><p>No classified NPT or comparable drilling slowdown was found. Missing ILT remains unknown.</p></div>}<p className="caption panel-divider">NPT follows source classification. ILT is a formation-dependent scenario opportunity, not proven avoidable loss. Select a category for its first source event.</p></section>;
}
