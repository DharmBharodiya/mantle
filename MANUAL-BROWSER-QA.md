# Mantle manual browser QA - release candidate

Status: **pending manual execution**. Record PASS / FAIL / NOT TESTED, browser/version, viewport and any screenshot or PDF filename for each row. Existing automated checks do not complete this list. No live Gemini request is needed for this rehearsal.

Use http://127.0.0.1:3100 with the production server running (setup: DEMO-READY.md). Dismiss any old file picker. Keep browser networking enabled: scenario editing calls the local analytics server even though it does not call Gemini.

Files, relative to the repository root:

- Real snapshot: demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json.
- Original operations excerpt: demo-fixtures/public/forge-78b-32/2021-06-28-operations.pdf. Uploaded page 1 = original PDF page 4.
- Synthetic table: demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv.
- Invalid snapshot: demo-fixtures/public/forge-78b-32/2021-06-28-expected.json (expectations, deliberately **not** an importable snapshot).

| Check | Exact interactions | Pass condition |
|---|---|---|
| 1. Responsive navigation | At 100% zoom use DevTools responsive mode: 1440 x 900, 768 x 1024, then 390 x 844. At each width open /, click Open console, Reports, Overview, then Mantle home. | Readable layout, no sideways page scroll, usable navigation; sidebar stacks on narrow screens. Internal table scrolling may remain inside its panel. |
| 2. Real snapshot | Console -> Reports -> Import snapshot -> choose the real snapshot above. | Overview shows 78B-32, 2021-06-28, 17 events, 24.0 h coverage, 421 ft ending depth, 0.0 h extracted NPT and unavailable carbon. Provenance remains Uploaded / UNVERIFIED. |
| 3. Source inspection | Inspect event -> 01:30-05:00 drilling, then 14:30-16:00 cementing. Use each row's Show source button too. Toggle Benchmark and hover chart segments. Open the original PDF beside it. | Evidence selection follows the chosen event; 128-421 ft drilling; available quotes match the PDF and remain fully readable in the panel. Header 4.0 h and timed 3.5 h stay distinct. The old raw snapshot need not contain the newer conflict warning. Tooltips do not block controls. |
| 4. Scenario and comparison | Benchmarks -> Copy for scenario. Set Rig day rate 240000; Comparable drilling benchmark 100; Incremental excess fuel blank; retain emissions factor. Apply scenario -> Compare -> choose original as A and copy as B. | Same 17 source intervals; copy has 34.2 min ILT (rounded 0.6 h), $5,700 modeled opportunity, zero NPT and unavailable carbon. Original default benchmark has zero ILT. Labels make assumptions explicit. |
| 5. Upload and switching | Upload report -> synthetic CSV. Use Selected report to switch real -> synthetic -> scenario copy -> real. | Synthetic: 3 events, 1.0 h NPT, 4.0 h observed / 20.0 h unobserved, clearly labeled SYNTHETIC DEMO. Each selection updates title, evidence, KPIs and print/export source without stale values. |
| 6. Invalid import | With the real report selected, Reports -> Import snapshot -> choose the expectations JSON listed above. | Error appears; real report and evidence remain intact. A subsequent valid snapshot import still works. |
| 7. Cancellation, no model | Select the real report. In DevTools Network use a custom throttle with 5000 ms latency (or Slow 3G). Upload the synthetic CSV; while waiting click Stop waiting. Restore No throttling, then observe after the request settles. | Waiting state stops, controls recover, selected real report remains. A late CSV result cannot replace it. If it finishes before cancellation, mark this check inconclusive; repeat only with the same deterministic CSV/throttling, never a PDF/provider retry. |
| 8. Exports | Select scenario copy -> Export CSV and Export JSON. Open downloaded files; Reports -> Import snapshot -> choose exported JSON. | 17 events and source evidence retained; CSV has scenario/evidence columns; JSON import recomputes the $5,700 scenario, leaves carbon unavailable and does not promote source verification. Both downloads complete. |
| 9. Keyboard and motion | At desktop and 390px press Tab / Shift+Tab through navigation, report picker, Inspect event, source buttons, scenario fields and actions; activate with Enter/Space as appropriate. Enable prefers-reduced-motion: reduce in DevTools Rendering, then revisit homepage and console. | Visible focus, no keyboard trap, usable native selectors/actions, focus follows navigation/evidence meaningfully. Canvas/marquee/motion reduce or freeze without blocking content. Restore the emulation afterward. |
| 10. Print / PDF | Select original real report -> Print -> Save as PDF, A4 portrait. Inspect every preview page; save a new PDF and inspect it. Repeat for scenario copy. | Correct selected title/date/source, all 17 events and available quotes, warnings and assumptions. No blank first page, clipped table, missing evidence or unreadable split block. Scenario PDF shows its own assumptions/$5,700; unknown carbon stays unavailable. |

Finish with the real report selected and synthetic fallback available. Rehearse the exact three-minute sequence once. Keep cached data clearly labeled as a saved genuine extraction, not a fresh live result. Do not refresh without exporting JSON; full reports live in memory.

Release gate: unresolved FAIL or NOT TESTED items remain open in FINAL-RELEASE-REPORT.md. Corrected live quote extraction is a **separate pending gate**; do not retry it while the provider is busy, and do not present a failed attempt as verified.

## Report-day recovery regression

On the updated build, attach demo-fixtures/public/forge-78b-32/2021-06-28-and-29-operations.pdf. Confirm the current valid report remains selected after the boundary error. In Choose one report day verify the date/range/confirmation start empty and analysis is disabled. Choose June 28 and page 1, confirm the original source and analyze; expect 17 events with original page 1 evidence. Repeat separately for June 29/page 2. Selecting both pages must still reject. Check Cancel day selection, Stop waiting, and Enter in the homepage page-range field (it must not submit the whole document). Repeat at 390px; no clipping and all controls reachable. These UI actions remain pending manual verification. See docs/MULTI-DAY-IMPORT.md for limits and safe fallback.

## Rig Supervisor Copilot regression

Import the genuine snapshot, open Rig Supervisor Copilot and check only that analysis. Ask about activities, NPT and missing data. Expand a calculation (period/filters/assumptions/included records) and source quote; use Inspect original event, then return to the copilot and confirm conversation remains. Ask a follow-up about the preceding event only after a unique focus exists. Change report/well scope and confirm context clears. Compare original/scenario copies, verify 34.2 min / $5,700 is labeled a scenario and carbon remains unknown. Test Cancel question, Clear conversation, empty/no-report/oversized questions, keyboard focus, anchors and 390px wrapping. With Groq unavailable, deterministic mode/notice must be explicit. Do not retry a live rate limit during this manual check. Live narrative acceptance and actual browser execution remain unverified; see docs/RIG-SUPERVISOR-COPILOT.md.
