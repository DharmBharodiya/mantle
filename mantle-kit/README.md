# Mantle UI kit

Drop-in Next.js (App Router) + Tailwind v4 code for the redesigned Mantle homepage and console. Build-checked on Next.js 16.4, React 19.3, Tailwind 4.3, TypeScript strict.

## 1. Copy into your project

Copy these folders into your project root (or into `src/` if your project uses it — the imports use the `@/` alias):

```
app/page.tsx              → homepage (replaces your current one)
app/console/page.tsx      → console overview
app/layout.tsx            → reference only: merge the two class changes into your layout
app/globals.css           → reference only: merge the two @import lines
components/mantle/        → all components
lib/mantle/               → engine, metrics, fonts
styles/mantle.css         → tokens + motion
AGENTS.md, CLAUDE.md      → repo root (design rules for every agent)
```

If your dashboard currently lives at `/`, move it to `/console` or point `consoleHref` at its route.

## 2. Wire styles and fonts

`app/globals.css`:

```css
@import "tailwindcss";
@import "../styles/mantle.css";
```

`app/layout.tsx`:

```tsx
import { mantleFontVars } from '@/lib/mantle/fonts';
// …
<html lang="en" className={mantleFontVars}>
  <body className="bg-ink font-sans text-steam antialiased">{children}</body>
</html>
```

## 3. Hide the dev badge for the demo

`next.config.ts`:

```ts
const nextConfig = { devIndicators: false };
export default nextConfig;
```

## 4. Plug in your real data

The console takes the same event shape your Gemini extraction produces:

```tsx
import { ConsoleOverview } from '@/components/mantle/console/ConsoleOverview';
import type { DrillEvent } from '@/lib/mantle/report';

<ConsoleOverview events={events as DrillEvent[]} wellName="Utah FORGE 16A" dateLabel="24 Oct 2026" synthetic={false} summary={geminiSummary} />
```

`DrillEvent` fields: `start`/`end` (report-day hours), `startDepth`, `footage`, `operation`, `kind` (`drilling` | `flat`), `cls` (`productive` | `npt`), `raw` (verbatim line), `mark` (substring to highlight), `line`, `page`, `summary`, `confidence`. All metrics come from `computeDay(events, assumptions)` — don't compute them in components.

## 5. Wire the hero upload box to your API

`Landing` accepts `onAnalyze({ text, file })`. From a client wrapper that posts to your existing route:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { Landing } from '@/components/mantle/Landing';

export default function HomePage() {
  const router = useRouter();
  return (
    <Landing
      onAnalyze={async ({ text, file }) => {
        const body = new FormData();
        if (file) body.append('file', file);
        body.append('question', text);
        const res = await fetch('/api/analyze', { method: 'POST', body });
        const { reportId } = await res.json();
        router.push(`/console?report=${reportId}`);
      }}
    />
  );
}
```

(Or pass a Server Action from a server `page.tsx`.)

## 6. Knobs

- `<ThermalField palette="thermal" | "molten" | "steam" calm={0.15} drillX={0.22} wellX={0.78} />`
- `<AsciiDrillBit hoverBoost />`, `<CoreColumn drilling={false} />` (stall during NPT)
- Fill in `teamNames` and `repoHref` on `<Landing />`.

## Tailwind v3 fallback

If the project is still on Tailwind v3, the `@theme` block is ignored. Add this to `tailwind.config.ts` instead and keep the rest of `mantle.css`:

```ts
theme: { extend: {
  colors: {
    ink: { DEFAULT: 'var(--m-ink)', 1: 'var(--m-ink-1)', 2: 'var(--m-ink-2)', 3: 'var(--m-ink-3)' },
    steam: { DEFAULT: 'var(--m-steam)', 2: 'var(--m-steam-2)', 3: 'var(--m-steam-3)', 4: 'var(--m-steam-4)', 5: 'var(--m-steam-5)' },
    line: { DEFAULT: 'var(--m-line)', strong: 'var(--m-line-strong)' },
    productive: { DEFAULT: 'var(--m-productive)', flat: 'var(--m-productive-flat)', ink: 'var(--m-productive-ink)' },
    ilt: { DEFAULT: 'var(--m-ilt)', ink: 'var(--m-ilt-ink)' },
    npt: { DEFAULT: 'var(--m-npt)', ink: 'var(--m-npt-ink)' },
    heat: { 2: 'var(--m-heat-2)', 4: 'var(--m-heat-4)', 5: 'var(--m-heat-5)', 6: 'var(--m-heat-6)', 7: 'var(--m-heat-7)', 8: 'var(--m-heat-8)' },
  },
  fontFamily: { sans: ['var(--font-mantle-sans)'], serif: ['var(--font-mantle-serif)'], mono: ['var(--font-mantle-mono)'] },
  borderRadius: { chip: '12px', panel: '20px', card: '22px', hero: '30px' },
} }
```

(Opacity modifiers like `bg-npt/15` need v3.3+ with colours defined as raw values; v4 is strongly recommended.)
