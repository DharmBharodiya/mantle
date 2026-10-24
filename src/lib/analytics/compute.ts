import { ExtractionSchema, ScenarioSchema, type DrillingEvent, type EventInsight, type Extraction, type Scenario, type WellTelemetryReport, type DepthPoint } from "@/types/telemetry";

export function validateTimeline(events: DrillingEvent[]): string[] {
  const messages: string[] = [];
  const sorted = [...events].sort((a, b) => a.startMinute - b.startMinute);
  const ids = new Set<string>();
  const records = new Set<string>();
  let previousEnd = 0;
  for (const event of sorted) {
    if (event.endMinute <= event.startMinute) messages.push(`Invalid duration or cross-midnight interval: ${event.id}. Use a single local report day; 24:00 is allowed only as the end.`);
    if (ids.has(event.id)) messages.push(`Duplicate event ID: ${event.id}`);
    ids.add(event.id);
    const record = `${event.startMinute}:${event.endMinute}:${event.activity}`;
    if (records.has(record)) messages.push(`Duplicate interval: ${event.id}`);
    records.add(record);
    if (event.startMinute < previousEnd) messages.push(`Overlapping events: ${event.id}`);
    previousEnd = Math.max(previousEnd, event.endMinute);
  }
  return messages;
}
export function computeILTMinutes(event: DrillingEvent, scenario: Scenario): number | null {
  const { startHoleDepthFt: start, endHoleDepthFt: end } = event;
  if (event.classification !== "PRODUCTIVE" || event.activity !== "DRILLING" || start === null || end === null || end <= start) return null;
  const minutes = event.endMinute - event.startMinute;
  return Math.max(0, Math.min(minutes, minutes - (end - start) / scenario.drillBenchmarkFtPerHour * 60));
}
export function buildWellReport(data: Extraction, opts?: { scenario?: Partial<Scenario>; sourceKind?: WellTelemetryReport["sourceKind"] }): WellTelemetryReport {
  const extracted = ExtractionSchema.parse(data);
  const scenario = ScenarioSchema.parse(opts?.scenario ?? {});
  const events = [...extracted.events].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const issues = validateTimeline(events);
  if (issues.length) throw new Error(issues.join("; "));
  if (extracted.reportDate && (!/^\d{4}-\d{2}-\d{2}$/.test(extracted.reportDate) || !Number.isFinite(Date.parse(extracted.reportDate)) || new Date(extracted.reportDate).toISOString().slice(0,10) !== extracted.reportDate)) throw new Error("Report date must be a valid single YYYY-MM-DD date, or empty when unknown. Multi-day reports must be split by day.");
  const warnings = new Set(extracted.warnings);
  if (!extracted.reportDate) warnings.add("Report date unavailable in source; no date has been inferred.");
  if (!extracted.wellName) warnings.add("Well name unavailable in source.");
  const hourlyRate = scenario.rigDailyUsd / 24;
  const insights: EventInsight[] = events.map(event => {
    const nptMinutes = event.classification === "NPT" ? event.endMinute - event.startMinute : 0;
    const iltMinutes = computeILTMinutes(event, scenario);
    return { eventId: event.id, nptMinutes, iltMinutes, avoidableCostUsd: (nptMinutes + (iltMinutes ?? 0)) / 60 * hourlyRate, category: event.classification === "NPT" ? "NPT" : event.classification === "UNKNOWN" ? "UNCERTAIN" : (iltMinutes ?? 0) > 0 ? "ILT" : "NORMAL" };
  });
  const observedMinutes = events.reduce((sum, e) => sum + e.endMinute - e.startMinute, 0);
  const productiveMinutes = events.filter(e => e.classification === "PRODUCTIVE").reduce((sum, e) => sum + e.endMinute - e.startMinute, 0);
  const nptMinutes = insights.reduce((sum, i) => sum + i.nptMinutes, 0);
  const iltMinutes = insights.reduce((sum, i) => sum + (i.iltMinutes ?? 0), 0);
  const iltEligibleMinutes = events.reduce((sum, e, index) => sum + (insights[index].iltMinutes === null ? 0 : e.endMinute - e.startMinute), 0);
  const classifiedMinutes = productiveMinutes + nptMinutes;
  const unknownMinutes = observedMinutes - classifiedMinutes;
  if (observedMinutes < 1440) warnings.add(`${1440 - observedMinutes} minutes of the local report day are unobserved; missing time is not productive time.`);
  if (unknownMinutes) warnings.add(`${unknownMinutes} observed minutes have UNKNOWN classification and are excluded from efficiency's denominator.`);
  if (iltEligibleMinutes < productiveMinutes) warnings.add("ILT cannot be evaluated for every productive interval. Trip speed requires separate bit/string movement; hole depth is insufficient.");
  const depthCurve: DepthPoint[] = [];
  let previousDepth: number | null = null;
  for (const e of events) {
    for (const [minute, depth] of [[e.startMinute, e.startHoleDepthFt], [e.endMinute, e.endHoleDepthFt]] as const) {
      if (depth === null) continue;
      if (previousDepth !== null && depth < previousDepth) warnings.add(`Reported hole depth decreases at ${e.id}; verify measured hole depth versus bit position. Values retained as reported.`);
      depthCurve.push({ minute, holeDepthFt: depth, eventId: e.id, classification: e.classification });
      previousDepth = depth;
    }
    if (!e.evidence.snippet) warnings.add(`No exact evidence excerpt for ${e.id}. Human review required.`);
  }
  const excessHours = (nptMinutes + iltMinutes) / 60;
  const modeledExcessFuelGallons = scenario.excessFuelGallonsPerHour === null ? null : excessHours * scenario.excessFuelGallonsPerHour;
  return {
    ...extracted, events, warnings: [...warnings], sourceKind: opts?.sourceKind ?? "PUBLIC_SOURCE_UNREVIEWED", scenario, insights, depthCurve, generatedAt: new Date().toISOString(),
    metrics: { observedMinutes, classifiedMinutes, productiveMinutes, nptMinutes, iltMinutes, unknownMinutes, unobservedMinutes: 1440 - observedMinutes,
      coveragePct: observedMinutes / 1440 * 100, iltEligibleMinutes, benchmarkCoveragePct: productiveMinutes ? iltEligibleMinutes / productiveMinutes * 100 : 0,
      efficiencyPct: classifiedMinutes ? Math.max(0, (productiveMinutes - iltMinutes) / classifiedMinutes * 100) : null,
      estimatedLossUsd: excessHours * hourlyRate, estimatedNptCostUsd: nptMinutes / 60 * hourlyRate, estimatedIltOpportunityUsd: iltMinutes / 60 * hourlyRate,
      modeledExcessFuelGallons, modeledExcessCo2Tons: modeledExcessFuelGallons === null ? null : modeledExcessFuelGallons * scenario.kgCo2PerGallon / 1000 },
  };
}
export function bottleneckGroups(report: WellTelemetryReport) {
  const groups = new Map<string, { label: string; category: "NPT" | "ILT"; minutes: number; costUsd: number; eventIds: string[] }>();
  for (const insight of report.insights) {
    const event = report.events.find(e => e.id === insight.eventId);
    if (!event) continue;
    const category = insight.nptMinutes > 0 ? "NPT" : (insight.iltMinutes ?? 0) > 0 ? "ILT" : null;
    if (!category) continue;
    const label = `${event.activity.replaceAll("_", " ")} · ${category}`;
    const group = groups.get(label) ?? { label, category, minutes: 0, costUsd: 0, eventIds: [] };
    group.minutes += insight.nptMinutes + (insight.iltMinutes ?? 0); group.costUsd += insight.avoidableCostUsd; group.eventIds.push(event.id); groups.set(label, group);
  }
  return [...groups.values()].sort((a, b) => b.minutes - a.minutes);
}
