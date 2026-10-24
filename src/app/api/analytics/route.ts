import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_REPORT } from "@/data/demo-report";
import { buildWellReport } from "@/lib/analytics/compute";
import { ExtractionSchema, ScenarioSchema, SourceKindSchema } from "@/types/telemetry";
const RequestSchema = z.object({ extraction: ExtractionSchema, scenario: ScenarioSchema.optional(), sourceKind: SourceKindSchema.optional() });
export async function GET() { return NextResponse.json(DEMO_REPORT); }
export async function POST(req: Request) {
  try {
    const body = RequestSchema.parse(await req.json());
    // A client cannot promote AI output to human verified through this endpoint.
    return NextResponse.json(buildWellReport(body.extraction, { scenario: body.scenario, sourceKind: body.sourceKind === "SYNTHETIC_DEMO" ? "SYNTHETIC_DEMO" : "PUBLIC_SOURCE_UNREVIEWED" }), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof z.ZodError ? "Invalid extraction or scenario values." : error instanceof SyntaxError ? "Request body must be valid JSON." : error instanceof Error ? error.message : "Invalid analytics request." }, { status: 422 }); }
}
