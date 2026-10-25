'use client';

import type { DayMetrics } from '@/lib/mantle/report';
import { fmtNum } from '@/lib/mantle/report';
import { ShiftStrip } from './ShiftStrip';
import { cn } from '@/lib/mantle/cn';

export interface DepthTimelineProps {
  day: DayMetrics;
  benchmark: number;
  showBenchmark?: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Plot height in px (strip and axis are extra). */
  height?: number;
  /** Fewer labels for small previews. */
  compact?: boolean;
  className?: string;
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/**
 * Depth vs time with depth increasing downward (drilling convention), NPT as
 * hot bands, below-benchmark drilling in amber, an optional dashed benchmark
 * pace per drilling interval, and the shift strip sharing the same time axis.
 */
export function DepthTimeline({ day, benchmark, showBenchmark = true, selectedId, onSelect, height = 280, compact = false, className }: DepthTimelineProps) {
  const span = 24;
  const lo = day.startDepth - 30;
  const hi = day.endDepth + 40;
  const step = niceStep((hi - lo) / 4);
  const minD = Math.floor(lo / step) * step;
  const maxD = Math.ceil(hi / step) * step;
  const x = (h: number) => (h / span) * 1000;
  const y = (d: number) => 10 + ((d - minD) / (maxD - minD)) * 280;
  const ticks: number[] = [];
  for (let d = minD + step; d < maxD; d += step) ticks.push(d);
  const hours = compact ? [0, 6, 12, 18, 24] : [0, 4, 8, 12, 16, 20, 24];
  const selected = day.events.find((e) => e.id === selectedId);
  const nptEvents = day.events.filter((e) => e.cls === 'npt');

  return (
    <div className={cn('flex gap-2.5', className)}>
      <div className="relative w-11 shrink-0 font-mono text-[10.5px] text-steam-4" style={{ height }}>
        {ticks.map((d) => (
          <span key={d} className="absolute right-0 -translate-y-1/2" style={{ top: `${(y(d) / 300) * 100}%` }}>
            {d.toLocaleString('en-US')}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          <svg
            viewBox="0 0 1000 300"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Hole depth from ${day.startDepth.toLocaleString('en-US')} to ${day.endDepth.toLocaleString('en-US')} feet over the report day`}
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {selected && <rect x={x(selected.start)} y={0} width={x(selected.hours)} height={300} fill="#fff" fillOpacity={0.05} />}
            {nptEvents.map((e) => (
              <rect key={e.id} x={x(e.start)} y={0} width={x(e.hours)} height={300} fill="var(--m-npt)" fillOpacity={0.13} />
            ))}
            {ticks.map((d) => (
              <line key={d} x1={0} x2={1000} y1={y(d)} y2={y(d)} stroke="#fff" strokeOpacity={0.06} vectorEffect="non-scaling-stroke" />
            ))}
            {showBenchmark &&
              day.events
                .filter((e) => e.kind === 'drilling')
                .map((e) => (
                  <polyline
                    key={'b' + e.id}
                    points={`${x(e.start)},${y(e.startDepth)} ${x(e.end)},${y(e.startDepth + benchmark * e.hours)}`}
                    fill="none"
                    stroke="#fff"
                    strokeOpacity={0.32}
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
            {day.events.map((e) => (
              <polyline
                key={e.id}
                points={`${x(e.start)},${y(e.startDepth)} ${x(e.end)},${y(e.startDepth + e.footage)}`}
                fill="none"
                stroke={e.kind === 'flat' ? 'rgb(236 234 244 / 0.4)' : e.ilt > 0.01 ? 'var(--m-ilt)' : '#ECEAF4'}
                strokeWidth={2.4}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {nptEvents.map((e, i) => (
            <span
              key={'l' + e.id}
              className="absolute ml-2 rounded-md bg-npt/15 px-2 py-0.5 font-mono text-[10.5px] whitespace-nowrap text-npt-ink"
              style={{ left: `${(e.start / span) * 100}%`, top: 10 + i * 24 }}
            >
              {e.operation} · {fmtNum(e.hours)} h
            </span>
          ))}
        </div>
        <ShiftStrip events={day.events} selectedId={selectedId} onSelect={onSelect} height={compact ? 10 : 26} className={compact ? 'mt-3.5' : 'mt-4'} />
        <div className="mt-2 flex justify-between font-mono text-[10.5px] text-steam-4">
          {hours.map((h) => (
            <span key={h}>{String(h).padStart(2, '0')}:00</span>
          ))}
        </div>
      </div>
    </div>
  );
}
