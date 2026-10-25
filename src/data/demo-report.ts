import type { Extraction, WellTelemetryReport } from "@/types/telemetry";
import { buildWellReport } from "@/lib/analytics/compute";
/** Explicitly fabricated sample data. NEVER present as an actual FORGE failure. */
const source = "SYNTHETIC_DDR_DEMO.csv";
const make = (
  id: string, startMinute: number, endMinute: number,
  activity: Extraction["events"][number]["activity"],
  classification: Extraction["events"][number]["classification"],
  startHoleDepthFt: number, endHoleDepthFt: number,
  note: string, explanation: string
): Extraction["events"][number] => ({
  id,startMinute,endMinute,activity,classification,startHoleDepthFt,endHoleDepthFt,note,explanation,
  evidence: {fileName:source,page:null,snippet:note},confidence:"HIGH"
});
export const DEMO_EXTRACTION: Extraction = {
  wellName:"Mantle Lab — Demo Geothermal Well",
  reportDate:"2026-10-24",
  warnings:["This is a synthetic demo, not a source-verified industry report.","Drilling ROP benchmark and rig day rate are editable scenario assumptions."],
  events:[
    make("ev-01",0,180,"DRILLING","PRODUCTIVE",6100,6210,"DRILL 6100-6210', WOB 24klb, ROP 36.7","Normal drilling interval; penetration advanced 110 ft."),
    make("ev-02",180,300,"DRILLING","PRODUCTIVE",6210,6250,"DRILL HARD STRINGER, ROP 20ft/hr","Drilling advanced 40 ft in two hours, below the example benchmark."),
    make("ev-03",300,360,"CIRCULATING","PRODUCTIVE",6250,6250,"CIRC/COND MUD","Planned mud circulation; no depth gain does not imply equipment failure."),
    make("ev-04",360,600,"RIG_REPAIR","NPT",6250,6250,"PUMP #2 LINER SEAL FAILED, REPLACE, TEST 4H","Unplanned mud pump repair delayed drilling for four hours."),
    make("ev-05",600,780,"DRILLING","PRODUCTIVE",6250,6380,"DRILL AHEAD 130', ROP 43ft/hr","Drilling resumed after hydraulic repair."),
    make("ev-06",780,840,"WAITING","NPT",6380,6380,"W.O. PARTS CONFIRMATION 1HR","Unplanned waiting period; categorization should be verified against source context."),
    make("ev-07",840,1050,"DRILLING","PRODUCTIVE",6380,6440,"DRILL 60' IN 3.5 HOURS, LOW ROP","Below example penetration-speed benchmark; possible ILT opportunity."),
    make("ev-08",1050,1140,"BHA_CHANGE","PRODUCTIVE",6440,6440,"POOH BHA SERVICE / BIT CHANGE","Scheduled bottom-hole assembly servicing; no hole-depth gain expected."),
    make("ev-09",1140,1440,"DRILLING","PRODUCTIVE",6440,6590,"DRILL 150' IN 5H","Further drilling in rock; benchmark is formation dependent.")
  ]
};
export const DEMO_REPORT: WellTelemetryReport = buildWellReport(DEMO_EXTRACTION, {
  sourceKind:"SYNTHETIC_DEMO",
  scenario:{rigDailyUsd:120000,drillBenchmarkFtPerHour:35,tripBenchmarkFtPerHour:800,excessFuelGallonsPerHour:60,kgCo2PerGallon:10.18}
});
