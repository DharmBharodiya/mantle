import { NextResponse } from "next/server";
import { prepareUpload, MAX_UPLOAD_BYTES } from "@/lib/ingestion/prepare";
import { extractFromGemini } from "@/lib/ingestion/gemini";
import { buildWellReport } from "@/lib/analytics/compute";
import { ServiceError, safeApiError } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const length = Number(req.headers.get("content-length"));
    if (length > MAX_UPLOAD_BYTES + 65536) throw new ServiceError("Upload must be no larger than 8 MB.", 413, "FILE_TOO_LARGE");
    let data: FormData;
    try { data = await req.formData(); } catch { throw new ServiceError("Send a multipart upload with a file field.", 400, "INVALID_MULTIPART"); }
    const file = data.get("file");
    if (!(file instanceof File)) throw new ServiceError("Missing file field.", 400, "MISSING_FILE");
    const prepared = await prepareUpload(file);
    const extraction = await extractFromGemini(prepared, req.signal);
    let report;
    try { report = buildWellReport(extraction, { sourceKind: prepared.synthetic ? "SYNTHETIC_DEMO" : "PUBLIC_SOURCE_UNREVIEWED" }); }
    catch (error) { throw new ServiceError(error instanceof Error ? error.message : "Invalid event timeline.", 422, "INVALID_TIMELINE"); }
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const result = safeApiError(error);
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status, headers: { "Cache-Control": "no-store" } });
  }
}
