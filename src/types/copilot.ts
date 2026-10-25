import { z } from "zod";
import { ActivitySchema, ClassificationSchema, ExtractionSchema, ScenarioSchema, SourceKindSchema } from "./telemetry";
export const COPILOT_MAX_BODY = 1024 * 1024;
export const ScopeReportSchema = z.object({id:z.string().min(1).max(100),extraction:ExtractionSchema,scenario:ScenarioSchema,sourceKind:SourceKindSchema}).strict();
export const FocusSchema = z.object({reportId:z.string().min(1).max(100),eventId:z.string().min(1).max(100)}).strict();
export const CopilotRequestSchema = z.object({
 question:z.string().trim().min(1).max(1200),
 reports:z.array(ScopeReportSchema).min(1).max(4),
 history:z.array(z.object({question:z.string().max(1200),focus:FocusSchema.nullable()}).strict()).max(6).default([]),
}).strict().superRefine((value,ctx)=>{
 if(new Set(value.reports.map(r=>r.id)).size!==value.reports.length)ctx.addIssue({code:'custom',message:'Duplicate report scope'});
 if(value.reports.reduce((sum,r)=>sum+r.extraction.events.length,0)>1000)ctx.addIssue({code:'custom',message:'Select at most 1,000 events'});
 if(value.reports.some(r=>!r.extraction.events.length))ctx.addIssue({code:'custom',message:'Reports require source events'});
});
export type CopilotRequest = z.infer<typeof CopilotRequestSchema>;
export const IntentKindSchema = z.enum(['LOOKUP','AGGREGATE','NPT','ILT','TIMELINE','COMPARE','SUMMARY','EVIDENCE','MISSING','TERM','UNSUPPORTED','CLARIFY']);
export const IntentSchema = z.object({
 kind:IntentKindSchema,reportIds:z.array(z.string().max(100)).max(4),
 activities:z.array(ActivitySchema).max(11),classifications:z.array(ClassificationSchema).max(3),
 terms:z.array(z.string().trim().min(1).max(60)).max(8),
 relative:z.enum(['NONE','PREVIOUS','NEXT']),ranking:z.enum(['RELEVANCE','LONGEST','CHRONOLOGICAL']),
 startMinute:z.number().int().min(0).max(1439).nullable(),endMinute:z.number().int().min(1).max(1440).nullable(),
}).strict();
export type QueryIntent=z.infer<typeof IntentSchema>;
export type Focus=z.infer<typeof FocusSchema>;
export const CitationSchema=z.object({id:z.string(),reportId:z.string(),eventId:z.string().nullable(),wellName:z.string(),reportDate:z.string(),label:z.string(),fileName:z.string(),page:z.number().int().positive().nullable(),row:z.number().int().positive().nullable(),sheet:z.string().nullable(),snippet:z.string(),kind:z.enum(['EVENT','REVIEW_WARNING']),confidence:z.string()});
export const CalculationSchema=z.object({id:z.string(),reportId:z.string(),wellName:z.string(),reportDate:z.string(),metric:z.string(),value:z.number().finite().nullable(),unit:z.string(),basis:z.string(),filters:z.string(),eventIds:z.array(z.string()),citationIds:z.array(z.string()),assumptions:ScenarioSchema,warnings:z.array(z.string())});
export const AnswerStatementSchema=z.object({kind:z.enum(['EXPLANATION','INVESTIGATION','UNCERTAINTY']),text:z.string().min(1).max(800),citationIds:z.array(z.string()).max(12),calculationIds:z.array(z.string()).max(12)}).strict();
export const CopilotResponseSchema=z.object({
 requestId:z.string(),mode:z.enum(['GROQ','DETERMINISTIC']),providerNotice:z.string().nullable(),intent:IntentSchema,
 scope:z.array(z.object({id:z.string(),wellName:z.string(),reportDate:z.string(),sourceKind:SourceKindSchema})),
 summary:z.string(),statements:z.array(AnswerStatementSchema).max(6),citations:z.array(CitationSchema).max(32),calculations:z.array(CalculationSchema).max(80),
 warnings:z.array(z.string()).max(80),focus:FocusSchema.nullable(),matchedEventCount:z.number().int().nonnegative(),retrievalTruncated:z.boolean(),
});
export type CopilotResponse=z.infer<typeof CopilotResponseSchema>;
export type Citation=z.infer<typeof CitationSchema>;
export type Calculation=z.infer<typeof CalculationSchema>;
