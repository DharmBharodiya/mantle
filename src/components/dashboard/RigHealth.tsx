import type { WellTelemetryReport } from "@/types/telemetry";
export function RigHealth({ report }: {
    report: WellTelemetryReport;
}) {
    const m = report.metrics;
    const productive = m.classifiedMinutes ? m.productiveMinutes / m.classifiedMinutes * 100 : null;
    const p = m.observedMinutes ? m.productiveMinutes / m.observedMinutes * 100 : 0;
    const n = m.observedMinutes ? (m.productiveMinutes + m.nptMinutes) / m.observedMinutes * 100 : 0;
    const rows = [{ label: "Productive", minutes: m.productiveMinutes, color: "var(--productive)" }, { label: "Confirmed NPT", minutes: m.nptMinutes, color: "var(--npt)" }, { label: "Unknown", minutes: m.unknownMinutes, color: "#8293AD" }];
    return <section className="card panel" style={{ height: "100%" }}><div className="panel-head"><div><p className="eyebrow">Time, accounted for</p><h2>Operational time mix</h2></div><span className="badge">24h report day</span></div><div className="ring" role="img" aria-label={`${m.productiveMinutes} productive, ${m.nptMinutes} NPT and ${m.unknownMinutes} unknown minutes. ${m.unobservedMinutes} minutes unobserved.`} style={{ background: m.observedMinutes ? `conic-gradient(#2DD4BF 0 ${p}%,#FB7185 ${p}% ${n}%,#8293AD ${n}% 100%)` : "#263349" }}><div className="ring-inner"><b className="number">{productive === null ? "—" : `${productive.toFixed(1)}%`}</b><span>Classified productive</span></div></div><dl className="time-legend">{rows.map(row => <div key={row.label}><dt><span className="color-dot" style={{ background: row.color }}/>{row.label}</dt><dd className="number">{(row.minutes / 60).toFixed(1)}h</dd></div>)}</dl><div className="panel-divider caption"><p>{m.coveragePct.toFixed(1)}% of day observed · {(m.unobservedMinutes / 60).toFixed(1)}h unobserved.</p>{(m.unobservedMinutes > 0 || m.unknownMinutes > 0) && <p style={{ color: "#F3CE7E", marginTop: 8 }}>Incomplete coverage. Missing time is not assumed productive.</p>}<p style={{ marginTop: 8 }}>Time mix does not establish equipment health or safety.</p></div></section>;
}
