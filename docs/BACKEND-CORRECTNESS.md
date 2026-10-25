# Backend correctness follow-up

Scope: targeted backend fixes after the local Mantle MVP and real-report validation. No UI implementation, architecture, dependency, shared schema, authentication, Photon or ElevenLabs changes in this follow-up. Earlier uncommitted UI/preflight work is preserved separately.

## Structured CSV/XLSX correction

The old parser selected the first normalized column or alias. A second start/end-time, well identifier or observation could disagree without rejecting the upload. A blank primary alias also hid a populated fallback. Depth parsing removed all commas, so malformed `1,2` became 12, and JavaScript accepted radix notation such as `0x400`.

The parser now:

- rejects duplicate normalized headers with `AMBIGUOUS_STRUCTURED_COLUMNS` (422);
- checks every populated alias and rejects conflicting values, rather than selecting one silently;
- accepts equivalent minute/clock pairs (`60` and `01:00`) and matching text aliases;
- uses a populated fallback when the primary alias is blank;
- accepts explicit decimal/scientific depths and correctly grouped thousands, while rejecting malformed grouping and radix notation;
- retains source row/sheet/excerpt information and the existing nonempty/timeline validation.

Evidence: `tests/structured-columns.test.ts` initially had 14 failures / 5 passes against the old implementation; after the fix all 19 pass. Both deterministic CSV and actual XLSX preprocessing are covered, plus the route's terminal streamed-error behavior. No Gemini call is needed.

## Analytics boundary correction

`POST /api/analytics` previously returned HTTP 200 for an extraction with zero events. It now returns HTTP 422 with an actionable error and no report/metrics. The pure calculation function still supports empty data for existing empty-state rendering; the fix is scoped to accepting an analysis through the public API.

`tests/analytics-route.test.ts` reproduced the empty-list defect before the change and covers 10 cases: empty rejection, canonical recalculation rather than trusted client metrics, scenario values/null fuel, unverified provenance, overlaps, invalid dates, zero durations, retained review warnings, invalid assumptions and the built-in demo route.

## Verification evidence

Final command outputs and exit codes: `docs/qa/backend-checks.json`, `backend-typecheck.txt`, `backend-tests.txt`, `backend-lint.txt`, `backend-build.txt`. HTTP verification against the newly built local server is recorded in `docs/qa/backend-http.json`.

The existing real FORGE recorded-response verifier remains an offline comparison, not a new live extraction. This backend follow-up makes no new provider calls and does not claim broader real-PDF/OCR accuracy. Ambiguous structured files now require the source columns/values to be corrected; no values are guessed or silently discarded.

Observed final results: TypeScript PASS; 124 tests across 16 files PASS; lint PASS; isolated production build PASS. TypeScript also passed after restoring the normal generated development reference. All six new actual HTTP cases passed, plus the existing eight smoke, two canonical CSV/XLSX, and four real-report analytics checks (20 HTTP assertions total). No new Gemini calls were made.

## Final backend validation sprint

Subsequent work adds section-failure preservation, report-day metadata validation, conflicting daily-total warnings, conservative duplicate confidence and missing/abbreviated evidence handling. See [FINAL-BACKEND-VALIDATION.md](FINAL-BACKEND-VALIDATION.md) for changes, provenance, five actual live requests, failures and limits.

Final source passes 168 tests / 19 files, TypeScript, lint, build and 21 local production HTTP assertions. The latest live three-page FORGE run matched 17 intervals/end depths and surfaced 4.0 h versus 3.5 h, but one quote was abbreviated: strict source comparison remains FAIL. Final quote suppression is regression-tested, not live-rerun. Earlier 124-test/no-new-provider-call results above are historical.
