# Current solo architecture — Contract v1.1

This describes the implemented non-P4 local MVP. Old four-person ownership and light-theme documents are historical. `AGENTS.md` and `OVERNIGHT-MISSION.md` govern this branch.

## Data path

```text
PDF / CSV / XLSX / TXT
  -> validated bytes, extension, MIME, signature and expansion/content limits
  -> explicit canonical table parser OR Gemini structured JSON in bounded page/row sections
     (verified configurable model; two transient attempts maximum; 45 seconds per attempt; 240 seconds overall)
  -> ExtractionSchema, text excerpt/row verification and timeline validation
  -> pure buildWellReport(extraction, scenario, sourceKind)
  -> canonical WellTelemetryReportSchema
  -> selected in-tab report -> dark dashboard / source drawer / CSV / JSON / print
```

`src/types/telemetry.ts` is the canonical runtime and TypeScript contract. v1.1 preserves the v1 event/scenario field names and adds optional `evidence.row`/`sheet`, canonical report output schemas, and metrics for unknown/unobserved minutes, report-day coverage and drilling-benchmark eligibility. Old snapshots are parsed conservatively, recomputed, and never promoted to human verified.

Current ingestion follow-up: canonical CSV/XLSX parsing bypasses Gemini; PDFs are validated and chunked with original page mapping; streamed stages commit only on a validated terminal result. Model default is the live-verified `gemini-3.1-flash-lite`. See `INGESTION-FIX-REPORT.md` for timings, test evidence and remaining limits.

## Time, depth and assumptions

- One local day, integer minutes 0..1440. 24:00 is a valid end. Start/end order, unique IDs and nonoverlapping intervals are mandatory; invalid input is rejected with actionable errors.
- Ambiguous overnight/multi-day sources are not automatically split or dated. Use one report day; model instructions exclude unsupported intervals and require warnings.
- Observed time is the union of validated, nonoverlapping events. Unknown classification is observed but not productive/NPT. Unobserved is 1440 minus observed; neither is assumed productive.
- Hole depth is retained at actual supplied endpoints. Missing values/gaps are not carried forward. Decreases remain visible with explicit source-review warnings; there is no artificial monotonic repair.
- NPT is only explicitly classified unplanned time. ILT applies only to productive DRILLING with positive observed hole advance and an assumed benchmark. Trips and unsupported intervals have null ILT.
- Modeled cost uses NPT plus eligible ILT, not overlapping intervals. The efficiency definition is `(productive - qualified ILT) / classified`; benchmark eligibility is shown because other potential ILT is unknown.
- Fuel differential is optional/null for real uploads. CO₂ is a counterfactual scenario, not a sensor measurement. The built-in synthetic example explicitly configures an illustrative differential.

## Provenance

Source filename is established by the server. Text/PDF extraction is unverified; a model cannot certify human verification. Excerpts not found in supplied text are removed and flagged; invalid/ambiguous row references are removed. PDF page/excerpt claims require original-source review, explicitly stated in the report and drawer. Synthetic fixtures are identified with the `SYNTHETIC_DEMO` filename/content marker and remain labeled end-to-end. No failed upload substitutes seed data.

## Persistence and exports

- Up to 20 full reports in memory, keeping the built-in demo available. Leaving/reloading the tab loses full analyses unless exported.
- Optional browser-local storage: up to 30 aggregate summaries, bounded schema and serialized size; explicit Save/Delete/Clear controls. No raw files, source notes/snippets or credentials are stored.
- JSON snapshot import is limited to 2 MB, runtime validated, and recalculates metrics. Claimed human verification is downgraded. CSV neutralizes spreadsheet-formula payloads and includes assumptions and evidence references. Print intentionally summarizes the top five exposure intervals and four warnings; the full event record remains in CSV/JSON.
- Comparisons show observed endpoint change, report coverage, source kind, NPT, eligible ILT, benchmark and rate assumptions. NPT bars share a linear scale. They do not normalize geology or establish avoidability.

## Equipment vision

`POST /api/vision` accepts a validated PNG/JPEG/WebP under 6 MB. Output is `UNVERIFIED_VISUAL_OBSERVATIONS`, with visible regions, descriptions, visibility confidence, quality and limitations. It has no diagnosis, cause, grading, repair or safety-clearance contract. Photographs are not persisted. Live results were not verified during the provider outage.

## Errors and operational scope

Meaningful non-2xx errors include missing key/file, unsupported MIME/type, limits, bad signatures/JSON/schema, empty extraction, invalid timeline, provider busy/model/auth/quota/timeout. Safe errors never return raw key-bearing provider responses. The local server has no production auth, per-user quotas, durable jobs or private multi-tenant storage; public deployment is outside this mission.

Voice and dispatch endpoints return 501 FEATURE_PAUSED and do not import/call the old provider implementations. Existing P4 internals are retained without further work. **Photon + ElevenLabs remain unimplemented/paused.**
