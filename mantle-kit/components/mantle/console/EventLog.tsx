'use client';

import { useState } from 'react';
import type { DayMetrics } from '@/lib/mantle/report';
import { classPill, fmtClock, fmtNum } from '@/lib/mantle/report';
import { IconArrowUpRight } from '../Icons';

type Filter = 'all' | 'productive' | 'npt' | 'ilt';
const TABS: Array<[Filter, string]> = [['all', 'All'], ['productive', 'Productive'], ['npt', 'NPT'], ['ilt', 'ILT']];
const COLS = 'grid-cols-[100px_minmax(220px,1fr)_120px_52px_60px_48px_92px]';

/** Event log. Full source lines (never truncated), class pills, and a source button per row. */
export function EventLog({ day, selectedId, onSelect }: { day: DayMetrics; selectedId?: string; onSelect?: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const rows = day.events.filter((e) => filter === 'all' || (filter === 'npt' && e.cls === 'npt') || (filter === 'productive' && e.cls === 'productive') || (filter === 'ilt' && e.ilt > 0.01));

  return (
    <section aria-label="Event log" className="min-w-0 rounded-panel border border-line bg-white/[0.015] pt-[18px] pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] pb-3.5">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-base font-medium">Event log</h2>
          <span className="font-mono text-[11.5px] text-steam-4">{rows.length} of {day.events.length}</span>
        </div>
        <div role="group" aria-label="Filter events" className="flex gap-0.5 rounded-[13px] border border-line bg-white/[0.04] p-[3px]">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`min-h-11 rounded-[10px] px-3.5 text-[13.5px] transition-colors ${filter === key ? 'bg-white/10 text-steam' : 'text-steam-3 hover:text-steam'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className={`grid ${COLS} gap-3 border-y border-white/5 px-[22px] py-2.5 text-xs text-steam-4`}>
            <span>Time</span><span>Operation</span><span>Class</span><span className="text-right">Hours</span><span className="text-right">Depth</span><span className="text-right">ILT</span><span className="text-right">Source</span>
          </div>
          {rows.map((e) => {
            const pill = classPill(e);
            return (
              <div key={e.id} className={`grid ${COLS} items-center gap-3 border-b border-white/[0.045] px-[22px] py-2 transition-colors hover:bg-white/[0.025] ${e.id === selectedId ? 'bg-white/[0.045]' : ''}`}>
                <span className="font-mono text-xs text-steam-2">{fmtClock(e.start)}–{fmtClock(e.end)}</span>
                <span className="min-w-0">
                  <span className="block text-sm text-steam">{e.operation}</span>
                  <span className="mt-0.5 block font-mono text-[11.5px] text-steam-4">{e.raw}</span>
                </span>
                <span><span className={`inline-block rounded-full px-2.5 py-[3px] font-mono text-[11px] ${pill.className}`}>{pill.label}</span></span>
                <span className="text-right font-mono text-[12.5px]">{fmtNum(e.hours)}</span>
                <span className="text-right font-mono text-[12.5px] text-steam-2">{e.footage ? `+${e.footage}` : '—'}</span>
                <span className={`text-right font-mono text-[12.5px] ${e.ilt > 0.01 ? 'text-ilt-ink' : 'text-steam-4'}`}>{e.ilt > 0.01 ? fmtNum(e.ilt) : '—'}</span>
                <span className="text-right">
                  <button
                    type="button"
                    onClick={() => onSelect?.(e.id)}
                    aria-label={`Show source line ${e.line}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-white/10 px-2.5 font-mono text-[11.5px] whitespace-nowrap text-steam-2 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-steam"
                  >
                    Line {e.line}
                    <IconArrowUpRight size={12} strokeWidth={2} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
