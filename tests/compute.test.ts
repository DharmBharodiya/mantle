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
});
