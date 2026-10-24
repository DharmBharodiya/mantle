import { NextResponse } from "next/server";
import { inspectEquipment, MAX_IMAGE_BYTES } from "@/lib/vision/inspect";
import { safeApiError, ServiceError } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length")) > MAX_IMAGE_BYTES + 65536) throw new ServiceError("Image must be no larger than 6 MB.", 413, "IMAGE_SIZE");
    let data: FormData; try { data = await req.formData(); } catch { throw new ServiceError("Send an image as multipart field file.", 400, "INVALID_MULTIPART"); }
    const file = data.get("file"); if (!(file instanceof File)) throw new ServiceError("Missing image file field.", 400, "MISSING_FILE");
    const result = await inspectEquipment(file, req.signal);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const result = safeApiError(error); return NextResponse.json({ error: result.error, code: result.code }, { status: result.status }); }
}
