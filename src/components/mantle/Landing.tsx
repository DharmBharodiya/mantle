import Link from 'next/link';
import { MantleLogo } from './Logo';
import { ThermalField } from './ThermalField';
import { ReportPrompt } from './ReportPrompt';
import { EventTicker } from './EventTicker';
import { DecodeCard } from './DecodeCard';
import { LandingPreview } from './LandingPreview';
import { AsciiDrillBit } from './AsciiDrillBit';
import { IconAlert, IconArrowRight, IconChart, IconEye, IconGauge, IconLeaf, IconLink } from './Icons';
import { DEFAULT_ASSUMPTIONS, DEMO_EVENTS, computeDay, fmtMoney, fmtNum } from '@/lib/mantle/report';

const demo = computeDay(DEMO_EVENTS, DEFAULT_ASSUMPTIONS);

function SectionRule({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-7 flex items-center gap-4 font-mono text-xs text-steam-4">
      <span>{index}</span>
      <span className="h-px flex-1 bg-m-line" />
      <span>{label}</span>
    </div>
  );
}

function Annotation({ side, top, tone = 'steel', children }: { side: 'left' | 'right'; top: number; tone?: 'steel' | 'steam' | 'npt' | 'ilt' | 'heat'; children: React.ReactNode }) {
  const dot = {
    steel: 'bg-[#C9C5D6]',
    steam: 'bg-[#EEEDF4]',
    npt: 'bg-npt m-pulse-npt',
    ilt: 'bg-ilt m-pulse-ilt',
    heat: 'bg-heat-6',
  }[tone];
  const line = <span className={`h-px w-[26px] ${tone === 'npt' ? 'bg-npt/50' : 'bg-white/30'}`} />;
  return (
    <div
      className="absolute z-[3] hidden items-center transition-transform duration-300 hover:-translate-y-0.5 min-[1100px]:flex"
      style={side === 'left' ? { right: '78%', top } : { left: '78%', top }}
    >
      {side === 'right' && line}
      <span className={`inline-flex items-center gap-2 rounded-full border m-annotation px-[13px] py-[7px] text-[12.5px] whitespace-nowrap text-steam/85 ${tone === 'npt' ? 'border-npt/35' : 'border-white/12'}`}>
        <span className={`size-1.5 rounded-full ${dot}`} />
        {children}
      </span>
      {side === 'left' && line}
    </div>
  );
}

const FEATURES = [
  { Icon: IconAlert, title: 'Downtime detection', body: 'Stoppages from failures, waiting and disruptions, as the report classifies them.' },
  { Icon: IconGauge, title: 'Invisible lost time', body: 'Slow footage measured against a configurable ROP benchmark.' },
  { Icon: IconChart, title: 'Depth analytics', body: 'Depth versus time with every loss on one 24-hour axis.' },
  { Icon: IconLeaf, title: 'Cost and carbon', body: 'Exposure, fuel and CO₂ from assumptions you can see and edit.' },
  { Icon: IconEye, title: 'Equipment vision', body: 'Describe visible features in equipment photos for a qualified reviewer.' },
  { Icon: IconLink, title: 'Evidence trace', body: 'Inspect available source excerpts and page or row references. Export CSV or JSON.' },
];

export interface LandingProps {
  /** Where "Open console" and "Try the demo well" go. */
  consoleHref?: string;
  /** Wire the hero upload box to your existing /api upload route. */
  onAnalyze?: (input: { text: string; file: File | null }) => void | Promise<void>;
  teamNames?: string;
  repoHref?: string;
  uploadStatus?: string;
  onCancel?: () => void;
}

/** The Mantle homepage. Drop into app/page.tsx. */
export function Landing({ consoleHref = '/console', onAnalyze, teamNames, repoHref, uploadStatus, onCancel }: LandingProps) {
  const lostH = demo.lostHours;
  return (
    <div className="mantle-page min-h-screen overflow-x-clip bg-m-ink font-sans text-steam antialiased">
      <a href="#report-intake" className="m-skip">Skip to report upload</a>
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="#top" aria-label="BoreSight home" className="flex min-h-11 items-center"><MantleLogo /></Link>
        <nav aria-label="Primary" className="hidden gap-0.5 rounded-full border border-white/10 m-nav-glass p-1 backdrop-blur-md md:flex">
          {[['#how', 'How it works'], ['#platform', 'Platform'], ['#impact', 'Impact'], ['#theme', 'Steel & Steam']].map(([href, label]) => (
            <a key={href} href={href} className="inline-flex min-h-[44px] items-center rounded-full px-[15px] text-sm text-steam-2 transition-colors hover:bg-white/8 hover:text-steam">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          
          <Link href={consoleHref} className="m-btn-primary">Open console</Link>
        </div>
      </header>

      <div className="absolute inset-x-0 top-[78px] z-10"><nav aria-label="Homepage sections" className="m-mobile-nav">{[["#how", "How it works"], ["#platform", "Platform"], ["#impact", "Impact"], ["#theme", "Steel & Steam"]].map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav></div>
      {/* HERO — the ASCII field is the picture; text sits in the calm centre column */}
      <section id="top" className="relative isolate overflow-hidden md:min-h-[940px]">
        <ThermalField />
        <div aria-hidden="true" className="absolute inset-y-0 left-[22%] z-[1] w-px bg-[linear-gradient(180deg,transparent,rgb(255_255_255/0.1)_18%,rgb(255_255_255/0.1)_82%,transparent)]" />
        <div aria-hidden="true" className="absolute inset-y-0 left-[78%] z-[1] w-px bg-[linear-gradient(180deg,transparent,rgb(255_255_255/0.1)_18%,rgb(255_255_255/0.1)_82%,transparent)]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-[1] h-[140px] bg-[linear-gradient(180deg,var(--m-ink),transparent)]" />

        <Annotation side="left" top={166}>Steel goes down <span className="font-mono m-annotation-value">{demo.endDepth.toLocaleString('en-US')} ft</span></Annotation>
        <Annotation side="left" top={470} tone="ilt">Slow footage <span className="font-mono text-ilt">ILT {fmtNum(demo.iltHours)} h</span></Annotation>
        <Annotation side="left" top={651} tone="npt">Pump #2 seal <span className="font-mono text-npt-ink">NPT {fmtNum(demo.events.find(event => event.operation === "rig repair")?.hours ?? 0)} h</span></Annotation>
        <Annotation side="right" top={300} tone="steam">Steam comes up <span className="font-mono m-annotation-value">clean heat</span></Annotation>
        <Annotation side="right" top={560} tone="heat">{fmtNum(lostH)} h exposure <span className="font-mono text-steam">{fmtMoney(demo.totalCost)}</span></Annotation>

        <div className="relative z-[2] mx-auto flex max-w-[780px] flex-col items-center gap-[22px] px-6 pt-[148px] pb-[140px] text-center">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="hidden h-px w-16 bg-[linear-gradient(90deg,transparent,rgb(242_240_236/0.45))] sm:block" />
            <span aria-hidden="true" className="hidden size-[5px] rounded-full bg-steam sm:block" />
            <span className="rounded-full border border-white/14 m-hero-badge px-3.5 py-1.5 text-[12.5px] whitespace-nowrap text-steam-2">Built for Steel &amp; Steam · SBUHacks 2026</span>
            <span aria-hidden="true" className="hidden size-[5px] rounded-full bg-steam sm:block" />
            <span aria-hidden="true" className="hidden h-px w-16 bg-[linear-gradient(90deg,rgb(242_240_236/0.45),transparent)] sm:block" />
          </div>
          <h1 className="text-[clamp(46px,6.2vw,92px)] leading-[0.98] font-medium tracking-[-0.045em]">
            Steel goes down.
            <br />
            <span className="m-heat-text pr-[0.08em] font-serif text-[1.1em] font-normal tracking-[-0.025em] italic">Steam</span> comes up.
          </h1>
          <p className="max-w-[540px] text-[17px] leading-relaxed text-steam-3">
            BoreSight reads daily geothermal drilling reports to map downtime, benchmarked slow footage and estimated time exposure back to the source.
          </p>
          <div id="report-intake" className="mt-2.5 w-full flex justify-center"><ReportPrompt demoHref={consoleHref} onSubmit={onAnalyze} status={uploadStatus} onCancel={onCancel} /></div>
          <p className="font-mono text-[11.5px] tracking-[0.02em] text-steam-4">PDF · CSV · XLSX · TXT · up to 8 MB · Gemini for documents, direct parsing for structured tables</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-[4]">
          <EventTicker events={DEMO_EVENTS} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-[1264px] px-5 pt-32 pb-10 sm:px-8">
        <SectionRule index="01" label="How it works" />
        <div className="mb-11 flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-[680px] text-[clamp(34px,4vw,52px)] leading-[1.04] font-medium tracking-[-0.035em]">From a daily report to a timeline you can check against the source.</h2>
          <p className="max-w-[360px] text-base leading-relaxed text-steam-3">Field crews write what happened. BoreSight extracts observations, computes scenarios in TypeScript and keeps the original evidence available.</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          <article className="m-lift flex flex-col gap-[18px] rounded-card border border-m-line bg-white/[0.022] p-3.5 hover:bg-white/[0.04]">
            <div className="relative h-[210px] overflow-hidden rounded-[15px] border border-white/5 bg-m-ink-2 px-[22px] py-5 font-mono text-[10.5px] leading-[1.85] text-steam-4">
              <div className="text-steam-3">SYNTHETIC DEMO DRILLING REPORT</div>
              {DEMO_EVENTS.slice(0, 6).map((e) => (
                <div key={e.id} className={e.cls === 'npt' ? 'text-npt-ink' : undefined}>{e.raw.slice(0, 40)}</div>
              ))}
              <div aria-hidden="true" className="m-scan absolute inset-x-0 top-[30px] h-[26px] border-b border-heat-6/55 bg-[linear-gradient(180deg,transparent,rgb(255_111_77/0.16),transparent)]" />
            </div>
            <div className="px-2 pb-2.5">
              <div className="mb-2 flex items-center gap-2.5"><span className="font-mono text-xs text-steam-4">01</span><h3 className="text-lg font-medium tracking-[-0.015em]">Drop the report</h3></div>
              <p className="text-[14.5px] leading-relaxed text-steam-3">Attach a single-day PDF, spreadsheet or field log up to 8 MB. Clear source times and units improve extraction.</p>
            </div>
          </article>
          <article className="m-lift flex flex-col gap-[18px] rounded-card border border-m-line bg-white/[0.022] p-3.5 hover:bg-white/[0.04]">
            <DecodeCard />
            <div className="px-2 pb-2.5">
              <div className="mb-2 flex items-center gap-2.5"><span className="font-mono text-xs text-steam-4">02</span><h3 className="text-lg font-medium tracking-[-0.015em]">Extract the observations</h3></div>
              <p className="text-[14.5px] leading-relaxed text-steam-3">Gemini extracts document observations; explicit CSV and XLSX columns are parsed directly. Source locations stay attached.</p>
            </div>
          </article>
          <article className="m-lift flex flex-col gap-[18px] rounded-card border border-m-line bg-white/[0.022] p-3.5 hover:bg-white/[0.04]">
            <div className="flex h-[210px] flex-col justify-end gap-3 overflow-hidden rounded-[15px] border border-white/5 bg-m-ink-2 px-5 pt-5 pb-4">
              <div className="flex flex-wrap gap-[18px] text-xs text-steam-3">
                <span className="inline-flex items-center gap-[7px]"><span className="size-2 rounded-[2px] bg-productive" />Productive {fmtNum(demo.productiveHours)} h</span>
                <span className="inline-flex items-center gap-[7px]"><span className="size-2 rounded-[2px] bg-ilt" />ILT {fmtNum(demo.iltHours)} h</span>
                <span className="inline-flex items-center gap-[7px]"><span className="size-2 rounded-[2px] bg-npt" />NPT {fmtNum(demo.nptHours)} h</span>
              </div>
              <div className="flex h-[46px] items-end gap-[3px]">
                {demo.events.map((e) => (
                  <span
                    key={e.id}
                    title={`${e.operation}`}
                    className={`m-seg h-full rounded ${e.cls === 'npt' ? 'bg-npt' : e.kind === 'flat' ? 'bg-productive-flat' : 'bg-productive'} ${e.ilt > 0.01 ? 'shadow-[inset_0_-8px_0_var(--m-ilt)]' : ''}`}
                    style={{ flex: `${e.hours} 1 0` }}
                  />
                ))}
              </div>
              <div className="flex justify-between font-mono text-[10.5px] text-steam-4"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
            </div>
            <div className="px-2 pb-2.5">
              <div className="mb-2 flex items-center gap-2.5"><span className="font-mono text-xs text-steam-4">03</span><h3 className="text-lg font-medium tracking-[-0.015em]">Every hour gets a class</h3></div>
              <p className="text-[14.5px] leading-relaxed text-steam-3">Source classifications establish productive time and NPT. TypeScript estimates drilling ILT only where observations support a benchmark.</p>
            </div>
          </article>
        </div>
      </section>

      {/* PLATFORM PREVIEW */}
      <section id="platform" className="mx-auto max-w-[1264px] px-5 pt-[104px] pb-10 sm:px-8">
        <SectionRule index="02" label="Platform" />
        <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-[640px] text-[clamp(34px,4vw,52px)] leading-[1.04] font-medium tracking-[-0.035em]">The whole report day on one screen.</h2>
          <Link href={consoleHref} className="border-b border-steam/30 pb-0.5 text-[15px] transition-colors hover:border-heat-6">Open the console →</Link>
        </div>
        <div className="relative">
          <div aria-hidden="true" className="absolute inset-x-[10%] -top-10 h-[260px] bg-[radial-gradient(ellipse_at_center,rgb(233_70_107/0.16),transparent_70%)] blur-[10px]" />
          <div aria-label="Synthetic demo report preview" className="relative overflow-x-auto rounded-card border border-white/10 m-preview-frame shadow-[0_40px_120px_rgb(0_0_0/0.7)]">
            <div className="min-w-0">
              <div className="m-preview-kpis grid grid-cols-2 sm:grid-cols-5 border-b border-m-line">
                {[
                  ['Scenario efficiency', `${fmtNum(demo.effectivePct)}%`, `${fmtNum(demo.effectiveHours)} of ${fmtNum(demo.observedHours)} h`],
                  ['Downtime (NPT)', `${fmtNum(demo.nptHours)} h`, `${fmtMoney(demo.nptCost)} · ${demo.events.filter(event => event.cls === "npt").length} events`],
                  ['Invisible lost time', `${fmtNum(demo.iltHours)} h`, `${fmtMoney(demo.iltCost)} · vs ${DEFAULT_ASSUMPTIONS.ropBenchmark} ft/h`],
                  ['Hole depth', `${demo.endDepth.toLocaleString('en-US')} ft`, `+${demo.footage} ft today`],
                  ['Excess CO₂', `${fmtNum(demo.co2Tonnes)} t`, `${fmtNum(demo.fuelGal, 0)} gal modeled excess fuel`],
                ].map(([label, value, meta], i) => (
                  <div key={label} className={`px-5 py-[18px] ${i < 4 ? 'border-r border-m-line' : ''}`}>
                    <div className="text-[12.5px] text-steam-4">{label}</div>
                    <div className="mt-1.5 text-[30px] font-medium tracking-[-0.03em]">{value}</div>
                    <div className="mt-1 font-mono text-[11px] text-steam-4">{meta}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pt-[22px] pb-6">
                <LandingPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" className="mx-auto max-w-[1264px] px-5 pt-[104px] pb-10 sm:px-8">
        <SectionRule index="03" label="Impact" />
        <h2 className="mb-11 max-w-[700px] text-[clamp(34px,4vw,52px)] leading-[1.04] font-medium tracking-[-0.035em]">What the synthetic demo day shows.</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border-y border-m-line">
          {[
            { v: fmtNum(demo.nptHours), u: ' h', bar: 'bg-npt', t: 'Confirmed downtime', s: 'Pump #2 repair and waiting on parts' },
            { v: fmtNum(demo.iltHours), u: ' h', bar: 'bg-ilt', t: 'Invisible lost time', s: 'Footage drilled under the selected benchmark' },
            { v: '$' + fmtNum(demo.totalCost / 1000), u: 'k', bar: 'bg-steam-3', t: 'Time exposure', s: `${fmtNum(lostH)} h at ${fmtMoney(DEFAULT_ASSUMPTIONS.dayRate)}/day` },
            { v: fmtNum(demo.co2Tonnes), u: ' t', bar: 'bg-steam-4', t: 'Excess CO₂', s: `From ${fmtNum(demo.fuelGal, 0)} gal under an assumed fuel differential` },
          ].map((k) => (
            <div key={k.t} className="py-[30px] pr-6">
              <div className="text-[clamp(44px,5vw,64px)] leading-none font-medium tracking-[-0.045em]">{k.v}<span className="text-[0.45em] text-steam-4">{k.u}</span></div>
              <div aria-hidden="true" className={`mt-[18px] mb-3.5 h-0.5 w-8 rounded-sm ${k.bar}`} />
              <div className="text-[15px]">{k.t}</div>
              <div className="mt-1 text-[13.5px] text-steam-4">{k.s}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="group flex gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.015] p-5 transition-colors hover:border-white/14 hover:bg-white/[0.03]">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 text-steam-2 transition-colors group-hover:border-heat-6/45 group-hover:text-heat-6"><Icon size={18} /></span>
              <div>
                <h3 className="mb-1 text-[15.5px] font-medium">{title}</h3>
                <p className="text-sm leading-normal text-steam-3">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STEEL & STEAM */}
      <section id="theme" className="mx-auto max-w-[1264px] px-5 pt-[104px] pb-10 sm:px-8">
        <SectionRule index="04" label="Steel & Steam" />
        <div className="flex flex-wrap items-center gap-12">
          <div className="relative h-[580px] min-w-0 flex-[1_1_480px] overflow-hidden rounded-[26px] border border-white/[0.07] m-theme-surface">
            <AsciiDrillBit />
            <div className="absolute top-[18px] left-5 font-mono text-[11px] text-steam-4">PDC bit · 6 blades · hover to spin up</div>
            <div aria-hidden="true" className="absolute top-[60px] right-5 bottom-[60px] w-1 rounded bg-[linear-gradient(180deg,var(--m-heat-2),var(--m-heat-4)_40%,var(--m-heat-7)_75%,var(--m-heat-9))]" />
            <div className="absolute top-[52px] right-8 font-mono text-[10.5px] text-steam-4">cool</div>
            <div className="absolute right-8 bottom-[52px] font-mono text-[10.5px] text-steam-4">hot face</div>
          </div>
          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[22px]">
            <h2 className="text-[clamp(34px,4vw,52px)] leading-[1.04] font-medium tracking-[-0.035em]">
              The bit is steel. The prize is <span className="m-heat-text pr-[0.06em] font-serif text-[1.1em] font-normal italic">heat.</span>
            </h2>
            <p className="text-[16.5px] leading-relaxed text-steam-3">Geothermal wells drive steel thousands of feet into hot rock to bring clean heat to the surface. Rig time has an economic cost, including legitimate planned flat-depth operations. BoreSight makes the recorded time visible for engineering review.</p>
            <dl className="grid grid-cols-3 border-t border-m-line">
              {[[`${demo.footage}`, ' ft', 'drilled in the demo day'], [fmtNum(lostH), ' h', 'NPT + modeled ILT'], [`${demo.events.length}`, `/${demo.events.length}`, 'events with source excerpts']].map(([v, u, l]) => (
                <div key={l} className="pt-[18px] pr-3">
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-[26px] font-medium tracking-[-0.03em]">{v}<span className="text-sm text-steam-4">{u}</span></dd>
                  <dd className="mt-1 text-[13px] text-steam-4">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1264px] px-5 pt-[120px] sm:px-8">
        <div className="relative overflow-hidden rounded-hero border border-white/[0.08] m-cta-surface px-8 py-[88px] text-center">
          <h2 className="mx-auto max-w-[720px] text-[clamp(38px,5vw,68px)] leading-none font-medium tracking-[-0.045em]">Drop a report. Find the hours.</h2>
          <p className="mx-auto mt-5 max-w-[460px] text-[16.5px] leading-relaxed text-steam-3">Start with the built-in demo well, or upload yesterday’s daily drilling report.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link href={consoleHref} className="m-btn-primary">Open the console <IconArrowRight size={16} strokeWidth={2} className="m-arrow" /></Link>
            <a href="#report-intake" className="m-btn-ghost">Upload a report</a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1264px] flex-wrap items-start justify-between gap-8 px-5 pt-14 pb-12 sm:px-8">
        <div className="flex max-w-[380px] flex-col gap-3">
          <MantleLogo size={22} />
          <p className="text-[13.5px] leading-relaxed text-steam-4">Geothermal drilling-report intelligence. Built around the Steel &amp; Steam theme.</p>
        </div>
        <div className="flex flex-wrap gap-14 text-[13.5px]">
          <div className="flex flex-col gap-2"><span className="text-steam-4">Built with</span><span className="text-steam-2">Gemini via Google AI Studio</span><span className="text-steam-2">Next.js · Recharts</span></div>
          {(teamNames || repoHref) && <div className="flex flex-col gap-2"><span className="text-steam-4">Team</span>{teamNames && <span className="text-steam-2">{teamNames}</span>}{repoHref && <a href={repoHref} className="self-start border-b border-steam/30 pb-0.5 transition-colors hover:border-heat-6">GitHub repo</a>}</div>}
        </div>
      </footer>
      <p className="mx-auto max-w-[1264px] px-5 pb-10 text-[13px] leading-relaxed text-steam-4 sm:px-8">All homepage charts and events are a SYNTHETIC DEMO, not actual well records. Cost and CO₂ are scenario estimates using the shown assumptions. Uploaded sources remain unverified and require human review; flat hole depth alone is not downtime.</p>
    </div>
  );
}
