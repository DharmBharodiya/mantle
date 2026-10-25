'use client';

import type { EventMetrics } from '@/lib/mantle/report';
import { fmtClock } from '@/lib/mantle/report';
import { cn } from '@/lib/mantle/cn';

export interface ShiftStripProps {
  events: EventMetrics[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
  className?: string;
}

/**
 * 24-hour activity strip. Width = duration. Productive drilling = violet,
 * flat productive ops (circulating, trips) = dim violet, NPT = hot pink,
 * ILT inside productive time = amber underline.
 */
export function ShiftStrip({ events, selectedId, onSelect, height = 26, className }: ShiftStripProps) {
  return (
    <div className={cn('flex items-end gap-[3px]', className)} style={{ height }}>
      {events.map((e) => {
        const selected = e.id === selectedId;
        const label = `${fmtClock(e.start)}–${fmtClock(e.end)} ${e.operation}${e.cls === 'npt' ? ', downtime' : e.ilt > 0.01 ? ', below benchmark' : ''}`;
        return (
          <button
            key={e.id}
            type="button"
            aria-label={label}
            aria-pressed={selected}
            title={label}
            onClick={() => onSelect?.(e.id)}
            className={cn(
              'm-seg h-full cursor-pointer rounded-[5px] outline-2 outline-offset-2',
              e.cls === 'npt' ? 'bg-npt' : e.kind === 'flat' ? 'bg-productive-flat' : 'bg-productive',
              e.ilt > 0.01 && 'shadow-[inset_0_-6px_0_var(--m-ilt)]',
              selected ? 'outline-steam' : 'outline-transparent',
            )}
            style={{ flex: `${e.hours} 1 0` }}
          />
        );
      })}
    </div>
  );
}
