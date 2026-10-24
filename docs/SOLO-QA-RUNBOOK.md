# Solo QA and 3-minute demo runbook

## Start and automated checks

1. In project root: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build`.
2. Run `npm.cmd run start -- --hostname 127.0.0.1 --port 3100` and open http://127.0.0.1:3100.
3. In another terminal run `node scripts/smoke.mjs`. This does not call Gemini.
4. For one authorized actual extraction of synthetic input, run `node scripts/smoke.mjs --live`. Google availability/quotas may block it; never treat a failed call as success.

Do not run dev and production build simultaneously in the same checkout. Stop an existing development server before a build, then restart it.

## Three-minute demonstration (offline core)

- **0:00–0:25:** Show the dark Overview and `SYNTHETIC_DEMO` warning. Identify 5.0h NPT. Explain unknown/coverage and scenario estimates.
- **0:25–0:50:** Choose `ev-04` in the chart event selector or the activity strip. The drawer shows the exact synthetic pump-repair note. Close with Escape. Select planned circulation `ev-03`; flat depth is productive, not NPT.
- **0:50–1:20:** Open Benchmarks, select **Copy for scenario**, change rig day rate to 240000 and apply. NPT cost becomes $50,000 without another extraction. Change fuel differential to blank; carbon becomes unavailable.
- **1:20–1:45:** Compare the original and copied analysis. Same time observations, different modeled cost. The difference is assumptions, not proven savings.
- **1:45–2:15:** Reports → Save summary; explain browser-local aggregates. Export JSON and CSV; import the JSON and confirm metrics/provenance. Use Print to preview the compact summary. Remove the imported copy; optionally clear saved summaries.
- **2:15–2:40:** Upload `demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv` if Gemini works. Otherwise show the useful provider error and unchanged current report. Never call the built-in demo an extraction success. A customer CSV should return an explicit no-drilling-events error.
- **2:40–3:00:** Equipment Vision displays its limits before upload. A real selected image is sent only on explicit selection. Without live service, show the honest error state. Explain Photon and ElevenLabs are paused.

## Manual browser matrix — NOT yet observed in this run

Test 1366×768, 1440×900, 1024×768, 768×1024 and 390×844:

- No document horizontal scroll. Only the operations table may scroll horizontally.
- Sidebar becomes a scrollable top rail below desktop widths. Buttons and selects remain readable.
- Chart retains at least 270px height, inverted depth and linear actual geometry. Null observations/gaps are disconnected.
- Model benchmark toggle is explicitly hypothetical; no actual drilling plan has been fabricated.
- Tab through all nav and primary controls. Chart selector and table Inspect buttons work by keyboard.
- Source drawer traps focus via native dialog, closes with Escape/X/backdrop, and restores origin focus.
- Reduced-motion preference removes waiting animation and smooth scrolling.
- Print preview fits a normal one-page sample; large source lists are intentionally summarized and full evidence is in CSV/JSON.
- Duplicate scenario, apply new values, compare, switch report, reset demo and confirm every metric/label updates together.
- During upload, Stop waiting/reset prevents a late response from replacing the report. Provider processing may continue independently.
- Empty comparison/history, blocked localStorage, invalid JSON snapshot, negative/empty scenario fields and failed image upload have useful states.
- In Vision choose one image, then another; observations must refer to the selected image. Check exact filename, quality, visible-region claims and confidence. No diagnosis or repair instruction should be treated as certain.

No browser surface was available to the agent, so screenshots, visual contrast review, browser storage interactions, native print layout and focus behavior must be checked by a human before a presentation. Existing light-theme screenshots are historical.

## Real geothermal source procedure

1. Open https://gdr.openei.org/submissions/1330 in a normal browser. It returned HTTP 429 during automated retrieval; do not claim this step was completed here.
2. Review the dataset description, license, resource attribution, well designation and document dates before downloading or redistributing anything. Locate the Well 78B-32 daily drilling reports if offered in the resource listing.
3. Choose a small report for one local day. Preserve its original filename; keep a private local copy outside Git unless redistribution rights are confirmed.
4. Confirm `GEMINI_API_KEY` and an available `GEMINI_MODEL` in `.env.local`, restart the app and upload that file.
5. Check that the badge is **Uploaded · UNVERIFIED**, not synthetic or human verified. Manually compare every extracted interval, classification, depth/unit, source quote and claimed page with the original.
6. Verify durations do not overlap; unknown/ambiguous times were not invented. Cross-midnight reports must be split/clarified. Planned trips and circulation must not be inferred as NPT from a flat hole-depth line.
7. Export CSV/JSON; record actual HTTP status, event count, manually corrected ambiguities and model availability. Only then report live real-source extraction as verified for that file.

## Provider troubleshooting

- `MISSING_KEY`: set the server-side key and restart.
- `PROVIDER_BUSY` / 503: Google reports temporary unavailability; retry later. Do not repeatedly re-upload or silently switch to fabricated data.
- `PROVIDER_MODEL`: the selected model is unavailable to this endpoint/project. Use an available Google model; this run's older `gemini-2.5-flash` probe returned Not Found.
- `PROVIDER_RATE_LIMIT` / 429: check project quota and wait.
- `PROVIDER_AUTH`: check project/API permissions; never paste the key into support chat.
- `NO_DRILLING_EVENTS` / 422: use an actual drilling report with explicit operational time intervals.
- `INVALID_TIMELINE`: review overlaps, duplicate IDs, dates and day-boundary ambiguity.

Do not enable or test old Photon/ElevenLabs integration files as part of this mission.
