'use client';
import type { EventMetrics } from '@/lib/mantle/report';
import { fmtClock } from '@/lib/mantle/report';
import { cn } from '@/lib/mantle/cn';
export interface ShiftStripProps { events: EventMetrics[]; selectedId?: string; onSelect?: (id:string)=>void; height?:number; className?:string }
export function ShiftStrip({events, selectedId, onSelect, height=26, className}:ShiftStripProps) {
  return <div className={cn('relative',className)} style={{height:onSelect?44:height}}>{events.map(event => {
    const selected=event.id===selectedId;
    const label=`${fmtClock(event.start)}–${fmtClock(event.end)} ${event.operation}, ${event.cls==='npt'?'NPT':event.ilt>0?'productive with ILT opportunity':'productive'}`;
    const classes=cn('m-seg absolute bottom-0 rounded-[5px]',event.cls==='npt'?'bg-npt':event.kind==='flat'?'bg-productive-flat':'bg-productive',event.ilt>0&&'shadow-[inset_0_-6px_0_var(--m-ilt)]');
    const width=`${event.hours/24*100}%`;
    const left=`${event.start/24*100}%`;
    if(!onSelect)return <span key={event.id} role="img" aria-label={label} className={classes} style={{left,width,height}}/>;
    return <button key={event.id} type="button" aria-label={label} aria-pressed={selected} title={label} onClick={()=>onSelect(event.id)} className="absolute bottom-0 min-h-11" style={{left,width,height:44,background:'transparent'}}><span aria-hidden="true" className={classes} style={{left:0,width:'100%',height:height+6,outline:selected?'1px solid var(--m-steam)':'none'}}/></button>;
  })}</div>;
}
