import { z } from "zod";
import { generateStructured } from "@/lib/server/gemini-client";
import { ServiceError } from "@/lib/server/errors";

const COPILOT_CONTEXT_LIMIT = 65000;
const COPILOT_OUTPUT_TOKENS = 2400;

export function copilotCancelled(signal?: AbortSignal) {
 if(signal?.aborted) throw new ServiceError('Copilot request cancelled. No report was changed.',499,'COPILOT_CANCELLED');
}

export async function geminiJson<T>(system: string, data: unknown, jsonSchema: object, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
 copilotCancelled(signal);
 if(!process.env.GEMINI_API_KEY?.trim()) throw new ServiceError('Gemini conversation is unavailable: GEMINI_API_KEY is missing on the server. Deterministic results remain available.',503,'GEMINI_MISSING_KEY');
 const context=JSON.stringify(data);
 if(context.length>COPILOT_CONTEXT_LIMIT) throw new ServiceError('Copilot context exceeds the bounded explanation size. Narrow the report scope.',413,'COPILOT_CONTEXT_LIMIT');
 try {
  const result=await generateStructured(system,[{text:context}],jsonSchema as Record<string,unknown>,signal,{maxOutputTokens:COPILOT_OUTPUT_TOKENS});
  copilotCancelled(signal);
  const parsed=schema.safeParse(result);
  if(!parsed.success) throw new ServiceError('Gemini returned an invalid structured Copilot response. Deterministic results remain available.',502,'GEMINI_INVALID_RESPONSE');
  return parsed.data;
 } catch(error) {
  copilotCancelled(signal);
  if(error instanceof ServiceError) {
   if(error.code==='MISSING_KEY') throw new ServiceError('Gemini conversation is unavailable: GEMINI_API_KEY is missing on the server. Deterministic results remain available.',503,'GEMINI_MISSING_KEY');
   if(error.code==='PROVIDER_RATE_LIMIT') throw new ServiceError('Gemini rate limit reached. Deterministic results and evidence remain available; retry conversation later.',429,'GEMINI_RATE_LIMIT');
   if(error.code==='PROVIDER_AUTH') throw new ServiceError('Gemini rejected the server credential or project access. Deterministic results remain available.',503,'GEMINI_AUTH');
   if(error.code==='PROVIDER_MODEL') throw new ServiceError('Gemini Copilot model is unavailable. Check GEMINI_MODEL.',503,'GEMINI_MODEL');
   if(error.code==='PROVIDER_TIMEOUT'||error.code==='MODEL_CHECK_TIMEOUT') throw new ServiceError('Gemini Copilot timed out. Deterministic results and evidence remain available.',504,'GEMINI_TIMEOUT');
   if(error.code==='PROVIDER_BUSY') throw new ServiceError('Gemini is busy. Deterministic results and evidence remain available; try again later.',503,'GEMINI_BUSY');
   if(error.code==='COPILOT_CONTEXT_LIMIT'||error.code==='COPILOT_CANCELLED') throw error;
   throw new ServiceError('Gemini Copilot could not complete this request. Deterministic results remain available.',503,'GEMINI_UNAVAILABLE');
  }
  if(error instanceof z.ZodError||error instanceof SyntaxError) throw new ServiceError('Gemini returned an invalid structured Copilot response. Deterministic results remain available.',502,'GEMINI_INVALID_RESPONSE');
  throw new ServiceError('Gemini Copilot is unavailable. Deterministic results and evidence remain available.',503,'GEMINI_UNAVAILABLE');
 }
}
