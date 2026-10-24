# Copy-paste prompt — PERSON 4 (ElevenLabs, Photon and field handover)

**Your branch:** `feat/p4-field-comms`

```text
You are P4, the BoreSight field communications / sponsor integration developer. Read AGENTS.md, docs/02-ARCHITECTURE-CONTRACTS.md, docs/03-TEAM-AND-GIT.md, docs/04-UI-UX-DESIGN-SYSTEM.md, docs/06-DATA-PROVIDERS-AND-SECURITY.md and src/types/telemetry.ts before editing.

Exclusive writable paths:
- src/lib/comms/**
- src/app/api/briefing/**
- src/app/api/dispatch/**
- src/components/comms/**
- tests/comms.*
Never edit package files, contract, app/page.tsx, other owners' UI or shared configurations. Ask lead for dependency/config requests.

MISSION: implement human-reviewable shift handover summary + real, graceful ElevenLabs MP3 playback + opt-in Photon 2.0 beta messaging, preserving an elegant light-mode SaaS interface.

ELEVENLABS:
1. Input is the validated WellTelemetryReport or reconstruction using shared ExtractionSchema/ScenarioSchema. `createBriefing` outputs ~90–150 words with well name, observed classified hours, NPT duration, modeled ILT opportunity, modeled rig-rate cost, source verification status, biggest evidence-backed NPT event, and an explicit review caveat. No certainty on root causes that extraction did not support.
2. GET? Do not add new public routes. POST `/api/briefing` with body `{extraction, scenario, sourceKind, mode:'script'|'audio'}`. 'script' returns JSON `{script}`, 'audio' calls ElevenLabs server-side using ELEVENLABS_API_KEY/VOICE_ID and returns `audio/mpeg`. Handle credits, 401, 429, timeouts. No automatic paid audio calls on page load.
3. `ShiftBriefing` right rail draws a clean voice waveform motif, script preview, native audio controls on successful generation and clear errors. If you implement Web Speech API fallback, label it 'Browser speech — not ElevenLabs'. Avoid visually faking playing/delivery.

PHOTON:
1. Use Photon 2.0 Beta ONLY; do NOT mix stable Spectrum auth. Verify SDK signatures with current Photon docs before coding (https://photon.codes/docs/beta/get-started/imessage). Existing code has `@photon-ai/api` adapter but may need adjustment to latest SDK; do not invent provider API signatures. If package version update needed, request from lead.
2. `ENABLE_REAL_DISPATCH` stays false until human confirms recipient/sender. Require configured server-side API token/project; validate verified existing conversation space and sender ID. Protect user confirmation at UI before any send. No speculative writes to random phone numbers.
3. Include idempotency key and distinguish REQUEST ACCEPTED from DELIVERED. Never claim delivery on HTTP 2xx alone. If provider cannot be wired during hackathon, show clearly marked UNSENT preview, not a fake chat thread.
4. Outgoing message must mention source status, time, NPT hours and model estimates. No actionable well-control commands.
5. Add unit tests for message formatting, missing config and validation without live credits.

DELIVERABLE: working script preview, ElevenLabs MP3 test if key provisioned, Photon test receipt if enabled (or explicit blocker), UI demo with honest states, changed files, checks run and remaining risks.
```

## P4 acceptance
- Script works without credentials; voice shows graceful missing-key error, then plays MP3 with key.
- Field messaging cannot silently send to an unapproved recipient.
- No fake delivery success or fabricated incoming chat.
- All work stays within P4 paths.
