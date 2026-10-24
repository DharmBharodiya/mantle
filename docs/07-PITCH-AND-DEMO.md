# 07 — How we demo and pitch BoreSight in 3 minutes

## The pitch (spoken, 15 seconds)
“Steel and steam power geothermal drilling—but crews still record critical work in PDFs and hand-typed daily logs. BoreSight turns those reports into an evidence-linked drilling timeline, reveals where hours may be recoverable, and creates an AI voice handover for the next shift. It helps engineers find operational friction without replacing their judgment.”

## 3-minute show flow
| Time | What the presenter physically does | What judges see / hear |
| --- | --- | --- |
| 0:00–0:25 | Open authentic DOE geothermal report alongside dashboard. Zoom into obscure abbreviations. | Real user problem, clear STEEL + STEAM connection |
| 0:25–0:55 | Select PDF/CSV and submit. | Gemini extracts bounded time segments, validates event evidence. If offline: transparently use preloaded **synthetic** scenario instead |
| 0:55–1:30 | Point to hole-depth line + NPT shaded band; click corresponding event row. | Instant original excerpt, page, translated event, timestamp, confidence |
| 1:30–2:05 | Open bottleneck bars and scenario assumptions. | NPT and ILT costs explained as **estimated, not real measured**; difference between actual time and modeled opportunity |
| 2:05–2:35 | Open field communications and hit “Generate with ElevenLabs”. | Synthesized, evidence-based spoken handover; the transcript always appears, even if audio service unavailable |
| 2:35–2:50 | If configured, send a real opted-in Photon test message. Otherwise show UNSENT preview and describe planned transport. | Honest mobile handover or honest limitation; no fake successful send |
| 2:50–3:00 | Close: “From hidden drilling logs to safer, faster learning loops for geothermal energy.” | One-sentence industrial usefulness + environmental relevance |

## Judge-ready differentiation
- **Not a PDF summarizer:** strict event timeline + deterministic benchmarks + financial scenario math + traceable source evidence.
- **Not generic project management:** an inverted measured-depth-vs-time curve and drilling-domain operational taxonomy.
- **Not fake real-time sensors:** process daily reports; mention that “digital twin” here means a reconstructed operational timeline, not live physics simulation.
- **Useful for geothermal:** drilling often dominates early capital deployment; faster analysis helps identify process improvements. Do not state savings are guaranteed.
- **Sponsor fit:** Gemini for extraction, ElevenLabs for voice, Photon for mobile handover. If contest prizes are mentioned, verify official categories at https://www.mlh.com/events/sbuhacks-5f/prizes just before submission.

## Tough questions and prepared responses
**Where is the training data?** We use source-constrained multimodal extraction with Gemini; we do not claim to train a custom drilling ML model. Analytics is deterministic on extracted events. Real PDFs are from DOE Utah FORGE, with source references.

**Does a flat depth line mean rig failure?** No. It means recorded hole depth did not grow. During tripping, cementing, planned maintenance, or uncertainty this can be expected. BoreSight highlights independently classified NPT intervals separately.

**Is $25,000 of savings real?** No. It is an estimated scenario: classified hours × user-chosen rig cost; ILT opportunity depends on technical benchmarks. The UI clearly labels this.

**Are CO₂ savings accurate?** Not without site fuel telemetry and counterfactual operating assumptions. In the default scenario they are unknown. Users can set an explicit differential consumption assumption to model—not measure—impact.

**Can someone deploy this to a drilling rig tomorrow?** No. This is a hackathon prototype. It requires engineering validation, secure access controls, robust source parsing, and site-safety procedures.

**Why a messaging bot?** People in PPE and at shift handover may not want to navigate desktop data. The same reviewed summary can be delivered through a configured test channel. We only claim real delivery if verified.

## Backups
- Bring a printed screenshot and a real public PDF source page.
- Keep the bundled synthetic dashboard one click away via “Reset demo”.
- Pre-generate *clearly attributed* audio if live voice credits are exhausted. Do not imply live generation.
- Keep a separate 90-second version of the pitch.
- Rehearse on the actual demo laptop and projector; set browser zoom to 90–100%, confirm Wifi, speaker output and chosen source file size.

## End screen (do not add a fake CTA)
“BoreSight — Industrial operations, made legible.”
