import { isDateAllowedForTier, type GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import { isPublicSampleDate } from '@/lib/data/grid/public-sample-dates';

/**
 * Which days this browser should bother to ask the server for.
 *
 * The tier gate is enforced by the server (middleware.ts) and stays the only
 * authority: a request for a day outside the reader's window is answered 403
 * there whatever this file says. What this file does is stop the browser
 * sending those requests in the first place. Measured on production
 * (2026-11-02, Phase 3 baseline 4.3): one date change sent about eight 403s -
 * the Overview's seven-day trend walk and the per-station file for days the
 * visitor's seven-day window does not cover - each of them twice.
 *
 * The client already knows the window: the explorer greys those days out and
 * locks the panel using the very same `isDateAllowedForTier`. This reuses
 * that answer; it never grants anything the explorer would not.
 *
 * While the session is still loading the tier is unknown, so only the visitor
 * window is requested (the explorer's own fetch effect does the same). Callers
 * must not remember a refusal from here as a result - the window widens once
 * the session resolves - and `subscribeDateGuard` lets them ask again.
 */
export type DateGuardInput = {
  /** True until the session has resolved. */
  loading: boolean;
  tier: GridAccessTier;
  /**
   * The newest day in the BUILD's catalog - what middleware.ts measures the
   * window from. Deliberately not the runtime-latest the explorer's own UI
   * uses: after a runtime publish that one is newer, its window starts later,
   * and the server would still serve days this guard refused. Mirroring the
   * server's anchor keeps this strictly no stricter than the server.
   */
  bundledLatest: string;
};

/**
 * Mirrors the public/tier branches of middleware.ts for a dated file. Where
 * the server would let a day through for a reason this does not model, the
 * answer here is also yes: it may only ever err towards asking.
 */
export function dateRequestable(isoDate: string, g: DateGuardInput): boolean {
  // Past the shipped archive: a just-published day, public at the server.
  if (isoDate > g.bundledLatest) return true;
  if (isPublicSampleDate(isoDate)) return true;
  return isDateAllowedForTier(isoDate, g.loading ? 'visitor' : g.tier, g.bundledLatest);
}

type Guard = (isoDate: string) => boolean;
let guard: Guard | null = null;
let version = 0;
const listeners = new Set<() => void>();

/** Registered by the explorer, which owns the session. Null clears it. */
export function setDateGuard(next: Guard | null): void {
  guard = next;
  version += 1;
  listeners.forEach((l) => l());
}

/** True when no guard is registered (other pages, tests) or the guard allows the day. */
export function isDateRequestable(isoDate: string): boolean {
  return guard ? guard(isoDate) : true;
}

export function subscribeDateGuard(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Changes whenever the window does; a dependency for effects that walk days. */
export function getDateGuardVersion(): number {
  return version;
}
