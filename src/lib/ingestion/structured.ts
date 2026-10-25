import { createHash } from "node:crypto";
import { ActivitySchema, ClassificationSchema, ExtractionSchema, type DrillingEvent, type Extraction } from "@/types/telemetry";
import { ServiceError } from "@/lib/server/errors";
import { boundedWarnings } from "@/lib/report-warnings";
import type { PreparedUpload, SourceRow } from "./prepare";
const normalize = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
function minute(value: string): number {
    const text = value.trim();
    if (/^\d{1,2}:\d{2}$/.test(text)) {
        const [hours, minutes] = text.split(":").map(Number);
        if (minutes > 59 || hours > 24 || (hours === 24 && minutes !== 0))
            return NaN;
        return hours * 60 + minutes;
    }
    return /^\d+$/.test(text) ? Number(text) : NaN;
}
function depth(value: string): number | null {
    if (!value.trim() || /^(unknown|null|n\/a|na)$/i.test(value.trim()))
        return null;
    // Accept decimal/scientific notation and correctly grouped thousands only.
    // Removing every comma first would silently turn a malformed "1,2" into 12.
    const numeric = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
    const grouped = /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
    if (!numeric.test(value.trim()) && !grouped.test(value.trim()))
        throw new ServiceError("Structured depth values must use decimal numbers in feet or correctly grouped thousands. Review the source row.", 422, "INVALID_STRUCTURED_ROW");
    const parsed = Number(value.replaceAll(",", ""));
    if (!Number.isFinite(parsed) || parsed < 0)
        throw new ServiceError("Structured depth values must be nonnegative numbers or blank/UNKNOWN. Review the source row.", 422, "INVALID_STRUCTURED_ROW");
    return parsed;
}
export function mergeExtractions(extractions: Extraction[]): Extraction {
    const dates = [...new Set(extractions.map(item => item.reportDate.trim()).filter(Boolean))];
    const names = [...new Set(extractions.map(item => item.wellName.trim()).filter(Boolean))];
    if (dates.length > 1)
        throw new ServiceError("This source contains multiple report days. Split it by local report day; no day was silently selected.", 422, "MULTI_DAY_REPORT");
    if (names.length > 1)
        throw new ServiceError("This source contains more than one well name. Split the document by well before importing.", 422, "MULTI_WELL_REPORT");
    const warnings = extractions.flatMap(item => item.warnings);
    const seen = new Map<string, number>();
    const events: DrillingEvent[] = [];
    let duplicates = 0;
    for (const event of extractions.flatMap(item => item.events)) {
        const key = JSON.stringify([event.startMinute, event.endMinute, event.activity, event.classification, event.startHoleDepthFt, event.endHoleDepthFt, event.note.replace(/\s+/g, " ").trim()]);
        const duplicate = seen.get(key);
        if (duplicate !== undefined) {
            const previous = events[duplicate];
            const confidenceRank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
            if (confidenceRank[event.confidence] < confidenceRank[previous.confidence]) previous.confidence = event.confidence;
            if (!previous.evidence.snippet.trim() && event.evidence.snippet.trim()) previous.evidence = { ...event.evidence };
            duplicates++;
            continue;
        }
        seen.set(key, events.length);
        events.push({ ...event, id: `event-${createHash("sha256").update(key).digest("hex").slice(0, 16)}` });
    }
    if (duplicates)
        warnings.push(`${duplicates} exact repeated source intervals were deduplicated. Conflicting overlapping intervals are not merged.`);
    events.sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
    if (!events.length)
        throw new ServiceError("No usable drilling events were found. Use a single-day drilling report with explicit time intervals; unrelated customer lists are not drilling reports.", 422, "NO_DRILLING_EVENTS");
    return ExtractionSchema.parse({ wellName: names[0] ?? "", reportDate: dates[0] ?? "", events, warnings: boundedWarnings(warnings) });
}
export function extractStructuredTable(input: PreparedUpload): Extraction | null {
    if (input.format !== "csv" && input.format !== "xlsx")
        return null;
    const groups = new Map<string, SourceRow[]>();
    for (const row of input.rows ?? []) {
        const name = row.sheet ?? "";
        const rows = groups.get(name) ?? [];
        rows.push(row);
        groups.set(name, rows);
    }
    const extractions: Extraction[] = [];
    let matched = false;
    let unknownSheets = 0;
    for (const rows of groups.values()) {
        let header: string[] | undefined;
        const events: DrillingEvent[] = [];
        const dates = new Set<string>();
        const names = new Set<string>();
        for (const row of rows) {
            if (!row.cells?.some(cell => cell.trim()))
                continue;
            const candidate = row.cells.map(normalize);
            if (!header) {
                if (candidate.includes("activity") && candidate.includes("classification")) {
                    matched = true;
                    header = candidate;
                    const named = candidate.filter(Boolean);
                    if (new Set(named).size !== named.length)
                        throw new ServiceError("Duplicate structured column names are ambiguous. Give each source column a unique name before importing.", 422, "AMBIGUOUS_STRUCTURED_COLUMNS");
                    if (!candidate.some(column => ["startminute", "starttime"].includes(column)) || !candidate.some(column => ["endminute", "endtime"].includes(column)))
                        throw new ServiceError("Structured table is missing start/end time columns. Add startMinute/endMinute or startTime/endTime; times are never guessed.", 422, "INCOMPLETE_TABLE");
                }
                continue;
            }
            if (candidate.join("|") === header.join("|"))
                continue;
            if (row.cells.slice(header.length).some(cell => cell.trim()))
                throw new ServiceError("A structured row has data beyond its column headers. Correct the table before importing.", 422, "INVALID_STRUCTURED_ROW");
            const get = (keys: string[], equivalent: (value: string) => string | number = value => value): string => {
                const values = keys.flatMap(key => {
                    const index = header!.indexOf(key);
                    const value = index < 0 ? "" : row.cells?.[index]?.trim() ?? "";
                    return value ? [value] : [];
                });
                if (new Set(values.map(equivalent)).size > 1)
                    throw new ServiceError(`Conflicting structured columns (${keys.join(" / ")}) in source row ${row.row}. Correct the source; no column was silently selected.`, 422, "AMBIGUOUS_STRUCTURED_COLUMNS");
                return values[0] ?? "";
            };
            const startMinute = minute(get(["startminute", "starttime"], minute));
            const endMinute = minute(get(["endminute", "endtime"], minute));
            const activity = ActivitySchema.safeParse(get(["activity"]).toUpperCase());
            const classification = ClassificationSchema.safeParse(get(["classification"]).toUpperCase());
            if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute) || !activity.success || !classification.success)
                throw new ServiceError(`Invalid explicit time, activity or classification in source row ${row.row}. No values were inferred.`, 422, "INVALID_STRUCTURED_ROW");
            const reportDate = get(["reportdate"]);
            const wellName = get(["wellname", "wellid"]);
            if (reportDate)
                dates.add(reportDate);
            if (wellName)
                names.add(wellName);
            const note = get(["note", "observation"]);
            const startHoleDepthFt = depth(get(["startholedepthft"]));
            const endHoleDepthFt = depth(get(["endholedepthft"]));
            events.push({ id: `row-${row.row}`, startMinute, endMinute, activity: activity.data, classification: classification.data, startHoleDepthFt, endHoleDepthFt, note, explanation: `Source explicitly records ${activity.data.replaceAll("_", " ").toLowerCase()} with ${classification.data} classification. No AI interpretation was applied.`, evidence: { fileName: input.fileName, page: null, row: row.row, sheet: row.sheet ?? null, snippet: (note || row.text).slice(0, 1200) }, confidence: "HIGH" });
        }
        if (!header) {
            if (rows.some(row => row.cells?.some(cell => cell.trim())))
                unknownSheets++;
            continue;
        }
        if (dates.size > 1)
            throw new ServiceError("Structured table contains multiple report days. Split the file by day.", 422, "MULTI_DAY_REPORT");
        if (names.size > 1)
            throw new ServiceError("Structured table contains multiple wells. Split the file by well.", 422, "MULTI_WELL_REPORT");
        const warnings = ["Activities were parsed from explicit structured columns without a Gemini call. Classifications remain unverified source statements."];
        if (!header.includes("startholedepthft") || !header.includes("endholedepthft"))
            warnings.push("Explicit hole-depth columns in feet are unavailable; missing depths were left null.");
        extractions.push(ExtractionSchema.parse({ wellName: [...names][0] ?? "", reportDate: [...dates][0] ?? "", events, warnings }));
    }
    if (!matched)
        return null;
    if (unknownSheets)
        throw new ServiceError("A workbook mixes explicit tables with unrecognized non-empty sheets. Export only the report-day sheet to avoid silently skipping data.", 422, "MIXED_WORKBOOK");
    return mergeExtractions(extractions);
}
