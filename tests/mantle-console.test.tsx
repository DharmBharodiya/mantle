import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Extraction } from "@/types/telemetry";
import { renderToStaticMarkup } from "react-dom/server";
import { buildWellReport } from "@/lib/analytics/compute";
import { DEMO_REPORT } from "@/data/demo-report";
import { ConsoleOverview } from "@/components/mantle/console/ConsoleOverview";
import { EvidencePanel } from "@/components/mantle/console/EvidencePanel";
import { KpiStrip } from "@/components/mantle/console/KpiStrip";
import { DepthTimeline } from "@/components/mantle/console/DepthTimeline";
import { classPill, sourceReference } from "@/components/mantle/console/presentation";

describe("Mantle console preserves canonical report truth", () => {
  const source = { ...DEMO_REPORT.events[0], id: "uploaded-1", classification: "UNKNOWN" as const, startHoleDepthFt: null, endHoleDepthFt: null, evidence: { fileName: "report.csv", page: null, row: 12, sheet: "Daily log", snippet: "Exact source <script>not executable</script>\nSecond line stays intact." } };
  const unknown = buildWellReport({wellName:"Uploaded well",reportDate:"2026-10-24",events:[source],warnings:[]});
  it("does not turn unknown classification or unavailable metrics into zero or productive", () => {
    const before=JSON.stringify(unknown);
    const html=renderToStaticMarkup(<ConsoleOverview report={unknown} selectedId={source.id} onSelect={()=>{}} onScenario={()=>{}}/>);
    expect(html).toContain("Unknown"); expect(html).toContain("No depth observations"); expect(html).toContain("Not available");
    expect(classPill(source,unknown).label).toBe("Unknown");expect(JSON.stringify(unknown)).toBe(before);
    expect(html).not.toContain("Day summary · Gemini");expect(html).not.toContain("0.0 t");
  });
  it("retains the entire exact escaped source, genuine row and sheet without inventing a page", () => {
    const html=renderToStaticMarkup(<EvidencePanel report={unknown} selectedId={source.id}/>);
    expect(html).toContain("&lt;script&gt;not executable&lt;/script&gt;\nSecond line stays intact.");
    expect(sourceReference(source)).toBe("report.csv · Page unavailable · Sheet Daily log · Row 12");
    expect(html).not.toContain("Page 1");expect(html).not.toContain("Gemini ·");
  });
  it("shows efficiency as unavailable when most productive time has no benchmark", () => {
    const fixture=JSON.parse(readFileSync("demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json","utf8")) as {report:Extraction};
    const report=buildWellReport(fixture.report);
    const html=renderToStaticMarkup(<KpiStrip report={report}/>);
    expect(html).toContain("Benchmark-adjusted efficiency");expect(html).toContain("Not available");expect(html).toContain("14.6% of productive time benchmark eligible");expect(html).not.toContain("100.0%");
  });
  it("renders canonical values from the selected report rather than kit demo constants", () => {
    const report=buildWellReport(DEMO_REPORT,{scenario:{...DEMO_REPORT.scenario,rigDailyUsd:240000,excessFuelGallonsPerHour:null}});
    const html=renderToStaticMarkup(<KpiStrip report={report}/>);
    expect(html).toContain("$50,000");expect(html).toContain("5.0");expect(html).toContain("Fuel differential not configured");
    expect(html).toContain("Not available");expect(html).not.toContain("125 gal");
  });
  it("keeps chart segments separate across missing depths and unobserved gaps", () => {
    const report=buildWellReport({wellName:"Partial depths",reportDate:"2026-10-24",warnings:[],events:[{...source,classification:"PRODUCTIVE",startMinute:0,endMinute:60,startHoleDepthFt:1000,endHoleDepthFt:1020},{...source,id:"gap-end",startMinute:180,endMinute:240,startHoleDepthFt:null,endHoleDepthFt:1040}]});
    const html=renderToStaticMarkup(<DepthTimeline report={report} onSelect={()=>{}}/>);
    expect(html).toContain("increases downward");expect(html).toContain('cx="166.66666666666666"');
    expect(html).not.toContain("polyline"); // No single path connecting unrelated intervals.
    expect(html).toContain("· unknown</title>");
  });
  it("keeps evidence, event filtering, search and scenario controls connected in the overview", () => {
    const html=renderToStaticMarkup(<ConsoleOverview report={DEMO_REPORT} selectedId="ev-08" onSelect={()=>{}} onScenario={()=>{}}/>);
    for(const label of ["Event log","Search events","Extraction confidence","Edit assumptions","Inspect event","POOH BHA SERVICE / BIT CHANGE"])expect(html).toContain(label);
    expect(html).not.toContain("Flag for review");expect(html).not.toContain("Previous report day");
  });
});
