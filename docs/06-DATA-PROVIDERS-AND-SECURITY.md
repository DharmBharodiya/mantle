# 06 — Datasets, APIs, assumptions and security

## Public datasets
**Utah FORGE / U.S. Department of Energy geothermal drilling data:** https://gdr.openei.org/submissions/1330 . Search for the Well 78B-32 daily drilling reports and accompanying time-series files. Download from its original repository, preserve original filename, exact well designation, event times, report date and page numbers. The reports are historical (e.g. 2021), not 2026 live rig data. No real report content ships in this starter kit. Review access/license details on the dataset page before public redistribution.

**Volve:** Equinor's released North Sea dataset, valuable for additional real daily drilling reports; more complex and oil-and-gas focused. Start with FORGE to preserve the STEAM narrative.

## Gemini / Google AI Studio
1. Create API key at https://aistudio.google.com/ and set `GEMINI_API_KEY` in `.env.local`.
2. Start with `gemini-2.5-flash` (set via `GEMINI_MODEL`); confirm availability/quotas for your key.
3. The SDK `@google/genai` processes PDFs as inline multipart content; CSV and XLSX should be converted to bounded text rows, with resource limits. Prompt for JSON, validate with Zod and check plausible chronological intervals.
4. Never forward API keys to the frontend, include them in uploaded logs, or put provider response dumps in git.
5. Gemini does not establish evidence truth just because it returns valid JSON. Human check against source document is mandatory for claimed safety issues or root causes. Page numbers are model claims until manually verified.
6. Remember document prompt-injection defense: report text is untrusted data and must not override system instructions.

Docs: https://ai.google.dev/gemini-api/docs/document-processing and https://ai.google.dev/gemini-api/docs/structured-output .

## ElevenLabs
1. Get API key and accessible voice ID. Set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`.
2. Server route POST `/api/briefing` generates reviewable text and then MP3 using the voice API. Preview script first. The generated voice should be natural and clearly explain uncertainty.
3. Avoid overly specific fraudulent persona claims (“I am your actual rig superintendent”). Voice is synthetic and must be labeled as such.
4. Handle 401, quota, rate limit, timeouts. Never auto-generate audio with every page load; on-demand click only.

Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert .

## Photon messaging
This starter specifically references **Photon 2.0 Beta**, not the separate stable Spectrum API. Do not mix auth credentials or endpoints. The beta docs should be rechecked for live signatures at https://photon.codes/docs/beta/get-started/imessage .

1. Provision Photon 2.0 project, authenticated sender and existing consented test recipient/conversation.
2. Set `PHOTON_API_KEY`, `PHOTON_PROJECT_ID` and any required provider-specific IDs. On a real user-authorized send only, set `ENABLE_REAL_DISPATCH=true` on the server.
3. UI POSTs to `/api/dispatch` with verified `spaceId`, `senderId` and unique idempotency key. Server formats message from validated report and calls provider; returns **accepted** until delivery receipts are independently verified.
4. No unsolicited calls to real rig-floor numbers, no emergency alerts, no secrets on client, no fake incoming field engineer chat. If delivery can't be configured in time, show honest preview of *unsent* summary.

## Assumption registry and metrics integrity
- Rig rate defaults to **$120,000/day** purely as a demo user-editable scenario, not measured well cost.
- Drill ILT benchmark defaults to **35 ft/hour** as a demo reference, not applicable to all formations / drilling phases. Do not label recovered money certain.
- Trip benchmark default **800 ft/hour**, but **not applied** to hole measured depth because bit travel cannot be inferred from borehole depth.
- Fuel `excessFuelGallonsPerHour` intentionally defaults to **null**, since operating during a delay is not equivalent to all fuel being avoidable. Require explicit delta relative to feasible alternative. If provided, multiply delay hours × differential gallons/hour × 10.18 kg CO2/gallon and divide by 1,000 for metric tons; label modeled not measured.
- NPT time is classification of unplanned operating delay according to report; legitimate planned operations must not be called unproductive automatically.
- ILT can overlap productive operations but is **a portion of productive duration**; denominators should not count ILT twice.
- Hole depth progresses only during drilling and similar activities; flat segment during a planned trip or casing does not equal safety issue.

## Minimum security posture
- `.env.local` is gitignored; `.env.example` contains no working credentials.
- Restrict file type and byte size; handle PDF signatures; sanitize & bound parsed strings; avoid storing uploaded documents indefinitely.
- Do not log document full text, API keys, phone numbers, or personally identifying logs. Use fake crew names (or omit them).
- Set rate limits/auth before any public deployment; prototype endpoints are **not** protected for broad internet exposure.
- Never use this as a well-control or emergency-support tool. Every diagnostic interpretation requires domain expert review.
