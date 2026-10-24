# Mantle brand and dashboard integration

Date: 2026-10-24. Branch: `feat/solo-overnight`.

## Result

The application has one homepage at `/` and one operational workspace at `/console`. The homepage structure and animations are retained; its wordmark, copy and metadata now say Mantle. The console uses the supplied kit's layout and component patterns with real `WellTelemetryReport` data, rather than the kit's standalone demo engine.

## Console reuse and adaptations

| Kit reference | Integrated implementation | Adaptation |
| --- | --- | --- |
| `console/ConsoleOverview` | `src/components/mantle/console/ConsoleOverview.tsx` | Same summary → continuous KPI strip → depth/evidence → log/ledger order. Accepts the selected canonical report and controller callbacks. |
| `console/ConsoleSidebar` | `src/components/mantle/console/ConsoleSidebar.tsx` | Same wordmark, well context and navigation pattern. Tabs call the existing state controller instead of linking to nonexistent routes. Removed inert well/day controls and simulated live status. |
| `console/KpiStrip` | `src/components/mantle/console/KpiStrip.tsx` | Continuous strip and disclosure definitions. Uses canonical efficiency denominator, ILT eligibility and null carbon values. |
| `console/EvidencePanel` | `src/components/mantle/console/EvidencePanel.tsx` | Preserves exact source text with classification tint and real filename/page/row/sheet references. No invented line numbers or provider attribution. Selection scrolls and focuses the panel. |
| `console/EventLog` | `src/components/mantle/console/EventLog.tsx` | Keeps full source excerpts, class pills and source selection. Adds the original application's text search and confidence filters, plus UNKNOWN and ILT filters. Semantic table scrolls inside its panel. |
| `console/LossLedger` | `src/components/mantle/console/LossLedger.tsx` | Ranked proportional bars use existing `bottleneckGroups()`; event selection and scenario editing call real handlers. No duplicate time/cost calculation. |
| `DepthTimeline` / `ShiftStrip` | `src/components/mantle/console/DepthTimeline.tsx` | Adapts the SVG straight-segment plot and shared 24-hour strip to nullable depths, gaps, UNKNOWN classifications, decreases and canonical benchmark eligibility. Native tooltips, hover readout, pointer selection and a keyboard-accessible event selector. |
| Logo, icons, typography and motion | Existing `src/components/mantle/*`, shared styles and local font files | Reused homepage primitives. Added matching check/save/trash icons. No console serif, new canvas or decorative animation loop. |

The adaptations deliberately retain the canonical report type rather than coercing unknown depths/classifications into the kit's narrower `DrillEvent`. The kit rule requesting `computeDay()` is satisfied in spirit by one deterministic calculation source: console metrics come directly from the existing canonical analytics engine. The homepage's `computeDay()` already delegates to that engine. Uploaded reports are never passed through the demo-only adapter. No backend schema or mathematical formula changed to fit the design.

The summary is labeled **Report day summary**, not Gemini commentary: it is generated from deterministic metrics. No additional model call or fabricated Gemini narrative was added.

## Old presentation replaced

The console route no longer renders the old marketing hero, navy sidebar, RigHealth donut, separate activity card, old depth chart, old bottleneck card, old event table or modal drawer. Their roles are covered by the integrated overview, shared-axis activity strip, loss ledger and inline evidence panel. The original event drawer and other unmounted modules remain available to historical consumers; there is no second dashboard route. Original KPI and sidebar exports delegate to the new presentation for compatibility.

Report management, comparison, scenario editing and equipment vision retain their existing logic. Their active views use the same surfaces, typography, monochrome controls, semantic colors and kit icons; card eyebrows were removed. Printing still opens the print-only operational summary, without printing dashboard chrome.

## Shared design system and branding

- `src/styles/mantle.css` owns shared near-black ground, steam text, thermal focus, surface, border, semantic data and motion tokens. Tokens are available at the root and both routes. Existing CSS variables alias these tokens.
- Homepage and console use Instrument Sans, JetBrains Mono and the existing locally hosted OFL font assets. Serif accents remain limited to the homepage.
- Console uses flexible wrapping columns, a non-sticky sidebar, one continuous KPI strip, white primary pills and neutral secondary controls. Tables scroll within panels. Focus indicators and 44 px controls remain available; reduced-motion rules disable animation/transitions and source-selection scrolling respects the preference.
- Public wordmarks, headings, metadata, vision copy, print output, snapshot input labels and download filenames use Mantle. Homepage design was otherwise preserved.
- The built-in synthetic well label is now `Mantle Lab — Demo Geothermal Well`; its observations and analytics are unchanged. Imported user evidence and well names are never rewritten for branding.
- Compatibility identifiers intentionally remain unchanged: `BORESIGHT_*` environment variables, package identity, `boresight.summary-history.v1`, and the `boresight-report` JSON snapshot format. Existing saved summaries/snapshots remain readable. Historical engineering documents retain their original context.
- No dependencies, package files, telemetry schemas, API handlers or provider services were changed. The supplied `mantle-kit/AGENTS.md` and source files were not overwritten.

## Existing integrations preserved

- PDF/CSV/XLSX/TXT ingestion still calls the existing `ingestReport()` helper and `/api/ingest`; browser validation, real stage streaming, cancellation, bounded server/provider handling and response validation are retained.
- A report is added/replaced only after a successful validated nonempty extraction. Failed uploads retain the current report; no demo fallback was introduced.
- Homepage-to-console memory handoff, reset demo, report switching/removal, bounded in-tab history, optional aggregate storage, summary deletion and JSON import/export retain their handlers.
- `/api/analytics` still recalculates scenarios from source events. Copy-for-scenario and comparison retain both reports and their assumptions.
- Event CSV, JSON analysis snapshot and print summary exports remain connected.
- Equipment image selection, validation, preview, cancellation and `/api/vision` remain connected.
- Photon and ElevenLabs were not implemented or called; no active-looking controls were added.

## Verification

- `npm.cmd test`: **83 tests pass across 12 files**. Five added regression cases cover unknown classification/depth/carbon, canonical scenario values, full escaped evidence with genuine references, disconnected partial-depth chart geometry, and the preserved event/scenario affordances. Existing ingestion, timeout/failure preservation, analytics, report management and vision tests pass.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed.
- `BORESIGHT_INGESTION_CHECK=1 npm.cmd run build`: passed using the existing isolated build directory; routes `/` and `/console` generated successfully.
- Production server HTTP checks on `127.0.0.1:3100`: **8 smoke checks pass**, including both routes, canonical analytics/scenario recalculation, unknown carbon/provenance, invalid JSON/upload and invalid equipment-image rejection.
- `node scripts/verify-ingestion.mjs`: canonical **CSV and XLSX pass**, each extracting 3 events and 60 NPT minutes with preparing/extracting/validating/computing/ready stages. No Gemini call is required for these canonical tables.
- Final built HTML/CSS checks: `/` and `/console` both return 200, contain exactly one H1, link to each other, load shared Mantle CSS, and contain no BoreSight brand in rendered markup. The console shows the Mantle Lab sample, summary and search controls. The temporary test server was stopped afterward.

## Limits and review steps

Windows Computer Use found Chrome, but stopped before page inspection because it could not determine the browser URL reliably enough to enforce policy. No further browser input was attempted. No desktop/mobile screenshots or interactive browser verification are claimed. Responsive layout and accessibility are implemented and statically checked; actual 390 px and 1440 px visual review remains pending.

No genuine drilling document was locally available in the fixture/public directories. This migration did not perform a new live Gemini extraction; earlier extraction evidence remains in `INGESTION-FIX-REPORT.md`. Server/provider behavior was preserved and the offline/API regression checks above were performed.

Full reports remain in memory and are lost on a full reload unless explicitly exported/imported. Only opt-in aggregate summaries use browser storage, as before.

To review: start `npm run dev`, visit `/console`, upload `demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv`, inspect an event, change a scenario, create a scenario copy and compare, export CSV/JSON, and check print preview. Return home and reopen the console to check in-tab continuity. Repeat at 390 px and 1440 px, including keyboard navigation. Use a permitted genuine report separately for live extraction verification.
