import type {
  DrillingEvent, EventInsight, Extraction, ReportMetrics,
  Scenario, WellTelemetryReport, DepthPoint
} from "@/types/telemetry";
import { ExtractionSchema, ScenarioSchema } from "@/types/telemetry";

export function validateTimeline(events: DrillingEvent[]): string[] {
  const messages: string[] = [];
  const sorted = [...events].sort((a, b) => a.startMinute - b.startMinute);
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (e.endMinute <= e.startMinute) messages.push(`Invalid duration: ${e.id}`);
    if (i > 0 && e.startMinute < sorted[i-1].endMinute) messages.push(`Overlapping events: ${sorted[i-1].id} / ${e.id}`);
  }
  return messages;
}
export function computeILTMinutes(event: DrillingEvent, scenario: Scenario): number | null {
  if (event.classification !== "PRODUCTIVE") return null;
  const { startHoleDepthFt: start, endHoleDepthFt: end } = event;
  if (start === null || end === null) return null;
  const minutes = event.endMinute - event.startMinute;
  let idealMinutes: number | null = null;
  if (event.activity === "DRILLING" && end > start) {
    idealMinutes = (end-start) / scenario.drillBenchmarkFtPerHour * 60;
  } else if ((event.activity === "TRIPPING_IN" || event.activity === "TRIPPING_OUT") && end !== start) {
    // Hole depth is NOT bit depth: only use this benchmark if the source
    // specifically provided bit-travel depth. In this starter it never does.
    idealMinutes = null;
  }
  if (idealMinutes === null) return null;
  return Math.max(0, Math.min(minutes, minutes - idealMinutes));
}
export function buildWellReport(
  data: Extraction,
  opts?: { scenario?: Partial<Scenario>; sourceKind?: WellTelemetryReport["sourceKind"] }
): WellTelemetryReport {
  const extracted = ExtractionSchema.parse(data);
  const scenario = ScenarioSchema.parse(opts?.scenario ?? {});
  const events = [...extracted.events].sort((a, b) => a.startMinute - b.startMinute);
  const issues = validateTimeline(events);
  if (issues.length) throw new Error(issues.join("; "));
  const hourlyRate = scenario.rigDailyUsd / 24;
  const insights: EventInsight[] = events.map(e => {
    const duration = e.endMinute - e.startMinute;
    const nptMinutes = e.classification === "NPT" ? duration : 0;
    const iltMinutes = computeILTMinutes(e, scenario);
    return {
      eventId: e.id, nptMinutes, iltMinutes,
      avoidableCostUsd: (nptMinutes + (iltMinutes ?? 0)) / 60 * hourlyRate,
      category: e.classification === "NPT" ? "NPT" : e.classification === "UNKNOWN" ? "UNCERTAIN" : (iltMinutes ?? 0) > 0 ? "ILT" : "NORMAL",
    };
  });
  const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);
  const observedMinutes = sum(events.map(e => e.endMinute - e.startMinute));
  const productiveMinutes = sum(events.filter(e => e.classification === "PRODUCTIVE").map(e => e.endMinute-e.startMinute));
  const nptMinutes = sum(insights.map(i => i.nptMinutes));
  const iltMinutes = sum(insights.map(i => i.iltMinutes ?? 0));
  const classifiedMinutes = productiveMinutes + nptMinutes;
  const excessHours = (nptMinutes+iltMinutes)/60;
  const modeledExcessFuelGallons = scenario.excessFuelGallonsPerHour === null ? null : excessHours*scenario.excessFuelGallonsPerHour;
  const metrics: ReportMetrics = {
    observedMinutes, classifiedMinutes, productiveMinutes, nptMinutes, iltMinutes,
    efficiencyPct: classifiedMinutes ? Math.max(0, (productiveMinutes-iltMinutes)/classifiedMinutes*100) : null,
    estimatedLossUsd: excessHours*hourlyRate,
    estimatedNptCostUsd: nptMinutes/60*hourlyRate,
    estimatedIltOpportunityUsd: iltMinutes/60*hourlyRate,
    modeledExcessFuelGallons,
    modeledExcessCo2Tons: modeledExcessFuelGallons === null ? null : modeledExcessFuelGallons*scenario.kgCo2PerGallon/1000,
  };
  const depthCurve: DepthPoint[] = [];
  let lastDepth: number | null = null;
  for (const e of events) {
    if (e.startHoleDepthFt !== null) lastDepth = Math.max(lastDepth ?? 0, e.startHoleDepthFt);
    if (lastDepth !== null) depthCurve.push({ minute:e.startMinute, holeDepthFt:lastDepth, eventId:e.id, classification:e.classification });
    if (e.endHoleDepthFt !== null) lastDepth = Math.max(lastDepth ?? 0, e.endHoleDepthFt);
    if (lastDepth !== null) depthCurve.push({ minute:e.endMinute, holeDepthFt:lastDepth, eventId:e.id, classification:e.classification });
  }
  return {
    ...extracted, events, warnings: [...extracted.warnings],
    sourceKind:opts?.sourceKind??"PUBLIC_SOURCE_UNREVIEWED",scenario,metrics,insights,depthCurve,
    generatedAt:new Date().toISOString()
  };
}
