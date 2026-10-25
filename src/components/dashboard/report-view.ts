import { readReportDayError, type ReportDaySelection } from "../../types/report-day";
import { IngestionMessageSchema, type IngestionMessage } from "../../types/ingestion";
import { WellTelemetryReportSchema, type WellTelemetryReport } from "../../types/telemetry";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export function validateUpload(file: Pick<File, "name" | "size">): string | null {
    if (!/\.(pdf|csv|xlsx|txt)$/i.test(file.name))
        return "Choose a PDF, CSV, XLSX, or TXT drilling report.";
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES)
        return "Choose a non-empty file up to 8 MB.";
    return null;
}
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);
// Validate the API boundary without recalculating P2's metrics.
export function readReport(value: unknown): WellTelemetryReport {
    const result = WellTelemetryReportSchema.safeParse(value);
    if (!result.success)
        throw new Error("The server returned an incomplete report. Your previous report is unchanged.");
    const report = result.data;
    const ids = new Set(report.events.map(event => event.id));
    if (ids.size !== report.events.length || report.insights.some(insight => !ids.has(insight.eventId)) || report.depthCurve.some(point => !ids.has(point.eventId)))
        throw new Error("The server returned an incomplete report with invalid event references.");
    return report;
}
export const sourceLabels: Record<WellTelemetryReport["sourceKind"], string> = {
    SYNTHETIC_DEMO: "SYNTHETIC_DEMO",
    PUBLIC_SOURCE_UNREVIEWED: "Uploaded · UNVERIFIED",
    HUMAN_VERIFIED: "HUMAN_VERIFIED",
};
export function formatMinute(minute: number) {
    return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
export function latestHoleDepth(report: WellTelemetryReport): number | null {
    for (const event of [...report.events].sort((a, b) => b.endMinute - a.endMinute)) {
        if (event.endHoleDepthFt !== null)
            return event.endHoleDepthFt;
        if (event.startHoleDepthFt !== null)
            return event.startHoleDepthFt;
    }
    return null;
}
export function chartPoints(report: WellTelemetryReport) {
    const points: {
        minute: number;
        holeDepthFt: number | null;
        eventId: string;
    }[] = [];
    for (const event of report.events) {
        const previous = points.at(-1);
        if (previous && previous.minute < event.startMinute)
            points.push({ minute: previous.minute, holeDepthFt: null, eventId: "" });
        // Missing depths stay missing; the analytics curve can carry prior depths forward.
        points.push({ minute: event.startMinute, holeDepthFt: event.startHoleDepthFt, eventId: event.id });
        points.push({ minute: event.endMinute, holeDepthFt: event.endHoleDepthFt, eventId: event.id });
    }
    return points;
}
export function ingestionErrorMessage(error: string): string {
    // The ingestion route can return an SDK error serialized as a JSON string.
    // Preserve the provider's message while making its status readable.
    try {
        const parsed: unknown = JSON.parse(error);
        if (object(parsed) && object(parsed.error) && typeof parsed.error.message === "string") {
            const code = finite(parsed.error.code) ? ` (${parsed.error.code})` : "";
            return `Extraction provider error${code}: ${parsed.error.message}`;
        }
    }
    catch { /* Plain-text API errors already have a usable message. */ }
    return error;
}
export type IngestionProgress = Extract<IngestionMessage, {
    type: "stage";
}>;
export async function ingestReport(file: File, signal: AbortSignal, onStage?: (progress: IngestionProgress) => void, selection?: ReportDaySelection): Promise<WellTelemetryReport> {
    if (signal.aborted)
        throw new Error("Upload cancelled. Current report preserved.");
    const error = validateUpload(file);
    if (error)
        throw new Error(error);
    const data = new FormData();
    data.append("file", file);
    if (selection) data.append("reportDay", JSON.stringify(selection));
    const response = await fetch("/api/ingest", { method: "POST", body: data, signal, headers: { Accept: "application/x-ndjson" } });
    let report: WellTelemetryReport;
    if (response.ok && response.headers.get("content-type")?.includes("application/x-ndjson")) {
        if (!response.body)
            throw new Error("The report service returned no progress stream. Current report preserved.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let terminal: WellTelemetryReport | undefined;
        let totalBytes = 0;
        let last: IngestionProgress | undefined;
        function message(line: string) {
            if (!line.trim())
                return;
            let parsed: unknown;
            try { parsed = JSON.parse(line); }
            catch { throw new Error("The report service returned malformed progress data. Current report preserved."); }
            const result = IngestionMessageSchema.safeParse(parsed);
            if (!result.success)
                throw new Error("The report service returned an invalid progress response. Current report preserved.");
            const event = result.data;
            if (terminal)
                throw new Error("The report service returned data after its final result. Current report preserved.");
            if (event.type === "error") {
                const review = readReportDayError(event);
                if (review) throw review;
                throw new Error(`${event.error} [${event.code}; request ${event.requestId}]`);
            }
            if (event.type === "stage") {
                last = event;
                if (event.stage !== "ready")
                    onStage?.(event);
            }
            else
                terminal = readReport(event.report);
        }
        try {
            while (true) {
                if (signal.aborted)
                    throw new Error("Upload cancelled. Current report preserved.");
                const { done, value } = await reader.read();
                if (done)
                    break;
                totalBytes += value.byteLength;
                if (totalBytes > 4 * 1024 * 1024)
                    throw new Error("Report response exceeded the supported size. Current report preserved.");
                buffer += decoder.decode(value, { stream: true });
                let newline;
                while ((newline = buffer.indexOf("\n")) >= 0) {
                    message(buffer.slice(0, newline));
                    buffer = buffer.slice(newline + 1);
                }
                if (buffer.length > 2 * 1024 * 1024)
                    throw new Error("Report result exceeded the supported size.");
            }
            buffer += decoder.decode();
            if (buffer.trim())
                message(buffer);
            if (!terminal)
                throw new Error("The connection ended before a complete report was received. Current report preserved.");
            if (signal.aborted)
                throw new Error("Upload cancelled. Current report preserved.");
            report = terminal;
            if (last)
                onStage?.({ ...last, stage: "ready" });
        }
        catch (cause) {
            await reader.cancel().catch(() => { });
            throw cause;
        }
        finally {
            reader.releaseLock();
        }
    }
    else {
        let result: unknown;
        try {
            result = await response.json();
        }
        catch {
            throw new Error(`Report service returned an unreadable response (HTTP ${response.status}). Please retry.`);
        }
        if (!response.ok && object(result)) {
            const review = readReportDayError(result);
            if (review) throw review;
        }
        if (!response.ok)
            throw new Error(object(result) && typeof result.error === "string" ? ingestionErrorMessage(result.error) : `Report extraction failed (HTTP ${response.status}).`);
        report = readReport(result);
    }
    // Legacy JSON responses need the same commit-time cancellation guard as streams.
    if (signal.aborted)
        throw new Error("Upload cancelled. Current report preserved.");
    if (report.sourceKind === "SYNTHETIC_DEMO" && !/^SYNTHETIC_DEMO/i.test(file.name))
        throw new Error("Upload returned demo data instead of an extracted report. Your previous report is unchanged.");
    return report;
}
