# Mantle: three-minute judge pitch

Use with the exact screen sequence in DEMO-READY.md. Rehearse at a calm pace with pauses for actions. The report is a cached genuine extraction; do not describe it as today's live call.

## 0:00-0:20 - Homepage and console

"Geothermal drilling reports record what happened, but engineers still need to turn those pages into a usable operating timeline. Mantle extracts the observations with Gemini, calculates the metrics in TypeScript, and keeps the source evidence beside the result."

## 0:20-0:45 - Genuine report overview

"This is a saved extraction of Utah FORGE well 78B-32 from June 28, 2021. We compared all seventeen intervals and ending hole depths with the original report. Those extracted intervals cover twenty-four hours, ending at a reported depth of 421 feet. The extraction classifies no interval as NPT; planned-activity labels are interpretations for review. Flat depth alone is not downtime."

## 0:45-1:15 - Evidence and conflicting source claims

"Select the drilling interval: 1:30 to 5:00, from a reported 128 to 421 feet. Here is the extracted source quote and its page reference. The header says four drilling hours, while this interval is three and a half. Mantle's newer extraction path flags that disagreement. We preserve both claims and calculate from the explicit timeline; we do not stretch an event to make the numbers agree."

## 1:15-1:55 - Explicit scenario

"Now I copy the analysis and change two assumptions: a 100-foot-per-hour drilling benchmark and a 240-thousand-dollar daily rig rate. These are demonstration assumptions, not verified values for this well. With the same observations, Mantle calculates 34.2 minutes of drilling ILT and 5,700 dollars of modeled opportunity. Nothing here proves recoverable savings. Fuel stays blank, so carbon stays unknown. This calculation does not call Gemini again."

## 1:55-2:20 - Comparison

"The comparison separates changes in assumptions from changes in source data. Both analyses describe the same day. At the default benchmark this report has no drilling ILT; under our faster assumed benchmark it does. The assumptions explain the difference."

## 2:20-2:45 - Exports

"I can export the events, available evidence and scenario assumptions as CSV, or retain the analysis as a JSON snapshot. Import recalculates the metrics and keeps the report labeled unverified. We also have a clearly labeled synthetic backup that imports without the model."

## 2:45-3:00 - Close

"Mantle gives engineers a timeline they can question and trace back to the report. The next validation step is domain review across more wells and days. Steel goes down; steam comes up."

## If Gemini availability is raised

"Today's fresh multi-page request returned provider busy after bounded retries, so no report was imported. The demo uses the previously checked cached report. We do not claim that today's quote-verification attempt passed."

## If full release readiness is raised

"Automated and local HTTP checks pass. Full mobile, keyboard and print rehearsal is still pending because browser automation stopped. We document that separately from backend validation."
