# 05 — 24-hour implementation timeline, QA and rescue plan

Do not rely on a false promise of zero merge conflicts. One-writer-per-file + frozen contracts + tiny PRs are the practical mitigation.

## Critical path; four devs parallel
| Window | Owner | Required milestone | Demo acceptance |
| --- | --- | --- | --- |
| T+0–30 min | Lead / all | Private GitHub, `npm install`, lockfile, frozen contracts, secrets in env | `npm run dev` renders seed at localhost |
| T+30–90 | P1 | PDF + CSV/XLSX extraction & explicit error handling | Import one real raw input into a JSON extraction; no invented events |
| T+30–90 | P2 | Computation tests & derived report shape | Tested time math, null benchmarks, cost math, no double count |
| T+30–90 | P3 | Pixel-polish header, KPI row, chart, interactions | Strong screenshot; responsive desktop and mobile |
| T+30–90 | P4 | Reviewed transcript and ElevenLabs endpoint | Generates playable MP3 or graceful missing-key error |
| T+90–180 | All | Merge P2, P1, P4; P3 pulls latest and assembles | Complete upload → report → inspection → voice sequence |
| T+180–240 | P1/P2 | Genuine Utah FORGE PDF verified against 2–3 event snippets | Screenshot source snippet and correct page link |
| T+180–240 | P4 | Configure Photon test conversation and opt-in; otherwise disable in demo | Real phone message OR explicitly labeled disabled status |
| T+240–300 | P3/lead | Cross-browser polish, contrast, accessibility, responsive layout | 1366×768 and phone widths clean; upload failures clear |
| Final 60–90 min | Whole team | Full 3-minute rehearsals, smoke tests, release tag | Demo repeats 3 times with no unexplained fake output |

## Scope tiers
**P0 — ship even if sponsor services go down:** interactive dashboard with real or explicitly synthetic data; source inspection; deterministic NPT/ILT estimates; clear demo story.

**P1 — impress judges:** upload real PDF via Gemini; convincing source-backed explanation; ElevenLabs audio generated and playable.

**P2 — stretch:** Photon successful opted-in 2-way messaging; richer offset-well baselines; image wear triage with explicit uncertainty; production persistence.

**Do not spend the first 4 hours on:** auth, persistent SQL migrations, expensive cloud infrastructure, animated splash page, custom 3D drill rigs, fancy real-time WebSockets, autonomous hazard diagnosis.

## Tests that MUST exist
1. Duration crossing midnight is NOT silently accepted as within a day; timeline overlap throws validation error.
2. Missing hole depth → ILT cannot be calculated; does not invent speed.
3. Productive drilling of 40 feet in 120 minutes at 35ft/hr yields approx 51.43 modeled ILT minutes; duration still only counted once.
4. A 90-minute confirmed NPT stop at $120k/day → $7,500 scenario rate cost.
5. No fuel assumption → fuel and CO₂ show null/dash, not 'exact' CO₂.
6. Upload missing file → HTTP 400; missing Gemini key → explicit error (not a synthetic success).
7. Audio absent ElevenLabs credentials → understandable error; transcript still available.
8. Photon disabled → no outbound messages.
9. Source inspector matches the selected event's exact evidence snippet and filename.
10. All tabs/buttons in the visible demo path perform meaningful actions; no broken affordances.

## Shell checklist
```bash
node -v                  # use Node 22 LTS where possible
npm ci                   # AFTER lead commits lockfile; lead uses npm install initially
npm run typecheck
npm test
npm run lint
npm run build
npm run dev
```
If Next build fails because fonts need a network CDN, remove remote font dependency or use system fonts. If any vendor fails, keep the demo synthetic view and explain which step is disconnected. Never forge a success toast.

## Failure-mode playbook
- **Gemini quota/timeout:** pre-load a validated real report JSON fixture as read-only *explicitly preprocessed from public data*. Show the original PDF, mapped events and calculations. Never pretend uploaded document was freshly extracted.
- **Real source document format too complicated:** switch to a cleaner real CSV day or a cropped 1-page report and display extraction warning.
- **ElevenLabs fails:** read the visible script and show error/credit limitation; optional browser speechSynthesis is a *clearly labeled browser fallback*.
- **Photon project cannot onboard:** disable button; show the formatted outgoing text in a preview, marked UNSENT. Do not fake a WhatsApp screenshot.
- **Git merge conflict:** team lead identifies owner, selects owner's version for exclusively owned file, reruns all tests; never auto-resolve huge conflicts blindly.
- **Deploy down:** localhost demo with phone as second device on LAN if permitted; use recorded walkthrough with disclosure.

## Final sign-off
Every role checks its own path and opens a PR. Lead runs the full vertical demo; each member signs off one real 24-hour event, one source citation and one estimated metric. Keep a working backup commit / git tag `demo-v1` before submission.
