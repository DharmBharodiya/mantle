// Offline by default. --live explicitly sends this public PDF to the running ingestion API/Gemini.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory='demo-fixtures/public/forge-78b-32';
const expected=JSON.parse(await readFile(`${directory}/2021-06-28-expected.json`,'utf8'));
const input=await readFile(`${directory}/2021-06-28-operations.pdf`);
const sha=createHash('sha256').update(input).digest('hex');
const normalize=value=>value.replace(/\s+/g,' ').trim();
let evidence;
if(process.argv.includes('--live')) {
  const base=process.env.BORESIGHT_TEST_URL||'http://127.0.0.1:3100';
  const data=new FormData();data.append('file',new File([input],'FORGE-78B-32-2021-06-28-original-page-4.pdf',{type:'application/pdf'}));
  const start=Date.now();
  const response=await fetch(`${base}/api/ingest`,{method:'POST',body:data,headers:{Accept:'application/x-ndjson'},signal:AbortSignal.timeout(255000)});
  const messages=response.headers.get('content-type')?.includes('ndjson')?(await response.text()).trim().split('\n').map(line=>JSON.parse(line)):[{type:'error',...await response.json()}];
  evidence={checkedAt:new Date().toISOString(),sourceUrl:expected.source,originalPage:4,excerptPage:1,excerptSha256:sha,httpStatus:response.status,elapsedMs:Date.now()-start,messages};
  // Keep the original observed evidence immutable; save this rerun separately.
  await writeFile('docs/qa/forge-live-latest.json',JSON.stringify(evidence,null,2));
} else evidence=JSON.parse(await readFile('docs/qa/forge-live-observed.json','utf8'));
const report=evidence.messages.find(message=>message.type==='result')?.report;
const mismatches=[];
if(evidence.excerptSha256!==sha)mismatches.push('PDF excerpt differs from the recorded request');
if(!report)mismatches.push('No completed report: '+JSON.stringify(evidence.messages.find(m=>m.type==='error')));
else {
  if(report.reportDate!==expected.reportDate||!report.wellName.includes('78B-32'))mismatches.push('Wrong report date or well');
  if(report.events.length!==expected.intervals.length)mismatches.push(`Expected 17 operations; received ${report.events.length}`);
  for(const [index,[start,end,depth]] of expected.intervals.entries()) {
    const event=report.events.find(e=>e.startMinute===start&&e.endMinute===end);
    if(!event){mismatches.push(`Interval ${index+1}: missing/wrong timestamps or duration`);continue;}
    if(event.endHoleDepthFt!==depth)mismatches.push(`Interval ${index+1}: wrong ending hole depth`);
    if(event.classification!=='PRODUCTIVE')mismatches.push(`Interval ${index+1}: review planned-operation classification ${event.classification}`);
    if(!event.evidence.snippet||event.evidence.page!==1||!normalize(expected.operationsText).includes(normalize(event.evidence.snippet)))mismatches.push(`Interval ${index+1}: excerpt or excerpt-page mismatch`);
  }
  const drilling=report.events.find(e=>e.startMinute===90);
  if(drilling?.activity!=='DRILLING'||drilling.startHoleDepthFt!==128)mismatches.push('Wrong drilling activity/start depth');
  if(report.metrics.observedMinutes!==1440||report.metrics.nptMinutes!==0)mismatches.push('Coverage/NPT mismatch');
  if(report.sourceKind!=='PUBLIC_SOURCE_UNREVIEWED')mismatches.push('Source status was incorrectly promoted');
}
console.log(JSON.stringify({mode:process.argv.includes('--live')?'LIVE HTTP/Gemini':'OFFLINE recorded response vs manually transcribed original',requestId:evidence.messages[0]?.requestId,originalPage:4,excerptPage:1,events:report?.events.length,elapsedMs:evidence.elapsedMs,mismatches},null,2));
if(mismatches.length)process.exitCode=1;

if (process.argv.includes('--http') && report) {
  const checks=[];
  const base=process.env.BORESIGHT_TEST_URL||'http://127.0.0.1:3100';
  async function check(name,body,expectedStatus,verify=()=>true) {
    const response=await fetch(base+'/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json();
    const pass=response.status===expectedStatus&&verify(result);
    checks.push({name,status:pass?'PASS':'FAIL',httpStatus:response.status});
    if(!pass)process.exitCode=1;
  }
  await check('Real report scenario uses 293 ft / 3.5 h and explicit assumptions',{extraction:report,scenario:{...report.scenario,drillBenchmarkFtPerHour:100,rigDailyUsd:240000},sourceKind:report.sourceKind},200,r=>r.events.length===17&&Math.abs(r.metrics.iltMinutes-34.2)<1e-8&&Math.abs(r.metrics.estimatedIltOpportunityUsd-5700)<1e-6&&r.metrics.nptMinutes===0&&r.metrics.modeledExcessCo2Tons===null);
  await check('Source verification cannot be promoted',{extraction:report,sourceKind:'HUMAN_VERIFIED'},200,r=>r.sourceKind==='PUBLIC_SOURCE_UNREVIEWED'&&r.events.every((e,i)=>JSON.stringify(e.evidence)===JSON.stringify(report.events[i].evidence)));
  const overlap=structuredClone(report);overlap.events[1].startMinute=0;
  await check('Conflicting intervals return an error, never report metrics',{extraction:overlap},422,r=>!r.metrics&&Boolean(r.error));
  await check('Negative scenario rate is rejected',{extraction:report,scenario:{...report.scenario,rigDailyUsd:-1}},422,r=>!r.metrics&&Boolean(r.error));
  await writeFile('docs/qa/forge-http.json',JSON.stringify({checkedAt:new Date().toISOString(),checks},null,2));
  console.log(JSON.stringify(checks,null,2));
}
