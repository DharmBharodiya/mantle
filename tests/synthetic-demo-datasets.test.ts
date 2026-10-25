import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildWellReport } from "@/lib/analytics/compute";
import { prepareUpload } from "@/lib/ingestion/prepare";
import { extractStructuredTable } from "@/lib/ingestion/structured";

const cases = [
  { file: "SYNTHETIC_DEMO-single-day.csv", eventCount: 3, observed: 240, coverage: 16.6667, npt: 60, ilt: 0, unknown: 0, benchmarkCoverage: 66.6667, efficiency: null, exposure: 5000 },
  { file: "SYNTHETIC_DEMO-steady-operations.csv", eventCount: 5, observed: 1440, coverage: 100, npt: 0, ilt: 0, unknown: 0, benchmarkCoverage: 50, efficiency: null, exposure: 0 },
  { file: "SYNTHETIC_DEMO-confirmed-npt.csv", eventCount: 4, observed: 1440, coverage: 100, npt: 480, ilt: 0, unknown: 0, benchmarkCoverage: 100, efficiency: 66.6667, exposure: 40000 },
  { file: "SYNTHETIC_DEMO-slow-drilling-ilt.csv", eventCount: 5, observed: 1440, coverage: 100, npt: 240, ilt: 600, unknown: 0, benchmarkCoverage: 100, efficiency: 41.6667, exposure: 70000 },
  { file: "SYNTHETIC_DEMO-incomplete-unknown.csv", eventCount: 4, observed: 360, coverage: 25, npt: 60, ilt: 0, unknown: 60, benchmarkCoverage: 50, efficiency: null, exposure: 5000 },
] as const;

describe("synthetic judge-demo datasets", () => {
  it.each(cases)("imports $file through deterministic CSV parsing", async (scenario) => {
    const path = join(process.cwd(), "demo-fixtures", "synthetic", scenario.file);
    const file = new File([readFileSync(path)], scenario.file, { type: "text/csv" });
    const prepared = await prepareUpload(file);
    expect(prepared.synthetic).toBe(true);
    const extraction = extractStructuredTable(prepared);
    expect(extraction).not.toBeNull();
    const report = buildWellReport(extraction!, { sourceKind: "SYNTHETIC_DEMO" });

    expect(report.sourceKind).toBe("SYNTHETIC_DEMO");
    expect(report.events).toHaveLength(scenario.eventCount);
    expect(report.metrics.observedMinutes).toBe(scenario.observed);
    expect(report.metrics.coveragePct).toBeCloseTo(scenario.coverage, 2);
    expect(report.metrics.nptMinutes).toBe(scenario.npt);
    expect(report.metrics.iltMinutes).toBe(scenario.ilt);
    expect(report.metrics.unknownMinutes).toBe(scenario.unknown);
    expect(report.metrics.benchmarkCoveragePct).toBeCloseTo(scenario.benchmarkCoverage, 2);
    if (scenario.efficiency === null) expect(report.metrics.efficiencyPct).toBeNull();
    else expect(report.metrics.efficiencyPct).toBeCloseTo(scenario.efficiency, 1);
    expect(report.metrics.estimatedLossUsd).toBe(scenario.exposure);
    for (const event of report.events) {
      expect(event.evidence.fileName).toBe(scenario.file);
      expect(event.evidence.row).toBeGreaterThan(1);
      expect(event.evidence.snippet).not.toBe("");
    }
  });
});
