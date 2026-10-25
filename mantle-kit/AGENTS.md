# AGENTS.md — Mantle

Rules for any AI agent or human writing UI in this repo. Read the whole file before touching a component, page, style or chart. These rules are strict on purpose: the previous UI read as generic "AI slop", and this system exists to stop that from coming back.

If a request conflicts with a rule here, follow the rule, build the closest compliant version, and say in your reply which rule you followed. Only a human maintainer edits this file.

---

## 0. What Mantle is

Mantle turns unstructured geothermal daily drilling reports (PDF, CSV, XLSX, TXT, scanned logs) into a traced timeline of productive time, non-productive time (NPT) and invisible lost time (ILT), with cost and CO₂ scenarios. Google Gemini extracts the events; deterministic TypeScript computes the metrics. Every number must trace back to a line in the source report.

Theme (SBUHacks 2026, Steel & Steam): **steel goes down** (the drill string), **steam comes up** (clean geothermal heat). The visual language is a **thermal camera looking at the ground**: near-black, glowing ASCII heat, steel-white type.

---

## 1. Non-negotiables

1. **Ground is near-black `ink` (#050506).** Never slate, navy, grey-blue, or pure `#000`. No light mode.
2. **One brand accent: the heat ramp** (violet → magenta → molten → white-hot), used only through `.m-heat-text`, `.m-heat-fill`, the ASCII canvases, and `heat-*` tokens. No indigo, teal, blue, green or purple brand accents. Ever.
3. **Data colours are semantic and fixed:** productive = `productive` (violet), ILT = `ilt` (amber), NPT = `npt` (hot pink). Never swap them, never use them decoratively, never introduce a fourth status colour.
4. **Type:** Instrument Sans for everything, JetBrains Mono for numbers/units/timestamps/source lines/ASCII, Instrument Serif *italic* for at most one accent phrase per section (max two per page, zero in the console).
5. **No eyebrow micro-labels on cards.** No uppercase letter-spaced label above every title. Sentence case everywhere.
6. **One trust note per page.** Disclaimers ("synthetic", "scenario estimate", "human review") appear once, at the bottom or in a tooltip — not on every card.
7. **Every metric comes from `computeDay()`** in `lib/mantle/report.ts`. Components never compute NPT/ILT/cost/CO₂ themselves.
8. **Every event shows its source.** Line number and the verbatim raw text, never truncated in the evidence view.
9. **Tokens only.** No raw hex in components except the three documented exceptions in §3.4. No arbitrary new colours, radii or shadows.
10. **Real controls.** `<button>`, `<a href>`, `<input>` + `<label>`. Touch targets ≥ 44 px. Icon-only buttons get `aria-label`.
11. **Canvases go through `useCanvasLoop`.** ≤ 30 fps, paused off-screen, `aria-hidden`, `pointer-events-none`, reduced-motion aware.
12. **No dev or internal artefacts in the UI:** no Next.js dev badge (`devIndicators: false`), no "paused" feature notes, no TODOs, no lorem ipsum, no invented statistics.

---

## 2. Stack and file map

- Next.js App Router, React 19, TypeScript (strict), Tailwind CSS v4, Recharts (allowed for secondary charts, styled per §8).
- Fonts via `next/font/google` in `lib/mantle/fonts.ts`; `mantleFontVars` goes on `<html className>`.

```
styles/mantle.css               tokens (@theme), component classes (@layer components), motion
lib/mantle/report.ts            DrillEvent / Assumptions types, computeDay(), formatters, DEMO_EVENTS
lib/mantle/ascii.ts             noise, heat palettes, canvas helpers
lib/mantle/useCanvasLoop.ts     the only allowed animation loop for canvases
lib/mantle/fonts.ts             next/font setup
components/mantle/Landing.tsx   homepage
components/mantle/ThermalField  hero ASCII cross-section (canvas)
components/mantle/AsciiDrillBit rotating ASCII PDC bit (canvas)
components/mantle/CoreColumn    sidebar mini well (canvas)
components/mantle/ReportPrompt  glass upload box with typing demo
components/mantle/DecodeCard    raw line → structured fields animation
components/mantle/EventTicker   marquee of extracted events
components/mantle/DepthTimeline depth vs time + shift strip on one axis
components/mantle/ShiftStrip    24 h class strip (selectable)
components/mantle/console/*     ConsoleOverview, ConsoleSidebar, KpiStrip, EvidencePanel, EventLog, LossLedger
components/mantle/Icons.tsx     the only icon set
```

New UI goes in `components/mantle/` (or a subfolder). Reuse before you create: if a component above fits, extend it with a prop instead of writing a look-alike.

---

## 3. Colour

### 3.1 Ground and surfaces

| Token | Hex | Use |
|---|---|---|
| `ink` | #050506 | page background |
| `ink-1` | #08080A | raised panels, CTA block, sidebar widgets |
| `ink-2` | #0B0B0E | insets: source-line boxes, inputs, card visuals |
| `ink-3` | #121216 | rare: menus, popovers |
| `line` | white 8% | every border and divider |
| `line-strong` | white 14% | hover borders, pill outlines |

Panels are `bg-white/[0.015]` or `bg-white/[0.022]` + `border border-line`. Do not stack more than two surface levels.

### 3.2 Text

| Token | Hex | Use |
|---|---|---|
| `steam` | #F2F0EC | headings, values, primary text |
| `steam-2` | #C9C6C0 | strong secondary, chip text |
| `steam-3` | #A09E9A | body copy, descriptions |
| `steam-4` | #8F8C88 | meta, labels, axis ticks — the **lowest allowed text colour** |
| `steam-5` | #6F6C78 | **non-text only** (decor, disabled strokes). Fails 4.5:1 for text. |

### 3.3 Data semantics — "heat marks loss"

| Meaning | Fill token | Text-on-dark token | Notes |
|---|---|---|---|
| Productive drilling | `productive` #6A5CD6 | `productive-ink` #B3AAF7 | cool = time well spent |
| Productive, flat ops (circulating, trips, BHA) | `productive-flat` #4B4196 | — | same class, dimmer |
| ILT (below benchmark) | `ilt` #FFB357 | `ilt-ink` #FFC27A | always shown *inside* productive time (amber underline / amber line) |
| NPT | `npt` #FF4F6E | `npt-ink` #FF8597 | bands, pills, dots |

- Pills: `bg-npt/15 text-npt-ink`, `bg-ilt/15 text-ilt-ink`, `bg-productive/20 text-productive-ink` — use `classPill()`.
- Status is never colour alone: pills carry text, strip segments carry `aria-label`.
- Depth line "on pace" is `#ECEAF4`; flat segments at 40% opacity.

### 3.4 Heat ramp (brand)

`heat-0 … heat-9` (thermal palette in `lib/mantle/ascii.ts`). UI usage is limited to:

- `.m-heat-text` — one accent phrase per section (serif italic), and nowhere in the console.
- `.m-heat-fill` — the circular send button and the Gemini summary icon. Nothing else.
- `heat-6` — focus ring, active-nav dot, caret, drag-over glow.
- Soft radial glows behind a product preview or CTA: `rgb(233 70 107 / ≤0.22)`, once per section, never as a full-page wash.

Allowed raw-colour exceptions: `#ECEAF4` (depth line), `#C9C5D6` / `#EEEDF4` (steel/steam annotation dots), and canvas colours inside `lib/mantle/ascii.ts`.

The `molten` and `steam` palettes exist for experiments only. Production uses `thermal`.

---

## 4. Typography

| Role | Family | Size | Weight | Tracking | Line height |
|---|---|---|---|---|---|
| Hero H1 | Sans | `clamp(46px, 6.2vw, 92px)` | 500 | −0.045em | 0.98 |
| Section H2 | Sans | `clamp(34px, 4vw, 52px)` | 500 | −0.035em | 1.04 |
| Page H1 (console) | Sans | 36px | 500 | −0.04em | 1.05 |
| Card H2/H3 | Sans | 16–18px (24px in evidence panel) | 500 | −0.015em | normal |
| Body | Sans | 15–17px | 400 | 0 | 1.55 |
| Meta / labels | Sans | 12.5–13.5px | 400 | 0 | normal |
| Big numbers | Sans | 26–64px | 500 | −0.03 to −0.045em | 1 |
| Units after numbers | Sans | ~0.45–0.5em of the number, `steam-4` | 400 | — | — |
| Data, timestamps, source lines, axis ticks | Mono | 10.5–12.5px | 400–500 | 0 to 0.02em | — |

Rules:
- Serif (`font-serif italic`, 1.1em, weight 400, usually with `.m-heat-text`) is **one phrase**, never a full sentence, never a button, label, number, nav item or anything in the console.
- Never use font weights above 600. Never use all-caps for UI copy. Uppercase is allowed only for verbatim report text and the `SYNTHETIC DEMO` chip.
- Hours always one decimal (`5.0 h`), money whole dollars with commas (`$41,786`), depth whole feet with commas (`6,590 ft`), times `HH:MM` (`17:30`, `24:00`). Use `fmtNum`, `fmtMoney`, `fmtClock`.

---

## 5. Layout and surfaces

- Homepage container: `mx-auto max-w-[1264px] px-5 sm:px-8`. Section top padding 104–128 px.
- Homepage sections open with `SectionRule` (mono index · hairline · mono label). This is the only section-label pattern; never add eyebrows inside cards.
- Radii: chips/inputs 10–12 px (`rounded-chip`), panels 20 px (`rounded-panel`), feature cards 22 px (`rounded-card`), CTA block 30 px (`rounded-hero`), buttons and pills fully round.
- Shadows: only the specified ones (`.m-glass`, primary-button hover, send button, product-preview frame). Cards have no drop shadow.
- Glass (`.m-glass`) only on elements floating over an ASCII canvas (hero prompt, nav pill, annotations).
- Console layout: `flex flex-wrap` row; sidebar `flex-[1_1_248px]`, main `flex-[999_1_560px] min-w-0`. The sidebar is never sticky and never `100vh`; on phones it stacks above the content.
- Console order is fixed: top bar → title + meta → Gemini day summary → KPI strip → depth/time + evidence panel → event log + loss ledger → one trust note.
- KPIs are **one continuous strip** with hairline dividers. Never five separate cards. Formulas live in the (i) tooltip of each cell.
- Wide tables scroll horizontally inside their panel (`overflow-x-auto` + `min-w-[…]`); the page never scrolls sideways.
- Everything must work at 390 px wide.

---

## 6. Components

### 6.1 Buttons and controls

| Class | Use | Max per view |
|---|---|---|
| `.m-btn-primary` | white pill — the main action (Open console, Upload report) | 1 per region |
| `.m-btn-ghost` | translucent pill — secondary actions | any |
| `.m-chip` | small rounded-rect actions inside a panel (attach, evidence links) | any |
| `.m-send` + `.m-heat-fill` | circular gradient submit, only in `ReportPrompt` | 1 per page |

Do not invent new button styles. Do not use coloured (indigo/blue/green) buttons. Destructive actions use `.m-btn-ghost` with `text-npt-ink`.

### 6.2 Icons

Only `components/mantle/Icons.tsx`: 24-grid, 1.7 stroke, round caps, `currentColor`. Add new icons in the same style there. No emoji, no filled icon packs, no mixed icon libraries.

### 6.3 Patterns you must reuse

- Annotation pill (hero): dot + label + mono value + 26 px connector line to a guide.
- Evidence: `EvidencePanel` with the matched substring wrapped in `<mark>` tinted by class.
- Class pills: `classPill()`.
- Loss ranking: `LossLedger` (sorted by hours, bars proportional to the largest).

---

## 7. ASCII and canvas rules

- Canvases use `useCanvasLoop` (≤ 30 fps, IntersectionObserver pause, reduced motion freezes time), `fitCanvas` (DPR cap 2) and `monoFontFamily()` for `ctx.font`.
- Colours come only from `buildPalette()` / `STEAM_RAMP` / `STEEL`. Draw by colour bucket (one `fillStyle` per level).
- Allowed glyphs: `. · - = + * ▪ ■ ─ │ ║ ╪ ╬ ╦ ┃ ▼ • ● @ # % : / \ | X`. No letters as decoration, no emoji, no box art outside the rig/wellhead.
- Canvas is always `aria-hidden="true"` and `pointer-events-none`; interaction listens on the parent element.
- **Calm centre:** text never sits on a bright field. `ThermalField` dims the centre column (`calm`) and widens it on phones. If you add text over a canvas, widen `calm` or add a scrim — never shrink the text.
- Budget: < 10,000 glyphs per frame and < 8 ms per frame on a laptop. Profile before adding a second full-width canvas.
- The ASCII art must *mean* something (drilling, heat, steam, the report). No decorative noise fields, matrix rain or random particles.

---

## 8. Charts and data

- Depth increases **downward** (drilling convention).
- Depth/time and the shift strip share one 24-hour axis and the same width (`DepthTimeline` does this). Don't split them into separate cards.
- NPT = translucent `npt` bands (13%) with a small label; below-benchmark drilling = `ilt` line segments; benchmark pace = dashed white 32%, toggleable.
- Flat depth is **not** downtime on its own. Classification comes from the report; say so once near the chart.
- If you use Recharts: no chart borders, gridlines `#fff` at 6%, ticks mono 10.5px `steam-4`, no default legend (use the inline legend row), tooltips as `.m-glass` with mono values, animations ≤ 300 ms, colours from §3.3 only.
- Never show a "0" panel ("0 events have low confidence"). Hide empty states or say it in one line.
- Never call ILT "lost money" or "proven loss" — it is a scenario against a benchmark. NPT comes from the report's own classification.

---

## 9. Motion and micro-interactions

- Easing `cubic-bezier(.2,.8,.2,1)`; durations 200 ms (colour), 250 ms (buttons), 300 ms (lift, bars).
- Allowed: hover lift ≤ 3 px (`.m-lift`), arrow nudge 3 px, send button scale 1.08 + −10° rotate, strip segment `scaleY(1.35)`, pulse dots for live status, marquee that pauses on hover, typing caret, scan line, cursor heat on the hero, bit spin-up on hover, drag-over glow on upload.
- Banned: bounce/spring overshoot, scroll-jacking, parallax, confetti, auto-playing sound, page-load fade-ins on every section, skeleton shimmer used decoratively, anything > 600 ms that blocks reading.
- Everything respects `prefers-reduced-motion` (CSS already does; canvases freeze via `useCanvasLoop`).

---

## 10. Copy

- Plain, specific, short. Talk about rigs, hours, footage, depth, cost. Sentence case.
- Headline system: "Steel goes down. *Steam* comes up." Secondary headlines are concrete statements ("The whole report day on one screen."), not slogans.
- Banned words/phrases: revolutionize, unlock, seamless, cutting-edge, next-gen, supercharge, empower, leverage, game-changer, "AI-powered" in headings, "Clarity below the surface", "Evidence before inference", exclamation marks, emoji.
- Numbers in copy must come from `computeDay()` or be labelled as assumptions. Never invent industry statistics. Unknowns become placeholders like `[Team member names]`.
- Name the model and data honestly: "Gemini", "synthetic demo well", "scenario estimate".

---

## 11. Accessibility

- Contrast: body text ≥ 4.5:1 (lowest text colour `steam-4`). Graphics ≥ 3:1.
- Focus: global `:focus-visible` ring in `heat-6` — never remove outlines without a replacement.
- Targets ≥ 44 × 44 px (chips, tabs, icon buttons included).
- `aria-pressed` on toggles and filter tabs, `aria-current="page"` on active nav, `role="alert"` on upload errors, `sr-only` labels where a visual label is omitted.
- One `<h1>` per page; headings in order.

---

## 12. Banned patterns (the "AI slop" list)

Reject or rewrite any of these on sight:

- Slate/navy backgrounds with an indigo or periwinkle gradient button.
- Uppercase, letter-spaced eyebrow label on every card ("TIME, ACCOUNTED FOR", "REVIEW BEFORE RELYING").
- Grids of identical rounded cards with the same radius, border and padding for unrelated content.
- Five separate KPI cards; donut charts for a two-value split.
- Repeating the same disclaimer on multiple cards.
- Columns that repeat the same value on every row ("Location unknown", "HIGH confidence").
- Truncating the one field that matters (the source line).
- Gradient blobs or washes as page backgrounds; glassmorphism on a flat background.
- Left-border accent cards, emoji, stock 3D illustrations, "Trusted by" logo strips, fake testimonials.
- More than one accent colour family; colour without meaning.
- A marketing hero inside the dashboard.
- Visible dev tooling, internal feature notes, or placeholder text that isn't bracketed.

---

## 13. Before you finish any UI change

- [ ] Only tokens from `styles/mantle.css`; no new hex values.
- [ ] Data colours used only for productive / ILT / NPT.
- [ ] Serif used ≤ 1 phrase in the section (0 in the console).
- [ ] No eyebrow labels; sentence case; banned words absent.
- [ ] Every metric from `computeDay()`; formatting via `fmtNum` / `fmtMoney` / `fmtClock`.
- [ ] One trust note on the page.
- [ ] Works at 390 px and 1440 px; no horizontal page scroll.
- [ ] Keyboard: every control reachable, focus visible, targets ≥ 44 px.
- [ ] Reduced motion honoured; canvases paused off-screen.
- [ ] `npm run build` passes with no type errors.

---

## 14. Changing the system

Propose changes to tokens, type, colours or these rules in the PR description with a before/after screenshot. Update `styles/mantle.css` and this file in the same PR. Never fork a token locally in a component.
