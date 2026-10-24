"use client";
import { IconDownload as Download, IconFile as FileJson, IconFile as FolderOpen, IconSave as Save, IconTrash as Trash2 } from "@/components/mantle/Icons";
import type { WellTelemetryReport } from "@/types/telemetry";
import type { ReportSummary } from "@/lib/reports/manage";
import { sourceLabels } from "./report-view";
export type SavedReport = {
    id: string;
    report: WellTelemetryReport;
    fileName: string;
};
export function ReportsPanel({ reports, selectedId, summaries, onSelect, onRemove, onSave, onDeleteSummary, onClearSummaries, onImport, onExport }: {
    reports: SavedReport[];
    selectedId: string;
    summaries: ReportSummary[];
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onSave: (id: string) => void;
    onDeleteSummary: (id: string) => void;
    onClearSummaries: () => void;
    onImport: () => void;
    onExport: () => void;
}) {
    return <div className="stack"><section className="card panel"><div className="panel-head"><div><h2>Reports & well logs</h2><p className="caption">Full reports stay in this tab. Export an analysis snapshot to retain evidence across sessions.</p></div><div className="row"><button className="secondary-button" onClick={onImport}><FolderOpen size={14}/>Import snapshot</button><button className="secondary-button" onClick={onExport}><FileJson size={14}/>Export selected</button></div></div><div className="report-list">{reports.map(item => <article className={`report-card ${item.id === selectedId ? "active" : ""}`} key={item.id}><span className={`badge ${item.report.sourceKind === "SYNTHETIC_DEMO" ? "demo" : "upload"}`}>{sourceLabels[item.report.sourceKind]}</span><h3>{item.report.wellName || "Well name unavailable"}</h3><p className="caption">{item.report.reportDate || "Report date unavailable"} · {item.fileName}</p><div className="stat-grid"><div><b className="number">{item.report.events.length}</b><span>Events</span></div><div><b className="number">{(item.report.metrics.nptMinutes / 60).toFixed(1)}h</b><span>NPT</span></div><div><b className="number">{item.report.metrics.coveragePct.toFixed(0)}%</b><span>Coverage</span></div></div><div className="row"><button className="secondary-button" onClick={() => onSelect(item.id)}>{item.id === selectedId ? "View selected" : "Open report"}</button><button className="ghost-button" onClick={() => onSave(item.id)}><Save size={13}/>Save summary</button>{item.id !== "demo" && <button className="icon-button" aria-label={`Remove ${item.report.wellName} from this tab`} onClick={() => onRemove(item.id)}><Trash2 size={14}/></button>}</div></article>)}</div></section><section className="card panel"><div className="panel-head"><div><h2>Saved aggregate summaries</h2><p className="caption">Up to 30 summaries. No raw files, event notes, source excerpts or API keys are stored here. Saving is optional on this shared device.</p></div><button className="ghost-button" disabled={!summaries.length} onClick={onClearSummaries}><Trash2 size={13}/>Clear saved</button></div>{summaries.length ? <div className="report-list">{summaries.map(summary => <article key={summary.id} className="report-card"><span className={`badge ${summary.sourceKind === "SYNTHETIC_DEMO" ? "demo" : "upload"}`}>{sourceLabels[summary.sourceKind]}</span><h3>{summary.wellName || "Unnamed well"}</h3><p className="caption">{summary.reportDate || "Date unavailable"} · Summary only</p><p className="caption" style={{ marginTop: 8 }}>{(summary.metrics.nptMinutes / 60).toFixed(1)}h NPT · {summary.metrics.coveragePct.toFixed(1)}% coverage · {summary.eventCount} events</p><button className="ghost-button" style={{ marginTop: 12 }} onClick={() => onDeleteSummary(summary.id)}><Trash2 size={13}/>Delete summary</button></article>)}</div> : <div className="empty-state"><Download size={24} color="var(--m-steam-3)"/><h3>No saved summaries</h3><p>Choose “Save summary” on a report. Use an exported JSON snapshot to preserve full evidence.</p></div>}</section></div>;
}
