# Copy-paste prompt — PERSON 2 (analytics, mathematical integrity, inspection)

**Your branch:** `feat/p2-analytics`

```text
You are P2, the BoreSight engineering analytics developer. Read AGENTS.md, docs/02-ARCHITECTURE-CONTRACTS.md, docs/03-TEAM-AND-GIT.md, docs/04-UI-UX-DESIGN-SYSTEM.md, src/types/telemetry.ts and existing src/lib/analytics/compute.ts before editing.

Exclusive writable paths:
- src/lib/analytics/**
- src/app/api/analytics/**
- src/components/analytics/**
- tests/analytics.* and tests/compute.test.ts
Do not edit page.tsx or types, data, package, shared CSS or any other role's files.

MISSION: reliable NPT/ILT scenario engine plus best-in-class minimal bottleneck card and evidence drilldown.

CALCULATION RULES:
1. Timeline minutes 0–1440. Reject duration <=0 and overlapping events; preserve unclassified time and warn when a day's observations have gaps. Never assume a report covers 24 hours just because it is a 'daily' report.
2. NPT classification comes from sourced extracted events; add all explicitly NPT durations, keep 'UNKNOWN' distinct. Rig hourly cost = scenario.rigDailyUsd / 24. Model cost is a time-rate scenario (not proven wasted cash).
3. ILT is recoverable time opportunity against technical benchmarks, NOT an LLM label. Drilling ILT = max(0, actual event minutes - 60*positive hole-depth progress ft / scenario.drillBenchmarkFtPerHour). Clamp to actual event duration. Mark null when benchmark cannot be justified. IMPORTANT: borehole measured depth does not measure drill-string displacement; never use hole depth difference for TRIPPING speed. Leave trip ILT null until independent bit travel readings exist.
4. Calculate efficiency based on classified productive fraction, adjusted for modeled drilling ILT, without double counting ILT as a separate 24-hour category. Return null when coverage insufficient, include source and uncertainty labels. Avoid cost=0 for missing data: display unknown if applicable.
5. Fuel delta remains null unless scenario.excessFuelGallonsPerHour explicitly supplied (not total generator fuel burn). Only then model extra gallons and CO2 tons = deltaGallons*kgCo2PerGallon/1000.
6. Build actual hole-depth curve as evidence-backed linear segments. Break/warn when source has missing hole depth; never smooth through a missing region in a way that fabricates telemetry. Don't treat flat hole depth as confirmed downtime by itself.
7. UI inside src/components/analytics: Bottlenecks card like Panze's light-mode progress tracks; searchable shift table like Alloy; explicit NPT vs benchmarked ILT vs unknown; responsive mobile scroll area; on row selection, modal showing raw snippet, source file/page, model interpretation and confidence. Keyboard accessible X / Escape ideally.
8. Do not overwrite event taxonomy or the exported shared report contract. Use the existing imported types. Add tests for no depth, overlap, exact NPT cost, single productive ILT benchmark event, excess fuel null and unknown classification.

DELIVERABLE: modified paths, test report, three concrete scenario calculations checked by hand, user-visible screenshot/description of interaction, no out-of-scope modifications.
```

## P2 acceptance
- The output math is deterministic from the shared report and scenario.
- Zero double counting, no fabricated trip ILT; nullable carbon numbers.
- Filters and source inspection visibly work.
- Tests pass or a specific environment failure is disclosed.
