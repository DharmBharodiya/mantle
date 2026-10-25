// One actual public two-day PDF request, explicitly selecting the independently checked first source day.
// No retries beyond the application's existing bounded provider policy.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const fixture='demo-fixtures/public/forge-78b-32/';const bytes=await readFile(fixture+'2021-06-28-and-29-operations.pdf');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'0e4e0b8dabe3c50743386e43de4ce103fa8fdc43545e373b03895a29bdbce9a8');
const selection={reportDate:'2021-06-28',pages:[1],sourceReviewed:true};
const evidence={checkedAt:new Date().toISOString(),source:'Public Utah FORGE two-day PDF, original pages 4 and 7; original day-one source manually compared previously.',selection,messages:[],elapsedMs:0};
const form=new FormData();form.append('file',new File([bytes],'2021-06-28-and-29-operations.pdf',{type:'application/pdf'}));form.append('reportDay',JSON.stringify(selection));
const start=Date.now();try {
 const response=await fetch((process.env.BORESIGHT_TEST_URL||'http://127.0.0.1:3100')+'/api/ingest',{method:'POST',body:form,headers:{Accept:'application/x-ndjson'},signal:AbortSignal.timeout(255000)});
 evidence.httpStatus=response.status;evidence.requestId=response.headers.get('x-request-id');evidence.messages=response.headers.get('content-type')?.includes('ndjson')?(await response.text()).trim().split('\n').map(JSON.parse):[await response.json()];
} catch(error) {evidence.transportError=error.message;}
evidence.elapsedMs=Date.now()-start;
await writeFile('docs/qa/report-day-live.json',JSON.stringify(evidence,null,2)+'\n');
const report=evidence.messages.find(m=>m.type==='result')?.report;const error=evidence.messages.find(m=>m.type==='error');const problems=[];const quoteMismatches=[];
if(!report)problems.push('No completed selected-day report: '+JSON.stringify(error||evidence.transportError));
else {
 const expected=JSON.parse(await readFile(fixture+'2021-06-28-expected.json','utf8'));const normalize=value=>value.replace(/\s+/g,' ').trim();
 if(report.reportDate!==selection.reportDate||report.events.length!==17)problems.push('Selected report date/event count mismatch');
 for(const[index,[from,to,depth]]of expected.intervals.entries()){const event=report.events.find(e=>e.startMinute===from&&e.endMinute===to);if(!event||event.endHoleDepthFt!==depth||event.evidence.page!==1)problems.push('Interval/depth/source-page mismatch at '+(index+1));if(!event?.evidence.snippet||!normalize(expected.operationsText).includes(normalize(event.evidence.snippet)))quoteMismatches.push(index+1);}
 if(report.sourceKind!=='PUBLIC_SOURCE_UNREVIEWED'||report.metrics.observedMinutes!==1440||report.metrics.iltEligibleMinutes!==210)problems.push('Provenance or timeline coverage mismatch');
}
const result={requestId:evidence.requestId,elapsedMs:evidence.elapsedMs,selectionStatus:problems.length?'FAIL':'PASS',problems,quoteStatus:!report?'UNVERIFIED':quoteMismatches.length?'FAIL':'PASS',quoteMismatches};
await writeFile('docs/qa/report-day-live-comparison.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(problems.length||quoteMismatches.length)process.exitCode=1;
