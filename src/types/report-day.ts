import { z } from "zod";
export const ReportDayDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, "Invalid report date");
export const ReportDaySelectionSchema = z.object({
  reportDate: ReportDayDateSchema,
  pages: z.array(z.number().int().min(1).max(24)).min(1).max(24).refine(pages => pages.every((page, index) => index === 0 || page === pages[index - 1] + 1), "Use one ascending contiguous page range"),
  sourceReviewed: z.literal(true),
});
export type ReportDaySelection = z.infer<typeof ReportDaySelectionSchema>;
export const ReportDayReviewSchema = z.object({
  reportDates: z.array(ReportDayDateSchema).max(25),
  pages: z.array(z.number().int().min(1).max(24)).max(24),
  basis: z.literal("SOURCE_REVIEW_REQUIRED"),
});
export type ReportDayReview = z.infer<typeof ReportDayReviewSchema>;
export class ReportDayReviewError extends Error {
  constructor(message: string, public review: ReportDayReview, public requestId?: string) { super(message); this.name = "ReportDayReviewError"; }
}
export function readReportDayError(value: {error?: unknown; code?: unknown; requestId?: unknown; reportDays?: unknown}): ReportDayReviewError | null {
  if (!["MULTI_DAY_REPORT", "REPORT_DAY_MISMATCH"].includes(String(value.code))) return null;
  const parsed = ReportDayReviewSchema.safeParse(value.reportDays);
  if (!parsed.success) return null;
  return new ReportDayReviewError(typeof value.error === "string" ? value.error : "Report-day boundaries require source review.", parsed.data, typeof value.requestId === "string" ? value.requestId : undefined);
}
export function parseReportPages(value: string): number[] | null {
  const match = value.trim().match(/^(\d{1,2})(?:\s*-\s*(\d{1,2}))?$/);
  if (!match) return null;
  const start = Number(match[1]), end = Number(match[2] ?? match[1]);
  if (start < 1 || end < start || end > 24) return null;
  return Array.from({length: end - start + 1}, (_, index) => start + index);
}
