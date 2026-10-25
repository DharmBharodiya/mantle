// Deterministic release checks against the running server. Never calls Gemini.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
const base = process.env.BORESIGHT_TEST_URL || 'http://127.0.0.1:3100';
const checks = [];
async function record(name, operation) {
  try { checks.push({name, status:'PASS', ...await operation()}); }
  catch(error) { checks.push({name, status:'FAIL', error:error.message}); process.exitCode=1; }
}
for (const script of ['scripts/smoke.mjs', 'scripts/verify-ingestion.mjs']) {
  const run=spawnSync(process.execPath,[script],{encoding:'utf8'});
  try {
    const results=JSON.parse(run.stdout);
    assert(Array.isArray(results));
    checks.push(...results.map(result=>({script,...result})));
    if(run.status!==0||results.some(result=>result.status!=='PASS'))process.exitCode=1;
  } catch(error) {checks.push({script,status:'FAIL',exitCode:run.status,error:error.message,output:run.stdout,stderr:run.stderr});process.exitCode=1;}
}
const report=JSON.parse(await readFile('demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json','utf8')).report;
async function analytics(name,body,status,verify) {
  await record(name,async()=>{const response=await fetch(base+'/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const r=await response.json();assert.equal(response.status,status);assert(verify(r));return {httpStatus:response.status};});
}
await analytics('FORGE scenario: 293 ft / 3.5 h, 34.2 min ILT / $5,700; null carbon',{extraction:report,scenario:{...report.scenario,drillBenchmarkFtPerHour:100,rigDailyUsd:240000},sourceKind:report.sourceKind},200,r=>r.events.length===17&&Math.abs(r.metrics.iltMinutes-34.2)<1e-8&&Math.abs(r.metrics.estimatedIltOpportunityUsd-5700)<1e-6&&r.metrics.nptMinutes===0&&r.metrics.modeledExcessCo2Tons===null);
await analytics('Cannot promote source verification',{extraction:report,sourceKind:'HUMAN_VERIFIED'},200,r=>r.sourceKind==='PUBLIC_SOURCE_UNREVIEWED'&&r.events.every((e,i)=>JSON.stringify(e.evidence)===JSON.stringify(report.events[i].evidence)));
const overlap=structuredClone(report);overlap.events[1].startMinute=0;
await analytics('Overlaps reject without metrics',{extraction:overlap},422,r=>!r.metrics&&Boolean(r.error));
await analytics('Invalid scenario rejects without metrics',{extraction:report,scenario:{...report.scenario,rigDailyUsd:-1}},422,r=>!r.metrics&&Boolean(r.error));
await analytics('Empty report rejects without metrics',{extraction:{...report,events:[]}},422,r=>!r.metrics&&Boolean(r.error));
const h=['wellName','reportDate','startMinute','endMinute','activity','classification','startHoleDepthFt','endHoleDepthFt','note'];
const row=['TEST_WELL','2026-10-24','0','60','DRILLING','PRODUCTIVE','1000','1035','DRILL 35 FT'];
const encode=cells=>cells.map(x=>JSON.stringify(x)).join(',');
const csv=(cols,values)=>new File([encode(cols)+'\n'+encode(values)],'validation.csv',{type:'text/csv'});
async function upload(name,file,status,code,stream=false,verify=()=>true) {
  await record(name,async()=>{
    const data=new FormData();data.append('file',file);
    const response=await fetch(base+'/api/ingest',{method:'POST',body:data,headers:stream?{Accept:'application/x-ndjson'}:{},signal:AbortSignal.timeout(15000)});
    const body=stream?(await response.text()).trim().split('\n').map(JSON.parse):await response.json();const terminal=stream?body.at(-1):body;
    assert.equal(response.status,stream?200:status);
    if(code){assert.equal(terminal.code,code);assert(!terminal.events&&!terminal.metrics);if(stream){assert.equal(terminal.status,status);assert(body.every(m=>m.type!=='result'&&m.stage!=='ready'));}}
    assert(verify(terminal));return {httpStatus:response.status,terminalStatus:stream?terminal.status:undefined,code:terminal.code};
  });
}
await upload('Duplicate CSV headers reject',csv([...h,'Start Minute'],[...row,'120']),422,'AMBIGUOUS_STRUCTURED_COLUMNS');
await upload('Conflicting aliases return terminal error only',csv([...h,'startTime'],[...row,'01:00']),422,'AMBIGUOUS_STRUCTURED_COLUMNS',true);
await upload('Equivalent aliases preserve source and coverage',csv([...h,'startTime','endTime'],[...row,'00:00','01:00']),200,null,false,r=>r.events.length===1&&r.metrics.observedMinutes===60&&r.events[0].evidence.snippet==='DRILL 35 FT');
const malformed=[...row];malformed[6]='1,2';await upload('Malformed depth grouping rejects',csv(h,malformed),422,'INVALID_STRUCTURED_ROW');
const workbook=new ExcelJS.Workbook();workbook.addWorksheet('DDR').addRows([[...h,'End Minute'],[...row,'120']]);await upload('XLSX duplicate headers reject after decoding',new File([new Uint8Array(await workbook.xlsx.writeBuffer())],'validation.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),422,'AMBIGUOUS_STRUCTURED_COLUMNS');
const pdf=await PDFDocument.create();for(let i=0;i<25;i++)pdf.addPage();await upload('25-page PDF rejects before provider generation',new File([new Uint8Array(await pdf.save())],'limit.pdf',{type:'application/pdf'}),413,'PDF_PAGE_LIMIT',true);
await writeFile('docs/qa/final-release-http.json',JSON.stringify({checkedAt:new Date().toISOString(),base,providerCalls:0,totalAssertions:checks.length,checks},null,2)+'\n');
console.log(JSON.stringify(checks,null,2));
if(checks.length!==21||checks.some(check=>check.status!=='PASS'))process.exitCode=1;
