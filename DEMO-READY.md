# Mantle: three-minute hackathon demonstration

Date: 24 October 2026 (America/New_York).

**Readiness:** core pipeline validated on one genuine Utah FORGE report day; automated checks pass. Desktop homepage/console were visually inspected. Full browser rehearsal, 390 px interaction and print-preview review remain pending because Computer Use was stopped with the physical Escape key. Do that preflight before presenting.

## Setup

1. Open `C:\Users\dharm\Downloads\BoreSight-Starter-Kit` in a terminal. Keep the current `feat/solo-overnight` branch.
2. Dependencies are installed. For a fresh checkout use Node 22+ and `npm.cmd ci`.
3. Keep the server key only in ignored `.env.local`. The verified configured model is `gemini-3.1-flash-lite`; never paste the key into a browser or slides. Restart a server after configuration changes.
4. For the simplest local preview: `npm.cmd run dev`, then open `http://localhost:3000`. Do not run a build concurrently against the same output directory.
5. For a production demo without disrupting an existing IDE dev server, use a separate terminal:

```powershell
$env:BORESIGHT_INGESTION_CHECK='1'
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3100
```

Open `http://127.0.0.1:3100`. Keep this process running during the demo. If using ordinary `npm run start` without the environment setting, first create an ordinary `.next` build; the isolated build lives in `.next-ingestion-check`.

6. Run `node scripts/smoke.mjs`, `node scripts/verify-ingestion.mjs`, and `node scripts/validate-forge.mjs --http` against port 3100. These make no Gemini calls.
7. Before the clock starts, open the console, go to Reports -> Import snapshot, and select `demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json`. This restores a previously observed real Gemini extraction; it is not a fresh extraction. Return home using the app link and reopen the console to check continuity. Do not refresh during the presentation: full analyses are in memory.
8. If showing live ingestion, do it before presenting: upload `demo-fixtures/public/forge-78b-32/2021-06-28-operations.pdf` using Upload report. One observed call took 21.6 seconds; no future timing or success is guaranteed. If it fails, retain the prior report and use the saved snapshot.

## Exact three-minute sequence

| Time | Action | Say / verify |
|---|---|---|
| 0:00-0:20 | Show homepage, then Open console | Mantle converts daily drilling reports into an inspectable operating timeline. The homepage illustrations use synthetic data; switch to the preloaded real report. |
| 0:20-0:45 | Select 78B-32, 2021-06-28 | This is public Utah FORGE report 2. Show 17 events, 24.0 h coverage, 421 ft latest hole depth, 0.0 h NPT and unavailable CO2. Source remains unverified in the app. |
| 0:45-1:15 | Inspect the 01:30-05:00 drilling event, then the 06:00-06:30 trip | Show 128-421 ft drilling and the exact source excerpt. Excerpt page 1 corresponds to original PDF page 4. Flat hole depth during planned trips/casing is not NPT or bit position. |
| 1:15-1:55 | Benchmarks -> Copy for scenario; set rig day rate 240000 and drilling benchmark 100; leave fuel blank; Apply scenario | These are explicit illustrative assumptions, not this well's established day rate or a validated geological benchmark. Expect 0 NPT, 34.2 minutes of ILT (displayed 0.6 h) and $5,700 modeled opportunity. No extraction call is made. |
| 1:55-2:20 | Compare; choose original real analysis and its scenario copy | Identical source intervals, different assumptions. Original default benchmark gives no ILT; the scenario difference is not proven savings. |
| 2:20-2:45 | Export CSV, then Export JSON | CSV includes source excerpts and assumptions. JSON retains event evidence and can be imported later; metrics are recomputed. Only optional aggregate summaries persist in browser storage. |
| 2:45-3:00 | Return to the source event and close | Explain that the source header says 4.0 drilling hours but the operations interval is 3.5 h; Mantle uses the timed operations. The next step is domain review across more days. |

Avoid the Print dialog and live equipment vision during the timed demonstration until manually rehearsed. Their presence is not proof of browser layout or model accuracy. Do not show Photon/ElevenLabs; they remain excluded.

## Backups

1. **Preferred API-independent backup:** the real saved Gemini snapshot above. Tell the audience it is a cached analysis of the original public report, not a live model call.
2. **Synthetic upload backup:** `demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv`. Its explicit table imports without Gemini: 3 events, 60 NPT minutes, 4.0 h observed, 20.0 h unobserved. Keep the SYNTHETIC DEMO provenance visible.
3. **Built-in sample:** Reset demo restores the synthetic well and original assumptions: 9 events, 5.0 h NPT. Do not attribute its incidents or amounts to FORGE.
4. **Failure behavior:** Stop waiting, invalid upload, provider error and invalid snapshot must leave the current valid report intact. Never repeatedly retry to fill time or describe a failed request as successful.

## Preflight still required

At desktop and exactly 390 px: keyboard focus, report/snapshot import, event selection, chart hover, scenario application, comparison, report switching, export downloads, no page overflow and reduced motion. Check Print / Save as PDF with both the real day and a different selected report; all source evidence and warnings should remain readable. Browser controls after homepage-to-console navigation were not exercised in this run.

Dataset attribution, license, hashes and review details are in `demo-fixtures/public/forge-78b-32/README.md`. Actual checks and limits are in `FINAL-QA-REPORT.md`.
