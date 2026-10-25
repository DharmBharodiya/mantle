'use client';

import { useEffect, useRef } from 'react';
import {
  STEAM_RAMP,
  STEEL,
  buildPalette,
  clearBuckets,
  drawBuckets,
  fbm,
  fitCanvas,
  hash3,
  makeBuckets,
  monoFontFamily,
  paletteGlow,
  type PaletteName,
} from '@/lib/mantle/ascii';
import { useCanvasLoop } from '@/lib/mantle/useCanvasLoop';
import { cn } from '@/lib/mantle/cn';

export interface ThermalFieldProps {
  palette?: PaletteName;
  /** Drill string position, fraction of width (left guide line). */
  drillX?: number;
  /** Production well position, fraction of width (right guide line). */
  wellX?: number;
  /** Ground surface, fraction of height. */
  surface?: number;
  /** Bit depth, fraction of the underground height. */
  bitDepth?: number;
  /** Half-width of the calm text column in the middle, fraction of width. */
  calm?: number;
  /** Cursor heats the field. Listens on the canvas's parent element. */
  interactive?: boolean;
  paused?: boolean;
  className?: string;
}

const RIG = ['  .=.  ', '  |·|  ', ' |\\ /| ', ' | X | ', '|\\   /|', '| \\ / |', '|  X  |', '| / \\ |', '|/   \\|', '/=====\\'];
const CW = 10;
const CH = 14;

/**
 * Homepage hero background: a thermal ASCII cross-section of the ground.
 * Left guide = drill string going down (steel). Right guide = production
 * well with hot fluid rising and a steam plume (steam). Isotherms drift,
 * the bit sparks and stalls every 12 s (an NPT beat), and the cursor adds heat.
 */
export function ThermalField({
  palette = 'thermal',
  drillX = 0.22,
  wellX = 0.78,
  surface = 0.3,
  bitDepth = 0.6,
  calm = 0.15,
  interactive = true,
  paused = false,
  className,
}: ThermalFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const mem = useRef({ hp: 0, heat: makeBuckets(32), steam: makeBuckets(8), font: '' });

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host || !interactive) return;
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const leave = () => {
      mouse.current = null;
    };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, [interactive]);

  useCanvasLoop(
    ref,
    (t, dt) => {
      const el = ref.current;
      if (!el) return;
      const f = fitCanvas(el);
      if (!f) return;
      const { ctx, w, h } = f;
      const s = mem.current;
      if (!s.font) s.font = `500 11px ${monoFontFamily()}`;
      ctx.clearRect(0, 0, w, h);

      const pal = buildPalette(palette);
      const B = s.heat;
      const S = s.steam;
      clearBuckets(B);
      clearBuckets(S);
      const X: Array<number | string> = [];
      const put = (c: number, r: number, ch: string, col: string) => {
        X.push(c * CW + CW / 2, r * CH + CH / 2, ch, col);
      };

      const cols = Math.ceil(w / CW);
      const rows = Math.ceil(h / CH);
      const surf = Math.max(12, Math.round((h * surface) / CH));
      const dCol = Math.round((w * drillX) / CW - 0.5);
      const wCol = Math.round((w * wellX) / CW - 0.5);
      const bitRow = surf + Math.round((rows - surf) * bitDepth);
      const m = mouse.current;
      const narrow = w < 768;
      const calmEff = narrow ? 0.42 : calm;
      const stalled = t % 12 > 8.6;
      s.hp += stalled ? 0 : dt * 5;

      // steam puffs leaving the wellhead (cell units)
      const puffs: number[] = [];
      const period = 0.32;
      const life = 7.5;
      for (let n = Math.floor((t - life) / period); n <= Math.floor(t / period); n++) {
        const age = t - n * period;
        if (age < 0 || age > life) continue;
        const j = hash3(n, 5, 1) - 0.5;
        puffs.push(
          wCol + age * (0.5 + age * 0.32) + Math.sin(age * 1.3 + n) * 0.9,
          surf - 2 - age * (2.1 - age * 0.11) + j * 0.6,
          0.9 + age * 0.6,
          Math.pow(1 - age / life, 1.3) * (0.42 + j * 0.12),
        );
      }

      for (let r = 0; r < rows; r++) {
        const y = r * CH + CH / 2;
        for (let c = 0; c < cols; c++) {
          const x = c * CW + CW / 2;
          const ax = Math.abs(x / w - 0.5);
          let mk = Math.min(1, Math.max(0, (ax - calmEff) / 0.17));
          mk = 0.08 + 0.92 * mk * mk * (3 - 2 * mk);
          let mh = 0;
          if (m) {
            const dx = x - m.x;
            const dy = y - m.y;
            mh = Math.exp(-(dx * dx + dy * dy) / 7000);
          }

          if (r < surf) {
            let d = 0;
            if (c > wCol - 8 && c < wCol + 34) {
              for (let k = 0; k < puffs.length; k += 4) {
                const dx = (c - puffs[k]) * 0.55;
                const dy = r - puffs[k + 1];
                const rr = puffs[k + 2];
                const q = (dx * dx + dy * dy) / (rr * rr);
                if (q < 5) d += puffs[k + 3] * Math.exp(-q);
              }
              if (d > 0.05) d *= 0.45 + 1.1 * fbm(c * 0.22 - t * 0.7, r * 0.45 + t * 0.35, t * 0.2);
            }
            if (narrow) d *= 0.35;
            d += mh * 0.35;
            if (d > 0.1) {
              const ch = d < 0.24 ? '.' : d < 0.46 ? '·' : d < 0.8 ? '•' : '●';
              S[Math.min(7, Math.floor(d * 9))].push(x, y, ch);
            } else if (hash3(c, r, Math.floor(t * 1.2)) < 0.012 * mk) {
              B[4].push(x, y, '·');
            }
            continue;
          }
          if (r === surf) {
            if (mk > 0.12) S[mk > 0.6 ? 2 : 1].push(x, y, '─');
            continue;
          }
          if ((c === dCol && r <= bitRow) || c === wCol) continue;

          const depth = (r - surf) / (rows - surf);
          let tp = 0.06 + Math.pow(depth, 1.3) * 0.8;
          tp += 0.18 * (fbm(c * 0.055 + t * 0.03, r * 0.12 - t * 0.06, t * 0.07) - 0.5);
          const dw = (c - wCol) / 3.4;
          tp += 0.3 * Math.exp(-dw * dw) * (0.75 + 0.25 * Math.sin(r * 0.55 + t * 4));
          const bx = (c - dCol) / 4.5;
          const by = (r - bitRow) / 2.8;
          tp += (stalled ? 0.25 : 0.5) * Math.exp(-(bx * bx + by * by));
          tp += mh * 0.5;
          if (tp > 1) tp = 1;
          const bp = tp * 11 - t * 0.14;
          const onContour = bp - Math.floor(bp) < 0.17;
          let I = tp * (onContour ? 1 : 0.55) * mk + mh * (ax < calmEff + 0.02 ? 0.3 : 0.55);
          if (I > 1) I = 1;
          if (I < 0.08) continue;
          const ch = onContour
            ? I > 0.72 ? '■' : I > 0.45 ? '=' : '-'
            : I > 0.8 ? '▪' : I > 0.52 ? '+' : I > 0.28 ? '·' : '.';
          B[Math.min(31, Math.floor(Math.pow(I, 0.75) * 32))].push(x, y, ch);
        }
      }

      // rig
      const rigTop = surf - RIG.length;
      for (let i = 0; i < RIG.length; i++) {
        for (let k = 0; k < RIG[i].length; k++) {
          const ch = RIG[i][k];
          if (ch !== ' ') put(dCol - 3 + k, rigTop + i, ch, STEEL.dim);
        }
      }
      for (let r = rigTop + 1; r < surf - 2; r++) put(dCol, r, '│', '#9A95AD');
      put(dCol, surf - 2, stalled ? '+' : '|/-\\'[Math.floor(t * 10) % 4], stalled ? pal[18] : STEEL.bright);

      // drill string with tool joints scrolling down while drilling
      for (let r = surf; r < bitRow; r++) {
        const joint = ((r - Math.floor(s.hp)) % 7 + 7) % 7 === 0;
        if (r < surf + 6) put(dCol, r, '║', STEEL.base);
        else put(dCol, r, joint ? '╪' : '│', joint ? STEEL.bright : STEEL.mid);
      }
      put(dCol, bitRow, '▼', stalled ? (Math.floor(t * 4) % 2 ? pal[20] : pal[12]) : pal[31]);
      if (!stalled) {
        const fk = Math.floor(t * 14);
        for (let k = 0; k < 14; k++) {
          const a = hash3(k, fk, 3) * Math.PI * 2;
          const rad = 1 + hash3(k, fk, 4) * 3.2;
          const sc = Math.round(dCol + Math.cos(a) * rad * 1.6);
          const sr = Math.round(bitRow + Math.sin(a) * rad * 0.7);
          if (sr <= surf || (sc === dCol && sr <= bitRow)) continue;
          put(sc, sr, hash3(k, fk, 5) < 0.5 ? '*' : '+', pal[22 + Math.floor(hash3(k, fk, 6) * 9)]);
        }
      }

      // production well: hot fluid rising
      put(wCol, surf - 1, '╬', STEEL.base);
      put(wCol, surf - 2, '╦', STEEL.dim);
      for (let r = surf; r < rows; r++) put(wCol, r, '┃', STEEL.faint);
      const span = rows - surf - 1;
      for (let k = 0; k < 9; k++) {
        const pr = Math.round(rows - 1 - ((t * 6 + (k * span) / 9) % span));
        const heat = (pr - surf) / span;
        put(wCol, pr, '●', pal[Math.max(0, Math.min(31, Math.round(14 + heat * 16)))]);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = s.font;
      drawBuckets(ctx, B, pal);
      drawBuckets(ctx, S, STEAM_RAMP);
      for (let j = 0; j < X.length; j += 4) {
        ctx.fillStyle = X[j + 3] as string;
        ctx.fillText(X[j + 2] as string, X[j] as number, X[j + 1] as number);
      }
    },
    { fps: 30, paused },
  );

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 block h-full w-full', className)}
      style={{ filter: `drop-shadow(0 0 5px ${paletteGlow(palette, 0.28)})` }}
    />
  );
}
