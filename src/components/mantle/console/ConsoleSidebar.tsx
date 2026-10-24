"use client";
import Link from "next/link";
import { MantleLogo } from "../Logo";
import { IconCompare, IconEye, IconFile, IconGauge, IconGrid, IconUpload } from "../Icons";

const NAV=[{label:"Overview",Icon:IconGrid},{label:"Reports",Icon:IconFile},{label:"Compare",Icon:IconCompare},{label:"Benchmarks",Icon:IconGauge},{label:"Equipment vision",Icon:IconEye}];
/** Adapted kit navigation. Real workspace tabs preserve the current in-memory analyses. */
export function ConsoleSidebar({active,onNavigate,onUpload,wellName,depthLabel,dateLabel}:{active:string;onNavigate:(view:string)=>void;onUpload:()=>void;wellName:string;depthLabel:string;dateLabel:string}) {
  return <aside className="m-console-sidebar"><Link href="/" aria-label="Mantle home" className="flex min-h-11 items-center px-2"><MantleLogo size={24}/></Link><div className="rounded-chip border border-m-line bg-white/[0.015] p-3"><p className="break-words text-sm">{wellName||"Well name unavailable"}</p><p className="mt-1 font-mono text-xs text-steam-4">{dateLabel||"Date unavailable"}</p></div><nav aria-label="Workspace navigation" className="flex flex-col gap-1">{NAV.map(({label,Icon})=><button key={label} aria-current={label===active?"page":undefined} onClick={()=>onNavigate(label)} className={`flex min-h-11 items-center gap-3 rounded-chip px-3 text-left text-sm ${label===active?"bg-white/5 text-steam":"text-steam-3 hover:bg-white/5"}`}><Icon size={17}/>{label}{label===active&&<span className="ml-auto size-1.5 rounded-full bg-heat-6"/>}</button>)}</nav><div className="mt-auto border-t border-m-line pt-5"><p className="mb-4 font-mono text-xs text-steam-4">Hole depth · {depthLabel}</p><button className="m-btn-ghost w-full justify-center" onClick={onUpload}><IconUpload/>Choose report</button><p className="mt-3 text-center font-mono text-xs text-steam-4">PDF · CSV · XLSX · TXT · 8 MB</p></div></aside>;
}
