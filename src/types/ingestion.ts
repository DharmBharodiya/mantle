import { z } from "zod";
import { WellTelemetryReportSchema } from "./telemetry";
export const IngestionStageSchema = z.enum(["preparing", "extracting", "validating", "computing", "ready"]);
export type IngestionStage = z.infer<typeof IngestionStageSchema>;
export const INGESTION_STAGE_LABELS: Record<IngestionStage, string> = {
    preparing: "Preparing report", extracting: "Extracting activities", validating: "Validating events", computing: "Computing analytics", ready: "Report ready",
};
export const IngestionMessageSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("stage"), stage: IngestionStageSchema, requestId: z.string(), elapsedMs: z.number().nonnegative(), completedChunks: z.number().int().nonnegative().optional(), totalChunks: z.number().int().positive().optional() }),
    z.object({ type: z.literal("result"), requestId: z.string(), report: WellTelemetryReportSchema }),
    z.object({ type: z.literal("error"), requestId: z.string(), error: z.string(), code: z.string(), status: z.number().int() }),
]);
export type IngestionMessage = z.infer<typeof IngestionMessageSchema>;
