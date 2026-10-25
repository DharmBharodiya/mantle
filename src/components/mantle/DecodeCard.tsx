'use client';

import { useEffect, useState } from 'react';
import { computeDay, DEMO_EVENTS, fmtClock, fmtNum, fmtMoney } from '@/lib/mantle/report';

interface DecodeSet {
  raw: string;
  accent: string;
  fields: Array<[label: string, value: string]>;
}

const day = computeDay(DEMO_EVENTS);
const SETS: DecodeSet[] = ["ev-04", "ev-07", "ev-06"].map(id => {
  const event = day.events.find(item => item.id === id)!;
  return { raw: event.raw, accent: event.cls === "npt" ? "var(--m-npt)" : "var(--m-ilt)", fields: [["Time", `${fmtClock(event.start)}–${fmtClock(event.end)}`], ["Operation", event.operation], ["Class", event.cls === "npt" ? "NPT" : "Productive"], [event.cls === "npt" ? "NPT scenario" : "ILT opportunity", event.cls === "npt" ? `${fmtNum(event.hours)} h · ${fmtMoney(event.lostCost)}` : `${fmtNum(event.ilt)} h · modeled`], ["Source", `Synthetic event ${event.id}`]] };
});const GLYPHS = '░▒▓#*+=-:/\\<>';
const CYCLE = 64;

/** A raw report line being "read": a scan bar sweeps it, then each extracted field scrambles and resolves. */
export function DecodeCard({ sets = SETS }: { sets?: DecodeSet[] }) {
  const [tick, setTick] = useState(CYCLE - 1);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 70);
    return () => window.clearInterval(id);
  }, []);
  const set = sets[Math.floor(tick / CYCLE) % sets.length];
  const p = tick % CYCLE;

  return (
    <div className="flex min-h-[210px] flex-col gap-2.5 overflow-hidden rounded-[15px] border border-white/5 bg-m-ink-2 px-5 py-[18px] font-mono text-[11px]">
      <div className="relative whitespace-pre-wrap break-words rounded-lg bg-white/[0.03] px-2.5 py-2 text-steam-3">
        {set.raw}
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5" style={{ width: `${Math.min(100, (p / 10) * 100)}%`, background: set.accent }} />
      </div>
      {set.fields.map(([label, value], i) => {
        const at = 10 + i * 6;
        const done = p >= at;
        const shown = done
          ? value
          : p >= at - 6
            ? value.split('').map((ch, j) => (ch === ' ' ? ' ' : GLYPHS[(j * 7 + p * 3 + i * 11) % GLYPHS.length])).join('')
            : '·';
        const color = !done ? 'var(--m-steam-4)' : label === 'Class' ? set.accent : 'var(--m-steam)';
        return (
          <div key={label} className="flex justify-between gap-3 px-1">
            <span className="text-steam-4">{label}</span>
            <span className="whitespace-nowrap" style={{ color }}>{shown}</span>
          </div>
        );
      })}
    </div>
  );
}

