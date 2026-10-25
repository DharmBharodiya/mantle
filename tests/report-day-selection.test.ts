import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { POST } from '@/app/api/ingest/route';
import { clearModelCache } from '@/lib/server/gemini-client';
import { WellTelemetryReportSchema } from '@/types/telemetry';
import { parseReportPages, ReportDaySelectionSchema } from '@/types/report-day';
const {generate}=vi.hoisted(()=>({generate:vi.fn()}));
vi.mock('@google/genai',()=>({ThinkingLevel:{LOW:'LOW'},GoogleGenAI:class{models={generateContent:generate,get:vi.fn().mockResolvedValue({supportedActions:['generateContent'],outputTokenLimit:8192})}}}));
const real=WellTelemetryReportSchema.parse(JSON.parse(readFileSync('demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json','utf8')).report);
const day='2021-06-28';
function envelope(date=day) {return {wellName:'78B-32',reportDate:date,reportDates:date?[date]:[],reportedDrillingHours:[],events:[structuredClone(real.events[0])],warnings:[]};}
async function pdf(count=3) {const d=await PDFDocument.create();for(let i=0;i<count;i++)d.addPage().drawText('SYNTHETIC test page '+(i+1));return new File([new Uint8Array(await d.save())],'original.pdf',{type:'application/pdf'});}
function request(file:File, selection?:unknown, stream=true, signal?:AbortSignal) {const form=new FormData();form.append('file',file);if(selection!==undefined)form.append('reportDay',JSON.stringify(selection));return new Request('http://localhost/api/ingest',{method:'POST',body:form,headers:stream?{Accept:'application/x-ndjson'}:{},signal});}
async function run(file:File,selection?:unknown,stream=true) {const response=await POST(request(file,selection,stream));const messages=response.headers.get('content-type')?.includes('ndjson')?(await response.text()).trim().split('\n').map(line=>JSON.parse(line)):[await response.json()];return {response,messages,last:messages.at(-1)};}
const select=(date=day,pages=[3])=>({reportDate:date,pages,sourceReviewed:true});
beforeEach(()=>{vi.stubEnv('GEMINI_API_KEY','test-only');clearModelCache();generate.mockReset();vi.spyOn(console,'info').mockImplementation(()=>{});});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});

describe('report-day boundary recovery: real PDF bytes, mocked provider',()=>{
  it.each([true,false])('returns candidate dates and original section pages without a partial report (stream=%s)',async stream=>{
    const output=envelope();output.reportDates.push('2021-06-29');generate.mockResolvedValue({text:JSON.stringify(output)});
    const {last,messages,response}=await run(await pdf(2),undefined,stream);
    expect(last).toMatchObject({code:'MULTI_DAY_REPORT',reportDays:{reportDates:[day,'2021-06-29'],pages:[1,2],basis:'SOURCE_REVIEW_REQUIRED'}});
    expect(response.status).toBe(stream?200:422);expect(messages.some(m=>m.type==='result'||m.stage==='ready')).toBe(false);
  });
  it('accepts repeated identical headers without classifying them as multiple days',async()=>{
    const output=envelope();output.reportDates=[day,day,day];generate.mockResolvedValue({text:JSON.stringify(output)});
    expect((await run(await pdf(2))).last.report.reportDate).toBe(day);
  });
  it('reports dates across separate sections before merging unrelated clocks',async()=>{
    generate.mockResolvedValueOnce({text:JSON.stringify(envelope())}).mockResolvedValueOnce({text:JSON.stringify(envelope('2021-06-29'))});
    const {last}=await run(await pdf(3));expect(last).toMatchObject({code:'MULTI_DAY_REPORT',reportDays:{reportDates:[day,'2021-06-29'],pages:[1,2,3]}});
  });
  it.each([day,'2021-06-29'])('processes an explicitly selected day independently: %s',async date=>{
    const output=envelope(date);generate.mockResolvedValue({text:JSON.stringify(output)});
    const {last}=await run(await pdf(2),select(date,date===day?[1]:[2]));
    expect(last.type).toBe('result');expect(last.report.reportDate).toBe(date);expect(last.report.events).toHaveLength(1);expect(last.report.metrics.observedMinutes).toBe(60);expect(last.report.sourceKind).toBe('PUBLIC_SOURCE_UNREVIEWED');
    expect(last.report.events[0].evidence.page).toBe(date===day?1:2);
  });
  it('copies only chosen pages, preserves original references/excerpts and never mutates the file',async()=>{
    const file=await pdf(4);const before=createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex');
    const output=envelope();output.events[0].evidence.page=2;generate.mockResolvedValue({text:JSON.stringify(output)});
    const {last}=await run(file,select(day,[3,4]));expect(last.type).toBe('result');
    const attachment=generate.mock.calls[0][0].contents[0].parts[0].inlineData.data;
    expect((await PDFDocument.load(Buffer.from(attachment,'base64'))).getPageCount()).toBe(2);
    expect(last.report.events[0].evidence).toMatchObject({fileName:'original.pdf',page:4,snippet:real.events[0].evidence.snippet});
    expect(createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex')).toBe(before);
  });
  it('keeps the single-page original-page mapping instead of renumbering the selection to page one',async()=>{
    generate.mockResolvedValue({text:JSON.stringify(envelope())});const {last}=await run(await pdf(4),select(day,[4]));expect(last.report.events[0].evidence.page).toBe(4);
  });
  it.each(['2021-06-29',''])('does not overwrite conflicting/missing extracted dates with the user choice (%s)',async date=>{
    generate.mockResolvedValue({text:JSON.stringify(envelope(date))});const {last,messages}=await run(await pdf(3),select());
    expect(last).toMatchObject({code:'REPORT_DAY_MISMATCH',reportDays:{reportDates:date?[date]:[],pages:[3]}});expect(messages.some(m=>m.type==='result')).toBe(false);
  });
  it('still rejects conflicting headers on the selected pages instead of ignoring the other date',async()=>{
    const output=envelope();output.reportDates.push('2021-06-29');generate.mockResolvedValue({text:JSON.stringify(output)});
    expect((await run(await pdf(3),select())).last.code).toBe('MULTI_DAY_REPORT');
  });
  it('keeps explicit null depths unknown in the selected report',async()=>{
    const output=envelope();output.events[0].startHoleDepthFt=null;output.events[0].endHoleDepthFt=null;generate.mockResolvedValue({text:JSON.stringify(output)});
    const {last}=await run(await pdf(3),select());expect(last.report.events[0].startHoleDepthFt).toBeNull();expect(last.report.depthCurve).toEqual([]);
  });
  it('rejects missing timestamps on a selected day rather than fabricating an interval',async()=>{
    const output=envelope();delete (output.events[0] as Record<string,unknown>).startMinute;generate.mockResolvedValue({text:JSON.stringify(output)});
    expect((await run(await pdf(3),select())).last.code).toBe('INVALID_EXTRACTION');
  });
  it.each([{...select(),sourceReviewed:false},{...select(),pages:[1,1]},{...select(),pages:[2,1]},{...select(),pages:[1,3]},{...select(),reportDate:'2021-02-30'}])('rejects invalid/unconfirmed selection before provider calls: %j',async selection=>{
    const {response,last}=await run(await pdf(),selection);expect(response.status).toBe(400);expect(last.code).toBe('INVALID_REPORT_SELECTION');expect(generate).not.toHaveBeenCalled();
  });
  it('rejects out-of-document pages before provider calls',async()=>{
    const {last}=await run(await pdf(2),select(day,[3]));expect(last.code).toBe('INVALID_REPORT_PAGES');expect(generate).not.toHaveBeenCalled();
  });
  it('retains the source page cap even when a smaller subset is selected',async()=>{
    const {last}=await run(await pdf(25),select(day,[1]));expect(last.code).toBe('PDF_PAGE_LIMIT');expect(generate).not.toHaveBeenCalled();
  });
  it('deduplicates overlapping extracted intervals across selected sections without merging conflicting observations',async()=>{
    const first=envelope(),second=envelope();first.events[0].evidence.page=2;second.events[0].confidence='LOW';generate.mockResolvedValueOnce({text:JSON.stringify(first)}).mockResolvedValueOnce({text:JSON.stringify(second)});
    const {last}=await run(await pdf(4),select(day,[1,2,3,4]));expect(last.report.events).toHaveLength(1);expect(last.report.metrics.observedMinutes).toBe(60);expect(last.report.events[0].confidence).toBe('LOW');expect(last.report.warnings.join(' ')).toContain('deduplicated');
  });
  it('does not treat two conflicting intervals as exact duplicates',async()=>{
    const output=envelope();output.events.push({...structuredClone(output.events[0]),classification:'NPT'});generate.mockResolvedValue({text:JSON.stringify(output)});
    const {last}=await run(await pdf(3),select());expect(last.code).toBe('INVALID_TIMELINE');expect(last.report).toBeUndefined();
  });
  it('cancels a selected-day import with no final report',async()=>{
    let start!:()=>void;const started=new Promise<void>(r=>{start=r;});generate.mockImplementation(()=>{start();return new Promise(()=>{});});
    const controller=new AbortController();const response=await POST(request(await pdf(),select(),true,controller.signal));const body=response.text();await started;controller.abort();const messages=(await body).trim().split('\n').map(l=>JSON.parse(l));expect(messages.at(-1).code).toBe('INGEST_CANCELLED');expect(messages.some(m=>m.type==='result')).toBe(false);
  });
});

describe('explicit page selection input',()=>{
  it.each(['','0','2-1','1,2','1-25','1-2-3','1.5'])('does not guess invalid page text: %s',value=>expect(parseReportPages(value)).toBeNull());
  it('supports a single page/range while requiring a checked date',()=>{expect(parseReportPages('3')).toEqual([3]);expect(parseReportPages(' 3 - 4 ')).toEqual([3,4]);expect(ReportDaySelectionSchema.safeParse(select()).success).toBe(true);});
});
