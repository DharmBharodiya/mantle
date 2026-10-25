import { z } from "zod";
import { ServiceError } from "@/lib/server/errors";
import { abortable, backoff } from "@/lib/ingestion/context";
export const GROQ_ATTEMPT_MS=12000;
export const GROQ_ATTEMPTS=2;
export function cancelled(signal?:AbortSignal){if(signal?.aborted)throw new ServiceError('Copilot request cancelled. No report was changed.',499,'COPILOT_CANCELLED');}
export function groqFailure(status:number):ServiceError{
 if(status===429)return new ServiceError('Groq rate limit reached. Deterministic results and evidence remain available; retry conversation later.',429,'GROQ_RATE_LIMIT');
 if(status===401||status===403)return new ServiceError('Groq rejected the server credential or project access. Deterministic results remain available.',503,'GROQ_AUTH');
 if(status===404||status===400)return new ServiceError('Groq model or structured-output configuration is unavailable. Check GROQ_MODEL.',503,'GROQ_MODEL');
 return new ServiceError('Groq is unavailable. Deterministic results and evidence remain available.',503,'GROQ_UNAVAILABLE');
}
export async function groqJson<T>(system:string,data:unknown,name:string,jsonSchema:object,schema:z.ZodType<T>,signal?:AbortSignal):Promise<T>{
 cancelled(signal);
 const key=process.env.GROQ_API_KEY?.trim();if(!key)throw new ServiceError('Groq conversation is unavailable: GROQ_API_KEY is missing on the server. Deterministic results remain available.',503,'GROQ_MISSING_KEY');
 const model=(process.env.GROQ_MODEL||'openai/gpt-oss-20b').trim();
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/.test(model))throw groqFailure(400);
 const context=JSON.stringify(data);if(context.length>65000)throw new ServiceError('Copilot context exceeds the bounded explanation size. Narrow the report scope.',413,'COPILOT_CONTEXT_LIMIT');
 const body=JSON.stringify({model,messages:[{role:'system',content:system},{role:'user',content:context}],temperature:0,...(/^openai\/gpt-oss-(20|120)b$/.test(model)?{reasoning_effort:'low'}:{}),max_completion_tokens:2400,response_format:{type:'json_schema',json_schema:{name,strict:/^openai\/gpt-oss-(20|120)b$/.test(model),schema:jsonSchema}}});
 for(let attempt=1;attempt<=GROQ_ATTEMPTS;attempt++){
  cancelled(signal);const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),GROQ_ATTEMPT_MS);
  const combined=signal?AbortSignal.any([signal,controller.signal]):controller.signal;
  let retryMs:number|null=null;
  try {
   const response=await abortable(fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body,signal:combined,cache:'no-store'}),combined);
   if(!response.ok){
    const retryAfter=response.headers.get('retry-after');const seconds=retryAfter===null?null:Number(retryAfter);
    const retryable=[429,500,502,503,504].includes(response.status);
    await response.body?.cancel();
    if(retryable&&attempt<GROQ_ATTEMPTS&&(seconds===null||(Number.isFinite(seconds)&&seconds>=0&&seconds<=1)))retryMs=seconds===null?300:Math.max(100,seconds*1000);
    else throw groqFailure(response.status);
   }else {
    const reader=response.body?.getReader();if(!reader)throw new Error('Missing body');let text='';const decoder=new TextDecoder();
    try {for(;;){const part=await abortable(reader.read(),combined);if(part.done)break;text+=decoder.decode(part.value,{stream:true});if(text.length>100000)throw new Error('Oversized provider response');}text+=decoder.decode();}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    const wire=z.object({choices:z.array(z.object({finish_reason:z.string().nullable().optional(),message:z.object({content:z.string()})})).min(1).max(1)}).parse(JSON.parse(text));
    if(wire.choices[0].finish_reason!=='stop')throw new Error('Incomplete provider output');
    const result=schema.safeParse(JSON.parse(wire.choices[0].message.content));if(!result.success)throw new Error('Invalid provider schema');return result.data;
   }
  }catch(error){
   cancelled(signal);
   if(controller.signal.aborted)throw new ServiceError('Groq timed out. Deterministic results and evidence remain available.',504,'GROQ_TIMEOUT');
   if(error instanceof ServiceError)throw error;
   if(error instanceof z.ZodError||error instanceof SyntaxError||error instanceof Error&&/provider|Incomplete|Missing body|Oversized/i.test(error.message))throw new ServiceError('Groq returned an invalid or incomplete structured response. Deterministic results remain available.',502,'GROQ_INVALID_RESPONSE');
   if(attempt<GROQ_ATTEMPTS)retryMs=300;else throw groqFailure(503);
  }finally{clearTimeout(timer);}
  if(retryMs!==null)await backoff(retryMs,signal);
 }
 throw groqFailure(503);
}
