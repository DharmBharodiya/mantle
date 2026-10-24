# BoreSight overnight results

Date: 2026-10-24 (America/New_York). Branch: `feat/solo-overnight`.

## Outcome

All locally feasible non-P4 MVP implementation is complete and committed. Automated checks and the offline HTTP golden path pass. External/model/browser acceptance remains explicitly unverified; this is not a claim of production readiness or a successful live real-data extraction.

**Photon + ElevenLabs remain unimplemented/paused.** Their old internal code is preserved, their UI controls are absent, and the old endpoints return 501 without contacting providers. Neither provider was called or integrated during this run.

## Completed milestones and local commits

| Commit | Milestone |
|---|---|
| `1d491aa` | Audit, repair baseline Vitest alias and lint scope, add progress tracking and generated/sensitive artifact exclusions. |
| `6276fed` | Canonical v1.1 schemas, file preparation, safe bounded Gemini adapter, source checks, explicit errors, deterministic analytics, image observation backend, regression tests; disable old P4 routes. |
| `4109188` | Full dark responsive workspace, shared evidence drawer, activity ribbon, benchmark settings and comparison, local aggregate summaries, CSV/JSON/print exports, equipment UI, additional ingestion limits, docs/fixtures/smoke checks. |

A final documentation-only checkpoint records this results file and the supplied solo mission instructions. No pushes, merges, deployment, new accounts, database provisioning or destructive commands were performed. The agent-owned temporary smoke-test server is stopped after verification. Existing user files were preserved. Dependencies and lockfile did not need upgrades or installations.

## Product behavior

- Dark industrial-luxe design with sans fallbacks, restrained gradients, responsive layout rules, keyboard focus, reduced motion and explicit source labeling.
- Initial synthetic sample remains fully functional without credentials; Reset restores its original assumptions. A failed request preserves the previous report.
- PDF/CSV/XLSX/TXT ingestion validates extension/MIME/signatures, max 8 MB, UTF-8/UTF-16, 1,500 text/workbook rows, 120,000 prepared characters, workbook expansion and model response limits. No source rows/content are silently truncated. Customer/non-drilling files produce a no-events error.
- Gemini is used only for source extraction/description. Server-side Zod validates results; duplicates, invalid/cross-midnight intervals, overlaps and invalid dates are rejected. Text evidence is verified against original supplied text; source row/sheet references are retained only when supportable. PDF page claims are explicitly AI-extracted/unverified.
- Pure TypeScript computes productive/NPT/unknown/unobserved time, coverage, drilling-qualified ILT, benchmark coverage and economic/fuel/carbon scenarios. Flat holes are not classified as downtime; trips cannot derive ILT from hole depth. Decreases are retained with warnings instead of repaired.
- Interactive linear, inverted depth chart; hypothetical benchmark segments are labeled and optional. Classified NPT overlays are separate. Chart, activity strip, event table and Pareto categories open a common exact-source native dialog with Escape and focus restoration logic.
- Scenario inputs recalculate through `/api/analytics` with no new Gemini call. Synthetic provenance remains synthetic. Carbon stays null when incremental fuel is unknown.
- Up to 20 in-tab full analyses, scenario copies and comparisons. Comparison includes endpoint span, coverage, NPT, supported ILT and assumptions, with warnings about geology and incomparable conditions. No second result is fabricated to fill an empty comparison.
- Optional browser-local history holds up to 30 aggregate summaries, with Delete/Clear controls and no raw uploads, source excerpts or credentials. Full report evidence survives only through an explicit downloaded JSON snapshot.
- CSV protects against spreadsheet-formula injection and exports exact evidence references plus scenario settings. JSON imports are runtime checked, recompute metrics and cannot promote human verification. Print styles summarize a sample onto a compact operational sheet; actual pagination needs manual browser review.
- Equipment Vision validates PNG/JPEG/WebP under 6 MB, checks signatures and returns schema-validated visible-region descriptions, image quality, visibility confidence and limitations. No diagnosis, definitive IADC grade, repair order or safety clearance is part of its output contract. Live behavior is not claimed verified.

## Exact verification commands and observed results

| Command | Final result |
|---|---|
| `npm.cmd run typecheck` | PASS |
| `npm.cmd test` | PASS — 48 tests in 8 files; approved execution outside Windows sandbox required for Vitest/esbuild config loading |
| `npm.cmd run lint` | PASS — no warnings/errors |
| `npm.cmd run build` | PASS — 9 routes compiled/generated, home first-load JS approximately 256 kB |
| `npm.cmd run start -- --hostname 127.0.0.1 --port 3100` | PASS — local production test server started; later stopped |
| `node scripts/smoke.mjs` | PASS — 7 actual HTTP checks |
| `node scripts/smoke.mjs --live` | FAIL/BLOCKED — no successful Gemini extraction observed; details below |
| `git diff --check`, `git diff --cached --check` | PASS after correcting EOF whitespace |
| `git check-ignore .env.local` | PASS — ignored; credentials were not staged |
| `git grep --cached -l -E 'AIza[0-9A-Za-z_-]{30,}'` | No staged matches (grep exit 1 means no matches); filenames only would have been displayed |

The 7 HTTP checks observed: dashboard HTML/source labels, 9-event synthetic API seed, rate recalculation with NPT scenario cost $50,000, null carbon and rejection of client-promoted verification, invalid analytics JSON (422), unsupported file (415), and invalid equipment signature (415). These are server/HTML integration checks, not browser E2E tests.

Original baseline failures were repaired: Vitest's unresolved `@/` imports and ESLint scanning `.next` generated files. One intermediate build caught a removed numeric formatter helper and one intermediate lint caught a JSX apostrophe; both were fixed before the final checks. New configuration bundling initially hit sandbox directory access restrictions; approved test execution passed. No machine security policy was changed.

## External blockers and untested acceptance

1. **Gemini generation:** The sandboxed local server first returned `502 PROVIDER_ERROR` because network access was restricted. An approved network-enabled test server then failed on the configured model. A tiny direct synthetic probe reported `Retryable HTTP Error: Service Unavailable`. An isolated older-model structured-output probe reported `Non-retryable exception Not Found sending request` for `gemini-2.5-flash`. The safe adapter now maps these statusless SDK messages to provider-busy/model errors; no raw key-bearing responses reach the UI. The documented fallback is current `gemini-3.8-flash`; the user's `.env.local` was not changed. No endless retries were made. **No live synthetic or real drilling extraction succeeded during this run.**
2. **Real geothermal input:** Public GDR submission https://gdr.openei.org/submissions/1330 returned HTTP 429. No actual DOE/FORGE report was retrieved, redistributed or extracted. The exact real-source verification procedure and source link are in `docs/SOLO-QA-RUNBOOK.md`.
3. **Equipment Vision live request:** Not verified during the same provider outage. Offline image/schema/invalid-output/missing-key/provider-error tests pass. No mocked observations are presented as live success.
4. **Browser QA:** Computer-use inventory returned no apps or browsers. No new dark screenshots were captured, and no actual 390px/1366px interaction, native print pagination, localStorage UI interaction or dialog focus test was observed. Responsive rules, semantics and source output are implemented and SSR-tested; the runbook lists the manual checks. Existing `docs/screenshots/dashboard-desktop.png` and `dashboard-mobile.png` predate the redesign and are historical only.
5. **Local prototype boundaries:** Authentication, durable background extraction jobs, multi-day/DST semantics, production per-user rate limiting, persistent source storage and geology-normalized well rankings are outside this local MVP. Do not deploy it publicly without those controls.

## Dataset and artifact provenance

- Built-in `src/data/demo-report.ts` is the existing fabricated geothermal example, visibly synthetic.
- `demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv` is newly authored synthetic test data: 3 intervals, 60 NPT minutes, four observed hours. It is not from a real source.
- Test image is an embedded synthetic 1×1 PNG used only for offline validation tests.
- No new UI screenshots or real-source files are claimed.
- README, current architecture notes, source fixture notes and the three-minute demo/manual QA runbook are provided.

## ONE exact next action on waking

Run `npm.cmd run dev` from this repository. The runbook at `docs/SOLO-QA-RUNBOOK.md` contains the subsequent manual and live-source review procedure.

## Changed files through the implementation checkpoints

- `.env.example`
- `.gitignore`
- `README.md`
- `SOLO-PROGRESS.md`
- `demo-fixtures/README.md`
- `demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv`
- `docs/SOLO-ARCHITECTURE.md`
- `docs/SOLO-QA-RUNBOOK.md`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `scripts/smoke.mjs`
- `src/app/api/analytics/route.ts`
- `src/app/api/briefing/route.ts`
- `src/app/api/dispatch/route.ts`
- `src/app/api/ingest/route.ts`
- `src/app/api/vision/route.ts`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/analytics/Bottlenecks.tsx`
- `src/components/analytics/EventDrawer.tsx`
- `src/components/analytics/EventTable.tsx`
- `src/components/dashboard/ActivityTimeline.tsx`
- `src/components/dashboard/ComparePanel.tsx`
- `src/components/dashboard/DepthChart.tsx`
- `src/components/dashboard/KpiStrip.tsx`
- `src/components/dashboard/PrintSummary.tsx`
- `src/components/dashboard/ReportsPanel.tsx`
- `src/components/dashboard/RigHealth.tsx`
- `src/components/dashboard/ScenarioPanel.tsx`
- `src/components/dashboard/Sidebar.tsx`
- `src/components/dashboard/VisionPanel.tsx`
- `src/components/dashboard/report-view.test.ts`
- `src/components/dashboard/report-view.ts`
- `src/components/dashboard/upload-deadline.test.ts`
- `src/components/dashboard/upload-deadline.ts`
- `src/lib/analytics/compute.ts`
- `src/lib/ingestion/gemini.ts`
- `src/lib/ingestion/prepare.ts`
- `src/lib/report-warnings.ts`
- `src/lib/reports/manage.ts`
- `src/lib/server/errors.ts`
- `src/lib/server/gemini-client.ts`
- `src/lib/vision/inspect.ts`
- `src/types/telemetry.ts`
- `src/types/vision.ts`
- `tests/analytics.test.ts`
- `tests/compute.test.ts`
- `tests/dashboard-render.test.tsx`
- `tests/ingestion.test.ts`
- `tests/reports.test.ts`
- `tests/vision.test.ts`
- `vitest.config.ts`

Documentation checkpoint also includes OVERNIGHT-RESULTS.md and the unchanged user-supplied solo mission/launcher instruction pack.
