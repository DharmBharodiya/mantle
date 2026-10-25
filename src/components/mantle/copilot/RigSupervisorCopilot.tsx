"use client";
import {useEffect,useRef,useState} from "react";
import type { SavedReport } from "@/components/dashboard/ReportsPanel";
import type { CopilotRequest, CopilotResponse } from "@/types/copilot";
import { askCopilot } from "@/lib/copilot/client";
import { CopilotAnswer } from "./CopilotAnswer";
type Turn={id:number;question:string;answer?:CopilotResponse;error?:string};
export function RigSupervisorCopilot({reports,activeReportId,visible,onInspect}:{reports:SavedReport[];activeReportId:string;visible:boolean;onInspect:(reportId:string,eventId:string)=>void}){
 const [selected,setSelected]=useState<string[]>([activeReportId]);
 const [well,setWell]=useState('');const [question,setQuestion]=useState('');const [turns,setTurns]=useState<Turn[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const request=useRef<AbortController|null>(null);const counter=useRef(0);const input=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 useEffect(()=>{if(!visible){request.current?.abort();request.current=null;setBusy(false);}},[visible]);
 function clear(){request.current?.abort();request.current=null;setBusy(false);setTurns([]);setError('');}
 function scope(ids:string[]){clear();setSelected(ids);}
 function cancel(){request.current?.abort();request.current=null;setBusy(false);setError('Question cancelled. Your reports are unchanged.');}
 async function ask(text:string){
  if(busy)return;const chosen=reports.filter(r=>selected.includes(r.id));if(!text.trim()||!chosen.length){setError('Enter a question and select at least one report.');input.current?.focus();return;}
  const controller=new AbortController();request.current=controller;const id=++counter.current;setBusy(true);setError('');setQuestion('');setTurns(previous=>[...previous.slice(-11),{id,question:text.trim()}]);const timer=setTimeout(()=>controller.abort(),45000);
  const history:CopilotRequest['history']=turns.filter(turn=>turn.answer).slice(-6).map(turn=>({question:turn.question,focus:turn.answer!.focus}));
  try {
   const answer=await askCopilot({question:text.trim(),reports:chosen.map(r=>({id:r.id,extraction:{wellName:r.report.wellName,reportDate:r.report.reportDate,events:r.report.events,warnings:r.report.warnings},scenario:r.report.scenario,sourceKind:r.report.sourceKind})),history},controller.signal);
   if(request.current!==controller||controller.signal.aborted)return;
   setTurns(previous=>previous.map(turn=>turn.id===id?{...turn,answer}:turn));
  }catch(cause){if(request.current===controller){const message=controller.signal.aborted?'The question timed out or was cancelled. Your reports are unchanged.':cause instanceof Error?cause.message:'Copilot could not answer.';setTurns(previous=>previous.map(turn=>turn.id===id?{...turn,error:message}:turn));setError(message);}}
  finally{clearTimeout(timer);if(request.current===controller){request.current=null;setBusy(false);}}
 }
 const wells=[...new Set(reports.map(r=>r.report.wellName))];const shown=reports.filter(r=>!well||'well:'+r.report.wellName===well);const chosen=reports.filter(r=>selected.includes(r.id));
 const suggestions=['Which activities consumed the most time?','How much NPT was recorded?','What information is missing from this report?',...(chosen.some(r=>r.report.events.some(e=>/POOH|Pull out/i.test(e.evidence.snippet)))?['What does POOH mean in this context?']:[]),...(selected.length>1?['Compare downtime between these reports.']:[]),...(turns.some(turn=>turn.answer?.focus)?['What happened immediately before it?']:[])];
 return <section aria-label="Rig Supervisor Copilot" className="min-w-0 space-y-5">
  <div className="m-panel"><h2 className="text-lg font-medium">Investigate the selected drilling records</h2><p className="mt-3 text-sm text-steam-3">Only checked report data is sent with your question. Gemini interprets and explains; Mantle calculates from the source events. Changing scope starts a new conversation.</p>
   <fieldset disabled={busy} className="mt-4 min-w-0 space-y-3"><legend className="text-sm text-steam-2">Report scope · select up to four analyses</legend><label className="block text-sm text-steam-3">Well<select value={well} onChange={e=>{setWell(e.target.value);scope([]);}} className="mt-2 min-h-11 w-full rounded-chip border border-m-line bg-m-ink-2 px-3 text-steam"><option value="">All available wells</option>{wells.map(w=><option key={w} value={"well:"+w}>{w||'Well name unavailable'}</option>)}</select></label>
   <div className="grid min-w-0 gap-2 sm:grid-cols-2">{shown.map(entry=><label key={entry.id} className="flex min-h-11 min-w-0 items-start gap-3 rounded-chip border border-m-line p-3 text-sm text-steam-2"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={selected.includes(entry.id)} disabled={busy||!selected.includes(entry.id)&&selected.length>=4} onChange={event=>scope(event.target.checked?[...selected,entry.id]:selected.filter(id=>id!==entry.id))}/><span className="min-w-0 break-words">{entry.report.wellName||'Well name unavailable'} · {entry.report.reportDate||'Date unavailable'}<span className="mt-1 block font-mono text-xs text-steam-4">{entry.fileName} · {entry.report.events.length} events · {entry.report.sourceKind==='SYNTHETIC_DEMO'?'Synthetic demo':'Unverified source'}</span></span></label>)}</div></fieldset>
  </div>
  <div className="flex flex-wrap gap-2" aria-label="Suggested questions">{suggestions.map(text=><button type="button" className="m-chip text-left" key={text} disabled={busy||!selected.length} onClick={()=>void ask(text)}>{text}</button>)}</div>
  {turns.length>0&&<div role="log" aria-label="Copilot conversation" className="space-y-5">{turns.map(turn=><article key={turn.id} className="m-panel space-y-5"><div><h2 className="text-sm font-medium text-steam-4">Your question</h2><p className="mt-2 whitespace-pre-wrap break-words text-base text-steam">{turn.question}</p></div><div><h2 className="mb-3 text-base font-medium">Rig Supervisor Copilot</h2>{turn.answer?<CopilotAnswer answer={turn.answer} onInspect={onInspect}/>:turn.error?<p className="text-sm text-npt-ink">{turn.error}</p>:<p className="text-sm text-steam-3">{busy?'Retrieving evidence and preparing the answer...':'Question stopped; no answer was assumed.'}</p>}</div></article>)}</div>}
  <form className="m-panel" onSubmit={event=>{event.preventDefault();void ask(question);}}><label htmlFor="copilot-question" className="block text-sm text-steam-2">Ask about the selected records</label><textarea id="copilot-question" ref={input} rows={3} maxLength={1200} disabled={busy} value={question} onChange={e=>setQuestion(e.target.value)} className="mt-3 w-full rounded-chip border border-m-line bg-m-ink-2 p-3 text-base text-steam" placeholder="Ask about recorded activities, source evidence or scenario assumptions."/><div className="mt-3 flex flex-wrap items-center gap-3"><button type="submit" className="m-btn-primary" disabled={busy||!question.trim()||!selected.length}>{busy?'Working...':'Ask copilot'}</button>{busy&&<button type="button" className="m-btn-ghost" onClick={cancel}>Cancel question</button>}<button type="button" className="m-btn-ghost" disabled={!turns.length&&!error} onClick={clear}>Clear conversation</button><span className="text-xs text-steam-4">{question.length}/1200</span></div>{error&&<p role="alert" className="mt-3 text-sm text-npt-ink">{error}</p>}{busy&&<p role="status" className="mt-3 text-sm text-steam-3">Checking report scope, source evidence and deterministic calculations.</p>}</form>
 </section>;
}
