# Final backend validation

Verified 24 October 2026 local time (25 October UTC). Scope: backend correctness, preserving the Mantle UI, shared telemetry/API contracts and existing dependencies. No push, merge, deployment, Photon or ElevenLabs work was performed.

## Result

- TypeScript, ESLint, production build and **168 tests in 19 files pass** (baseline: 124). Normal generated-reference TypeScript recheck also passes.
- **21 production HTTP assertions pass** against the final isolated build, with no provider calls in those assertions.
- Genuine three-page FORGE extraction matched **17/17 timestamps, derived durations and ending hole depths**, 1,440 observed minutes, 210 drilling minutes and zero NPT minutes. It surfaced the original **4.0 h header versus 3.5 h timeline** conflict without changing observations.
- Genuine adjacent-day PDF returned **MULTI_DAY_REPORT**, with no report/result envelope.
- **The new multi-page evidence comparison is not fully passing.** One of the latest live response's 17 evidence snippets contains an invented omission marker. The strict verifier reports FAIL. Final code withholds abbreviated PDF quotes and marks the event LOW confidence. This correction is tested against the observed response but was **not rerun live**. Other plausible but inaccurate PDF quotes still require human review.

## Defects fixed

| Area | Correction | Regression coverage |
|---|---|---|
| Parallel section errors | Preserve the first actual worker failure instead of an earlier-index sibling cancellation; stop queued sections even for falsy thrown errors | tests/chunk-failure.test.ts |
| Date boundaries | Private model response lists all report-day labels; validate real ISO dates and reject multiple/conflicting days within or across sections. Missing dates remain missing with warnings | tests/final-multipage.test.ts; tests/final-missing-values.test.ts |
| Conflicting summaries | Compare explicitly stated daily drilling totals against the whole merged/deduplicated DRILLING timeline. Warn with both values, filename/page and excerpt, without rewriting observations | FORGE and appendix regressions; live warning |
| Missing evidence | Whitespace-only quotes become empty with LOW confidence and a review warning. Unsupported text excerpts and false row references are removed | tests/final-missing-values.test.ts |
| Duplicate confidence | Exact repeated intervals retain the lowest confidence and an available supported quote; conflicting overlaps still reject | Missing-value and existing overlap tests |
| Missing measurements | Reject absent/null timestamps, missing required fields, invalid activities, negative depths and incomplete/overnight intervals; retain explicit null depths and UNKNOWN classification | tests/final-missing-values.test.ts |
| Structured response errors | Return bounded field paths/codes without reflecting rejected values; constrain provider report-date labels to ISO format | Missing-value and multi-page tests |
| Abbreviated PDF quotes | Withhold ASCII/Unicode omission-marker snippets, lower confidence and retain the returned text explicitly labeled unverified in a review warning; measurements unchanged | Actual observed interval-14 regression |

Summary comparison is a discrepancy indicator with a one-minute tolerance, not reconciliation or proof that source aggregates and timelines use identical definitions. Text summary excerpts must occur in the source. PDF summaries remain model-extracted and unverified. The prompt distinguishes daily Hole Made (ft) / Hrs totals from per-run hours and prohibits stitched quotes.

## Real source and inputs

Source: John McLennan / Energy & Geoscience Institute, University of Utah, [Utah FORGE Well 78B-32 daily drilling reports](https://gdr.openei.org/files/1330/78B-32-DailyDrillingReports-6-27thru7-31.pdf), DOI 10.15121/1814488. [Dataset catalogue](https://catalog.data.gov/dataset/utah-forge-well-78b-32-daily-drilling-reports-and-logs), CC BY 4.0. Excerpts copy unchanged page content from the previously downloaded checksum-verified original. No measurements were reauthored.

| Input | Original PDF pages | Uploaded pages | SHA-256 |
|---|---|---|---|
| Complete original | 1-93 | Not uploaded this sprint | e1424b3a73dc878a09e23698a03f3f40bf59e5817bc7847af0c58d1cf384964f |
| 2021-06-28-full-day.pdf | 4, 5, 6 | 1, 2, 3; two sections | 775206c4bf99a400146a7ec4ab30e284d2228a889373d075ff193cdd7131762d |
| 2021-06-28-and-29-operations.pdf | 4, 7 | 1, 2; one section | 0e4e0b8dabe3c50743386e43de4ce103fa8fdc43545e373b03895a29bdbce9a8 |

Both excerpts are in demo-fixtures/public/forge-78b-32/. Response pages refer to the **uploaded excerpt**; page 1 corresponds to original page 4. Mapping back to uploaded page positions, including page 3, is regression-tested. Mapping alone does not verify the model's page claim.

Comparison uses the existing manually transcribed operations table in 2021-06-28-expected.json. A transcription encoding artifact in its final row was corrected: original typographic inch marks had become question marks. Original PDFs and raw model observations were unchanged. This repaired one false mismatch, independently of the genuine abbreviated-quote mismatch.

## Actual live observations

The configured model was gemini-3.1-flash-lite. These were actual HTTP/Gemini calls using the authorized server key and public documents. Elapsed times include the client HTTP workflow. Streaming HTTP 200 accepts a progress stream; import succeeds only on a terminal result envelope.

| Request ID | Input / stage | Elapsed | Observed result |
|---|---|---:|---|
| f0f69052-d682-416d-aa35-4eee97be0d10 | Initial full day | 4,298 ms | INVALID_EXTRACTION, no report |
| eb950fe3-a29c-444c-844a-cb30354ee43e | Initial adjacent days | 16,232 ms | INVALID_EXTRACTION, no report |
| 517102a6-e09f-4046-a669-613b7c44283e | Full day after date-schema/diagnostic changes | 13,387 ms | 17 intervals/depths matched; strict comparison failed: missing header summary and transcription-encoding mismatch |
| d14710d2-b01f-4947-bd66-2b136e83b02f | Adjacent days after same changes | 17,511 ms | MULTI_DAY_REPORT, terminal 422, no result: PASS |
| fc3b8ba0-3456-4821-9575-bd6dddf19e5e | Full day after explicit Hole Made / Hrs prompt | 12,520 ms | 17 intervals/depths matched; discrepancy warning present; 16/17 verbatim quotes matched: strict evidence FAIL |

The first two errors lacked field-level diagnostics; their exact failing fields cannot be reconstructed. Later valid responses do not establish their precise cause.

The latest interval 14 (14:30-16:00, ending MD 421 ft) returned:

> 14:30 16:00 1.50 421 5-99 Pressure test to 1500 psi, Pump 20 bbl fresh water...

The omission marker is absent from the original operations text. Final code suppresses this quote and lowers confidence. The latest live daily-summary excerpt also joined a header label and its value; its 4.0-hour number is source-supported, but that phrase is not a verified contiguous quote. Final prompting requests only the printed numeric pair; this added instruction has no subsequent live verification.

Raw responses, failures and unchanged model text: docs/qa/final-backend-live-initial.json, final-backend-live.json and final-backend-single-day.json. Their comparison JSON files retain actual failures. final-backend-real.snapshot.json is an **unreviewed diagnostic response containing the observed defect**, not a replacement demo backup.

### Repeat checks

- node scripts/verify-final-backend.mjs: offline comparison of saved two-case observations; no provider call. The older full-day case still lacks its header warning; adjacent-day rejection passes.
- node scripts/verify-final-backend.mjs --single-day: latest saved day only; **exits 1 for Excerpt mismatch at interval 14**. Do not weaken this gate to claim success.
- Adding --live uploads attributed public fixtures and overwrites this script's latest diagnostic evidence. It incurs provider usage. No live call followed the final evidence correction.
- node scripts/validate-forge.mjs: the earlier one-page recorded response remains a separate passing offline comparison, not validation of the new multi-page run.

## Bounded reliability

No deadlines were increased. Existing bounds: 8 MB upload; 24 PDF pages; two pages per normal PDF section; 4 MB maximum split section; two concurrent section workers; 8,192 requested output tokens; two generation attempts maximum; 45-second generation attempt; 10-second model capability verification; 240-second total ingestion budget. The route advertises maxDuration 270 seconds, subject to hosting limits.

Mocked provider tests cover pre/active cancellation, cancellation during backoff, partial section failure without a result, busy retries, nonretryable 401/404/daily quota errors, model capabilities/output bounds, truncated/empty output, malformed JSON and existing attempt/total timeouts. These are **simulated** provider failures, not induced live quota/timeout incidents. No real mid-flight network cancellation or provider timeout was forced.

Unknown measurements never become zero. Explicit null depths leave the depth curve unavailable; UNKNOWN classification, unavailable efficiency, trip ILT and fuel/carbon remain unknown/null. Durations derive from valid timestamps. Overlapping/invalid intervals reject before analytics. Exact repeats count once; differing notes, activity, depths or classification are not silently collapsed. Failed/cancelled imports emit no successful report. Existing client late-result/previous-report protection tests pass; browser behavior was outside this backend sprint.

## Final verification

| Check | Actual result | Evidence |
|---|---|---|
| npm.cmd run typecheck | PASS | docs/qa/final-backend-typecheck.txt |
| npm.cmd test | PASS, 168 tests / 19 files | docs/qa/final-backend-tests.txt |
| npm.cmd run lint | PASS | docs/qa/final-backend-lint.txt |
| BORESIGHT_INGESTION_CHECK=1 npm.cmd run build | PASS | docs/qa/final-backend-build.txt |
| Normal post-build generated-reference typecheck | PASS | docs/qa/final-backend-postbuild-typecheck.txt |
| Final-build local HTTP | PASS, 21 assertions; no provider calls | docs/qa/final-backend-http.json |
| Latest saved multi-page source comparison | FAIL: one abbreviated excerpt | docs/qa/final-backend-single-day-comparison.json |

Exit codes/timings: docs/qa/final-backend-checks.json. HTTP assertions: eight smoke cases, two CSV/XLSX preprocessing imports, four real-report scenario/provenance/error cases, empty analytics rejection, five structured-column/depth guards and a 25-page PDF rejection. HTTP scenarios use the earlier saved real report without rerunning extraction. Terminal streamed errors are not treated as successful imports.

Automatic approval review rejected rerunning the older HTTP verifier because it would overwrite an already modified docs/qa/forge-http.json. Equivalent analytics assertions were completed with direct local API requests and separate new evidence. A later temporary approval-service usage limit blocked the first documentation write; the user requested continuation. No approval-dependent task remains blocked.

## Files and checkpoints

Runtime: src/lib/ingestion/chunks.ts, gemini.ts, structured.ts; src/lib/analytics/compute.ts. Tests: chunk-failure.test.ts, final-multipage.test.ts, final-missing-values.test.ts, gemini-client.test.ts and private-envelope fixture updates in ingestion.test.ts / ingestion-pipeline.test.ts. Supporting files: comparison script, two public PDF excerpts, expected-transcription encoding repair, fixture README, progress/correctness notes and final-backend evidence/report files. UI, shared contracts and packages were not changed for this sprint.

Branch: feat/solo-overnight. Local checkpoints:

- c3efa28716b75a38af6baa7476dcfca4ddd707a6: preserve original section failures.
- 71e92503e906dd116e3d7a46ec8a41a7dade285b: report-day scope and conflicting totals.
- 2ab918aaa2d4df4dac8c64b23f77c592245f7f68: missing evidence and conservative duplicate confidence.
- Final diagnostic/evidence correction and documentation: subsequent local commit in git log.

No remote CI, push, merge or deployment was performed, as requested. Pre-existing uncommitted UI, release-preflight work, reviewed-snapshot test/fixture and reference kit remain outside these commits.

## Remaining limitations

1. Gemini must identify report-day labels and daily totals. Missed labels can evade multi-day detection; omitted totals cannot be compared. This remains single-day processing, not general multi-day support.
2. No independent PDF OCR/text-verification layer exists. Omission-marker suppression is a conservative guard, not full quote verification; authentic source ellipses are also withheld pending review. Source pages, quotes and activity interpretations require human review.
3. Final quote suppression and contiguous-summary prompting have regression coverage but no subsequent live extraction. Do not present the newest multi-page run as fully source-verified or use its defective diagnostic snapshot for the demo.
4. Conflicting definitions are surfaced, not resolved. Flat planned work is not automatically downtime, and unknown/partial data does not prove opportunity.
5. Browser/print/deployment QA and production hosting behavior were outside this backend sprint.

Recommended next check: manually compare a fresh public single-day extraction's quotes and header evidence with the original pages, retaining the strict source-comparison gate. The existing labeled synthetic fallback remains available for provider failures.
