import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPhotonText } from "@/lib/comms/photon";
import { ExtractionSchema,ScenarioSchema } from "@/types/telemetry";
import { buildWellReport } from "@/lib/analytics/compute";
import { createBriefing } from "@/lib/comms/briefing";
export const runtime="nodejs";
export async function POST(req:Request) {
  try {
    // Production: add authenticated users, permissions and idempotency DB record.
    const body=await req.json();
    const recipient=z.object({spaceId:z.string().min(1),senderId:z.string().min(1),idempotencyKey:z.string().min(1)}).parse(body.recipient);
    const report=buildWellReport(ExtractionSchema.parse(body.extraction),{scenario:ScenarioSchema.parse(body.scenario||{})});
    const result=await sendPhotonText({...recipient,text:createBriefing(report)});
    return NextResponse.json({state:result.state,delivered:false});
  } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:"Dispatch failed"},{status:400});}
}
