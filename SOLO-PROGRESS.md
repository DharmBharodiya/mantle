# BoreSight solo progress

Branch: `feat/solo-overnight`. Mission started 2026-10-24 (America/New_York).
User's existing mission/rule files and all previous dashboard work are preserved.

## Milestones
- DONE — 1. Audit, baseline test/lint fixes, initial checkpoint.
- DONE — 2. Bounded server-side Gemini ingestion, provenance and explicit errors.
- DONE — 3. Analytics invariants, honest missing data, scenario recalculation.
- IMPLEMENTED — 4. Dark responsive workspace and source inspection; browser visual QA blocked.
- DONE — 5. Local report management, comparison, CSV/JSON and print exports.
- IMPLEMENTED — 6. Equipment vision route/UI and offline tests; live verification pending.
- IN PROGRESS — 7. Live/public-source checks, final QA and runbooks.

## Observed baseline
- `npm.cmd run typecheck`: PASS.
- `npm.cmd test`: FAIL: Vitest cannot resolve `@/types/telemetry`; 13 dashboard tests pass.
- `npm.cmd run lint -- --quiet`: running; known generated `.next` files incorrectly included.
- Baseline production build: PASS. Added Vitest alias and generated-file lint exclusions; all 20 existing tests now PASS. Vitest config bundling requires approved execution outside this Windows sandbox because esbuild cannot traverse its parent directories. No source or credentials are transmitted by tests.
- Existing live ingestion returned Gemini 503 high demand in the earlier session; no successful live extraction claimed.

## Conservative decisions
- One local report day, minutes 0–1440. Reject ambiguous overnight/multi-day input with actionable errors; no guessed dates or interval splitting.
- Browser persistence stores bounded non-sensitive aggregate summaries only. Full evidence reports remain in memory or explicit user-downloaded JSON; never raw source uploads or keys in localStorage.
- No new database, remote fonts, paid infrastructure or P4 integration work.
- Human verification is never inferred from an AI response or imported browser file.
- External failures do not prevent independent implementation/QA.

## Pipeline verification
- 40 tests PASS (ingestion, analytics, vision backend, existing dashboard). Typecheck and lint PASS. Production build PASS after restoring the shared numeric error formatter.
- Ingestion now rejects empty/non-drilling output, invalid signatures, oversized rows/text, corrupt JSON and invalid intervals. Gemini retries are disabled (one attempt) with a 120-second provider timeout.
- Canonical Contract v1.1 adds optional row/sheet evidence, schema-validated report output and coverage/benchmark eligibility metrics. All consumers upgraded.
- Explicit one-day scope is validated; decreasing hole depths remain visible with warnings. Unknown trip ILT stays null. Source text excerpts are checked against supplied content.
- PDF page/excerpt claims remain unverified and are labeled. Public GDR submission 1330 fetch returned HTTP 429; no real-source fixture is claimed.
- Vision backend implemented and offline-tested; live/UI verification pending.
- Browser inventory returned no apps/browsers. New visual screenshots cannot currently be captured through the available UI tool.


## Dark workspace integration
- Dark design tokens, reusable cards, chart gradients, inverted depth axis, 24-hour evidence-linked activity ribbon, native modal evidence drawer and accessible event filters implemented.
- P4 removed from visible navigation; legacy voice/messaging endpoints now return 501 FEATURE_PAUSED without calling providers.
- Report JSON import/export recomputes metrics and downgrades unverified source claims; CSV protects spreadsheet formula injection.
- Report comparisons include assumptions, coverage, first/last observations and NPT on the same linear scale. No synthetic second result is invented.
- Optional browser-local aggregate history stores at most 30 summaries, no raw uploads or evidence snippets. Full analysis remains in memory or explicit JSON export.
- Scenario form calls deterministic analytics only. Reset restores original demo assumptions; no stale source label promotion.
- Equipment UI uses real image upload with result/schema checks; quality/region/confidence/limits are labeled unverified.
- Integrated typecheck PASS; 43 tests PASS. Lint found one JSX apostrophe and an unused type import, both corrected; final build running.



- Integrated dark production build PASS. All 43 tests PASS; typecheck and lint PASS. HTTP smoke PASS for HTML/source labels, 9-event demo API, scenario recalculation preserving SYNTHETIC_DEMO, rejected unsupported file and rejected invalid equipment image.
- First live synthetic CSV attempt returned 502 PROVIDER_ERROR because the test server was sandboxed from Google. Restarted the agent-owned loopback test server with approved network access; one new attempt is running.


## External verification outcome
- Approved network-enabled test server: LIVE synthetic CSV request failed (provider unavailable). A small direct configured-model probe confirmed: Retryable HTTP Error: Service Unavailable. No live extraction success is claimed.
- One isolated default-model test on gemini-2.5-flash returned Not Found. Changed the documented server fallback to current gemini-3.8-flash; the user's .env.local was NOT modified. Provider errors now recognize the SDK's statusless busy/not-found wrappers.
- No further generation retries will be made against the same provider outage. Equipment Vision live output is UNVERIFIED; offline schema/error tests pass.
- Source repository https://gdr.openei.org/submissions/1330 returned 429; no real DOE/FORGE content was downloaded or fabricated.
- Full UI + HTTP behavior is independently implemented. No browser surface is available for viewport screenshots or interactive focus/print verification.


## Final local acceptance evidence
- All feasible non-P4 features implemented. Milestones 2–6 are code-complete, with live provider and browser checks explicitly limited as below.
- Final `npm.cmd run typecheck`: PASS.
- Final `npm.cmd test`: PASS, 48 tests in 8 files (approved execution required for esbuild directory access in this sandbox).
- Final `npm.cmd run lint`: PASS, no warnings/errors.
- Final `npm.cmd run build`: PASS, all 9 routes generated/compiled. Home first-load JS 256 kB.
- Final `node scripts/smoke.mjs`: PASS, 7 HTTP assertions: dark HTML/source labels, demo API, scenario rate recalculation, null carbon/verification downgrade, invalid analytics JSON, unsupported report file, invalid equipment signature.
- `git diff --check`: PASS. No secrets, provider credentials, generated `.next` content, logs or node_modules staged.
- Existing supplied screenshots are historical. No dark viewport screenshots or print/focus browser observations are claimed.
- No dependency installation, remote push, merge, deployment, destructive filesystem operation or external message was performed.

## Local checkpoints
- `1d491aa` — baseline checks, alias and progress tracking.
- `6276fed` — validated ingestion/analytics, safe errors and equipment observation backend.
- Dark workspace/report management checkpoint: recorded in OVERNIGHT-RESULTS.md after commit.

## Real blockers / unverified acceptance
- Google generation on configured model: service unavailable. Older model probe: Not Found. Live synthetic extraction did not succeed. No real-source extraction success is claimed.
- Live equipment observations: unverified during the same provider outage; offline validation and error paths pass.
- GDR submission 1330: HTTP 429; no real geothermal input downloaded or redistributed.
- Browser surfaces: none available. Manual 390px/desktop visual, native focus/storage and print layout review remains required; runbook supplied.
- Photon + ElevenLabs remain unimplemented/paused. No calls/tests of either provider were made.

## Completed checkpoint
- `4109188` — dark workspace, report history/comparison, scenario editing, CSV/JSON/print exports, equipment UI, remaining input safeguards and runbooks.
- Final code validation: 48 tests PASS; typecheck PASS; lint PASS; build PASS; 7 offline HTTP checks PASS.
- Staged diff whitespace check PASS. Staged key-pattern filename scan returned no matches; `.env.local` remains ignored.
- Remaining work is external/manual verification only, detailed in OVERNIGHT-RESULTS.md. There is no claimed live real-report success or new screenshot evidence.

## Critical ingestion follow-up — 2026-10-24
- Investigated the 120-second SDK / 300-second browser cutoff without assuming the original document was too large. Existing PDF path sent the whole document, unstructured and canonical spreadsheets both used Gemini, and cancellation was classified as provider timeout.
- Configured model metadata check: HTTP 200, generateContent supported, ~799 ms. A tiny synthetic structured LOW-thinking generation probe reached its 15-second diagnostic deadline (~14.5 s) without a response; generation latency can occur independently of document size. User subsequently observed an explicit provider-busy error.
- Implemented content-free request/stage/attempt timing, model verification/cache, supported LOW thinking (Gemini 3) / zero thinking budget (2.5 Flash), 8,192 output-token extraction budget, 2 attempts only for recognized transient responses, and separate timeout/cancellation/deadline error codes.
- Added explicit canonical CSV/XLSX parsing without Gemini. Noncanonical sources still require model extraction. PDF parsing/page chunks use pdf-lib; up to 24 pages, groups of 2, concurrency 2, exact original page mapping. Entire single-day output is validated and exact duplicates removed before unchanged analytics.
- Added server-originated NDJSON progress and a terminal result/error transaction. The client preserves the previous dashboard until a validated final result is received. No percentages are fabricated.
- Tests now PASS: 72 in 10 files. Typecheck/lint/default build PASS. Initial production HTTP verification failed because Next build artifacts were inconsistent (missing generated 611.js); verification output is now isolated from a running IDE dev session using BORESIGHT_INGESTION_CHECK=1.
- Live HTTP fixture verification and final fix report are in progress. No new live generation success is claimed yet.

## Follow-up live extraction verified
- On gemini-3.8-flash, instrumented one-page synthetic PDF (1,244 bytes): preparation 1 ms, chunk parse 15 ms, model verification 438 ms, generation attempts returned busy after 7,357 ms and 12,232 ms; request ended ~20.6 s. This isolated generation capacity, not preprocessing, for that reproduction.
- One alternative-model check was made using a temporary process override. gemini-3.1-flash-lite metadata supported generation; actual one-page PDF extraction then PASSED with 3 events and 60 NPT minutes in 49,437 ms. Attempt 1 busy; single 500 ms backoff; attempt 2 succeeded (~9,997 ms).
- Updated only GEMINI_MODEL in .env.local to the verified passing model; the API key line was checked unchanged and was never printed/staged. Server fallback and .env.example now use gemini-3.1-flash-lite.
- Canonical CSV/XLSX HTTP imports PASSED without Gemini (~206/98 ms in the first run, ~213/114 ms in the alternative-server run). 7 existing offline HTTP smoke checks PASSED on the isolated production build.
- Regression suite: 72 tests PASS. Final model rebuild/check cleanup is in progress. INGESTION-FIX-REPORT.md records exact scope, protocol, evidence and limitations.

## Critical ingestion follow-up final verification
- Final 72 tests PASS; typecheck PASS; lint PASS; production build PASS (isolated profile avoids dev/build artifact collisions).
- Final saved-model/default is gemini-3.1-flash-lite. Actual synthetic one-page PDF extraction succeeded earlier on that model with all assertions; no duplicate live call was needed after equivalent configuration was saved.
- Final production HTTP checks: canonical CSV PASS (~200 ms), canonical XLSX PASS (~116 ms), all 7 previous smoke assertions PASS.
- Restored Next's normal generated type reference after the isolated build, kept the optional verification type glob, and verified typecheck/lint again.
- Browser inventory was checked again and returned no surfaces. No browser visual/progress observation or real geothermal file validation is claimed.
- User must restart an existing dev server to load the updated model setting. API key unchanged; .env.local stays ignored.
- INGESTION-FIX-REPORT.md is the authoritative follow-up report; prior overnight results are explicitly marked historical.

## Mantle-style homepage slice
- Read `mantle-kit/AGENTS.md`, CLAUDE.md, README, homepage/components/styles and metrics; kept the supplied reference tree untouched.
- Ported homepage to `/`; moved the existing functioning dashboard to `/console` with a return link and in-memory report handoff/session. Uploads call the existing ingestion protocol and navigate only after a full validated report.
- Retained Next 15/Tailwind 3 and canonical analytics. Namespaced/scoped Mantle tokens avoid changing the console; the kit computeDay adapter delegates all metrics to buildWellReport and refuses uploaded/unknown data.
- Hosted Instrument Sans, Instrument Serif italic and JetBrains Mono locally with OFL licenses. Build has no font-network dependency. Next dev indicator disabled.
- Removed fake sign-in/team/repo controls, invented visual bar proportions and hardcoded extraction metrics/source line/page numbers. Preview evidence and decoded values use the actual synthetic fixture.
- Intermediate checks: typecheck PASS; lint PASS; all 77 then-existing tests PASS; isolated production build PASS with `/` 142 kB and `/console` 260 kB first-load JS. Additional console-session test and final styling cleanup verification pending.
- Browser inventory: no available apps/browsers; no viewport screenshots or visual interaction success claimed.

### Mantle homepage final validation
- `npm.cmd run typecheck`: PASS; `npm.cmd run lint`: PASS; `npm.cmd test`: PASS, 78 tests in 11 files.
- `$env:BORESIGHT_INGESTION_CHECK='1'; npm.cmd run build`: PASS on final source. Routes `/` and `/console` compiled; first-load JS approximately 142 kB / 260 kB respectively.
- Production HTTP `node scripts/smoke.mjs`: PASS, 8 checks including both page routes/console link and existing analytics/error contracts.
- Production HTTP `node scripts/verify-ingestion.mjs`: PASS, actual canonical CSV and XLSX imported as 3 events / 60 NPT minutes (~42 ms / ~36 ms) without Gemini.
- HTTP validation of emitted stylesheet, valid marquee keyframes, responsive minmax grid and all three local WOFF2 fonts: PASS. This is asset verification, not a browser visual test.
- Restored normal Next generated-type reference after isolated build; final normal typecheck/lint recheck follows.
- No source API/analytics/type contract changes, no package upgrades, no new Gemini/provider calls, no credential edits. The user's mantle-kit reference directory remains untouched and untracked.
- No screenshots or visually observed viewport behavior claimed. Manual review and demo steps are in docs/MANTLE-HOMEPAGE.md.

## Mantle full brand and console integration � 2026-10-24

- Replaced the active console presentation with adaptations of the supplied Mantle overview/sidebar/KPI/evidence/log/ledger and shared-axis depth timeline. Preserved the existing controller, ingestion, report/history, scenarios, comparison, exports and vision integrations.
- Unified active console surfaces, fonts, controls and semantic colors with the homepage; migrated visible brand and download names to Mantle, retaining environment/storage/snapshot compatibility identifiers.
- Added five canonical-data/evidence/chart regression tests; updated legacy brand assertions. 83 tests across 12 files pass. Typecheck, lint and isolated production build passed. Both routes and 6 other HTTP smoke scenarios pass; canonical CSV/XLSX production imports pass (3 events, 60 NPT minutes each).
- Browser visual review blocked: Windows Computer Use stopped because it could not verify the browser URL for policy enforcement. No browser input continued; no screenshots or mobile/desktop interaction success claimed. No genuine local drilling report or new live Gemini extraction tested for this design migration.
- Full implementation notes, file roles, compatibility decisions, validation and review steps: MANTLE-DESIGN-INTEGRATION.md.

## Selected-report printing fix � 2026-10-24

- Root cause: the homepage print rule hid every `.mantle-page`, including the console ancestor of the print-only report. Scoped the rule to `.mantle-page:not(.mantle-console)` and explicitly kept the console print container visible while hiding navigation/chrome.
- PrintSummary now receives the selected analysis filename and includes identity/provenance, canonical metrics and time coverage, scenario assumptions/formulas, ranked exposure, every event, every exact source excerpt/interpretation and all warnings. Added paper pagination, repeated table headers, readable black-on-white text and complete wrapping.
- Added 4 print regression tests for ancestor visibility, complete evidence/warnings, a different selected report/scenario and unknown values. All 87 tests pass. No browser print-dialog/PDF visual verification was performed; manual Print / Save as PDF review remains pending.
- Final verification: npm.cmd run typecheck PASS; npm.cmd run lint PASS; npm.cmd test PASS (87 tests / 13 files); isolated production build PASS; git diff --check PASS. The initial typecheck raced generated build types; rerunning sequentially after the build passed.

## Final hackathon validation — 24 October 2026

- Actual public Utah FORGE Well 78B-32 operations page for 28 June 2021 was downloaded and extracted through the existing production HTTP/Gemini path. 17/17 intervals, durations, ending hole depths and excerpts matched the original operations table. 21,556 ms client elapsed, request 764fd946-5cfb-43c0-b633-6a5cf1bd723c. Report remains unverified; interpreted activity buckets are documented.
- Documented original source discrepancy: header 293 ft / 4.0 h versus timed drilling 3.5 h (and BHA 3.5 h). No values were fabricated to reconcile it. Flat planned work correctly produced no NPT; trip ILT remains unknown.
- Fixed late legacy-JSON cancellation and empty snapshot imports; regression tests preserve the previous selected report. Local checkpoint 9f0b3fe82fb1b695d925cd900f639e409adda34b.
- Added four real-response replay regressions and an offline-by-default source verifier. Actual snapshot plus original one-page PDF and labeled synthetic fixtures support an API-independent demo.
- 94 tests across 14 files pass. Typecheck/lint/isolated production build pass. Rebuilt-server smoke 8/8, canonical CSV/XLSX 2/2 and real-report analytics/error checks 4/4 pass. Detailed final command evidence is in docs/qa/automated-checks.json.
- Desktop homepage/console inspected and navigation observed. Computer Use stopped with physical Escape; no further UI interaction attempted. Exactly 390 px, full keyboard/interaction, print-preview and live vision remain unverified.
- DEMO-READY.md gives setup, exact three-minute sequence and fallbacks. FINAL-QA-REPORT.md records observed evidence, complete per-interval comparison and limits. No push, merge, deployment, credential/package/contract change, Photon or ElevenLabs work.

## Backend correctness — structured input ambiguity

- Reproduced ambiguous CSV/XLSX headers, conflicting aliases, ignored populated fallbacks and malformed comma/radix depths: 14 of 19 new regressions failed against the prior parser.
- Structured input now rejects duplicate normalized names and conflicting populated aliases with AMBIGUOUS_STRUCTURED_COLUMNS (422). Equivalent clock/minute aliases and matching text aliases remain valid; blank aliases no longer hide a populated value.
- Depths accept decimal/scientific notation and properly grouped thousands; malformed grouping/radix notation is rejected, never silently reinterpreted.
- Focused verification: 19 new structured-column tests plus 12 existing pipeline tests pass (31 total); TypeScript and lint pass. No model calls, shared contract/package/UI changes, push, merge or deployment.

## Backend correctness — nonempty analytics boundary and integration

- Reproduced POST /api/analytics accepting zero events as HTTP 200. Added a scoped HTTP 422 guard without changing pure-engine empty-state support or shared contracts.
- Added 10 route regressions for empty analyses, canonical event-derived calculations, scenario/null behavior, provenance downgrade, review warnings, invalid dates/durations/overlaps and demo compatibility.
- Full final checks pass: TypeScript, 124 tests / 16 files, lint and isolated production build. Normal generated-reference typecheck also passes.
- Rebuilt production HTTP verification passes: six new source/empty-boundary assertions plus eight existing smoke, two CSV/XLSX imports and four FORGE scenario/error assertions (20 total). No new Gemini calls. Offline recorded FORGE comparison still reports no mismatches.
- Full evidence: docs/qa/backend-checks.json, backend-http.json and backend-*.txt; scope and limits: docs/BACKEND-CORRECTNESS.md. Existing UI, reference kit and earlier preflight changes remain outside these backend commits. No push, merge or deployment.

## Final backend validation — chunk failure checkpoint

- Reproduced multi-worker error masking: when a later-index section fails first, mapBounded returned an earlier-index sibling cancellation instead of the original failure. It now retains the first failure and stops queued sections even for falsy thrown values.
- Focused checks: 2 chunk-failure regressions and 12 existing ingestion-pipeline cases pass; TypeScript and scoped ESLint pass. No deadline, dependency, contract or UI change.

## Final backend validation — report-day and aggregate checks

- The private Gemini extraction envelope now requires actual report-day labels and explicitly quoted daily drilling-hour summaries. Public telemetry/API contracts are unchanged. Multiple reported days or inconsistent primary/report labels reject the section before merge; date-less sections remain warned rather than assigned invented dates.
- Drilling summaries are compared after all sections are merged/deduplicated. The FORGE 4.0-hour header versus 3.5-hour explicit timeline produces a source-quoted review warning and never changes timestamps/depths. Unverifiable text summary excerpts are excluded. PDF excerpts remain model-extracted/unverified.
- Eight focused multi-page/source-total tests pass using actual generated PDF documents and mocked Gemini responses; existing provider fixtures now explicitly include the private metadata. TypeScript/lint and full unit suite pass. Live original multi-page checks follow separately; no live success is inferred from these tests.

## Final backend validation — evidence and reliability checkpoint

- Reproduced/fixed whitespace-only evidence retaining high confidence and deduplication dropping a usable quote/lower confidence. Empty quotes now remain empty with LOW confidence and warnings; duplicate intervals retain a supported available quote and the lowest observed confidence.
- Missing-value matrix covers absent/null timestamps, missing depths versus explicit nulls, missing/unsupported activity codes, invalid/overnight intervals, bogus row/page references, private response metadata and unsupported summary excerpts. No unknown value is filled with zero.
- Expanded mocked provider checks cover pre-cancellation, cancellation during generation/backoff, partial-document failures, model capability/output bounds and nonretryable failures alongside existing 45-second attempt / 10-second model / 240-second total-budget tests. Deadlines and retry counts remain unchanged.

## Final backend validation - real multi-page evidence and completion

- Added unchanged-content, attributed public FORGE three-page day and adjacent-day fixtures. Actual Gemini extraction matched 17 intervals/end depths, 1,440 observed minutes and 210 drilling minutes. Surfaced the original 4.0 h header versus 3.5 h timeline; adjacent days rejected with MULTI_DAY_REPORT and no result.
- Retained live failures and mismatches: initial private-schema errors; latest single-day strict comparison fails on an invented excerpt omission marker. Final code withholds abbreviated PDF evidence and sets LOW confidence; the actual observed snippet regression passes, without claiming a later live success. Corrected a typographic inch-mark encoding artifact in expected transcription only.
- Improved bounded response diagnostics and provider ISO-date schema; clarified daily totals versus per-run hours and contiguous evidence. No UI, shared contract, dependency or deadline changes.
- Final checks PASS: 168 tests / 19 files, TypeScript, ESLint, isolated production build, normal post-build TypeScript and 21 final-build HTTP assertions with zero provider calls. Strict latest recorded evidence comparison remains FAIL.
- docs/FINAL-BACKEND-VALIDATION.md records request IDs/timings, exact defects, evidence, mocked/live distinction and limits. Approval review prevented overwriting an existing HTTP evidence file; equivalent API assertions were completed with separate new evidence. Documentation resumed after the user requested continuation following a temporary approval-service limit.
- Local checkpoints only; no push, merge, deploy, Photon, ElevenLabs or infrastructure changes. Pre-existing UI/preflight/reference-kit and reviewed-snapshot work preserved separately.

## Final demo readiness and release verification

- One fresh public three-page FORGE request attempted: 18a1c9bb-bcaa-49a6-a3c3-dd737492e835, 8,158 ms; terminal PROVIDER_BUSY / 503 with no report. Final corrected quote verification remains open. Preserved earlier observations; no extra provider request or deadline change.
- Desktop homepage, production console and Reports navigation visually observed. Snapshot picker opened but could not be targeted. Computer Use subsequently stopped because it could not verify the current browser URL for policy enforcement; no further app input. Mobile, complete keyboard/interactions, downloads, reduced motion and print/PDF review remain unverified.
- Added two actual-FORGE server-rendering checks: real console values/selected evidence and complete 17-event printable markup with explicit scenario/null-carbon behavior. These do not claim browser or pagination verification.
- Final local checks PASS: 170 tests / 20 files, TypeScript, ESLint, isolated production build, normal post-build TypeScript; 21 deterministic HTTP assertions rerun against the final rebuilt server, no provider calls. New reproducible release scripts preserve older evidence.
- Updated DEMO-READY.md; created timed JUDGE-PITCH.md, DEPLOYMENT-CHECKLIST.md and FINAL-RELEASE-REPORT.md with verified/unverified/deferred sections and actual browser/provider limitations. No full-release sign-off claimed.
- No runtime/UI/contracts/dependency changes, push, merge, deploy, Photon or ElevenLabs. Pre-existing working changes are preserved outside the release checkpoint.

## Release-candidate finalization - documentation only

- Inspected Git and preserved existing changes; ten tracked/untracked working files retain identical SHA-256 hashes. No application/test/config/package changes.
- Confirmed cached genuine import/scenario/export/rendering through 11 existing tests / 3 files with Gemini credentials empty: PASS, no provider calls. Prior 170-test / 21-HTTP / TypeScript / lint / build remains the latest full verification; no source-change rerun was needed.
- Created MANUAL-BROWSER-QA.md with exact actions, viewports and deterministic CSV cancellation. Clarified pitch/demo claims: report observations versus extracted interpretations versus derived/scenario amounts, source conflict and unknown carbon.
- Reviewed local environment presence without exposing values and hosting/runtime limitations. Production setup remains unverified. Updated FINAL-RELEASE-REPORT.md and DEPLOYMENT-CHECKLIST.md with confirmed facts and exact unresolved gates.
- Recommend cached-demo rehearsal; hold release sign-off for manual QA and the later successful quote check. No Gemini retry, Photon, ElevenLabs, UI redesign, push, merge or deployment.

## Report-day recovery implementation checkpoint

- Diagnosed MULTI_DAY_REPORT inside the single-day extraction envelope before merge. Fixed two-page chunks do not overlap; repeated identical date labels already deduplicate. Request 4c2864ff-fec9-4a96-a44b-51087de901fb appeared in the old server console with successful generation then date rejection (~15.9 s). Existing Mantle accessibility text showed attached 2021-06-28-and-29-operations.pdf, matching the genuine two-day fixture. Original returned dates/input checksum were not logged.
- Implemented source-reviewed date/page selection on homepage and console. No date/page default, explicit source confirmation, original file retained while recovering, selected pages copied with original page references. Every selected section must independently agree with the chosen date before existing analytics/merge. Missing/conflicting dates and unclear boundaries keep a single-day-PDF fallback. No telemetry schema/dependency/deadline changes.
- Added 38 regressions; full 208 tests / 22 files, TypeScript, ESLint and isolated production build PASS. Normal generated-reference typecheck and new QA-script lint PASS. Existing single-day/date-boundary tests remain passing.
- Final-built HTTP: 28 deterministic checks PASS, zero provider calls. One genuine selected-day call against the public two-day fixture: da58d6c5-22cb-4d79-b760-0c19bd4d8f23, 8,028 ms, PASS; 17 intervals/end depths/source pages and all 17 event excerpts match the original expectations. Only June 28 analyzed, source remains unverified; 4.0 h versus 3.5 h warning retained. No repeated live calls.
- Interactive picker still requires manual browser review; target screenshot did not reliably match the accessibility window, so no unsafe input was attempted. Other pre-existing UI/preflight/reference-kit changes preserved. No push, merge, deploy, Photon or ElevenLabs.

## Rig Supervisor Copilot - retrieval and API checkpoint

- Added isolated copilot request/response schemas and a stateless POST /api/copilot route. Selected browser reports are validated and recalculated by the existing analytics engine; no server report cache, database or embeddings. Gemini ingestion unchanged.
- Added scoped keyword/terminology retrieval, chronological neighbors with explicit validated prior focus, per-report calculations/assumptions/included events, original excerpts and review-warning citations. No numeric arithmetic is delegated to Groq.
- Server-only official Groq REST API uses GROQ_MODEL (configured openai/gpt-oss-20b), strict JSON schema where supported, Zod validation, bounded context/output, 12-second attempts, at most two transient attempts, 40-second route budget, cancellation and safe provider errors. Deterministic fallback is explicitly labeled.
- Groq narrative references must resolve to supplied citation/calculation IDs; uncited factual or numerical/external-link prose is withheld. Source text is untrusted data. No private report contents/keys logged or retained across requests.
- 44 focused retrieval/provider/API tests PASS with mocked providers. TypeScript and scoped lint checked before checkpoint; no live Groq result claimed yet. No push, merge, deploy, Photon or ElevenLabs.

## Rig Supervisor Copilot - console integration checkpoint

- Added Rig Supervisor Copilot navigation and a minimal scoped conversation panel using existing Mantle controls/icons/tokens. Only explicitly checked in-memory reports are posted; well/report controls, contextual suggestions, follow-ups, loading/errors/cancel/clear and bounded session history are connected to the real API.
- Answers include expandable exact original snippets, distinction for review annotations, event/report inspection navigation and deterministic calculation details with filters/period/assumptions/included records/quality warnings. Numeric values are rendered from canonical output. Conversation resets on report-data/scenario changes and scope changes, and stale/cancelled results are withheld.
- Added six client/UI transaction/rendering tests and an eight-question offline FORGE evaluation fixture; these cover markup and data behavior, not a completed browser interaction audit. Existing 44 retrieval/provider/API cases also pass. Groq configuration names documented in .env.example only; .env.local unchanged.

## Rig Supervisor Copilot - observed live reliability correction

- First actual public FORGE question reached Groq intent parsing successfully (AGGREGATE/LONGEST and correct final event focus). Its generated explanation failed grounding checks and was withheld; deterministic evidence and calculations remained available. Request 80b59a74-49a6-41ca-a67f-e6a945b537d6, 1,736 ms. The next follow-up hit GROQ_RATE_LIMIT and fell back correctly, request ddea451f-2974-4359-94c3-8c60471194e5, 79 ms. No further live calls after that limit. Complete live narrative acceptance is not claimed.
- Reduced provider-context duplication and retained only individually validated cited statements, with bounded reason codes for withheld claims. No numerical/citation safeguard removed. Added regression for mixed valid/invalid statements and untrusted injected report text. New behavior is offline-tested, not live-rerun.
