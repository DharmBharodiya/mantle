# Mantle final release report

24 October 2026 (America/New_York); evidence timestamps are 25 October UTC. Repository: C:\Users\dharm\Downloads\BoreSight-Starter-Kit. Branch: feat/solo-overnight. Starting checkpoint: d623540e8e0691cc3c58933249d5bd948e34eefe.

**Decision: local demo materials and automated verification are ready; full release sign-off is incomplete.** Use the previously validated cached FORGE report with the labeled synthetic fallback. Two gates remain open: successful fresh quote verification and complete browser/mobile/print rehearsal. Neither is represented as passing.

## Verified in this sprint

| Check | Actual result | Evidence |
|---|---|---|
| npm.cmd run typecheck | PASS | docs/qa/final-release-typecheck.txt |
| npm.cmd test | PASS: **170 tests, 20 files** | docs/qa/final-release-tests.txt |
| npm.cmd run lint | PASS | docs/qa/final-release-lint.txt |
| BORESIGHT_INGESTION_CHECK=1 npm.cmd run build | PASS | docs/qa/final-release-build.txt |
| Normal generated-reference TypeScript after build | PASS | docs/qa/final-release-postbuild-typecheck.txt |
| Final rebuilt-server HTTP | PASS: **21 assertions**, zero provider calls | docs/qa/final-release-http.json |
| Real-report console/server markup | PASS: selected genuine cementing evidence, 17 events, real depth/coverage, no substituted synthetic values | tests/release-real-report.test.tsx |
| Real-report printable markup | PASS: all 17 complete available evidence snippets, unverified provenance, explicit 100 ft/h and $240,000/day scenario, $5,700 opportunity, unknown carbon | tests/release-real-report.test.tsx |
| Desktop homepage | Visually observed in Chrome, thermal hero, navigation and report intake | docs/qa/final-release-browser.json |
| Homepage -> console -> Reports | Navigation observed; console and Reports controls rendered | Same browser observation record |
| Snapshot picker | Opened JSON file dialog only; import incomplete | Same browser observation record |

The production build completed in 28,042 ms. Command exit codes/timings are in docs/qa/final-release-checks.json. HTTP checks ran again after this new build, at http://127.0.0.1:3100. They cover page routes, analytics/scenarios, provenance, actual CSV/XLSX preprocessing, invalid sources and PDF page limits. They are API checks, not a browser end-to-end suite.

The two added tests use the original saved real FORGE snapshot, imported through canonical snapshot/metric handling. They run React server rendering; they do **not** prove hydration, browser event wiring, viewport fit or physical PDF pagination. Existing tests still cover cancellation/stale responses, report boundaries, malformed data, scenario calculations, exports and source integrity.

## Fresh live evidence verification: attempted, unresolved

One new request was made through the existing production HTTP/Gemini pipeline with the available server credential and the same public three-page FORGE day. No secret was printed or changed. The client requested one document; its two extraction sections use the existing bounded retry policy.

- Input: demo-fixtures/public/forge-78b-32/2021-06-28-full-day.pdf, unchanged pages from original PDF pages 4-6.
- Input SHA-256: 775206c4bf99a400146a7ec4ab30e284d2228a889373d075ff193cdd7131762d.
- Request ID: **18a1c9bb-bcaa-49a6-a3c3-dd737492e835**.
- Checked at 2026-10-25T00:51:48.196Z; client elapsed **8158 ms**.
- HTTP 200 accepted the NDJSON progress stream. One section completed; the terminal envelope was **type=error, code=PROVIDER_BUSY, status=503**. No result report was emitted/imported.
- The existing provider message was: "Gemini is experiencing high demand. Please retry later; no report was imported."
- Strict live verifier exited **1**, correctly reporting no completed real-day report. No second fresh request was made, and no partial extraction was used to claim quote accuracy.

Actual raw stages/error: [final-release-evidence-single-day.json](docs/qa/final-release-evidence-single-day.json). Actual comparison: [final-release-evidence-single-day-comparison.json](docs/qa/final-release-evidence-single-day-comparison.json). Repeat script: scripts/verify-release-evidence.mjs; without --live it reads this saved attempt, makes no provider call and retains a failing comparison. --live incurs provider usage and replaces only this script's latest release observations.

The prior backend sprint genuinely matched 17 intervals and ending depths, surfaced the source 4.0 h versus 3.5 h conflict and rejected adjacent report days. Its latest run nevertheless had an invented omission marker in interval 14. The backend correction withholds such quotes and lowers confidence; regression coverage passes. **This sprint did not obtain a fresh report to close that live verification gap.** A compact exact excerpt is supported; the current contract does not promise a full OCR transcription of every long activity paragraph. See [final backend validation](docs/FINAL-BACKEND-VALIDATION.md) for the earlier observed responses and limitations.

## Browser verification and precise stopping conditions

The dedicated Browser connector returned no enabled browser surfaces; creating a Chrome tab returned "Browser is not available: chrome". The computer-use skill was read and Windows Computer Use was used to inspect an existing Mantle Chrome window.

Observed window screenshot size was approximately 1430 x 854 pixels; this was **not** an exact 1440px/390px emulation. The initial browser was on the IDE dev server. It was navigated to the local production origin, then Open console and Reports were clicked. The rendered synthetic report showed the expected nine events and canonical metrics. The initial view was not substituted for a real-report browser test.

Import snapshot opened the native JSON picker. Its filename control could not be targeted: an accessibility click reported a stale cached element, and refreshed coordinate attempts reported a point over chrome.exe with an empty title rather than the selected Mantle window. The prescribed activation/refresh/retry did not resolve this. No snapshot was imported.

An independent tab was then attempted in another returned Chrome window. **Computer Use stopped for the turn because it could not determine the current browser URL on Windows with enough confidence to enforce policy.** No further browser/native input was issued. No alternate automation route was used to bypass that stop. A native picker may still be open in the Mantle window; dismiss it manually before the rehearsal.

The browser record contains observations and errors, not saved screenshot files: screenshots were inspected directly through the tool. It does not certify the controls below.

## Unverified release gates

- Exactly 390px mobile and tablet layout, page overflow and responsive fit.
- Genuine report snapshot import and all 17 event interactions in the live browser.
- Full upload, cancellation, invalid-file recovery and report switching in the browser.
- Browser scenario editing, comparison selector behavior and report-copy workflow.
- CSV/JSON browser downloads, their saved files and snapshot reimport.
- Complete Tab / Shift+Tab navigation, visible focus and keyboard activation.
- Chart hover/tooltips, benchmark toggle and reduced-motion behavior.
- Print preview, Save as PDF, pagination and clipping for the genuine report and scenario copy.
- Successful fresh extraction with exact non-abbreviated source quotes and the conflicting-total warning.
- Production environment configuration, host limits, HTTPS routes, runtime logs and production smoke tests.

These are explicit outstanding checks, not confirmed defects. No UI redesign or speculative fix was made. The existing UI/preflight working changes were preserved.

## Demo package

[DEMO-READY.md](DEMO-READY.md) now gives exact setup, real-report import and three-minute sequence, expected scenario values, source-conflict explanation, API-independent fallbacks and the pending manual browser gate. [JUDGE-PITCH.md](JUDGE-PITCH.md) supplies the timed spoken script and honest answers about provider availability and incomplete release QA.

Primary walkthrough: demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json, the original saved genuine extraction. It has 17 source-matched snippets from the earlier one-page validation and remains labeled unverified by the app. It predates the automatic drilling-total warning; show the original PDF's header/timed row and explain the discrepancy rather than claiming that warning is present in this old raw snapshot. Do not use the known-defective docs/qa/final-backend-real.snapshot.json as a replacement.

Synthetic fallback: demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv imports without Gemini: three events, 60 NPT minutes, four observed hours and twenty unobserved hours. Reset demo supplies the separate nine-event synthetic well. Keep both clearly labeled. Full reports live in memory: export JSON before refresh. Optional saved summaries do not retain event-level evidence.

## Deployment readiness and deferred work

[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) lists required/optional server environment variables, exact ordinary Node build/start commands, isolated-build caveats, hosting payload/duration limits, request streaming, provider errors and the manual production smoke gate. Hosting-specific statements link to official documentation checked this sprint. No hosting behavior was inferred from localhost success.

No push, merge, deployment, authentication, database or infrastructure module was added. Photon and ElevenLabs remain deferred and were not implemented or called. Live equipment vision accuracy was not exercised. No remote CI run was triggered or verified; all passing results here are local. Local checkpoints do not imply a remote branch is ready.

## Changes in this sprint

- **Updated:** DEMO-READY.md, SOLO-PROGRESS.md.
- **Added:** FINAL-RELEASE-REPORT.md, JUDGE-PITCH.md, DEPLOYMENT-CHECKLIST.md.
- **Added:** scripts/verify-release-evidence.mjs (one public full-day request/offline replay, separate observations) and scripts/verify-release-http.mjs (21 deterministic HTTP assertions with result recording).
- **Added:** tests/release-real-report.test.tsx (two genuine-report rendering checks).
- **Added:** docs/qa/final-release-* command logs, exit-code/timing record, HTTP evidence, browser observation record and fresh live error/comparison.
- **Runtime/UI/contracts/packages:** no changes for this sprint. No confirmed application defect required a patch.

Existing uncommitted changes to EventLog.tsx, mantle.css, tests/forge-validation.test.ts, docs/qa/forge-http.json, the reviewed snapshot, earlier release logs and the mantle-kit reference directory were left outside this sprint's checkpoint. The full local test count includes that existing working tree; do not assume an arbitrary remote checkout contains it.

## Next action

A maintainer should complete the manual browser gate in DEMO-READY.md and rehearse the cached-report demonstration. Separately, when provider capacity is available, make one authorized public-report request and compare its exact quotes and discrepancy warning with the original. Until both gates pass, present Mantle as a locally validated MVP with a reliable cached/synthetic demo path, not a fully signed-off production release.
