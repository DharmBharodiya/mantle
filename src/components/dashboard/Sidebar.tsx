"use client";
import { ConsoleSidebar } from "@/components/mantle/console/ConsoleSidebar";
/** Compatibility entry point for consumers of the original sidebar. */
export function Sidebar({ active, onNavigate }: {active:string;onNavigate:(value:string)=>void}) {
  return <ConsoleSidebar active={active} onNavigate={onNavigate} onUpload={()=>document.querySelector<HTMLInputElement>('input[aria-label="Choose drilling report"]')?.click()} wellName="" depthLabel="Not available" dateLabel=""/>;
}