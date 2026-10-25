# Mantle synthetic demo dataset pack

Every file in this folder is **fictional synthetic data created for demonstration and deterministic testing**. The well labels, activities, depths, classifications, and notes do not describe an actual well, operator, or field event. Filenames begin with `SYNTHETIC_DEMO-`, so Mantle labels imports `SYNTHETIC_DEMO`.

These canonical CSVs use explicit report dates, minute-of-day timestamps, activity codes, classifications, and feet. Mantle parses them locally without Gemini. Each source note is synthetic text, and the evidence panel points to its CSV row.

## Scenarios

| File | What it demonstrates | Coverage | Confirmed NPT | Drilling ILT | Efficiency result |
|---|---|---:|---:|---:|---|
| `SYNTHETIC_DEMO-single-day.csv` | Existing short example with drilling, planned circulation, and an explicitly classified NPT interval. | 16.7% | 1.0 h | 0.0 h | Not available: only four hours are observed. |
| `SYNTHETIC_DEMO-steady-operations.csv` | Full day with drilling, circulation, casing/cementing, and tripping. Flat depth during planned work is not treated as downtime. | 100% | 0.0 h | 0.0 h | Not available: only half of productive time is eligible for the drilling benchmark. |
| `SYNTHETIC_DEMO-confirmed-npt.csv` | Explicit waiting and repair classifications. Shows NPT and the rig-rate scenario. | 100% | 8.0 h | 0.0 h | 66.7% under the default 35 ft/h assumption. |
| `SYNTHETIC_DEMO-slow-drilling-ilt.csv` | Productive drilling at a synthetic 17.5 ft/h versus the default 35 ft/h scenario benchmark, followed by explicit NPT. | 100% | 4.0 h | 10.0 h | 41.7% under the default benchmark. |
| `SYNTHETIC_DEMO-incomplete-unknown.csv` | Six observed hours, one UNKNOWN interval, one NPT hour, missing depths, and an unreported 18-hour remainder. | 25% | 1.0 h | 0.0 h | Not available: partial day and unknown source values. |

All dollar values use the default **assumed** rig rate of $120,000/day ($5,000/hour). The confirmed-NPT case therefore shows a $40,000 NPT cost scenario; the slow-drilling case shows $70,000 combined NPT + ILT time exposure. These are calculations under demo assumptions, not actual costs or recoverable savings. Fuel and CO2 stay unavailable because no incremental fuel assumption is provided.

## Use in a demo

1. Start the app with `npm.cmd run dev` and open `/console`.
2. Upload one CSV from this folder. No Gemini key or live provider call is needed for these canonical tables.
3. Confirm the selected report is labeled `SYNTHETIC DEMO` and inspect its event rows and source snippets.
4. Use the NPT and slow-drilling files to compare explicit NPT with benchmark-relative ILT. Use the incomplete file to show why gaps and UNKNOWN time remain visible and why whole-day efficiency is unavailable.
5. For a real-source segment, use the separate public Utah FORGE fixtures in `demo-fixtures/public/forge-78b-32/`; do not present this synthetic pack as field evidence.

## Expected calculations

The figures above use the default scenario assumptions in `src/types/telemetry.ts`. Changing assumptions recalculates ILT and scenario costs. NPT labels and the synthetic source statements remain unchanged. The report engine does not infer trip ILT from hole depth.
