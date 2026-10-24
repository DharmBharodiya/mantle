import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareImage } from "@/lib/vision/inspect";
import { POST } from "@/app/api/vision/route";
const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class {
        models = { generateContent: generate };
    } }));
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=", "base64");
function request(file?: File) { const body = new FormData(); if (file)
    body.append("file", file); return new Request("http://localhost/api/vision", { method: "POST", body }); }
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("equipment vision boundaries", () => {
    it("checks image size, signatures, MIME and supported type", async () => {
        expect((await prepareImage(new File([png], "test.png", { type: "image/png" }))).mimeType).toBe("image/png");
        for (const f of [new File(["bad"], "bad.png"), new File([png], "bad.svg"), new File([png], "bad.png", { type: "text/html" }), new File([png], "wrong.jpg"), new File([], "empty.png")])
            await expect(prepareImage(f)).rejects.toThrow();
    });
    it("returns missing-file and missing-key errors without simulated observations", async () => {
        expect((await POST(request())).status).toBe(400);
        vi.stubEnv("GEMINI_API_KEY", "");
        const r = await POST(request(new File([png], "test.png")));
        expect(r.status).toBe(503);
        expect(await r.json()).toMatchObject({ code: "MISSING_KEY" });
        expect(generate).not.toHaveBeenCalled();
    });
    it("returns only validated unverified observations with server-established filename", async () => {
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        generate.mockResolvedValue({ text: JSON.stringify({ equipmentDescription: "Synthetic image, no identifiable equipment", imageQuality: "UNUSABLE", observations: [], limitations: ["No equipment visible; qualified human inspection required."] }) });
        const r = await POST(request(new File([png], "SYNTHETIC_TEST.png")));
        expect(r.status).toBe(200);
        const body = await r.json();
        expect(body.status).toBe("UNVERIFIED_VISUAL_OBSERVATIONS");
        expect(body.sourceFileName).toBe("SYNTHETIC_TEST.png");
        expect(body.observations).toEqual([]);
        expect(generate.mock.calls[0][0].config.systemInstruction).toMatch(/Do not diagnose/);
    });
    it("rejects corrupt model output and provider failures", async () => {
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        generate.mockResolvedValueOnce({ text: '{"diagnosis":"fault"}' }).mockRejectedValueOnce({ status: 503 });
        expect((await POST(request(new File([png], "test.png")))).status).toBe(422);
        expect((await POST(request(new File([png], "test.png")))).status).toBe(503);
    });
});
