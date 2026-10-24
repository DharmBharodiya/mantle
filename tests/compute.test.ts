import {describe,it,expect} from "vitest";
import {buildWellReport,computeILTMinutes,validateTimeline} from "../src/lib/analytics/compute";
import {DEMO_EXTRACTION} from "../src/data/demo-report";

describe("metrics and evidence handling",()=>{
  it("does not overlap synthetic events",()=>{expect(validateTimeline(DEMO_EXTRACTION.events)).toEqual([]);});
  it("counts NPT correctly",()=>{const m=buildWellReport(DEMO_EXTRACTION).metrics;expect(m.nptMinutes).toBe(300);});
  it("does not treat every flat interval as NPT",()=>{const e=DEMO_EXTRACTION.events.find(e=>e.activity==="CIRCULATING")!;expect(e.classification).toBe("PRODUCTIVE");expect(computeILTMinutes(e,{rigDailyUsd:120000,drillBenchmarkFtPerHour:35,tripBenchmarkFtPerHour:800,excessFuelGallonsPerHour:null,kgCo2PerGallon:10.18})).toBeNull();});
  it("never reports measured carbon when fuel differential is unknown",()=>{expect(buildWellReport(DEMO_EXTRACTION).metrics.modeledExcessCo2Tons).toBeNull();});
  it("keeps source traceability on every event",()=>{for(const e of DEMO_EXTRACTION.events)expect(e.evidence.fileName).toMatch(/SYNTHETIC/);});
  it("rejects overlapping events",()=>{const x=structuredClone(DEMO_EXTRACTION);x.events[1].startMinute=100;expect(()=>buildWellReport(x)).toThrow(/Overlapping/);});
  it("prices illustrative NPT separately from ILT",()=>{const m=buildWellReport(DEMO_EXTRACTION).metrics;expect(m.estimatedNptCostUsd).toBe(25000);expect(m.estimatedIltOpportunityUsd).toBeGreaterThan(0);});
  it("uses the drilling benchmark for one productive interval",()=>{const e=structuredClone(DEMO_EXTRACTION.events[1]);expect(computeILTMinutes(e,{rigDailyUsd:120000,drillBenchmarkFtPerHour:35,tripBenchmarkFtPerHour:800,excessFuelGallonsPerHour:null,kgCo2PerGallon:10.18})).toBeCloseTo(51.4286,3);});
  it("keeps trip ILT unknown even when hole depth changes",()=>{const e=structuredClone(DEMO_EXTRACTION.events[0]);e.activity="TRIPPING_OUT";expect(computeILTMinutes(e,{rigDailyUsd:120000,drillBenchmarkFtPerHour:35,tripBenchmarkFtPerHour:800,excessFuelGallonsPerHour:null,kgCo2PerGallon:10.18})).toBeNull();});
  it("warns about uncovered minutes without treating them as productive or NPT",()=>{const x=structuredClone(DEMO_EXTRACTION);x.events[0].startMinute=10;const report=buildWellReport(x);expect(report.warnings.some(w=>w.includes("Unobserved timeline gap"))).toBe(true);expect(report.metrics.observedMinutes).toBe(1430);});
  it("does not carry depth through an event with missing observations",()=>{const x=structuredClone(DEMO_EXTRACTION);x.events[1].startHoleDepthFt=null;const report=buildWellReport(x);expect(report.depthCurve.some(point=>point.eventId===x.events[1].id)).toBe(false);expect(report.warnings.some(w=>w.includes("missing hole-depth"))).toBe(true);});
  it("keeps UNKNOWN time out of classified efficiency and fuel is null without a differential",()=>{const x=structuredClone(DEMO_EXTRACTION);x.events[0].classification="UNKNOWN";const report=buildWellReport(x,{scenario:{excessFuelGallonsPerHour:null}});expect(report.metrics.classifiedMinutes).toBe(1260);expect(report.metrics.modeledExcessFuelGallons).toBeNull();expect(report.metrics.modeledExcessCo2Tons).toBeNull();});
});
