# 04 — BoreSight premium light-mode UI / UX design kit

**Design intent:** a modern, exceptionally clean B2B SaaS analytical workspace that happens to serve heavy industry. The theme is visible in the content (steel drill strings, geothermal steam, measured depth, operational time) and tiny design details, **not** in rusty gears, faux gauges, scary red walls or steampunk decoration. Treat the five customer-provided images under `public/reference-images` as visual targets for spacing, composition, component craft and visual hierarchy.

## Reference breakdown: what to borrow
| Reference | Borrow | Do not borrow |
| --- | --- | --- |
| Scopeboard (indigo SaaS dashboard) | Left vertical nav; tiny recent activity cards; compact KPI cards; progress ring; right-hand updates column; generous white space | Unrelated projects/tasks; oversaturated full-bleed purple; fake employee avatars |
| Alloy Studio (minimal reporting dashboard) | Beautiful slim KPI ribbon with colored accent strokes; hairline dividers; small type; chart + ranked bottleneck table; data-dense but breathable layout | Ultra-small illegible chart annotations; marketing-domain metrics |
| Overview / no-brand white workspace | Large open graph; subtle outlines; very crisp icon buttons; thin nav chrome; simple segmented controls | Visually empty analytics area; placeholder calls-to-action |
| Yellow project dashboard | Thoughtful warm accent gradients only in small areas; rounded gauge; activity matrix aesthetic; hierarchy across three columns | Excessive yellow; repeating summary counts; gamification motifs |
| Panze project dashboard | White bento cards on a lightly tinted canvas; rounded horizontal status tracks; quiet right rail; small circular icon controls | Income/invoice metaphors unrelated to rig operations |

## Brand identity
Name: **BoreSight**. Wordmark text “boresight” in 22px medium/semibold with a tiny indigo tracking dot (can be CSS). Short descriptor “GEOTHERMAL INTELLIGENCE” in a muted 9–10px uppercase label. No clip-art drill icons. Tagline: **From raw field reports to operational clarity.**

## Non-negotiable visual tokens
| Token | Value | Purpose |
| --- | --- | --- |
| `--canvas` | `#F6F7F9` | Outer app backdrop, desktop breathing space |
| `--surface` | `#FFFFFF` | Cards/nav |
| `--line` | `#E8EBEF` | 1px card borders, separators |
| `--text` | `#161A24` | Primary text, headlines |
| `--muted` | `#8993A3` | Micro-labels, metadata |
| `--brand` | `#5559F7` | Key CTAs, selected nav, actual-depth line |
| `--accent-soft` | `#F0F0FF` | Small indigo chips, no heavy purple panels |
| `--npt` | `#E9736B` | Proven unplanned downtime and red hazard indicator |
| `--ilt` | `#E7A344` | Benchmark opportunity, not certain failure |
| `--productive` | `#27A982` | Productive operations |
| `--radius-card` | `22px` | Bento cards |
| `--radius-control` | `999px` | Buttons, segmented switches, search |
| Shadow | `0 12px 34px rgba(25,34,54,.035)` | Very diffuse shadows; don't make floating tiles pop excessively |

Typography: Inter / system UI (do not depend on external font CDN); body 12–14px; h1 28–36px medium/semibold, slight negative letter spacing; card h2 16–19px; KPI values 28–34px tabular numerals; micro labels 10px uppercase and moderately tracked. Keep line-height airy. All screens must be readable at 1366×768 and responsive down to 390px. Content max width ~1600px.

## Master page wireframe, desktop
```text
┌────────────┐ ┌──────────────────────────────────────────────────────────────────────────┐
│            │ │ Operations / Overview                                bell / profile   │
│  LOGO      │ │ Drilling intelligence.                                                  │
│            │ │ From raw field reports to operational clarity.                         │
│ Overview ● │ ├──────────────────────────────────────────────────────────────────────────┤
│ Well logs  │ │ Active well [Well name ▼]        [Reset demo] [Upload drilling report]  │
│ Benchmarks │ ├──────────────────────────────────────────────────────────────────────────┤
│ Reports    │ │ SOURCE BADGE: Synthetic / uploaded unverified / human-verified          │
│ Field      │ ├──────────────────────────────────────────────────────────────────────────┤
│ dispatch   │ │ Efficiency   NPT time / cost   ILT recovery   Fuel/CO₂   Depth          │
│            │ ├──────────────────────────────────────────┬───────────────────────────────┤
│            │ │ HOLE DEPTH VS TIME                       │ OPERATING HEALTH              │
│            │ │ actual line; NPT time highlight          │ ring + breakdown              │
│            │ │ click / hover to inspect                 │                               │
│            │ ├──────────────────────────────────────────┼───────────────────────────────┤
│            │ │ Bottleneck / delays                     │ Shift briefing & field send   │
│            │ ├──────────────────────────────────────────┤                               │
│            │ │ Shift event log + source inspector       │ Transcript, audio, status     │
└────────────┘ └──────────────────────────────────────────┴───────────────────────────────┘
```

## Component inventory & behavior
### Sidebar (P3)
Desktop: 210–230px fixed-width card with wordmark, subtitle, 5 functional navigation items, single high-contrast active pill, footer with “Synthetic demo / prototype”. Other rows are text and 16px line icons. Mobile: horizontal/top rail or collapsed content; never let sidebar consume >25% of phone width. Nav items scroll to/report relevant section or switch view. Avoid fake nav links with no outcome.

### Context/action bar (P3)
Full width white card: selected well name, report date, badge indicating data provenance; “Reset demo” (actually restores demo fixture) and primary “Upload drilling report” with file picker. Support PDF/CSV/XLSX/TXT up to 8MB. Show analyzing state, error state including missing key, and successful imported state. Do not obscure errors with generic success toast. Optional drop area can be progressive enhancement.

### KPI ribbon (P3)
Five metrics: documented efficiency; classified NPT duration + modeled rig-rate cost; drilling ILT opportunity + modeled opportunity dollars; excess fuel/CO₂ only when a differential fuel assumption was explicitly configured; latest **hole** measured depth (ft). Each metric should have small label, strong large number, gentle colored vertical stroke, one-line explanation. **No fabricated percentage comparisons** to last week. Null values show `—` with explanatory tooltip. Default view should feel useful but not overfilled.

### Depth chart (P3)
Inverted Y axis: 6,000 ft near top and 7,000 ft near bottom in typical sample; X = elapsed local report-day hour. Use **linear** line connecting discrete event endpoints (a smooth spline invents intermediate depth history); actual hole depth line in brand indigo. Very light horizontal grid, sparse ticks. Confirmed NPT windows in faint coral vertical strips and tooltips identifying actual event ID. NPT ≠ simply every flat segment. Provide explanatory footer (“Flat hole depth can reflect tripping or other planned operations”). Later add source-inspector action when clicking a point.

### Operating health ring (P3)
Large donut/simple radial gauge with quantified classified productive fraction; semantic legend for productive, confirmed NPT, unknown. Do not equate a one-day KPI to physical equipment integrity or safety status. Microcopy **Operational time mix**, not “risk-free rig health”. Show observation coverage as a warning when incomplete.

### Bottleneck overview (P2)
Borrow Panze's elegant horizontal progress tracks. Rank root causes or activity buckets by NPT hours and then by ILT opportunity. Show hours and scenario dollars. Track is neutral gray, colorful fill 8–12px high, rounded. Explain that P1's activity labels can be ambiguous. Zero downtime = thoughtful empty state (“No confirmed NPT extracted”), not manufactured red bars.

### Shift log / evidence inspection (P2)
Borrow Alloy Studio's fine-rule report table: Time, Operation, Classification, Source, Inspect. Row hover very subtle; status chips with colors AND text; searchable by operation or raw note. On click, open centered modal or right drawer: exact source file/page, verbatim short snippet, translated explanation, uncertainty label, scenario impact and “Human review required”. Must close with Escape and X, trap/restore focus where practical. Show extraction warnings when source doesn't support detail.

### Shift handover / Photon (P4)
Quiet Scopeboard-like right rail with 1 audio card, 1 transcript, 1 field transport region. Elegant violet tinted inset for waveform/voice, one primary play/generate button, native audio playback. “Powered by ElevenLabs” attribution when successfully generated. Photon status must distinguish DISABLED, READY, REQUEST ACCEPTED, DELIVERY CONFIRMED (only if real evidence). Disable production dispatch by default; don't imply connection via decorative green indicators.

## Delight (only where it aids comprehension)
Animations 120–220ms ease-out for hover and modal. Radial values/countup optional, never delay access to information. Polished skeletons for Gemini upload and audio generation. Avoid flashy parallax, dark gradients or dense patterns. Use lucide-react ~16px icons, small shadows, keyboard focus and `prefers-reduced-motion`.

## Responsive rules
- 1440px: sidebar + 12-column grid, chart `col-span-8`, gauge `col-span-4`, bottom 8/4.
- 1024px: smaller sidebar, top KPIs wrap 3+2, some 12-column sections stack.
- 768px: sidebar becomes horizontal scroller or icon row, chart and right rail stack; horizontal scrolling permitted for operations table only.
- 390px: one KPI per row or 2 columns, buttons stack, chart maintains ~260px minimum height, no sideways page scroll.

## Design QA checklist
- Does it feel 80% productivity SaaS and 20% industrial expertise? Yes.
- Can a first-time judge say what is happening in 5 seconds? Yes.
- Are real, simulated and estimated signals visibly distinguished? Yes.
- Do all clickable affordances work? Yes.
- Does a graph connect to an exact source and evidence? Yes.
- Are all status colors repeated in words? Yes.
- Does the screenshot still look crisp at 100% zoom? Yes.
