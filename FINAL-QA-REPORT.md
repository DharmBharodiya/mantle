# Mantle final hackathon QA report

Date: 24 October 2026 (America/New_York). Branch: `feat/solo-overnight`.

## Latest backend correctness follow-up

The subsequent backend-only audit reproduced and fixed ambiguous structured source columns/depth parsing and empty analytics API success. **124 tests / 16 files, TypeScript, lint and production build pass; all 20 rebuilt-server HTTP assertions pass.** No new provider calls or UI verification were performed. Details and limits: `docs/BACKEND-CORRECTNESS.md`; actual evidence: `docs/qa/backend-checks.json` and `docs/qa/backend-http.json`. Earlier visual/preflight observations below remain historical. Existing uncommitted UI/preflight files were preserved separately.

## Outcome

Core local demo workflow is validated with one genuine public Utah FORGE report day and labeled synthetic backups. Two import reliability defects were fixed. No rebuild/redesign, provider expansion, authentication, infrastructure, package, telemetry-contract or credential changes were made.

**Not a complete visual sign-off:** the rendered desktop homepage and console were inspected, and homepage-to-console navigation was observed. Computer Use was then stopped with the physical Escape key. No further Computer Use was attempted. Exactly 390 px layout, keyboard traversal, chart hover/click, report switching/comparison interaction, downloads and native print preview remain unverified in a browser during this task. Equipment vision was tested offline and for HTTP invalid-image rejection; no live equipment-image inference was performed.

## Real-source evidence

- Dataset: John McLennan / Energy and Geoscience Institute at the University of Utah, *Utah FORGE: Well 78B-32 Daily Drilling Reports and Logs*, DOI https://doi.org/10.15121/1814488.
- Authoritative catalogue/license: https://catalog.data.gov/dataset/utah-forge-well-78b-32-daily-drilling-reports-and-logs, CC BY 4.0.
- Original PDF: https://gdr.openei.org/files/1330/78B-32-DailyDrillingReports-6-27thru7-31.pdf.
- The submission landing page returned HTTP 429. The direct PDF downloaded successfully: 875,354 bytes, 93 pages, SHA-256 `e1424b3a73dc878a09e23698a03f3f40bf59e5817bc7847af0c58d1cf384964f`.
- Chosen day: 28 June 2021, report 2, operations on original PDF page 4. That page was copied without reauthoring its text into `demo-fixtures/public/forge-78b-32/2021-06-28-operations.pdf`: 99,713 bytes, SHA-256 `54da4b3d01fec8bbd75124aecb1b69b5a6e8a5812a1ab3d7478452b051f709c4`.
- Actual local production `POST /api/ingest` -> existing server Gemini pipeline; configured `gemini-3.1-flash-lite`; no mock extraction. Request ID `764fd946-5cfb-43c0-b633-6a5cf1bd723c`; client elapsed **21,556 ms**. HTTP 200 accepted the NDJSON stream; a validated terminal result actually arrived. The raw observed stages/report are in `docs/qa/forge-live-observed.json`.
- Live extraction used the baseline production implementation at `d4405aa478c951de050fef98b6e2e5d0e8c53b20`. The extraction/normalization/model code was unchanged by this task. Final rebuilt-server analytics, structured imports and error checks were separately rerun after the import fixes.
- The saved `2021-06-28-gemini.snapshot.json` is that actual result. It remains `PUBLIC_SOURCE_UNREVIEWED`, including after snapshot import. Neither a model nor this QA script promotes it to human verified.

## Comparison against original operations

All 17 intervals, elapsed durations and ending hole measured depths matched the original table. All 17 returned source snippets matched its text after whitespace normalization; the expected transcription is retained separately in `2021-06-28-expected.json`. Excerpt page 1 correctly maps to original page 4.

| Original operation period | Duration (hours) | Ending hole MD (ft) | Result |
|---|---:|---:|---|
| 00:00-01:00 | 1.00 | 128 | Match |
| 01:00-01:30 | 0.50 | 128 | Match |
| 01:30-05:00 | 3.50 | 421 | Match; drilling starts at 128 ft |
| 05:00-05:30 | 0.50 | 421 | Match |
| 05:30-06:00 | 0.50 | 421 | Match; wipe position is not hole depth |
| 06:00-06:30 | 0.50 | 421 | Match |
| 06:30-07:00 | 0.50 | 421 | Match |
| 07:00-08:00 | 1.00 | 421 | Match |
| 08:00-10:00 | 2.00 | 421 | Match; casing shoe 416 ft is distinct |
| 10:00-11:00 | 1.00 | 421 | Match |
| 11:00-12:30 | 1.50 | 421 | Match |
| 12:30-13:00 | 0.50 | 421 | Match; stab-in position is distinct |
| 13:00-14:30 | 1.50 | 421 | Match |
| 14:30-16:00 | 1.50 | 421 | Match |
| 16:00-16:30 | 0.50 | 421 | Match |
| 16:30-17:00 | 0.50 | 421 | Match |
| 17:00-24:00 | 7.00 | 421 | Match; printed 0:00 + explicit elapsed 7.00 establishes day end |

### Mismatches and interpretation limits

1. **Source-internal discrepancy:** header lists 293 ft / 4.0 h and 73.25 ft/h; the timed drilling block is 3.5 h. Original PDF page 5's BHA table also lists 293 ft / 3.5 h / 83.7 ft/h. Canonical calculations use 01:30-05:00 (210 min), not the conflicting header aggregate. Source values were not rewritten to make them agree.
2. **Classification is interpreted:** no rows on this page are marked Non-Prod. All 17 returned PRODUCTIVE classifications are reasonable planned-operation interpretations, not literal PRODUCTIVE strings in the PDF. No false NPT was introduced from flat depth. Domain review remains necessary.
3. **Coarse activity buckets:** surface assembly -> OTHER, pipe filling -> CIRCULATING, hole wiping -> TRIPPING_OUT. These are not exact reproductions of the operator's numeric activity codes. Quotes remain available; this task did not assert an exact source-code-to-category equivalence or special-case these rows.
4. **No measured-field extraction correction was needed:** time boundaries, durations, depths and quoted excerpts matched this sample. No prompt/schema/math was changed to force the expected result. One day is not evidence of general OCR or classification accuracy.

Derived result: 1,440 observed/productive minutes, 100% coverage, 0 NPT minutes, 210 ILT-eligible drilling minutes, 0 ILT at the default assumed 35 ft/h, null fuel/carbon. The explicitly illustrative 100 ft/h and $240,000/day scenario gives 34.2 ILT minutes and $5,700 modeled opportunity. This is neither a validated formation benchmark nor audited savings.

## Reliability fixes and regression coverage

- `src/components/dashboard/report-view.ts`: reject already-cancelled requests before networking and reject late JSON responses after cancellation, before returning an importable report. Streaming retains its existing commit-after-terminal-result checks. Two regression tests exercise these cases and preservation of the previous selected report.
- `src/lib/reports/manage.ts`: reject a snapshot with zero events before it can replace the selected analysis. Regression test confirms the existing valid report is retained.
- `tests/forge-validation.test.ts`: four regressions use the actual saved real extraction, independently transcribed times/depths and source text. They cover evidence, flat planned work, unavailable trip ILT, scenario values and snapshot/CSV retention. These are offline replay tests, not repeated live requests.
- Existing suites cover CSV/XLSX/PDF boundaries and signatures, malformed/oversized input, PDF chunk citations, missing keys, bounded provider retries/deadlines, stream failures and cancellation, unknown/null data, invalid/overlapping events, scenario math, exports and print markup. Interactive React/browser execution is not implied by server-render tests.

## Executed checks

| Check | Result / evidence |
|---|---|
| Baseline tests | 87 tests / 13 files passed before edits |
| Final `npm.cmd test` | 94 tests / 14 files passed; `docs/qa/check-tests.txt` |
| Final `npm.cmd run typecheck` | Passed; `docs/qa/check-typecheck.txt` |
| Final `npm.cmd run lint` | Passed; `docs/qa/check-lint.txt` |
| Final production build | Passed with `BORESIGHT_INGESTION_CHECK=1`; `docs/qa/check-build.txt` |
| Actual genuine PDF -> Gemini | Passed for this one day; observed record above |
| Offline source comparison | Passed: 17 intervals/depths/excerpts; `node scripts/validate-forge.mjs` |
| Rebuilt-server smoke | 8 checks passed; `docs/qa/smoke.json` |
| Rebuilt-server CSV and XLSX | Both passed without Gemini: each 3 events, 60 NPT min; `docs/qa/structured-ingestion.json` |
| Rebuilt-server real-report analytics | 4 checks passed: explicit scenario, evidence/provenance, overlap rejection, negative assumption rejection; `docs/qa/forge-http.json` |
| Print | Four existing automated markup/CSS tests passed; actual pagination/print preview not observed |
| Desktop visual | Homepage and console seen in Chrome; homepage Open console navigation observed. Window screenshots included browser chrome; an exact 1440 px content viewport was not measured. |
| Mobile / full keyboard / chart interactions | Unverified: Computer Use stopped by physical Escape; no further native interaction |
| Equipment vision | Existing offline tests and invalid-image HTTP check passed; live image extraction unverified |

`docs/qa/automated-checks.json` records actual final command exit codes and elapsed times. Typecheck, lint, tests and build were run sequentially to avoid generated-type races. The initial ordinary production start found no build in the dev `.next` directory; using the existing isolated production profile resolved setup. The temporary production server was stopped before rebuilding. Next's generated reference was restored to the checkout's normal development reference after the isolated build, and typecheck was rerun successfully against that normal reference.

## Remaining limitations and next action

- Perform the browser preflight in `DEMO-READY.md` at desktop and 390 px, including print preview and a full three-minute rehearsal. No screenshot artifacts were saved to the repository during this run.
- Test additional genuine days, especially marked NPT, scanned pages, conflicting values and multi-page tables. This sample is a text-based operations page with no marked NPT.
- API capacity/quotas and hosting timeouts remain external limits. Only this local call is verified; no latency/SLA or general accuracy percentage is claimed.
- Single local report day; bounded 8 MB uploads and 24-page PDFs. Split larger/multi-day reports. Trip ILT needs separate bit/string movement observations.
- Full reports remain in memory; export/import JSON for recovery across refresh. Only opt-in aggregate summaries persist locally.
- Public deployment/authentication/storage/rate limiting are outside this task. No authentication, infrastructure, Photon or ElevenLabs work was performed.
- No push, merge, deployment or destructive Git operation was performed. CI was not triggered or independently verified. Existing untracked `mantle-kit/` was preserved untouched.

## Files changed

Application: `src/components/dashboard/report-view.ts`, `src/lib/reports/manage.ts`.

Tests: `src/components/dashboard/report-view.test.ts`, `tests/reports.test.ts`, `tests/forge-validation.test.ts`.

QA/demo: `.gitignore` (ignore full locally downloaded source PDF), `scripts/validate-forge.mjs`, `demo-fixtures/public/forge-78b-32/` (attributed one-page PDF, expected transcription, real saved snapshot, README), `docs/qa/` (observed live/HTTP/check evidence), `DEMO-READY.md`, `FINAL-QA-REPORT.md`, `SOLO-PROGRESS.md`.

Local import-fix checkpoint: `9f0b3fe82fb1b695d925cd900f639e409adda34b`, branch `feat/solo-overnight`. Subsequent QA/demo checkpoint is visible in `git log`; neither checkpoint was pushed.
