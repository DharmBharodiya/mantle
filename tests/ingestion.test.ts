import { afterEach, describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { prepareUpload, csvRecords, MAX_UPLOAD_BYTES } from "@/lib/ingestion/prepare";
import { POST } from "@/app/api/ingest/route";
import { DEMO_EXTRACTION } from "@/data/demo-report";
import { providerError } from "@/lib/server/errors";
const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class {
        models = { generateContent: generate };
    } }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
function request(file?: File) {
    const body = new FormData();
    if (file)
        body.append("file", file);
    return new Request("http://localhost/api/ingest", { method: "POST", body });
}
const text = new File(["Well Demo,2026-10-24\n00:00,03:00,DRILL 6100-6210'"], "day.csv", { type: "text/csv" });
describe("preparation and evidence", () => {
    it("preserves CSV records, quoted newlines and real row numbering", async () => {
        expect(csvRecords('a,b\n"quoted\nvalue",c')).toEqual(["a,b", '"quoted\nvalue",c']);
        const prepared = await prepareUpload(text);
        expect(prepared.rows?.[1].row).toBe(2);
        expect(prepared.contents).toContain("Row 2:");
        await expect(prepareUpload(new File(['a,"bad'], "bad.csv"))).rejects.toThrow(/unterminated/);
    });
    it("rejects unsupported types, empty files, oversized input and forged signatures", async () => {
        for (const file of [new File(["x"], "x.exe"), new File([], "empty.txt"), new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.csv"), new File(["not pdf"], "fake.pdf"), new File(["not zip"], "fake.xlsx"), new File(["a"], "x.csv", { type: "image/png" })])
            await expect(prepareUpload(file)).rejects.toThrow();
    });
    it("handles UTF-16 and rejects binary and text limits without truncation", async () => {
        const utf16 = new Uint8Array([255, 254, 65, 0, 66, 0]);
        expect((await prepareUpload(new File([utf16], "utf.txt"))).contents).toContain("AB");
        await expect(prepareUpload(new File([new Uint8Array([0, 0, 0])], "binary.txt"))).rejects.toThrow(/binary/);
        await expect(prepareUpload(new File(["a".repeat(120001)], "large.txt"))).rejects.toThrow(/truncated/);
        await expect(prepareUpload(new File(["x\n".repeat(1501)], "rows.csv"))).rejects.toThrow(/1,500 rows/);
    });
    it("rejects oversized workbook expansion before decompression", async () => {
        const bytes = new Uint8Array(64);
        bytes[0] = 0x50;
        bytes[1] = 0x4b;
        const view = new DataView(bytes.buffer);
        view.setUint32(4, 0x02014b50, true);
        view.setUint32(28, 25 * 1024 * 1024, true);
        await expect(prepareUpload(new File([bytes], "expanding.xlsx"))).rejects.toThrow(/expands/);
    });
    it("preserves spreadsheet sheets, rows and cell values", async () => {
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet("DDR").addRows([["Time", "Activity"], ["00:00", "CIRCULATE"]]);
        const bytes = await workbook.xlsx.writeBuffer();
        const file = new File([new Uint8Array(bytes)], "day.xlsx");
        const p = await prepareUpload(file);
        expect(p.rows?.[1]).toMatchObject({ row: 2, sheet: "DDR" });
        expect(p.contents).toContain("CIRCULATE");
    });
});
describe("ingestion endpoint", () => {
    it("returns explicit missing-file and missing-key errors without fallback", async () => {
        expect((await POST(request())).status).toBe(400);
        vi.stubEnv("GEMINI_API_KEY", "");
        const response = await POST(request(text));
        expect(response.status).toBe(503);
        expect(await response.json()).toMatchObject({ code: "MISSING_KEY" });
        expect(generate).not.toHaveBeenCalled();
    });
    it("extracts validated events and removes unverifiable quotes and invented text pages", async () => {
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        const extraction = structuredClone(DEMO_EXTRACTION);
        extraction.events = [extraction.events[0]];
        extraction.events[0].evidence = { fileName: "invented", page: 17, snippet: "invented unsupported quote", row: 2 };
        generate.mockResolvedValue({ text: JSON.stringify(extraction) });
        const response = await POST(request(text));
        expect(response.status).toBe(200);
        const report = await response.json();
        expect(report.events[0].evidence).toMatchObject({ fileName: "day.csv", page: null, snippet: "" });
        expect(report.events[0].confidence).toBe("LOW");
        expect(report.sourceKind).toBe("PUBLIC_SOURCE_UNREVIEWED");
        expect(generate.mock.calls[0][0].config.systemInstruction).toMatch(/untrusted DATA/);
    });
    it("keeps a supported exact excerpt and its real source row", async () => {
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        const extraction = structuredClone(DEMO_EXTRACTION);
        extraction.events = [extraction.events[0]];
        extraction.events[0].evidence = { fileName: "model-name", page: null, row: 2, snippet: "DRILL 6100-6210'" };
        generate.mockResolvedValue({ text: JSON.stringify(extraction) });
        const response = await POST(request(text));
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.events[0].evidence).toMatchObject({ fileName: "day.csv", row: 2, snippet: "DRILL 6100-6210'" });
        expect(body.events[0].confidence).toBe("HIGH");
    });
    it("rejects empty extraction, corrupt JSON and overlapping events", async () => {
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        generate.mockResolvedValueOnce({ text: JSON.stringify({ ...DEMO_EXTRACTION, events: [] }) }).mockResolvedValueOnce({ text: "{broken" });
        expect((await POST(request(text))).status).toBe(422);
        expect((await POST(request(text))).status).toBe(502);
        const extraction = structuredClone(DEMO_EXTRACTION);
        extraction.events[1].startMinute = 1;
        generate.mockResolvedValue({ text: JSON.stringify(extraction) });
        const response = await POST(request(text));
        expect(response.status).toBe(422);
        expect(await response.json()).toMatchObject({ code: "INVALID_TIMELINE" });
    });
    it("marks explicitly synthetic uploads as synthetic and warns on unverified PDF pages", async () => {
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        generate.mockResolvedValue({ text: JSON.stringify(DEMO_EXTRACTION) });
        const response = await POST(request(new File(["%PDF-1.4\nsynthetic test"], "SYNTHETIC_DEMO.pdf", { type: "application/pdf" })));
        const r = await response.json();
        expect(r.sourceKind).toBe("SYNTHETIC_DEMO");
        expect(r.warnings.join(" ")).toMatch(/PDF page/);
    });
    it("maps provider failures safely without returning key-bearing messages", async () => {
        expect(providerError({ status: 503, message: "secret" })).toMatchObject({ status: 503, code: "PROVIDER_BUSY" });
        expect(providerError({ message: "Retryable HTTP Error: Service Unavailable" })).toMatchObject({ status: 503, code: "PROVIDER_BUSY" });
        expect(providerError({ status: 429 })).toMatchObject({ status: 429 });
        expect(providerError({ name: "AbortError" }).status).toBe(504);
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        generate.mockRejectedValue({ status: 403, message: "secret-token-in-url" });
        const r = await POST(request(text));
        expect(JSON.stringify(await r.json())).not.toContain("secret-token");
    });
});
