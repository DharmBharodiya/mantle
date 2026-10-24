import { createHash } from "node:crypto";
import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse, type Part, type ThinkingConfig } from "@google/genai";
import { ServiceError, providerError } from "./errors";
import { abortable, backoff, cancellationError, throwIfAborted, type IngestionContext } from "@/lib/ingestion/context";
export const GENERATION_ATTEMPT_MS = 45000;
export const MODEL_CHECK_MS = 10000;
export const MAX_GENERATION_ATTEMPTS = 2;
const models = new Map<string, {
    until: number;
    outputLimit: number;
}>();
export function clearModelCache() { models.clear(); }
export function extractionThinking(model: string): ThinkingConfig | undefined {
    if (/image|tts|audio|live|robotics|embedding/i.test(model)) return undefined;
    if (/^gemini-3(?:\.\d+)?-(?:flash|pro)(?:-|$)/.test(model))
        return { thinkingLevel: ThinkingLevel.LOW };
    if (/^gemini-2\.5-flash(?:-|$)/.test(model))
        return { thinkingBudget: 0 };
    return undefined; // Do not send unsupported settings to an unknown model family.
}
export function transientProviderError(error: unknown): boolean {
    if (error instanceof ServiceError)
        return false;
    const value = error as {
        status?: number;
        message?: string;
    };
    const message = String(value?.message ?? "");
    let status = Number(value?.status);
    try {
        status ||= JSON.parse(message).error?.code;
    }
    catch { /* Do not expose raw SDK messages. */ }
    if ([500, 502, 503, 504].includes(status) || /service unavailable|high demand|bad gateway/i.test(message))
        return true;
    return status === 429 && /rate|too many requests|per.minute|per.second|try again/i.test(message) && !/daily|per.day|billing|quota.exceeded/i.test(message);
}
async function boundedCall<T>(operation: (signal: AbortSignal) => Promise<T>, milliseconds: number, parent?: AbortSignal, code = "PROVIDER_TIMEOUT"): Promise<T> {
    throwIfAborted(parent);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new ServiceError(code === "MODEL_CHECK_TIMEOUT" ? "Gemini model verification did not respond in time." : "Gemini generation exceeded its per-attempt time limit. No partial result was imported.", 504, code)), milliseconds);
    const cancelled = () => controller.abort(cancellationError(parent));
    parent?.addEventListener("abort", cancelled, { once: true });
    if (parent?.aborted)
        cancelled();
    try {
        return await abortable(operation(controller.signal), controller.signal);
    }
    finally {
        clearTimeout(timeout);
        parent?.removeEventListener("abort", cancelled);
    }
}
export type StructuredOptions = {
    context?: IngestionContext;
    fastExtraction?: boolean;
    maxOutputTokens?: number;
};
export async function generateStructured(systemInstruction: string, parts: Part[], schema: Record<string, unknown>, signal?: AbortSignal, options: StructuredOptions = {}): Promise<unknown> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey)
        throw new ServiceError("Gemini key missing; configure GEMINI_API_KEY on the server. Structured CSV/XLSX imports do not need a key.", 503, "MISSING_KEY");
    const model = (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite").trim().replace(/^models\//, "");
    if (!/^gemini-[a-z0-9.-]{1,90}$/i.test(model))
        throw new ServiceError("GEMINI_MODEL is not a supported model identifier. Check server configuration.", 503, "PROVIDER_MODEL");
    const context = options.context;
    const parent = signal ?? context?.signal;
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: options.fastExtraction ? GENERATION_ATTEMPT_MS : 120000, retryOptions: { attempts: 1 } } });
    let outputLimit = options.maxOutputTokens ?? 32768;
    if (options.fastExtraction) {
        const cacheKey = createHash("sha256").update(apiKey).update(model).digest("hex");
        let capability = models.get(cacheKey);
        if (!capability || capability.until < Date.now()) {
            const check = () => boundedCall(async (checkSignal) => {
                const info = await ai.models.get({ model, config: { httpOptions: { timeout: MODEL_CHECK_MS }, abortSignal: checkSignal } });
                if (info.supportedActions && !info.supportedActions.includes("generateContent"))
                    throw new ServiceError("The configured model does not support document generation. Check GEMINI_MODEL.", 503, "PROVIDER_MODEL");
                return { until: Date.now() + 300000, outputLimit: info.outputTokenLimit ?? 8192 };
            }, Math.min(MODEL_CHECK_MS, context?.remaining() ?? MODEL_CHECK_MS), parent, "MODEL_CHECK_TIMEOUT");
            try {
                capability = context ? await context.measure("verify_model", check) : await check();
            }
            catch (error) {
                if (error instanceof ServiceError)
                    throw error;
                throw providerError(error);
            }
            if (models.size > 32)
                models.clear();
            models.set(cacheKey, capability);
        }
        outputLimit = Math.min(outputLimit, capability.outputLimit);
    }
    let response: GenerateContentResponse | undefined;
    const attempts = options.fastExtraction ? MAX_GENERATION_ATTEMPTS : 1;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        throwIfAborted(parent);
        if (context && context.remaining() < 2000)
            throw new ServiceError("Insufficient processing budget remains for another extraction request. Split the source by day.", 504, "INGEST_DEADLINE");
        const start = Date.now();
        try {
            const timeout = options.fastExtraction ? Math.min(GENERATION_ATTEMPT_MS, context?.remaining() ?? GENERATION_ATTEMPT_MS) : 120000;
            response = await boundedCall(attemptSignal => ai.models.generateContent({ model, contents: [{ role: "user", parts }], config: { systemInstruction, responseMimeType: "application/json", responseJsonSchema: schema, maxOutputTokens: outputLimit, abortSignal: attemptSignal, httpOptions: { timeout, retryOptions: { attempts: 1 } }, ...(options.fastExtraction ? { thinkingConfig: extractionThinking(model) } : {}) } }), timeout, parent);
            context?.trace({ phase: "generate_attempt", durationMs: Date.now() - start, attempt, outcome: "ok", inputTokens: response.usageMetadata?.promptTokenCount, outputTokens: response.usageMetadata?.candidatesTokenCount, thinkingTokens: response.usageMetadata?.thoughtsTokenCount });
            break;
        }
        catch (error) {
            if (parent?.aborted)
                throw cancellationError(parent);
            const mapped = error instanceof ServiceError ? error : providerError(error);
            context?.trace({ phase: "generate_attempt", durationMs: Date.now() - start, attempt, outcome: "error", code: mapped.code });
            // A timed-out generation may still run at Google. Do not automatically duplicate it.
            if (attempt >= attempts || !transientProviderError(error))
                throw mapped;
            const delay = 500 * 2 ** (attempt - 1);
            if (context && context.remaining() < delay + 2000)
                throw mapped;
            context?.trace({ phase: "retry_backoff", durationMs: delay, attempt });
            await backoff(delay, parent);
        }
    }
    if (!response?.text)
        throw new ServiceError("Gemini returned no usable output. The source may be unreadable or blocked.", 422, "EMPTY_OUTPUT");
    if (response.candidates?.some(candidate => candidate.finishReason === "MAX_TOKENS"))
        throw new ServiceError("An extraction section exceeded the output limit. Split the source into smaller report-day sections; no partial output was imported.", 422, "OUTPUT_LIMIT");
    try {
        return JSON.parse(response.text);
    }
    catch {
        throw new ServiceError("Gemini returned malformed or incomplete JSON. No report was imported.", 502, "INVALID_JSON");
    }
}
