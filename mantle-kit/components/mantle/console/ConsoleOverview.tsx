'use client';

import { useMemo, useState } from 'react';
import type { Assumptions, DrillEvent } from '@/lib/mantle/report';
import { DEFAULT_ASSUMPTIONS, computeDay, fmtNum } from '@/lib/mantle/report';
import { ConsoleSidebar } from './ConsoleSidebar';
import { KpiStrip } from './KpiStrip';
import { EvidencePanel } from './EvidencePanel';
import { EventLog } from './EventLog';
import { LossLedger } from './LossLedger';
import { DepthTimeline } from '../DepthTimeline';
import { IconChevronLeft, IconChevronRight, IconDownload, IconSpark, IconUpload } from '../Icons';

export interface ConsoleOverviewProps {
  events: DrillEvent[];
  wellName?: string;
  dateLabel?: string;
  synthetic?: boolean;
  /** Gemini's one-paragraph reading of the day. Falls back to a generated sentence. */
  summary?: string;
  onUpload?: () => void;
  onExport?: () => void;
}

/**
 * Console overview: summary → KPI strip → depth/time + evidence → event log + loss ledger.
 * All scenario numbers recompute live from the assumptions.
 */
export function ConsoleOverview({ events, wellName = 'Demo geothermal well', dateLabel = '24 Oct 2026', synthetic = true, summary, onUpload, onExport }: ConsoleOverviewProps) {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [showBenchmark, setShowBenchmark] = useState(true);
  const day = useMemo(() => computeDay(events, assumptions), [events, assumptions]);
  const longestNpt = useMemo(() => [...day.events].filter((e) => e.cls === 'npt').sort((a, b) => b.hours - a.hours)[0], [day]);
  const [selectedId, setSelectedId] = useState<string | undefined>(longestNpt?.id ?? events[0]?.id);
  const selected = day.events.find((e) => e.id === selectedId) ?? day.events[0];
  const perHour = assumptions.dayRate / 24;
  const evidenceIds = [...day.events].filter((e) => e.lost > 0.01).sort((a, b) => b.lost - a.lost).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-wrap bg-ink text-steam antialiased">
      <ConsoleSidebar wellName={wellName} depthLabel={`TD ${day.endDepth.toLocaleString('en-US')} ft`} dateLabel={dateLabel} onUpload={onUpload} />

      <main className="min-w-0 flex-[999_1_560px] px-7 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-steam-4">
            <span>Overview</span>
            <span aria-hidden="true">/</span>
            <span className="text-steam">{wellName}</span>
            <span className="ml-2 inline-flex items-center rounded-xl border border-line">
              <button type="button" aria-label="Previous report day" className="inline-flex size-11 items-center justify-center rounded-xl text-steam-3 hover:bg-white/5 hover:text-steam"><IconChevronLeft /></button>
              <span className="px-1 font-mono text-xs text-steam/90">{dateLabel}</span>
              <button type="button" aria-label="Next report day" className="inline-flex size-11 items-center justify-center rounded-xl text-steam-3 hover:bg-white/5 hover:text-steam"><IconChevronRight /></button>
            </span>
            {synthetic && <span className="ml-1.5 rounded-full border border-ilt/35 px-2.5 py-1 font-mono text-[10.5px] text-ilt">SYNTHETIC DEMO</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="m-btn-ghost" onClick={onExport}><IconDownload size={15} />Export CSV / JSON</button>
            <button type="button" className="m-btn-primary" onClick={onUpload}><IconUpload size={15} strokeWidth={2} />Upload report</button>
          </div>
        </div>

        <div className="mt-7 mb-[18px]">
          <h1 className="text-4xl leading-[1.05] font-medium tracking-[-0.04em]">{wellName}</h1>
          <p className="mt-2 font-mono text-xs text-steam-4">
            Report day {dateLabel} · {day.events.length} events · {fmtNum(day.observedHours)} h observed
          </p>
        </div>

        <section aria-label="Day summary" className="mb-4 flex flex-wrap items-start gap-3.5 rounded-panel border border-line bg-[linear-gradient(180deg,rgb(233_70_107/0.06),rgb(255_255_255/0.015))] px-5 py-[18px]">
          <span className="m-heat-fill inline-flex size-[34px] flex-none items-center justify-center rounded-full text-white"><IconSpark size={16} strokeWidth={1.9} /></span>
          <div className="min-w-0 flex-[1_1_420px]">
            <div className="mb-1.5 text-[12.5px] text-steam-4">Day summary · Gemini</div>
            <p className="text-base leading-relaxed text-steam/90">
              {summary ?? (
                <>
                  Drilled <strong className="font-semibold text-steam">{day.footage.toLocaleString('en-US')} ft</strong>, from {day.startDepth.toLocaleString('en-US')} to {day.endDepth.toLocaleString('en-US')} ft.{' '}
                  <strong className="font-semibold text-npt-ink">{fmtNum(day.nptHours)} h of downtime</strong>
                  {longestNpt ? <>, mostly {longestNpt.operation.toLowerCase()} ({fmtNum(longestNpt.hours)} h)</> : null}, and{' '}
                  <strong className="font-semibold text-ilt-ink">{fmtNum(day.iltHours)} h of slow drilling</strong> against the {assumptions.ropBenchmark} ft/h benchmark.
                </>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {evidenceIds.map((e) => (
                <button key={e.id} type="button" onClick={() => setSelectedId(e.id)} className="m-chip font-mono text-xs">
                  Line {e.line} · {e.cls === 'npt' ? e.operation.toLowerCase() : 'slow drilling'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-4">
          <KpiStrip day={day} benchmark={assumptions.ropBenchmark} />
        </div>

        <div className="mb-4 flex flex-wrap gap-4">
          <section aria-label="Depth and time" className="min-w-0 flex-[999_1_620px] rounded-panel border border-line bg-white/[0.015] px-[22px] pt-5 pb-[18px]">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-medium">Depth and time</h2>
              <div className="flex flex-wrap items-center gap-3.5 text-xs text-steam-3">
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3.5 bg-[#ECEAF4]" />On pace</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3.5 bg-ilt" />Below benchmark</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-npt/35" />NPT</span>
                <button type="button" aria-pressed={showBenchmark} onClick={() => setShowBenchmark((v) => !v)} className="inline-flex min-h-11 items-center gap-2 pr-1 pl-2 text-[12.5px] text-steam-2">
                  Benchmark
                  <span className={`relative h-[18px] w-[30px] rounded-full transition-colors ${showBenchmark ? 'bg-ilt' : 'bg-white/15'}`}>
                    <span className={`absolute top-0.5 size-3.5 rounded-full bg-steam transition-[left] ${showBenchmark ? 'left-3.5' : 'left-0.5'}`} />
                  </span>
                </button>
              </div>
            </div>
            <DepthTimeline day={day} benchmark={assumptions.ropBenchmark} showBenchmark={showBenchmark} selectedId={selected?.id} onSelect={setSelectedId} />
            <p className="mt-2.5 text-[12.5px] text-steam-4">Select a block to open its source line. Flat depth isn’t downtime on its own — classification comes from the report.</p>
          </section>
          <div className="flex min-w-0 flex-[1_1_320px]">
            {selected && <EvidencePanel event={selected} perHour={perHour} />}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="min-w-0 flex-[999_1_620px]">
            <EventLog day={day} selectedId={selected?.id} onSelect={setSelectedId} />
          </div>
          <div className="min-w-0 flex-[1_1_320px]">
            <LossLedger day={day} assumptions={assumptions} onChange={setAssumptions} />
          </div>
        </div>

        <p className="mt-[22px] text-[12.5px] text-steam-4">
          {synthetic ? 'Synthetic demo data. ' : ''}Classifications come from the report; ILT, cost and CO₂ are scenario estimates from the assumptions above. Every figure links to its source line.
        </p>
      </main>
    </div>
  );
}
