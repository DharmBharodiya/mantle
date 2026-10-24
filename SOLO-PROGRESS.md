# BoreSight solo progress

Branch: `feat/solo-overnight`. Mission started 2026-10-24 (America/New_York).
User's existing mission/rule files and all previous dashboard work are preserved.

## Milestones
- DONE — 1. Audit, baseline test/lint fixes, initial checkpoint.
- IN PROGRESS — 2. Bounded server-side Gemini ingestion, provenance and explicit errors.
- TODO — 3. Analytics invariants, honest missing data, scenario recalculation.
- TODO — 4. Complete dark responsive workspace and source inspection.
- TODO — 5. Local report management, comparison, CSV/JSON and print exports.
- TODO — 6. Equipment vision, cautious observations and offline tests.
- TODO — 7. Live/public-source checks where available, final QA and runbooks.

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

