'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Width of an SVG label, measured rather than guessed.
 *
 * Both hand-drawn stack charts place things against their own labels — the
 * provenance mark that follows a corridor name, and the clamp that keeps a band
 * name inside the plot — and both used to do it off `text.length × a constant`.
 * That is only right for a string of average letters: "Gopalganj-Aminbazar" is
 * wide and full of round glyphs, so its mark landed inside the final letters,
 * while a short label left the mark drifting in space.
 *
 * The measurement runs in a layout effect, before paint, so the estimated
 * position is never seen. The estimate still matters in two cases: the very
 * first render, and any environment without text metrics (jsdom, some headless
 * engines) where `getComputedTextLength` throws or returns zero.
 *
 * Returns a ref to attach to the `<text>` element and the width to lay out
 * against, in user units.
 */
export function useSvgTextWidth(text: string, estimatePerChar: number) {
  const ref = useRef<SVGTextElement | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const w = el.getComputedTextLength();
      if (w > 0) setMeasured(w);
    } catch {
      /* no text metrics here — the estimate stands */
    }
  }, [text]);

  return { ref, width: measured ?? text.length * estimatePerChar };
}
