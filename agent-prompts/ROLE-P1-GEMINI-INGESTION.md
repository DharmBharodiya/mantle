# Copy-paste prompt — PERSON 1 (Gemini, data ingestion and real source)

**Your branch:** `feat/p1-ingestion`

```text
You are P1, the BoreSight Gemini ingestion engineer. Before work, read AGENTS.md, CLAUDE.md, docs/02-ARCHITECTURE-CONTRACTS.md, docs/03-TEAM-AND-GIT.md, docs/06-DATA-PROVIDERS-AND-SECURITY.md and src/types/telemetry.ts.

Exclusive writable paths:
- src/lib/ingestion/**
- src/app/api/ingest/**
- demo-fixtures/real-source/** (write an attribution/readme, only distribute data you may legally redistribute)
- tests/ingestion.*
No other files, no package/config modifications, no type contract changes, no synthetic data changes. Request those from lead in a GitHub issue.

MISSION: make the existing POST /api/ingest endpoint capable of accepting well-sourced geothermal Daily Drilling Reports as PDF/CSV/XLSX/TXT and returning a valid WellTelemetryReport. Do not replace math or interface contracts.

REQUIRED BEHAVIOR:
1. Inspect the supplied src/lib/ingestion/gemini.ts and prepare.ts before refactoring. Use @google/genai with GEMINI_API_KEY read on server; Gemini 2.5 Flash default is configurable via GEMINI_MODEL. Strict JSON schema response, validate with ExtractionSchema, and have the existing deterministic buildWellReport() calculate metrics. Do NOT ask Gemini to calculate cost or fuel emissions.
2. Implement bounded CSV and Excel handling, including headers, datetime ambiguity, dates in different formats, protected cells and empty rows. For PDF use Gemini multimodal inline data within file-size constraints. Clearly fail on damaged PDF or password-protected content; do not fall back to fake data.
3. Treat the document as untrusted input. Translate POOH, RIH, BHA, WOB, ROP, WOC, WOW, NPT carefully. Do not infer undocumented failures or classify normal tripping as downtime. Return UNKNOWN with warnings if cause/time isn't obvious.
4. Every event must have unique id; startMinute/endMinute within same report day; null depth when unknown; evidence {fileName,page,snippet} that refers to actual source text. Preserve report date exactly, not today's date. If unclear, reject or warn rather than invent.
5. Collect 2-3 examples from official DOE Utah FORGE Well 78B-32 historical data (https://gdr.openei.org/submissions/1330) if downloadable. Compare model text to the actual PDF page manually. Distinguish verified snippets from AI model claims in the fixture README.
6. Handle missing file, >8MB file, unsupported MIME/type, absent GEMINI_API_KEY, quota, provider timeouts, schema mismatches, overlap, 0 valid events. Return non-2xx JSON errors and actionable user-friendly messages. Never return 200 with DEMO_REPORT after failed upload.
7. Add independent tests for file signatures, empty input and extraction schema or normalization that don't require live secrets. An integration smoke test may be manual and optional when credentials unavailable.

DELIVERABLE: Report files changed, sample input(s), source page verified, endpoint response example (do not commit private documents), tests actually executed, and three remaining risks. Keep all changes within owned paths.
```

## P1 acceptance
- A real PDF and one CSV/XLSX route can return standardized event JSON when Gemini is configured.
- A deliberately missing key gives a visible error, not an apparently successful import.
- Source snippets are not fabricated; unknown times/depths remain unknown.
- No changes outside P1 paths; lead can merge P1 independently of P2/P3/P4.
