# Synthetic fixture provenance

`synthetic/SYNTHETIC_DEMO-single-day.csv` was authored for this local test suite on 2026-10-24. It is not copied from a real well. The 3 intervals are fictional: two hours drilling 1000→1070 ft, one hour planned circulation, and one hour explicitly unplanned waiting. Expected deterministic NPT: 60 minutes. Report-day coverage: 4/24 hours. All remaining time is unobserved.

The `SYNTHETIC_DEMO` marker is deliberately preserved in the filename and well label. Uploading it must never create a verified or real-source result. Offline unit tests mock Gemini; `scripts/smoke.mjs --live` makes an actual authorized provider request and distinguishes failure from success.

No real DOE or Utah FORGE report is bundled. Public source lookup at https://gdr.openei.org/submissions/1330 returned HTTP 429 during this run. See `docs/SOLO-QA-RUNBOOK.md` for the required real-source verification procedure and licensing checks before redistribution.
