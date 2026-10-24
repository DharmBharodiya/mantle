# 02 — Technical architecture, strict contract, analytics semantics

## System topology

```text
Browser (Next.js, React, Tailwind, Recharts)
  │
  ├─ GET  /api/analytics       ← seeded synthetic fixture
  ├─ POST /api/ingest          ← P1: multipart PDF/XLSX/CSV
  │        ├─ PDF: inline multimodal Gemini content
  │        ├─ XLSX: ExcelJS to plain row text
  │        ├─ CSV/TXT: text content
  │        └─ Gemini Structured JSON → Zod validated Extraction
  │                                         │
  ├─────────────────────────────────────────┤
  │                     P2: Deterministic computeWellReport
  │                     ├─ timeline QA + warnings
  │                     ├─ NPT & qualified ILT
  │                     ├─ cost scenario + emissions scenario
  │                     ├─ monotonic hole-depth chart
  │                     └─ source-linked event insights
  │                                         │
  ├─ dashboard event selection ↔ evidence   │
  ├─ POST /api/briefing ← P4: deterministic summary → ElevenLabs MP3
  └─ POST /api/dispatch ← P4: Photon Beta existing conversation → accepted, not delivered

Optional P1 extension: append extracted snapshots to Tiger Data/TimescaleDB behind a repository interface.
```

## Frozen type contract
The only authority is `src/types/telemetry.ts`. **Do not silently evolve contract fields in feature branches.** Each event contains `startMinute`, `endMinute` (0…1440 within one local report day), activity enum, `classification` (`PRODUCTIVE|NPT|UNKNOWN`), `startHoleDepthFt` and `endHoleDepthFt` (nullable), and explicit `evidence={fileName,page,snippet}`. Calculated `insights` live OUTSIDE the original event and include independently calculated `iltMinutes` and cost estimates. A `WellTelemetryReport` combines extraction, scenario and computed outputs.

### Why minutes rather than HH:MM strings
Hackathon P0 handles a single local day. Integer minute offsets eliminate `10:30 PM` parsing errors, avoid time zone manipulation at the UI layer and enable simple mathematical invariants. For multi-day or midnight-crossing reports add `shiftStartISO`, `event timestamp`, DST/timezone semantics **by a coordinated versioned contract change**. Unknown times should be excluded from computations and produce an explicit warning, not guessed.

### Critical well engineering distinction
- **Hole depth (measured depth)** is the deepest drilled depth, usually nondecreasing.
- **Bit depth** can DECREASE during trips out of hole and INCREASE while running in. These must not be confused.
- The main chart visualizes **hole measured depth**; flat lines indicate *no new penetration*, NOT necessarily equipment failures. Expected flat intervals include circulation, cementing, casing, maintenance and tripping. Downtime is identified by classified report text, not geometry alone.
- The starter's tripping ILT function deliberately returns null: you cannot calculate trip speed using *hole* depth values. Extend schema with separate start/end bit-depth to compute tripping efficiency. Never fabricate it from hole depth.

## Deterministic computation reference

Let `d = endMinute - startMinute` for each event. Events must be ordered, valid and nonoverlapping. The code rejects impossible overlaps rather than quietly fixing them.

- **NPT minutes:** sum of durations explicitly classified `NPT`.
- **Productive minutes:** sum of durations explicitly classified `PRODUCTIVE`.
- **Classified minutes:** productive + NPT. `UNKNOWN` duration not included in efficiency denominator.
- **Drilling benchmark minutes:** `max(0, endHoleDepthFt-startHoleDepthFt) / drillBenchmarkFtPerHour * 60` for comparable `DRILLING` productive events only.
- **ILT minute opportunity:** `max(0, actualMinutes - benchmarkMinutes)` capped at actual duration. No ILT inferred if depth is unavailable, classification unknown, NPT already recognized or activity is not comparable.
- **Efficiency percentage (clearly labeled prototype definition):** `100*(productiveMinutes - ILTMinutes)/classifiedMinutes`. Null if classifiedMinutes=0.
- **Scenario rig hourly rate:** `rigDailyUsd / 24`; default `$120,000/day` is **not an established day rate for any particular source well**.
- **NPT cost scenario:** `NPT_min/60 * rigHourlyRate`.
- **Potential ILT cost opportunity:** `ILT_min/60 * rigHourlyRate`.
- **Total estimated time exposure:** NPT cost + ILT opportunity, not actual accounting loss.
- **Emissions model:** if (and ONLY if) site team provides an assumed `excessFuelGallonsPerHour`, `modeledExcessFuel = (NPTmin+ILTmin)/60 × excessFuelGallonsPerHour`; `modeledExcessCO2tons = modeledExcessFuel × kgCO2PerGallon /1000`. This is a **counterfactual scenario**, not an exact meter reading. Unknown fuel differential → null, not zero.

**Geology warning:** a fixed 35 ft/hr ROP benchmark in hard rock is demonstration math, NOT a technically defensible industry universal. P1 source extraction must not classify ILT; P2 allows adjustment by lithology/well section when enough source evidence exists.

## API error and source contract
- API route `POST /api/ingest`: `multipart/form-data`, `file`. Return 200 JSON report or 4xx/5xx JSON `{error}`. Never return the synthetic seed in place of a failed upload.
- API route `POST /api/analytics`: `{extraction,scenario}`; every scenario change triggers full deterministic recalculation; no stale database values.
- API `POST /api/briefing`: text first, ElevenLabs MP3 on explicit click only. A generated text transcript ≠ a generated audio file.
- API `POST /api/dispatch`: require configured, validated `spaceId` and `senderId` from a prior real Photon conversation, not a phone number guessed by model.
- On any remote API failure: show user a real error, preserve last good dashboard, and keep synthetic/real labels unchanged.
- All credentials MUST remain server-side. Never put tokens into `NEXT_PUBLIC_*` environment variables.

## Forward-compatible persistence migration (optional)
Store `wells(id,name,source_kind)`, `source_documents(id,sha256,filename,license,uploaded_at)`, `extractions(id,document_id,model_id,schema_version,raw_json,validated_at)`, `drilling_events(id,well_id,report_date,start_minute,end_minute,activity,classification,source_page,source_quote,confidence)`, `analysis_runs(id,extraction_id,scenario_json,metrics_json,created_at)`, and `dispatches(id,report_id,recipient_id,state,provider_request_id,created_at)`. Keep immutable ingestion records; do not overwrite historic outputs when benchmark settings change. Time-series extension only after an actual data need, migration and reviewer signoff.

## Repo-wide invariants
1. Gemini does not perform accounting; P2 computes numbers.
2. An event ID is stable per source run, unique within report, and selected by UI rather than array index.
3. All missing evidence is treated as missing, never invented.
4. Unknown events cannot be represented as zero delays without a label.
5. Any sample values must retain their sourceKind `SYNTHETIC_DEMO` end to end.
6. Dispatch must never expose keys or mark accepted as delivered.
