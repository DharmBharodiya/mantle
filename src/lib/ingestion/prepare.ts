import ExcelJS from "exceljs";
import { ServiceError } from "@/lib/server/errors";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_TEXT_CHARS = 120000;
export const MAX_ROWS = 1500;
export type SourceRow = {
    row: number;
    sheet?: string;
    text: string;
};
export type PreparedUpload = {
    fileName: string;
    mimeType: string;
    contents: string | Uint8Array;
    rows?: SourceRow[];
    synthetic: boolean;
};
const mimes: Record<string, string[]> = { pdf: ["application/pdf"], csv: ["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"], txt: ["text/plain"], xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] };
export function validateFile(file: File) {
    const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
    if (!mimes[extension])
        throw new ServiceError("Supported files: PDF, CSV, XLSX or TXT.", 415, "UNSUPPORTED_FILE");
    if (!file.size)
        throw new ServiceError("The uploaded file is empty.", 400, "EMPTY_FILE");
    if (file.size > MAX_UPLOAD_BYTES)
        throw new ServiceError("Upload must be no larger than 8 MB.", 413, "FILE_TOO_LARGE");
    if (file.type && file.type !== "application/octet-stream" && !mimes[extension].includes(file.type))
        throw new ServiceError("File content type does not match its extension.", 415, "MIME_MISMATCH");
    return extension;
}
export function decodeText(bytes: Uint8Array): string {
    try {
        const encoding = bytes[0] === 255 && bytes[1] === 254 ? "utf-16le" : bytes[0] === 254 && bytes[1] === 255 ? "utf-16be" : "utf-8";
        const text = new TextDecoder(encoding, { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
        if (text.includes("\0") || !text.trim())
            throw new Error();
        if (text.length > MAX_TEXT_CHARS)
            throw new ServiceError("Text exceeds 120,000 characters. Split the file into single report days; no content was truncated.", 413, "TEXT_LIMIT");
        return text;
    }
    catch (error) {
        if (error instanceof ServiceError)
            throw error;
        throw new ServiceError("Text file is empty, binary or not valid UTF-8/UTF-16. Export it as a UTF-8 CSV or TXT.", 422, "INVALID_TEXT");
    }
}
export function csvRecords(text: string): string[] {
    const records: string[] = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (char === '"') {
            if (quoted && text[index + 1] === '"') {
                current += '""';
                index++;
                continue;
            }
            quoted = !quoted;
        }
        if (char === "\n" && !quoted) {
            records.push(current.replace(/\r$/, ""));
            current = "";
        }
        else
            current += char;
    }
    if (quoted)
        throw new ServiceError("CSV has an unterminated quoted field.", 422, "INVALID_CSV");
    if (current.trim())
        records.push(current.replace(/\r$/, ""));
    return records;
}
export async function prepareUpload(file: File): Promise<PreparedUpload> {
    const extension = validateFile(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const fileName = file.name.replace(/^.*[\\/]/, "").slice(0, 255);
    if (extension === "pdf") {
        if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
            throw new ServiceError("File signature is not a valid PDF.", 422, "INVALID_PDF");
        return { fileName, mimeType: "application/pdf", contents: bytes, synthetic: /^SYNTHETIC_DEMO/i.test(fileName) };
    }
    let rows: SourceRow[];
    if (extension === "xlsx") {
        if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
            throw new ServiceError("File signature is not a valid XLSX workbook.", 422, "INVALID_XLSX");
        // Bound archive expansion before ExcelJS decompresses cell/shared-string XML.
        const zip = new DataView(bytes.buffer);
        let expandedBytes = 0;
        let entries = 0;
        for (let offset = 0; offset + 46 <= bytes.length; offset++) {
            if (zip.getUint32(offset, true) !== 0x02014b50)
                continue;
            expandedBytes += zip.getUint32(offset + 24, true);
            entries++;
            if (expandedBytes > 20 * 1024 * 1024 || entries > 250)
                throw new ServiceError("Workbook expands beyond the processing limit. Export a smaller single-day CSV.", 413, "WORKBOOK_EXPANSION_LIMIT");
            offset += 45 + zip.getUint16(offset + 28, true) + zip.getUint16(offset + 30, true) + zip.getUint16(offset + 32, true);
        }
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(Buffer.from(bytes) as never);
        }
        catch {
            throw new ServiceError("Workbook could not be read. Use an unencrypted XLSX, CSV or TXT file.", 422, "INVALID_XLSX");
        }
        rows = [];
        workbook.eachSheet(sheet => sheet.eachRow((row, number) => {
            rows.push({ row: number, sheet: sheet.name, text: row.values ? JSON.stringify(row.values) : "" });
            if (rows.length > MAX_ROWS)
                throw new ServiceError("Workbook exceeds 1,500 non-empty rows. Split it by report day; no rows were silently discarded.", 413, "ROW_LIMIT");
        }));
    }
    else {
        const text = decodeText(bytes);
        rows = (extension === "csv" ? csvRecords(text) : text.split(/\r?\n/)).map((text, index) => ({ row: index + 1, text }));
    }
    if (!rows.length || rows.length > MAX_ROWS)
        throw new ServiceError("Use a report with 1–1,500 rows. Split larger files by report day.", 413, "ROW_LIMIT");
    const contents = rows.map(row => `${row.sheet ? `Sheet ${JSON.stringify(row.sheet)} · ` : ""}Row ${row.row}: ${row.text}`).join("\n");
    if (contents.length > MAX_TEXT_CHARS)
        throw new ServiceError("Prepared content exceeds 120,000 characters. Split it by report day; nothing was truncated.", 413, "TEXT_LIMIT");
    return { fileName, mimeType: "text/plain", contents, rows, synthetic: /^SYNTHETIC_DEMO/i.test(fileName) || rows.some(row => /^#?\s*SYNTHETIC_DEMO\b/.test(row.text)) };
}
