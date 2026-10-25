"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Landing } from "./Landing";
import type { ReportDaySelection } from "@/types/report-day";
import { ingestReport } from "@/components/dashboard/report-view";
import { watchUpload } from "@/components/dashboard/upload-deadline";
import { INGESTION_STAGE_LABELS } from "@/types/ingestion";
import { stageConsoleReport } from "@/lib/mantle/console-handoff";
export function HomeLanding() {
  const router = useRouter();
  const controller = useRef<AbortController | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => () => controller.current?.abort(), []);
  async function analyze({ text, file, selection }: { text: string; file: File | null; selection?: ReportDaySelection }) {
    const source = file ?? new File([text], "pasted-drilling-report.txt", { type: "text/plain" });
    const request = new AbortController();
    controller.current?.abort();
    controller.current = request;
    setStatus("Uploading document…");
    const dispose = watchUpload(request, () => setStatus("Waiting for the current report stage. Your source is still being processed."));
    try {
      const report = await ingestReport(source, request.signal, progress => {
        if (controller.current === request && !request.signal.aborted) setStatus(`${INGESTION_STAGE_LABELS[progress.stage]}${progress.totalChunks ? ` · ${progress.completedChunks} of ${progress.totalChunks} sections complete` : ""}`);
      }, selection);
      if (controller.current !== request || request.signal.aborted) return;
      if (!report.events.length) throw new Error("No drilling activities found. Attach a daily drilling report with explicit time intervals.");
      stageConsoleReport(report, file?.name ?? "Pasted drilling report");
      setStatus("Report ready. Opening console…");
      router.push("/console");
    } catch (error) {
      setStatus("");
      if (request.signal.aborted) throw new Error("Stopped waiting. No report was imported; the provider may still process the request.");
      throw error;
    } finally {
      dispose();
      if (controller.current === request) controller.current = null;
    }
  }
  return <Landing consoleHref="/console" onAnalyze={analyze} uploadStatus={status} onCancel={() => controller.current?.abort()} />;
}
