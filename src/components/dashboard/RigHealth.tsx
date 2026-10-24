import type {WellTelemetryReport} from "@/types/telemetry";
import {Gauge} from "lucide-react";
export function RigHealth({report}:{report:WellTelemetryReport}) {
  const val=report.metrics.efficiencyPct;
  return <section className="card flex flex-col px-6 py-6"><div className="mb-3 flex items-center justify-between"><div><p className="micro mb-2">Today at a glance</p><h2 className="text-[17px] font-semibold tracking-[-.04em]">Rig efficiency</h2></div><Gauge size={18} className="text-[#9098A6]"/></div>
    <div className="relative mx-auto mt-5 flex h-[162px] w-[162px] items-center justify-center rounded-full" style={{background:`conic-gradient(#5559F7 0 ${val??0}%,#EFF1F6 ${val??0}% 100%)`}}><div className="flex h-[138px] w-[138px] flex-col items-center justify-center rounded-full bg-white"><span className="number text-[37px] font-semibold tracking-[-.07em]">{val===null?"—":`${Math.round(val)}%`}</span><span className="micro">Efficiency</span></div></div>
    <div className="mt-auto space-y-3 pt-6 text-xs"><div className="flex justify-between"><span className="text-[#929BA8]">Classified productive</span><b className="number font-medium">{(report.metrics.productiveMinutes/60).toFixed(1)}h</b></div><div className="flex justify-between"><span className="text-[#929BA8]">Non-productive</span><b className="number font-medium">{(report.metrics.nptMinutes/60).toFixed(1)}h</b></div><div className="flex justify-between"><span className="text-[#929BA8]">Coverage</span><b className="number font-medium">{report.metrics.observedMinutes?Math.round(report.metrics.classifiedMinutes/report.metrics.observedMinutes*100):0}%</b></div></div>
  </section>;
}
