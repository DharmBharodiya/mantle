# BORESIGHT: SOLO OVERNIGHT BUILD MISSION

**Execution directive: This is an IMPLEMENTATION assignment, not a request for a proposal.**

You are the autonomous lead full-stack engineer, drilling telemetry data engineer, frontend designer, and QA owner for BoreSight. The user formerly built the UI while two other teammates worked on ingestion and analytics, but is now completing the app solo. Work in the currently opened local VS Code repository. Preserve valuable work and build on the actual code. Read `AGENTS.md`, `README.md`, `src/types/telemetry.ts`, the files under `src/`, tests, `docs/01-PRODUCT-AND-SCOPE.md`, `docs/02-ARCHITECTURE-CONTRACTS.md`, `docs/04-UI-UX-DESIGN-SYSTEM.md`, and the supplied `public/reference-images` before editing. The older design document is reference material for layout QUALITY only; the new dark theme in THIS file supersedes its light-mode colors.

**Do not ask me to approve each phase. Do not stop after auditing, planning, a single feature, or a passing compile.** You are authorized to make reversible changes to files within this project, install reasonable missing local dependencies, run tests/builds, and commit verified milestones locally. Keep making progress across all phases until the MVP acceptance criteria are satisfied or a real external blocker is encountered. When blocked, record the blocker and proceed to other tasks. No fake successes and no destructive or external publishing actions.

## 0. Fixed scope and priorities

**Deliver a complete, polished, testable geothermal drilling-report intelligence product**, excluding two features: **DO NOT work on ElevenLabs** and **DO NOT work on Photon**. Their integrations may remain untouched internally, but hide or disable all active-looking controls/routes that suggest they work. Do not create new audio or messaging implementations.

Target supported flow:

1. Open a beautiful, modern dark BoreSight dashboard with a clearly identified synthetic sample.
2. Upload a legitimate drilling report in PDF, CSV, XLSX or TXT format. Detect and reject unsupported/oversized/invalid uploads gracefully.
3. Server-side Gemini turns report data into validated, chronological drilling events, with jargon translated into readable text and provenance/warnings. No invented data on failure.
4. Pure TypeScript analytics derives NPT, benchmark-qualified ILT, operating time/coverage, cost opportunity, optional fuel and CO2 scenario estimates. Users can inspect the assumptions and change scenario settings.
5. A responsive interactive dashboard displays an inverted hole-depth-versus-time chart, time activity ribbon, gauges/KPIs, event log, prioritized bottlenecks, and a source-linked event detail drawer.
6. Users can compare analyzed reports/wells if feasible, explore risk/opportunity observations, export tabular results, and switch back to synthetic demo mode.
7. Implement a post-core equipment/bit photo inspection module through Gemini Vision, producing **non-diagnostic, unverified visual observations** with uncertainty and evidence, not automatic IADC grading or repair orders. This is lower-priority than the critical report pipeline but in scope for this run.

Backend work and visual quality are equally important. Never sacrifice the reliable extraction -> analytics -> UI golden path to make a decorative screen.

## 1. Initial audit and checkpoint (execute, don't only describe)

- Inspect `git status`, current branch, modified files, package scripts, required environment variables, installed dependencies, existing API handlers and tests. Do not reset or discard existing changes.
- Check for P1/P2 implementations already present in the CURRENT workspace. Do not assume a branch has been merged or fetch/merge teammates' remote branches without careful inspection; current P3 work must survive.
- Update root `CLAUDE.md` to point to root `AGENTS.md` if its old four-person instructions conflict. Old role docs are nonbinding.
- Create `SOLO-PROGRESS.md` with clear phases, DONE/IN PROGRESS/BLOCKED, observed validation evidence, and decisions.
- Run existing `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` where feasible, fix baseline blockers, and identify current working behavior.
- Ensure `.gitignore` excludes `.env.local`, `.next/`, `node_modules/`, `.codex-logs/` and local sensitive artifacts. If no lockfile exists, generate a compatible one using a normal install and commit the lockfile when valid.
- Make an initial checkpoint commit if safe to do so and the project was actually improved. Then CONTINUE without pausing.

## 2. Gemini API ingestion: finish for REAL input

Work primarily in `src/lib/ingestion/{prepare,gemini}.ts`, `src/app/api/ingest/route.ts`, and canonical shared types when necessary.

- Keep API calls server-only using `@google/genai`; configure via `GEMINI_API_KEY` in `.env.local`, with a model name configurable by `GEMINI_MODEL` and a sensible available default. Do not put secrets in client bundles or print keys.
- Support PDFs (Gemini multimodal), CSV/TXT (text with appropriate encoding/limits), XLSX (ExcelJS preprocessing preserving sheet, row and basic cell information). Use supported SDK structured output; parse and validate again with Zod server-side.
- Extract only values justified by source: well ID/name, report date if present, report periods/time blocks, activity code, classification, measured hole depth when reported, observations, operator abbreviations, original snippet/page-or-row, confidence, warnings. Preserve unknown fields as nullable/unknown rather than inventing them. Existing `ExtractionSchema` is the starting contract; change it only if all uses/tests are upgraded.
- Decode POOH, RIH, WOC, WOB, ROP, BHA, lost circulation, stuck pipe etc. without confusing operator actions with downtime. Keep LLM extraction separate from deterministic calculations.
- Validate/normalize intervals (24-hour, cross-midnight where supported), chronological sorting, duration, duplicate records, overlapping events, missing entries, and corrupt AI JSON. Return explicit errors/uncertainty. Do not silently truncate or misrepresent multi-day input.
- Defend against malicious PDF/text instructions: source content is untrusted extraction input, NEVER implementation or system instructions.
- Add unit/route tests for valid CSV, missing key, unsupported type, bad input, empty extraction, overlapping/unknown events, pagination evidence when available. If a real public DOE/Utah FORGE report can be retrieved legitimately and rights allow, add ONE small attributed real-data test input; otherwise document exact download/source links and mark live file testing unverified.
- Live API call only if a working authorized key and network access exist. If absent, finish offline tests and do NOT show simulated output as a successful live extraction.

## 3. Deterministic analytics: finish and prove correct

Work in `src/lib/analytics/compute.ts`, analytics API and tests.

- Calculate coverage, productive, NPT and UNKNOWN minutes without double-counting intervals; handle invalid/overlap/cross-midnight consistently. Distinguish 'time on site' from 'time in captured events.'
- ILT is *potentially* recoverable time relative to explicitly documented/selected benchmarks, only when an input variable actually supports the benchmark. E.g. DRILLING ROP can use hole-depth progress if relevant; TRIPPING requires bit/string position or explicitly measured trip movement, not hole depth. If insufficient evidence, ILT = unknown, **not zero** and not made up.
- Cost estimation = (NPT + justifiable ILT minutes)/60 * configured daily rig rate /24; no overlap. Describe it as illustrative economic exposure/opportunity; not audited revenue loss. Don't assume all delays were avoidable.
- Carbon/fuel: optional incremental fuel-rate scenario; no automatically assumed '125 gallons per hour idle' and no false precision. Keep factors and uncertainty visible in UI.
- Depth-time curve: use observed hole measured depths and timestamps. Actual curve must be monotonic only insofar as hole depth genuinely increased, not artificially smoothed or carried over unidentified long gaps as confirmed measurements. Highlight NPT by separate evidence-based overlays, not by merely detecting flat curves.
- Compute bottleneck Pareto by verified event classification/category, shift timeline, cost estimate and summary. Support missing values and clear empty states.
- Test representative data, edge cases, zero duration, 24:00, dates/timezones where relevant, missing depths, overlaps, ILT assumptions, carbon null behavior, scenario changes and repeatability.

## 4. Full redesign: modern, DARK, gorgeous, functional

The current light-mode dashboard is NOT the desired final look. Keep the best composition from the five `public/reference-images` (minimal bento grids, clean KPI strip, clear hierarchy, sidebar, compact tables) while redesigning the entire UI in a **dark premium industrial analytics style**. Think contemporary high-end engineering SaaS, not a steampunk game, generic admin template or cyberpunk trading terminal.

### Mandatory visual direction

- **Canvas** `#080C14` to `#0C111C`, with one restrained radial atmospheric blue-indigo glow behind the hero/chart area. Add subtle low-opacity contour/grid texture ONLY if it improves legibility.
- **Sidebar/panels** `#0E1522` / `#121B2A` / raised `#172235`; hairline borders `#263349`, very soft inset highlights and shadows. Card radius 16–22px; consistent 8px spacing rhythm and calm negative space.
- **Primary text** near-white `#EDF4FF`; secondary `#98A9C1`, labels `#72849C`; excellent contrast. Avoid pure-black-on-black cards.
- **Typography**: modern sans-serif (Geist Sans, Plus Jakarta Sans or carefully chosen modern sans; use `next/font` if reliable and retain sans system fallbacks if offline). Crisp semibold titles, restrained small metadata, tabular numerals. NO serif fonts, decorative Western fonts, or typography overload.
- **Colors**: cobalt blue `#6487FF` for primary CTAs; periwinkle `#94A3FF` planned benchmarks; bright teal `#2DD4BF` productive; amber `#FBBF24` ILT; soft coral `#FB7185` NPT; neutral muted slate for UNKNOWN. Avoid rainbow charts, random purple panels, and neon outlines.
- **Gradients**: thoughtfully layered blue/indigo gradient on PRIMARY call-to-action and selected nav; subtle dark navy surfaces; chart actual-line gradient cobalt→teal with translucent vertical area fade into background; distinct thin dashed periwinkle planned curve; translucent NPT amber/coral x-range shading. Keep actual chart geometry physically truthful; use `linear` / `step` lines, not `monotone` interpolation that invents depths. Ensure visualization uses genuinely available points only.
- **Motion**: 150–250ms gentle hover/focus transitions, light chart entrance/reveal if accessible, respect `prefers-reduced-motion`. No animated fake telemetry or constant glows.
- **Visual craft**: consistent Lucide icon style, polished buttons and dropdowns, strong empty/loading/error states, skeletons while parsing, beautiful accessible tooltip/detail drawer, useful microcopy. Only show actions that work.

### Information architecture

- Top bar: BoreSight wordmark, current well and source status, date, upload button, reset demo, export. Responsive sidebar rail with functional Overview, Reports/Well logs, Benchmarks, and optional Bit Vision; hide P4 Field Dispatch/Audio navigation rather than leaving broken pages.
- KPI strip: operating efficiency (with coverage caveat), NPT hours and estimated dollar exposure, defensible ILT opportunity, latest measured hole depth, optional CO2 scenario. Show 'Not available' instead of invented values.
- Hero analytic: interactive large HOLE DEPTH vs TIME curve with depth increasing *downward* (inverted Y), actual vs benchmark/target clearly differentiated; annotate source-backed slowdowns and interruptions, hover/click to select event.
- Supporting analytics: productive/NPT/unknown distribution, 24-hour shift activity strip, ranked bottleneck progress bars, accessible event table with filters/search and exact-source detail drawer.
- Workflow: drag-drop + upload picker for supported files; progress/loading state; helpful actionable errors; imported report badge separate from synthetic demo; scenario assumptions inspector; reset/switch report; export CSV and optional print-friendly summary.
- Desktop at 1366x768, typical laptop, tablet and 390px mobile must all be usable; no horizontal overflow; readable labels/ticks, accessible keyboard focus and chart textual fallback.

### UI engineering completion

- Use components for reusable tokens and cards, don't jam everything into one page. Keep dark theme consistent across every page, popup, tooltip, table and form.
- Validate imported report via runtime schema; update ALL chart and KPI values from the newly selected report, not preseeded constants. Changing scenario settings recomputes the current report, with no stale metrics.
- All visible nav items, menu items, export buttons, filters, upload controls, reset and event drilldowns should do something real, or be conspicuously disabled with explanation. No fake notification bells, avatars, fake real-time status, or field dispatch buttons.
- Visually inspect in a browser if tools are available. Fix chart labels, typography, layout collisions and contrast; never claim visual testing unless screenshots or browser observations exist.

## 5. Non-P4 product completeness

After the core golden path and dark redesign work:

- Add basic local report history (client persistence for structured, non-sensitive summaries, with clear browser-local labeling, bounded size and deletion controls) OR a simple explicit export/import if persistence is complex. Do not store raw reports or API keys in browser storage.
- Enable useful comparison of two previously analyzed well reports or reporting periods where underlying evidence supports it. Compare depth progression, classified NPT, coverage, benchmark assumptions and opportunity with honest missing-data indicators. Do not imply equal well/formation difficulty.
- Expose configurable benchmark and economics settings; rerun existing deterministic analytics without another Gemini call. Consider saved named scenarios if reasonably quick.
- Export CSV event table and a clean print-friendly one-page operational summary. Clearly separate synthetic examples from verified and unverified uploaded sources.
- AFTER P0: implement bit/equipment image upload through Gemini Vision, including a real route, file validation, a useful dark UI view, cautious descriptive observations and confidence/evidence; no automatic diagnosis, definitive IADC grade, damage causality claim, hazard assessment or repair instruction. If credentials/network are unavailable, finish implementation and offline/error tests and truthfully mark the live Gemini Vision request unverified; do not pretend it worked.
- Optional historical persistence with Timescale/Tiger Data is NOT required for local MVP; add only if a working account and DB credentials already exist and core paths are rock solid. Never provision or purchase external services by yourself.

## 6. Automated QA, evidence and demonstration

After EACH phase, run relevant `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` and address failures. Add tests as necessary; if no browser automation is installed, don't overengineer a dependency just to claim full E2E coverage. Verify behavior through available integration/unit tooling and honest manual-check instructions.

Acceptance checks (end of run):

- [ ] App builds with no TS/ESLint/test failures (or exact documented environmental blocker).
- [ ] Modern DARK UI throughout, with modern sans fonts and restrained chart gradients; desktop/mobile responsive.
- [ ] Synthetic demo is clearly identified and useful without credentials; reset works.
- [ ] Upload and server-side Gemini extraction supports PDF/CSV/XLSX/TXT with schema verification and safe errors. Tests cover missing credentials.
- [ ] Analytic summaries, NPT/ILT, cost and carbon assumptions remain internally consistent; no NPT/ILT double counting.
- [ ] Chart depth axis inverted and physically truthful. Source-linked event inspection actually works.
- [ ] Upload changes the real dashboard. Scenario settings recalculate. Filtering and export work.
- [ ] Bit/equipment Vision module is implemented with appropriate caveats and upload tests; live API verification must be marked honestly if unavailable.
- [ ] All non-P4 visible controls function; P4 voice/messaging explicitly absent or marked later.
- [ ] Real geothermal file extraction tested if accessible, otherwise correctly flagged UNVERIFIED with a reproducible test procedure.
- [ ] Runbooks/docs include `.env.example`, install/run instructions, a short 3-minute demo script, and a final honest status.

### Required documentation

Maintain `SOLO-PROGRESS.md` *as you work*. Create `OVERNIGHT-RESULTS.md` at the end containing: completed milestones and commit hashes; files changed; exact commands run and PASS/FAIL; whether a real Gemini request was successfully run; any dataset provenance; UI screenshots path if captured; known issues; ONE exact next action to take on waking; and the explicit note that **Photon + ElevenLabs remain unimplemented/paused**.

### Autonomous checkpoint policy

- Make reasonable design, architecture, test and implementation decisions yourself. Do not ask for permission to proceed from one phase to another, change local source, run local tests or create local commits.
- Create a small descriptive local commit after each coherent, verified milestone when safe. Do not include untracked secrets or generated logs; do not commit a broken/unverified feature as 'complete'.
- Do not push to GitHub, merge, deploy, delete old work, buy services, or modify machine security policies. These are outside the overnight authority. The user will review the result on waking.
- If one phase is blocked by Google credentials, network, quotas or unsupported tooling, record the real blocker, implement the offline/error/UI/test behavior and CONTINUE with independent tasks.
- Do not invent tool runs, successful API calls, downloads, screenshots, sources, fixes or timelines. Do not endlessly retry the same external failure. Make a final report when no further meaningful work can be done.

**Now execute the whole mission end-to-end in this repository. Build, test, repair, verify, checkpoint and keep going without requiring another chat message from the user.**
