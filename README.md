# BoreSight — evidence-backed geothermal intelligence

A dark, responsive local analytics workspace that converts daily drilling reports into source-linked events, drilling progress, confirmed NPT and benchmark-qualified ILT scenarios.

**Status:** implemented local MVP with a verified synthetic one-page PDF extraction on `gemini-3.1-flash-lite`. The critical ingestion follow-up also verified canonical CSV/XLSX imports without Gemini. The previous `gemini-3.8-flash` model returned high-demand errors. See `INGESTION-FIX-REPORT.md` for current evidence and limits; `OVERNIGHT-RESULTS.md` records the earlier run.

## Run locally

Requires Node.js 22+ and npm. Existing dependencies are locked in `package-lock.json`.

```powershell
npm.cmd ci
# Only if .env.local does not exist: copy .env.example to .env.local.
npm.cmd run dev
```

Open http://localhost:3000 for the Mantle-style BoreSight homepage. Select **Open console** for the existing analysis workspace at http://localhost:3000/console. The homepage upload sends a real report to the existing API and opens its completed analysis in the console. See [homepage integration notes](docs/MANTLE-HOMEPAGE.md).

Save the server-side key in `.env.local`:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
```

Restart the server after changing environment settings. Do not put a key in chat, Git, logs or `NEXT_PUBLIC_` variables. The default model is configurable; Google project access, capacity and quota still apply. [Google structured output documentation](https://ai.google.dev/gemini-api/docs/structured-output), [current model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite).

## What is implemented

- PDF and unstructured CSV/TXT/XLSX ingestion through server-side Gemini structured output and Zod validation. Canonical CSV/XLSX tables with explicit time, activity and classification columns use deterministic parsing without Gemini.
- File, MIME, signature, byte, expanded workbook, row, character and response limits. Oversized sources are rejected rather than silently truncated.
- One local report day, 00:00–24:00. Ambiguous cross-midnight and multi-day inputs must be split/clarified; timestamps are not guessed.
- Evidence snippets and page/row/sheet references; text excerpts are checked against source content. PDF references remain AI-extracted/unverified.
- Pure TypeScript NPT, supported drilling ILT, time coverage, unknown time and optional incremental fuel/CO₂ calculations.
- Dark dashboard, inverted linear hole-depth chart, assumed benchmark illustration, 24-hour activity strip, source drawer and searchable/filterable event table.
- Editable rig rate, drilling benchmark, incremental fuel and emissions factor. Recalculation uses no Gemini call and preserves synthetic provenance.
- Up to 20 in-tab full analyses (including the demo), scenario copies and report comparison. Up to 30 optional browser-local **aggregate summaries**, with deletion controls.
- CSV event export (spreadsheet-formula protection), JSON analysis snapshot export/import (metrics recomputed), and a print stylesheet for a compact operational summary.
- Equipment Vision: PNG/JPEG/WebP upload, validated region-based visual observations, uncertainty and limits. No automatic diagnosis, IADC grade, repair orders or safety clearance.
- **Photon + ElevenLabs remain unimplemented/paused for this mission.** Their old internal files are retained, UI controls are absent, and the old API endpoints return 501 without calling either provider.

## Source integrity

The initial well and all example incidents are `SYNTHETIC_DEMO`, not actual FORGE incidents. Uploaded reports are `PUBLIC_SOURCE_UNREVIEWED`; AI never promotes them to human verified. An imported JSON snapshot cannot promote its verification status either.

Hole measured depth is not bit position. Flat depth alone is not downtime. Missing trip movement means trip ILT is unavailable, not zero. The illustrative drilling benchmark is formation dependent. All dollar/fuel/carbon outputs are scenario models, not measured savings, accounting losses or emissions.

Full reports and excerpts stay in memory unless explicitly downloaded. Local summary saving is opt-in and includes only aggregate metrics, scenario assumptions, well/date labels and depth endpoints. Do not save commercially sensitive labels on a shared device. No raw uploaded files or API keys are stored in the browser.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3100
# In another terminal:
node scripts/smoke.mjs
# Only when you want an actual Gemini call on synthetic data:
node scripts/smoke.mjs --live
```

The `scripts/smoke.mjs --live` check uploads a TXT rendering of the synthetic fixture so it exercises Gemini rather than the deterministic CSV path. `node scripts/verify-ingestion.mjs` verifies canonical CSV/XLSX without Gemini; append `--live` to generate and extract a real one-page synthetic PDF. All checks assert 3 events, 60 NPT minutes and synthetic provenance. It never fabricates a successful result. In this Windows agent sandbox, Vitest/esbuild needed approved execution outside the sandbox to read its config. This is an environment constraint, not a failing test.

For manual viewport, keyboard, print and three-minute demo checks, see [docs/SOLO-QA-RUNBOOK.md](docs/SOLO-QA-RUNBOOK.md). Existing screenshots in `docs/screenshots` predate the dark redesign; they are not evidence of the new UI.

## APIs

| Endpoint | Request | Result |
|---|---|---|
| `GET /api/analytics` | none | labeled synthetic report |
| `POST /api/analytics` | `{extraction, scenario?, sourceKind?}` | recalculated report; no Gemini call |
| `POST /api/ingest` | multipart `file` | validated report or meaningful non-2xx error |
| `POST /api/vision` | multipart image `file` | unverified observations or meaningful error |
| `POST /api/briefing`, `/api/dispatch` | paused | 501; providers never called |

Canonical schemas: `src/types/telemetry.ts` (v1.1) and `src/types/vision.ts`. All server credentials stay server-side. HTTP errors include a stable `code` where appropriate; no raw provider URLs or key-bearing errors are returned.

## Real-source verification still required

The public [Utah FORGE GDR submission 1330](https://gdr.openei.org/submissions/1330) was rate limited (HTTP 429) during this run. No real DOE/FORGE document was downloaded, redistributed or successfully extracted. Follow the runbook to verify a legally accessible single-day source against original times, depths and pages.

This local prototype has no production authentication, durable source storage, or per-user rate limiting. Do not deploy it publicly without those controls. No infrastructure was provisioned, no remote branch was pushed, and no deployment was performed.
