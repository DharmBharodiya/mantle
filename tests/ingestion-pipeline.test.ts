import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import ExcelJS from "exceljs";
import { prepareUpload } from "@/lib/ingestion/prepare";
import { pdfChunks, mapBounded, MAX_PDF_PAGES } from "@/lib/ingestion/chunks";
import { extractFromGemini } from "@/lib/ingestion/gemini";
import { extractStructuredTable, mergeExtractions } from "@/lib/ingestion/structured";
import { POST } from "@/app/api/ingest/route";
import { DEMO_EXTRACTION } from "@/data/demo-report";
const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@google/genai", () => ({ ThinkingLevel: { LOW: "LOW" }, GoogleGenAI: class {
        models = { generateContent: generate, get: vi.fn().mockResolvedValue({ supportedActions: ["generateContent"], outputTokenLimit: 8192 }) };
    } }));
const header = "wellName,reportDate,startMinute,endMinute,activity,classification,startHoleDepthFt,endHoleDepthFt,note";
const row = "TEST_WELL,2026-10-24,0,60,DRILLING,PRODUCTIVE,1000,1035,DRILL 35 FT";
function request(file: File, stream = false) { const data = new FormData(); data.append("file", file); return new Request("http://localhost/api/ingest", { method: "POST", body: data, headers: stream ? { Accept: "application/x-ndjson" } : {} }); }
async function pdf(pages: number) { const doc = await PDFDocument.create(); for (let i = 0; i < pages; i++)
    doc.addPage().drawText(`SYNTHETIC page ${i + 1}`); return new File([new Uint8Array(await doc.save())], "test.pdf", { type: "application/pdf" }); }
beforeEach(() => { generate.mockReset(); vi.spyOn(console, "info").mockImplementation(() => { }); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("structured extraction without a model", () => {
    it("imports an explicit CSV with no key and uses exact row evidence", async () => {
        vi.stubEnv("GEMINI_API_KEY", "");
        const response = await POST(request(new File([header + "\n" + row], "report.csv", { type: "text/csv" })));
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.events).toHaveLength(1);
        expect(body.events[0].evidence).toMatchObject({ row: 2, fileName: "report.csv", snippet: "DRILL 35 FT" });
        expect(body.metrics.productiveMinutes).toBe(60);
        expect(generate).not.toHaveBeenCalled();
        expect(response.headers.get("server-timing")).toContain("prepare_upload");
    });
    it("imports equivalent XLSX without Gemini", async () => {
        vi.stubEnv("GEMINI_API_KEY", "");
        const wb = new ExcelJS.Workbook();
        wb.addWorksheet("DDR").addRows([header.split(","), row.split(",")]);
        const file = new File([new Uint8Array(await wb.xlsx.writeBuffer())], "report.xlsx");
        const extraction = extractStructuredTable(await prepareUpload(file));
        expect(extraction?.events[0].evidence).toMatchObject({ row: 2, sheet: "DDR" });
        expect(generate).not.toHaveBeenCalled();
    });
    it("rejects incomplete, invalid, empty and multi-day tables without guessing", async () => {
        for (const csv of ["activity,classification\nDRILLING,PRODUCTIVE", header + "\n" + row.replace(",0,60,", ",bad,60,"), header, header + "\n" + row + "\n" + row.replace("2026-10-24", "2026-10-25")]) {
            const p = await prepareUpload(new File([csv], "report.csv"));
            expect(() => extractStructuredTable(p)).toThrow();
        }
        expect(generate).not.toHaveBeenCalled();
    });
    it("deduplicates identical records but preserves conflicts for timeline validation", () => {
        const input = structuredClone(DEMO_EXTRACTION);
        input.events = [input.events[0]];
        const r = mergeExtractions([input, structuredClone(input)]);
        expect(r.events).toHaveLength(1);
        expect(r.warnings.join(" ")).toContain("deduplicated");
        expect(mergeExtractions([input]).events[0].id).toBe(r.events[0].id);
        const conflict = structuredClone(input);
        conflict.events[0].classification = "NPT";
        expect(mergeExtractions([input, conflict]).events).toHaveLength(2);
    });
});
describe("PDF boundaries and chunk references", () => {
    it("keeps a small single-page attachment and validates actual PDF structure", async () => {
        const input = await prepareUpload(await pdf(1));
        const chunks = await pdfChunks(input);
        expect(chunks).toHaveLength(1);
        expect(chunks[0].originalPages).toEqual([1]);
        expect(chunks[0].contents).toBe(input.contents);
        await expect(pdfChunks(await prepareUpload(new File(["%PDF-fake"], "bad.pdf")))).rejects.toMatchObject({ code: "INVALID_PDF" });
    });
    it("splits a large page count without dropping pages and rejects excessive pages", async () => {
        const chunks = await pdfChunks(await prepareUpload(await pdf(5)));
        expect(chunks.map(c => c.originalPages)).toEqual([[1, 2], [3, 4], [5]]);
        for (const chunk of chunks)
            expect((await PDFDocument.load(chunk.contents as Uint8Array)).getPageCount()).toBe(chunk.originalPages?.length);
        await expect(pdfChunks(await prepareUpload(await pdf(MAX_PDF_PAGES + 1)))).rejects.toMatchObject({ code: "PDF_PAGE_LIMIT" });
    });
    it("maps local citations back to original PDF pages and deduplicates repeated intervals", async () => {
        vi.stubEnv("GEMINI_API_KEY", "test-only");
        const first = { ...DEMO_EXTRACTION, events: [{ ...DEMO_EXTRACTION.events[0], evidence: { fileName: "invented", page: 2, snippet: "source phrase" } }] };
        const second = { ...first, events: [{ ...first.events[0], startMinute: 180, endMinute: 240, note: "second source block", evidence: { fileName: "invented", page: 1, snippet: "other phrase" } }] };
        generate.mockResolvedValueOnce({ text: JSON.stringify(first) }).mockResolvedValueOnce({ text: JSON.stringify(second) });
        const r = await extractFromGemini(await prepareUpload(await pdf(3)));
        expect(r.events.map(e => e.evidence.page)).toEqual([2, 3]);
        expect(r.events.every(e => e.evidence.fileName === "test.pdf")).toBe(true);
    });
    it("bounds concurrency instead of starting all requests together", async () => {
        let running = 0;
        let maximum = 0;
        const result = await mapBounded([1, 2, 3, 4, 5], 2, async (value) => { running++; maximum = Math.max(maximum, running); await new Promise(resolve => setTimeout(resolve, 2)); running--; return value * 2; });
        expect(maximum).toBe(2);
        expect(result).toEqual([2, 4, 6, 8, 10]);
    });
});
describe("actual server progress protocol", () => {
    it("emits observed stages in order and imports only a final complete report", async () => {
        const response = await POST(request(new File([header + "\n" + row], "report.csv"), true));
        expect(response.headers.get("content-type")).toContain("application/x-ndjson");
        const messages = (await response.text()).trim().split("\n").map(line => JSON.parse(line));
        expect(messages.filter(m => m.type === "stage").map(m => m.stage)).toEqual(["preparing", "extracting", "validating", "computing", "ready"]);
        expect(messages.at(-1).type).toBe("result");
        expect(messages.at(-1).report.metrics.observedMinutes).toBe(60);
    });
    it("returns a terminal error instead of an invented result for invalid intervals", async () => {
        const response = await POST(request(new File([header + "\n" + row.replace(",0,60,", ",60,0,")], "report.csv"), true));
        const messages = (await response.text()).trim().split("\n").map(line => JSON.parse(line));
        expect(messages.at(-1).type).toBe("error");
        expect(messages.some(m => m.type === "result")).toBe(false);
        expect(messages.some(m => m.stage === "ready")).toBe(false);
    });
});

describe("route deadline and provider failures", () => {
  it("returns a descriptive non-2xx generation timeout with correlation headers", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only");generate.mockRejectedValue({name:"TimeoutError",message:"The operation timed out"});
    const response=await POST(request(new File(["00:00-01:00 drilling, 1000 to 1035 ft"],"unstructured.txt")));
    expect(response.status).toBe(504);const body=await response.json();expect(body.code).toBe("PROVIDER_TIMEOUT");expect(body.requestId).toBe(response.headers.get("x-request-id"));expect(response.headers.get("server-timing")).toContain("extract_activities");expect(body.events).toBeUndefined();expect(generate).toHaveBeenCalledOnce();
  });
  it("stops after bounded busy retries and emits no result envelope", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only");generate.mockRejectedValue({status:503,message:"Service Unavailable"});
    const response=await POST(request(new File(["00:00-01:00 drilling, 1000 to 1035 ft"],"unstructured.txt"),true));
    const messages=(await response.text()).trim().split("\n").map(line=>JSON.parse(line));expect(messages.at(-1)).toMatchObject({type:"error",code:"PROVIDER_BUSY",status:503});expect(generate).toHaveBeenCalledTimes(2);expect(messages.some(message=>message.type==="result")).toBe(false);
  });
});
