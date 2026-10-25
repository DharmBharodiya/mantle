# Rig Supervisor Copilot

Implemented inside the existing Mantle console on 24 October 2026 (America/New_York). Gemini ingestion, canonical telemetry, report-day safeguards and deterministic analytics remain unchanged. No new dependencies, vector database, authentication service, report cache or external embeddings API were added. Photon and ElevenLabs are excluded.

## What works and what is not yet verified

The copilot is a working request/retrieval/calculation/conversation feature, with a server-side Gemini integration and explicitly labeled deterministic fallback. The UI supports selected reports, question suggestions, follow-up event references, expandable citations/calculations and original-event navigation.

**Live limitation:** the first public-data request successfully used Groq to interpret the question, but its explanation failed grounding validation and was withheld. The next request hit Groq's rate limit and used the deterministic fallback. The live smoke stopped. No successful accepted live Groq narrative or full live four-question evaluation is claimed; those observations predate the Gemini provider switch. The subsequent conservative statement-level validation/context reduction is offline-tested, not live-rerun. This is a remaining release gate, not a fabricated provider success.

## Architecture and state

Question + explicitly checked in-memory reports -> validated Gemini intent -> scoped structured/keyword retrieval -> canonical TypeScript calculations -> bounded Gemini explanation -> validated citation references + original evidence + audit details.

- Reports already live in the console's React/module memory. Copilot does not have a server report store. The panel sends only checked analyses (metadata, normalized events/evidence, warnings and assumptions), not uploaded raw PDF bytes or unrelated reports.
- The API processes those records per request, returns no-store responses, and retains no report/history cache. A process-local integer limits concurrent requests; it contains no user data.
- The console retains at most twelve visible question/answer turns; at most six prior questions/focus references are sent. Historical assistant prose is not accepted as evidence or authoritative context.
- Report scope changes clear the conversation. Report/scenario changes remount the scoped panel. Console navigation preserves the mounted conversation; navigating away cancels active requests. Refresh/leaving the console can lose the conversation and full in-memory reports. No raw evidence or conversation is persisted to localStorage.
- Focus consists of reportId + eventId, revalidated against the current selected reports. A unique longest event or a single match can establish focus. Ties do not invent a referent. Previous/next retrieval stays within that report's sorted timeline. Missing/invalid context prompts clarification.

## Gemini configuration

~~~env
GEMINI_API_KEY=your-server-secret
GEMINI_MODEL=gemini-3.1-flash-lite
~~~

Use ignored .env.local for local work and host runtime secrets for deployment. Never NEXT_PUBLIC_ or client storage. .env.example documents names only. The actual local key/model were checked without printing the key. No credential file was edited.

Intent and narrative use the existing server-side `@google/genai` client and configured `GEMINI_API_KEY` / `GEMINI_MODEL`. Structured JSON responses are validated with Zod. The copilot uses the same Gemini credential and model configuration as report extraction; no separate provider credential or additional model key is required.

Gemini handles report extraction and copilot question interpretation/explanation. Mantle calculates all authoritative metrics. Missing Gemini credentials leave deterministic results and evidence available.

## API contracts

POST /api/copilot, application/json, Node runtime, advertised maxDuration 60 seconds. One request contains:

~~~json
{
  "question": "What happened immediately before it?",
  "reports": [{
    "id": "browser-analysis-id",
    "extraction": {"wellName":"...","reportDate":"YYYY-MM-DD","events":[],"warnings":[]},
    "scenario": {"rigDailyUsd":120000,"tripBenchmarkFtPerHour":800,"drillBenchmarkFtPerHour":35,"excessFuelGallonsPerHour":null,"kgCo2PerGallon":10.18},
    "sourceKind":"PUBLIC_SOURCE_UNREVIEWED"
  }],
  "history": [{"question":"What was the longest delay?","focus":{"reportId":"browser-analysis-id","eventId":"source-event-id"}}]
}
~~~

This example illustrates shape only: actual requests require nonempty validated events and real scope IDs. Submitted metrics are ignored/stripped; every selected report is rebuilt through buildWellReport. Non-synthetic sources cannot be promoted to HUMAN_VERIFIED by the caller.

Query intent includes a validated kind (lookup, aggregate, NPT, ILT, timeline, compare, summary, evidence, missing, term, unsupported or clarification), supplied report IDs, existing activity/classification enums, search terms, optional explicit clock-window minutes, ranking and relative direction. Unknown IDs or invalid filters reject that intent and trigger conservative scoped fallback.

Success returns requestId, mode (GEMINI or DETERMINISTIC), providerNotice, applied intent/scope, summary, narrative statements, citations, calculations, warnings, focus and retrieval limits. A provider failure may still return HTTP 200 with useful deterministic results; mode and providerNotice explicitly disclose that no accepted conversational explanation is available. Request/validation/body/origin/concurrency/cancellation errors return non-2xx safe JSON errors. This endpoint is separate from ingestion's NDJSON protocol.

## Retrieval and numerical provenance

- Filter only the explicitly supplied report scope; no global documents, filenames or external knowledge store. Report dates remain separate, never one combined 24-hour timeline. Out-of-scope ISO dates and unresolved follow-ups prompt clarification. Comparisons require at least two selected analyses.
- Use structured activity/classification/time filtering, full source/note/explanation keyword matching and drilling synonym matching (including POOH/POH, RIH, casing/cementing, circulation, BHA and ROP). Rank by relevance, duration or chronology.
- NPT queries select explicitly classified NPT, never infer it from a flat hole-depth line. ILT queries use supported computed drilling ILT under the selected scenario. Time filters include whole contained source intervals; no invented prorating.
- Calculations run through existing buildWellReport/computeILTMinutes. The response includes matched observed time, classified NPT, drilling interval time, eligible ILT, modeled exposure and nullable carbon. Activity questions add per-activity canonical durations. Longest questions separately expose the maximum matched interval, distinct from total NPT.
- Every calculation carries metric, value/unit, report day, readable filters, included event IDs, citation IDs, assumptions, formula/basis and quality warnings. Included IDs can navigate to original events. Unknown depths remain null and carbon remains null without explicit incremental fuel assumptions. Opportunities are scenarios, not realized savings.
- Up to twenty ranked event excerpts and selected conflict warnings are returned. Calculations include every matched record, even if not all excerpts are ranked into the answer; all included record IDs remain inspectable. Retrieval limits are disclosed. The API does not claim a zero matching subset proves complete source coverage or zero operational losses.
- Provider context is smaller than the audit payload: up to ten ranked event passages plus review warnings (twelve sources total), at most 800 characters per passage with an explicit context-truncation flag, compact deterministic facts and bounded warnings. UI citations retain the full original available excerpt, not the shortened provider context.

## Evidence, conflicts and explanation validation

Citation IDs are generated by Mantle for actual selected source events/review annotations. Gemini can refer only to supplied IDs; invented report/citation/calculation references are rejected. Original filenames, available page/row/sheet, event ID, confidence and exact stored excerpt are returned. Review warnings are labeled separately and never masquerade as verified contiguous PDF quotations. Selecting page boundaries or importing a snapshot does not establish source verification.

Source content, names, warnings and prior questions are explicitly untrusted data. They never become system instructions. No tools, browsing or document instructions are executed by the Gemini request. React renders answer/source text as escaped text; external Markdown links from generated prose are not accepted.

Authoritative quantities appear in deterministic calculation panels. The generator is instructed to omit numerical quantities from prose. Digit-bearing/external-link prose, common spelled quantity claims, unknown references and uncited factual explanations are withheld. Valid remaining statements may be shown with a notice that others were rejected. If none survives, deterministic facts/evidence remain available. This validation reduces numeric/citation errors; it is **not** a proof that every paraphrase semantically follows from its cited excerpt. Qualified human review is still necessary.

The FORGE regression preserves header 4.0 drilling hours versus the explicit 01:30-05:00 timeline of 3.5 hours/210 minutes. The source header is available only when supplied in the selected analysis's warning/review evidence. The raw older snapshot predates that annotation; the copilot must not invent an absent header. Tests cover both an explicitly labeled source-review annotation and absence of that evidence. It never silently reconciles the values or invents a reason. Use an analysis carrying the actual discrepancy warning (or the separately reviewed snapshot) to demonstrate both source claims; event timing remains unchanged.

## Reliability and privacy bounds

- Maximum question 1,200 characters; 1 MB streamed request-body limit; at most four reports / 1,000 events; six historical questions/focus references. Empty reports, invalid dates/overlaps and duplicate scope IDs reject before generation.
- Gemini copilot context is capped at 65,000 characters and generated output at 2,400 tokens. The API route has a 40 second total budget and the browser has a 45 second wait limit; the parent cancellation signal bounds the existing Gemini client call.
- Short retry-after values (up to one second) are honored within the bounded policy; longer/different limits return a clear rate-limit fallback. Auth/model/schema errors and timeouts are not blindly retried. Cancellation propagates to fetch and blocks late client commits. No report is modified by a question.
- At most three copilot requests execute concurrently per process. Same-origin browser submissions are checked; this is **not authentication, a distributed rate limiter or a complete public API abuse-control system**. No such infrastructure was introduced. Apply existing host access/usage limits before public exposure.
- No ordinary logs contain report text, questions, keys or raw provider errors. Provider notices use safe classifications. QA observations contain only the authorized public FORGE fixture and are explicitly separated from user-private data.

## Console interface and demo

1. Import a real snapshot or analyze a report using the existing workflow.
2. Open **Rig Supervisor Copilot**. Check the desired report analyses and optionally filter the well list. Only checked data is sent on Ask/suggested-question clicks.
3. Ask ?Which activities consumed the most time?? Expand calculated activity durations and Supporting sources; inspect the corresponding original event. The longest interval and whole-day NPT are different calculations.
4. Ask ?What happened immediately before it?? after an answer with a unique focus. It retrieves the previous event in the same report, not an invented causal relationship. If the focus is ambiguous/missing, select/ask about a specific event first.
5. Create a scenario copy through existing Benchmarks, then select both analyses in Copilot and ask for comparison. At 100 ft/h and $240,000/day the FORGE scenario yields 34.2 minutes and $5,700 modeled ILT opportunity; fuel/carbon stay unknown when blank.
6. Ask about missing data or a known source conflict. Expand review annotations and calculation detail; do not present annotations as raw PDF quotes.
7. Cancel question stops waiting without changing reports. Clear conversation clears only local copilot context. Scope/data changes reset it. If Gemini is limited, the UI explicitly displays deterministic evidence/calculations instead of fake AI prose.

All new controls use existing Mantle tokens, icons, native labels/buttons/details, 44px target classes and sans/mono typography. No new theme or chart design was introduced. The copilot is hidden outside its workspace view and does not replace the selected report's print summary. Browser connector inventory currently returned no available surfaces; full interactive desktop/390px/focus verification remains manual. Component/server-rendering checks are not a browser test.

## Tests and actual observations

Before the provider switch, **271 tests / 27 files PASS**, TypeScript, ESLint and production build passed, and **41 deterministic HTTP assertions PASS**. Those earlier copilot HTTP checks ran with the Groq key unavailable; they do not verify the active Gemini copilot path. The updated HTTP check requires GEMINI_API_KEY to be blank in the QA server process to prevent live calls. These results are historical and must be rerun against the migrated source before claiming final verification.

Automated evidence is in docs/qa/copilot-{checks,typecheck,tests,lint,build}.json/txt as appropriate. Final test counts and command results are recorded there rather than inferred from compilation. The existing ingestion, analytics, report-day and dashboard suites run unchanged alongside the new tests.

New tests cover intent/schema validation, scope/keyword/synonym ranking, real FORGE numerical values, unknown values, missing evidence, report comparison, single-report boundaries, previous-event references, source discrepancy preservation, unsupported/ambiguous requests, provider timeout/rate/auth errors, missing keys, prompt injection as untrusted data, cancellation/late client responses, complete escaped excerpts and UI audit controls. The public-source eight-question offline evaluation is tests/fixtures/copilot-forge-eval.json; it is not a fabricated live model benchmark.

Live smoke: node scripts/verify-copilot.mjs --live submits at most four public FORGE questions, stopping on provider unavailability; without --live it compares recorded observations. The actual run recorded only two:

| Request | Elapsed | Actual result |
|---|---:|---|
| 80b59a74-49a6-41ca-a67f-e6a945b537d6 | 1,736 ms | Groq intent successfully selected AGGREGATE/LONGEST and the correct final source event. Generated explanation failed grounding validation; mode DETERMINISTIC. |
| ddea451f-2974-4359-94c3-8c60471194e5 | 79 ms | GROQ_RATE_LIMIT fallback. Deterministic follow-up still found the correct preceding event. Further smoke cases stopped. |

Raw public observations and strict FAIL results remain in docs/qa/copilot-live.json and copilot-live-comparison.json. Raw rejected model text was not retained in ordinary logs, so its precise failed claim cannot be reconstructed. The subsequent per-statement validator provides non-sensitive rejection categories and narrower context. It has regression coverage, but no later live request was made after the rate limit. Do not report the live narrative, conflict or comparison checks as passed.

Deterministic end-to-end HTTP smoke: scripts/verify-copilot-http.mjs requires a QA server with GEMINI_API_KEY intentionally set to a single space in that **process only**. This leaves .env.local unchanged and prevents provider traffic. The previously recorded results predate this change and used the Groq-missing fallback. It tests real HTTP fallback retrieval, canonical metrics, genuine excerpts/focus, follow-up, comparisons, conflict annotation and invalid inputs. Evidence: docs/qa/copilot-http.json. Existing twenty-eight ingestion/analytics/selection HTTP guards are saved separately in copilot-existing-http.json.

## Remaining verification and deferred work

- Groq observations are historical evidence only. The active Gemini copilot path has not had a fresh live narrative smoke after this provider switch.
- Browser interaction/reduced-motion/mobile and print checks remain manual. Rehearse scope reset, suggestions, Enter submission, cancellation, source anchors, calculation expansion and original-event navigation at 390px and desktop.
- Source quotations and model interpretations remain unverified product data. No OCR verifier, domain normalization, causal diagnosis, geological benchmark or extraction accuracy benchmark is claimed.
- Keyword/terminology retrieval is deliberately bounded and does not replace semantic embeddings for every query. Natural-language filter interpretation may be imperfect; inspect visible filters and included records. Fallback is conservative and can ask for clarification.
- No persistent chat/report store, cross-user retrieval, auth, external embeddings, vector database, autonomous operational actions, Photon or ElevenLabs integration. No push, merge or deployment.

## Files and local checkpoints

- src/types/copilot.ts: bounded request, intent, citation, calculation and response schemas.
- src/lib/copilot/retrieve.ts: request-only canonical reports, scoped retrieval, terminology, timeline references and numerical provenance.
- src/lib/copilot/gemini.ts and answer.ts: Gemini transport, intent/answer orchestration, fallback and grounding checks.
- src/lib/copilot/client.ts and src/app/api/copilot/route.ts: validated browser/API transactions and cancellation.
- src/components/mantle/copilot/*: console conversation, scope, source and calculation controls. Console page/sidebar changes only add navigation/integration.
- tests/copilot-*.test.ts(x), tests/fixtures/copilot-forge-eval.json: sixty-three regressions/evaluation cases. scripts/verify-copilot*.mjs: public live/offline comparison and deterministic HTTP verification.
- .env.example uses the existing server-only Gemini variable names; .env.local and package files were untouched. Existing unrelated working files were excluded from all feature commits.

Provider migration note: question interpretation and explanations now use the existing Gemini server client and model configuration. The Groq observations in the live-smoke table above are retained as historical results. The numerical-prose grounding guard remains enabled, so prose containing unsupported numbers may still be withheld.

Local checkpoint commits on feat/solo-overnight: c36a5df253e5a8f6ca15bd09b082f60227c59e5c (retrieval/API), 8bb5e26c2ca526d560cc0d8a3a884896f96d44ff (console/client), 24ef1d22f37fcb6949b7fa34291416c57c3f4d12 (grounding/context correction). Final source/details/evidence are in subsequent local checkpoints. No remote CI was triggered or verified because no commit was pushed.
