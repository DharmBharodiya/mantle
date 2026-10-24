"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, ChevronRight, CloudUpload, Copy, FileJson, Layers3, LoaderCircle, Printer, RefreshCcw, ShieldCheck } from "lucide-react";
import type { Scenario } from "@/types/telemetry";
import { DEMO_REPORT } from "@/data/demo-report";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KpiStrip, usd } from "@/components/dashboard/KpiStrip";
import { DepthChart } from "@/components/dashboard/DepthChart";
import { RigHealth } from "@/components/dashboard/RigHealth";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ScenarioPanel } from "@/components/dashboard/ScenarioPanel";
import { ReportsPanel, type SavedReport } from "@/components/dashboard/ReportsPanel";
import { ComparePanel } from "@/components/dashboard/ComparePanel";
import { VisionPanel } from "@/components/dashboard/VisionPanel";
import { PrintSummary } from "@/components/dashboard/PrintSummary";
import { Bottlenecks } from "@/components/analytics/Bottlenecks";
import { EventTable } from "@/components/analytics/EventTable";
import { EventDrawer } from "@/components/analytics/EventDrawer";
import { ingestReport, readReport, sourceLabels, validateUpload } from "@/components/dashboard/report-view";
import { watchUpload } from "@/components/dashboard/upload-deadline";
import { addSummary, exportEventsCsv, exportSnapshot, importSnapshot, readSummaries, STORAGE_KEY, summarizeReport, type ReportSummary } from "@/lib/reports/manage";
const demoEntry: SavedReport = { id: "demo", report: DEMO_REPORT, fileName: "Built-in synthetic sample" };
function boundedReports(previous: SavedReport[], entry: SavedReport): SavedReport[] { return [previous.find(item => item.id === "demo") ?? demoEntry, ...previous.filter(item => item.id !== "demo").concat(entry).slice(-19)]; }
function saveDownload(contents: string, fileName: string, type: string) { const url = URL.createObjectURL(new Blob([contents], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export default function Home() {
    const [reports, setReports] = useState<SavedReport[]>([demoEntry]);
    const [reportId, setReportId] = useState("demo");
    const [view, setView] = useState("Overview");
    const [eventId, setEventId] = useState("");
    const [uploading, setUploading] = useState(false);
    const [scenarioBusy, setScenarioBusy] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [dragging, setDragging] = useState(false);
    const [summaries, setSummaries] = useState<ReportSummary[]>([]);
    const [storageError, setStorageError] = useState("");
    const fileInput = useRef<HTMLInputElement>(null);
    const snapshotInput = useRef<HTMLInputElement>(null);
    const request = useRef<AbortController | null>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const saved = reports.find(item => item.id === reportId) ?? reports[0];
    const report = saved.report;
    const busy = uploading || scenarioBusy;
    useEffect(() => { try {
        setSummaries(readSummaries(localStorage.getItem(STORAGE_KEY)));
    }
    catch (cause) {
        setStorageError(cause instanceof Error ? cause.message : "Browser summary history could not be read.");
    } return () => request.current?.abort(); }, []);
    function navigate(next: string) { setView(next); setEventId(""); requestAnimationFrame(() => { heading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); heading.current?.focus({ preventScroll: true }); }); }
    function stopWaiting() { request.current?.abort(); request.current = null; setUploading(false); setScenarioBusy(false); setError(""); setStatus("Stopped waiting. Your report is unchanged. Gemini may still process an already accepted request."); if (fileInput.current)
        fileInput.current.value = ""; }
    function resetDemo() { request.current?.abort(); request.current = null; setUploading(false); setScenarioBusy(false); setReports(previous => [demoEntry, ...previous.filter(item => item.id !== "demo")]); setReportId("demo"); setView("Overview"); setEventId(""); setError(""); setStatus("Synthetic demo restored with its original assumptions."); if (fileInput.current)
        fileInput.current.value = ""; }
    function selectReport(id: string) { if (busy)
        return; setReportId(id); setEventId(""); setError(""); setStatus(""); setView("Overview"); }
    async function upload(file: File) {
        if (busy)
            return;
        const invalid = validateUpload(file);
        if (invalid) {
            setError(invalid);
            if (fileInput.current)
                fileInput.current.value = "";
            return;
        }
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setUploading(true);
        setError("");
        setStatus(`Analyzing ${file.name}. Your current report remains available.`);
        const dispose = watchUpload(controller, () => { if (request.current === controller)
            setStatus("Still waiting for Gemini. Detailed report extraction can take several minutes. No result is assumed before the service responds."); });
        try {
            const next = await ingestReport(file, controller.signal);
            if (request.current !== controller || controller.signal.aborted)
                return;
            if (!next.events.length)
                throw new Error("No drilling events found. Choose a daily drilling report with explicit time intervals.");
            const id = crypto.randomUUID();
            setReports(previous => boundedReports(previous, { id, report: next, fileName: file.name }));
            setReportId(id);
            setView("Overview");
            setEventId("");
            setStatus(`Imported ${file.name}: ${next.events.length} events. ${sourceLabels[next.sourceKind]}.`);
        }
        catch (cause) {
            if (request.current === controller) {
                setStatus("");
                setError(controller.signal.aborted ? "The report service did not respond within five minutes. Your previous report is unchanged." : `${cause instanceof Error ? cause.message : "Upload failed."} Current report preserved.`);
            }
        }
        finally {
            dispose();
            if (request.current === controller) {
                request.current = null;
                setUploading(false);
                if (fileInput.current)
                    fileInput.current.value = "";
            }
        }
    }
    async function applyScenario(scenario: Scenario) {
        const controller = new AbortController();
        request.current = controller;
        setScenarioBusy(true);
        const id = reportId;
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ extraction: { wellName: report.wellName, reportDate: report.reportDate, events: report.events, warnings: report.warnings }, scenario, sourceKind: report.sourceKind }), signal: controller.signal });
            const body = await response.json();
            if (!response.ok)
                throw new Error(body.error ?? "Scenario recalculation failed.");
            const next = readReport(body);
            if (request.current !== controller || controller.signal.aborted)
                return;
            setReports(previous => previous.map(item => item.id === id ? { ...item, report: next } : item));
            setStatus("Scenario recalculated from the same source events. No Gemini call was made.");
        }
        catch (cause) {
            if (request.current === controller)
                throw new Error(controller.signal.aborted ? "Scenario calculation timed out; previous values retained." : cause instanceof Error ? cause.message : "Scenario recalculation failed.");
        }
        finally {
            clearTimeout(timer);
            if (request.current === controller) {
                request.current = null;
                setScenarioBusy(false);
            }
        }
    }
    function store(next: ReportSummary[]) { try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSummaries(next);
        setStorageError("");
        return true;
    }
    catch {
        setStorageError("Browser summary storage is unavailable or full. Export a JSON analysis snapshot instead.");
        return false;
    } }
    function saveSummary(id: string) { const entry = reports.find(item => item.id === id); if (entry && store(addSummary(summaries, summarizeReport(entry.report, id))))
        setStatus("Aggregate summary saved in this browser. Full evidence remains in this tab or an exported JSON snapshot."); }
    function clearSummaries() { try {
        localStorage.removeItem(STORAGE_KEY);
        setSummaries([]);
        setStorageError("");
        setStatus("Browser-local summaries cleared.");
    }
    catch {
        setStorageError("This browser does not allow local storage access.");
    } }
    function removeReport(id: string) { if (busy)
        return; setReports(previous => previous.filter(item => item.id !== id)); if (reportId === id) {
        setReportId(reports.find(item => item.id !== id)?.id ?? "demo");
        setEventId("");
    } setStatus("Report removed from this tab. Saved aggregate summaries are managed separately."); }
    function copyScenario() { if (busy)
        return; const id = crypto.randomUUID(); setReports(previous => boundedReports(previous, { id, report: structuredClone(report), fileName: `Scenario copy · ${saved.fileName}` })); setReportId(id); setEventId(""); setView("Benchmarks"); setStatus("Scenario copy created from the same source. Apply different assumptions, then compare the two analyses."); }
    function exportCsv() { saveDownload(exportEventsCsv(report), `boresight-${report.reportDate || "undated"}-events.csv`, "text/csv;charset=utf-8"); setStatus("Event CSV exported with provenance and scenario assumptions."); }
    function exportJson() { saveDownload(exportSnapshot(report), `boresight-${report.reportDate || "undated"}-analysis.json`, "application/json"); setStatus("Analysis snapshot exported. It includes evidence excerpts; store it appropriately."); }
    async function loadSnapshot(file: File) { if (busy)
        return; try {
        if (file.size > 2 * 1024 * 1024)
            throw new Error("Analysis snapshot must be under 2 MB.");
        const next = importSnapshot(await file.text());
        const id = crypto.randomUUID();
        setReports(previous => boundedReports(previous, { id, report: next, fileName: file.name }));
        setReportId(id);
        setView("Overview");
        setEventId("");
        setError("");
        setStatus("Analysis snapshot imported and metrics recalculated. Uploaded-source verification has not been promoted.");
    }
    catch (cause) {
        setError(cause instanceof Error ? cause.message : "Invalid analysis snapshot.");
    }
    finally {
        if (snapshotInput.current)
            snapshotInput.current.value = "";
    } }
    const memorySummaries = reports.map(item => summarizeReport(item.report, item.id));
    const compareSummaries = [...memorySummaries, ...summaries.filter(summary => !reports.some(item => item.id === summary.id))];
    const titles: Record<string, {
        title: string;
        description: string;
    }> = { Overview: { title: "Clarity below the surface.", description: "From daily drilling reports to evidence-backed operational intelligence." }, Reports: { title: "Every report. One workspace.", description: "Switch analyses, preserve evidence, and keep a small browser-local summary history." }, Compare: { title: "Context makes the difference.", description: "Compare observed time, depth and assumptions without claiming equivalent geology." }, Benchmarks: { title: "Assumptions, in the open.", description: "Explore the economics of time with deterministic, reviewable scenario calculations." }, "Equipment vision": { title: "Observe. Verify. Understand.", description: "Cautious visual observations for qualified review — never an automatic diagnosis." } };
    return <><div className="dashboard-shell"><a href="#workspace-title" className="skip-link">Skip to workspace</a><Sidebar active={view} onNavigate={navigate}/><main className="workspace stack"><div><div className="topbar"><div className="topbar-left"><Layers3 size={14}/><span>Operations workspace</span><ChevronRight size={12}/>{view}</div><span className="eyebrow">Local prototype · human review</span></div><header className="hero"><div><p className="eyebrow">BoreSight / {view}</p><h1 id="workspace-title" ref={heading} tabIndex={-1}>{titles[view].title}</h1><p className="description">{titles[view].description}</p></div><div className="hero-actions"><button className="secondary-button" onClick={resetDemo}><RefreshCcw size={14}/>Reset demo</button><button className="primary-button" disabled={busy} onClick={() => fileInput.current?.click()}>{uploading ? <LoaderCircle size={15} className="animate-spin"/> : <CloudUpload size={15}/>} {uploading ? "Analyzing…" : "Upload report"}</button></div></header></div>
    <input ref={fileInput} type="file" accept=".pdf,.csv,.xlsx,.txt" className="hidden" aria-label="Choose drilling report" onChange={event => { const file = event.target.files?.[0]; if (file)
        void upload(file); }}/><input ref={snapshotInput} type="file" accept=".json" className="hidden" aria-label="Import BoreSight analysis snapshot" onChange={event => { const file = event.target.files?.[0]; if (file)
        void loadSnapshot(file); }}/>
    {view !== "Equipment vision" && <><section className={`card context-bar upload-zone ${dragging ? "dragging" : ""}`} aria-label="Selected report and upload drop area" onDragOver={event => { event.preventDefault(); if (!busy)
        setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (busy)
        return; if (event.dataTransfer.files.length !== 1) {
        setError("Upload one drilling report at a time.");
        return;
    } const file = event.dataTransfer.files[0]; if (file)
        void upload(file); }}><div className="context-main"><label htmlFor="active-report" className="eyebrow">Selected well / report</label><select id="active-report" disabled={busy} value={reportId} onChange={event => selectReport(event.target.value)}>{reports.map(item => <option key={item.id} value={item.id}>{item.report.wellName || "Unnamed well"} · {item.report.reportDate || "Date unknown"} · {item.fileName}</option>)}</select><div className="context-meta"><span>{report.reportDate || "Date unavailable"}</span><span>{report.events.length} source events</span><span className={`badge ${report.sourceKind === "SYNTHETIC_DEMO" ? "demo" : "upload"}`}>{sourceLabels[report.sourceKind]}</span></div></div><div><div className="row"><button className="secondary-button" onClick={exportCsv}><ArrowDownToLine size={14}/>CSV</button><button className="secondary-button" onClick={exportJson}><FileJson size={14}/>JSON</button><button className="icon-button" aria-label="Print operational summary" title="Print operational summary" onClick={() => window.print()}><Printer size={15}/></button></div><p className="drop-hint">Drop PDF, CSV, XLSX or TXT here · 8 MB max</p></div></section><section className={`source-banner ${report.sourceKind === "SYNTHETIC_DEMO" ? "" : "upload"}`} aria-label="Source provenance"><div className="row"><ShieldCheck size={14}/><strong>{report.sourceKind === "SYNTHETIC_DEMO" ? "SYNTHETIC_DEMO — Illustrative events; not actual Utah FORGE records." : "AI-extracted source — UNVERIFIED until a human checks the original evidence."}</strong></div><p>Financial exposure and fuel/CO₂ are scenario models. They are not audited losses or measured emissions.</p><details><summary>Source warnings ({report.warnings.length})</summary><ul style={{ paddingLeft: 18, margin: "8px 0 0" }}>{report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details></section></>}
    {status && <div className="upload-status"><p role="status">{status}</p>{busy && <><div className="skeleton"/><button className="ghost-button" style={{ marginTop: 10 }} onClick={stopWaiting}>Stop waiting</button></>}</div>}{error && <div role="alert" className="upload-error"><strong>Report could not be imported</strong><p>{error}</p><button className="ghost-button" disabled={busy} style={{ marginTop: 10 }} onClick={() => fileInput.current?.click()}>Choose a drilling report to retry</button></div>}{storageError && <div role="alert" className="notice"><p>{storageError}</p><button className="ghost-button" onClick={clearSummaries}>Clear browser summaries</button></div>}
    {view === "Overview" && <><KpiStrip report={report}/><div className="dashboard-grid"><div className="dashboard-wide"><DepthChart key={reportId} report={report} selectedId={eventId} onSelect={setEventId}/></div><div className="dashboard-narrow"><RigHealth report={report}/></div></div><ActivityTimeline report={report} onSelect={setEventId}/><div className="dashboard-grid"><div className="dashboard-wide stack"><Bottlenecks report={report} onSelect={setEventId}/><EventTable key={reportId} report={report} onSelect={setEventId}/></div><div className="dashboard-narrow stack"><section className="card panel"><div className="panel-head"><div><p className="eyebrow">Model with explicit assumptions</p><h2>Economic scenario</h2></div></div><p className="kpi-value number">{usd(report.metrics.estimatedLossUsd)}</p><p className="caption" style={{ marginTop: 10 }}>Total estimated time exposure · NPT + supported drilling ILT</p><dl className="time-legend panel-divider"><div><dt>Rig day rate</dt><dd>{usd(report.scenario.rigDailyUsd)}</dd></div><div><dt>Drilling benchmark</dt><dd>{report.scenario.drillBenchmarkFtPerHour} ft/h</dd></div><div><dt>Incremental fuel</dt><dd>{report.scenario.excessFuelGallonsPerHour === null ? "Unknown" : `${report.scenario.excessFuelGallonsPerHour} gal/h`}</dd></div></dl><button className="secondary-button full-width" style={{ marginTop: 20 }} onClick={() => navigate("Benchmarks")}>Review assumptions <ArrowRight size={14}/></button></section><section className="card panel"><p className="eyebrow">Review before relying</p><h2 style={{ marginTop: 7 }}>Evidence & uncertainty</h2><ul className="quality-list"><li>{report.metrics.unknownMinutes} observed minutes have unknown classification.</li><li>{report.metrics.unobservedMinutes} minutes of the report day are unobserved.</li><li>{report.events.filter(event => event.confidence === "LOW").length} events have low extraction confidence.</li><li>{report.events.filter(event => !event.evidence.snippet).length} events have no verifiable excerpt.</li></ul><p className="caption panel-divider">Flat hole depth does not prove downtime. AI interpretations require source review.</p></section></div></div></>}
    {view === "Reports" && <ReportsPanel reports={reports} selectedId={reportId} summaries={summaries} onSelect={selectReport} onRemove={removeReport} onSave={saveSummary} onDeleteSummary={id => store(summaries.filter(summary => summary.id !== id))} onClearSummaries={clearSummaries} onImport={() => snapshotInput.current?.click()} onExport={exportJson}/>}
    {view === "Compare" && <ComparePanel summaries={compareSummaries}/>}
    {view === "Benchmarks" && <><ScenarioPanel key={reportId} report={report} busy={busy} onApply={applyScenario}/><div className="card panel"><div className="row between"><div><h2>Compare assumptions on the same source</h2><p className="caption" style={{ marginTop: 8 }}>Create an in-memory copy, adjust its scenario, and compare both analyses.</p></div><button className="secondary-button" onClick={copyScenario} disabled={busy}><Copy size={14}/>Copy for scenario</button></div></div><KpiStrip report={report}/></>}
    {view === "Equipment vision" && <VisionPanel />}
    <footer className="footer">BoreSight · Evidence-backed geothermal intelligence · Photon + ElevenLabs paused · Human review required</footer>
  </main></div>{eventId && <EventDrawer report={report} eventId={eventId} onClose={() => setEventId("")}/>}<PrintSummary report={report}/></>;
}
