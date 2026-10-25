import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CopilotRequestSchema, CopilotResponseSchema, COPILOT_MAX_BODY } from '@/types/copilot';
import { answerCopilot } from '@/lib/copilot/answer';
import { cancelled } from '@/lib/copilot/groq';
import { ServiceError } from '@/lib/server/errors';
import { abortable } from '@/lib/ingestion/context';
export const runtime='nodejs';
export const maxDuration=60;
let active=0; // Concurrency guard only; never stores report data or user history.
export async function POST(req:Request){
 const requestId=randomUUID();const headers={'Cache-Control':'no-store','X-Request-Id':requestId};let acquired=false;
 const timeout=new AbortController();const timer=setTimeout(()=>timeout.abort(),40000);const signal=AbortSignal.any([req.signal,timeout.signal]);
 try {
  cancelled(req.signal);
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new ServiceError('Use the copilot from the Mantle application.',403,'COPILOT_ORIGIN');
  if(active>=3)throw new ServiceError('Copilot is busy. Try again after the current questions finish.',429,'COPILOT_BUSY');active++;acquired=true;
  if(Number(req.headers.get('content-length'))>COPILOT_MAX_BODY)throw new ServiceError('Copilot request exceeds 1 MB. Select fewer reports.',413,'COPILOT_BODY_LIMIT');
  if(!req.headers.get('content-type')?.includes('application/json'))throw new ServiceError('Send a JSON question and explicitly selected reports.',415,'COPILOT_CONTENT_TYPE');
  const reader=req.body?.getReader();if(!reader)throw new ServiceError('A question and selected reports are required.',400,'COPILOT_REQUEST');let bytes=0;let body='';const decoder=new TextDecoder();
  try {for(;;){const part=await abortable(reader.read(),signal);if(part.done)break;bytes+=part.value.byteLength;if(bytes>COPILOT_MAX_BODY)throw new ServiceError('Copilot request exceeds 1 MB. Select fewer reports.',413,'COPILOT_BODY_LIMIT');body+=decoder.decode(part.value,{stream:true});}body+=decoder.decode();}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  const parsed=CopilotRequestSchema.parse(JSON.parse(body));
  const result=await answerCopilot(parsed,requestId,signal);return NextResponse.json(CopilotResponseSchema.parse(result),{headers});
 }catch(error){
  const service=error instanceof ServiceError?error:null;
  return NextResponse.json({requestId,code:req.signal.aborted?'COPILOT_CANCELLED':timeout.signal.aborted?'COPILOT_TIMEOUT':service?.code??'COPILOT_REQUEST',error:req.signal.aborted?'Copilot request cancelled.':timeout.signal.aborted?'Copilot reached its time budget. Ask a narrower question.':service?.message??(error instanceof z.ZodError||error instanceof SyntaxError?'Invalid question, report scope or conversation context.':'The selected records could not be analyzed. Check their dates and timeline; no report was changed.')},{status:req.signal.aborted?499:timeout.signal.aborted?504:service?.status??422,headers});
 }finally{clearTimeout(timer);if(acquired)active--;}
}
