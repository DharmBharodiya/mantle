import { buildWellReport } from "@/lib/analytics/compute";
import type { WellTelemetryReport, DrillingEvent } from "@/types/telemetry";
import { IntentSchema, type CopilotRequest, type QueryIntent, type Citation, type Calculation, type Focus } from "@/types/copilot";
export type ScopedReport={id:string;report:WellTelemetryReport};
export const GLOSSARY:Record<string,string>={POOH:'Pull out of hole: withdrawing the drill string. Hole measured depth alone does not establish string travel speed.',POH:'Pull out of hole: withdrawing the drill string.',RIH:'Run in hole: lowering the drill string or tool assembly.',BHA:'Bottom-hole assembly: the tools at the lower end of the drill string.',NPT:'Non-productive time: explicit unplanned downtime classification in the supplied records.',ILT:'Invisible lost time: a scenario against the selected benchmark, not proven recoverable time.',WOC:'Wait on cement. This is not automatically NPT.',ROP:'Rate of penetration. The benchmark is an assumption for comparable drilling conditions.'};
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const activityWords:Record<string,string[]>={DRILLING:['drill','drilling','rop','footage'],TRIPPING_OUT:['pooh','poh','pull out','tripping out'],TRIPPING_IN:['rih','run in','tripping in'],CASING_CEMENTING:['casing','cement','bop','pressure test'],CIRCULATING:['circulate','circulation','mud','fill'],BHA_CHANGE:['bha','bit change'],RIG_REPAIR:['repair','pump','seal'],WAITING:['wait','waiting','parts']};
export function canonicalScope(input:CopilotRequest):ScopedReport[]{
 return input.reports.map(item=>({id:item.id,report:buildWellReport(item.extraction,{scenario:item.scenario,sourceKind:item.sourceKind==='SYNTHETIC_DEMO'?'SYNTHETIC_DEMO':'PUBLIC_SOURCE_UNREVIEWED'})}));
}
export function baseIntent():QueryIntent{return {kind:'LOOKUP',reportIds:[],activities:[],classifications:[],terms:[],relative:'NONE',ranking:'RELEVANCE',startMinute:null,endMinute:null};}
/** Conservative fallback for transparent evidence search, not an imitation AI answer. */
export function fallbackIntent(question:string,scope:ScopedReport[]):QueryIntent{
 const q=normalize(question);const intent=baseIntent();
 const named=scope.filter(r=>question.includes(r.report.reportDate)&&Boolean(r.report.reportDate));
 if(named.length)intent.reportIds=named.map(r=>r.id);
 if(/\b(before|preceding|previous)\b/.test(q)){intent.kind='TIMELINE';intent.relative='PREVIOUS';}
 else if(/\b(after|following|next event)\b/.test(q)){intent.kind='TIMELINE';intent.relative='NEXT';}
 else if(/\b(compare|comparison)\b/.test(q))intent.kind='COMPARE';
 else if(/\b(missing|unknown|inconsisten|conflict|discrepanc)/.test(q))intent.kind='MISSING';
 else if(Object.keys(GLOSSARY).some(term=>new RegExp('\\b'+term+'\\b','i').test(question))&&/\b(mean|meaning|what is|define)\b/.test(q))intent.kind='TERM';
 else if(/\b(npt|downtime|delay|stoppage|stop|stopped)\b/.test(q))intent.kind='NPT';
 else if(/\b(ilt|benchmark|opportunity)\b/.test(q))intent.kind='ILT';
 else if(/\b(exact|source|evidence|quote)\b/.test(q))intent.kind='EVIDENCE';
 else if(/\b(summar|overview|whole day)/.test(q))intent.kind='SUMMARY';
 else if(/\b(time|hours|minutes|activities|duration|total)\b/.test(q))intent.kind='AGGREGATE';
 if(/\b(longest|most time|largest)\b/.test(q))intent.ranking='LONGEST';
 if(/\b(safe to|operate|repair instructions|treatment|weather|forecast|tomorrow|predict)\b/.test(q))intent.kind='UNSUPPORTED';
 if(intent.kind==='TERM')intent.terms=Object.keys(GLOSSARY).filter(t=>new RegExp('\\b'+t+'\\b','i').test(question));
 else if(intent.kind==='LOOKUP'||intent.kind==='EVIDENCE')intent.terms=q.split(' ').filter(w=>w.length>2&&!['what','which','show','source','exact','text','supporting','that','answer','report','happened','the','does','this'].includes(w)).slice(0,8);
 return intent;
}
export function validateIntent(value:unknown,scope:ScopedReport[]):QueryIntent{
 const intent=IntentSchema.parse(value);
 if(intent.reportIds.some(id=>!scope.some(r=>r.id===id)))throw new Error('Unrecognized report reference');
 if(intent.startMinute!==null&&intent.endMinute!==null&&intent.endMinute<=intent.startMinute)throw new Error('Invalid query time range');
 return intent;
}
function textScore(event:DrillingEvent,terms:string[]):number{
 const text=normalize([event.note,event.explanation,event.evidence.snippet,event.activity].join(' '));
 return terms.reduce((sum,term)=>{
  const token=normalize(term);const alias=Object.entries(activityWords).find(([,words])=>words.some(w=>normalize(w)===token));
  return sum+(text.includes(token)?4:0)+(alias&&event.activity===alias[0]?3:0);
 },0);
}
export type Retrieved={intent:QueryIntent;scope:ScopedReport[];citations:Citation[];calculations:Calculation[];warnings:string[];focus:Focus|null;matchedEventCount:number;retrievalTruncated:boolean;summary:string;glossary:string[]};
export function retrieve(question:string,intent:QueryIntent,all:ScopedReport[],history:CopilotRequest['history']):Retrieved{
 let scope=intent.reportIds.length?all.filter(r=>intent.reportIds.includes(r.id)):all;
 const warnings:string[]=[];let summary='Evidence retrieved from the selected records. Numerical results below are computed by Mantle.';let focus:Focus|null=null;
 const dates=question.match(/\b\d{4}-\d{2}-\d{2}\b/g)||[];
 if(dates.some(date=>!all.some(r=>r.report.reportDate===date))){intent={...intent,kind:'CLARIFY'};summary='That report date is outside the selected scope. Select the report you mean before asking again.';}
 if(intent.kind==='COMPARE'&&scope.length<2){intent={...intent,kind:'CLARIFY'};summary='Select at least two report analyses to compare. No second report was invented.';}
 if(intent.kind==='UNSUPPORTED')summary='The supplied records cannot support that request. No operating instruction, prediction or verified root cause is provided.';
 if(intent.kind==='CLARIFY'&&summary.startsWith('Evidence'))summary='The request is ambiguous. Specify the report day, activity or event to investigate.';
 const candidates:{item:ScopedReport;event:DrillingEvent;score:number}[]=[];
 if(intent.kind==='TERM')summary='Drilling terminology reference; this definition alone does not establish what happened in the well.';
 const glossary=intent.kind==='TERM'?Object.keys(GLOSSARY).filter(t=>new RegExp('\\b'+t+'\\b','i').test(question)).map(t=>t+': '+GLOSSARY[t]):[];
 let anchor:Focus|null=null;
 if(intent.relative!=='NONE'||(/\b(it|that event|its|that answer)\b/i.test(question)&&intent.kind==='EVIDENCE')){
  anchor=history.at(-1)?.focus??null;
  let owner=scope.find(r=>r.id===anchor?.reportId);let index=owner?.report.events.findIndex(e=>e.id===anchor?.eventId)??-1;
  if((!owner||index<0)&&/\blongest\b/i.test(question)&&/\b(delay|stoppage|stop|downtime)\b/i.test(question)){
   const delays=scope.flatMap(item=>item.report.events.filter(event=>event.classification==='NPT').map(event=>({item,event}))).sort((a,b)=>(b.event.endMinute-b.event.startMinute)-(a.event.endMinute-a.event.startMinute));
   if(delays.length&&(!delays[1]||(delays[0].event.endMinute-delays[0].event.startMinute)>(delays[1].event.endMinute-delays[1].event.startMinute))){owner=delays[0].item;index=owner.report.events.findIndex(event=>event.id===delays[0].event.id);anchor={reportId:owner.id,eventId:delays[0].event.id};}
  }
  if(!owner||index<0){intent={...intent,kind:'CLARIFY'};summary='I cannot resolve that event reference in the current report scope. Ask about a specific event first.';}
  else {
   const target=owner.report.events[index+(intent.relative==='PREVIOUS'?-1:intent.relative==='NEXT'?1:0)];scope=[owner];
   if(target){
    const around=/\bbefore\b/i.test(question)&&/\bafter\b/i.test(question);
    const contextEvents=around?owner.report.events.slice(Math.max(0,index-1),index+2):[target];
    for(const event of contextEvents)candidates.push({item:owner,event,score:100});
    focus={reportId:owner.id,eventId:around?owner.report.events[index].id:target.id};intent={...intent,ranking:'CHRONOLOGICAL'};summary='Retrieved the adjacent event context from the same report timeline; adjacency is not proof of cause.';
   }
   else summary='There is no observed adjacent event in that direction in this report. Missing time has not been filled.';
  }
 }
 const eligible=!['UNSUPPORTED','CLARIFY'].includes(intent.kind);
 if(eligible&&!anchor&&intent.relative==='NONE')for(const item of scope)for(const event of item.report.events){
  if(intent.activities.length&&!intent.activities.includes(event.activity))continue;
  if(intent.classifications.length&&!intent.classifications.includes(event.classification))continue;
  if(intent.kind==='NPT'&&event.classification!=='NPT')continue;
  if(intent.kind==='ILT'&&!((item.report.insights.find(i=>i.eventId===event.id)?.iltMinutes??0)>0))continue;
  // Whole contained intervals only. Never prorate a source interval without measurements.
  if(intent.startMinute!==null&&event.startMinute<intent.startMinute)continue;
  if(intent.endMinute!==null&&event.endMinute>intent.endMinute)continue;
  const score=textScore(event,intent.terms);
  if(intent.terms.length&&['LOOKUP','EVIDENCE'].includes(intent.kind)&&score===0)continue;
  candidates.push({item,event,score});
 }
 candidates.sort((a,b)=>intent.ranking==='LONGEST'?(b.event.endMinute-b.event.startMinute)-(a.event.endMinute-a.event.startMinute)||a.event.startMinute-b.event.startMinute:intent.ranking==='CHRONOLOGICAL'?a.event.startMinute-b.event.startMinute:b.score-a.score||a.event.startMinute-b.event.startMinute);
 const matchedEventCount=candidates.length;const ranked=candidates.slice(0,20);const citations:Citation[]=ranked.map(({item,event},index)=>({id:'E'+(index+1),reportId:item.id,eventId:event.id,wellName:item.report.wellName,reportDate:item.report.reportDate,label:event.activity+' '+String(event.startMinute)+'-'+String(event.endMinute)+' min',fileName:event.evidence.fileName,page:event.evidence.page,row:event.evidence.row??null,sheet:event.evidence.sheet??null,snippet:event.evidence.snippet,kind:'EVENT',confidence:event.confidence}));
 if(!focus&&ranked.length===1)focus={reportId:ranked[0].item.id,eventId:ranked[0].event.id};
 if(!focus&&intent.ranking==='LONGEST'&&ranked.length){const top=ranked[0],duration=top.event.endMinute-top.event.startMinute;const tied=candidates.filter(c=>c.event.endMinute-c.event.startMinute===duration);if(tied.length===1)focus={reportId:top.item.id,eventId:top.event.id};else warnings.push('Multiple events tie for longest duration; no single follow-up event was selected.');}
 if(eligible&&matchedEventCount===0&&intent.kind!=='TERM')summary=intent.kind==='NPT'?'No interval is classified NPT in the selected records and filters. This does not prove there were no operational losses.':intent.kind==='ILT'?'No positive drilling ILT is supported under the current assumptions. Unknown or ineligible time is not evidence of zero loss.':summary.startsWith('There is')?summary:'No matching event evidence was found in the selected scope. No event or cause was invented.';
 for(const item of scope){
  for(const warning of item.report.warnings){if(/discrep|conflict|header.*timeline/i.test(warning)&&citations.length<28)citations.push({id:'W'+(citations.length+1),reportId:item.id,eventId:null,wellName:item.report.wellName,reportDate:item.report.reportDate,label:'Source review warning',fileName:'Report review notes',page:null,row:null,sheet:null,snippet:warning,kind:'REVIEW_WARNING',confidence:'UNVERIFIED'});}
  warnings.push(...item.report.warnings);
  const missingDepths=item.report.events.filter(event=>event.startHoleDepthFt===null||event.endHoleDepthFt===null);
  if(missingDepths.length)warnings.push(item.id+': Missing depth endpoints in source events '+missingDepths.map(event=>event.id).join(', ')+'. They remain unknown.');
  const unknown=item.report.events.filter(event=>event.classification==='UNKNOWN');
  if(unknown.length)warnings.push(item.id+': UNKNOWN source classifications: '+unknown.map(event=>event.id).join(', ')+'.');
 }
 if(candidates.length>20)warnings.push('Only the highest-ranked twenty event excerpts were sent for explanation; calculations include every matched record listed in their details.');
 if(citations.some(c=>!c.snippet.trim()))warnings.push('Some retrieved events have no verifiable excerpt. An empty quote is not source evidence.');
 if(intent.startMinute!==null||intent.endMinute!==null)warnings.push('Time filters include whole source intervals contained in the requested window; intervals were not prorated.');
 warnings.push('Classifications and excerpts are extracted observations, not independently verified field measurements. Flat hole depth does not establish downtime or drill-string speed.');
 const calculations:Calculation[]=[];
 if(eligible&&intent.kind!=='TERM')for(const item of scope){
  const events=candidates.filter(c=>c.item.id===item.id).map(c=>c.event);const filtered=buildWellReport({...item.report,events},{scenario:item.report.scenario,sourceKind:item.report.sourceKind});
  const drilling=buildWellReport({...item.report,events:events.filter(e=>e.activity==='DRILLING')},{scenario:item.report.scenario});
  const longestEvent=[...events].sort((a,b)=>(b.endMinute-b.startMinute)-(a.endMinute-a.startMinute))[0];
  const values:[string,number|null,string,string][]=[['Observed interval time',filtered.metrics.observedMinutes,'min','Sum of validated, nonoverlapping matched intervals.'],['Classified NPT',filtered.metrics.nptMinutes,'min','NPT classifications from matched source records.'],['Drilling interval time',drilling.metrics.observedMinutes,'min','Validated matched DRILLING intervals, without reconciling source header totals.'],['Drilling ILT scenario',filtered.metrics.iltEligibleMinutes?filtered.metrics.iltMinutes:null,'min','computeILTMinutes via buildWellReport; unsupported benchmark time remains unavailable.'],['Modeled time exposure',filtered.metrics.estimatedLossUsd,'USD','Matched NPT plus eligible drilling ILT, multiplied by scenario daily rig rate / 1440. Not realized savings.'],['Modeled excess carbon',filtered.metrics.modeledExcessCo2Tons,'t CO2','Explicit incremental fuel and emissions assumptions; null means unknown.']];
  if(intent.ranking==='LONGEST'&&longestEvent){
   const longest=buildWellReport({...item.report,events:[longestEvent]},{scenario:item.report.scenario});
   values.unshift(['Longest matched interval',longest.metrics.observedMinutes,'min','Maximum duration among matched intervals; value recalculated from the listed source record. This is separate from total classified NPT.']);
  }
  if(intent.kind==='AGGREGATE')for(const activity of [...new Set(events.map(event=>event.activity))]){
   const grouped=buildWellReport({...item.report,events:events.filter(event=>event.activity===activity)},{scenario:item.report.scenario});
   values.push(['Activity duration: '+activity,grouped.metrics.observedMinutes,'min','Sum of matched validated intervals for this activity, via buildWellReport.']);
  }
  values.sort((a,b)=>a[0].startsWith('Activity')&&b[0].startsWith('Activity')?(b[1]??0)-(a[1]??0):0);
  for(const[metric,value,unit,basis]of values)calculations.push({id:'C'+(calculations.length+1),reportId:item.id,wellName:item.report.wellName,reportDate:item.report.reportDate,metric,value,unit,basis,filters:['Analysis: '+intent.kind.toLowerCase(),'Activities: '+(intent.activities.length?intent.activities.map(a=>a.toLowerCase().replaceAll('_',' ')).join(', '):'all'),'Classifications: '+(intent.classifications.length?intent.classifications.map(c=>c.toLowerCase()).join(', '):intent.kind==='NPT'?'NPT only':intent.kind==='ILT'?'positive supported drilling ILT':'all'),'Source terms: '+(intent.terms.join(', ')||'none'),'Whole-interval window: '+(intent.startMinute??0)+'-'+(intent.endMinute??1440)+' minutes','Timeline relation: '+intent.relative.toLowerCase()].join('; '),eventIds:events.filter(e=>metric==='Longest matched interval'?e.id===longestEvent?.id:!metric.startsWith('Activity duration: ')||e.activity===metric.slice('Activity duration: '.length)).map(e=>e.id),citationIds:citations.filter(c=>c.reportId===item.id&&(metric==='Longest matched interval'?c.eventId===longestEvent?.id:!metric.startsWith('Activity duration: ')||events.some(e=>e.id===c.eventId&&e.activity===metric.slice('Activity duration: '.length)))).map(c=>c.id),assumptions:item.report.scenario,warnings:filtered.warnings.length>12?[...filtered.warnings.slice(0,11),'Additional quality warnings remain in the selected report; inspect the original analysis.']:filtered.warnings});
 }
 return {intent,scope,citations,calculations,warnings:[...new Set(warnings)].slice(0,80),focus,matchedEventCount,retrievalTruncated:candidates.length>20,summary,glossary};
}
