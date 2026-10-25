import type { DrillEvent } from '@/lib/mantle/report';
import { DEFAULT_ASSUMPTIONS, fmtClock } from '@/lib/mantle/report';

const DOT: Record<'productive' | 'ilt' | 'npt', string> = {
  productive: 'bg-productive',
  ilt: 'bg-ilt',
  npt: 'bg-npt',
};

/** Horizontal marquee of extracted events. Pauses on hover. Pure CSS, server-safe. */
export function EventTicker({ events, benchmark = DEFAULT_ASSUMPTIONS.ropBenchmark }: { events: DrillEvent[]; benchmark?: number }) {
  const items = events.map((e) => {
    const hours = e.end - e.start;
    const slow = e.cls === 'productive' && e.kind === 'drilling' && e.footage / hours < benchmark;
    const tone = e.cls === 'npt' ? 'npt' : slow ? 'ilt' : 'productive';
    const tag = e.cls === 'npt' ? ` · NPT ${hours.toFixed(1)} H` : slow ? ' · ILT' : '';
    return { key: e.id, tone, text: `${fmtClock(e.start)}  ${e.raw.replace(/^\d{4}-\d{4}\s*/, '')}${tag}` };
  });
  const loop = [...items, ...items];
  return (
    <div className="m-marquee-host overflow-hidden border-t border-line bg-ink/80 backdrop-blur-md">
      <div className="m-marquee flex w-max py-[13px] font-mono text-xs tracking-[0.02em] whitespace-nowrap text-steam-3">
        {loop.map((it, i) => (
          <span key={it.key + i} aria-hidden={i >= items.length || undefined} className="inline-flex items-center gap-2.5 px-6">
            <span className={`size-1.5 rounded-full ${DOT[it.tone as keyof typeof DOT]}`} />
            {it.text}
          </span>
        ))}
      </div>
    </div>
  );
}
