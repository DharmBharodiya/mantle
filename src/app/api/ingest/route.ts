import { NextResponse } from "next/server";
import { prepareUpload } from "@/lib/ingestion/prepare";
import { extractFromGemini } from "@/lib/ingestion/gemini";
import { buildWellReport } from "@/lib/analytics/compute";
export const runtime="nodejs";
export async function POST(req:Request) {
  try {
    const data=await req.formData();
    const file=data.get("file");
    if(!(file instanceof File)) return NextResponse.json({error:"Missing file field"},{status:400});
    const prepared=await prepareUpload(file);
    const extraction=await extractFromGemini(prepared);
    return NextResponse.json(buildWellReport(extraction,{sourceKind:"PUBLIC_SOURCE_UNREVIEWED"}));
  } catch(e) {
    // No fabricated success or mock data on parsing failures.
    const reason=e instanceof Error ? e.message : "Extraction failed";
    const status=/Missing|Supported|Upload|signature/i.test(reason)?400:502;
    return NextResponse.json({error:reason},{status});
  }
}
