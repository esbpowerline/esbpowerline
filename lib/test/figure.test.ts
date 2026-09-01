import { describe, it, expect } from 'vitest';
import {
  awaiting,
  combine,
  difference,
  fromNullable,
  known,
  knownValues,
  mapFigure,
  peak,
  renderFigure,
  total,
  valueOrNull,
  type Figure,
} from '@/lib/data/grid/figure';

/**
 * The charter, as arithmetic.
 *
 * Every case here is one the codebase actually got wrong somewhere: a zero
 * standing in for a gap, a conversion applied to nothing, a percentage
 * computed against an absent baseline. The type stops most of these at compile
 * time; these assert the runtime behaviour of the parts that still have to be
 * decided at runtime.
 */
describe('Figure', () => {
  it('treats a published zero as a figure, because it is one', () => {
    // PGCB prints 0 on an hour it served everything, and HSD sits at 0 most
    // days. Those are measurements, not gaps.
    const zero = fromNullable(0, 'PGCB');
    expect(zero.known).toBe(true);
    expect(valueOrNull(zero)).toBe(0);
  });

  it('treats null, undefined and NaN as absent, with a publisher named', () => {
    for (const v of [null, undefined, NaN]) {
      const f = fromNullable(v as number | null, 'Petrobangla');
      expect(f.known).toBe(false);
      if (!f.known) expect(f.awaiting).toBe('Petrobangla');
    }
  });

  it('carries absence through a unit conversion instead of converting zero', () => {
    // `gwhToAvgMw(null ?? 0)` is 0 MW — a claim the country generated nothing.
    const absent = mapFigure(awaiting('PGCB'), (gwh) => Math.round((gwh * 1000) / 24));
    expect(absent.known).toBe(false);
    expect(valueOrNull(absent)).toBeNull();

    expect(valueOrNull(mapFigure(known(354.94), (gwh) => Math.round((gwh * 1000) / 24)))).toBe(14789);
  });

  it('refuses to compute across a gap, and keeps the publisher owed', () => {
    // The comparison engine's rule: a change between a figure and a gap is not
    // 0%, not 100%, and not a dash with a green arrow. It does not exist.
    const pct = combine(known(1200), awaiting('SREDA'), (a, b) => ((a - b) / b) * 100);
    expect(pct.known).toBe(false);
    if (!pct.known) expect(pct.awaiting).toBe('SREDA');
  });

  it('reports a forecast as a signed difference and never a grade', () => {
    const d = difference(known(15829), known(16080));
    expect(valueOrNull(d)).toBe(-251);
    expect(valueOrNull(difference(known(15829), awaiting('PGCB')))).toBeNull();
  });

  it('peaks over the stated hours only', () => {
    // A day where every hour is unstated has no peak. A day that states 0 for
    // every hour genuinely peaked at 0. `?? 0` could not tell these apart.
    const unstated: Figure[] = [awaiting('PGCB'), awaiting('PGCB')];
    expect(peak(unstated, 'PGCB').known).toBe(false);

    const allZero = [known(0), known(0)];
    expect(valueOrNull(peak(allZero, 'PGCB'))).toBe(0);

    const mixed = [known(412), awaiting('PGCB'), known(981)];
    expect(valueOrNull(peak(mixed, 'PGCB'))).toBe(981);
  });

  it('totals the stated figures, and is absent when nothing was stated', () => {
    expect(valueOrNull(total([known(902), known(1490), known(178)], 'PGCB'))).toBe(2570);
    expect(total([], 'PGCB').known).toBe(false);
    expect(total([awaiting('PGCB')], 'PGCB').known).toBe(false);
  });

  it('collects only the known values', () => {
    expect(knownValues([known(1), awaiting('PGCB'), known(3)])).toEqual([1, 3]);
  });

  it('cannot be rendered without deciding what absence looks like', () => {
    // `renderFigure` has no default branch — that is the design. The caller
    // states, at the point of display, what a gap prints as.
    const shown = renderFigure(awaiting('Petrobangla'), {
      known: (v) => `${v} MMcfd`,
      absent: (who) => `awaiting ${who}`,
    });
    expect(shown).toBe('awaiting Petrobangla');

    expect(
      renderFigure(known(2388), { known: (v) => `${v} MMcfd`, absent: (w) => `awaiting ${w}` }),
    ).toBe('2388 MMcfd');
  });
});
