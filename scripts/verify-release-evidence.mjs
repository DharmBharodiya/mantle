// --live calls the existing HTTP/Gemini pipeline with attributed public PDFs.
// This release check submits one full-day fixture only, preserving prior backend evidence.
// Without --live, compare this release attempt without making a provider request.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.env.BORESIGHT_TEST_URL||'http://127.0.0.1:3100';
const fixture='demo-fixtures/public/forge-78b-32/';
const expected=JSON.parse(await readFile(fixture+'2021-06-28-expected.json','utf8'));
const normalize=value=>value.replace(/\s+/g,' ').trim();
const singleDay=true;
const evidencePath=singleDay?'docs/qa/final-release-evidence-single-day.json':'docs/qa/final-release-evidence-live.json';
const cases=[{name:'Real three-page single report day',file:'2021-06-28-full-day.pdf',originalPages:[4,5,6],hash:'775206c4bf99a400146a7ec4ab30e284d2228a889373d075ff193cdd7131762d'},{name:'Real adjacent report days in one section',file:'2021-06-28-and-29-operations.pdf',originalPages:[4,7],hash:'0e4e0b8dabe3c50743386e43de4ce103fa8fdc43545e373b03895a29bdbce9a8'}];
let observations=[];
if(process.argv.includes('--live')){
 for(const item of (singleDay?cases.slice(0,1):cases)){
  const bytes=await readFile(fixture+item.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.hash);
  const data=new FormData();data.append('file',new File([bytes],item.file,{type:'application/pdf'}));
  const started=Date.now();let observation={...item,checkedAt:new Date().toISOString(),messages:[]};
  try{
   const response=await fetch(base+'/api/ingest',{method:'POST',body:data,headers:{Accept:'application/x-ndjson'},signal:AbortSignal.timeout(255000)});
   observation.httpStatus=response.status;observation.requestId=response.headers.get('x-request-id');
   if(response.headers.get('content-type')?.includes('ndjson')){
    const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
    for(;;){const{value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let n;while((n=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);if(line.trim()){const message=JSON.parse(line);observation.messages.push(message);if(message.type!=='result')console.log(JSON.stringify({case:item.name,...message}));}}}
    buffer+=decoder.decode();if(buffer.trim())observation.messages.push(JSON.parse(buffer));
   }else observation.messages.push({type:'error',...await response.json()});
  }catch(error){observation.transportError=error.message;}
  observation.elapsedMs=Date.now()-started;observations.push(observation);await writeFile(evidencePath,JSON.stringify(observations,null,2));
 }
}else observations=JSON.parse(await readFile(evidencePath,'utf8'));
const checks=[];
for(const item of observations){
 const mismatches=[];const report=item.messages.find(message=>message.type==='result')?.report;const error=item.messages.find(message=>message.type==='error');
 if(item.file===cases[0].file){
  if(!report)mismatches.push('No completed real-day report: '+JSON.stringify(error||item.transportError));
  else{
   if(report.reportDate!=='2021-06-28')mismatches.push('Wrong report day: '+report.reportDate);
   if(!report.wellName.includes('78B-32'))mismatches.push('Wrong well: '+report.wellName);
   if(report.events.length!==17)mismatches.push(`Expected 17 source operations, received ${report.events.length}`);
   for(const[index,[start,end,depth]]of expected.intervals.entries()){
    const event=report.events.find(e=>e.startMinute===start&&e.endMinute===end);
    if(!event){mismatches.push(`Missing/wrong interval ${index+1}`);continue;}
    if(event.endHoleDepthFt!==depth)mismatches.push(`End MD mismatch at interval ${index+1}: ${event.endHoleDepthFt}`);
    if(event.classification==='NPT')mismatches.push(`Unsupported NPT at interval ${index+1}`);
    if(event.evidence.page!==1)mismatches.push(`Wrong excerpt source page at interval ${index+1}: ${event.evidence.page}`);
    if(!event.evidence.snippet||!normalize(expected.operationsText).includes(normalize(event.evidence.snippet)))mismatches.push(`Excerpt mismatch at interval ${index+1}`);
   }
   if(report.metrics.observedMinutes!==1440||report.metrics.nptMinutes!==0||report.metrics.iltEligibleMinutes!==210)mismatches.push('Coverage/NPT/drilling duration mismatch');
   if(report.sourceKind!=='PUBLIC_SOURCE_UNREVIEWED')mismatches.push('Incorrect source promotion');
   if(!report.warnings.some(warning=>/discrepancy.*4\.0.*3\.5/i.test(warning)))mismatches.push('Missing original 4.0 h versus 3.5 h discrepancy warning');
   if(process.argv.includes('--live'))await writeFile('docs/qa/final-release-evidence-real.snapshot.json',JSON.stringify({format:'boresight-report',version:1,report},null,2));
  }
 }else if(error?.code!=='MULTI_DAY_REPORT'||report)mismatches.push('Expected MULTI_DAY_REPORT and no report; observed '+JSON.stringify(error||item.transportError||'success'));
 checks.push({name:item.name,status:mismatches.length?'FAIL':'PASS',httpStatus:item.httpStatus,requestId:item.requestId,elapsedMs:item.elapsedMs,events:report?.events.length,errorCode:error?.code,mismatches});
}
console.log(JSON.stringify({mode:process.argv.includes('--live')?'LIVE HTTP/Gemini':'OFFLINE recorded evidence comparison',checks},null,2));
await writeFile(singleDay?'docs/qa/final-release-evidence-single-day-comparison.json':'docs/qa/final-release-evidence-live-comparison.json',JSON.stringify({checkedAt:new Date().toISOString(),checks},null,2));
if(checks.length!==(singleDay?1:2)||checks.some(check=>check.status!=='PASS'))process.exitCode=1;
