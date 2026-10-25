import { ServiceError } from "@/lib/server/errors";
import type { ReportDayReview } from "@/types/report-day";
export class ReportDayBoundaryError extends ServiceError {
  readonly reportDays: ReportDayReview;
  constructor(message: string, dates: string[], pages: number[], code = "MULTI_DAY_REPORT") {
    super(message, 422, code);
    this.reportDays = {reportDates: [...new Set(dates)].sort(), pages: [...new Set(pages)].sort((a,b) => a-b), basis: "SOURCE_REVIEW_REQUIRED"};
  }
}
export function reportDayDetails(error: unknown): {reportDays?: ReportDayReview} {
  return error instanceof ReportDayBoundaryError ? {reportDays: error.reportDays} : {};
}
