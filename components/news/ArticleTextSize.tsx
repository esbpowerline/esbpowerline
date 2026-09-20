'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, Type } from 'lucide-react';

/**
 * Reader-chosen text size, the way a news site offers it.
 *
 * Body copy is set at one size for everyone, and the people most likely to
 * read a 1,500-word piece on a regulator's tariff order are not always the
 * people with the sharpest eyes. Browser zoom scales the furniture too; this
 * scales the story.
 *
 * The choice is remembered per reader and applies to every article, because a
 * setting that resets on the next story is not a setting. It is stored in
 * `localStorage`, which can throw in a private window or with site data
 * blocked, so every read and write is guarded and the default simply stands.
 */

const STORAGE_KEY = 'esbpowerline:article-text-scale';

/** Multipliers, not pixel sizes: the site's own type scale stays in charge. */
const STEPS = [0.9, 1, 1.15, 1.3] as const;
const DEFAULT_INDEX = 1;

function readStored(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const index = raw === null ? NaN : Number(raw);
    return Number.isInteger(index) && index >= 0 && index < STEPS.length ? index : DEFAULT_INDEX;
  } catch {
    return DEFAULT_INDEX;
  }
}

export function ArticleTextSize() {
  const [index, setIndex] = useState(DEFAULT_INDEX);
  /**
   * The stored choice is read after mount, and the first apply must not write.
   *
   * Both effects run on mount, in declaration order, and `setIndex` is not
   * immediate — so without this the apply-effect stored the DEFAULT over the
   * reader's saved choice microseconds before the restore landed, and the
   * setting reset on every article (measured 2026-09-20).
   */
  const settled = useRef(false);

  // Read after mount, never during render: the server has no localStorage, and
  // reading it while rendering would hydrate to different markup.
  useEffect(() => setIndex(readStored()), []);

  useEffect(() => {
    const root = document.querySelector('.article-page-root') as HTMLElement | null;
    if (!root) return;
    root.style.setProperty('--article-text-scale', String(STEPS[index]));
    if (!settled.current) {
      settled.current = true;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, String(index));
    } catch {
      // A reader with site data blocked still gets the size they picked for
      // this page; it simply will not follow them to the next one.
    }
  }, [index]);

  const step = useCallback((delta: number) => {
    setIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)));
  }, []);

  return (
    <div className="article-text-size" role="group" aria-label="Text size">
      <Type className="article-text-size__icon h-3.5 w-3.5" aria-hidden />
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={index === 0}
        aria-label="Decrease text size"
        className="article-text-size__btn"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      {/* The current step, so the control says where the reader is rather than
          only offering to change it. */}
      <span className="article-text-size__level" aria-live="polite">
        {index + 1}/{STEPS.length}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={index === STEPS.length - 1}
        aria-label="Increase text size"
        className="article-text-size__btn"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
