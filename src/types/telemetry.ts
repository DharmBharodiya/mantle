/** CONTRACT v1.0 -- NO ROLE MAY CHANGE WITHOUT APPROVED CONTRACT CHANGE PR. */
import { z } from "zod";

export const ActivitySchema = z.enum([
  "DRILLING", "TRIPPING_IN", "TRIPPING_OUT", "CIRCULATING",
  "CASING_CEMENTING", "BHA_CHANGE", "RIG_REPAIR", "STUCK_PIPE",
  "LOST_CIRCULATION", "WAITING", "OTHER"
]);
export const ClassificationSchema = z.enum(["PRODUCTIVE", "NPT", "UNKNOWN"]);
export const ConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const SourceEvidenceSchema = z.object({
  fileName: z.string().min(1),
  page: z.number().int().positive().nullable(),
  snippet: z.string(),
});
export const DrillingEventSchema = z.object({
  id: z.string().min(1),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  activity: ActivitySchema,
  classification: ClassificationSchema,
  startHoleDepthFt: z.number().nonnegative().nullable(),
  endHoleDepthFt: z.number().nonnegative().nullable(),
  note: z.string(),
  explanation: z.string(),
  evidence: SourceEvidenceSchema,
  confidence: ConfidenceSchema,
});
export const ExtractionSchema = z.object({
  wellName: z.string(),
  reportDate: z.string(), // YYYY-MM-DD, as printed; do not invent a date
  events: z.array(DrillingEventSchema),
  warnings: z.array(z.string()),
});
export type DrillingEvent = z.infer<typeof DrillingEventSchema>;
export type Extraction = z.infer<typeof ExtractionSchema>;
export type Classification = z.infer<typeof ClassificationSchema>;
export type Activity = z.infer<typeof ActivitySchema>;

export const ScenarioSchema = z.object({
  rigDailyUsd: z.number().nonnegative().default(120_000),
  tripBenchmarkFtPerHour: z.number().positive().default(800),
  drillBenchmarkFtPerHour: z.number().positive().default(35),
  // DIFFERENTIAL gallons/hr vs the best feasible operating condition.
  // A scenario assumption, not a measured emission.
  excessFuelGallonsPerHour: z.number().nonnegative().nullable().default(null),
  kgCo2PerGallon: z.number().positive().default(10.18),
});
export type Scenario = z.infer<typeof ScenarioSchema>;
export type EventInsight = {
  eventId: string;
  nptMinutes: number;
  iltMinutes: number | null; // null = no justifiable benchmark
  avoidableCostUsd: number; // scenario, not audited actual expense
  category: "NPT" | "ILT" | "NORMAL" | "UNCERTAIN";
};
export type ReportMetrics = {
  observedMinutes: number;
  classifiedMinutes: number;
  productiveMinutes: number;
  nptMinutes: number;
  iltMinutes: number;
  efficiencyPct: number | null;
  estimatedLossUsd: number;
  estimatedNptCostUsd: number;
  estimatedIltOpportunityUsd: number;
  modeledExcessFuelGallons: number | null;
  modeledExcessCo2Tons: number | null;
};
export type DepthPoint = {
  minute: number;
  holeDepthFt: number;
  eventId: string;
  classification: Classification;
};
export type WellTelemetryReport = Extraction & {
  sourceKind: "SYNTHETIC_DEMO" | "PUBLIC_SOURCE_UNREVIEWED" | "HUMAN_VERIFIED";
  scenario: Scenario;
  metrics: ReportMetrics;
  insights: EventInsight[];
  depthCurve: DepthPoint[];
  generatedAt: string;
};
