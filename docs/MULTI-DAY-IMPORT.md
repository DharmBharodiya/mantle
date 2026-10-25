# Multi-day PDF import recovery

## Diagnosis

The old pipeline deliberately accepted one report day. PDF preprocessing created fixed, non-overlapping sections of up to two pages. Each Gemini section returned one primary reportDate plus a list of report-day labels, but individual events had no report date. Two distinct days within one section therefore could not safely be separated after extraction. The guard rejected the section before merging events or computing analytics. Separate sections with different days were also rejected before analytics.

Identical repeated headers are deduplicated by date. They do not trigger this guard. Conflicting primary/report-day labels can trigger the same error; a model's list of dates does not independently prove that a document is multi-day. Print/spud/historical dates remain excluded by the extraction prompt.

For request **4c2864ff-fec9-4a96-a44b-51087de901fb**, the old server console showed successful generation followed by MULTI_DAY_REPORT at 15,923 ms, not a provider-busy failure. The existing homepage accessibility tree showed the same request error beside attached **2021-06-28-and-29-operations.pdf**; the user confirmed that filename. The repository's attributed fixture contains June 28 and June 29 operations pages (original FORGE PDF pages 4 and 7), placed together in a two-page upload/one extraction section. This source is legitimately multi-day, and the old single-day rejection was expected. Its missing recovery path was the application problem.

The original request did not retain its returned date array or input checksum. Exact model assignments cannot be reconstructed, and the original uploaded bytes were not recovered. See docs/qa/report-day-diagnosis.json for observed evidence and limitations.

## Implemented workflow

1. Upload normally. Single-day behavior is unchanged. Before events are combined, multiple/conflicting dates yield a terminal error with detected date candidates and the original page positions in the rejected section. If different days occur across completed sections, their dates/pages are returned before merge.
2. The homepage and console retain the original File in memory during recovery. They present **Choose one report day** with no default date, no default pages and no checked confirmation. Candidate dates are not labeled verified.
3. Open the source PDF and check its report-day headers. Explicitly choose a detected date, enter its contiguous original PDF page range, and confirm that all those pages belong to that report day. The user supplies source-reviewed boundaries; Mantle does not infer them from adjacency or silently select a date. Changing the date or pages clears confirmation.
4. Analyze selected day resubmits the same original file with explicit selection metadata. The server copies only those pages into extraction sections while preserving their original PDF page numbers and the original filename. It does not edit the original File or a stored source document.
5. Every selected extraction section must independently identify exactly the chosen date. Missing dates, another day, conflicting labels or unresolved ambiguity reject before analytics. The user-selected date never overwrites model observations. Existing overlap, duplicate, well-identity, timeline and source validation remain in place.
6. Only then does the existing single-day merge/analytics engine run. A successful result adds an independent selected-day report. Source status remains PUBLIC_SOURCE_UNREVIEWED; source review of page boundaries does not promote full evidence verification.

This is **assisted day/page selection**, not automatic PDF segmentation or a verified machine-generated day catalogue. The detected candidate list can be incomplete if processing stops at the first conflicting section. To process another day, upload the original again and explicitly select that day's reviewed pages. No unrelated days are combined into one 24-hour report.

## Try the two-day FORGE fixture

Use the rebuilt local app at http://127.0.0.1:3100. An already-open production tab may still have the old client; export any in-memory analysis before refreshing it.

1. Refresh to load the updated app, then attach demo-fixtures/public/forge-78b-32/2021-06-28-and-29-operations.pdf from homepage or console.
2. On the boundary error, choose **2021-06-28**, enter page **1**, check the source-review box and click Analyze selected day. This fixture page is original FORGE PDF page 4. Expect a single June 28 report with 17 events, 24.0 h coverage, ending MD 421 ft and zero extracted NPT.
3. The second fixture page is June 29 (original PDF page 7). Selecting **2021-06-29** and page **2** processes that day separately. This second-day path has fixture/mocked regression coverage; it was not live-compared to a manual June 29 transcription.
4. Leave both pages selected for either date and the guard must still reject. Conflicting dates on one physical page cannot be split safely here; provide an independently separated single-day PDF instead.

An initial boundary-detection upload and an explicit selected-day request are separate provider operations. Nothing automatically retries a busy provider outside the existing bounded policy. Stop waiting cancels the active request; failed/cancelled attempts preserve the current valid report. Homepage implicit Enter submission cannot retry the whole document while day selection is open.

## API additions

POST /api/ingest still accepts multipart file and keeps existing result contracts. It optionally accepts a **reportDay** JSON string:

~~~json
{"reportDate":"2021-06-28","pages":[1],"sourceReviewed":true}
~~~

Rules: PDF only; real ISO date; ascending, contiguous, nonempty page list; explicit sourceReviewed=true; pages must exist in the original document. The metadata is limited to 1,024 characters. Missing selection preserves the original single-day contract. Client input is not trusted to label extracted events: every selected section must agree before merge.

Recoverable MULTI_DAY_REPORT and REPORT_DAY_MISMATCH errors carry additive reportDays metadata:

~~~json
{"reportDates":["2021-06-28","2021-06-29"],"pages":[1,2],"basis":"SOURCE_REVIEW_REQUIRED"}
~~~

The pages describe the rejected extraction, not an automatically verified per-day range. JSON errors use non-2xx responses; NDJSON progress streams may be HTTP 200 with a terminal type=error/status=422 envelope. Import succeeds only on type=result, never a ready stage or partial section. The client retains request IDs and typed review metadata.

## Verification

- **208 tests in 22 files PASS**, including all existing single-day/date-boundary tests and 38 new regressions.
- TypeScript, ESLint and isolated production build PASS. Normal post-build generated-reference typecheck and QA-script lint PASS. Final logs: docs/qa/report-day-checks.json and report-day-{typecheck,tests,lint,build}.txt.
- **28 deterministic production HTTP assertions PASS**: existing 21 checks plus malformed/unconfirmed selections, duplicate pages, impossible dates, non-PDF selection, out-of-document ranges and retained source page cap. No provider calls in this suite. Evidence: docs/qa/report-day-http.json.
- **One actual selected-day HTTP/Gemini request PASS**: da58d6c5-22cb-4d79-b760-0c19bd4d8f23, 8,028 ms. The two-day public PDF was submitted with explicit June 28/page 1 selection. All 17 intervals, ending depths, original-page references and event snippets matched the independent original-source expectations. Only June 28 was analyzed; 1,440 observed minutes, 210 eligible drilling minutes, zero NPT, unverified provenance and the original 4.0 h versus 3.5 h discrepancy warning were retained. Evidence: docs/qa/report-day-live.json and report-day-live-comparison.json.
- All 17 **event** excerpts matched for this one selected-page run. The daily-total warning's model-extracted header phrase remains unverified; it joins a label/value and is not asserted to be a contiguous verified source quote. This does not establish broader PDF/OCR accuracy or close the previous three-page/appendix validation for every input.

New tests cover genuine multi-day structure with mocked provider observations, repeated headers, conflicting dates in one section, per-day independent processing, original-file integrity/page references, repeated extraction intervals, conflicting overlaps, missing dates/timestamps, null depths, invalid ranges, cancellation and preservation of the previous valid report. UI markup checks ensure no automatic selection, explicit confirmation, initially disabled analysis and an actionable fallback. They do not replace browser interaction testing.

Scripts: node scripts/verify-report-day-http.mjs performs deterministic checks against the running server. node scripts/verify-report-day-live.mjs makes **one real public Gemini request** and overwrites only its latest report-day live observations; do not invoke repeatedly on provider busy errors.

## Bounds and safe fallback

- The **entire source** still must fit 8 MB and 24 PDF pages, even when selecting a smaller subset. Existing chunk-size, concurrency, output, generation and total-request limits are unchanged. Larger documents must be exported/split into smaller source PDFs first.
- No independent PDF text/OCR verification layer was added. Date candidates are model-extracted, the user checks the original headers/pages, and the server checks extraction-date agreement. It cannot guarantee that Gemini never misses a report label.
- If dates are missing/conflicting, days share a page, ranges are noncontiguous or boundaries cannot be checked reliably, **export a readable single-day PDF and upload it**. A selected chunk without a date is rejected even if it is an appendix; it is never silently assigned the chosen day.
- Dates/measurements are never filled with invented values; null depths remain null. Exact repeated intervals count once; conflicting overlaps reject. Existing CSV/XLSX multi-day rejection is unchanged; page selection applies only to PDFs.
- The original document stays in the browser's memory while recovering, not localStorage or a new backend store. Cancel selection releases the recovery context; refreshing loses it. Failed imports do not replace the selected analysis.
- Interactive picker/mobile/keyboard layout still needs manual review. Browser accessibility text identified the old upload/error, but screenshots did not reliably match the target window, so no recovery interaction was claimed verified. No UI redesign, dependency, database, authentication, Photon or ElevenLabs changes were made. No push, merge or deployment was performed.
