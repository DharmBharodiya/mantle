# Mantle homepage integration

The supplied `mantle-kit/` directory is reference material, not a second application to compile. It was inspected in full for homepage/design integration. Its source files remain untouched.

## Implemented scope

- `/`: Mantle-derived thermal ASCII homepage, retaining the BoreSight product name.
- `/console`: existing working BoreSight dashboard and all existing upload, analytics, report management, comparison, vision and export behavior.
- Homepage navigation links reach actual sections, the console or report intake. No fake sign-in, repository link or team identity is displayed.
- Attach, drag/drop and pasted-report text call the existing ingestion helper/API. Only a complete validated report is handed to the console. Upload errors remain visible on the homepage and never replace console data.
- Handoff and console session are memory-only, not localStorage/sessionStorage/URL payloads. Full-page reloads still discard full in-memory reports; explicit JSON export/import remains the persistence option.
- Interactive synthetic preview supports source inspection by its time strip and keyboard-accessible selector.

## Compatibility decisions

The source kit targets Next 16/Tailwind 4. The application remains Next 15/Tailwind 3; no dependency/framework upgrade was needed.

- `src/styles/mantle.css` contains the kit tokens, primitives and motion, scoped to `.mantle-page` so the current console stays visually intact.
- Tailwind 4 `@theme` declarations were moved into Tailwind 3 theme extensions. Ground and border utility names are prefixed `m-` to avoid the existing dashboard's ink/line meanings. Tailwind 4 suffix-important syntax was replaced with a scoped class. Keyframe selectors remain unprefixed inside their keyframes.
- No global body color or typography override was applied to the console. Font variables are exposed on `<html>`; the Mantle homepage uses them through its route-local classes.
- Instrument Sans (400–600), Instrument Serif italic, and JetBrains Mono (400–500) are downloaded as local Latin WOFF2 files with their OFL license texts. `next/font/local` makes future builds independent of Google Fonts network availability. `scripts/fetch-mantle-fonts.mjs` can refresh them from official sources.
- `devIndicators: false` hides the Next badge as requested.
- TypeScript, ESLint and Vitest exclude the supplied `mantle-kit/` reference tree; tests target the ported implementation under `src/`.

## Engineering constraints retained

The kit's standalone metrics engine was not installed as a competing source of truth. Its `DrillEvent` format cannot represent UNKNOWN classification, null depth or null fuel safely. `src/lib/mantle/report.ts` is a homepage-only presentation adapter that delegates `computeDay()` to canonical `buildWellReport()` and is intentionally limited to the complete labeled synthetic fixture. Uploaded reports always use `WellTelemetryReport` in the existing console.

The kit's hardcoded pump-cost/ILT examples and source line/page claims were replaced with canonical fixture values, actual source IDs and exact excerpts. Invented proportional bars, time-to-build claims and inert auth links were removed. The homepage identifies its synthetic demo and scenario assumptions. The existing root AGENTS/CLAUDE engineering instructions remain in force; copying the kit's rulebook over them would remove provenance and error-handling safeguards unrelated to this homepage task.

Future Mantle UI work should follow the supplied kit's design guidance: near-black thermal ground, restrained heat accent, semantic violet/amber/pink data colors, Instrument type, no card eyebrows, real controls, one page trust note, paused/reduced-motion-aware canvas loops and visible keyboard focus. A future console visual migration must preserve UNKNOWN/null data and canonical analytics; do not drop in the reference console engine unchanged.

## Verification

Automated validation and actual HTTP results are recorded in SOLO-PROGRESS.md. Browser inventory returned no available surface in this session, so no new screenshots or observed 390px/1440px interactions are claimed. Responsive rules and local fonts are implemented; visually review both routes before presenting.

Manual demonstration:

1. Start `npm.cmd run dev` and visit `/`.
2. Inspect the thermal hero and use the section navigation.
3. Select a sample event in the platform preview; confirm its exact synthetic excerpt.
4. Attach `demo-fixtures/synthetic/SYNTHETIC_DEMO-single-day.csv` in the hero, then use the send control.
5. Confirm the processing stages lead to `/console` with that 3-event report, not the 9-event initial demo.
6. Use “BoreSight home” and return with “Open console”; the in-tab analysis should remain.
7. Try an invalid or empty file and confirm the homepage shows an actionable error without navigating.
8. At 390px, verify mobile navigation, intake buttons, chart labels and the sample selector without document overflow; test keyboard focus and reduced-motion settings.
