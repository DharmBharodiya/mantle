"use client";
import Link from "next/link";
import { ConsoleSidebar } from "@/components/mantle/console/ConsoleSidebar";
import { ConsoleOverview } from "@/components/mantle/console/ConsoleOverview";
import { KpiStrip } from "@/components/mantle/console/KpiStrip";
import { latestHoleDepth } from "@/components/dashboard/report-view";
import { takeConsoleReport, readConsoleSession, saveConsoleSession } from "@/lib/mantle/console-handoff";
import { useEffect, useRef, useState } from "react";
import { ReportDayReviewError, type ReportDaySelection as DaySelection } from "@/types/report-day";
import { ReportDaySelection } from "@/components/mantle/ReportDaySelection";
import { INGESTION_STAGE_LABELS } from "@/types/ingestion";
import type { Scenario } from "@/types/telemetry";
import { DEMO_REPORT } from "@/data/demo-report";
import { ScenarioPanel } from "@/components/dashboard/ScenarioPanel";
import { ReportsPanel, type SavedReport } from "@/components/dashboard/ReportsPanel";
import { ComparePanel } from "@/components/dashboard/ComparePanel";
import { VisionPanel } from "@/components/dashboard/VisionPanel";
import { PrintSummary } from "@/components/dashboard/PrintSummary";
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
    const [dayReview, setDayReview] = useState<{file: File; error: ReportDayReviewError} | null>(null);
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
    const sessionRef = useRef({ reports, reportId });
    const initialized = useRef(false);
    sessionRef.current = { reports, reportId };
    useEffect(() => {
        // Strict Mode replays effects. Restore/consume the handoff once per mount.
        if (!initialized.current) {
            initialized.current = true;
            const previousSession = readConsoleSession();
            if (previousSession) { setReports(previousSession.reports); setReportId(previousSession.reportId); }
            const incoming = takeConsoleReport();
            if (incoming) {
                const id = crypto.randomUUID();
                setReports(previous => boundedReports(previous, { id, ...incoming }));
                setReportId(id);
                setStatus(`Report ready — Imported ${incoming.fileName}: ${incoming.report.events.length} events. ${sourceLabels[incoming.report.sourceKind]}.`);
            }
            try { setSummaries(readSummaries(localStorage.getItem(STORAGE_KEY))); }
            catch (cause) { setStorageError(cause instanceof Error ? cause.message : "Browser summary history could not be read."); }
        }
        return () => { request.current?.abort(); saveConsoleSession(sessionRef.current); };
    }, []);
    function inspectEvent(id: string) {
        setEventId(id);
        requestAnimationFrame(() => {
            const evidence = document.getElementById("selected-evidence");
            evidence?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
            evidence?.focus({ preventScroll: true });
        });
    }
    function navigate(next: string) { setView(next); setEventId(""); requestAnimationFrame(() => { heading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); heading.current?.focus({ preventScroll: true }); }); }
    function stopWaiting() { setDayReview(null); request.current?.abort(); request.current = null; setUploading(false); setScenarioBusy(false); setError(""); setStatus("Stopped waiting. Your report is unchanged. Gemini may still process an already accepted request."); if (fileInput.current)
        fileInput.current.value = ""; }
    function resetDemo() { setDayReview(null); request.current?.abort(); request.current = null; setUploading(false); setScenarioBusy(false); setReports(previous => [demoEntry, ...previous.filter(item => item.id !== "demo")]); setReportId("demo"); setView("Overview"); setEventId(""); setError(""); setStatus("Synthetic demo restored with its original assumptions."); if (fileInput.current)
        fileInput.current.value = ""; }
    function selectReport(id: string) { if (busy)
        return; setReportId(id); setEventId(""); setError(""); setStatus(""); setView("Overview"); }
    async function upload(file: File, selection?: DaySelection) {
        if (busy)
            return;
        if (!selection) setDayReview(null);
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
        setStatus(`Uploading document: ${file.name}. Your current report remains available.`);
        const dispose = watchUpload(controller, () => { if (request.current === controller)
            setStatus("Still waiting for the report service. No result is assumed before the current stage finishes."); });
        try {
            const next = await ingestReport(file, controller.signal, progress => {
                if (request.current === controller && !controller.signal.aborted) setStatus(`${INGESTION_STAGE_LABELS[progress.stage]}${progress.totalChunks ? ` · ${progress.completedChunks} of ${progress.totalChunks} sections complete` : ""}. Your current report remains available.`);
            }, selection);
            if (request.current !== controller || controller.signal.aborted)
                return;
            if (!next.events.length)
                throw new Error("No drilling events found. Choose a daily drilling report with explicit time intervals.");
            setDayReview(null);
            const id = crypto.randomUUID();
            setReports(previous => boundedReports(previous, { id, report: next, fileName: file.name }));
            setReportId(id);
            setView("Overview");
            setEventId("");
            setStatus(`Report ready — Imported ${file.name}: ${next.events.length} events. ${sourceLabels[next.sourceKind]}.`);
        }
        catch (cause) {
            if (request.current === controller) {
                if (cause instanceof ReportDayReviewError && /\.pdf$/i.test(file.name)) setDayReview({file, error: cause});
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
    function exportCsv() { saveDownload(exportEventsCsv(report), `mantle-${report.reportDate || "undated"}-events.csv`, "text/csv;charset=utf-8"); setStatus("Event CSV exported with provenance and scenario assumptions."); }
    function exportJson() { saveDownload(exportSnapshot(report), `mantle-${report.reportDate || "undated"}-analysis.json`, "application/json"); setStatus("Analysis snapshot exported. It includes evidence excerpts; store it appropriately."); }
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
    const titles: Record<string, string> = {Overview: report.wellName || "Report overview", Reports: "Reports", Compare: "Compare reports", Benchmarks: "Scenario assumptions", "Equipment vision": "Equipment vision"};
    const selectedId = report.events.some(event => event.id === eventId) ? eventId : report.events.find(event => event.classification === "NPT")?.id ?? report.events[0]?.id;
    return <div className="mantle-page mantle-console min-h-screen bg-m-ink font-sans text-steam antialiased"><a href="#workspace-title" className="m-skip">Skip to workspace</a><div className="m-console-layout"><ConsoleSidebar active={view} onNavigate={navigate} onUpload={() => fileInput.current?.click()} wellName={report.wellName} depthLabel={latestHoleDepth(report) === null ? "Not available" : `${latestHoleDepth(report)?.toLocaleString("en-US")} ft`} dateLabel={report.reportDate}/><main className="m-console-main">
      <div className="m-console-topbar"><div className="flex flex-wrap items-center gap-2 text-sm text-steam-4"><Link href="/">Mantle home</Link><span aria-hidden="true">/</span><span>{view}</span></div><div className="flex flex-wrap gap-2"><button className="m-btn-ghost" onClick={resetDemo}>Reset demo</button><button className="m-btn-ghost" onClick={exportCsv}>Export CSV</button><button className="m-btn-ghost" onClick={exportJson}>Export JSON</button><button className="m-btn-ghost" onClick={() => window.print()}>Print</button><button className="m-btn-primary" disabled={busy} onClick={() => fileInput.current?.click()}>{uploading ? "Analyzing…" : "Upload report"}</button></div></div>
      <header className="mb-7 mt-7"><h1 id="workspace-title" ref={heading} tabIndex={-1} className="text-4xl font-medium tracking-tight">{titles[view]}</h1><p className="mt-3 font-mono text-xs text-steam-4">{report.reportDate || "Date unavailable"} · {report.events.length} source events · {view === "Overview" ? "Report overview" : report.wellName || "Well name unavailable"}</p></header>
      <input ref={fileInput} type="file" accept=".pdf,.csv,.xlsx,.txt" className="hidden" aria-label="Choose drilling report" onChange={event => { const file=event.target.files?.[0]; if(file) void upload(file); }}/><input ref={snapshotInput} type="file" accept=".json" className="hidden" aria-label="Import Mantle analysis snapshot" onChange={event => { const file=event.target.files?.[0]; if(file) void loadSnapshot(file); }}/>
      {view !== "Equipment vision" && <section className={`m-report-bar ${dragging ? "m-prompt-drag" : ""}`} aria-label="Selected report and upload drop area" onDragOver={event => {event.preventDefault(); if(!busy) setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={event => {event.preventDefault();setDragging(false);if(busy)return;if(event.dataTransfer.files.length !== 1){setError("Upload one drilling report at a time.");return;}const file=event.dataTransfer.files[0];if(file)void upload(file);}}><div className="min-w-0 flex-1"><label htmlFor="active-report" className="mb-2 block text-sm text-steam-4">Selected report</label><select className="w-full" id="active-report" disabled={busy} value={reportId} onChange={event=>selectReport(event.target.value)}>{reports.map(item=><option key={item.id} value={item.id}>{item.report.wellName||"Unnamed well"} · {item.report.reportDate||"Date unknown"} · {item.fileName}</option>)}</select></div><p className="text-sm text-steam-4">Drop PDF, CSV, XLSX or TXT · 8 MB max</p></section>}
      {status && <div className="m-status my-5"><p role="status">{status}</p>{busy && <button className="m-btn-ghost mt-3" onClick={stopWaiting}>Stop waiting</button>}</div>}{error && <div role="alert" className="m-status my-5"><strong>Report could not be imported</strong><p className="mt-2">{error}</p><button className="m-btn-ghost mt-3" disabled={busy} onClick={()=>fileInput.current?.click()}>Choose a drilling report to retry</button></div>}{storageError && <div role="alert" className="m-status my-5"><p>{storageError}</p><button className="m-btn-ghost mt-3" onClick={clearSummaries}>Clear browser summaries</button></div>}
      {dayReview && <ReportDaySelection key={dayReview.error.requestId} review={dayReview.error.review} fileName={dayReview.file.name} requestId={dayReview.error.requestId} busy={busy} onAnalyze={selection => upload(dayReview.file, selection)} onDismiss={() => {setDayReview(null);setError("");}}/>}
      {view === "Overview" && <ConsoleOverview key={reportId} report={report} selectedId={selectedId} onSelect={inspectEvent} onScenario={()=>navigate("Benchmarks")}/>}
      {view === "Reports" && <ReportsPanel reports={reports} selectedId={reportId} summaries={summaries} onSelect={selectReport} onRemove={removeReport} onSave={saveSummary} onDeleteSummary={id=>store(summaries.filter(summary=>summary.id!==id))} onClearSummaries={clearSummaries} onImport={()=>snapshotInput.current?.click()} onExport={exportJson}/>}
      {view === "Compare" && <ComparePanel summaries={compareSummaries}/>}
      {view === "Benchmarks" && <div className="stack"><ScenarioPanel key={reportId} report={report} busy={busy} onApply={applyScenario}/><section className="m-panel"><h2>Compare assumptions on the same source</h2><p className="mt-3 text-sm text-steam-3">Create a copy, adjust its scenario, then compare the analyses.</p><button className="m-btn-ghost mt-4" onClick={copyScenario} disabled={busy}>Copy for scenario</button></section><KpiStrip report={report}/></div>}
      {view === "Equipment vision" && <VisionPanel/>}
      <footer className="m-trust-note"><p>Mantle · {report.sourceKind === "SYNTHETIC_DEMO" ? "SYNTHETIC DEMO — illustrative events, not actual field records." : report.sourceKind === "HUMAN_VERIFIED" ? "Human-reviewed source." : "Uploaded source · UNVERIFIED until checked against the original."} Classifications come from the report. Flat hole depth alone does not prove downtime. ILT, financial exposure and CO₂ are scenario estimates, not audited losses or measured emissions. Human review required.</p>{report.warnings.length>0&&<details className="mt-3"><summary>Source warnings ({report.warnings.length})</summary><ul className="mt-3 list-disc pl-5">{report.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul></details>}</footer>
    </main></div><PrintSummary report={report} fileName={saved.fileName}/></div>;
}