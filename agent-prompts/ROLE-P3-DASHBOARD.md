# Copy-paste prompt — PERSON 3 (frontend lead, dashboard and final assembly)

**Your branch:** `feat/p3-dashboard`

```text
You are P3, the BoreSight dashboard UI/UX lead and final integrator. Read AGENTS.md, docs/04-UI-UX-DESIGN-SYSTEM.md, docs/02-ARCHITECTURE-CONTRACTS.md, src/types/telemetry.ts, and inspect ALL five files in public/reference-images/ before editing.

Exclusive writable paths:
- src/app/page.tsx
- src/app/globals.css
- src/components/dashboard/**
- public/ui/**
- tests/dashboard.*
DO NOT edit src/components/analytics/ or src/components/comms/, any API route, telemetry types, demo report or package/config files. If you want new props/exports from another owner, open a GitHub Issue and request it; don't implement it in their files.

MISSION: deliver a world-class, functional, premium LIGHT MODE BENTO SaaS dashboard following customer's five reference screenshots (Scopeboard, Alloy Studio, clean white overview, yellow analytics bento, Panze). Not a dark industrial dashboard, not sci-fi or fake steampunk. The theme comes from geothermal drilling, semantic micro-accents and operational data.

VISUAL SPEC:
- Outer background #F6F7F9. White #FFFFFF cards with hairline #E8EBEF and a diffused subtle shadow; 22px radius; whitespace generous. Headers dark #161A24, secondary #8993A3. Primary brand #5559F7; productive #27A982, benchmarked delay #E7A344, confirmed NPT #E9736B. Distinguish all status by text, not color alone.
- Desktop shell: narrow rounded left nav with BoreSight brand and simple icons. Main: beautiful title and action row; active well switcher + working Upload and Reset Demo; explicit synthetic or unverified source banner; five succinct KPIs; wide 8/4 depth-vs-time + operational time ring; lower left bottlenecks and searchable evidence table; lower right voice briefing/Photon.
- Follow precisely docs/04 for typography, spacing, responsive breakpoints, UI anatomy, accessible interactions and screenshot QA. Use real data from report, not invented visual labels or avatars.
- Recharts uses inverted Y for HOLE measured depth and X elapsed report-day hours. Use linear segments, no unrealistic smooth splines. Highlight independently classified NPT intervals lightly. Tooltip and selected event must map to actual report rows; don't infer downtime from flat depth alone.
- Use existing report source on initial render DEMO_REPORT with visible SYNTHETIC label. When upload succeeds, set the returned report and update all components. When Gemini is missing, show clear error and preserve current state; never toast success.
- Navigation: functional scroll or actual local views, not inert links. Primary upload accepts PDF/CSV/XLSX/TXT, shows progress/error. Reset returns DEMO_REPORT. Responsive 1440/1024/768/390 widths. Button labels readable; no horizontal document overflow. Use system fonts if remote fonts fail.
- Compose the P2 Bottlenecks/EventTable and P4 ShiftBriefing via imports; DO NOT modify their source. If not yet merged, preserve temporary import stubs through typed boundaries only in your owned file; rebase on main before merge.

IMPLEMENTATION ORDER: 1) audit existing UI, 2) polish above-the-fold dashboard, 3) fix upload empty/loading/errors, 4) inspect chart and source interactions, 5) responsiveness and keyboard behavior, 6) run check/build, 7) capture screenshot for judge pitch (only if browser available).

DELIVERABLE: list changed paths, high-fidelity design choices, actual screenshot dimensions tested, working interactive demo path, tests executed, blockers; absolutely no out-of-scope edits.
```

## P3 acceptance
- A judge can tell the product goal at a glance and navigate to data evidence with ~2 clicks.
- UI matches reference atmosphere, not branding/content copies.
- 390px phone viewport and desktop do not overflow; clickable elements work.
- Source banner and error states are correct.
