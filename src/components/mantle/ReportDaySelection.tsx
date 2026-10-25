"use client";
import { useId, useState } from "react";
import { parseReportPages, ReportDaySelectionSchema, type ReportDayReview, type ReportDaySelection as Selection } from "@/types/report-day";

/** User-reviewed source boundaries; detected labels alone never authorize an import. */
export function ReportDaySelection({review, fileName, requestId, busy, onAnalyze, onDismiss}: {
  review: ReportDayReview; fileName: string; requestId?: string; busy: boolean;
  onAnalyze: (selection: Selection) => void | Promise<void>; onDismiss: () => void;
}) {
  const id = useId();
  const [date, setDate] = useState("");
  const [range, setRange] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const pages = parseReportPages(range);
  const selection = ReportDaySelectionSchema.safeParse({reportDate: date, pages, sourceReviewed: confirmed});
  const dates = [...new Set(review.reportDates)].sort();
  const inputClass = "min-h-11 w-full rounded-chip border border-m-line bg-m-ink-2 px-3 text-sm text-steam";
  return <section aria-labelledby={id + "-title"} className="m-panel my-4 min-w-0">
    <h2 id={id + "-title"} className="text-lg font-medium">Choose one report day</h2>
    <p className="mt-3 break-words text-sm text-steam-3">{fileName} is still available in this tab. Date labels alone cannot establish the page boundaries. Check the original PDF before continuing.</p>
    <p className="mt-2 text-sm text-steam-3">{review.pages.length ? "Rejected extraction referenced original PDF pages " + review.pages.join(", ") + ". Other pages may not have been inspected." : "Page boundaries could not be identified."}</p>
    {!dates.length && <p className="mt-3 text-sm text-npt-ink">No date was identified reliably. Export a single-day PDF with a readable report-date header and upload it instead.</p>}
    <fieldset disabled={busy} className="mt-4 min-w-0 space-y-4">
      <label htmlFor={id + "-date"} className="block text-sm text-steam-2">Detected date to check against the source
        <select id={id + "-date"} value={date} onChange={e => {setDate(e.target.value);setConfirmed(false);}} className={inputClass + " mt-2"}>
          <option value="">Select a report day</option>{dates.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label htmlFor={id + "-pages"} className="block text-sm text-steam-2">Original PDF page or page range
        <input id={id + "-pages"} value={range} onChange={e => {setRange(e.target.value);setConfirmed(false);}} placeholder="For example: 4-6" aria-describedby={id + "-help"} className={inputClass + " mt-2"}/>
      </label>
      <p id={id + "-help"} className="text-sm text-steam-3">Use PDF page positions, not printed page labels. Include only contiguous pages for this date. The source must still fit the 24-page and 8 MB limits. If headers conflict or boundaries are unclear, upload a single-day PDF.</p>
      <label className="flex min-h-11 items-start gap-3 text-sm text-steam-2"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 size-5 shrink-0"/>I checked the original headers and all chosen pages belong to this report day.</label>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="m-btn-primary" disabled={busy || !selection.success} onClick={() => {if (selection.success) void onAnalyze(selection.data);}}>Analyze selected day</button>
        <button type="button" className="m-btn-ghost" onClick={onDismiss}>Cancel day selection</button>
      </div>
    </fieldset>
    {requestId && <p className="mt-3 break-all font-mono text-xs text-steam-4">Request {requestId}</p>}
  </section>;
}
