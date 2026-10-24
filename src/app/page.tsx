"use client";
import {useRef,useState} from "react";
import {ArrowDownToLine,Bell,ChevronDown,CloudUpload,FileCheck2,RefreshCcw,SlidersHorizontal} from "lucide-react";
import type {WellTelemetryReport} from "@/types/telemetry";
import {DEMO_REPORT} from "@/data/demo-report";
import {Sidebar} from "@/components/dashboard/Sidebar";
import {KpiStrip} from "@/components/dashboard/KpiStrip";
import {DepthChart} from "@/components/dashboard/DepthChart";
import {RigHealth} from "@/components/dashboard/RigHealth";
import {Bottlenecks} from "@/components/analytics/Bottlenecks";
import {EventTable} from "@/components/analytics/EventTable";
import {ShiftBriefing} from "@/components/comms/ShiftBriefing";

export default function Home() {
 const [report,setReport]=useState<WellTelemetryReport>(DEMO_REPORT);
 const [active,setActive]=useState("Overview");const [uploading,setUploading]=useState(false);const [error,setError]=useState("");
 const fileInput=useRef<HTMLInputElement>(null);
 async function upload(file:File){setUploading(true);setError("");try{const data=new FormData();data.append("file",file);const response=await fetch("/api/ingest",{method:"POST",body:data});const result=await response.json();if(!response.ok) throw new Error(result.error??"File extraction failed");setReport(result);setActive("Overview");}catch(e){setError(e instanceof Error?e.message:"Upload failed");}finally{setUploading(false);if(fileInput.current)fileInput.current.value="";}}
 function navigate(label:string){setActive(label);if(label==="Shift events") document.getElementById("shift-log")?.scrollIntoView({behavior:"smooth"});else if(label==="Benchmarks")document.getElementById("bottlenecks")?.scrollIntoView({behavior:"smooth"});else if(label==="Field dispatch")document.getElementById("comms")?.scrollIntoView({behavior:"smooth"});}
 const synthetic=report.sourceKind==="SYNTHETIC_DEMO";
 return <div className="mx-auto max-w-[1600px] px-3 py-3 md:px-5 md:py-6"><div className="flex flex-col gap-5 lg:flex-row"><Sidebar active={active} onNavigate={navigate}/>
 <main className="min-w-0 flex-1 space-y-5">
  <header className="flex flex-wrap items-center justify-between gap-4 px-1 py-2"><div><p className="micro mb-2">Operations / Overview</p><h1 className="text-[28px] font-semibold tracking-[-.065em] md:text-[35px]">Drilling intelligence<span className="text-orange">.</span></h1><p className="mt-1 text-[12px] text-[#919BA8]">From raw field reports to operational clarity.</p></div><div className="flex items-center gap-2"><div className="hidden rounded-full border border-line bg-white px-4 py-2 text-[12px] text-[#7B8593] md:flex"><span className="mr-2 h-2 w-2 self-center rounded-full bg-[#21A783]"/>Prototype environment</div><button className="rounded-full border border-line bg-white p-3 text-[#7D8795]" aria-label="Notifications"><Bell size={16}/></button><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECEFFD] text-xs font-bold text-[#5559F7]">BS</div></div></header>
  <div className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex min-w-0 items-center gap-2"><span className="rounded-full bg-[#F4F5F7] px-3 py-2 text-xs font-medium text-[#555F70]">Active well</span><span className="max-w-[300px] truncate text-[12px] font-semibold">{report.wellName}</span><ChevronDown size={14} className="text-[#9DA5B0]"/></div><div className="flex flex-wrap items-center gap-2"><button onClick={()=>{setReport(DEMO_REPORT);setError("");}} className="focus-ring flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-medium hover:bg-[#FAFBFC]"><RefreshCcw size={14}/> Reset demo</button><input ref={fileInput} type="file" accept=".pdf,.csv,.xlsx,.txt" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);}}/><button disabled={uploading} onClick={()=>fileInput.current?.click()} className="focus-ring flex items-center gap-2 rounded-full bg-[#5559F7] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#474BDE]"><CloudUpload size={16}/> {uploading?"Analyzing...":"Upload drilling report"}</button></div></div>
  <div role="status" className={`rounded-[13px] px-4 py-3 text-[11px] ${synthetic?"bg-[#FFF5EB] text-[#A06726]":"bg-[#EEF5FD] text-[#42658A]"}`}>{synthetic?"SYNTHETIC DEMO DATA — All events and the sample pump failure are illustrative; not real Utah FORGE records.":"AI extraction from uploaded document — UNVERIFIED until a human checks source evidence."} Financial and carbon figures depend on editable scenario assumptions.</div>
  {error&&<div role="alert" className="rounded-xl border border-[#F8C9C6] bg-[#FFF4F3] p-3 text-xs text-[#B94D45]">{error}</div>}
  <KpiStrip report={report}/>
  <div className="grid gap-5 xl:grid-cols-12"><div className="xl:col-span-8"><DepthChart report={report}/></div><div className="xl:col-span-4"><RigHealth report={report}/></div></div>
  <div className="grid gap-5 xl:grid-cols-12"><div className="space-y-5 xl:col-span-8"><div id="bottlenecks"><Bottlenecks report={report}/></div><div id="shift-log"><EventTable report={report}/></div></div><div id="comms" className="xl:col-span-4"><ShiftBriefing report={report}/></div></div>
  <footer className="px-2 py-3 text-center text-[10px] text-[#A0A9B5]">BoreSight · Hackathon prototype · Not for automated drilling or safety-critical decisions · Data and estimates require human review.</footer>
 </main></div></div>;
}
