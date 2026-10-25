/**
 * Report model + deterministic day metrics (NPT, ILT, cost, fuel, CO₂).
 *
 * Classification (productive vs NPT) always comes from the source report /
 * Gemini extraction. ILT, cost and CO₂ are scenario estimates computed here
 * from editable assumptions — never present them as measured values.
 */

export type EventClass = 'productive' | 'npt';
export type EventKind = 'drilling' | 'flat';
export type Confidence = 'high' | 'medium' | 'low';

export interface DrillEvent {
  id: string;
  /** Report-day hours, 0–24. */
  start: number;
  end: number;
  /** Measured hole depth at the start of the interval, ft. */
  startDepth: number;
  /** Footage drilled during the interval, ft (0 for flat operations). */
  footage: number;
  operation: string;
  kind: EventKind;
  cls: EventClass;
  /** Verbatim source line from the report. */
  raw: string;
  /** Substring of `raw` that justified the classification (highlighted in the evidence panel). */
  mark: string;
  /** 1-based line number in the uploaded report. */
  line: number;
  page?: number;
  /** One-sentence plain-English reading of the line (Gemini). */
  summary: string;
  confidence: Confidence;
}

export interface Assumptions {
  dayRate: number;
  ropBenchmark: number;
  fuelGalPerHour: number;
  co2KgPerGal: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  dayRate: 120_000,
  ropBenchmark: 35,
  fuelGalPerHour: 60,
  co2KgPerGal: 10.18,
};

export interface EventMetrics extends DrillEvent {
  hours: number;
  rop: number;
  ilt: number;
  /** Lost hours attributable to this event (NPT hours or ILT hours). */
  lost: number;
  lostCost: number;
}

export interface DayMetrics {
  events: EventMetrics[];
  observedHours: number;
  productiveHours: number;
  nptHours: number;
  iltHours: number;
  lostHours: number;
  effectiveHours: number;
  effectivePct: number;
  nptCost: number;
  iltCost: number;
  totalCost: number;
  fuelGal: number;
  co2Tonnes: number;
  startDepth: number;
  endDepth: number;
  footage: number;
}

export function computeDay(events: DrillEvent[], a: Assumptions = DEFAULT_ASSUMPTIONS): DayMetrics {
  const perHour = a.dayRate / 24;
  const bench = Math.max(1, a.ropBenchmark);
  let npt = 0;
  let ilt = 0;
  let observed = 0;
  const out: EventMetrics[] = events.map((e) => {
    const hours = Math.max(0, e.end - e.start);
    observed += hours;
    const rop = e.footage > 0 && hours > 0 ? e.footage / hours : 0;
    const eIlt = e.cls === 'productive' && e.kind === 'drilling' ? Math.max(0, hours - e.footage / bench) : 0;
    const eNpt = e.cls === 'npt' ? hours : 0;
    npt += eNpt;
    ilt += eIlt;
    const lost = eNpt + eIlt;
    return { ...e, hours, rop, ilt: eIlt, lost, lostCost: lost * perHour };
  });
  const lost = npt + ilt;
  const first = events[0];
  const lastEv = events[events.length - 1];
  const startDepth = first ? first.startDepth : 0;
  const endDepth = lastEv ? lastEv.startDepth + lastEv.footage : 0;
  const effectiveHours = Math.max(0, observed - lost);
  return {
    events: out,
    observedHours: observed,
    productiveHours: observed - npt,
    nptHours: npt,
    iltHours: ilt,
    lostHours: lost,
    effectiveHours,
    effectivePct: observed ? (effectiveHours / observed) * 100 : 0,
    nptCost: npt * perHour,
    iltCost: ilt * perHour,
    totalCost: lost * perHour,
    fuelGal: lost * a.fuelGalPerHour,
    co2Tonnes: (lost * a.fuelGalPerHour * a.co2KgPerGal) / 1000,
    startDepth,
    endDepth,
    footage: endDepth - startDepth,
  };
}

/** 6 → "06:00", 17.5 → "17:30", 24 → "24:00". */
export function fmtClock(h: number): string {
  const m = Math.round(h * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function fmtMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function fmtNum(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Display label + token classes for an event's class pill. */
export function classPill(e: Pick<EventMetrics, 'cls' | 'ilt'>): { label: string; className: string } {
  if (e.cls === 'npt') return { label: 'NPT', className: 'bg-npt/15 text-npt-ink' };
  if (e.ilt > 0.01) return { label: 'Productive · ILT', className: 'bg-ilt/15 text-ilt-ink' };
  return { label: 'Productive', className: 'bg-productive/20 text-productive-ink' };
}

/** Synthetic demo day (illustrative — not real Utah FORGE records). */
export const DEMO_EVENTS: DrillEvent[] = [
  { id: 'e1', start: 0, end: 3, startDepth: 6100, footage: 110, operation: 'Drilling', kind: 'drilling', cls: 'productive', raw: "0000-0300 DRILL 6100-6210', WOB 24KLB, ROP 36.7", mark: "DRILL 6100-6210'", line: 1, page: 1, summary: 'Rotary drilling through 110 ft, ahead of benchmark pace.', confidence: 'high' },
  { id: 'e2', start: 3, end: 5, startDepth: 6210, footage: 40, operation: 'Drilling', kind: 'drilling', cls: 'productive', raw: '0300-0500 DRILL HARD STRINGER, ROP 20FT/HR', mark: 'ROP 20FT/HR', line: 2, page: 1, summary: 'A hard stringer slowed the bit to 20 ft/h.', confidence: 'high' },
  { id: 'e3', start: 5, end: 6, startDepth: 6250, footage: 0, operation: 'Circulating', kind: 'flat', cls: 'productive', raw: '0500-0600 CIRC/COND MUD', mark: 'CIRC/COND MUD', line: 3, page: 1, summary: 'Planned mud conditioning before the next interval.', confidence: 'high' },
  { id: 'e4', start: 6, end: 10, startDepth: 6250, footage: 0, operation: 'Rig repair', kind: 'flat', cls: 'npt', raw: '0600-1000 PUMP #2 LINER SEAL FAILED, REPLACE, TEST', mark: 'PUMP #2 LINER SEAL FAILED', line: 4, page: 1, summary: 'Mud pump #2 liner seal failed; the seal was replaced and the pump tested.', confidence: 'high' },
  { id: 'e5', start: 10, end: 13, startDepth: 6250, footage: 130, operation: 'Drilling', kind: 'drilling', cls: 'productive', raw: "1000-1300 DRILL AHEAD 130', ROP 43FT/HR", mark: "DRILL AHEAD 130'", line: 5, page: 1, summary: 'Drilled 130 ft at 43 ft/h after the repair.', confidence: 'high' },
  { id: 'e6', start: 13, end: 14, startDepth: 6380, footage: 0, operation: 'Waiting on parts', kind: 'flat', cls: 'npt', raw: '1300-1400 W.O. PARTS CONFIRMATION 1HR', mark: 'W.O. PARTS CONFIRMATION', line: 6, page: 1, summary: 'The rig waited an hour for parts confirmation.', confidence: 'high' },
  { id: 'e7', start: 14, end: 17.5, startDepth: 6380, footage: 60, operation: 'Drilling', kind: 'drilling', cls: 'productive', raw: "1400-1730 DRILL 60' IN 3.5 HOURS, LOW ROP", mark: "DRILL 60' IN 3.5 HOURS, LOW ROP", line: 7, page: 1, summary: 'Low ROP through 60 ft of hole.', confidence: 'high' },
  { id: 'e8', start: 17.5, end: 19, startDepth: 6440, footage: 0, operation: 'BHA change', kind: 'flat', cls: 'productive', raw: '1730-1900 POOH BHA SERVICE / BIT CHANGE', mark: 'POOH BHA SERVICE / BIT CHANGE', line: 8, page: 1, summary: 'Pulled out of hole to service the BHA and change the bit.', confidence: 'high' },
  { id: 'e9', start: 19, end: 24, startDepth: 6440, footage: 150, operation: 'Drilling', kind: 'drilling', cls: 'productive', raw: "1900-2400 DRILL 150' IN 5H", mark: "DRILL 150' IN 5H", line: 9, page: 1, summary: 'Drilled 150 ft at 30 ft/h to end the day.', confidence: 'high' },
];
