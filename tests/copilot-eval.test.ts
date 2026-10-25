import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {CopilotRequestSchema} from '@/types/copilot';
import {canonicalScope,fallbackIntent,retrieve} from '@/lib/copilot/retrieve';
const fixture=JSON.parse(readFileSync('tests/fixtures/copilot-forge-eval.json','utf8')) as {cases:{id:string;question:string;kind:string;scenario?:Record<string,number>;reviewAnnotation?:string;metric?:string;activityMetric?:string;expectedValue?:number|null;expectedDefinition?:string;expectedEvents?:number}[]};
const raw=JSON.parse(readFileSync('demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json','utf8')).report;
describe('FORGE evaluation set (offline evidence and deterministic metrics, not live model scoring)',()=>{
 for(const item of fixture.cases)it(item.id,()=>{const report=structuredClone(raw);if(item.reviewAnnotation)report.warnings.push(item.reviewAnnotation);const input=CopilotRequestSchema.parse({question:item.question,reports:[{id:'forge',extraction:report,scenario:{...report.scenario,...item.scenario},sourceKind:report.sourceKind}]});const scope=canonicalScope(input);const result=retrieve(item.question,fallbackIntent(item.question,scope),scope,[]);expect(result.intent.kind).toBe(item.kind);if(item.metric||item.activityMetric){const calc=result.calculations.find(c=>c.metric===(item.metric||item.activityMetric));expect(calc).toBeDefined();if(item.expectedValue===null)expect(calc!.value).toBeNull();else expect(calc!.value).toBeCloseTo(item.expectedValue!);}if(item.expectedEvents)expect(result.matchedEventCount).toBe(item.expectedEvents);if(item.expectedDefinition)expect(result.glossary.join(' ')).toContain(item.expectedDefinition);if(item.reviewAnnotation)expect(result.citations.some(c=>c.kind==='REVIEW_WARNING')).toBe(true);});
});
