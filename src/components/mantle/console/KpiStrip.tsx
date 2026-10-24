import type { WellTelemetryReport } from "@/types/telemetry";
import { fmtNum, fmtMoney } from "@/lib/mantle/report";
import { latestHoleDepth } from "@/components/dashboard/report-view";
import { IconInfo } from "../Icons";

/** Kit's continuous instrument strip; values are already computed on the server. */
export function KpiStrip({report}:{report:WellTelemetryReport}) {
  const m=report.metrics;
  const cells=[
    {label:"Operating efficiency",value:fmtNum(m.efficiencyPct),unit:m.efficiencyPct===null?"":"%",meta:`${fmtNum(m.coveragePct)}% day coverage`,formula:"(Productive minutes − qualified drilling ILT) / classified minutes. Unknown time is excluded."},
    {label:"Confirmed NPT",value:fmtNum(m.nptMinutes/60),unit:" h",meta:fmtMoney(m.estimatedNptCostUsd),formula:"Only time explicitly classified NPT in the report; multiplied by the rig-rate assumption for cost."},
    {label:"Drilling ILT",value:fmtNum(m.iltEligibleMinutes?m.iltMinutes/60:null),unit:m.iltEligibleMinutes?" h":"",meta:`Against ${report.scenario.drillBenchmarkFtPerHour} ft/h`,formula:"Eligible drilling duration less footage / selected benchmark. Trip ILT remains unknown."},
    {label:"Hole depth",value:fmtNum(latestHoleDepth(report),0),unit:latestHoleDepth(report)===null?"":" ft",meta:"Latest observed measured depth",formula:"Last available hole measured depth, not drill-bit position."},
    {label:"Excess CO₂",value:fmtNum(m.modeledExcessCo2Tons),unit:m.modeledExcessCo2Tons===null?"":" t",meta:m.modeledExcessFuelGallons===null?"Fuel differential not configured":`${fmtNum(m.modeledExcessFuelGallons,0)} gal modeled fuel`,formula:"(NPT + qualified ILT) × incremental fuel × carbon factor. Unknown fuel leaves carbon unavailable."},
  ];
  return <section className="m-kpi-strip" aria-label="Report key metrics">{cells.map(c=><article key={c.label}><div className="flex items-center justify-between gap-2 text-sm text-steam-4"><span>{c.label}</span><details className="m-formula"><summary aria-label={`Definition of ${c.label}`}><IconInfo/></summary><p>{c.formula}</p></details></div><p className={`mt-2 font-medium tracking-tight ${c.value==="Not available"?"text-xl":"text-3xl"}`}>{c.value}<span className="text-base text-steam-4">{c.unit}</span></p><p className="mt-3 font-mono text-xs text-steam-4">{c.meta}</p></article>)}</section>;
}
