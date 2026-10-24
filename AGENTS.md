# BoreSight — Universal AI Agent Constitution (Codex + Claude Code)

> Read this complete document, `docs/02-ARCHITECTURE-CONTRACTS.md`, `docs/03-TEAM-AND-GIT.md`, and your `agent-prompts/ROLE-P*.md` **before modifying anything**. If instructions conflict, halt and ask the team lead. This repository is a hackathon prototype, not a safety-critical product.

## The one sentence product
BoreSight translates messy geothermal daily drilling reports into *evidence-backed*, interactive drilling progress, explicitly modeled non-productive-time and invisible-lost-time estimates, and reviewed shift handovers. It is visually a premium minimal **light-mode** SaaS app, NOT dark industrial cyberpunk.

## Hard rules — do not negotiate
1. Four people + AI coding agents work in parallel. You may edit **only** files owned by your person, as defined in `docs/03-TEAM-AND-GIT.md`. DO NOT edit `src/types/telemetry.ts`, `src/data/demo-report.ts`, shared configs, `package.json`, `package-lock.json`, `AGENTS.md`, `CLAUDE.md`, or another developer's files. Propose changes in an issue; team lead merges changes to contracts.
2. File ownership includes tests. Add tests only inside your owned test path; propose any new root-level configuration changes to lead.
3. `src/types/telemetry.ts` is the canonical **Contract v1.0**. Reuse `ExtractionSchema`, `ScenarioSchema`, `DrillingEventSchema`, `WellTelemetryReport` and existing API routes. Do not quietly rename fields, create parallel versions of the report, or duplicate formulas.
4. **AI extracts observations; TypeScript computes metrics.** Never have Gemini invent NPT cost, CO2 emissions, event timings or source pages. Never silently substitute synthetic events for failed uploads. Keep sample data visibly marked `SYNTHETIC_DEMO`.
5. Depth in this product means **hole measured depth**, not drill-bit position. Bit trips can happen while hole depth stays flat. Flat holes do NOT automatically prove an operational stoppage. Do not infer trip speed from hole depth changes.
6. Unknown or poorly supported information is `UNKNOWN`, nullable, or accompanied by warnings. Extract exact short source snippets and page numbers where truly available. Rig-rate and fuel estimates MUST be called scenario assumptions, not real loss or measured CO2.
7. No destructive shell commands, forced pushes, direct pushes to main, sending real field messages, leaking secrets, or installing unapproved packages. Credentials are read server-side from `.env.local`, not the client.
8. API errors return meaningful non-2xx responses; a missing key is NOT a successful mock response. Photon dispatch is opt-in and off by default. An API request being accepted is not delivery confirmation.
9. Never implement unsupported maintenance instructions, autonomous safety recommendations, or equipment fault diagnoses as certain. No hazardous field operations without human review.
10. Be responsive and accessible. Keyboard focus visible, legends not color alone, semantic headings, readable tooltips, zero fabricated charts or result counts.

## Design constitution
- **Canvas** #F6F7F9, surface white #FFFFFF, 1px neutral borders #E8EBEF; 20–24px radius, soft shadow, 20–28px padding.
- **Typography** Inter/system sans; text near-black #161A24; labels muted #8993A3; large numbers tabular; generous whitespace.
- **Primary** restrained electric indigo #5559F7. **Warning/ILT** #E7A344, **confirmed NPT** #E9736B, **productive** #27A982. Do NOT fill every card with accent colors.
- **Information architecture** narrow left nav + page title/header + compact context/action bar + five KPI strip + 8/4 chart/gauge + 8/4 operational cards and briefing.
- **Chart** inverted Y axis for hole depth in feet and time X axis, accurate linear line segments; highlight confirmed NPT intervals separately. Click events for original evidence.
- **References** the FIVE `public/reference-images/*.webp` are user's design inspiration. They guide balance, spacing, structure and finish, not copied branding or unrelated modules.
- Reference details and exact acceptance specs are in `docs/04-UI-UX-DESIGN-SYSTEM.md`.

## Cross-role API contracts (already established)
- GET `/api/analytics` → seeded synthetic `WellTelemetryReport`.
- POST `/api/analytics` body `{extraction,scenario?}` → computed report.
- POST `/api/ingest` multipart key `file` → report OR explicit error.
- POST `/api/briefing` `{extraction,scenario,sourceKind,mode:'script'|'audio'}` → `{script}` or MPEG audio.
- POST `/api/dispatch` `{extraction,scenario,recipient:{spaceId,senderId,idempotencyKey}}` → accepted, never claim delivered.

## Workflow for EVERY agent work session
1. State your role, branch and exact file allow-list. Inspect existing implementation and tests first.
2. Briefly outline intended edits **only in owned paths**; do one coherent vertical slice at a time.
3. Implement; keep existing exports/backward-compatible contracts; never delete other people's implementations.
4. Run `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` if available. If network/environment prevents install, state that explicitly; do not claim tests passed.
5. Report the list of changed files, tests actually executed, demo interaction to verify, blockers, and any proposals for the team lead.
6. Before commit: `git diff --name-only origin/main...HEAD` must be limited to your ownership. If not, remove out-of-scope changes.
7. Open a PR targeting main; never cherry-pick other person's unreviewed changes into your branch.

## Definition of done
Feature functions with the synthetic seed, clearly identifies source and uncertainty, has functional loading/error/empty states, passes typecheck and relevant unit test, does not modify other owners' files, follows UI design, and can be demonstrated in 20 seconds.
