"use client";
import { ChartNoAxesCombined, FileCheck2, FileText, LayoutDashboard, RadioTower } from "lucide-react";
const items = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Shift events", icon: FileText },
  { label: "Benchmarks", icon: ChartNoAxesCombined },
  { label: "Source review", icon: FileCheck2 },
  { label: "Field dispatch", icon: RadioTower },
];
export function Sidebar({ active, onNavigate }: { active: string; onNavigate: (value: string) => void }) {
  return <aside className="card dashboard-sidebar">
    <div className="px-3"><div className="text-[24px] font-semibold tracking-[-.06em]">boresight<span className="text-[#5559F7]">.</span></div><div className="micro mt-1 text-[9px]">Geothermal intelligence</div></div>
    <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto lg:flex-col">{items.map(({ label, icon: Icon }) => <button key={label} aria-current={active === label ? "location" : undefined} onClick={() => onNavigate(label)} className={`flex shrink-0 items-center gap-3 rounded-[13px] px-3 py-3 text-left text-xs transition-colors lg:w-full ${active === label ? "bg-[#5559F7] font-semibold text-white" : "text-[#626D7E] hover:bg-[#F6F7F9]"}`}><Icon size={17} aria-hidden="true" />{label}</button>)}</nav>
    <div className="mt-auto hidden px-2 lg:block"><div className="rounded-2xl bg-[#F6F7FA] p-4"><p className="micro mb-2">Sprint 01</p><p className="text-xs font-semibold">Prototype workspace</p><p className="mt-2 text-[11px] leading-5 text-[#667286]">Source evidence first.<br />Human review before action.</p></div></div>
  </aside>;
}
