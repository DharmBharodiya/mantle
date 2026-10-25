// --live explicitly sends selected PUBLIC FORGE evidence to Gemini through the running Mantle API.
// Without --live, validates the recorded observations only. Never sends provider calls without --live.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BORESIGHT_TEST_URL||'http://127.0.0.1:3100';
const original=JSON.parse(await readFile('demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json','utf8')).report;
const annotated=structuredClone(original);annotated.warnings.push('Source review annotation: original PDF page 4 header Hole Made / Hrs is 293 / 4.0 drilling h; the operations table 01:30-05:00 is 3.5 h (210 min). Both claims conflict and are retained without reconciliation.');
const source=(id,report,scenario=report.scenario)=>({id,extraction:{wellName:report.wellName,reportDate:report.reportDate,events:report.events,warnings:report.warnings},scenario,sourceKind:report.sourceKind});
const cases=[{name:'narrative with source and longest event focus',question:'Which activity consumed the most time in this report day?',reports:[source('forge',original)]},{name:'follow-up referring to previous event',question:'What happened immediately before it?',reports:[source('forge',original)]},{name:'conflicting header and timeline totals',question:'Explain the conflicting header and timeline drilling totals. Show supporting evidence.',reports:[source('forge',annotated)]},{name:'same-source scenario comparison',question:'Compare NPT and drilling ILT scenario exposure between these two analyses.',reports:[source('original',original),source('scenario',original,{...original.scenario,drillBenchmarkFtPerHour:100,rigDailyUsd:240000})]}];
let observations=[];
if(process.argv.includes('--live')){
 let previous=null;
 for(const item of cases){
  const started=Date.now();const history=item.name.startsWith('follow-up')&&previous?[{question:cases[0].question,focus:previous.focus}]:[];
  const response=await fetch(base+'/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:item.question,reports:item.reports,history}),signal:AbortSignal.timeout(46000)});
  const result=await response.json();const observation={name:item.name,question:item.question,checkedAt:new Date().toISOString(),elapsedMs:Date.now()-started,httpStatus:response.status,result};observations.push(observation);await writeFile('docs/qa/copilot-live.json',JSON.stringify(observations,null,2)+'\n');
  console.log(JSON.stringify({name:item.name,httpStatus:response.status,mode:result.mode,notice:result.providerNotice,requestId:result.requestId,elapsedMs:observation.elapsedMs}));
  if(!response.ok||result.providerNotice&&/rate limit|unavailable|timed out|credential|configuration/i.test(result.providerNotice))break;
  previous=result;
 }
}else observations=JSON.parse(await readFile('docs/qa/copilot-live.json','utf8'));
const checks=[];
for(const observation of observations){const problems=[];const r=observation.result;try{
 assert.equal(observation.httpStatus,200);assert.equal(r.mode,'GEMINI','Expected a genuine Gemini explanation, not a fallback');assert(r.statements.length>0);
 const citationIds=new Set(r.citations.map(c=>c.id)),calcIds=new Set(r.calculations.map(c=>c.id));for(const statement of r.statements){assert(statement.citationIds.every(id=>citationIds.has(id)));assert(statement.calculationIds.every(id=>calcIds.has(id)));}
 const normalize=s=>s.replace(/\s+/g,' ').trim();const expected=JSON.parse(await readFile('demo-fixtures/public/forge-78b-32/2021-06-28-expected.json','utf8'));
 for(const citation of r.citations.filter(c=>c.kind==='EVENT'))assert(normalize(expected.operationsText).includes(normalize(citation.snippet)),'Returned a source quote not in the checked original');
 if(observation.name.startsWith('narrative')){assert(r.citations.some(c=>c.eventId===original.events.at(-1).id));assert.equal(r.focus?.eventId,original.events.at(-1).id);}
 if(observation.name.startsWith('follow-up'))assert.equal(r.focus?.eventId,original.events.at(-2).id);
 if(observation.name.startsWith('conflicting')){assert(r.citations.some(c=>c.kind==='REVIEW_WARNING'&&c.snippet.includes('4.0')&&c.snippet.includes('3.5')));assert.equal(r.calculations.find(c=>c.metric==='Drilling interval time')?.value,210);}
 if(observation.name.startsWith('same-source')){assert.equal(r.scope.length,2);assert(Math.abs(r.calculations.find(c=>c.reportId==='scenario'&&c.metric==='Modeled time exposure')?.value-5700)<1e-6);assert.equal(r.calculations.find(c=>c.reportId==='original'&&c.metric==='Modeled time exposure')?.value,0);}
}catch(error){problems.push(error.message);}
 checks.push({name:observation.name,requestId:r.requestId,elapsedMs:observation.elapsedMs,mode:r.mode,status:problems.length?'FAIL':'PASS',problems});}
await writeFile('docs/qa/copilot-live-comparison.json',JSON.stringify({checkedAt:new Date().toISOString(),expectedCases:cases.length,observedCases:observations.length,checks},null,2)+'\n');console.log(JSON.stringify(checks,null,2));if(observations.length!==cases.length||checks.some(c=>c.status!=='PASS'))process.exitCode=1;
