"use client";
import { useId, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WellTelemetryReport } from "@/types/telemetry";
import { chartPoints, formatMinute } from "./report-view";
export function DepthChart({ report, onSelect, selectedId }: {
    report: WellTelemetryReport;
    onSelect?: (id: string) => void;
    selectedId?: string;
}) {
    const uid = useId().replaceAll(":", "");
    const [benchmark, setBenchmark] = useState(false);
    const [localId, setLocalId] = useState("");
    const eventId = selectedId ?? localId;
    const selected = report.events.find(event => event.id === eventId);
    const select = (id: string) => { setLocalId(id); if (id)
        onSelect?.(id); };
    const data = chartPoints(report).map(point => {
        const event = report.events.find(e => e.id === point.eventId);
        const insight = report.insights.find(i => i.eventId === point.eventId);
        const comparable = event && insight?.iltMinutes !== null && insight !== undefined && event.startHoleDepthFt !== null;
        return { ...point, benchmark: benchmark && comparable ? (event.startHoleDepthFt! + (point.minute - event.startMinute) / 60 * report.scenario.drillBenchmarkFtPerHour) : null };
    });
    const depths = data.flatMap(point => [point.holeDepthFt, point.benchmark].filter((value): value is number => value !== null));
    const min = depths.length ? Math.floor(Math.min(...depths) / 100) * 100 : 0;
    const max = depths.length ? Math.max(min + 100, Math.ceil(Math.max(...depths) / 100) * 100) : 100;
    return <section className="card panel"><div className="panel-head"><div><p className="eyebrow">Drilling progress</p><h2>Hole depth over time</h2><p className="caption">Measured hole depth (ft) · local report-day hours</p></div><span className="badge">Observed endpoints</span></div>
    {depths.length ? <div className="chart-box" role="img" aria-label="Hole depth increases down the vertical axis. Actual line segments connect reported endpoints only. Use the event selector below for accessible source evidence."><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }} accessibilityLayer><defs><linearGradient id={`line-${uid}`}><stop stopColor="#6487FF"/><stop offset="100%" stopColor="#2DD4BF"/></linearGradient><linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6487FF" stopOpacity={0.01}/><stop offset="100%" stopColor="#6487FF" stopOpacity={0.13}/></linearGradient></defs><CartesianGrid stroke="#2B3A50" strokeOpacity={.65} strokeDasharray="2 5" vertical={false}/><XAxis dataKey="minute" type="number" domain={[0, 1440]} ticks={[0, 240, 480, 720, 960, 1200, 1440]} tickFormatter={(minute: number) => `${minute / 60}h`} stroke="#8D9EB7" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}/><YAxis type="number" reversed domain={[min, max]} width={52} tickFormatter={(depth: number) => depth.toLocaleString("en-US")} tick={{ fontSize: 10, fill: "#8D9EB7" }} tickLine={false} axisLine={false}/>{report.events.filter(e => e.classification === "NPT").map(event => <ReferenceArea key={event.id} x1={event.startMinute} x2={event.endMinute} fill="#FB7185" fillOpacity={.1} strokeOpacity={0}/>)}{selected && <ReferenceArea x1={selected.startMinute} x2={selected.endMinute} fill="#94A3FF" fillOpacity={.08} stroke="#94A3FF" strokeOpacity={.4}/>}
    <Area dataKey="holeDepthFt" type="linear" fill={`url(#area-${uid})`} stroke="none" connectNulls={false} isAnimationActive={false} tooltipType="none"/>
    <Line dataKey="holeDepthFt" name="Observed depth" type="linear" stroke={`url(#line-${uid})`} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} activeDot={(props: unknown) => { const { cx, cy, payload } = props as {
            cx: number;
            cy: number;
            payload: typeof data[number];
        }; return <circle cx={cx} cy={cy} r={6} fill="#94A3FF" stroke="#EDF4FF" strokeWidth={2} onClick={() => select(payload.eventId)} style={{ cursor: "pointer" }}/>; }}/>
    {benchmark && <Line dataKey="benchmark" name="Scenario benchmark" type="linear" stroke="#94A3FF" strokeWidth={1.5} strokeDasharray="4 5" dot={false} connectNulls={false} isAnimationActive={false}/>}
    <Tooltip content={({ active, payload }) => { const point = payload?.[0]?.payload as typeof data[number] | undefined; const event = report.events.find(e => e.id === point?.eventId); if (!active || !point || !event)
            return null; return <div className="chart-tooltip"><strong>{formatMinute(point.minute)} · {point.holeDepthFt === null ? "Not available" : `${point.holeDepthFt.toLocaleString("en-US")} ft`}</strong><p>{event.id} · {event.classification}</p><p>{event.activity.replaceAll("_", " ")}</p><p className="muted">Click the point or select the event to inspect.</p></div>; }}/>
    </ComposedChart></ResponsiveContainer></div> : <div className="empty-state"><h3>No depth observations</h3><p>Source events are still available. Missing depths are never invented.</p></div>}
    <div className="chart-legend"><span><i className="legend-line"/>Observed hole depth</span><span><i className="legend-area"/>Confirmed NPT</span>{benchmark && <span><i className="legend-line" style={{ background: "var(--plan)" }}/>Scenario benchmark</span>}</div><div className="chart-controls"><label htmlFor={`event-${uid}`}>Inspect event</label><select id={`event-${uid}`} value={eventId} disabled={!report.events.length} onChange={e => select(e.target.value)}><option value="">Select source evidence…</option>{report.events.map(event => <option key={event.id} value={event.id}>{formatMinute(event.startMinute)}–{formatMinute(event.endMinute)} · {event.id} · {event.activity.replaceAll("_", " ")}</option>)}</select><label className="row"><input type="checkbox" checked={benchmark} onChange={e => setBenchmark(e.target.checked)}/>Model benchmark</label></div><p className="chart-foot">Flat hole depth may reflect planned operations. Gaps stay disconnected. The optional dashed illustration resets at each comparable drilling interval; it is an assumed benchmark, not an operational plan.</p>
  </section>;
}
