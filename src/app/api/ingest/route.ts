import { NextResponse } from "next/server";
import { prepareUpload, validateFile, MAX_UPLOAD_BYTES } from "@/lib/ingestion/prepare";
import { extractFromGemini } from "@/lib/ingestion/gemini";
import { buildWellReport, validateTimeline } from "@/lib/analytics/compute";
import { ExtractionSchema, type WellTelemetryReport } from "@/types/telemetry";
import type { IngestionMessage } from "@/types/ingestion";
import { IngestionContext } from "@/lib/ingestion/context";
import { ServiceError, safeApiError } from "@/lib/server/errors";
export const runtime = "nodejs";
// The code enforces 240s; deployments may enforce a lower host-specific cap.
export const maxDuration = 270;
export async function POST(req: Request) {
    let emit: ((message: IngestionMessage) => void) | undefined;
    const context = new IngestionContext(req.signal, message => emit?.(message));
    async function pipeline(file: File): Promise<WellTelemetryReport> {
        context.stage("preparing");
        const prepared = await context.measure("prepare_upload", () => prepareUpload(file));
        const extraction = await context.measure("extract_activities", () => extractFromGemini(prepared, context.signal, context));
        context.stage("validating");
        await context.measure("validate_events", async () => { ExtractionSchema.parse(extraction); const issues = validateTimeline(extraction.events); if (issues.length)
            throw new ServiceError(issues.join("; "), 422, "INVALID_TIMELINE"); });
        context.stage("computing");
        const report = await context.measure("compute_analytics", async () => {
            try {
                return buildWellReport(extraction, { sourceKind: prepared.synthetic ? "SYNTHETIC_DEMO" : "PUBLIC_SOURCE_UNREVIEWED" });
            }
            catch (error) {
                throw new ServiceError(error instanceof Error ? error.message : "Invalid report timeline.", 422, "INVALID_TIMELINE");
            }
        });
        context.stage("ready");
        context.trace({ phase: "complete", outcome: "ok" });
        return report;
    }
    try {
        if (Number(req.headers.get("content-length")) > MAX_UPLOAD_BYTES + 65536)
            throw new ServiceError("Upload must be no larger than 8 MB.", 413, "FILE_TOO_LARGE");
        let data: FormData;
        try {
            data = await context.measure("receive_upload", () => req.formData());
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            throw new ServiceError("Send a multipart upload with a file field.", 400, "INVALID_MULTIPART");
        }
        const file = data.get("file");
        if (!(file instanceof File))
            throw new ServiceError("Missing file field.", 400, "MISSING_FILE");
        validateFile(file); // Early request errors retain normal non-2xx HTTP responses.
        if (req.headers.get("accept")?.includes("application/x-ndjson")) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    let open = true;
                    emit = message => { if (open)
                        controller.enqueue(encoder.encode(JSON.stringify(message) + "\n")); };
                    void pipeline(file).then(report => emit?.({ type: "result", requestId: context.requestId, report })).catch(error => {
                        const result = safeApiError(error);
                        context.trace({ phase: "failed", outcome: "error", code: result.code });
                        try {
                            emit?.({ type: "error", requestId: context.requestId, error: result.error, code: result.code, status: result.status });
                        }
                        catch { /* Client already closed the stream. */ }
                    }).finally(() => { open = false; context.dispose(); try {
                        controller.close();
                    }
                    catch { /* Cancelled stream. */ } });
                },
                cancel() { context.cancel(); context.dispose(); },
            });
            // HTTP 200 accepts the progress stream only. Import succeeds ONLY on a result envelope.
            return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no", "X-Request-Id": context.requestId } });
        }
        const report = await pipeline(file);
        context.dispose();
        return NextResponse.json(report, { headers: { "Cache-Control": "no-store", "X-Request-Id": context.requestId, "Server-Timing": context.serverTiming() } });
    }
    catch (error) {
        const result = safeApiError(error);
        context.trace({ phase: "failed", outcome: "error", code: result.code });
        context.dispose();
        return NextResponse.json({ error: result.error, code: result.code, requestId: context.requestId }, { status: result.status, headers: { "Cache-Control": "no-store", "X-Request-Id": context.requestId, "Server-Timing": context.serverTiming() } });
    }
}
