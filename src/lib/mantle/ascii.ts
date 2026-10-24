/**
 * Mantle ASCII engine — shared noise, heat palettes and canvas helpers
 * used by ThermalField, AsciiDrillBit and CoreColumn.
 *
 * Everything here is deterministic and allocation-light so the canvases
 * can redraw at 30 fps without stressing the GC.
 */

export type PaletteName = 'thermal' | 'molten' | 'steam';

/** Ten-stop heat ramps, cold → white-hot. `thermal` is the production palette. */
export const PALETTE_STOPS: Record<PaletteName, readonly string[]> = {
  thermal: ['#120A1F', '#2B0F52', '#5A1A7E', '#8E2386', '#C2307A', '#E9466B', '#FF6F4D', '#FF9A3D', '#FFC56B', '#FFF1D6'],
  molten: ['#140805', '#330C05', '#5C1406', '#93220A', '#C9360D', '#F24E16', '#FF7A26', '#FFA63E', '#FFD27F', '#FFF6E2'],
  steam: ['#070B14', '#0E1C31', '#14324F', '#1B5172', '#277390', '#3F97A5', '#6CB9B4', '#A2D5C8', '#D1ECE2', '#F3FBF7'],
};

/** Steam plume ramp (neutral lavender-white), 8 levels. */
export const STEAM_RAMP = ['#17161F', '#262433', '#3A374B', '#555168', '#77738B', '#9E9AAF', '#C8C5D5', '#EEEDF4'] as const;

/** Steel colours for drill string, rig and wellhead glyphs. */
export const STEEL = { bright: '#F2F0EC', base: '#C9C5D6', mid: '#B9B4C8', dim: '#6F6A82', faint: '#3A3650' } as const;

const paletteCache = new Map<string, string[]>();

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** Interpolate a ramp into `steps` CSS colours (memoised). Index 0 = coldest. */
export function buildPalette(name: PaletteName = 'thermal', steps = 32): string[] {
  const key = name + ':' + steps;
  const hit = paletteCache.get(key);
  if (hit) return hit;
  const stops = PALETTE_STOPS[name] ?? PALETTE_STOPS.thermal;
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const f = (i / (steps - 1)) * (stops.length - 1);
    const k = Math.min(stops.length - 2, Math.floor(f));
    const u = f - k;
    const a = hexToRgb(stops[k]);
    const b = hexToRgb(stops[k + 1]);
    out.push(`rgb(${Math.round(a[0] + (b[0] - a[0]) * u)},${Math.round(a[1] + (b[1] - a[1]) * u)},${Math.round(a[2] + (b[2] - a[2]) * u)})`);
  }
  paletteCache.set(key, out);
  return out;
}

/** rgba() of a ramp stop, used for the canvas drop-shadow glow. */
export function paletteGlow(name: PaletteName = 'thermal', alpha = 0.3): string {
  const [r, g, b] = hexToRgb((PALETTE_STOPS[name] ?? PALETTE_STOPS.thermal)[5]);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Integer hash → [0, 1). */
export function hash3(x: number, y: number, z: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** Smooth 3D value noise in [0, 1]. */
export function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let xf = x - xi, yf = y - yi, zf = z - zi;
  xf = xf * xf * (3 - 2 * xf);
  yf = yf * yf * (3 - 2 * yf);
  zf = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, u: number) => a + (b - a) * u;
  const a0 = l(l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), xf), l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), xf), yf);
  const a1 = l(l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), xf), l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), xf), yf);
  return l(a0, a1, zf);
}

/** Two-octave fractal noise in [0, 1]. */
export function fbm(x: number, y: number, z: number): number {
  return vnoise(x, y, z) * 0.65 + vnoise(x * 2.1 + 17, y * 2.1 + 5, z * 1.6) * 0.35;
}

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

/** Match the backing store to CSS size × DPR (capped at 2) and return a ready context. */
export function fitCanvas(el: HTMLCanvasElement): CanvasFrame | null {
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!w || !h) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(w * dpr);
  const H = Math.round(h * dpr);
  if (el.width !== W || el.height !== H) {
    el.width = W;
    el.height = H;
  }
  const ctx = el.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/**
 * Canvas can't read CSS variables in `ctx.font`, and next/font hashes the
 * family name — so resolve the real family from the CSS variable once.
 */
export function monoFontFamily(): string {
  if (typeof window === 'undefined') return 'ui-monospace, monospace';
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-mantle-mono').trim();
  return (v ? v : '"JetBrains Mono"') + ', ui-monospace, Menlo, monospace';
}

/** Flat glyph buckets: [x, y, char, x, y, char, …] per colour level. */
export type GlyphBucket = Array<number | string>;

export function makeBuckets(n: number): GlyphBucket[] {
  return Array.from({ length: n }, () => [] as GlyphBucket);
}

export function clearBuckets(b: GlyphBucket[]): void {
  for (let i = 0; i < b.length; i++) b[i].length = 0;
}

/** Draw every bucket with its colour (one fillStyle switch per level). */
export function drawBuckets(ctx: CanvasRenderingContext2D, buckets: GlyphBucket[], colors: readonly string[]): void {
  for (let i = 0; i < buckets.length; i++) {
    const a = buckets[i];
    if (!a.length) continue;
    ctx.fillStyle = colors[i];
    for (let j = 0; j < a.length; j += 3) ctx.fillText(a[j + 2] as string, a[j] as number, a[j + 1] as number);
  }
}
