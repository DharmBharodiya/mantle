import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Landing } from "@/components/mantle/Landing";
import Home from "@/app/page";
import Console from "@/app/console/page";
import { DEMO_REPORT } from "@/data/demo-report";
import { buildWellReport } from "@/lib/analytics/compute";
import { computeDay, DEMO_EVENTS, DEFAULT_ASSUMPTIONS } from "@/lib/mantle/report";
import { stageConsoleReport, takeConsoleReport, readConsoleSession, saveConsoleSession } from "@/lib/mantle/console-handoff";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()})}));
beforeEach(()=>{takeConsoleReport();});
describe("Mantle-style homepage and retained console",()=>{
  it("retains in-tab console analyses across homepage navigation without browser storage",()=>{
    const state={reports:[{id:"uploaded",report:DEMO_REPORT,fileName:"SYNTHETIC_DEMO.csv"}],reportId:"uploaded"};
    saveConsoleSession(state);expect(readConsoleSession()).toBe(state);
    stageConsoleReport(DEMO_REPORT,"second.csv");expect(readConsoleSession()?.reports).toHaveLength(1);expect(takeConsoleReport()?.fileName).toBe("second.csv");
  });
  it("renders a real homepage with working console and section destinations",()=>{
    const html=renderToStaticMarkup(<Home/>);
    expect(html).toContain("Steel goes down.");expect(html).toContain("Steam");expect(html).toContain("boresight");expect(html).toContain('href="/console"');
    for(const id of ["top","report-intake","how","platform","impact","theme"])expect(html).toContain(`id="${id}"`);
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).not.toContain("Sign in");expect(html).not.toContain("[Team member names]");expect(html).not.toContain('href="#"');expect(html).not.toContain("Built in 36 hours");
    expect(html).toContain("SYNTHETIC DEMO");expect(html).toContain("scenario estimates");expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("Attach report");expect(html).toContain('id="landing-event"');expect(html).not.toContain(".xls,.txt");
  });
  it("retains the existing real report workflow on the console route",()=>{
    const html=renderToStaticMarkup(<Console/>);
    expect(html).toContain("Upload report");expect(html).toContain("SYNTHETIC_DEMO");expect(html).toContain("Inspect event");expect(html).toContain('href="/"');
  });
  it("uses canonical analytics for every homepage KPI",()=>{
    const preview=computeDay(DEMO_EVENTS);const metrics=DEMO_REPORT.metrics;
    expect(preview.nptHours).toBe(metrics.nptMinutes/60);expect(preview.iltHours).toBe(metrics.iltMinutes/60);expect(preview.totalCost).toBe(metrics.estimatedLossUsd);expect(preview.effectivePct).toBe(metrics.efficiencyPct);expect(preview.co2Tonnes).toBe(metrics.modeledExcessCo2Tons);
    const assumptions={...DEFAULT_ASSUMPTIONS,dayRate:240000,fuelGalPerHour:null};const adjusted=computeDay(DEMO_EVENTS,assumptions);
    const canonical=buildWellReport(DEMO_REPORT,{scenario:{...DEMO_REPORT.scenario,rigDailyUsd:240000,excessFuelGallonsPerHour:null}});
    expect(adjusted.totalCost).toBe(canonical.metrics.estimatedLossUsd);expect(adjusted.co2Tonnes).toBeNull();expect(()=>computeDay([...DEMO_EVENTS])).toThrow(/synthetic fixture/);
  });
  it("never invents source page or line numbers for the preview fixture",()=>{
    expect(DEMO_EVENTS.every(event=>event.line===null&&event.page===undefined)).toBe(true);
    const html=renderToStaticMarkup(<Landing/>);expect(html).not.toContain("Report line 4");expect(html).toContain(DEMO_REPORT.events[3].evidence.snippet);
  });
  it("hands a complete analysis to the console once without persisting documents",()=>{
    expect(takeConsoleReport()).toBeNull();stageConsoleReport(DEMO_REPORT,"SYNTHETIC_DEMO.csv");
    expect(takeConsoleReport()).toEqual({report:DEMO_REPORT,fileName:"SYNTHETIC_DEMO.csv"});expect(takeConsoleReport()).toBeNull();
  });
});

