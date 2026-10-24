import { GoogleGenAI, type Part } from "@google/genai";
import { ServiceError, providerError } from "./errors";
export async function generateStructured(systemInstruction: string, parts: Part[], schema: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey)
        throw new ServiceError("Gemini key missing; configure GEMINI_API_KEY on the server. The synthetic demo is available separately.", 503, "MISSING_KEY");
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 120000, retryOptions: { attempts: 1 } } });
    let response;
    try {
        response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-3.8-flash", contents: [{ role: "user", parts }], config: { systemInstruction, responseMimeType: "application/json", responseJsonSchema: schema, maxOutputTokens: 32768, abortSignal: signal } });
    }
    catch (error) {
        throw providerError(error);
    }
    if (!response.text)
        throw new ServiceError("Gemini returned no usable output. The document may be unreadable or blocked.", 422, "EMPTY_OUTPUT");
    if (response.candidates?.some(candidate => candidate.finishReason === "MAX_TOKENS"))
        throw new ServiceError("The extracted report exceeds the response limit. Split the document into individual report days.", 422, "OUTPUT_LIMIT");
    try {
        return JSON.parse(response.text);
    }
    catch {
        throw new ServiceError("Gemini returned incomplete or invalid JSON. No report was imported; try a smaller single-day document.", 502, "INVALID_JSON");
    }
}
