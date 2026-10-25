import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { POST } from '@/app/api/ingest/route';
import { prepareUpload } from '@/lib/ingestion/prepare';
import { extractFromGemini } from '@/lib/ingestion/gemini';
import { clearModelCache } from '@/lib/server/gemini-client';
import { readFileSync } from 'node:fs';
import { WellTelemetryReportSchema, type DrillingEvent } from '@/types/telemetry';
const {generate}=vi.hoisted(()=>({generate:vi.fn()}));
vi.mock('@google/genai',()=>({ThinkingLevel:{LOW:'LOW'},GoogleGenAI:class{models={generateContent:generate,get:vi.fn().mockResolvedValue({supportedActions:['generateContent'],outputTokenLimit:8192})}}}));
const recorded=WellTelemetryReportSchema.parse(JSON.parse(readFileSync('demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json','utf8')).report);
function envelope(events=recorded.events){return {wellName:'78B-32',reportDate:'2021-06-28',reportDates:['2021-06-28'],reportedDrillingHours:[] as {hours:number;snippet:string;page:number|null}[],events:structuredClone(events),warnings:[]};}
async function pdf(count:number){const document=await PDFDocument.create();for(let i=0;i<count;i++)document.addPage().drawText(`SYNTHETIC validation section ${i+1}`);return new File([new Uint8Array(await document.save())],'multi-page.pdf',{type:'application/pdf'});}
function request(file:File){const data=new FormData();data.append('file',file);return new Request('http://localhost/api/ingest',{method:'POST',body:data,headers:{Accept:'application/x-ndjson'}});}
async function frames(file:File){const response=await POST(request(file));return (await response.text()).trim().split('\n').map(line=>JSON.parse(line));}
beforeEach(()=>{vi.stubEnv('GEMINI_API_KEY','test-only');clearModelCache();generate.mockReset();vi.spyOn(console,'info').mockImplementation(()=>{});});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
describe('multi-page single-day extraction (mocked provider, actual PDF/route)',()=>{
 it('orders sections chronologically, maps page references and counts repeated intervals once',async()=>{
  const first=envelope([recorded.events[1],recorded.events[0]]);first.events.forEach(e=>e.evidence.page=2);
  const second=envelope([recorded.events[1],recorded.events[2]]);second.events.forEach(e=>e.evidence.page=1);
  generate.mockResolvedValueOnce({text:JSON.stringify(first)}).mockResolvedValueOnce({text:JSON.stringify(second)});
  const result=await extractFromGemini(await prepareUpload(await pdf(3)));
  expect(result.events.map(e=>e.startMinute)).toEqual([0,60,90]);
  expect(result.events.map(e=>e.evidence.page)).toEqual([2,2,3]);
  expect(new Set(result.events.map(e=>e.id)).size).toBe(3);
 });
 it('rejects adjacent report days across extraction sections instead of importing one',async()=>{
  const first=envelope([recorded.events[0]]);const second=envelope([recorded.events[1]]);second.reportDate='2021-06-29';second.reportDates=['2021-06-29'];
  generate.mockResolvedValueOnce({text:JSON.stringify(first)}).mockResolvedValueOnce({text:JSON.stringify(second)});
  const messages=await frames(await pdf(3));expect(messages.at(-1)).toMatchObject({type:'error',code:'MULTI_DAY_REPORT'});expect(messages.some(m=>m.type==='result')).toBe(false);
 });
 it('rejects two report days inside one PDF section even when one primary day was selected',async()=>{
  const output=envelope([recorded.events[0]]);output.reportDates.push('2021-06-29');generate.mockResolvedValue({text:JSON.stringify(output)});
  const messages=await frames(await pdf(2));expect(messages.at(-1)).toMatchObject({type:'error',code:'MULTI_DAY_REPORT'});expect(messages.some(m=>m.type==='result')).toBe(false);
 });
 it('rejects inconsistent primary day versus explicitly reported day labels',async()=>{
  const output=envelope([recorded.events[0]]);output.reportDate='2021-06-30';generate.mockResolvedValue({text:JSON.stringify(output)});
  const messages=await frames(await pdf(1));expect(messages.at(-1)).toMatchObject({type:'error',code:'MULTI_DAY_REPORT'});
 });
 it('accepts a same-day appendix with no timed events without discarding main activities',async()=>{
  generate.mockResolvedValueOnce({text:JSON.stringify(envelope(recorded.events))}).mockResolvedValueOnce({text:JSON.stringify(envelope([]))});
  const messages=await frames(await pdf(3));expect(messages.at(-1).report.metrics.observedMinutes).toBe(1440);expect(messages.at(-1).report.events).toHaveLength(17);
 });
 it('rejects more than 24 pages before generating content',async()=>{
  const messages=await frames(await pdf(25));expect(messages.at(-1)).toMatchObject({type:'error',status:413,code:'PDF_PAGE_LIMIT'});expect(generate).not.toHaveBeenCalled();
 });

});
describe('source drilling-total conflicts',()=>{
 it('warns about the FORGE 4.0-hour header versus the 3.5-hour timeline without changing events',async()=>{
  const output=envelope();output.reportedDrillingHours=[{hours:4,snippet:'293 / 4.0',page:1}];generate.mockResolvedValue({text:JSON.stringify(output)});
  const messages=await frames(await pdf(1));const report=messages.at(-1).report;
  expect(report.events.find((e:DrillingEvent)=>e.startMinute===90)).toMatchObject({endMinute:300,startHoleDepthFt:128,endHoleDepthFt:421});
  expect(report.warnings.join(' ')).toMatch(/4\.0.*3\.5/);expect(report.warnings.join(' ')).toContain('293 / 4.0');
  expect(report.metrics.observedMinutes).toBe(1440);expect(report.metrics.iltEligibleMinutes).toBe(210);
 });
 it('uses the whole merged timeline when comparing a total from an appendix',async()=>{
  const first=envelope();const second=envelope([]);second.reportedDrillingHours=[{hours:4,snippet:'Daily drilling 4.0 h',page:1}];
  generate.mockResolvedValueOnce({text:JSON.stringify(first)}).mockResolvedValueOnce({text:JSON.stringify(second)});
  const messages=await frames(await pdf(3));expect(messages.at(-1).report.warnings.join(' ')).toMatch(/4\.0.*3\.5/);expect(messages.at(-1).report.warnings.join(' ')).toContain('page 3');
 });
});

it('does not commit a partial document when a later PDF section has malformed extraction',async()=>{
 const first=envelope([recorded.events[0]]);
 generate.mockResolvedValueOnce({text:JSON.stringify(first)}).mockResolvedValueOnce({text:'{"events":[]}'});
 const messages=await frames(await pdf(3));expect(messages.at(-1)).toMatchObject({type:'error',code:'INVALID_EXTRACTION'});expect(messages.some(message=>message.type==='result'||message.stage==='ready')).toBe(false);
});
it('cancels an active extraction and returns no final report',async()=>{
 let generationStarted!:()=>void;const started=new Promise<void>(resolve=>{generationStarted=resolve;});
 generate.mockImplementation(()=>{generationStarted();return new Promise(()=>{});});
 const data=new FormData();data.append('file',await pdf(1));const controller=new AbortController();
 const response=await POST(new Request('http://localhost/api/ingest',{method:'POST',body:data,signal:controller.signal,headers:{Accept:'application/x-ndjson'}}));
 const body=response.text();await started;controller.abort();const messages=(await body).trim().split('\n').map(line=>JSON.parse(line));
 expect(messages.at(-1)).toMatchObject({type:'error',code:'INGEST_CANCELLED'});expect(messages.some(message=>message.type==='result')).toBe(false);
});
it('honors cancellation for deterministic structured input as well as model extraction',async()=>{
 const input=await prepareUpload(new File(['startMinute,endMinute,activity,classification\n0,60,DRILLING,PRODUCTIVE'],'table.csv'));
 const controller=new AbortController();controller.abort();await expect(extractFromGemini(input,controller.signal)).rejects.toMatchObject({code:'INGEST_CANCELLED'});expect(generate).not.toHaveBeenCalled();
});

it('sends a report-day pattern that accepts ISO dates and rejects blank labels',async()=>{
 generate.mockResolvedValue({text:JSON.stringify(envelope([recorded.events[0]]))});
 await extractFromGemini(await prepareUpload(await pdf(1)));
 const pattern=generate.mock.calls[0][0].config.responseJsonSchema.properties.reportDates.items.pattern;
 expect(new RegExp(pattern).test('2021-06-28')).toBe(true);expect(new RegExp(pattern).test('')).toBe(false);
});

it('withholds the abbreviated quote observed in the real multi-page run without altering measurements',async()=>{
 const value=envelope([recorded.events[13]]);
 value.events[0].evidence.snippet='14:30 16:00 1.50 421 5-99 Pressure test to 1500 psi, Pump 20 bbl fresh water...';
 generate.mockResolvedValue({text:JSON.stringify(value)});const messages=await frames(await pdf(1));const report=messages.at(-1).report;
 expect(report.events[0]).toMatchObject({startMinute:870,endMinute:960,startHoleDepthFt:421,endHoleDepthFt:421,confidence:'LOW',evidence:{snippet:'',page:1}});
 expect(report.warnings.join(' ')).toContain('Unverified model excerpt');expect(report.warnings.join(' ')).toContain('fresh water...');
});
