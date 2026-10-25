import type { DayMetrics } from '@/lib/mantle/report';
import { fmtMoney, fmtNum } from '@/lib/mantle/report';
import { IconInfo } from '../Icons';

function Info({ label, formula }: { label: string; formula: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={formula}
      className="-my-2 -mr-2 inline-flex size-8 items-center justify-center rounded-lg text-steam-4 transition-colors hover:bg-white/5 hover:text-steam"
    >
      <IconInfo size={14} />
    </button>
  );
}

function Cell({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div className={`px-5 py-[18px] ${last ? '' : 'border-r border-line'}`}>{children}</div>;
}

const big = 'mt-1.5 text-[32px] font-medium tracking-[-0.035em]';
const unit = 'text-base text-steam-4';
const meta = 'font-mono text-[11px] text-steam-4';

/** One continuous instrument strip — never five separate cards. Formulas live in the (i) tooltips, once. */
export function KpiStrip({ day, benchmark }: { day: DayMetrics; benchmark: number }) {
  const nptCount = day.events.filter((e) => e.cls === 'npt').length;
  const pct = (h: number) => `${((h / Math.max(1, day.observedHours)) * 100).toFixed(1)}%`;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] overflow-hidden rounded-panel border border-line bg-white/[0.015]">
      <Cell>
        <div className="flex items-center justify-between text-[13px] text-steam-4">
          Effective drilling
          <Info label="How effective drilling is calculated" formula="(observed hours − NPT − ILT) ÷ observed hours" />
        </div>
        <div className={big}>{fmtNum(day.effectivePct)}<span className={unit}>%</span></div>
        <div className="my-2.5 flex h-1 gap-0.5">
          <span className="rounded-sm bg-productive" style={{ width: pct(day.effectiveHours) }} />
          <span className="rounded-sm bg-ilt" style={{ width: pct(day.iltHours) }} />
          <span className="rounded-sm bg-npt" style={{ width: pct(day.nptHours) }} />
        </div>
        <div className={meta}>{fmtNum(day.effectiveHours)} of {fmtNum(day.observedHours)} h</div>
      </Cell>
      <Cell>
        <div className="flex items-center justify-between text-[13px] text-steam-4">
          <span className="inline-flex items-center gap-1.5"><span className="size-[7px] rounded-full bg-npt" />Downtime (NPT)</span>
          <Info label="How downtime is classified" formula="Classified from the report itself (equipment failures, waiting, disruptions)" />
        </div>
        <div className={big}>{fmtNum(day.nptHours)}<span className={unit}> h</span></div>
        <div className={`${meta} mt-[22px]`}>{fmtMoney(day.nptCost)} · {nptCount} events</div>
      </Cell>
      <Cell>
        <div className="flex items-center justify-between text-[13px] text-steam-4">
          <span className="inline-flex items-center gap-1.5"><span className="size-[7px] rounded-full bg-ilt" />Invisible lost time</span>
          <Info label="How invisible lost time is calculated" formula="For each drilling interval: hours − footage ÷ benchmark ROP" />
        </div>
        <div className={big}>{fmtNum(day.iltHours)}<span className={unit}> h</span></div>
        <div className={`${meta} mt-[22px]`}>{fmtMoney(day.iltCost)} · vs {benchmark} ft/h</div>
      </Cell>
      <Cell>
        <div className="min-h-4 text-[13px] text-steam-4">Hole depth</div>
        <div className={big}>{day.endDepth.toLocaleString('en-US')}<span className={unit}> ft</span></div>
        <div className={`${meta} mt-[22px]`}>+{day.footage.toLocaleString('en-US')} ft · measured depth</div>
      </Cell>
      <Cell last>
        <div className="flex items-center justify-between text-[13px] text-steam-4">
          Excess CO₂
          <Info label="How excess CO2 is estimated" formula="(NPT + ILT) × incremental fuel × kg CO₂ per gallon" />
        </div>
        <div className={big}>{fmtNum(day.co2Tonnes)}<span className={unit}> t</span></div>
        <div className={`${meta} mt-[22px]`}>{Math.round(day.fuelGal).toLocaleString('en-US')} gal extra fuel</div>
      </Cell>
    </div>
  );
}
