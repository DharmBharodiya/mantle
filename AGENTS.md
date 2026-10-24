# BoreSight | Solo autonomous build rules

This replaces the OLD four-person ownership rules for the current solo development branch. `agent-prompts/ROLE-P*.md` and `docs/03-TEAM-AND-GIT.md` are historical information, not constraints. The newest user direction overrides the former light-mode requirement: BoreSight must now use a premium, modern DARK visual system. The complete target and acceptance criteria are in `OVERNIGHT-MISSION.md`.

## Mission

Finish all reasonable, locally achievable BoreSight product development other than Photon and ElevenLabs. Work iteratively through EVERY phase of `OVERNIGHT-MISSION.md` without waiting for a new human prompt between phases. Implement and test, do not stop at a plan. Use the working repository and preserve good existing code, especially the previous P3 dashboard structure and behavior.

## Authority and boundaries

- You are the only active local developer. You may edit application source, tests, types, dependencies, scripts, docs, fixtures, and UI. Coordinate changes internally, keep contracts consistent.
- Work inside this repository on the current solo branch. Do not force-push, reset away changes, delete other branches, manipulate unrelated directories, or deploy/publish/spend money.
- Do not send messages, upload private files to new services, create external accounts, or enable paid infrastructure. Google Gemini calls on the provided server-side API key are authorized for developing and testing BoreSight with public/synthetic data. Never expose keys.
- DO NOT implement, integrate, test, or call Photon or ElevenLabs. Disable or clearly label their existing controls as 'Coming later'; no dead functioning-looking buttons. Leave preexisting P4 code alone unless necessary to fix build/UI routing.
- Prefer existing Next.js App Router, TypeScript, Tailwind, Recharts, `@google/genai`, ExcelJS, Zod, and Vitest. Avoid major framework swaps and unneeded databases.
- Never claim tests, live API calls, or data sources succeeded unless you actually observed them. If API credentials, a real PDF, or network access are unavailable, complete all independent work with clearly labeled synthetic fixtures and document the precise external verification that remains.

## Engineering truth

- Use Gemini for extraction, transcription and contextualization only. Deterministic TypeScript code produces time, ILT/NPT, cost, carbon and benchmarks; include assumptions.
- Preserve report provenance: source filename, exact quote/snippet where available, actual page if genuinely extracted, confidence and warnings. No fabricated numbers, quotes, safety recommendations or root causes.
- **Hole measured depth is not drill-bit position.** A flat hole-depth curve does NOT, by itself, imply downtime. Trip speed cannot be calculated from hole depth alone.
- Overlaps, cross-midnight reports, missing values, units, duplicate events, and unknown classification require explicit handling. Do not silently miscalculate or replace missing data with made-up values.
- Treat all financial/carbon outputs as **scenario estimates**, not audited losses or measured emissions.
- Failed uploads should return useful errors, never silently report demo data as a successful import.
- Don't expose provider secrets via `NEXT_PUBLIC_`, logging, UI, tests, commits, or docs. Restrict upload sizes and MIME types and validate server-side.

## UI

- Replace the old light palette with a restrained **dark industrial-luxe** analytics workspace. Modern _sans-serif_ typography (Geist Sans or equivalent sans with robust local fallbacks), refined spacing, subtle borders, high contrast, and minimal clutter.
- Suggested tokens: canvas `#080C14`, elevated nav `#0E1522`, cards `#121B2A`, raised cards `#172235`, border `#263349`, primary type `#EDF4FF`, secondary `#98A9C1`; productive teal `#2DD4BF`, ILT amber `#FBBF24`, NPT coral `#FB7185`, plan periwinkle `#94A3FF`, action cobalt `#6487FF`.
- Use tasteful radial/linear background atmosphere, subtle card gradients, and carefully composed _chart_ gradients. No neon overload, rusty steampunk ornaments, glowing everything, or glass blur on every element.
- Graphs must represent observed values honestly: linear or step segments for actual depths; use shaded time intervals / markers for actual NPT or ILT classifications. Smooth area fills are optional but never distort the data. Tooltip -> inspectable source event.
- Responsive to 390px, accessible keyboard navigation, focus visible, reduced-motion respect, loading/error/empty states, 1366x768 usability.

## Autonomous development loop

1. Inspect actual git state, repo files, tests, env names and dependency versions before edits; do not assume the starter matches historical docs exactly.
2. Create/update `SOLO-PROGRESS.md` with milestone checklist, evidence of each verification command and unresolved blockers. Create an actionable plan then **immediately implement it**; do not stop for plan review.
3. Implement milestones in the order specified in `OVERNIGHT-MISSION.md`, adapting based on actual repo state. After each milestone, run the relevant checks, fix regressions and record results. Make local checkpoint commits for verified milestones if git is usable.
4. Continue onto the NEXT milestone without asking to proceed. When a detail is not specified, pick a conservative reversible default and document it; when blocked by external access, mark blocked and work on the next independent task.
5. Before finishing, run `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, inspect `git diff`, verify source-vs-demo UI state and create `OVERNIGHT-RESULTS.md` with completed/blocked/untested items.
6. Stop only when the acceptance criteria are met or available environment/tool limits genuinely prevent more meaningful work. Never represent partial completion as full completion.

## Homepage design update

For the requested Mantle-style homepage integration, `docs/MANTLE-HOMEPAGE.md` records the current scoped design rules and compatibility decisions. The supplied `mantle-kit/AGENTS.md` is the visual reference. The new homepage at `/` may use that kit's near-black thermal palette, typography and restrained italic accent. The existing console at `/console` retains its working design until a separate visual migration. Canonical telemetry schemas, analytics, unknown/null handling and source integrity remain authoritative; never replace them with the kit's demo-only formulas.
