import { randomUUID } from "node:crypto";
import { ServiceError } from "@/lib/server/errors";
import type { IngestionMessage, IngestionStage } from "@/types/ingestion";
export const INGESTION_TOTAL_MS = 240000;
export type Diagnostic = {
    requestId: string;
    phase: string;
    elapsedMs: number;
    durationMs?: number;
    outcome?: "ok" | "error";
    code?: string;
    bytes?: number;
    rows?: number;
    chunks?: number;
    pages?: number;
    attempt?: number;
    inputTokens?: number;
    outputTokens?: number;
    thinkingTokens?: number;
};
export function cancellationError(signal?: AbortSignal): ServiceError {
    if (signal?.reason instanceof ServiceError)
        return signal.reason;
    return new ServiceError("Upload cancelled. Your previous report is unchanged.", 499, "INGEST_CANCELLED");
}
export function throwIfAborted(signal?: AbortSignal) { if (signal?.aborted)
    throw cancellationError(signal); }
export async function abortable<T>(task: Promise<T>, signal?: AbortSignal): Promise<T> {
    throwIfAborted(signal);
    if (!signal)
        return task;
    return new Promise<T>((resolve, reject) => {
        const aborted = () => { signal.removeEventListener("abort", aborted); reject(cancellationError(signal)); };
        signal.addEventListener("abort", aborted, { once: true });
        task.then(value => { signal.removeEventListener("abort", aborted); resolve(value); }, error => { signal.removeEventListener("abort", aborted); reject(error); });
    });
}
export async function backoff(milliseconds: number, signal?: AbortSignal) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await abortable(new Promise<void>(resolve => { timer = setTimeout(resolve, milliseconds); }), signal);
    }
    finally {
        clearTimeout(timer);
    }
}
export class IngestionContext {
    readonly requestId = randomUUID();
    readonly started = Date.now();
    readonly signal: AbortSignal;
    readonly timings = new Map<string, number>();
    private controller = new AbortController();
    private timer: ReturnType<typeof setTimeout>;
    private caller?: AbortSignal;
    private callerAbort = () => this.controller.abort(new ServiceError("Upload cancelled by the client. Your previous report is unchanged.", 499, "INGEST_CANCELLED"));
    constructor(caller?: AbortSignal, private notify?: (message: IngestionMessage) => void, private sink: (entry: Diagnostic) => void = entry => console.info("[boresight.ingest]", JSON.stringify(entry))) {
        this.signal = this.controller.signal;
        this.caller = caller;
        caller?.addEventListener("abort", this.callerAbort, { once: true });
        if (caller?.aborted)
            this.callerAbort();
        this.timer = setTimeout(() => this.controller.abort(new ServiceError("The ingestion request reached its processing budget. Use a smaller single-day report; no partial analysis was imported.", 504, "INGEST_DEADLINE")), INGESTION_TOTAL_MS);
    }
    remaining() { return Math.max(0, INGESTION_TOTAL_MS - (Date.now() - this.started)); }
    trace(entry: Omit<Diagnostic, "requestId" | "elapsedMs">) { this.sink({ requestId: this.requestId, elapsedMs: Date.now() - this.started, ...entry }); }
    stage(stage: IngestionStage, detail?: {
        completedChunks: number;
        totalChunks: number;
    }) { throwIfAborted(this.signal); this.trace({ phase: stage }); this.notify?.({ type: "stage", stage, requestId: this.requestId, elapsedMs: Date.now() - this.started, ...detail }); }
    async measure<T>(phase: string, operation: () => Promise<T>): Promise<T> {
        throwIfAborted(this.signal);
        const start = Date.now();
        try {
            const value = await abortable(operation(), this.signal);
            this.trace({ phase, durationMs: Date.now() - start, outcome: "ok" });
            return value;
        }
        catch (error) {
            this.trace({ phase, durationMs: Date.now() - start, outcome: "error", code: error instanceof ServiceError ? error.code : "OPERATION_FAILED" });
            throw error;
        }
        finally {
            this.timings.set(phase, (this.timings.get(phase) ?? 0) + Date.now() - start);
        }
    }
    serverTiming() { return [...this.timings].map(([phase, duration]) => `${phase.replace(/[^a-z_]/gi, "_")};dur=${duration}`).join(", "); }
    cancel() { this.controller.abort(new ServiceError("Upload stream closed. Your previous report is unchanged.", 499, "INGEST_CANCELLED")); }
    dispose() { clearTimeout(this.timer); this.caller?.removeEventListener("abort", this.callerAbort); }
}
