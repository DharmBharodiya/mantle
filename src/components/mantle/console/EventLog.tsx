"use client";
import { useId, useState } from "react";
import type { WellTelemetryReport } from "@/types/telemetry";
import { fmtNum } from "@/lib/mantle/report";
import { IconArrowUpRight } from "../Icons";
import { classPill, eventTime, operation, sourceReference } from "./presentation";

/** Kit event log adapted to real source events, including unknown classifications. */
export function EventLog({report, selectedId, onSelect}: {report:WellTelemetryReport; selectedId?:string; onSelect:(id:string)=>void}) {
  const [filter,setFilter]=useState("All");
  const [query,setQuery]=useState("");
  const [confidence,setConfidence]=useState("All");
  const uid=useId();
  const rows=report.events.filter(e=>(filter==="All" || (filter==="ILT" ? (report.insights.find(i=>i.eventId===e.id)?.iltMinutes??0)>0 : e.classification===filter.toUpperCase())) && (confidence==="All" || e.confidence===confidence) && `${e.id} ${e.activity} ${e.note} ${e.explanation} ${e.evidence.snippet}`.toLowerCase().includes(query.toLowerCase()));
  return <section aria-label="Event log" className="m-panel min-w-0">
    <div className="mb-4 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-[2_1_200px] text-sm text-steam-4" htmlFor={uid}>Search events<input id={uid} type="search" value={query} placeholder="Search event or source…" onChange={e=>setQuery(e.target.value)}/></label><label className="flex-[1_1_160px] text-sm text-steam-4">Extraction confidence<select value={confidence} onChange={e=>setConfidence(e.target.value)}><option value="All">All confidence</option>{["HIGH","MEDIUM","LOW"].map(c=><option key={c} value={c}>{c.toLowerCase()}</option>)}</select></label></div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2>Event log <span className="ml-2 font-mono text-xs text-steam-4">{rows.length} of {report.events.length}</span></h2><div role="group" aria-label="Filter events" className="flex flex-wrap gap-1">{["All","Productive","NPT","ILT","Unknown"].map(tab=><button key={tab} aria-pressed={tab===filter} onClick={()=>setFilter(tab)} className={`m-chip ${tab===filter?"bg-white/10":""}`}>{tab}</button>)}</div></div>
    <div className="overflow-x-auto"><table className="m-event-table"><thead><tr><th>Time</th><th>Operation / exact source excerpt</th><th>Class</th><th>Hours</th><th>ILT (h)</th><th>Source</th></tr></thead><tbody>{rows.map(e=>{const pill=classPill(e,report);const insight=report.insights.find(i=>i.eventId===e.id);return <tr key={e.id} className={e.id===selectedId?"bg-white/5":""}><td className="whitespace-nowrap font-mono">{eventTime(e)}</td><td><span className="capitalize text-steam">{operation(e)}</span><p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-steam-4">{e.evidence.snippet || "No verifiable source excerpt available."}</p></td><td><span className={`rounded-full px-3 py-1 text-xs ${pill.className}`}>{pill.label}</span></td><td className="font-mono">{fmtNum((e.endMinute-e.startMinute)/60)}</td><td className="font-mono">{fmtNum(insight?.iltMinutes==null?null:insight.iltMinutes/60)}</td><td><button className="m-chip" onClick={()=>onSelect(e.id)} aria-label={`Show source for ${e.id}`} title={sourceReference(e)}>Source <IconArrowUpRight/></button><p className="mt-2 text-xs text-steam-4">{e.evidence.row?`Row ${e.evidence.row}`:e.evidence.page?`Page ${e.evidence.page}`:e.id}</p></td></tr>})}</tbody></table></div>{!rows.length&&<p className="py-6 text-steam-3">No events match this filter.</p>}
  </section>;
}
