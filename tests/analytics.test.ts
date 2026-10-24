import { describe, expect, it } from "vitest";
import { DEMO_EXTRACTION } from "@/data/demo-report";
import { buildWellReport, computeILTMinutes } from "@/lib/analytics/compute";
import { ScenarioSchema } from "@/types/telemetry";
const scenario = ScenarioSchema.parse({});
describe("analytics invariants", () => {
  it("sorts without mutating input and produces repeatable metrics", () => {
    const input = structuredClone(DEMO_EXTRACTION); input.events.reverse();
    const a = buildWellReport(input); const b = buildWellReport(input);
    expect(a.metrics).toEqual(b.metrics); expect(a.events[0].id).toBe("ev-01"); expect(input.events[0].id).toBe("ev-09");
    expect(a.metrics.productiveMinutes + a.metrics.nptMinutes + a.metrics.unknownMinutes).toBe(a.metrics.observedMinutes);
  });
  it("preserves unknown time, gaps, missing depths and null fuel", () => {
    const input = structuredClone(DEMO_EXTRACTION); input.events = [{ ...input.events[0], startMinute: 60, endMinute: 120, classification: "UNKNOWN", startHoleDepthFt: null, endHoleDepthFt: null }];
    const report = buildWellReport(input);
    expect(report.metrics.unknownMinutes).toBe(60); expect(report.metrics.unobservedMinutes).toBe(1380); expect(report.metrics.efficiencyPct).toBeNull();
    expect(report.depthCurve).toEqual([]); expect(report.insights[0].iltMinutes).toBeNull(); expect(report.metrics.modeledExcessCo2Tons).toBeNull();
  });
  it("never infers trip ILT or flat drilling ILT from hole depth", () => {
    for (const activity of ["TRIPPING_OUT", "TRIPPING_IN"] as const) expect(computeILTMinutes({ ...DEMO_EXTRACTION.events[0], activity }, scenario)).toBeNull();
    expect(computeILTMinutes({ ...DEMO_EXTRACTION.events[0], endHoleDepthFt: 6100 }, scenario)).toBeNull();
  });
  it("rejects zero durations, overlaps, duplicate IDs and cross-midnight intervals", () => {
    for (const change of [{ endMinute: 0 }, { endMinute: 1, startMinute: 1430 }]) {
      const input = structuredClone(DEMO_EXTRACTION); input.events = [{ ...input.events[0], ...change }]; expect(() => buildWellReport(input)).toThrow();
    }
    const input = structuredClone(DEMO_EXTRACTION); input.events[1].id = input.events[0].id; expect(() => buildWellReport(input)).toThrow(/Duplicate/);
    input.events[1].id = "second"; input.events[1].startMinute = 100; expect(() => buildWellReport(input)).toThrow(/Overlapping/);
  });
  it("accepts 24:00 only as an end and validates real calendar dates", () => {
    expect(buildWellReport(DEMO_EXTRACTION).events.at(-1)?.endMinute).toBe(1440);
    expect(() => buildWellReport({ ...DEMO_EXTRACTION, reportDate: "2026-02-30" })).toThrow(/date/);
    expect(() => buildWellReport({ ...DEMO_EXTRACTION, reportDate: "" })).not.toThrow();
  });
  it("retains decreases as source observations and warns instead of repairing depths", () => {
    const input = structuredClone(DEMO_EXTRACTION); input.events = [{ ...input.events[0], startHoleDepthFt: 200, endHoleDepthFt: 100 }];
    const r = buildWellReport(input); expect(r.depthCurve.map(p => p.holeDepthFt)).toEqual([200,100]); expect(r.warnings.join(" ")).toMatch(/decreases/); expect(r.insights[0].iltMinutes).toBeNull();
  });
  it("recalculates scenario costs and carbon without double-counting NPT and ILT", () => {
    const a = buildWellReport(DEMO_EXTRACTION, { scenario: { rigDailyUsd: 120000 } });
    const b = buildWellReport(DEMO_EXTRACTION, { scenario: { rigDailyUsd: 240000, excessFuelGallonsPerHour: 10 } });
    expect(b.metrics.estimatedLossUsd).toBe(a.metrics.estimatedLossUsd * 2);
    expect(b.metrics.estimatedLossUsd).toBeCloseTo(b.metrics.estimatedNptCostUsd + b.metrics.estimatedIltOpportunityUsd);
    for (const insight of b.insights) if (insight.nptMinutes) expect(insight.iltMinutes).toBeNull();
    expect(b.metrics.modeledExcessFuelGallons).toBeCloseTo((b.metrics.nptMinutes + b.metrics.iltMinutes) / 60 * 10);
    const faster = buildWellReport(DEMO_EXTRACTION, { scenario: { drillBenchmarkFtPerHour: 70 } }); expect(faster.metrics.iltMinutes).toBeGreaterThan(a.metrics.iltMinutes);
  });
});
