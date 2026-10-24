import { ZodError } from "zod";
export class ServiceError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); this.name = "ServiceError"; }
}
export function safeApiError(error: unknown): { status: number; error: string; code: string } {
  if (error instanceof ServiceError) return { status: error.status, error: error.message, code: error.code };
  if (error instanceof ZodError) return { status: 422, error: "Extracted values did not match the report schema. Check the source format and use a single report day.", code: "INVALID_EXTRACTION" };
  return { status: 500, error: "The analysis could not be completed. Your previous report is unchanged.", code: "ANALYSIS_FAILED" };
}
export function providerError(error: unknown): ServiceError {
  const value = error as { status?: number; message?: string; name?: string };
  let status = Number(value?.status);
  try { status ||= JSON.parse(value.message ?? "").error?.code; } catch { /* Never return raw SDK responses or URLs with credentials. */ }
  if (status === 429) return new ServiceError("Gemini quota or rate limit reached. Check your Google project quota and retry later.", 429, "PROVIDER_RATE_LIMIT");
  if (status === 401 || status === 403) return new ServiceError("Gemini rejected the server credentials or project access. Check GEMINI_API_KEY and API permissions.", 503, "PROVIDER_AUTH");
  if (status === 404) return new ServiceError("The configured Gemini model is unavailable. Check GEMINI_MODEL on the server.", 503, "PROVIDER_MODEL");
  if (status === 503) return new ServiceError("Gemini is experiencing high demand. Please retry later; no report was imported.", 503, "PROVIDER_BUSY");
  if (value?.name === "AbortError" || value?.name === "TimeoutError" || /timeout|timed out|aborted/i.test(value?.message ?? "")) return new ServiceError("Gemini did not respond within the server time limit. Try a smaller single-day report or retry later.", 504, "PROVIDER_TIMEOUT");
  return new ServiceError("Gemini extraction is unavailable. Check server connectivity and model configuration, then retry.", 502, "PROVIDER_ERROR");
}
