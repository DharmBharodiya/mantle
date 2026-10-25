// Default checks are deterministic; --live makes one actual Gemini PDF extraction.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import ExcelJS from "exceljs";
const base=process.env.BORESIGHT_TEST_URL||"http://127.0.0.1:3100";
const results=[];
async function upload(file) {
  const start=Date.now();const data=new FormData();data.append("file",file);
  const response=await fetch(base+"/api/ingest",{method:"POST",body:data,headers:{Accept:"application/x-ndjson"},signal:AbortSignal.timeout(255000)});
  const requestId=response.headers.get("x-request-id");
  if(!response.ok){const body=await response.json();throw new Error(`HTTP ${response.status}: ${body.code}: ${body.error}`);}
  const messages=(await response.text()).trim().split("\n").map(line=>JSON.parse(line));
  const error=messages.find(message=>message.type==="error");if(error)throw new Error(`${error.code}: ${error.error} (request ${requestId})`);
  const report=messages.find(message=>message.type==="result")?.report;
  assert(report,"No final report envelope");assert.equal(report.sourceKind,"SYNTHETIC_DEMO");assert.equal(report.events.length,3);assert.equal(report.metrics.nptMinutes,60);
  return {elapsedMs:Date.now()-start,requestId,events:report.events.length,nptMinutes:report.metrics.nptMinutes,stages:messages.filter(message=>message.type==="stage").map(message=>message.stage)};
}
async function check(name,operation){try{results.push({check:name,status:"PASS",...await operation()});}catch(error){results.push({check:name,status:"FAIL",error:error.message});process.exitCode=1;}}
const csv=await readFile(new URL("../demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv",import.meta.url));
await check("Canonical CSV without Gemini",()=>upload(new File([csv],"SYNTHETIC_DEMO-single-day.csv",{type:"text/csv"})));
await check("Canonical XLSX without Gemini",async()=>{const wb=new ExcelJS.Workbook();const rows=csv.toString("utf8").replace(/^\uFEFF/,"").trim().split(/\r?\n/).map(line=>line.split(","));wb.addWorksheet("DDR").addRows(rows);return upload(new File([new Uint8Array(await wb.xlsx.writeBuffer())],"SYNTHETIC_DEMO-single-day.xlsx"));});
if(process.argv.includes("--live"))await check("LIVE Gemini one-page PDF",async()=>{
  const pdf=await PDFDocument.create();const page=pdf.addPage();const font=await pdf.embedFont(StandardFonts.Helvetica);
  const lines=["SYNTHETIC_DEMO_LAB - Report date 2026-10-24","All depths below are HOLE MEASURED DEPTH in FEET.","00:00-02:00 DRILLING PRODUCTIVE: drill 1000 to 1070 feet.","02:00-03:00 CIRCULATING PRODUCTIVE: planned circulation at 1070 feet.","03:00-04:00 WAITING NPT: UNPLANNED wait for parts, hole depth 1070 feet.","All data is SYNTHETIC_DEMO, not a real well."];
  lines.forEach((line,index)=>page.drawText(line,{font,size:11,x:30,y:780-index*28}));
  return upload(new File([new Uint8Array(await pdf.save())],"SYNTHETIC_DEMO-live-check.pdf",{type:"application/pdf"}));
});
console.log(JSON.stringify(results,null,2));
