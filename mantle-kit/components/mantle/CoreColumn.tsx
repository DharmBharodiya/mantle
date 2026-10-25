'use client';

import { useRef } from 'react';
import { STEEL, buildPalette, fbm, fitCanvas, hash3, monoFontFamily, paletteGlow, type PaletteName } from '@/lib/mantle/ascii';
import { useCanvasLoop } from '@/lib/mantle/useCanvasLoop';
import { cn } from '@/lib/mantle/cn';

export interface CoreColumnProps {
  palette?: PaletteName;
  /** Drilling animates the rotary, joints and sparks. Set false while the well is in NPT. */
  drilling?: boolean;
  className?: string;
}

const CW = 8;
const CH = 12;

/** Small live well cross-section for the console sidebar. */
export function CoreColumn({ palette = 'thermal', drilling = true, className }: CoreColumnProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mem = useRef({ font: '', hp: 0 });

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
      s.hp += drilling ? dt * 4 : 0;
      ctx.clearRect(0, 0, w, h);
      const pal = buildPalette(palette);
      const cols = Math.floor(w / CW);
      const rows = Math.floor(h / CH);
      const ox = (w - cols * CW) / 2;
      const surf = 2;
      const bc = Math.floor(cols / 2);
      const bitRow = rows - 2;
      const px = (c: number) => ox + c * CW + CW / 2;
      const py = (r: number) => r * CH + CH / 2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = s.font;
      for (let r = surf; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === surf) {
            ctx.fillStyle = STEEL.faint;
            ctx.fillText('─', px(c), py(r));
            continue;
          }
          if (c === bc && r <= bitRow) continue;
          const depth = (r - surf) / (rows - surf);
          let tp = 0.08 + depth * 0.72 + 0.2 * (fbm(c * 0.16 + t * 0.05, r * 0.32 - t * 0.12, t * 0.1) - 0.5);
          const bx = (c - bc) / 3;
          const by = (r - bitRow) / 1.6;
          tp += (drilling ? 0.45 : 0.2) * Math.exp(-(bx * bx + by * by));
          if (tp > 1) tp = 1;
          const bp = tp * 9 - t * 0.2;
          const on = bp - Math.floor(bp) < 0.2;
          const I = tp * (on ? 1 : 0.4);
          if (I < 0.1) continue;
          ctx.fillStyle = pal[Math.min(31, Math.floor(I * 32))];
          ctx.fillText(on ? (I > 0.7 ? '■' : I > 0.45 ? '=' : '-') : I > 0.5 ? '+' : '·', px(c), py(r));
        }
      }
      ctx.fillStyle = STEEL.dim;
      ctx.fillText('/', px(bc - 1), py(0));
      ctx.fillText('\\', px(bc + 1), py(0));
      ctx.fillText('/', px(bc - 1), py(1));
      ctx.fillText('\\', px(bc + 1), py(1));
      ctx.fillStyle = STEEL.bright;
      ctx.fillText(drilling ? '|/-\\'[Math.floor(t * 10) % 4] : '+', px(bc), py(1));
      for (let r = surf; r < bitRow; r++) {
        const joint = ((r - Math.floor(s.hp)) % 4 + 4) % 4 === 0;
        ctx.fillStyle = joint ? STEEL.bright : STEEL.base;
        ctx.fillText(joint ? '╪' : '│', px(bc), py(r));
      }
      ctx.fillStyle = drilling ? pal[31] : pal[18];
      ctx.fillText('▼', px(bc), py(bitRow));
      if (drilling) {
        const fk = Math.floor(t * 12);
        for (let k = 0; k < 6; k++) {
          const a = hash3(k, fk, 3) * Math.PI * 2;
          const rad = 1 + hash3(k, fk, 4) * 2;
          const sc = Math.round(bc + Math.cos(a) * rad * 1.5);
          const sr = Math.round(bitRow + Math.sin(a) * rad * 0.6);
          if (sr <= surf || sr >= rows || sc === bc) continue;
          ctx.fillStyle = pal[24 + Math.floor(hash3(k, fk, 6) * 7)];
          ctx.fillText('*', px(sc), py(sr));
        }
      }
    },
    { fps: 25 },
  );

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 block h-full w-full', className)}
      style={{ filter: `drop-shadow(0 0 4px ${paletteGlow(palette, 0.3)})` }}
    />
  );
}
