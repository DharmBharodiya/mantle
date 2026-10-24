"use client";
import {Activity,ChartNoAxesCombined,FileText,LayoutDashboard,RadioTower,Settings2} from "lucide-react";
const items=[
  {label:"Overview",icon:LayoutDashboard},
  {label:"Shift events",icon:FileText},
  {label:"Benchmarks",icon:ChartNoAxesCombined},
  {label:"Field dispatch",icon:RadioTower}
];
export function Sidebar({active,onNavigate}:{active:string;onNavigate:(value:string)=>void}) {
  return <aside className="card flex w-full shrink-0 flex-col gap-6 px-3 py-5 lg:w-[216px] lg:min-h-[88vh]">
    <div className="flex items-center gap-3 px-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#171D2A] text-white"><Activity size={22}/></div>
      <div><div className="text-[18px] font-bold tracking-[-.05em]">BoreSight<span className="text-orange">.</span></div><div className="micro mt-[-2px]">Field intelligence</div></div>
    </div>
    <nav aria-label="Main navigation" className="flex gap-1 overflow-auto lg:flex-col">
      {items.map(({label,icon:Icon})=><button key={label} onClick={()=>onNavigate(label)} className={`focus-ring flex w-full min-w-max items-center gap-3 rounded-[13px] px-3 py-3 text-left text-[13px] transition-colors ${active===label?"bg-[#EFEFFE] font-semibold text-[#4E53D9]":"text-[#6E7888] hover:bg-[#F6F7F9]"}`}><Icon size={17}/>{label}</button>)}
    </nav>
    <div className="mt-auto hidden space-y-3 px-2 lg:block">
      <div className="rounded-[15px] bg-[#F6F7FA] p-3"><div className="micro mb-2">Environment</div><div className="text-xs font-semibold">Prototype workspace</div><div className="mt-1 text-[11px] leading-relaxed text-[#8993A3]">No live rig control or safety automation.</div></div>
      <div className="flex items-center gap-2 px-2 text-[12px] text-[#7E8795]"><Settings2 size={15}/> Team settings</div>
    </div>
  </aside>;
}
