import type { WellTelemetryReport } from "@/types/telemetry";
import { latestHoleDepth } from "./report-view";
export const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
export function KpiStrip({ report }: {
    report: WellTelemetryReport;
}) {
    const m = report.metrics;
    const depth = latestHoleDepth(report);
    const items = [
        { label: "Operating efficiency", value: m.efficiencyPct === null ? "Not available" : `${m.efficiencyPct.toFixed(1)}%`, foot: `${m.coveragePct.toFixed(0)}% day coverage`, color: "var(--brand)", detail: `Prototype formula: (productive − qualified ILT) / classified time. ${m.benchmarkCoveragePct.toFixed(0)}% of productive time supports a drilling benchmark; other ILT is unknown.` },
        { label: "Confirmed NPT", value: `${(m.nptMinutes / 60).toFixed(1)}h`, foot: `${usd(m.estimatedNptCostUsd)} scenario exposure`, color: "var(--npt)", detail: "Only intervals explicitly classified as unplanned downtime. Estimated exposure is not audited loss or proof that delay was avoidable." },
        { label: "Drilling ILT opportunity", value: m.iltEligibleMinutes ? `${(m.iltMinutes / 60).toFixed(1)}h` : "Not available", foot: m.iltEligibleMinutes ? `${usd(m.estimatedIltOpportunityUsd)} modeled opportunity` : "No comparable depth observations", color: "var(--ilt)", detail: `Selected benchmark: ${report.scenario.drillBenchmarkFtPerHour} ft/h. Formation dependent, illustrative and limited to eligible drilling intervals. Trip ILT is unknown.` },
        { label: "Latest hole depth", value: depth === null ? "Not available" : `${depth.toLocaleString("en-US")} ft`, foot: "Measured hole depth · not bit position", color: "var(--productive)", detail: "Latest available source observation. Missing and decreasing values are not silently replaced with inferred depth." },
        { label: "Excess CO₂ scenario", value: m.modeledExcessCo2Tons === null ? "Not available" : `${m.modeledExcessCo2Tons.toFixed(2)} t`, foot: m.modeledExcessFuelGallons === null ? "Fuel differential not configured" : `${m.modeledExcessFuelGallons.toFixed(0)} gal modeled excess fuel`, color: "var(--plan)", detail: `Counterfactual model, not measured emissions. Fuel differential ${report.scenario.excessFuelGallonsPerHour ?? "unknown"} gal/h; factor ${report.scenario.kgCo2PerGallon} kg CO₂/gal. Configure in Benchmarks.` }
    ];
    return <section aria-label="Report key metrics" className="card kpi-strip">{items.map(item => <article key={item.label} className="kpi-item"><p className="kpi-label"><span className="kpi-accent" style={{ background: item.color }}/>{item.label}</p><p className="kpi-value number" style={item.value === "Not available" ? { fontSize: 20 } : undefined}>{item.value}</p><p className="kpi-foot">{item.foot}</p><details className="caption" style={{ marginTop: 9 }}><summary>Definition & assumptions</summary><p>{item.detail}</p></details></article>)}</section>;
}
