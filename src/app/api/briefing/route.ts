import { NextResponse } from "next/server";
import { createBriefing,generateSpeech } from "@/lib/comms/briefing";
import { ExtractionSchema,ScenarioSchema } from "@/types/telemetry";
import { buildWellReport } from "@/lib/analytics/compute";
export const runtime="nodejs";
export async function POST(req:Request) {
  try {
    const body=await req.json();
    const report=buildWellReport(ExtractionSchema.parse(body.extraction),{
      scenario:ScenarioSchema.parse(body.scenario||{}),sourceKind:body.sourceKind==="SYNTHETIC_DEMO"?"SYNTHETIC_DEMO":"PUBLIC_SOURCE_UNREVIEWED"
    });
    const script=createBriefing(report);
    if(body.mode==="script") return NextResponse.json({script});
    const bytes=await generateSpeech(script);
    return new NextResponse(Buffer.from(bytes),{headers:{"Content-Type":"audio/mpeg","Cache-Control":"no-store"}});
  } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:"Voice briefing failed"},{status:502});}
}
