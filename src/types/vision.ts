import { z } from "zod";
export const VisionObservationsSchema = z.object({
  equipmentDescription: z.string().min(1).max(1000),
  imageQuality: z.enum(["ADEQUATE", "LIMITED", "UNUSABLE"]),
  observations: z.array(z.object({ region: z.string().max(200), observation: z.string().max(1000), confidence: z.enum(["HIGH", "MEDIUM", "LOW"]) })).max(12),
  limitations: z.array(z.string().max(1000)).min(1).max(12),
});
export const VisionResultSchema = VisionObservationsSchema.extend({ sourceFileName: z.string().max(255), status: z.literal("UNVERIFIED_VISUAL_OBSERVATIONS"), generatedAt: z.string().datetime() });
export type VisionResult = z.infer<typeof VisionResultSchema>;
