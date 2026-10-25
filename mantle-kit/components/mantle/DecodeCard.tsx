'use client';

import { useEffect, useState } from 'react';

interface DecodeSet {
  raw: string;
  accent: string;
  fields: Array<[label: string, value: string]>;
}

const SETS: DecodeSet[] = [
  { raw: '0600-1000  PUMP #2 LINER SEAL FAILED, REPLACE, TEST', accent: 'var(--m-npt)', fields: [['Time', '06:00 – 10:00'], ['Operation', 'Rig repair'], ['Class', 'NPT'], ['Lost', '4.0 h · $20,000'], ['Source', 'Report line 4']] },
  { raw: "1400-1730  DRILL 60' IN 3.5 HOURS, LOW ROP", accent: 'var(--m-ilt)', fields: [['Time', '14:00 – 17:30'], ['Operation', 'Drilling'], ['Class', 'ILT'], ['Lost', '1.8 h vs 35 ft/h'], ['Source', 'Report line 7']] },
  { raw: '1300-1400  W.O. PARTS CONFIRMATION 1HR', accent: 'var(--m-npt)', fields: [['Time', '13:00 – 14:00'], ['Operation', 'Waiting on parts'], ['Class', 'NPT'], ['Lost', '1.0 h · $5,000'], ['Source', 'Report line 6']] },
];
const GLYPHS = '░▒▓#*+=-:/\\<>';
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
    <div className="flex h-[210px] flex-col gap-2.5 overflow-hidden rounded-[15px] border border-white/5 bg-ink-2 px-5 py-[18px] font-mono text-[11px]">
      <div className="relative truncate rounded-lg bg-white/[0.03] px-2.5 py-2 text-steam-3">
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
