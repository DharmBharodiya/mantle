/** Contract v1.1: canonical validated observations, scenarios and computed output. */
import { z } from "zod";
export const ActivitySchema = z.enum(["DRILLING", "TRIPPING_IN", "TRIPPING_OUT", "CIRCULATING", "CASING_CEMENTING", "BHA_CHANGE", "RIG_REPAIR", "STUCK_PIPE", "LOST_CIRCULATION", "WAITING", "OTHER"]);
export const ClassificationSchema = z.enum(["PRODUCTIVE", "NPT", "UNKNOWN"]);
export const ConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const SourceKindSchema = z.enum(["SYNTHETIC_DEMO", "PUBLIC_SOURCE_UNREVIEWED", "HUMAN_VERIFIED"]);
export const SourceEvidenceSchema = z.object({
    fileName: z.string().min(1).max(255), page: z.number().int().positive().nullable(),
    snippet: z.string().max(1200), row: z.number().int().positive().nullable().optional(), sheet: z.string().max(200).nullable().optional(),
});
export const DrillingEventSchema = z.object({
    id: z.string().min(1).max(100), startMinute: z.number().int().min(0).max(1439), endMinute: z.number().int().min(1).max(1440),
    activity: ActivitySchema, classification: ClassificationSchema,
    startHoleDepthFt: z.number().finite().nonnegative().nullable(), endHoleDepthFt: z.number().finite().nonnegative().nullable(),
    note: z.string().max(4000), explanation: z.string().max(4000), evidence: SourceEvidenceSchema, confidence: ConfidenceSchema,
});
export const ExtractionSchema = z.object({ wellName: z.string().max(250), reportDate: z.string().max(40), events: z.array(DrillingEventSchema).max(500), warnings: z.array(z.string().max(2000)).max(2000) });
export const ScenarioSchema = z.object({
    rigDailyUsd: z.number().finite().min(0).max(10000000).default(120000),
    tripBenchmarkFtPerHour: z.number().finite().positive().max(100000).default(800),
    drillBenchmarkFtPerHour: z.number().finite().positive().max(100000).default(35),
    excessFuelGallonsPerHour: z.number().finite().min(0).max(10000).nullable().default(null),
    kgCo2PerGallon: z.number().finite().positive().max(100).default(10.18),
});
const nonnegative = z.number().finite().nonnegative();
export const EventInsightSchema = z.object({ eventId: z.string(), nptMinutes: nonnegative, iltMinutes: nonnegative.nullable(), avoidableCostUsd: nonnegative, category: z.enum(["NPT", "ILT", "NORMAL", "UNCERTAIN"]) });
export const ReportMetricsSchema = z.object({
    observedMinutes: nonnegative, classifiedMinutes: nonnegative, productiveMinutes: nonnegative, nptMinutes: nonnegative, iltMinutes: nonnegative,
    efficiencyPct: z.number().finite().min(0).max(100).nullable(), estimatedLossUsd: nonnegative, estimatedNptCostUsd: nonnegative, estimatedIltOpportunityUsd: nonnegative,
    modeledExcessFuelGallons: nonnegative.nullable(), modeledExcessCo2Tons: nonnegative.nullable(),
    unknownMinutes: nonnegative.default(0), unobservedMinutes: nonnegative.default(0), coveragePct: nonnegative.max(100).default(0),
    iltEligibleMinutes: nonnegative.default(0), benchmarkCoveragePct: nonnegative.max(100).default(0),
});
export const DepthPointSchema = z.object({ minute: z.number().int().min(0).max(1440), holeDepthFt: nonnegative, eventId: z.string(), classification: ClassificationSchema });
export const WellTelemetryReportSchema = ExtractionSchema.extend({ sourceKind: SourceKindSchema, scenario: ScenarioSchema, metrics: ReportMetricsSchema, insights: z.array(EventInsightSchema), depthCurve: z.array(DepthPointSchema), generatedAt: z.string().datetime() });
export type Activity = z.infer<typeof ActivitySchema>;
export type Classification = z.infer<typeof ClassificationSchema>;
export type DrillingEvent = z.infer<typeof DrillingEventSchema>;
export type Extraction = z.infer<typeof ExtractionSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type EventInsight = z.infer<typeof EventInsightSchema>;
export type ReportMetrics = z.infer<typeof ReportMetricsSchema>;
export type DepthPoint = z.infer<typeof DepthPointSchema>;
export type WellTelemetryReport = z.infer<typeof WellTelemetryReportSchema>;
