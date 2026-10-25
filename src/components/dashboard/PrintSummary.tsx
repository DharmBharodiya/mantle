import type { WellTelemetryReport } from "@/types/telemetry";
import { fmtClock, fmtMoney, fmtNum } from "@/lib/mantle/report";
import { latestHoleDepth } from "./report-view";
import { bottleneckGroups } from "@/lib/analytics/compute";
import { sourceReference, operation } from "@/components/mantle/console/presentation";

/** Print-only report derived from the same selected analysis as the console. */
export function PrintSummary({ report, fileName }: { report: WellTelemetryReport; fileName?: string }) {
    const m = report.metrics;
    const sources = [...new Set(report.events.map(event => event.evidence.fileName))];
    const groups = bottleneckGroups(report);
    const hours = (minutes: number) => `${fmtNum(minutes / 60)} h`;
    const sourceStatus = report.sourceKind === "SYNTHETIC_DEMO" ? "SYNTHETIC DEMO — illustrative events, not actual field records."
        : report.sourceKind === "HUMAN_VERIFIED" ? "Human-reviewed source." : "Uploaded source — UNVERIFIED; check the original evidence.";

    return <section className="print-summary" aria-label="Selected analysis printable report">
        <header>
            <p>Mantle / Drilling analysis report</p>
            <p className="print-title">{report.wellName || "Well name unavailable"}</p>
            <p>Report day: {report.reportDate || "Date unavailable"}</p>
            {fileName && <p>Selected analysis: {fileName}</p>}
            <p>Source files: {sources.length ? sources.join(", ") : "No source files available"}</p>
            <p>Analysis generated: {report.generatedAt} · {report.events.length} events</p>
        </header>
        <div className="print-warning">{sourceStatus} Financial exposure, ILT, fuel and CO₂ are scenario estimates, not audited losses or measured emissions. Flat hole depth alone does not prove downtime. Hole measured depth is not drill-bit position. Human review is required; this report provides no equipment diagnosis or field instruction.</div>
        <h2>Operational overview</h2>
        <div className="print-stats">
            <p><b>{m.efficiencyPct === null ? "Not available" : `${fmtNum(m.efficiencyPct)}%`}</b>Benchmark-adjusted efficiency</p>
            <p><b>{hours(m.nptMinutes)}</b>Confirmed NPT</p>
            <p><b>{m.iltEligibleMinutes ? hours(m.iltMinutes) : "Not available"}</b>Drilling ILT opportunity</p>
            <p><b>{fmtMoney(m.estimatedLossUsd)}</b>Modeled time exposure</p>
            <p><b>{latestHoleDepth(report) === null ? "Not available" : `${fmtNum(latestHoleDepth(report), 0)} ft`}</b>Latest observed hole depth</p>
            <p><b>{m.modeledExcessCo2Tons === null ? "Not available" : `${fmtNum(m.modeledExcessCo2Tons, 2)} t`}</b>Excess CO₂ scenario</p>
        </div>
        <table><caption>Time coverage and scenario breakdown</caption><tbody>
            {[
                ["Observed time", hours(m.observedMinutes)], ["Productive time", hours(m.productiveMinutes)],
                ["Classified time", hours(m.classifiedMinutes)], ["Unknown classification", hours(m.unknownMinutes)],
                ["Unobserved time", hours(m.unobservedMinutes)], ["Report-day coverage", `${fmtNum(m.coveragePct)}%`],
                ["Benchmark coverage of productive time", `${fmtNum(m.benchmarkCoveragePct)}%`],
                ["NPT scenario exposure", fmtMoney(m.estimatedNptCostUsd)], ["ILT scenario opportunity", fmtMoney(m.estimatedIltOpportunityUsd)],
                ["Modeled excess fuel", m.modeledExcessFuelGallons === null ? "Not available" : `${fmtNum(m.modeledExcessFuelGallons)} gal`],
            ].map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}
        </tbody></table>
        <h2>Scenario assumptions and calculation basis</h2>
        <p>Rig day rate: {fmtMoney(report.scenario.rigDailyUsd)}/day. Drilling benchmark: {report.scenario.drillBenchmarkFtPerHour} ft/h. Incremental excess fuel: {report.scenario.excessFuelGallonsPerHour === null ? "Unknown (not configured)" : `${report.scenario.excessFuelGallonsPerHour} gal/h`}. Carbon factor: {report.scenario.kgCo2PerGallon} kg CO₂/gal.</p>
        <p>Efficiency = (productive time − eligible drilling ILT) / classified time; unknown classification is excluded. NPT comes from report classifications. Drilling ILT compares supported productive drilling intervals with the selected benchmark. Time exposure uses (NPT + eligible ILT) × rig day rate / 24 hours. Fuel and carbon require an explicit incremental fuel assumption. Trip ILT is unavailable without bit/string movement observations. Benchmarks depend on the well section and formation.</p>
        <h2>Ranked time exposure</h2>
        {groups.length ? <table><thead><tr><th scope="col">Activity</th><th scope="col">Time</th><th scope="col">Scenario exposure</th><th scope="col">Events</th></tr></thead><tbody>{groups.map(group => <tr key={group.label}><td>{group.label}</td><td>{hours(group.minutes)}</td><td>{fmtMoney(group.costUsd)}</td><td>{group.eventIds.join(", ")}</td></tr>)}</tbody></table> : <p>No supported NPT or drilling ILT intervals were identified.</p>}
        <h2>Complete activity timeline</h2>
        {report.events.length ? <table className="print-events"><thead><tr><th scope="col">Event / time</th><th scope="col">Activity / class</th><th scope="col">Hole depth (ft)</th><th scope="col">NPT / ILT</th><th scope="col">Scenario exposure</th></tr></thead><tbody>{report.events.map(event => {
            const insight = report.insights.find(item => item.eventId === event.id);
            return <tr key={event.id}><td>{event.id}<br/>{fmtClock(event.startMinute / 60)}–{fmtClock(event.endMinute / 60)}<br/>{hours(event.endMinute - event.startMinute)}</td><td>{operation(event)}<br/>{event.classification}</td><td>{fmtNum(event.startHoleDepthFt, 0)} → {fmtNum(event.endHoleDepthFt, 0)}</td><td>{insight ? hours(insight.nptMinutes) : "Not available"} / {insight?.iltMinutes == null ? "Not available" : hours(insight.iltMinutes)}</td><td>{insight ? fmtMoney(insight.avoidableCostUsd) : "Not available"}</td></tr>;
        })}</tbody></table> : <p>No extracted events are available in this analysis.</p>}
        <h2>Event evidence and interpretations</h2>
        {report.events.map(event => <article className="print-evidence" key={event.id}>
            <h3>{event.id} · {fmtClock(event.startMinute / 60)}–{fmtClock(event.endMinute / 60)} · {operation(event)}</h3>
            <p>{sourceReference(event)} · {event.confidence.toLowerCase()} extraction confidence</p>
            <blockquote>{event.evidence.snippet || "No verifiable source excerpt available."}</blockquote>
            {event.note && <p><strong>Recorded note: </strong>{event.note}</p>}
            <p><strong>Interpretation: </strong>{event.explanation || "No interpretation available."}</p>
        </article>)}
        <h2>Source warnings and review notes</h2>
        {report.warnings.length ? <ul>{report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul> : <p>No additional source warnings were recorded.</p>}
        <p className="print-end">End of report · Mantle · {report.reportDate || "Undated report"}</p>
    </section>;
}
