import { PDFDocument } from "pdf-lib";
import { ServiceError } from "@/lib/server/errors";
import { throwIfAborted } from "./context";
import type { PreparedUpload } from "./prepare";
export const MAX_PDF_PAGES = 24;
export const MAX_CHUNK_BYTES = 4 * 1024 * 1024;
export const PDF_PAGES_PER_CHUNK = 2;
export type ExtractionChunk = PreparedUpload & {
    originalPages?: number[];
    chunkIndex: number;
};
export async function pdfChunks(input: PreparedUpload, signal?: AbortSignal, selectedPages?: number[]): Promise<ExtractionChunk[]> {
    if (!(input.contents instanceof Uint8Array))
        throw new ServiceError("Expected PDF bytes.", 422, "INVALID_PDF");
    throwIfAborted(signal);
    let document: PDFDocument;
    try {
        document = await PDFDocument.load(input.contents, { updateMetadata: false, throwOnInvalidObject: true });
    }
    catch {
        throw new ServiceError("PDF could not be read, is encrypted or is corrupt. Export an unencrypted single-day PDF.", 422, "INVALID_PDF");
    }
    const count = document.getPageCount();
    if (!count || count > MAX_PDF_PAGES)
        throw new ServiceError(`PDF must contain 1–${MAX_PDF_PAGES} pages. Split larger files into single-day reports; no pages were discarded.`, 413, "PDF_PAGE_LIMIT");
    if (document.context.enumerateIndirectObjects().length > 10000)
        throw new ServiceError("PDF is too complex to process within this request. Export a simpler single-day report.", 413, "PDF_COMPLEXITY");
    if (selectedPages && (!selectedPages.length || selectedPages.some((page, index) => !Number.isInteger(page) || page < 1 || page > count || (index > 0 && page !== selectedPages[index - 1] + 1))))
        throw new ServiceError("Choose an existing, contiguous page range from the original PDF. No report was imported.", 400, "INVALID_REPORT_PAGES");
    if (!selectedPages && count <= PDF_PAGES_PER_CHUNK && input.contents.length <= 2 * 1024 * 1024)
        return [{ ...input, originalPages: Array.from({ length: count }, (_, i) => i + 1), chunkIndex: 0 }];
    const result: ExtractionChunk[] = [];
    async function add(indices: number[]) {
        throwIfAborted(signal);
        const part = await PDFDocument.create();
        const copied = await part.copyPages(document, indices);
        copied.forEach(page => part.addPage(page));
        const bytes = await part.save({ useObjectStreams: true, addDefaultPage: false });
        if (bytes.length > MAX_CHUNK_BYTES && indices.length > 1) {
            for (const index of indices)
                await add([index]);
            return;
        }
        if (bytes.length > MAX_CHUNK_BYTES)
            throw new ServiceError("A single PDF page exceeds the processing limit. Export that page at a lower image resolution.", 413, "PDF_PAGE_SIZE");
        result.push({ ...input, contents: bytes, originalPages: indices.map(index => index + 1), chunkIndex: result.length });
    }
    const indices = selectedPages ? selectedPages.map(page => page - 1) : Array.from({length: count}, (_, index) => index);
    for (let page = 0; page < indices.length; page += PDF_PAGES_PER_CHUNK)
        await add(indices.slice(page, page + PDF_PAGES_PER_CHUNK));
    return result;
}
export function textChunks(input: PreparedUpload): ExtractionChunk[] {
    if (typeof input.contents !== "string" || !input.rows?.length)
        return [{ ...input, chunkIndex: 0 }];
    const groups: NonNullable<PreparedUpload["rows"]>[] = [];
    let group: NonNullable<PreparedUpload["rows"]> = [];
    let characters = 0;
    for (const row of input.rows) {
        if (row.text.length > 10000)
            throw new ServiceError("A text row exceeds the extraction section limit. Split the source into shorter report-day sections.", 413, "TEXT_SECTION_LIMIT");
        if (group.length && (group.length >= 50 || characters + row.text.length > 10000)) {
            groups.push(group);
            group = [];
            characters = 0;
        }
        group.push(row);
        characters += row.text.length;
    }
    if (group.length)
        groups.push(group);
    if (groups.length > 12)
        throw new ServiceError("This unstructured report requires too many extraction sections. Split it by report day or provide explicit activity/time columns.", 413, "TEXT_SECTION_LIMIT");
    return groups.map((rows, chunkIndex) => ({ ...input, rows, contents: rows.map(row => `${row.sheet ? `Sheet ${JSON.stringify(row.sheet)} · ` : ""}Row ${row.row}: ${row.text}`).join("\n"), chunkIndex }));
}
export async function mapBounded<T, R>(items: T[], limit: number, operation: (item: T, index: number) => Promise<R>, signal?: AbortSignal): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;
    let failure: unknown;
    let failed = false;
    async function worker() { while (!failed) {
        throwIfAborted(signal);
        const index = next++;
        if (index >= items.length)
            return;
        try {
            results[index] = await operation(items[index], index);
        }
        catch (error) {
            if (!failed) { failure = error; failed = true; }
            throw error;
        }
    } }
    const settled = await Promise.allSettled(Array.from({ length: Math.min(limit, items.length) }, worker));
    const rejected = settled.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failed)
        throw failure;
    if (rejected)
        throw rejected.reason;
    return results;
}
