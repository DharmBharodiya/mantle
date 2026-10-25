import { describe, expect, it } from 'vitest';
import { GET, POST } from '@/app/api/analytics/route';
import { DEMO_EXTRACTION, DEMO_REPORT } from '@/data/demo-report';
function request(body:unknown) {
  return new Request('http://localhost/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}
describe('analytics API report boundary',()=>{
  it('rejects empty analyses rather than returning a successful report',async()=>{
    const response=await POST(request({extraction:{...DEMO_EXTRACTION,events:[]}}));
    expect(response.status).toBe(422);
    const body=await response.json();
    expect(body.error).toMatch(/at least one.*event/i);
    expect(body.metrics).toBeUndefined();
    expect(body.events).toBeUndefined();
  });
  it('computes from events and explicit assumptions, never client-supplied metrics',async()=>{
    const response=await POST(request({extraction:{...DEMO_REPORT,metrics:{nptMinutes:9999}},scenario:{...DEMO_REPORT.scenario,rigDailyUsd:240000,excessFuelGallonsPerHour:null},sourceKind:'SYNTHETIC_DEMO'}));
    expect(response.status).toBe(200);
    const report=await response.json();
    expect(report.metrics.nptMinutes).toBe(300);
    expect(report.metrics.estimatedNptCostUsd).toBe(50000);
    expect(report.metrics.modeledExcessCo2Tons).toBeNull();
    expect(report.events.map((event:{evidence:unknown})=>event.evidence)).toEqual(DEMO_REPORT.events.map(event=>event.evidence));
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each(['HUMAN_VERIFIED',undefined])('keeps client source %s unverified',async sourceKind=>{
    const response=await POST(request({extraction:DEMO_EXTRACTION,sourceKind}));
    expect((await response.json()).sourceKind).toBe('PUBLIC_SOURCE_UNREVIEWED');
  });
  it.each(['overlap','invalid-date','zero-duration'])('rejects %s and returns no partial metrics',async problem=>{
    const extraction=structuredClone(DEMO_EXTRACTION);
    if(problem==='overlap')extraction.events[1].startMinute=1;
    else if(problem==='invalid-date')extraction.reportDate='2026-02-30';
    else extraction.events[0].endMinute=extraction.events[0].startMinute;
    const response=await POST(request({extraction}));
    expect(response.status).toBe(422);
    const body=await response.json();
    expect(body.error).toBeTruthy();expect(body.metrics).toBeUndefined();
  });
  it('preserves review warnings through deterministic scenario recalculation',async()=>{
    const warning='Source header: 4.0 h; timed interval: 3.5 h. Preserve both.';
    const response=await POST(request({extraction:{...DEMO_EXTRACTION,warnings:[warning]},scenario:{rigDailyUsd:240000}}));
    expect((await response.json()).warnings).toContain(warning);
  });
  it('rejects invalid assumptions without silently substituting defaults',async()=>{
    const response=await POST(request({extraction:DEMO_EXTRACTION,scenario:{drillBenchmarkFtPerHour:0}}));
    expect(response.status).toBe(422);expect((await response.json()).metrics).toBeUndefined();
  });
  it('keeps the existing built-in demo route intact',async()=>{
    const response=await GET();
    const report=await response.json();
    expect(report.sourceKind).toBe('SYNTHETIC_DEMO');expect(report.metrics.nptMinutes).toBe(300);
  });
});
