"use client";
import { useState } from "react";
import { DepthTimeline } from "./DepthTimeline";
import { DEFAULT_ASSUMPTIONS, DEMO_EVENTS, computeDay, fmtMoney, fmtNum, fmtClock } from "@/lib/mantle/report";
const demo = computeDay(DEMO_EVENTS);
export function LandingPreview() {
  const [selectedId, setSelectedId] = useState("");
  const selected = demo.events.find(event => event.id === selectedId);
  return <div>
    <DepthTimeline day={demo} benchmark={DEFAULT_ASSUMPTIONS.ropBenchmark} height={220} compact showBenchmark={false} selectedId={selectedId} onSelect={setSelectedId} />
    <div className="mt-6 flex flex-wrap items-center gap-3 text-[13px] text-steam-3"><label htmlFor="landing-event">Inspect a sample event</label><select id="landing-event" className="m-event-select min-h-11 flex-1 rounded-chip border border-m-line bg-m-ink-2 p-3 text-steam" value={selectedId} onChange={event => setSelectedId(event.target.value)}><option value="">Select source evidence</option>{demo.events.map(event => <option key={event.id} value={event.id}>{fmtClock(event.start)}–{fmtClock(event.end)} · {event.operation}</option>)}</select></div>
    {selected && <div className="mt-4 rounded-panel border border-m-line bg-m-ink-2 p-5" aria-live="polite"><h3 className="text-base font-medium capitalize">{selected.operation} · {selected.id}</h3><blockquote className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-steam-2">{selected.raw}</blockquote><p className="mt-3 text-sm text-steam-3">{selected.summary}</p><p className="mt-3 font-mono text-xs text-steam-4">{selected.cls === "npt" ? "NPT" : "Productive"} · {fmtNum(selected.hours)} h · {fmtMoney(selected.lostCost)} scenario exposure</p></div>}
  </div>;
}
