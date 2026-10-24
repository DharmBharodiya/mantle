# BoreSight critical ingestion fix report

Date: 2026-10-24 (America/New_York). Branch: `feat/solo-overnight`.

## Outcome

Implemented and verified the ingestion fix without redesigning the dashboard or changing analytics formulas. Canonical CSV/XLSX imports now work without Gemini. An actual Gemini extraction of a generated one-page synthetic drilling PDF **passed** on `gemini-3.1-flash-lite`, producing 3 events and 60 NPT minutes with `SYNTHETIC_DEMO` provenance. This was a real provider request, not mocked extraction output.

The operator's `.env.local` model was changed to the model that passed that test. The API key was preserved exactly, was not printed, and remains ignored by Git. The server fallback and `.env.example` now use the same model. Restart an existing development server to pick up this setting.

## Root cause: observed evidence versus inference

The original timeout message alone could not identify the operation that timed out. Before this fix, the adapter mapped SDK abort/timeouts to one `PROVIDER_TIMEOUT` error and passed `req.signal` through without distinguishing client cancellation. No per-stage timings were available. The original failing document was not available for inspection, so its page count, scan complexity and exact original timeout cause are **not proven**.

The investigation established:

1. **Yes, the original PDF path sent the entire PDF as one base64 inline attachment in one generation call.** It had no PDF page parser, no page-count limits/chunks and no bounded chunk scheduler.
2. **Structured tables made unnecessary generation calls.** Even a CSV/XLSX containing explicit canonical activity/classification/time columns was converted into text and sent to Gemini.
3. **The configured model existed, but generation was unhealthy.** A metadata request for `gemini-3.8-flash` returned HTTP 200 with `generateContent` support in approximately 799 ms. A separate tiny synthetic structured-output probe, with a minimal schema, low thinking and a 256-token cap, reached its 15-second diagnostic deadline at about 14.5 seconds. That request had no PDF or spreadsheet preprocessing. Model availability therefore did not establish generation availability.
4. **The new instrumented reproduction directly isolated the busy failure to generation.** On the configured `gemini-3.8-flash`, a generated 1-page, 1,244-byte PDF took about 1 ms to prepare, 15 ms to parse/chunk, and 438 ms to verify the model. Generation returned provider-busy after 7,357 ms; the single bounded retry returned busy after 12,232 ms. The request ended at approximately 20,551 ms, not at the old two-minute preprocessing limit. This is direct evidence of provider capacity failure for that reproduction, rather than document size or local parsing.
5. **A supported alternative completed real extraction.** `gemini-3.1-flash-lite` metadata returned HTTP 200 with generation support. With the same generated single-page scenario, model verification took 341 ms. Attempt 1 returned busy after 38,534 ms; a 500 ms backoff preceded attempt 2, which succeeded in 9,997 ms. Total client-observed elapsed time was **49,437 ms**. The returned activities and deterministic metrics passed the assertions (3 events; 60 NPT minutes). Generation usage reported 899 input tokens, 552 output tokens and 1,076 thinking tokens.

The original 32,768-token output ceiling and default thinking were avoidable latency risks, but their contribution to the user's earlier timeout was not measured in an A/B test. A large ceiling does not prove that all those tokens were generated. Reducing them is an optimization, not an unsupported claim about the original root cause.

## Exact changes

### Provider adapter — `src/lib/server/gemini-client.ts`

- Model identifier is configurable through `GEMINI_MODEL`, validated/normalized and checked through `models.get` before sending source content. Successful capability checks are cached for five minutes, keyed by a server-side hash of key/model; no key is logged or sent to the client.
- Ingestion uses an 8,192-token output ceiling instead of 32,768 and concise source extraction fields. Canonical IDs and filenames are server-established rather than generated repeatedly.
- Supported Gemini 3 text models use LOW thinking. Gemini 2.5 Flash-family models use thinking budget 0 if selected and available. Unknown families receive no guessed thinking setting. The verified configured model is `gemini-3.1-flash-lite`.
- SDK automatic retries remain disabled. At most **2 generation attempts per section** use explicit exponential-backoff logic (500 ms for the single allowed retry).
- Only recognized transient service/gateway errors and explicitly transient rate-limit responses are retried. Authentication/model errors, exhausted daily quota, invalid/truncated JSON, local deadlines and cancellation are not automatically retried.
- Each ingestion generation attempt is bounded to 45 seconds, model verification to 10 seconds. Timed-out work is not automatically duplicated because provider processing may continue.
- Calls to the existing shared adapter outside ingestion retain their existing default options. No Photon/ElevenLabs implementation was added or called.

### Deterministic tables — `src/lib/ingestion/structured.ts`, `prepare.ts`

- CSV preprocessing retains parsed cells and original record numbers; XLSX retains sheet/row/cell text without executing formulas.
- Explicit tables containing `activity`, `classification` and `startMinute/endMinute` or `startTime/endTime` are parsed directly. Canonical activity/classification enums and numeric/HH:MM times are required; values are not inferred from ambiguous labels.
- Optional `wellName`/`wellId`, `reportDate`, `startHoleDepthFt`, `endHoleDepthFt`, `note`/`observation` columns are preserved. Missing depths remain null. Missing metadata remains unknown with analytics warnings.
- Mixed unrecognized workbook sheets, invalid rows, extra data beyond column headers, multi-day/multi-well content and incomplete tables are rejected explicitly rather than silently skipped.
- Exact repeated observations are deduplicated; conflicting overlapping observations are preserved for explicit timeline rejection. Stable server event IDs and chronological ordering are retained.
- `src/lib/analytics/compute.ts` and its metric formulas were **not changed** by this fix.

### PDF/logical chunks — `src/lib/ingestion/chunks.ts`, `gemini.ts`

- Added the focused `pdf-lib` dependency (locked version 1.17.1) for real PDF validation, page counting and page copying. No framework rewrite or OCR service was added.
- Small PDFs (at most 2 pages and 2 MB) remain a single attachment without unnecessary re-encoding.
- Larger PDFs up to 24 pages are split into 2-page sections. Large 2-page payloads split further to single pages. A single page over 4 MB, excessive page/object count, encrypted/corrupt PDF, or excessive text sections produces an actionable limit error; nothing is silently truncated.
- Model section processing runs with **at most 2 workers**. A failed section aborts sibling waits and prevents partial report import. The full request budget applies to all sections and retries.
- Model-local page references are mapped through the chunk's original page list. A one-page section has an objectively known original page; invalid multi-page claims become null with a warning. PDF excerpts remain AI-extracted/unverified.
- Unstructured text is grouped by original rows (up to 50 rows / roughly 10,000 source characters per section; at most 12 sections). Exact source row/sheet references and checked text excerpts remain available.
- Mixed report dates/wells are rejected after merge. This is still a single-local-day report contract; a multi-day document is not silently selected or incorrectly concatenated.

### Deadlines and safe instrumentation — `src/lib/ingestion/context.ts`

- Overall ingestion processing budget: **240 seconds**; Next route ceiling hint: **270 seconds**; existing browser deadline remains **300 seconds**. Per-model-call waiting was reduced, not blindly extended.
- Parent request cancellation is `INGEST_CANCELLED` (499), independent of generation timeout (`PROVIDER_TIMEOUT`, 504), model-check timeout, or overall `INGEST_DEADLINE` (504).
- Content-free JSON diagnostics include a random request ID, phase, duration/elapsed milliseconds, attempt number, safe error code, byte/page/row/section counts and token counts when provided. They do not include API keys, filenames, document text, excerpts, raw SDK messages or key-bearing URLs.
- JSON responses carry `X-Request-Id` and measured `Server-Timing`. Progress streams carry the request ID so UI errors can be matched to timing records.

### Actual progress — API route, protocol types, upload helper and page

- `src/types/ingestion.ts` defines runtime-validated stage/result/error messages.
- The dashboard now requests NDJSON progress and displays **Uploading document → Preparing report → Extracting activities → Validating events → Computing analytics → Report ready**. Extraction-section counts are actual completed sections, never invented percentages.
- Normal JSON API clients retain non-2xx errors and the existing successful report shape. Early upload errors (missing file/type/size) remain non-2xx even in streaming mode.
- A progress stream's HTTP 200 accepts only the transport; it is **not** an import success. Streaming errors include their explicit status/code. The client commits only a complete, schema-validated terminal `result` after the stream completes. A ready stage alone, malformed/disconnected stream, error envelope or cancellation cannot replace the old report.
- `src/app/page.tsx` changes are limited to upload-stage text/callbacks and source wording that remains accurate for deterministic parsing. The dark layout/styles were not redesigned.
- The existing `upload-deadline.ts` five-minute browser deadline is unchanged.

### Build isolation and verification scripts

The first production HTTP smoke check hit inconsistent `.next` artifacts (`Cannot find module './611.js'`), even though the build had passed. Verification now supports `BORESIGHT_INGESTION_CHECK=1`, writing to a fixed ignored `.next-ingestion-check` directory so an IDE dev server cannot overwrite its chunks. The isolated build and HTTP smoke checks subsequently passed. Necessary ignore/type paths were updated; the normal app keeps its existing `.next` default.

- `scripts/verify-ingestion.mjs`: default runs actual canonical CSV/XLSX HTTP imports without Gemini. `--live` additionally generates a permitted one-page synthetic drilling PDF and exercises actual Gemini extraction with assertions.
- `scripts/smoke.mjs --live`: now sends a TXT version of its fixture so it still exercises Gemini instead of falsely labeling the new deterministic CSV path as a live model call.
- README documents the current model, current live evidence and these commands.

## Tests performed

| Command/check | Observed result |
|---|---|
| `npm.cmd run typecheck` | PASS on final source and normal generated type references |
| `npm.cmd test` | PASS — **72 tests in 10 files** |
| `npm.cmd run lint` | PASS |
| `npm.cmd run build` | PASS (default output; initial runtime smoke exposed artifact collision) |
| `$env:BORESIGHT_INGESTION_CHECK='1'; npm.cmd run build` | PASS on final source and verified-model configuration |
| `node scripts/smoke.mjs` against isolated production server | PASS — all 7 existing HTTP checks |
| `node scripts/verify-ingestion.mjs --live` with `gemini-3.8-flash` | CSV PASS (~206 ms), XLSX PASS (~98 ms), live PDF provider-busy after 2 attempts |
| Same command with temporary `gemini-3.1-flash-lite` server override | **ALL PASS** — CSV ~213 ms; XLSX ~114 ms; actual live PDF ~49,437 ms |

New tests cover: no-key canonical CSV/XLSX, exact row/sheet evidence, incomplete/invalid/empty/multi-day structured sources, deduplication/conflicts, real one-page PDF structure, 5-page chunk coverage, excessive pages, original-page mapping, concurrency cap, model availability, supported thinking/output settings, transient backoff, no retries for quota/auth/invalid output, model/generation/caller/overall deadlines, privacy of diagnostic fields, normal non-2xx timeout responses, terminal busy errors, server stage ordering, split UTF-8 progress frames, incomplete/error/cancelled streams and previous-report preservation. Existing deterministic analytics/export/dashboard tests continue to pass.

No successful extraction in this report is inferred from a mock, a fixture reset, an accepted HTTP stream, a model listing or a UI toast. The live PDF success was observed and asserted against the actual returned activities/metrics.

Final rechecks also passed: `node scripts/verify-ingestion.mjs` imported canonical CSV/XLSX in about 200 ms / 116 ms on the final isolated production build; `node scripts/smoke.mjs` passed all 7 checks. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test` (72 tests), and the final isolated production build passed. No real provider success is claimed beyond the observed synthetic PDF test.

## Reproduce and next use

Restart the normal development server after the model/configuration update:

```powershell
npm.cmd run dev
```

Upload `demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv` to verify the deterministic path immediately. Expected: 3 source events, 60 NPT minutes, synthetic provenance. For actual provider verification on the active default port:

```powershell
$env:BORESIGHT_TEST_URL = 'http://127.0.0.1:3000'
node scripts/verify-ingestion.mjs --live
```

For isolated production verification, stop any agent-owned test server on port 3100 and run:

```powershell
$env:BORESIGHT_INGESTION_CHECK = '1'
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3100
# In another terminal:
node scripts/verify-ingestion.mjs
# Add --live only when deliberately testing an actual synthetic Gemini PDF call.
```

## Remaining limitations

- Google can still return high-demand, quota and transport errors. The passing alternative-model request itself needed its single retry. This is not an availability or latency guarantee for every document.
- Only a generated synthetic one-page PDF was tested live. Five-page behavior/page references and corrupt/oversized PDF cases were tested offline. The user's original file size/contents were unavailable; no real geothermal PDF extraction is claimed verified.
- Large sources remain bounded by 24 pages, section/output limits and a 240-second overall budget. Bigger/multi-day documents need splitting or a future durable background-job design; no partial success is fabricated.
- Deterministic fast-path tables require explicit canonical column meanings and values. Ambiguous/free-form tables still require Gemini; this does not invent classification from raw notes.
- Chunk boundaries can split an incomplete source table/event. Unsupported times remain warnings/excluded, conflicts reject the import, and unknown values remain null. Human source review is still required, especially for OCR and PDF quotes.
- Hosting platforms can impose a limit shorter than the route's 270-second hint. Streaming may be buffered by an intermediary. Set host limits appropriately or use durable jobs before public deployment; the local verification does not establish a hosted runtime SLA.
- No browser surface was available to the agent. Progress parser/server protocol and preservation were automated-tested; actual interactive browser rendering remains a manual check.
- No push, merge, deployment, destructive operation, ElevenLabs work or Photon work was performed.

## References consulted

- [Google thinking configuration](https://ai.google.dev/gemini-api/docs/generate-content/thinking): supported LOW thinking and model-dependent budgets.
- [Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite): model identification and extraction suitability; actual key availability and generation were separately tested.
- [PDF-LIB PDFDocument](https://pdf-lib.js.org/docs/api/classes/pdfdocument): page counting/copying without changing source page order.


## File inventory
- `.env.example`
- `.gitignore`
- `README.md`
- `SOLO-PROGRESS.md`
- `OVERNIGHT-RESULTS.md`
- `docs/SOLO-ARCHITECTURE.md`
- `docs/SOLO-QA-RUNBOOK.md`
- `eslint.config.mjs`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `scripts/smoke.mjs`
- `scripts/verify-ingestion.mjs`
- `src/app/api/ingest/route.ts`
- `src/app/page.tsx`
- `src/components/dashboard/report-view.ts`
- `src/components/dashboard/report-view.test.ts`
- `src/lib/ingestion/prepare.ts`
- `src/lib/ingestion/gemini.ts`
- `src/lib/ingestion/chunks.ts`
- `src/lib/ingestion/context.ts`
- `src/lib/ingestion/structured.ts`
- `src/lib/server/gemini-client.ts`
- `src/types/ingestion.ts`
- `tests/ingestion.test.ts`
- `tests/gemini-client.test.ts`
- `tests/ingestion-pipeline.test.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `INGESTION-FIX-REPORT.md` (this report)

Runtime-only change: `.env.local` model setting; the ignored credential file is never committed.
