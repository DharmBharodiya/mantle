import { describe, expect, it } from "vitest";
import { DEMO_REPORT } from "@/data/demo-report";
import { addSummary, csvCell, exportEventsCsv, exportSnapshot, importSnapshot, readSummaries, summarizeReport } from "@/lib/reports/manage";
describe("report management and safe exports", () => {
    it("exports evidence with scenario assumptions and protects spreadsheet formulas", () => {
        const csv = exportEventsCsv(DEMO_REPORT);
        expect(csv).toContain('"SYNTHETIC_DEMO"');
        expect(csv).toContain("scenario_rig_usd_per_day");
        expect(csv).toContain("exact_excerpt");
        expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
        expect(csvCell("  +formula")).toContain("'");
        expect(csvCell('a,"b"')).toBe('"a,""b"""');
        expect(csvCell(null)).toBe('""');
    });
    it("roundtrips explicit snapshots, recalculates metrics and never promotes verification", () => {
        const snapshot = JSON.parse(exportSnapshot(DEMO_REPORT));
        snapshot.report.metrics.nptMinutes = 999;
        expect(importSnapshot(JSON.stringify(snapshot)).metrics.nptMinutes).toBe(300);
        expect(importSnapshot(JSON.stringify(snapshot)).sourceKind).toBe("SYNTHETIC_DEMO");
        snapshot.report.sourceKind = "HUMAN_VERIFIED";
        expect(importSnapshot(JSON.stringify(snapshot)).sourceKind).toBe("PUBLIC_SOURCE_UNREVIEWED");
        expect(() => importSnapshot('{}')).toThrow();
        expect(() => importSnapshot('x'.repeat(2 * 1024 * 1024 + 1))).toThrow();
    });
    it("bounds browser history to summaries, without evidence excerpts or raw documents", () => {
        const summary = summarizeReport(DEMO_REPORT, "test");
        expect(JSON.stringify(summary)).not.toContain("snippet");
        expect(JSON.stringify(summary)).not.toContain("PUMP #2");
        let history: ReturnType<typeof summarizeReport>[] = [];
        for (let index = 0; index < 40; index++)
            history = addSummary(history, { ...summary, id: String(index) });
        expect(history).toHaveLength(30);
        expect(history[0].id).toBe("39");
        expect(readSummaries(JSON.stringify(history))).toEqual(history);
        expect(readSummaries(null)).toEqual([]);
        expect(() => readSummaries('{broken')).toThrow();
        expect(() => readSummaries('[{"id":"bad"}]')).toThrow();
    });
});
