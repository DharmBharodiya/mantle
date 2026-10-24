import { afterEach, describe, expect, it, vi } from "vitest";
import { ExtractionSchema, ScenarioSchema, type WellTelemetryReport } from "../../types/telemetry";
import { chartPoints, formatMinute, ingestReport, latestHoleDepth, MAX_UPLOAD_BYTES, readReport, validateUpload } from "./report-view";
// Synthetic API-boundary fixture; the UI never computes these metrics.
function report(): WellTelemetryReport {
    return {
        ...ExtractionSchema.parse({ wellName: "SYNTHETIC_TEST", reportDate: "2026-10-24", warnings: [], events: [{ id: "test-event", startMinute: 0, endMinute: 60, activity: "CIRCULATING", classification: "PRODUCTIVE", startHoleDepthFt: 100, endHoleDepthFt: 100, note: "Synthetic circulation", explanation: "Planned circulation", evidence: { fileName: "SYNTHETIC_TEST.txt", page: null, snippet: "Synthetic circulation" }, confidence: "HIGH" }] }),
        sourceKind: "PUBLIC_SOURCE_UNREVIEWED", scenario: ScenarioSchema.parse({}), generatedAt: "2026-10-24T00:00:00Z",
        metrics: { unknownMinutes: 0, unobservedMinutes: 1380, coveragePct: 4.1666666667, iltEligibleMinutes: 0, benchmarkCoveragePct: 0, observedMinutes: 60, classifiedMinutes: 60, productiveMinutes: 60, nptMinutes: 0, iltMinutes: 0, efficiencyPct: 100, estimatedLossUsd: 0, estimatedNptCostUsd: 0, estimatedIltOpportunityUsd: 0, modeledExcessFuelGallons: null, modeledExcessCo2Tons: null },
        insights: [], depthCurve: [],
    };
}
afterEach(() => vi.unstubAllGlobals());
describe("dashboard report ingestion", () => {
    it("validates supported formats and the 8 MB boundary before networking", () => {
        for (const name of ["day.PDF", "day.csv", "day.xlsx", "day.txt"])
            expect(validateUpload({ name, size: MAX_UPLOAD_BYTES })).toBeNull();
        expect(validateUpload({ name: "day.exe", size: 1 })).toMatch(/PDF/);
        expect(validateUpload({ name: "day.csv", size: 0 })).toMatch(/non-empty/);
        expect(validateUpload({ name: "day.csv", size: MAX_UPLOAD_BYTES + 1 })).toMatch(/8 MB/);
    });
    it("rejects incomplete successful responses instead of replacing the current report", () => {
        expect(() => readReport({ ...report(), metrics: {} })).toThrow(/incomplete/);
        expect(() => readReport({ ...report(), sourceKind: "REAL" })).toThrow(/incomplete/);
        expect(() => readReport({ ...report(), depthCurve: [null] })).toThrow(/incomplete/);
        expect(readReport(report()).metrics.modeledExcessCo2Tons).toBeNull();
    });
    it("posts multipart file and preserves source kind and computed metrics", async () => {
        const next = report();
        const fetcher = vi.fn().mockResolvedValue(Response.json(next));
        vi.stubGlobal("fetch", fetcher);
        const file = new File(["synthetic test"], "day.txt");
        const signal = new AbortController().signal;
        expect(await ingestReport(file, signal)).toEqual(next);
        const [url, options] = fetcher.mock.calls[0];
        expect(url).toBe("/api/ingest");
        expect(options.method).toBe("POST");
        expect(options.body.get("file")).toBe(file);
        expect(options.signal).toBe(signal);
    });
    it("surfaces the actual missing-key error", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 400 })));
        await expect(ingestReport(new File(["x"], "day.txt"), new AbortController().signal)).rejects.toThrow("Missing GEMINI_API_KEY");
    });
    it("shows the provider high-demand error rather than serialized SDK JSON", async () => {
        const error = JSON.stringify({ error: { code: 503, message: "This model is currently experiencing high demand.", status: "UNAVAILABLE" } });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error }, { status: 502 })));
        await expect(ingestReport(new File(["synthetic test"], "day.csv"), new AbortController().signal)).rejects.toThrow("Extraction provider error (503): This model is currently experiencing high demand.");
    });
    it("rejects unreadable service errors and silent demo substitution", async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(new Response("Bad gateway", { status: 502 })).mockResolvedValueOnce(Response.json({ ...report(), sourceKind: "SYNTHETIC_DEMO" }));
        vi.stubGlobal("fetch", fetcher);
        const file = new File(["x"], "day.txt");
        await expect(ingestReport(file, new AbortController().signal)).rejects.toThrow(/HTTP 502/);
        await expect(ingestReport(file, new AbortController().signal)).rejects.toThrow(/demo data/);
    });
});
describe("honest depth presentation", () => {
    it("retains planned flat intervals without reclassifying them as downtime", () => {
        const r = report();
        expect(chartPoints(r).map(p => p.holeDepthFt)).toEqual([100, 100]);
        expect(r.events[0].classification).toBe("PRODUCTIVE");
    });
    it("breaks lines across observation gaps and never carries missing depth forward", () => {
        const r = report();
        r.events.push({ ...r.events[0], id: "later", startMinute: 120, endMinute: 180, startHoleDepthFt: null, endHoleDepthFt: null });
        expect(chartPoints(r).map(p => p.holeDepthFt)).toEqual([100, 100, null, null, null]);
        expect(latestHoleDepth(r)).toBe(100);
        r.events.forEach(e => { e.startHoleDepthFt = null; e.endHoleDepthFt = null; });
        expect(latestHoleDepth(r)).toBeNull();
    });
    it("shows empty reports without manufacturing depth and formats local day boundaries", () => {
        const r = report();
        r.events = [];
        expect(chartPoints(r)).toEqual([]);
        expect(latestHoleDepth(r)).toBeNull();
        expect(formatMinute(1440)).toBe("24:00");
    });
});
describe("streaming import transaction", () => {
    function streamResponse(messages: unknown[], split = 7) {
        const bytes = new TextEncoder().encode(messages.map(message => JSON.stringify(message)).join("\n") + "\n");
        return new Response(new ReadableStream<Uint8Array>({ start(controller) { for (let index = 0; index < bytes.length; index += split)
                controller.enqueue(bytes.slice(index, index + split)); controller.close(); } }), { headers: { "Content-Type": "application/x-ndjson" } });
    }
    it("handles split UTF-8 frames and reports real stages before committing a result", async () => {
        const next = report();
        next.events[0].note = "Synthétique test";
        const stages: string[] = [];
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse([{ type: "stage", requestId: "test", elapsedMs: 1, stage: "preparing" }, { type: "stage", requestId: "test", elapsedMs: 2, stage: "ready" }, { type: "result", requestId: "test", report: next }], 1)));
        expect(await ingestReport(new File(["test"], "report.csv"), new AbortController().signal, event => stages.push(event.stage))).toEqual(next);
        expect(stages).toEqual(["preparing", "ready"]);
    });
    it("never replaces the previous dashboard report on a streamed provider error", async () => {
        const previous = report();
        let dashboard = previous;
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse([{ type: "stage", requestId: "test", elapsedMs: 1, stage: "extracting" }, { type: "error", requestId: "test", status: 504, code: "PROVIDER_TIMEOUT", error: "Generation timed out" }])));
        await expect(ingestReport(new File(["test"], "report.csv"), new AbortController().signal).then(next => { dashboard = next; })).rejects.toThrow(/Generation timed out/);
        expect(dashboard).toBe(previous);
    });
    it("does not treat a ready stage or closed connection as a successful import", async () => {
        const stages: string[] = [];
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse([{ type: "stage", requestId: "test", elapsedMs: 1, stage: "ready" }])));
        await expect(ingestReport(new File(["test"], "report.csv"), new AbortController().signal, event => stages.push(event.stage))).rejects.toThrow(/before a complete report/);
        expect(stages).toEqual([]);
    });
    it("rejects malformed progress and cancelled imports", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(streamResponse([{ type: "result", requestId: "test", report: { events: [] } }])).mockResolvedValueOnce(streamResponse([{ type: "result", requestId: "test", report: report() }])));
        await expect(ingestReport(new File(["test"], "report.csv"), new AbortController().signal)).rejects.toThrow(/invalid progress/);
        const controller = new AbortController();
        controller.abort();
        await expect(ingestReport(new File(["test"], "report.csv"), controller.signal)).rejects.toThrow(/cancelled/);
    });
});


describe("cancellation before committing a legacy JSON import", () => {
    it("rejects a late JSON response after cancellation and preserves the selected report", async () => {
        const controller = new AbortController();
        const previous = report();
        let selected = previous;
        vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
            controller.abort();
            return Response.json(report());
        }));
        await expect(ingestReport(new File(["report"], "day.txt"), controller.signal).then(next => { selected = next; })).rejects.toThrow(/cancelled/);
        expect(selected).toBe(previous);
    });
    it("does not start a request that was already cancelled", async () => {
        const controller = new AbortController();
        controller.abort();
        const fetcher = vi.fn();
        vi.stubGlobal("fetch", fetcher);
        await expect(ingestReport(new File(["report"], "day.txt"), controller.signal)).rejects.toThrow(/cancelled/);
        expect(fetcher).not.toHaveBeenCalled();
    });
});
