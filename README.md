# BoreSight — Steel & Steam hackathon starter repository

> **Turn geothermal drilling reports into evidence-backed operational intelligence.**
>
> Light-mode bento dashboard · Google Gemini · ElevenLabs · Photon 2.0 Beta · Next.js + TypeScript.

**STATUS: substantial prototype scaffold, not a production-ready system.** The bundled data is explicitly synthetic. No real rig is connected. The starter code was reviewed statically but package installation, Next build, and live provider requests could not be executed in the authoring environment because the npm registry was unreachable. Perform the FIRST-RUN and verification checklist before demo day.

## Start here — 4 developers in 15 minutes

1. **Team lead** creates an empty private GitHub repository `boresight`, extracts this starter kit into the repository folder, and reads `docs/01-PRODUCT-AND-SCOPE.md` and `docs/03-TEAM-AND-GIT.md`.
2. Team lead, from repository root, runs `npm install` (requires Node 22+ because the Photon SDK requires it). This generates `package-lock.json`; **commit it before anybody branches**. Then `npm run dev` and visit `http://localhost:3000`.
3. Copy `.env.example` to `.env.local`. Store secrets in a password manager (NEVER GitHub chat, README, screenshots, or commits). The synthetic dashboard needs no API key. Live file parsing requires `GEMINI_API_KEY`; voice requires ElevenLabs; field dispatch is **disabled** by default.
4. Commit scaffold to `main`, then create the four branches described in `docs/03-TEAM-AND-GIT.md`.
5. Every developer reads `AGENTS.md` and their specific `agent-prompts/P*.md` **before opening their coding agent**.
6. Open four GitHub issues, link their owned files and acceptance criteria, then work in parallel. All PRs to `main` should pass checks and get a human review.

## Windows PowerShell quick start

```powershell
# In the extracted folder
node --version
npm install
Copy-Item .env.example .env.local
npm run dev
# Open http://localhost:3000
```

```powershell
# After team lead pushes a clean main containing package-lock.json
# Developer 1 / 2 / 3 / 4: choose your OWN branch name
 git switch -c feat/p1-ingestion
# OR: feat/p2-analytics | feat/p3-dashboard | feat/p4-field-comms
 git push -u origin HEAD
```

## Instant offline preview — no installation

Open `preview.html` in Chrome, Edge or Firefox. It is a **self-contained interactive UI preview** (not the production Next.js application): browse the chart, open source-inspection modals, search shift events, adjust the rig-rate scenario, and export a scenario CSV. Vendor buttons explicitly explain that actual Gemini/ElevenLabs/Photon calls require running the Next.js app. The preview clearly labels its synthetic data.

## What works out of the box after dependencies install

- A fully labeled **synthetic** geothermal telemetry dashboard with five scenario KPIs.
- An actual event-based hole-depth chart, bottleneck bars, shift records and click-to-inspect evidence.
- Deterministic NPT, drilling ILT and scenario-cost calculations with tests.
- Drag-and-drop-by-picker PDF/CSV/XLSX/TXT upload API backed by Gemini **when configured**.
- ElevenLabs briefing API **when configured**, with a useful text briefing before voice.
- Photon 2.0 Beta outgoing-message adapter requiring configured valid conversation IDs and enabled opt-in.

## Features your team must still finish (NOT misrepresented as complete)

- Real Utah FORGE sample import; daily page partitioning and verified page citations.
- Further field validation and better spreadsheet normalization, partial data/unknowns UX.
- Photon 2.0 agent onboarding, real incoming events and actual verified delivery confirmation.
- Secure user auth, rate limiting, durable storage, background job architecture if turning into production SaaS.
- Real equipment-photo analysis and maintenance blueprints: **stretch**, not core acceptance criterion.

## Repo map

```text
boresight/
├── README.md, AGENTS.md, CLAUDE.md
├── docs/                         # 7 detailed implementation & demo documents
├── agent-prompts/                # One explicit prompt per teammate
├── public/reference-images/      # 5 user-provided visual references
├── src/types/telemetry.ts        # Contract locked by team lead
├── src/data/demo-report.ts       # Explicitly fabricated seed, lead-owned
├── src/lib/analytics/            # P2-owned formulas
├── src/lib/ingestion/            # P1-owned Gemini and file conversion
├── src/lib/comms/                # P4-owned provider adapters
├── src/components/dashboard/     # P3-owned main UX
├── src/components/analytics/     # P2-owned operational UI
├── src/components/comms/         # P4-owned field UI
├── src/app/page.tsx              # P3-owned app integration shell
├── src/app/api/ingest/           # P1
├── src/app/api/analytics/        # P2
├── src/app/api/briefing,dispatch # P4
└── tests/                        # P2 tests; each role owns its own test files
```

## Canonical paths and interfaces

| Endpoint | Method | Owner | Body / response |
| --- | --- | --- | --- |
| `/api/analytics` | GET | P2 | Returns seeded synthetic `WellTelemetryReport` |
| `/api/analytics` | POST | P2 | `{ extraction: Extraction, scenario?: Scenario }` → report |
| `/api/ingest` | POST | P1 | multipart form: `file` → parsed & computed report; errors never replaced by fake success |
| `/api/briefing` | POST | P4 | `{ extraction, scenario, sourceKind, mode:'script'|'audio' }` → JSON script or MP3 |
| `/api/dispatch` | POST | P4 | `{ extraction, scenario, recipient:{spaceId,senderId,idempotencyKey} }` → accepted (NOT delivered) |

## Strongest demo scenario

A judge uploads an authentic 2021 Utah FORGE daily report → Gemini extracts the time blocks with evidence → BoreSight shows drilling progress and NPT estimates → the judge opens an activity and reads the source quote → ElevenLabs speaks an evidence-based incoming-shift briefing → Photon sends a message to an opted-in, existing rig-team test conversation, **if the live integration is working**. A synthetic fallback supports demo flow without misrepresenting any real incident.

## Documentation index

1. `docs/01-PRODUCT-AND-SCOPE.md` — user journey, features, non-goals, prize strategy, engineering integrity
2. `docs/02-ARCHITECTURE-CONTRACTS.md` — system map, types, state flow, provider handling, math, source integrity
3. `docs/03-TEAM-AND-GIT.md` — bootstrap, strict ownership, PR/merge rules, shared AI-agent procedure
4. `docs/04-UI-UX-DESIGN-SYSTEM.md` — high-fidelity light-mode design specification based on all five screenshots
5. `docs/05-BUILD-TIMELINE-AND-QA.md` — timeboxed schedule, tests, release, failure modes
6. `docs/06-DATA-PROVIDERS-AND-SECURITY.md` — provider setup, documented links, dataset provenance, security
7. `docs/07-PITCH-AND-DEMO.md` — rehearsed 3-minute demo and backup decision tree

## Source of the datasets and technical documentation

- Utah FORGE dataset 1330: https://gdr.openei.org/submissions/1330 (real reports from **2021**; not bundled here)
- Gemini PDF handling: https://ai.google.dev/gemini-api/docs/document-processing
- Gemini structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- ElevenLabs voice API: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- Photon 2.0 Beta: https://photon.codes/docs/beta/get-started/imessage
- MLH prize list: https://www.mlh.com/events/sbuhacks-5f/prizes

**Safety:** no recommendations from this demo are authorized for field execution. This is a decision-support visualization, not a well-control, emergency-response or maintenance-instruction product.
