import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/ingest/route';
import { DEMO_EXTRACTION } from '@/data/demo-report';
import { mergeExtractions } from '@/lib/ingestion/structured';
import { clearModelCache } from '@/lib/server/gemini-client';
const {generate}=vi.hoisted(()=>({generate:vi.fn()}));
vi.mock('@google/genai',()=>({ThinkingLevel:{LOW:'LOW'},GoogleGenAI:class{models={generateContent:generate,get:vi.fn().mockResolvedValue({supportedActions:['generateContent'],outputTokenLimit:8192})}}}));
function output(){return {...structuredClone(DEMO_EXTRACTION),events:[structuredClone(DEMO_EXTRACTION.events[0])],reportDates:[DEMO_EXTRACTION.reportDate],reportedDrillingHours:[] as {hours:number;snippet:string;page:number|null}[]};}
async function run(value:unknown){generate.mockResolvedValue({text:JSON.stringify(value)});const form=new FormData();form.append('file',new File(["Well Demo\n00:00-03:00 DRILL 6100-6210'"],'source.txt'));const response=await POST(new Request('http://localhost/api/ingest',{method:'POST',body:form}));return {response,body:await response.json()};}
beforeEach(()=>{vi.stubEnv('GEMINI_API_KEY','test-only');generate.mockReset();clearModelCache();vi.spyOn(console,'info').mockImplementation(()=>{});});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
describe('missing or malformed extraction values (mocked provider)',()=>{
 it.each(['startMinute','endMinute','activity','classification','startHoleDepthFt','endHoleDepthFt'])('rejects missing required %s instead of fabricating a replacement',async key=>{
  const value=output();delete (value.events[0] as Record<string,unknown>)[key];
  const {response,body}=await run(value);expect(response.status).toBe(422);expect(body.code).toBe('INVALID_EXTRACTION');expect(body.metrics).toBeUndefined();
 });
 it.each([{startMinute:null},{endMinute:null},{endMinute:0},{startMinute:1430,endMinute:10},{activity:'UNRECOGNIZED_CODE'},{startHoleDepthFt:-1}])('rejects incomplete/invalid interval %j',async patch=>{
  const value=output();Object.assign(value.events[0],patch);const {response,body}=await run(value);expect(response.status).toBe(422);expect(body.events).toBeUndefined();
 });
 it('preserves null depths and UNKNOWN classification, unavailable efficiency, trip ILT and carbon',async()=>{
  const value=output();Object.assign(value.events[0],{classification:'UNKNOWN',activity:'TRIPPING_IN',startHoleDepthFt:null,endHoleDepthFt:null,evidence:{fileName:'ignored',page:null,snippet:"DRILL 6100-6210'",row:2}});
  const {response,body}=await run(value);expect(response.status).toBe(200);expect(body.events[0].startHoleDepthFt).toBeNull();expect(body.depthCurve).toEqual([]);expect(body.metrics.unknownMinutes).toBe(180);expect(body.metrics.efficiencyPct).toBeNull();expect(body.metrics.modeledExcessCo2Tons).toBeNull();expect(body.insights[0].iltMinutes).toBeNull();
 });
 it('turns whitespace-only evidence into a missing-source warning and low confidence',async()=>{
  const value=output();value.events[0].evidence={fileName:'model invented',page:null,snippet:'   \n  '};const {response,body}=await run(value);
  expect(response.status).toBe(200);expect(body.events[0].evidence).toMatchObject({fileName:'source.txt',snippet:'',page:null});expect(body.events[0].confidence).toBe('LOW');expect(body.warnings.join(' ')).toMatch(/excerpt|evidence/i);
 });
 it('removes a false text-row reference without inventing a page',async()=>{
  const value=output();value.events[0].evidence={fileName:'ignored',page:9,row:999,snippet:"DRILL 6100-6210'"};const {body}=await run(value);expect(body.events[0].evidence).toMatchObject({row:null,page:null,snippet:"DRILL 6100-6210'"});expect(body.warnings.join(' ')).toContain('row reference');
 });
 it.each(['reportDates','reportedDrillingHours'])('rejects missing private %s metadata',async key=>{
  const value=output();delete (value as Record<string,unknown>)[key];const {response,body}=await run(value);expect(response.status).toBe(422);expect(body.code).toBe('INVALID_EXTRACTION');
 });
 it('rejects invalid report date labels even if the primary date is valid',async()=>{
  const value=output();value.reportDates=['2026-02-30'];const {response,body}=await run(value);expect(response.status).toBe(422);expect(body.code).toBe('INVALID_EXTRACTION');
 });
 it('does not convert an unsupported model summary excerpt into a discrepancy claim',async()=>{
  const value=output();value.reportedDrillingHours=[{hours:20,page:null,snippet:'THIS PHRASE IS NOT IN THE SOURCE'}];const {body}=await run(value);expect(body.warnings.join(' ')).toContain('excluded');expect(body.warnings.join(' ')).not.toContain('reported daily total 20.0');
 });
 it('compares supported conflicting source text without changing the intervals',async()=>{
  const value=output();value.reportedDrillingHours=[{hours:4,page:null,snippet:"DRILL 6100-6210'"}];const {body}=await run(value);expect(body.warnings.join(' ')).toMatch(/4\.0.*3\.0/);expect(body.events[0]).toMatchObject({startMinute:0,endMinute:180});
 });
 it('keeps the lower duplicate confidence and an available quote when deduplicating',()=>{
  const first=structuredClone(DEMO_EXTRACTION);first.events=[first.events[0]];first.events[0].evidence.snippet='';first.events[0].confidence='HIGH';
  const second=structuredClone(first);second.events[0].confidence='LOW';second.events[0].evidence.snippet='VERBATIM SOURCE';
  const merged=mergeExtractions([first,second]);expect(merged.events).toHaveLength(1);expect(merged.events[0].confidence).toBe('LOW');expect(merged.events[0].evidence.snippet).toBe('VERBATIM SOURCE');
 });
});

it('describes malformed response field paths without reflecting provider values',async()=>{
 const value=output();(value.events[0] as Record<string,unknown>).startMinute='PRIVATE_SOURCE_DO_NOT_ECHO';
 const {response,body}=await run(value);expect(response.status).toBe(422);expect(body.error).toContain('events.0.startMinute');expect(body.error).not.toContain('PRIVATE_SOURCE_DO_NOT_ECHO');
});
