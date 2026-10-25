import { COPILOT_MAX_BODY, CopilotResponseSchema, type CopilotRequest, type CopilotResponse } from "@/types/copilot";
export async function askCopilot(input:CopilotRequest,signal:AbortSignal):Promise<CopilotResponse>{
 if(signal.aborted)throw new Error('Copilot request cancelled.');
 const body=JSON.stringify(input);if(new TextEncoder().encode(body).byteLength>COPILOT_MAX_BODY)throw new Error('Selected report context exceeds 1 MB. Choose fewer or smaller reports.');
 const response=await fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body,signal});
 let value:unknown;try{value=await response.json();}catch{throw new Error('The copilot service returned an unreadable response. Your reports are unchanged.');}
 if(signal.aborted)throw new Error('Copilot request cancelled.');
 if(!response.ok){const error=value as {error?:unknown};throw new Error(typeof error?.error==='string'?error.error:'Copilot service unavailable. Your reports are unchanged.');}
 const parsed=CopilotResponseSchema.safeParse(value);if(!parsed.success)throw new Error('The copilot service returned an incomplete answer. Your reports are unchanged.');
 const scopeIds=new Set(input.reports.map(r=>r.id));
 if(parsed.data.scope.some(r=>!scopeIds.has(r.id))||parsed.data.citations.some(c=>!scopeIds.has(c.reportId))||parsed.data.calculations.some(c=>!scopeIds.has(c.reportId)))throw new Error('The copilot response does not match the selected report scope.');
 return parsed.data;
}
