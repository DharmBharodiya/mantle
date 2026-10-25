# Mantle: three-minute hackathon demonstration

Updated 24 October 2026 (America/New_York). Local release checks and source comparison evidence are in [FINAL-RELEASE-REPORT.md](FINAL-RELEASE-REPORT.md).

**Demo posture:** use the previously validated genuine FORGE snapshot as the primary walkthrough, with a clearly labeled synthetic backup. The fresh three-page request returned PROVIDER_BUSY in 8.2 seconds and produced no report. Corrected live quote extraction remains unverified. Desktop homepage, console and Reports navigation were observed; complete browser/mobile/print rehearsal remains required because Computer Use stopped at a policy-enforcement limit. Do not advertise this as a completed release sign-off.

## Setup before presenting

1. Open C:\Users\dharm\Downloads\BoreSight-Starter-Kit. Keep the current feature branch and all existing work. Use installed Node 22; on a fresh checkout run npm.cmd ci.
2. Configure only server-side GEMINI_API_KEY and GEMINI_MODEL=gemini-3.1-flash-lite in ignored .env.local if showing extraction. Never expose the key on slides, in browser fields or NEXT_PUBLIC_ variables. CSV/XLSX with explicit activity columns and snapshot import work without Gemini.
3. Use a local production build in a separate output directory, not a simultaneous build against an IDE dev directory:

~~~powershell
$env:BORESIGHT_INGESTION_CHECK='1'
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3100
~~~

Open http://127.0.0.1:3100. Keep the same environment setting for build and start. For ordinary production deployment leave it unset and use the normal .next build. Keep the server running during the presentation.

4. Run node scripts/verify-release-http.mjs. Expect 21 passing checks; these make no provider calls. It writes docs/qa/final-release-http.json and leaves prior evidence intact.
5. Open console -> Reports -> Import snapshot. Select demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json. This is the original saved live extraction with 17 source-matched snippets, **not** today's failed request. Mantle correctly keeps its source status unverified and recalculates metrics.
6. Confirm well 78B-32, date 2021-06-28, 17 events, 24.0 h observed, ending hole MD 421 ft, NPT 0.0 h and unavailable CO2. Keep the source operations PDF open alongside the app: demo-fixtures/public/forge-78b-32/2021-06-28-operations.pdf. Uploaded excerpt page 1 is original PDF page 4.
7. The source header says 293 ft / 4.0 h; the operations interval is 01:30-05:00 = 3.5 h. State this explicitly. The original raw snapshot predates automatic discrepancy warnings, so do not imply it contains the newer warning. Show the PDF header and timed row; do not alter raw evidence to make them agree. New pipeline regression coverage and an earlier live three-page run show the warning behavior.
8. Rehearse Benchmarks -> Copy for scenario, applying assumptions, Compare selectors and exports before the timed presentation. Do not refresh: full reports stay in memory; only optional aggregate summaries persist. Export a JSON copy first.
9. Do not run live ingestion during the three-minute clock. If a live attempt is desired later, node scripts/verify-release-evidence.mjs --live performs one real full-day request and replaces only that script's latest release observations. It uses quota and success is not guaranteed. Without --live it compares the saved failed attempt and exits nonzero.

## Exact three-minute sequence

| Time | Action | Visible result / statement |
|---|---|---|
| 0:00-0:20 | Homepage -> Open console; choose preloaded FORGE report | Homepage uses labeled synthetic data. The console walkthrough uses a cached extraction of a genuine public report. |
| 0:20-0:45 | Overview | 17 events; 24.0 h coverage; 421 ft ending hole MD; 0.0 h NPT; unknown carbon. Planned operations are not assumed downtime. |
| 0:45-1:15 | Inspect event -> 01:30-05:00 drilling; compare PDF | 128-421 ft, 293 ft over 3.5 h. Show the exact quote and excerpt page. Point out the source header's conflicting 4.0 h; keep both claims visible. |
| 1:15-1:55 | Benchmarks -> Copy for scenario; rig day rate 240000; drilling benchmark 100; fuel blank -> Apply scenario | Explicit illustrative assumptions. Expect 34.2 min ILT (rounded 0.6 h), $5,700 modeled opportunity, zero NPT, null carbon. No Gemini call. |
| 1:55-2:20 | Compare -> select original and scenario copy | Same observations, different assumptions. Default 35 ft/h yields zero ILT; difference is not proven savings. |
| 2:20-2:45 | Export CSV and Export JSON | Available source excerpts and scenario assumptions travel with the analysis. Snapshot import recalculates metrics and retains unverified provenance. |
| 2:45-3:00 | Return to source event | Source traceability, explicit uncertainty and deterministic calculations are the result. More report days need domain review. |

The exact spoken script is in [JUDGE-PITCH.md](JUDGE-PITCH.md). Keep print preview and equipment vision outside the timed demonstration until separately rehearsed. Photon and ElevenLabs are excluded.

## Fallbacks

- **Preferred, API-independent genuine backup:** the original 2021-06-28-gemini.snapshot.json above. Say: "This is a saved extraction of the public report, not a live call." It is source-unverified in the product even though the sample was manually compared. Do not substitute docs/qa/final-backend-real.snapshot.json; that diagnostic run contains the abbreviated quote.
- **Synthetic upload backup:** demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv. Upload report imports directly without Gemini: 3 events, 60 NPT minutes, 4.0 h observed and 20.0 h unobserved. Keep SYNTHETIC DEMO visible and explain the partial day.
- **Built-in sample:** Reset demo selects the original synthetic well with 9 events and 5.0 h NPT. Do not attribute its failures or costs to FORGE.
- If an upload fails, keep the prior report, acknowledge the failure and use the backup. Do not repeatedly retry on stage. Stop waiting must preserve the prior valid report; this has automated coverage, not a completed browser rehearsal in this run.

## Manual browser gate still required

After dismissing any leftover file picker, open the local production URL. These are pending checks, not observed successes:

1. Desktop and exactly 390px: homepage navigation, console/sidebar stacking, no sideways page scroll, readable KPI strip and evidence. Repeat at tablet width.
2. Import the genuine snapshot; inspect drilling and cementing intervals through the selector and source buttons. Check chart hover and benchmark toggle. The evidence must match available original text and remain untruncated in the panel.
3. Upload the synthetic CSV; switch between it and the real report. Trigger an invalid file, then cancel a public/synthetic document import; verify the real report remains available and stale results do not replace it.
4. Apply the scenario above, compare original/copy, download CSV/JSON, inspect their content, and reimport JSON. Test Tab / Shift+Tab / Enter and visible focus through all important controls.
5. Use browser reduced-motion emulation; animations should freeze/reduce, with controls still usable.
6. Select the real report -> Print -> Save as PDF. Inspect every preview page for blank first pages, clipped tables, split evidence, complete 17-event evidence, warnings, correct source and assumptions. Repeat for the scenario copy; save to a new filename and review the PDF. Static rendering tests do not prove pagination.

Source attribution, hashes and review details: demo-fixtures/public/forge-78b-32/README.md. Deployment steps and hosting limits: [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md).
