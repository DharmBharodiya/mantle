'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

export interface CanvasLoopOptions {
  /** Target frame rate. ASCII canvases run at 30. */
  fps?: number;
  /** Stop drawing entirely (e.g. a "static export" mode). */
  paused?: boolean;
}

/**
 * Drives a canvas draw function with requestAnimationFrame.
 * - throttles to `fps`
 * - pauses while the canvas is off-screen (IntersectionObserver)
 * - honours prefers-reduced-motion by freezing time (interaction still redraws)
 * - swallows draw errors in production so a canvas can never take the page down
 */
export function useCanvasLoop(
  ref: RefObject<HTMLCanvasElement | null>,
  draw: (t: number, dt: number) => void,
  { fps = 30, paused = false }: CanvasLoopOptions = {},
): void {
  const drawRef = useRef(draw);
  useLayoutEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = 0;
    let prevT = 0;
    let visible = true;
    const start = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { rootMargin: '120px' });
    io.observe(el);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || paused) return;
      const gap = reduce.matches ? 250 : 1000 / fps;
      if (now - last < gap) return;
      last = now;
      const t = reduce.matches ? 9.4 : (now - start) / 1000;
      const dt = Math.min(0.1, Math.max(0, t - prevT));
      prevT = t;
      try {
        drawRef.current(t, dt);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[mantle canvas]', err);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [ref, fps, paused]);
}
