import { describe, it, expect } from 'vitest';
import { changeOf } from '@/lib/data/grid/comparison';

/**
 * The comparison engine's absence rule, pinned.
 *
 * F-15 proposed migrating this engine onto the `Figure` type so that "the
 * comparison engine cannot produce a percentage from a gap". Auditing it to do
 * that found it already cannot: `changeOf` refuses on either side being null,
 * refuses a percentage against a zero base, and — better than a bare type would
 * manage — says *which* day is missing.
 *
 * So the engine was left as it is and the contract was pinned here instead.
 * Rewriting 900 lines of correct, heavily-reasoned code to obtain a guarantee
 * it already provides would have been risk without a benefit; what it lacked
 * was a test holding the guarantee in place, which is this file.
 */
describe('changeOf — the rule that stops a gap becoming a number', () => {
  it('produces a change when both days published', () => {
    expect(changeOf(100, 125)).toEqual({ delta: 25, pct: 25, note: undefined });
    expect(changeOf(200, 150)).toEqual({ delta: -50, pct: -25, note: undefined });
  });

  it('refuses when the first day did not publish, and says so', () => {
    const r = changeOf(null, 125);
    expect(r.delta).toBeNull();
    expect(r.pct).toBeNull();
    expect(r.note).toBe('not published on the first day');
  });

  it('refuses when the second day did not publish, and says so', () => {
    const r = changeOf(100, null);
    expect(r.delta).toBeNull();
    expect(r.pct).toBeNull();
    expect(r.note).toBe('not published on the second day');
  });

  it('refuses when neither published', () => {
    expect(changeOf(null, null).note).toBe('neither day publishes this');
  });

  it('gives a delta but no percentage against a zero base', () => {
    // A percentage against zero is infinite, not 100%. The delta is still a
    // fact and is still reported — it is only the ratio that has no meaning.
    const r = changeOf(0, 40);
    expect(r.delta).toBe(40);
    expect(r.pct).toBeNull();
    expect(r.note).toBe('no percentage — the base is zero');
  });

  it('treats a true zero on the second day as a measurement, not a gap', () => {
    // Load shedding falling to zero is a real and important outcome. It must
    // not be confused with a day that published nothing.
    const r = changeOf(500, 0);
    expect(r.delta).toBe(-500);
    expect(r.pct).toBe(-100);
    expect(r.note).toBeUndefined();
  });

  it('never manufactures the headline the doctrine exists to prevent', () => {
    // "Average production cost fell 100%" — what reading a stored zero as a
    // measurement produces against any ordinary day. 46 days carry a zero
    // average production cost; `positiveOrNull` turns those into null upstream,
    // and this is what null then does.
    for (const [a, b] of [
      [null, 0],
      [0, null],
      [null, null],
    ] as Array<[number | null, number | null]>) {
      const r = changeOf(a, b);
      expect(r.pct, `${a} -> ${b} produced a percentage`).toBeNull();
      expect(r.delta, `${a} -> ${b} produced a delta`).toBeNull();
    }
  });
});
