import type {WellTelemetryReport} from "@/types/telemetry";
const usd=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
export function KpiStrip({report}:{report:WellTelemetryReport}) {
  const m=report.metrics;
  const items=[
    {label:"Operational efficiency",value:m.efficiencyPct===null?"N/A":`${m.efficiencyPct.toFixed(1)}%`,foot:"classified time adjusted for ILT",accent:"#5559F7"},
    {label:"Unplanned downtime",value:`${(m.nptMinutes/60).toFixed(1)}h`,foot:`${usd(m.estimatedNptCostUsd)} scenario cost`,accent:"#E76D69"},
    {label:"Invisible lost time",value:`${(m.iltMinutes/60).toFixed(1)}h`,foot:`${usd(m.estimatedIltOpportunityUsd)} opportunity`,accent:"#D69A2D"},
    {label:"Cost exposure",value:usd(m.estimatedLossUsd),foot:"assumption-based • not audited",accent:"#21A783"},
    {label:"Emissions scenario",value:m.modeledExcessCo2Tons===null?"N/A":`${m.modeledExcessCo2Tons.toFixed(2)}t`,foot:"model only • not measured",accent:"#81A6D8"}
  ];
  return <section aria-label="Key metrics" className="card grid grid-cols-2 divide-y divide-[#F1F2F5] overflow-hidden xl:grid-cols-5 xl:divide-y-0">
    {items.map((x,i)=><div key={x.label} className={`px-5 py-5 ${i>0?"xl:border-l xl:border-[#EFF1F4]":""}`}>
      <div className="border-l-[3px] pl-3" style={{borderColor:x.accent}}><p className="mb-3 text-[11px] font-medium text-[#7A8595]">{x.label}</p><p className="number text-[24px] font-semibold leading-none tracking-[-.06em] text-[#181E2B]">{x.value}</p><p className="mt-3 text-[10px] text-[#9BA4AF]">{x.foot}</p></div>
    </div>)}
  </section>;
}
