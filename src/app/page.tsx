"use client";
import { useEffect, useRef, useState } from "react";
import { CloudUpload, FileCheck2, LoaderCircle, RefreshCcw } from "lucide-react";
import type { WellTelemetryReport } from "@/types/telemetry";
import { DEMO_REPORT } from "@/data/demo-report";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { DepthChart } from "@/components/dashboard/DepthChart";
import { RigHealth } from "@/components/dashboard/RigHealth";
import { ingestReport, sourceLabels, validateUpload } from "@/components/dashboard/report-view";
import { watchUpload } from "@/components/dashboard/upload-deadline";
import { Bottlenecks } from "@/components/analytics/Bottlenecks";
import { EventTable } from "@/components/analytics/EventTable";
import { ShiftBriefing } from "@/components/comms/ShiftBriefing";

type SavedReport = { id: string; report: WellTelemetryReport; fileName: string };
export default function Home() {
  const [reports, setReports] = useState<SavedReport[]>([{ id: "demo", report: DEMO_REPORT, fileName: "Synthetic sample" }]);
  const [reportId, setReportId] = useState("demo");
  const [active, setActive] = useState("Overview");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const saved = reports.find(item => item.id === reportId) ?? reports[0];
  const report = saved.report;
  useEffect(() => () => request.current?.abort(), []);

  function navigate(label: string) {
    setActive(label);
    const targets: Record<string, string> = { Overview: "overview", "Shift events": "shift-log", Benchmarks: "bottlenecks", "Source review": "source-review", "Field dispatch": "comms" };
    const target = document.getElementById(targets[label]);
    target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  }
  function resetDemo() {
    request.current?.abort();
    request.current = null;
    setUploading(false);
    setReportId("demo");
    setError("");
    setStatus("Synthetic demo restored.");
    if (fileInput.current) fileInput.current.value = "";
  }
  function stopWaiting() {
    request.current?.abort();
    request.current = null;
    setUploading(false);
    setError("");
    setStatus("Stopped waiting for analysis. Your previous report is unchanged. The service may still be processing the upload.");
    if (fileInput.current) fileInput.current.value = "";
  }
  async function upload(file: File) {
    const invalid = validateUpload(file);
    if (invalid) { setError(invalid); setStatus(""); if (fileInput.current) fileInput.current.value = ""; return; }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setUploading(true); setError(""); setStatus(`Analyzing ${file.name}. The current dashboard stays available.`);
    const stopDeadline = watchUpload(controller, () => {
      if (request.current === controller) setStatus("Still waiting for the report service. Detailed extraction can take several minutes. Your current report stays available; you can stop waiting at any time.");
    });
    try {
      const next = await ingestReport(file, controller.signal);
      if (controller.signal.aborted || request.current !== controller) return;
      const id = `upload-${++sequence.current}`;
      setReports(previous => [...previous, { id, report: next, fileName: file.name }]);
      setReportId(id); setActive("Overview");
      setStatus(`Imported ${file.name}: ${next.events.length} extracted events. ${sourceLabels[next.sourceKind]}.`);
    } catch (cause) {
      if (request.current !== controller) return;
      setStatus("");
      setError(controller.signal.aborted ? "No analysis response was received within 5 minutes. Your previous report is unchanged. The service may still be processing this upload." : `${cause instanceof Error ? cause.message : "Upload failed."} Current report preserved.`);
    } finally {
      stopDeadline();
      if (request.current === controller) {
        request.current = null; setUploading(false);
        if (fileInput.current) fileInput.current.value = "";
      }
    }
  }
  return <div className="dashboard-shell">
    <a className="skip-link" href="#overview">Skip to dashboard</a>
    <Sidebar active={active} onNavigate={navigate} />
    <main className="min-w-0 space-y-5">
      <header id="overview" tabIndex={-1} className="flex flex-wrap items-center justify-between gap-4 px-1 py-2"><div><p className="micro mb-2">Operations / Overview</p><h1 className="text-[29px] font-semibold tracking-[-.055em] md:text-[35px]">Drilling intelligence<span className="text-[#5559F7]">.</span></h1><p className="mt-2 text-xs text-[#667286]">From raw field reports to operational clarity.</p></div><span className="rounded-full border border-line bg-white px-4 py-2 text-[11px] text-[#667286]">Sprint 01 · Prototype</span></header>
      <section aria-label="Report controls" className="card context-bar">
        <div className="min-w-0 w-full flex-1"><label htmlFor="active-well" className="micro mb-2 block">Active well / report</label><select id="active-well" disabled={uploading} value={reportId} onChange={event => { setReportId(event.target.value); setError(""); setStatus("Report switched."); }} className="w-full min-w-0 max-w-[440px] rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium">{reports.map(item => <option key={item.id} value={item.id}>{item.report.wellName || "Well name unavailable"} · {item.report.reportDate || "Date unavailable"} · {item.fileName}</option>)}</select><p className="mt-2 text-[11px] text-[#667286]">Report date: {report.reportDate || "Unavailable in source"} · {report.events.length} extracted events</p></div>
        <div className="context-actions"><button onClick={resetDemo} className="secondary-button"><RefreshCcw size={14} aria-hidden="true" />Reset demo</button><input ref={fileInput} type="file" aria-label="Choose drilling report" accept=".pdf,.csv,.xlsx,.txt" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); }} /><button disabled={uploading} onClick={() => fileInput.current?.click()} className="primary-button">{uploading ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <CloudUpload size={16} aria-hidden="true" />}{uploading ? "Analyzing report…" : "Upload drilling report"}</button><p className="w-full text-right text-[10px] text-[#667286]">PDF, CSV, XLSX or TXT · up to 8 MB</p></div>
      </section>
      <section id="source-review" tabIndex={-1} aria-label="Report source and assumptions" className={`source-banner ${report.sourceKind === "SYNTHETIC_DEMO" ? "source-demo" : "source-upload"}`}><div className="flex items-center gap-2 font-semibold"><FileCheck2 size={15} aria-hidden="true" />{sourceLabels[report.sourceKind]}</div><p className="mt-1 leading-5">{report.sourceKind === "SYNTHETIC_DEMO" ? "All sample events are illustrative, including the pump repair. These are not real Utah FORGE records." : report.sourceKind === "HUMAN_VERIFIED" ? "This report is marked human verified by the source service. Review event evidence before field action." : "AI extraction from an uploaded document. A human must verify event classifications and source evidence."}</p><p className="mt-1 leading-5">Rig rate, drilling benchmark and fuel differential are scenario assumptions. Dollar exposure and modeled CO₂ are not audited losses or measured emissions.</p>
        {report.warnings.length > 0 && <details className="mt-2"><summary>Source warnings ({report.warnings.length})</summary><ul className="mt-2 list-disc space-y-1 pl-5">{report.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul></details>}
      </section>
      <div className={status ? "upload-status" : "sr-only"}><p role="status" aria-live="polite">{status}</p>{uploading && <button onClick={stopWaiting} className="secondary-button mt-3">Stop waiting</button>}</div>
      {error && <div role="alert" className="upload-error"><p className="font-semibold">Report could not be imported</p><p className="mt-1 [overflow-wrap:anywhere]">{error}</p><button disabled={uploading} onClick={() => fileInput.current?.click()} className="mt-3 underline underline-offset-4">Choose a report to retry</button></div>}
      {!report.events.length && <div className="card p-6 text-sm text-[#667286]"><h2 className="font-semibold text-ink">No events extracted</h2><p className="mt-2">This report contains no usable drilling intervals. Review source warnings, upload another report, or reset the demo.</p></div>}
      <KpiStrip report={report} />
      <div className="dashboard-grid"><div className="dashboard-wide"><DepthChart key={reportId} report={report} /></div><div className="dashboard-narrow"><RigHealth report={report} /></div></div>
      <div className="dashboard-grid"><div className="dashboard-wide min-w-0 space-y-5"><div id="bottlenecks" tabIndex={-1}><Bottlenecks report={report} /><details className="mt-3 px-4 text-xs leading-6 text-[#667286]"><summary>Current scenario assumptions</summary><p>Rig rate: ${report.scenario.rigDailyUsd.toLocaleString("en-US")}/day · Drilling benchmark: {report.scenario.drillBenchmarkFtPerHour} ft/h · Fuel differential: {report.scenario.excessFuelGallonsPerHour === null ? "Unknown" : `${report.scenario.excessFuelGallonsPerHour} gal/h`}.</p><p>Benchmarks depend on formation and well section. These inputs describe the current analysis scenario.</p></details></div><div id="shift-log" tabIndex={-1}><EventTable key={reportId} report={report} /></div></div><div id="comms" tabIndex={-1} className="dashboard-narrow min-w-0"><ShiftBriefing key={reportId} report={report} /></div></div>
      <footer className="px-2 py-3 text-center text-[10px] leading-5 text-[#667286]">BoreSight · Hackathon prototype · Data and estimates require human review.</footer>
    </main>
  </div>;
}
