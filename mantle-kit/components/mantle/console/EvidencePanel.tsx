import type { EventMetrics } from '@/lib/mantle/report';
import { classPill, fmtClock, fmtMoney, fmtNum } from '@/lib/mantle/report';
import { IconArrowUpRight } from '../Icons';

/** The selected event and the exact source line that justified it. */
export function EvidencePanel({ event, perHour, onOpenSource, onFlag }: { event: EventMetrics; perHour: number; onOpenSource?: () => void; onFlag?: () => void }) {
  const pill = classPill(event);
  const i = event.raw.indexOf(event.mark);
  const before = i >= 0 ? event.raw.slice(0, i) : event.raw;
  const mark = i >= 0 ? event.mark : '';
  const after = i >= 0 ? event.raw.slice(i + event.mark.length) : '';
  const markBg = event.cls === 'npt' ? 'bg-npt/20' : event.ilt > 0.01 ? 'bg-ilt/20' : 'bg-productive/25';
  const lostHours = event.cls === 'npt' ? event.hours : event.ilt;
  const lost = lostHours > 0.01 ? `${fmtNum(lostHours)} h` : 'None';
  const lostCost = lostHours > 0.01 ? fmtMoney(lostHours * perHour) : null;
  const lostTone = event.cls === 'npt' ? 'text-npt-ink' : event.ilt > 0.01 ? 'text-ilt-ink' : 'text-steam';

  return (
    <section aria-label="Selected event" className="flex w-full flex-col gap-3.5 rounded-panel border border-line bg-white/[0.015] px-[22px] py-5">
      <div className="flex items-center justify-between gap-2.5">
        <span className="font-mono text-xs text-steam-4">{fmtClock(event.start)} – {fmtClock(event.end)} · {fmtNum(event.hours)} h</span>
        <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${pill.className}`}>{pill.label}</span>
      </div>
      <div>
        <h2 className="mb-1.5 text-2xl font-medium tracking-[-0.03em]">{event.operation}</h2>
        <p className="text-sm leading-normal text-steam-3">{event.summary}</p>
      </div>
      <dl className="grid grid-cols-3 border-y border-line">
        <div className="py-3 pr-2"><dt className="text-xs text-steam-4">Depth</dt><dd className="mt-0.5 text-base font-medium whitespace-nowrap">{event.footage ? `+${event.footage} ft` : '0 ft'}</dd></div>
        <div className="py-3 pr-2"><dt className="text-xs text-steam-4">ROP</dt><dd className="mt-0.5 text-base font-medium whitespace-nowrap">{event.rop ? `${fmtNum(event.rop)} ft/h` : '—'}</dd></div>
        <div className="py-3"><dt className="text-xs text-steam-4">Lost</dt><dd className={`mt-0.5 text-base font-medium whitespace-nowrap ${lostTone}`}>{lost}</dd>{lostCost && <dd className="mt-0.5 font-mono text-[11px] text-steam-4">{lostCost}</dd>}</div>
      </dl>
      <div className="rounded-[14px] border border-line bg-ink-2 p-3.5">
        <div className="mb-2.5 flex flex-wrap justify-between gap-2 text-[11.5px] text-steam-4">
          <span>Source · report line {event.line}{event.page ? ` · page ${event.page}` : ''}</span>
          <span className="font-mono">Gemini · {event.confidence} confidence</span>
        </div>
        <p className="font-mono text-[12.5px] leading-relaxed break-words text-steam-3">
          {before}
          {mark && <mark className={`rounded-[3px] px-0.5 text-steam ${markBg}`}>{mark}</mark>}
          {after}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <button type="button" className="m-btn-ghost" onClick={onOpenSource}>Open in source <IconArrowUpRight size={14} /></button>
        <button type="button" className="m-btn-ghost" onClick={onFlag}>Flag for review</button>
      </div>
    </section>
  );
}
