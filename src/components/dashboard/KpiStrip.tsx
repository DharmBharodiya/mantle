import type { WellTelemetryReport } from "@/types/telemetry";
import { latestHoleDepth } from "./report-view";
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export function KpiStrip({ report }: { report: WellTelemetryReport }) {
  const m = report.metrics;
  const depth = latestHoleDepth(report);
  const items = [
    { label: "Operational efficiency", value: m.efficiencyPct === null ? "—" : `${m.efficiencyPct.toFixed(1)}%`, foot: "Prototype definition · adjusted for ILT", detail: "Productive minutes less drilling ILT, divided by classified minutes. Unknown time is excluded.", accent: "#5559F7" },
    { label: "Confirmed NPT", value: `${(m.nptMinutes / 60).toFixed(1)}h`, foot: `${usd(m.estimatedNptCostUsd)} rig-rate scenario`, detail: `Only explicitly classified NPT. Assumed rig rate: ${usd(report.scenario.rigDailyUsd)}/day.`, accent: "#E9736B" },
    { label: "Drilling ILT opportunity", value: `${(m.iltMinutes / 60).toFixed(1)}h`, foot: `${usd(m.estimatedIltOpportunityUsd)} modeled opportunity`, detail: `Illustrative drilling benchmark: ${report.scenario.drillBenchmarkFtPerHour} ft/h. Formation dependent; not proven avoidable loss.`, accent: "#E7A344" },
    { label: "Excess CO₂ scenario", value: m.modeledExcessCo2Tons === null ? "—" : `${m.modeledExcessCo2Tons.toFixed(2)}t`, foot: m.modeledExcessFuelGallons === null ? "Fuel differential not configured" : `${m.modeledExcessFuelGallons.toFixed(0)} gal modeled excess fuel`, detail: report.scenario.excessFuelGallonsPerHour === null ? "Provide a fuel differential assumption to model emissions. Unknown is not zero." : `Assumed differential: ${report.scenario.excessFuelGallonsPerHour} gal/h. Counterfactual model, not measured emissions.`, accent: "#27A982" },
    { label: "Latest hole depth", value: depth === null ? "—" : depth.toLocaleString("en-US"), foot: "Feet · hole measured depth", detail: depth === null ? "No hole depth observations available." : "Latest available reported hole depth; this is not drill-bit position.", accent: "#8294B3" },
  ];
  return <section aria-label="Key metrics" className="card kpi-strip">
    {items.map(item => <div key={item.label} className="kpi-item"><div className="border-l-[3px] pl-3" style={{ borderColor: item.accent }}>
      <p className="mb-3 text-[11px] font-medium text-[#626D7E]">{item.label}</p><p className="number text-[30px] font-semibold leading-none tracking-[-.05em]">{item.value}</p><p className="mt-3 text-[11px] leading-5 text-[#687486]">{item.foot}</p>
      <details className="mt-2 text-[11px] text-[#626D7E]"><summary>Definition</summary><p className="mt-2 leading-5">{item.detail}</p></details>
    </div></div>)}
  </section>;
}
