import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GENERATION_ATTEMPT_MS, MODEL_CHECK_MS, clearModelCache, extractionThinking, generateStructured } from "@/lib/server/gemini-client";
import { INGESTION_TOTAL_MS, IngestionContext } from "@/lib/ingestion/context";
const { generate, getModel } = vi.hoisted(() => ({ generate: vi.fn(), getModel: vi.fn() }));
vi.mock("@google/genai", () => ({ ThinkingLevel: { LOW: "LOW" }, GoogleGenAI: class {
        models = { generateContent: generate, get: getModel };
    } }));
const schema = { type: "object", properties: { result: { type: "string" } }, required: ["result"] };
const run = (signal?: AbortSignal, context?: IngestionContext) => generateStructured("Extract facts only", [{ text: "SYNTHETIC test" }], schema, signal, { fastExtraction: true, maxOutputTokens: 8192, context });
beforeEach(() => { vi.stubEnv("GEMINI_API_KEY", "SYNTHETIC_TEST_KEY"); vi.stubEnv("GEMINI_MODEL", "gemini-3.8-flash"); clearModelCache(); generate.mockReset(); getModel.mockReset().mockResolvedValue({ supportedActions: ["generateContent"], outputTokenLimit: 8192 }); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("bounded Gemini extraction requests", () => {
    it("verifies configured model, uses supported low thinking, and limits output", async () => {
        generate.mockResolvedValue({ text: '{"result":"OK"}' });
        expect(await run()).toEqual({ result: "OK" });
        expect(getModel).toHaveBeenCalledOnce();
        const options = generate.mock.calls[0][0];
        expect(options.model).toBe("gemini-3.8-flash");
        expect(options.config.thinkingConfig).toEqual({ thinkingLevel: "LOW" });
        expect(options.config.maxOutputTokens).toBe(8192);
        expect(options.config.httpOptions.retryOptions.attempts).toBe(1);
        await run();
        expect(getModel).toHaveBeenCalledOnce();
        expect(extractionThinking("gemini-2.5-flash")).toEqual({ thinkingBudget: 0 });
        expect(extractionThinking("gemini-future-unknown")).toBeUndefined();
        expect(extractionThinking("gemini-3.1-flash-image")).toBeUndefined();
    });
    it("rejects an unavailable model before uploading source to generation", async () => {
        getModel.mockRejectedValue({ status: 404 });
        await expect(run()).rejects.toMatchObject({ code: "PROVIDER_MODEL" });
        expect(generate).not.toHaveBeenCalled();
    });
    it("retries only transient service failures with a bounded backoff", async () => {
        vi.useFakeTimers();
        generate.mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ text: '{"result":"OK"}' });
        const promise = run();
        await vi.advanceTimersByTimeAsync(499);
        expect(generate).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(await promise).toEqual({ result: "OK" });
        expect(generate).toHaveBeenCalledTimes(2);
    });
    it("does not retry exhausted daily quota or authentication failures", async () => {
        for (const error of [{ status: 429, message: "Daily quota exceeded" }, { status: 403 }]) {
            generate.mockReset().mockRejectedValue(error);
            await expect(run()).rejects.toBeInstanceOf(Error);
            expect(generate).toHaveBeenCalledOnce();
        }
    });
    it("does not retry malformed or truncated output", async () => {
        generate.mockResolvedValueOnce({ text: "{bad" });
        await expect(run()).rejects.toMatchObject({ code: "INVALID_JSON" });
        expect(generate).toHaveBeenCalledOnce();
        generate.mockClear().mockResolvedValueOnce({ text: '{"result":"partial"}', candidates: [{ finishReason: "MAX_TOKENS" }] });
        await expect(run()).rejects.toMatchObject({ code: "OUTPUT_LIMIT" });
        expect(generate).toHaveBeenCalledOnce();
    });
    it("distinguishes generation timeout from caller cancellation and does not duplicate timed-out work", async () => {
        vi.useFakeTimers();
        generate.mockImplementation(() => new Promise(() => { }));
        const assertion = expect(run()).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT" });
        await vi.advanceTimersByTimeAsync(GENERATION_ATTEMPT_MS + 1);
        await assertion;
        expect(generate).toHaveBeenCalledOnce();
        const controller = new AbortController();
        const cancelled = expect(run(controller.signal)).rejects.toMatchObject({ code: "INGEST_CANCELLED" });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await cancelled;
        expect(generate).toHaveBeenCalledTimes(2);
    });
    it("bounds model verification independently", async () => {
        vi.useFakeTimers();
        getModel.mockImplementation(() => new Promise(() => { }));
        const assertion = expect(run()).rejects.toMatchObject({ code: "MODEL_CHECK_TIMEOUT" });
        await vi.advanceTimersByTimeAsync(MODEL_CHECK_MS + 1);
        await assertion;
        expect(generate).not.toHaveBeenCalled();
    });
    it("enforces the overall request budget and keeps diagnostics content-free", async () => {
        vi.useFakeTimers();
        const logs: unknown[] = [];
        const controller = new AbortController();
        const context = new IngestionContext(controller.signal, undefined, entry => logs.push(entry));
        generate.mockImplementation(() => new Promise(() => { }));
        const pending = context.measure("extract_activities", () => new Promise(() => { }));
        const assertion = expect(pending).rejects.toMatchObject({ code: "INGEST_DEADLINE" });
        await vi.advanceTimersByTimeAsync(INGESTION_TOTAL_MS + 1);
        await assertion;
        context.dispose();
        const serialized = JSON.stringify(logs);
        expect(serialized).toContain("extract_activities");
        expect(serialized).not.toContain("SYNTHETIC_TEST_KEY");
        expect(serialized).not.toContain("SYNTHETIC test");
        expect(serialized).not.toContain("fileName");
    });
});

it('rejects a cancelled request before any provider metadata or generation call',async()=>{
 const controller=new AbortController();controller.abort();
 await expect(run(controller.signal)).rejects.toMatchObject({code:'INGEST_CANCELLED'});
 expect(getModel).not.toHaveBeenCalled();expect(generate).not.toHaveBeenCalled();
});
it('cancels transient backoff instead of starting a retry',async()=>{
 vi.useFakeTimers();generate.mockRejectedValue({status:503});const controller=new AbortController();
 const assertion=expect(run(controller.signal)).rejects.toMatchObject({code:'INGEST_CANCELLED'});
 await vi.advanceTimersByTimeAsync(1);controller.abort();await assertion;
 await vi.advanceTimersByTimeAsync(1000);expect(generate).toHaveBeenCalledOnce();
});
it('rejects unsupported generation models before uploading source',async()=>{
 getModel.mockResolvedValue({supportedActions:['embedContent'],outputTokenLimit:8192});
 await expect(run()).rejects.toMatchObject({code:'PROVIDER_MODEL'});expect(generate).not.toHaveBeenCalled();
});
it('caps output by verified model capacity and never retries empty output',async()=>{
 getModel.mockResolvedValue({supportedActions:['generateContent'],outputTokenLimit:2048});
 generate.mockResolvedValue({text:''});await expect(run()).rejects.toMatchObject({code:'EMPTY_OUTPUT'});
 expect(generate.mock.calls[0][0].config.maxOutputTokens).toBe(2048);expect(generate).toHaveBeenCalledOnce();
});
it.each([{status:429,message:'Per-day quota exhausted'},{status:401},{status:404}])('does not retry nontransient provider failure %j',async failure=>{
 generate.mockRejectedValue(failure);await expect(run()).rejects.toBeInstanceOf(Error);expect(generate).toHaveBeenCalledOnce();
});
