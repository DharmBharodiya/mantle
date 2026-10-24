"use client";
import { useState } from "react";
import type { WellTelemetryReport } from "@/types/telemetry";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartPoints, formatMinute } from "./report-view";

export function DepthChart({ report }: { report: WellTelemetryReport }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = report.events.find(event => event.id === selectedId);
  const data = chartPoints(report);
  const depths = data.flatMap(point => point.holeDepthFt === null ? [] : [point.holeDepthFt]);
  const min = depths.length ? Math.floor(Math.min(...depths) / 100) * 100 : 0;
  const max = depths.length ? Math.max(min + 100, Math.ceil(Math.max(...depths) / 100) * 100) : 100;
  return <section className="card min-w-0 px-5 py-6 md:px-7" aria-labelledby="depth-title">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="micro mb-2">Drilling progress</p><h2 id="depth-title" className="text-[18px] font-semibold tracking-tight">Hole depth over time</h2><p className="mt-1 text-xs text-[#667286]">Hole measured depth (ft) · local report-day time</p></div><span className="rounded-full border border-line px-3 py-1 text-[10px] text-[#667286]">Linear observations</span></div>
    {depths.length ? <div className="h-[280px] w-full sm:h-[310px]" role="img" aria-label="Hole depth chart. Depth increases downward. Select an event below to read its exact observations and source evidence.">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 12 }} accessibilityLayer>
        <CartesianGrid stroke="#EDF0F4" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="minute" type="number" domain={[0, 1440]} ticks={[0, 240, 480, 720, 960, 1200, 1440]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#667286" }} tickFormatter={n => `${n / 60}h`} />
        <YAxis type="number" domain={[min, max]} reversed tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#667286" }} width={52} tickFormatter={(n: number) => n.toLocaleString("en-US")} />
        {report.events.filter(event => event.classification === "NPT").map(event => <ReferenceArea key={event.id} x1={event.startMinute} x2={event.endMinute} fill="#E9736B" fillOpacity={0.09} strokeOpacity={0} />)}
        {selected && <ReferenceArea x1={selected.startMinute} x2={selected.endMinute} fill="#5559F7" fillOpacity={0.05} stroke="#5559F7" strokeOpacity={0.3} />}
        <Tooltip content={({ active, payload }) => {
          const point = payload?.[0]?.payload as (typeof data)[number] | undefined;
          const event = report.events.find(item => item.id === point?.eventId);
          if (!active || !point || !event) return null;
          return <div className="chart-tooltip"><p className="font-semibold">{formatMinute(point.minute)} · {point.holeDepthFt?.toLocaleString("en-US")} ft</p><p>{event.id} · {event.classification}</p><p className="capitalize">{event.activity.replaceAll("_", " ").toLowerCase()}</p><p>Select event below to inspect source.</p></div>;
        }} />
        <Line dataKey="holeDepthFt" type="linear" stroke="#5559F7" strokeWidth={2.5} connectNulls={false} dot={false} activeDot={(props: unknown) => {
          const { cx, cy, payload } = props as { cx: number; cy: number; payload: (typeof data)[number] };
          return <circle cx={cx} cy={cy} r={6} fill="#5559F7" stroke="white" strokeWidth={2} className="cursor-pointer" onClick={() => setSelectedId(payload.eventId)} />;
        }} isAnimationActive={false} />
      </LineChart></ResponsiveContainer>
    </div> : <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-[#F6F7F9] p-6 text-center text-sm text-[#667286]">No reported hole depth observations. Source events remain available below.</div>}
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[11px] text-[#667286]"><span><span className="mr-2 inline-block h-[2px] w-4 bg-[#5559F7] align-middle" />Hole depth</span><span><span className="mr-2 inline-block h-2 w-3 border border-[#E9736B] bg-[#FDEBE8]" />Confirmed NPT</span></div>
    <p className="mt-3 text-[11px] leading-5 text-[#667286]">Flat hole depth can reflect tripping or other planned operations. Missing observations and gaps are not interpolated.</p>
    <label className="mt-4 block text-xs font-medium" htmlFor="chart-event">Inspect chart event</label>
    <select id="chart-event" className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-xs" value={selected?.id ?? ""} onChange={event => setSelectedId(event.target.value)} disabled={!report.events.length}>
      <option value="">{report.events.length ? "Select an event to view source evidence" : "No extracted events"}</option>
      {report.events.map(event => <option key={event.id} value={event.id}>{formatMinute(event.startMinute)}–{formatMinute(event.endMinute)} · {event.id} · {event.classification} · {event.activity.replaceAll("_", " ")}</option>)}
    </select>
    {selected && <div className="mt-4 rounded-2xl border border-line bg-[#FAFBFD] p-4 text-xs leading-6 [overflow-wrap:anywhere]" aria-live="polite">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{selected.id} · {selected.classification}</h3><span>Confidence: {selected.confidence}</span></div>
      <p className="mt-2">{formatMinute(selected.startMinute)}–{formatMinute(selected.endMinute)} · {selected.startHoleDepthFt ?? "Unknown"} → {selected.endHoleDepthFt ?? "Unknown"} ft</p>
      <blockquote className="my-3 border-l-2 border-[#5559F7] pl-3">{selected.evidence.snippet ? `“${selected.evidence.snippet}”` : "No source snippet available."}</blockquote>
      <p className="font-medium">{selected.evidence.fileName} · {selected.evidence.page === null ? "Page unavailable" : `Page ${selected.evidence.page}`}</p><p className="mt-2 text-[#667286]">{selected.explanation || "No interpretation available."}</p><p className="mt-2 text-[#93601E]">Human review required. {report.sourceKind === "SYNTHETIC_DEMO" ? "This event is illustrative synthetic data." : "Verify the excerpt against the original document."}</p>
    </div>}
  </section>;
}
