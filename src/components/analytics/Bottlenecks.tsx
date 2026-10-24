import type {WellTelemetryReport} from "@/types/telemetry";
export function Bottlenecks({report}:{report:WellTelemetryReport}) {
  const groups=new Map<string,{minutes:number;color:string;type:"NPT"|"ILT"}>();
  for (const e of report.events) {
    const insight=report.insights.find(i=>i.eventId===e.id);
    if(!insight) continue;
    if(insight.nptMinutes>0) {
      const key=e.activity.replaceAll("_"," ").toLowerCase();
      const old=groups.get(key);groups.set(key,{minutes:(old?.minutes??0)+insight.nptMinutes,color:"#E9736B",type:"NPT"});
    }
    if((insight.iltMinutes??0)>0){const old=groups.get("slow drilling (ILT)");groups.set("slow drilling (ILT)",{minutes:(old?.minutes??0)+(insight.iltMinutes??0),color:"#E7A344",type:"ILT"});}
  }
  const sorted=[...groups].sort((a,b)=>a[1].type===b[1].type?b[1].minutes-a[1].minutes:a[1].type==="NPT"?-1:1);
  const max=Math.max(1,...sorted.map(x=>x[1].minutes));
  const hourlyRate=report.scenario.rigDailyUsd/24;
  return <section className="card px-6 py-6"><p className="micro mb-2">Root-cause overview</p><h2 className="text-[17px] font-semibold tracking-[-.04em]">Operational bottlenecks</h2><p className="mt-1 text-xs text-[#9BA4AF]">Time exposure by category</p>
    <div className="mt-7 space-y-6">{sorted.length?sorted.slice(0,4).map(([name,data])=><div key={name}>
      <div className="mb-2 flex items-baseline justify-between gap-3"><span className="text-[12px] font-medium capitalize">{name} <span className="text-[10px] text-[#8993A3]">· {data.type}</span></span><span className="number text-right text-[11px] text-[#8792A0]">{(data.minutes/60).toFixed(1)}h · ${(data.minutes/60*hourlyRate).toLocaleString("en-US",{maximumFractionDigits:0})}</span></div>
      <div className="h-[9px] overflow-hidden rounded-full bg-[#EFF1F5]" role="img" aria-label={`${name}: ${(data.minutes/60).toFixed(1)} hours ${data.type}`}><div className="h-full rounded-full" style={{width:`${data.minutes/max*100}%`,backgroundColor:data.color}} /></div>
    </div>):<p className="text-xs text-[#8993A3]">No downtime or benchmark-based slowdowns identified.</p>}</div>
    <p className="mt-6 border-t border-line pt-4 text-[10px] leading-relaxed text-[#9AA2AE]">ILT is computed only for comparable drilling intervals. Other activities require context-specific benchmarks.</p>
  </section>;
}
