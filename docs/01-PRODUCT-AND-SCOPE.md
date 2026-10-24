# 01 — Product definition, user journeys and feature priority

## One-line proposition
**BoreSight** turns fragmented daily geothermal drilling records into transparent activity timelines, downtime and benchmark estimates, with an incoming-shift explanation delivered where crews communicate.

## Why this genuinely fits *Steel & Steam*
- **Steel:** a drill string, casing, pumps, rotary rig and equipment in direct contact with hard rock. Our data model reflects physical drilling operation instead of superficial steampunk styling.
- **Steam:** heat extraction for geothermal power; drilling cost and delays can make geothermal projects harder to finance. Focus the pitch on making clean baseload heat development more analyzable, without claiming proven cost or emissions reductions from the prototype.
- **AI worth using:** parsing a genuinely irregular industrial source and preserving source provenance; the spreadsheet arithmetic itself should not be outsourced to an LLM.

## Audiences and actual daily jobs
1. Drilling superintendent: see previous shift, largest verified downtime, evidence, and next-shift handover notes in under one minute.
2. Performance engineer: inspect every event in source context, compare with *user-chosen* per-operation baselines, understand which delays are unplanned vs routine.
3. Field engineer: open a mobile-friendly message or audio briefing without navigating a desktop analytics dashboard.
4. Energy stakeholder: understand estimates and their uncertainty with explicit rate/fuel assumptions.

## Golden path (MVP story)

**Home → import → review → diagnose → brief**
1. Land on a beautifully prepopulated bento dashboard. Yellowish caution label states **SYNTHETIC DEMO DATA**.
2. Select Upload drilling report; accepts PDF, CSV, XLSX or TXT up to 8 MB. No key? A clear error, **never a fake "success"**.
3. Gemini produces structured events, technical shorthand translations and brief quoted evidence. API validates schema + impossible/overlapping times and sends report to browser.
4. Top KPIs show classification-aware efficiency, NPT hours, a documented ILT opportunity estimate, modeled cost exposure and *scenario* carbon estimate. Cards provide assumptions / unavailable indicators.
5. Select an event in activity table; a modal shows raw excerpt, exact source page when available, model confidence and plain-English explanation.
6. Generate a verbal handover using ElevenLabs; display text fallback when credentials aren't configured. Enable messaging only after valid Photon project and channel setup.

## P0 (must work) vs P1 and P2

P0 — judge must be able to demonstrate:
- Clean responsive landing dashboard in light mode.
- Working raw upload to actual extraction, plus clearly distinct no-key/error state.
- Strict event schema and deterministic NPT + ILT math.
- Visual time/depth + interactive source evidence.
- Sourced synthetic-versus-real labeling.
- ElevenLabs playable audio **or** explicit fallback in pitch if unavailable.
- Predictable 3-minute demo script and a pre-recorded backup.

P1 — only after P0 integrated:
- Real 2021 Utah FORGE single-day PDF with time citations manually audited.
- Photon 2.0 reply into **existing, opt-in** iMessage conversation; human-verified screen recording if live sends fail.
- Editing scenario inputs (daily rig rate, ROP benchmark, fuel delta) with immediate recalculation.
- Confidence/unknown filters and quality coverage KPI.
- Basic Postgres/Tiger Data storage for trend history (prize expansion).

P2 — stretch:
- Image inspection of damaged drilling equipment, only as *visual triage*, not authoritative IADC grading or engineering work orders.
- Cross-well peer comparisons that use comparable lithology, well section and drilling conditions.
- Real-time rig telemetry integration (not in the hackathon starter).
- Auth, RBAC, audit log, saved analyses, storage, reprocessing queues, alert review workflows.

## Explicit non-goals
- Automatic safety instructions or well-control procedures.
- Guarantee of "billions saved", precise CO2 avoided, or actual financial recovery.
- Hardcoded "30% lost time" claims without a suitable study.
- Claiming a synthetic mud pump failure happened in a public Utah FORGE log.
- Automating real rig control or asking operators to act on model predictions.

## Prize focus — verified 2026 SBUHacks categories
Target **Gemini** (evidence-oriented document parsing), **ElevenLabs** (human-readable audio), and optionally **Tiger Data** (time-series benchmark database) where a working integration is defensible. The official MLH list also names Snowflake, Vultr, GoDaddy, Solana and DEV. Photon is a legitimate communications provider but **not one of the eight listed MLH prize categories** on the checked event page. If the organizers offer separate challenges, verify those in event materials rather than assume.

## Product success metrics (during judging)
- An untrained judge can find the main downtime cause in two clicks.
- Every highlighted event has provenance or is visibly marked unsupported.
- No NPT/ILT double counting; deterministic tests pass.
- User can distinguish raw observed time, benchmark-derived opportunity, and modeled cost/carbon at a glance.
- Every real outgoing message is truthfully labeled "accepted" until delivery state is confirmed.
