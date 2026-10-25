# Utah FORGE Well 78B-32: real demo source

Source: John McLennan, Energy and Geoscience Institute at the University of Utah (2021), *Utah FORGE: Well 78B-32 Daily Drilling Reports and Logs*. DOI: https://doi.org/10.15121/1814488.

- Catalogue and license: https://catalog.data.gov/dataset/utah-forge-well-78b-32-daily-drilling-reports-and-logs (CC BY 4.0: https://creativecommons.org/licenses/by/4.0/).
- Original: https://gdr.openei.org/files/1330/78B-32-DailyDrillingReports-6-27thru7-31.pdf.
- `2021-06-28-operations.pdf`: unchanged page content copied from original PDF page **4** (report 2, dated 28 June 2021, printed page 1 of 3). The excerpt is now a one-page PDF; page 1 in Mantle refers to this excerpt, **not** original PDF page 1. Other pages were omitted, not reauthored.
- Complete PDF SHA-256: `e1424b3a73dc878a09e23698a03f3f40bf59e5817bc7847af0c58d1cf384964f` (download retained locally in ignored `docs/qa/forge-78b-32-original.pdf`).
- Excerpt SHA-256: `54da4b3d01fec8bbd75124aecb1b69b5a6e8a5812a1ab3d7478452b051f709c4`.
- `2021-06-28-gemini.snapshot.json`: the actual saved HTTP/Gemini result, suitable for Reports -> Import snapshot. It is **real-source, unverified model extraction**, not synthetic data or newly rerun extraction. Import recomputes metrics and preserves unverified provenance.
- `2021-06-28-expected.json`: manually transcribed interval/depth expectations and operations text, compared with the original PDF. Final 17:00-0:00 plus explicit 7.00 hours establishes an end-of-day 24:00, not an inferred second day.

Live observation on 24 October 2026: configured `gemini-3.1-flash-lite`; actual request `764fd946-5cfb-43c0-b633-6a5cf1bd723c`; 21,556 ms client elapsed; HTTP 200 with a terminal report envelope; 17 events; 1,440 observed minutes; 0 NPT minutes. Raw stage/report evidence: `docs/qa/forge-live-observed.json`.

## Review limits and source discrepancies

All 17 time intervals, derived durations, ending hole depths and returned excerpts matched the original operations table after whitespace normalization. The drilling interval is 01:30-05:00, 128-421 ft: 293 ft in 3.5 h. Casing shoe depth (416 ft), float collar depth and wiped/tripped tool positions were correctly kept separate from hole measured depth (421 ft).

The header instead lists 293 ft / 4.0 h and 73.25 ft/h. This disagrees with the timed operations interval. The original next page's BHA table lists 293 ft / 3.5 h / 83.7 ft/h. Mantle uses the explicit operations interval (210 min), giving 83.714 ft/h if independently calculated. The header was not silently forced into that timeline.

No rows are marked Non-Prod on this page. PRODUCTIVE classifications are model interpretations of planned assembly, filling, drilling, trips, casing/cementing and BOP work; they are not literal PRODUCTIVE labels in the PDF. Activity buckets are coarse: surface assembly maps to OTHER, pipe filling to CIRCULATING, hole wiping to TRIPPING_OUT. These interpretations need domain review; the original snippets remain available. No times, depths, quotes or NPT corrections were needed for this sample. This is one reviewed day, not an extraction accuracy benchmark.

Default 35 ft/h assumption produces no drilling ILT and no modeled time exposure on this day. Only 210 minutes are benchmark-eligible; trip ILT remains unavailable. Selecting **an assumed** 100 ft/h benchmark and $240,000/day rate produces 34.2 minutes / $5,700 drilling ILT scenario; this is not an established benchmark, actual rig cost or demonstrated savings. Fuel/carbon remain null unless an incremental fuel assumption is supplied.

## Repeat checks

- `node scripts/validate-forge.mjs`: offline recorded result versus original transcribed text; no model call.
- `node scripts/validate-forge.mjs --http`: also tests the running local analytics API; no model call.
- `node scripts/validate-forge.mjs --live`: uploads this public PDF through the actual ingestion/Gemini path and saves a **separate** latest-run result. Requires a local server, authorized key, capacity and quota. It does not overwrite the reviewed demo snapshot or original observation.

## Final backend sprint PDF fixtures

The following public-source excerpts were copied with pdf-lib from the checksum-verified original PDF; no page text or measurements were reauthored. They are input validation fixtures, not new drilling observations.

| File | Original PDF pages | Purpose | SHA-256 |
|---|---|---|---|
| `2021-06-28-full-day.pdf` | 4, 5, 6 | Full three-page report 2 for 28 June; exercises two extraction sections and appendices | `775206c4bf99a400146a7ec4ab30e284d2228a889373d075ff193cdd7131762d` |
| `2021-06-28-and-29-operations.pdf` | 4, 7 | Two operations pages with distinct Report For days; must reject as multi-day | `0e4e0b8dabe3c50743386e43de4ce103fa8fdc43545e373b03895a29bdbce9a8` |

The same John McLennan / EGI University of Utah dataset attribution, DOI and CC BY 4.0 license above apply. Original-page references are mapped to excerpt-local page numbers on upload. The PDF copies retain public header contact information already present in the dataset; no private source was used.

The final sprint also corrected corrupted typographic inch marks in the manually transcribed final operations row (`operationsText` in the expected JSON). Original PDFs, recorded raw extraction and observations were unchanged. The corrected expected text uses the original right-double-quote characters rather than encoding-substitution question marks.

`node scripts/verify-final-backend.mjs --live` makes two genuine HTTP/Gemini checks and records their responses. Add `--single-day` to run only the three-page day, writing separate evidence. Without `--live`, the script compares saved evidence only. See `docs/FINAL-BACKEND-VALIDATION.md` for actual successes, failures and scope limits; fixture existence never implies live success.
