'use client';

import { useMediaQuery } from './useTapToRead';

/**
 * Should Recharts animate its entrance?
 *
 * true  : desktop (>= 1024px) with no reduced-motion preference -- the original behaviour.
 * false : below 1024px, or prefers-reduced-motion: reduce at any width.
 *
 * useMediaQuery returns false on the server and on the hydration render, so the
 * first client render is always `true` (matching the server). Charts that animate
 * are only mounted once data has arrived, after hydration, by which time the real
 * value is in effect.
 *
 * Use: <Line isAnimationActive={useChartAnimation()} /> -- call the hook once per
 * component, not inline in JSX.
 */
const FORCE_ANIMATE = false; // measurement switch only; must stay false

export function useChartAnimation(): boolean {
  const small = useMediaQuery('(max-width: 1023px)');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  if (FORCE_ANIMATE) return true;
  return !(small || reduced);
}
