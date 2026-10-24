"use client";
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, GitCompareArrows, LayoutDashboard, ScanEye, Waves } from "lucide-react";
const items = [{ label: "Overview", icon: LayoutDashboard }, { label: "Reports", icon: BookOpen }, { label: "Compare", icon: GitCompareArrows }, { label: "Benchmarks", icon: ChartNoAxesCombined }, { label: "Equipment vision", icon: ScanEye }];
export function Sidebar({ active, onNavigate }: {
    active: string;
    onNavigate: (value: string) => void;
}) {
    return <aside className="card dashboard-sidebar"><div className="brand"><div className="brand-name">boresight<span>.</span></div><p className="eyebrow">Geothermal intelligence</p></div><nav className="sidebar-nav" aria-label="Workspace navigation">{items.map(({ label, icon: Icon }) => <button key={label} aria-current={active === label ? "page" : undefined} onClick={() => onNavigate(label)} className={`nav-button ${active === label ? "active" : ""}`}><Icon size={16} aria-hidden="true"/>{label}</button>)}</nav><div className="sidebar-footer"><Waves size={20} color="#94A3FF"/><p className="caption">Evidence before inference.</p><p className="eyebrow" style={{ marginTop: 14 }}>Local prototype <ArrowUpRight size={10} style={{ display: "inline" }}/></p><p className="caption">Human review required.<br />No autonomous field control.</p></div></aside>;
}
