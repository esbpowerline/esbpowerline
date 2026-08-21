'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { ArchiveIndex } from '@/lib/data/grid/archive-coverage';

/**
 * The panel's state, in the address bar.
 *
 * A comparison is a finding — "shedding is up 4,343% on the year" — and until
 * now the only way to pass one to someone was to tell them which four controls
 * to set. A link carries it, and a refresh no longer drops the editor back on
 * the default day.
 *
 * ## Two decisions worth stating
 *
 * **`replaceState`, not `pushState`.** Nudging a date is not navigation. Pushing
 * would put forty entries in the history for one afternoon's work and make the
 * back button useless for leaving the page, which is what an editor actually
 * wants it for. The cost is that back does not undo a date change; that is the
 * right trade for a filter surface.
 *
 * **Sections travel, metric picks do not.** Sections are nine short ids. The
 * metric list is 225 ids averaging 25 characters — 5.6 KB of URL, for a
 * selection the panel already discards whenever the sections change. A link
 * therefore reproduces the day, the mode, the language and the sections, and
 * opens with every metric shown. Encoding it silently only when it happened to
 * be short would make the link mean different things at different lengths,
 * which is worse than not carrying it.
 */

export type YoyUrlState = {
  mode: string;
  lang: string;
  /** Sheet mode. */
  date: string;
  /** Compare mode, and the monthly compare. */
  a: string;
  b: string;
  /** Daily range. */
  from: string;
  to: string;
  /** Monthly range. */
  ms: string;
  me: string;
  /** Monthly sub-view: `compare` or `range`. */
  view: string;
  /**
   * Sections, per vocabulary.
   *
   * The daily and monthly engines both have a `system` and a `regional`
   * section and agree on nothing else, so one shared key silently narrowed the
   * monthly picker to those two the moment an editor arrived from the daily
   * tab. Two keys, no overlap to reason about.
   */
  sections: string;
  msections: string;
};

const KEYS: Array<keyof YoyUrlState> = [
  'mode', 'lang', 'date', 'a', 'b', 'from', 'to', 'ms', 'me', 'view', 'sections', 'msections',
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function readSearch(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export type YoyUrl = {
  /**
   * Parsed once, at mount. Later writes must not feed back into the state that
   * produced them, so this is deliberately not reactive.
   */
  initial: Partial<YoyUrlState>;
  patch: (next: Partial<YoyUrlState>) => void;
  /** A validated ISO day, or the fallback. */
  day: (key: keyof YoyUrlState, fallback: string, accept?: (iso: string) => boolean) => string;
  month: (key: keyof YoyUrlState, fallback: string, archived: Set<string>) => string;
  /** A validated `a,b,c` list narrowed to ids that still exist. */
  list: <T extends string>(key: keyof YoyUrlState, fallback: T[], valid: readonly T[]) => T[];
  one: <T extends string>(key: keyof YoyUrlState, fallback: T, valid: readonly T[]) => T;
};

export function useYoyUrl(archive: ArchiveIndex): YoyUrl {
  const initial = useMemo(() => {
    const sp = readSearch();
    const out: Partial<YoyUrlState> = {};
    for (const k of KEYS) {
      const v = sp.get(k);
      if (v !== null) out[k] = v;
    }
    return out;
  }, []);

  // The last state written, so a patch of one field does not clear the others.
  const current = useRef<Partial<YoyUrlState>>({ ...initial });

  const patch = useCallback((next: Partial<YoyUrlState>) => {
    if (typeof window === 'undefined') return;
    current.current = { ...current.current, ...next };

    const sp = new URLSearchParams(window.location.search);
    for (const k of KEYS) {
      const v = current.current[k];
      // An empty value is an absent one: a `?a=` in the bar is noise, and it
      // would come back as '' and fail validation on the next read anyway.
      if (v === undefined || v === '') sp.delete(k);
      else sp.set(k, v);
    }

    const qs = sp.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (url === `${window.location.pathname}${window.location.search}`) return;
    window.history.replaceState(window.history.state, '', url);
  }, []);

  const day = useCallback<YoyUrl['day']>(
    (key, fallback, accept) => {
      const v = initial[key];
      if (!v || !ISO.test(v)) return fallback;
      // A day the archive does not hold cannot be shown, so a hand-edited or
      // stale link falls back rather than opening on an error.
      const ok = accept ? accept(v) : archive.has(v);
      return ok ? v : fallback;
    },
    [initial, archive],
  );

  const month = useCallback<YoyUrl['month']>(
    (key, fallback, archived) => {
      const v = initial[key];
      if (!v || !MONTH.test(v) || !archived.has(v)) return fallback;
      return v;
    },
    [initial],
  );

  const list = useCallback(
    <T extends string>(key: keyof YoyUrlState, fallback: T[], valid: readonly T[]): T[] => {
      const v = initial[key];
      if (v === undefined) return fallback;
      const allowed = new Set<string>(valid);
      const picked = v.split(',').filter((x) => allowed.has(x)) as T[];
      // An explicit empty list is a real state — no sections ticked — but a
      // list of nothing but unknown ids is a broken link, not a choice.
      return v === '' ? [] : picked.length ? picked : fallback;
    },
    [initial],
  );

  const one = useCallback(
    <T extends string>(key: keyof YoyUrlState, fallback: T, valid: readonly T[]): T => {
      const v = initial[key];
      return v && (valid as readonly string[]).includes(v) ? (v as T) : fallback;
    },
    [initial],
  );

  // Memoised so the object identity is stable. The modes list `url` in their
  // effect deps; a fresh object each render would re-run every one of those
  // effects on every render — harmless here, because a patch changes no state,
  // but only by accident.
  return useMemo(
    () => ({ initial, patch, day, month, list, one }),
    [initial, patch, day, month, list, one],
  );
}
