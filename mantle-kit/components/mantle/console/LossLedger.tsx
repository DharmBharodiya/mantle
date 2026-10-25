'use client';

import { useId } from 'react';
import type { Assumptions, DayMetrics } from '@/lib/mantle/report';
import { DEFAULT_ASSUMPTIONS, fmtMoney, fmtNum } from '@/lib/mantle/report';

function parse(v: string, fallback: number): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Where the lost hours went (ranked) + the editable assumptions behind every scenario number. */
export function LossLedger({ day, assumptions, onChange }: { day: DayMetrics; assumptions: Assumptions; onChange: (a: Assumptions) => void }) {
  const uid = useId();
  const perHour = assumptions.dayRate / 24;
  const groups = new Map<string, { hours: number; tone: 'npt' | 'ilt' }>();
  for (const e of day.events) {
    if (e.cls === 'npt') groups.set(e.operation, { hours: (groups.get(e.operation)?.hours ?? 0) + e.hours, tone: 'npt' });
  }
  if (day.iltHours > 0.01) groups.set('Slow drilling (ILT)', { hours: day.iltHours, tone: 'ilt' });
  const rows = [...groups.entries()].map(([name, g]) => ({ name, ...g })).sort((a, b) => b.hours - a.hours);
  const max = Math.max(0.01, rows[0]?.hours ?? 0.01);

  return (
    <section aria-label="Lost time and assumptions" className="flex flex-col gap-3.5 rounded-panel border border-line bg-white/[0.015] px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-2.5">
        <h2 className="text-base font-medium">Where {fmtNum(day.lostHours)} h went</h2>
        <span className="font-mono text-[11px] text-steam-4">scenario</span>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="flex flex-col gap-[7px]">
          <div className="flex justify-between gap-2.5 text-[13.5px]">
            <span>{r.name}</span>
            <span className="font-mono text-xs text-steam-2">{fmtNum(r.hours)} h · {fmtMoney(r.hours * perHour)}</span>
          </div>
          <div className="h-[5px] rounded-full bg-white/[0.06]">
            <div className={`h-full rounded-full transition-[width] duration-300 ${r.tone === 'npt' ? 'bg-npt' : 'bg-ilt'}`} style={{ width: `${(r.hours / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-[13.5px] text-steam-3">Time exposure</span>
        <span className="text-[28px] font-medium tracking-[-0.035em]">{fmtMoney(day.totalCost)}</span>
      </div>

      <div className="mt-1.5 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-ink-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13.5px] font-medium">Assumptions</span>
          <button type="button" onClick={() => onChange(DEFAULT_ASSUMPTIONS)} className="min-h-11 px-1.5 text-[12.5px] text-steam-3 underline underline-offset-[3px] hover:text-steam">
            Reset
          </button>
        </div>
        <label htmlFor={uid + 'rate'} className="flex flex-col gap-1.5 text-[12.5px] text-steam-3">
          Rig day rate (USD)
          <input
            id={uid + 'rate'}
            inputMode="numeric"
            defaultValue={assumptions.dayRate.toLocaleString('en-US')}
            key={'rate' + assumptions.dayRate}
            onBlur={(e) => onChange({ ...assumptions, dayRate: parse(e.target.value, assumptions.dayRate) })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="min-h-11 rounded-[10px] border border-white/10 bg-ink-1 px-3 font-mono text-[13px] text-steam outline-none transition focus:border-heat-6/60 focus:shadow-[0_0_0_4px_rgb(255_111_77/0.12)]"
          />
        </label>
        <label htmlFor={uid + 'rop'} className="flex flex-col gap-1.5 text-[12.5px] text-steam-3">
          <span className="flex justify-between">ROP benchmark<span className="font-mono text-ilt">{assumptions.ropBenchmark} ft/h</span></span>
          <input
            id={uid + 'rop'}
            type="range"
            min={20}
            max={50}
            step={1}
            value={assumptions.ropBenchmark}
            onChange={(e) => onChange({ ...assumptions, ropBenchmark: Number(e.target.value) })}
            className="h-7 w-full cursor-pointer accent-ilt"
          />
        </label>
        <label htmlFor={uid + 'fuel'} className="flex flex-col gap-1.5 text-[12.5px] text-steam-3">
          Incremental fuel (gal/h)
          <input
            id={uid + 'fuel'}
            inputMode="numeric"
            defaultValue={String(assumptions.fuelGalPerHour)}
            key={'fuel' + assumptions.fuelGalPerHour}
            onBlur={(e) => onChange({ ...assumptions, fuelGalPerHour: parse(e.target.value, assumptions.fuelGalPerHour) })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="min-h-11 rounded-[10px] border border-white/10 bg-ink-1 px-3 font-mono text-[13px] text-steam outline-none transition focus:border-heat-6/60 focus:shadow-[0_0_0_4px_rgb(255_111_77/0.12)]"
          />
        </label>
        <div className="flex justify-between text-[12.5px] text-steam-4">
          <span>Diesel CO₂ factor</span>
          <span className="font-mono">{assumptions.co2KgPerGal} kg/gal</span>
        </div>
      </div>
    </section>
  );
}
