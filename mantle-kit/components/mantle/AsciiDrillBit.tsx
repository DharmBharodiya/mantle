'use client';

import { useRef } from 'react';
import { buildPalette, fitCanvas, hash3, monoFontFamily, paletteGlow, type PaletteName } from '@/lib/mantle/ascii';
import { useCanvasLoop } from '@/lib/mantle/useCanvasLoop';
import { cn } from '@/lib/mantle/cn';

/** Point cloud for a 6-blade PDC bit: x, y, z, nx, ny, nz, kind, heat (stride 8). kind: 0 body, 1 blade, 2 cutter, 3 pin thread. */
let BIT_POINTS: Float32Array | null = null;

function bitPoints(): Float32Array {
  if (BIT_POINTS) return BIT_POINTS;
  const P: number[] = [];
  const add = (x: number, y: number, z: number, nx: number, ny: number, nz: number, kind: number) => {
    const L = Math.hypot(nx, ny, nz) || 1;
    P.push(x, y, z, nx / L, ny / L, nz / L, kind, Math.min(1, Math.max(0, (y + 0.6) / 1.3)));
  };
  const TAU = Math.PI * 2;
  const NB = 6;
  const bladeAng = (k: number, r: number) => (k * TAU) / NB + 0.55 * r;
  const angDist = (a: number, b: number) => {
    let d = (a - b) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  };
  const near = (th: number, r: number) => {
    let best = 9;
    let bk = 0;
    for (let k = 0; k < NB; k++) {
      const d = Math.abs(angDist(th, bladeAng(k, r)));
      if (d < best) {
        best = d;
        bk = k;
      }
    }
    return { d: best, k: bk };
  };
  for (let i = 0; i < 110; i++) {
    const th = (i / 110) * TAU;
    for (let y = -2.0; y <= -1.55; y += 0.035) {
      const groove = Math.sin(y * 70) > 0.3 ? 0.93 : 1;
      const r = 0.36 * groove * (y < -1.93 ? 1 - (-1.93 - y) * 2.5 : 1);
      add(Math.cos(th) * r, y, Math.sin(th) * r, Math.cos(th), 0, Math.sin(th), 3);
    }
  }
  for (let i = 0; i < 160; i++) {
    const th = (i / 160) * TAU;
    for (let r = 0.36; r <= 0.62; r += 0.03) add(Math.cos(th) * r, -1.55, Math.sin(th) * r, 0, -1, 0, 0);
    for (let y = -1.55; y <= -0.62; y += 0.035) add(Math.cos(th) * 0.62, y, Math.sin(th) * 0.62, Math.cos(th), 0, Math.sin(th), 0);
  }
  for (let i = 0; i < 200; i++) {
    const th = (i / 200) * TAU;
    for (let y = -0.62; y <= -0.34; y += 0.03) {
      const r = 0.62 + 0.36 * ((y + 0.62) / 0.28);
      add(Math.cos(th) * r, y, Math.sin(th) * r, Math.cos(th), -0.8, Math.sin(th), 0);
    }
  }
  for (let i = 0; i < 240; i++) {
    const th = (i / 240) * TAU;
    const nb = near(th, 1);
    const onB = nb.d < 0.2;
    const r = onB ? 1.0 : 0.86;
    for (let y = -0.34; y <= 0.16; y += 0.03) {
      const kind = onB ? (nb.d < 0.05 && Math.abs(y + 0.05) < 0.04 ? 2 : 1) : 0;
      add(Math.cos(th) * r, y, Math.sin(th) * r, Math.cos(th), 0, Math.sin(th), kind);
    }
  }
  const cuts = [0.2, 0.38, 0.56, 0.74, 0.92];
  for (let ri = 0; ri <= 52; ri++) {
    const r = ri / 52;
    const n = Math.max(24, Math.round(240 * r));
    for (let i = 0; i < n; i++) {
      const th = (i / n) * TAU;
      const nb = near(th, r);
      const arc = nb.d * Math.max(r, 0.12);
      const onB = arc < 0.1 && r > 0.08;
      const y = 0.16 + 0.4 * (1 - r * r) + (onB ? 0.09 : -0.02);
      let kind = onB ? 1 : 0;
      if (onB) {
        for (let q = 0; q < cuts.length; q++) {
          if (Math.hypot(r - cuts[q], arc) < 0.045 && (cuts[q] > 0.5 || (nb.k + q) % 2 === 0)) {
            kind = 2;
            break;
          }
        }
      }
      const rr = r > 0.86 && !onB ? 0.86 : r;
      add(Math.cos(th) * rr, y, Math.sin(th) * rr, 0.8 * r * Math.cos(th), 1, 0.8 * r * Math.sin(th), kind);
    }
  }
  BIT_POINTS = new Float32Array(P);
  return BIT_POINTS;
}

export interface AsciiDrillBitProps {
  palette?: PaletteName;
  /** Spin up while the parent is hovered. */
  hoverBoost?: boolean;
  paused?: boolean;
  className?: string;
}

const RAMP = ' .:-=+*#%@';
const CW = 8;
const CH = 11;

/** Rotating ASCII PDC drill bit: cool steel shank, white-hot cutting face, flying cuttings. */
export function AsciiDrillBit({ palette = 'thermal', hoverBoost = true, paused = false, className }: AsciiDrillBitProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mem = useRef({ ang: 0.7, fast: false, font: '', zb: new Float32Array(0), bb: new Float32Array(0), kb: new Uint8Array(0), hb: new Float32Array(0) });

  useCanvasLoop(
    ref,
    (t, dt) => {
      const el = ref.current;
      if (!el) return;
      const f = fitCanvas(el);
      if (!f) return;
      const { ctx, w, h } = f;
      const s = mem.current;
      if (!s.font) s.font = `500 10px ${monoFontFamily()}`;
      if (hoverBoost) s.fast = !!el.parentElement?.matches(':hover');
      s.ang += dt * (s.fast ? 2.6 : 0.55);
      ctx.clearRect(0, 0, w, h);

      const P = bitPoints();
      const pal = buildPalette(palette);
      const cols = Math.floor(w / CW);
      const rows = Math.floor(h / CH);
      const N = cols * rows;
      if (s.zb.length !== N) {
        s.zb = new Float32Array(N);
        s.bb = new Float32Array(N);
        s.kb = new Uint8Array(N);
        s.hb = new Float32Array(N);
      }
      const { zb, bb, kb, hb } = s;
      zb.fill(-1e9);
      const ca = Math.cos(s.ang);
      const sa = Math.sin(s.ang);
      const ct = Math.cos(0.42);
      const st = Math.sin(0.42);
      const S = Math.min(w / 2.6, h / 3.4);
      const cx = w / 2;
      const cy = h / 2 + 0.5 * S;
      const L0 = -0.45, L1 = 0.12, L2 = 0.88;
      const LL = Math.hypot(L0, L1, L2);

      for (let i = 0; i < P.length; i += 8) {
        const x = P[i], y = P[i + 1], z = P[i + 2];
        const nx = P[i + 3], ny = P[i + 4], nz = P[i + 5];
        const x1 = x * ca + z * sa;
        const z1 = -x * sa + z * ca;
        const nx1 = nx * ca + nz * sa;
        const nz1 = -nx * sa + nz * ca;
        const y2 = y * ct - z1 * st;
        const z2 = y * st + z1 * ct;
        const ny2 = ny * ct - nz1 * st;
        const nz2 = ny * st + nz1 * ct;
        if (nz2 < -0.2) continue;
        const c = Math.floor((cx + x1 * S) / CW);
        const r = Math.floor((cy + y2 * S) / CH);
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        const idx = r * cols + c;
        if (z2 > zb[idx]) {
          zb[idx] = z2;
          bb[idx] = Math.max(0.16 + 0.84 * Math.max(0, (nx1 * L0 + ny2 * L1 + nz2 * L2) / LL), 0.22 + 0.45 * P[i + 7]);
          kb[idx] = P[i + 6];
          hb[idx] = P[i + 7];
        }
      }

      const out: Array<number | string> = [];
      for (let idx = 0; idx < N; idx++) {
        if (zb[idx] < -1e8) continue;
        const k = kb[idx];
        let b = bb[idx];
        let ch: string;
        let lv: number;
        if (k === 2) {
          ch = '@';
          lv = 31;
        } else {
          if (k === 1) b = Math.min(1, b + 0.12);
          if (k === 3) b *= 0.85;
          ch = RAMP[1 + Math.min(k === 1 ? 7 : 6, Math.floor(b * b * (k === 1 ? 8.5 : 7.5)))];
          lv = Math.max(2, Math.min(30, Math.floor((0.05 + 0.5 * b + 0.42 * hb[idx]) * 31)));
        }
        const c = idx % cols;
        const r = (idx - c) / cols;
        out.push(c * CW + CW / 2, r * CH + CH / 2, ch, lv);
      }
      // cuttings thrown off the face
      for (let k = 0; k < 46; k++) {
        const ph = (t * 0.5 + hash3(k, 1, 9)) % 1;
        const a = hash3(k, 2, 9) * Math.PI * 2 + s.ang * 0.3;
        const rad = 0.75 + ph * 1.5;
        const px = Math.cos(a) * rad;
        const pz = Math.sin(a) * rad;
        const py = 0.72 + ph * ph * 0.55 + hash3(k, 3, 9) * 0.1;
        const y2 = py * ct - pz * st;
        const z2 = py * st + pz * ct;
        const c = Math.floor((cx + px * S) / CW);
        const r = Math.floor((cy + y2 * S) / CH);
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        if (zb[r * cols + c] > z2) continue;
        out.push(c * CW + CW / 2, r * CH + CH / 2, ph < 0.3 ? '*' : ph < 0.6 ? '+' : '·', Math.max(4, Math.round(30 - ph * 22)));
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = s.font;
      const groups = new Map<number, number[]>();
      for (let j = 0; j < out.length; j += 4) {
        const lv = out[j + 3] as number;
        let g = groups.get(lv);
        if (!g) groups.set(lv, (g = []));
        g.push(j);
      }
      groups.forEach((idxs, lv) => {
        ctx.fillStyle = pal[lv];
        for (const j of idxs) ctx.fillText(out[j + 2] as string, out[j] as number, out[j + 1] as number);
      });
    },
    { fps: 30, paused },
  );

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 block h-full w-full', className)}
      style={{ filter: `drop-shadow(0 0 4px ${paletteGlow(palette, 0.35)})` }}
    />
  );
}
