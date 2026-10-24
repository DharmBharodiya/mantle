"use client";
import {useEffect,useState} from "react";
import {AudioLines,MessageSquareText,Play,Volume2} from "lucide-react";
import type {WellTelemetryReport} from "@/types/telemetry";
function payload(r:WellTelemetryReport){return {extraction:{wellName:r.wellName,reportDate:r.reportDate,events:r.events,warnings:r.warnings},scenario:r.scenario,sourceKind:r.sourceKind};}
export function ShiftBriefing({report}:{report:WellTelemetryReport}) {
 const [script,setScript]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [audio,setAudio]=useState("");
 useEffect(()=>{setAudio("");setError("");fetch("/api/briefing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload(report),mode:"script"})}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error??"Briefing unavailable");return body;}).then(r=>setScript(r.script??"")).catch(()=>setScript("Briefing preview unavailable."));},[report]);
 useEffect(()=>{return ()=>{if(audio) URL.revokeObjectURL(audio)};},[audio]);
 async function play(){setBusy(true);setError("");try{const res=await fetch("/api/briefing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload(report),mode:"audio"})});if(!res.ok){const j=await res.json();throw new Error(j.error??"Audio generation failed");}setAudio(URL.createObjectURL(await res.blob()));}catch(e){setError(e instanceof Error?e.message:"Audio unavailable");}finally{setBusy(false);}}
 return <section className="card px-6 py-6"><div className="flex items-center justify-between"><div><div className="micro mb-2">Field communications</div><h2 className="text-[17px] font-semibold tracking-[-.04em]">Shift handover</h2></div><div className="rounded-[12px] bg-[#F2F1FF] p-3 text-[#5559F7]"><AudioLines size={20}/></div></div>
   <div className="mt-6 rounded-[18px] bg-[#F6F6FE] p-5"><div className="flex items-center justify-between"><div><p className="text-[13px] font-semibold">Morning operations brief</p><p className="mt-1 text-[11px] text-[#9299AA]">AI-scripted · human review recommended</p></div><span className="rounded-full bg-white p-2 text-[#6B6ED9]"><Volume2 size={17}/></span></div>
   <div className="mt-5 flex h-8 items-end gap-[3px]">{[12,19,25,16,28,18,30,16,22,11,26,17,23,14,29,18,12,21,16,25,12,20,11,15].map((h,i)=><div key={i} className="w-[4px] flex-1 rounded-full bg-[#9296ED]" style={{height:h}}/>)}</div>
   <button onClick={play} disabled={busy} className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#5559F7] px-4 py-3 text-xs font-semibold text-white hover:bg-[#4145CC]"><Play size={15} fill="currentColor"/> {busy?"Generating audio...":"Generate with ElevenLabs"}</button>
   {audio&&<audio controls src={audio} className="mt-3 w-full"/>}{error&&<p role="alert" className="mt-2 text-[11px] text-red">{error}</p>}</div>
   <p className="micro mb-3 mt-6">Transcript preview</p><p className="max-h-32 overflow-auto text-[12px] leading-6 text-[#77818F]">{script||"Preparing operations summary..."}</p>
   <div className="mt-6 border-t border-line pt-5"><div className="mb-3 flex items-center gap-2 text-[12px] font-semibold"><MessageSquareText size={15} className="text-[#8089A0]"/> Photon field dispatch</div><p className="text-[11px] leading-5 text-[#949DAC]">Photon 2.0 messaging is configured separately with a verified agent sender and an existing conversation. Live dispatch is off by default.</p><button className="mt-4 w-full rounded-full border border-line px-4 py-3 text-xs font-semibold text-[#828A99]" disabled title="Configure Photon Beta 2.0 credentials and conversation before enabling">Connect Photon to dispatch</button></div>
 </section>;
}
