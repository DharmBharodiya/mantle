import { NextResponse } from "next/server";
import { DEMO_REPORT } from "@/data/demo-report";
import { buildWellReport } from "@/lib/analytics/compute";
import { ExtractionSchema,ScenarioSchema } from "@/types/telemetry";
export async function GET() { return NextResponse.json(DEMO_REPORT); }
export async function POST(req:Request) {
  try {
    const body=await req.json();
    const data=ExtractionSchema.parse(body.extraction);
    const scenario=ScenarioSchema.parse(body.scenario??{});
    return NextResponse.json(buildWellReport(data,{scenario,sourceKind:"PUBLIC_SOURCE_UNREVIEWED"}));
  } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:"Invalid input"},{status:400});}
}
