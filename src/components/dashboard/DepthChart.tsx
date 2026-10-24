"use client";
import type {WellTelemetryReport} from "@/types/telemetry";
import {CartesianGrid,Line,LineChart,ReferenceArea,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {ArrowUpRight} from "lucide-react";
export function DepthChart({report}:{report:WellTelemetryReport}) {
  const data=report.depthCurve.map(p=>({...p,hour:Math.round(p.minute/60*100)/100}));
  const min=data.length?Math.min(...data.map(p=>p.holeDepthFt)):0, max=data.length?Math.max(...data.map(p=>p.holeDepthFt)):1;
  return <section className="card min-w-0 px-5 py-6 md:px-7">
    <div className="mb-4 flex items-start justify-between gap-3"><div><div className="micro mb-2">Drilling performance</div><h2 className="text-[18px] font-semibold tracking-[-.045em]">Borehole depth over time</h2><p className="mt-1 text-xs text-[#8A93A1]">Measured hole depth (ft) · elapsed hours</p></div><span className="rounded-full border border-line p-2 text-[#717C8C]"><ArrowUpRight size={15}/></span></div>
    <div className="h-[310px] w-full" aria-label="Interactive hole-depth-versus-time chart">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:12,right:20,left:2,bottom:12}}>
        <CartesianGrid stroke="#F0F2F5" strokeDasharray="3 5" vertical={false}/>
        <XAxis dataKey="hour" type="number" domain={[0,24]} allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#8993A3"}} tickFormatter={(v:number)=>`${v}h`} />
        <YAxis type="number" domain={[Math.floor(min/100)*100,Math.ceil(max/100)*100]} reversed tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#8993A3"}} width={58} tickFormatter={(v:number)=>v.toLocaleString("en-US")}/>
        {report.events.filter(e=>e.classification==="NPT").map(e=><ReferenceArea key={e.id} x1={e.startMinute/60} x2={e.endMinute/60} fill="#FDEBE8" fillOpacity={0.45} strokeOpacity={0}/>) }
        <Tooltip contentStyle={{border:"1px solid #E8EBEF",borderRadius:14,boxShadow:"0 12px 30px rgba(20,30,60,.08)",fontSize:12}} formatter={(n)=>[`${Number(n).toLocaleString()} ft`,"Hole depth"]} labelFormatter={(n)=>`Hour ${n}`} />
        <Line dataKey="holeDepthFt" type="linear" stroke="#5559F7" strokeWidth={3} dot={false} activeDot={{r:5,stroke:"white",strokeWidth:2}} isAnimationActive={false}/>
      </LineChart></ResponsiveContainer>
    </div>
    <div className="mt-1 flex flex-wrap items-center gap-5 border-t border-line pt-4 text-[11px] text-[#7E8795]"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#5559F7]"/>Observed depth</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#F3C2B8]"/>Confirmed NPT window</span><span className="ml-auto text-[10px]">Flat depth alone does not mean downtime</span></div>
  </section>;
}
