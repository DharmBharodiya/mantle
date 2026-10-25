'use client';

import Link from 'next/link';
import { MantleLogo } from '../Logo';
import { CoreColumn } from '../CoreColumn';
import { IconCompare, IconEye, IconFile, IconGauge, IconGrid, IconSelector, IconUpload } from '../Icons';

const NAV = [
  { href: '/console', label: 'Overview', Icon: IconGrid },
  { href: '/console/reports', label: 'Reports', Icon: IconFile },
  { href: '/console/compare', label: 'Compare', Icon: IconCompare },
  { href: '/console/benchmarks', label: 'Benchmarks', Icon: IconGauge },
  { href: '/console/vision', label: 'Equipment vision', Icon: IconEye },
];

export interface ConsoleSidebarProps {
  active?: string;
  wellName?: string;
  wellMeta?: string;
  depthLabel?: string;
  dateLabel?: string;
  onUpload?: () => void;
}

/** Console navigation. Stacks above the content on narrow screens — never sticky, never 100vh. */
export function ConsoleSidebar({ active = '/console', wellName = 'Demo geothermal well', wellMeta = 'BoreSight Lab · synthetic', depthLabel = 'TD 6,590 ft', dateLabel = '24 Oct', onUpload }: ConsoleSidebarProps) {
  return (
    <aside className="flex max-w-full flex-[1_1_248px] flex-col gap-[22px] border-r border-line bg-[#060607] px-4 py-[22px]">
      <Link href="/" aria-label="Mantle home" className="flex min-h-11 items-center px-2">
        <MantleLogo size={24} />
      </Link>
      <button type="button" className="flex min-h-14 w-full items-center justify-between gap-2.5 rounded-[14px] border border-line bg-white/[0.03] px-3 py-2.5 text-left">
        <span className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-medium">{wellName}</span>
          <span className="font-mono text-[11px] text-steam-4">{wellMeta}</span>
        </span>
        <IconSelector size={16} className="text-steam-4" />
      </button>
      <nav aria-label="Console" className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const on = href === active;
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-[11px] rounded-xl px-3 text-sm transition-colors ${on ? 'bg-white/[0.06] text-steam' : 'text-steam-3 hover:bg-white/5 hover:text-steam'}`}
            >
              <Icon size={17} />
              {label}
              {on && <span className="ml-auto size-1.5 rounded-full bg-heat-6" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-line bg-ink-1">
          <div className="relative h-[132px]">
            <CoreColumn />
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2.5 font-mono text-[11px]">
            <span className="inline-flex items-center gap-[7px] text-steam-2"><span className="m-pulse-productive size-1.5 rounded-full bg-productive" />{depthLabel}</span>
            <span className="text-steam-4">{dateLabel}</span>
          </div>
        </div>
        <button type="button" onClick={onUpload} className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed border-white/15 px-3 py-4 text-steam-2 transition-colors hover:border-white/30 hover:text-steam">
          <IconUpload size={18} />
          <span className="text-[13px]">Drop a daily report</span>
          <span className="font-mono text-[10.5px] text-steam-4">PDF · CSV · XLSX · TXT · 8 MB</span>
        </button>
      </div>
    </aside>
  );
}
