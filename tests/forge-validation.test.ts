import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildWellReport } from '@/lib/analytics/compute';
import { importSnapshot, exportSnapshot, exportEventsCsv } from '@/lib/reports/manage';
import { WellTelemetryReportSchema } from '@/types/telemetry';
const fixture = 'demo-fixtures/public/forge-78b-32/';
const expected = JSON.parse(readFileSync(fixture + '2021-06-28-expected.json', 'utf8')) as { intervals: [number, number, number][]; operationsText: string };
const snapshot = readFileSync(fixture + '2021-06-28-gemini.snapshot.json', 'utf8');
const report = WellTelemetryReportSchema.parse(JSON.parse(snapshot).report);
describe('recorded real FORGE day, manually checked against original PDF page 4', () => {
  it('retains all 17 intervals, 24-hour coverage, drilling footage and source-page mapping', () => {
    expect(report.reportDate).toBe('2021-06-28');
    expect(report.wellName).toContain('78B-32');
    expect(report.events.map(e => [e.startMinute, e.endMinute, e.endHoleDepthFt])).toEqual(expected.intervals);
    const drilling=report.events.find(e=>e.startMinute===90)!;
    expect(drilling).toMatchObject({activity:'DRILLING',startHoleDepthFt:128,endHoleDepthFt:421});
    expect(report.events.every(e=>e.evidence.page===1&&e.evidence.snippet.length>0)).toBe(true);
    expect(report.sourceKind).toBe('PUBLIC_SOURCE_UNREVIEWED');
  });
  it('matches every returned excerpt to the transcribed original operations text', () => {
    const normalize=(value:string)=>value.replace(/\s+/g,' ').trim();
    for(const event of report.events) expect(normalize(expected.operationsText)).toContain(normalize(event.evidence.snippet));
  });
  it('does not turn flat casing/trip work into downtime or infer trip ILT', () => {
    const computed=buildWellReport(report);
    expect(computed.metrics).toMatchObject({observedMinutes:1440,productiveMinutes:1440,nptMinutes:0,iltMinutes:0,iltEligibleMinutes:210,coveragePct:100,estimatedLossUsd:0,modeledExcessCo2Tons:null});
    for (const event of computed.events.filter(e=>e.activity.startsWith('TRIPPING_'))) expect(computed.insights.find(i=>i.eventId===event.id)?.iltMinutes).toBeNull();
  });
  it('recalculates explicit assumptions and preserves evidence through snapshot/CSV export', () => {
    const scenario=buildWellReport(report,{scenario:{...report.scenario,drillBenchmarkFtPerHour:100,rigDailyUsd:240000}});
    expect(scenario.metrics.iltMinutes).toBeCloseTo(34.2);
    expect(scenario.metrics.estimatedIltOpportunityUsd).toBeCloseTo(5700);
    expect(scenario.metrics.nptMinutes).toBe(0);
    expect(scenario.metrics.modeledExcessCo2Tons).toBeNull();
    const imported=importSnapshot(exportSnapshot(scenario));
    expect(imported.metrics).toEqual(scenario.metrics);
    expect(imported.events).toEqual(report.events);
    expect(imported.sourceKind).toBe('PUBLIC_SOURCE_UNREVIEWED');
    expect(exportEventsCsv(imported)).toContain('Drilled 22');
    expect(importSnapshot(snapshot).metrics.observedMinutes).toBe(1440);
  });
});
