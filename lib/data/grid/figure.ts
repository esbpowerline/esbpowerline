/**
 * A figure that may not exist — as a type, not as a convention.
 *
 * The charter says a number the source did not publish is absent, never zero.
 * That rule is written down clearly in this codebase, in `types.ts`, in
 * `chart-palette.ts`, in the parsers, in the tile comments. It held wherever
 * the author was looking and failed forty lines away: the snapshot builder
 * coerced five absent figures to zero, the homepage rendered a specimen 16,740
 * MW under a LIVE badge, and the admin form seeded invented commodity prices.
 * Every one of those was a violation of a rule the file itself stated.
 *
 * `number | null` is the shape that invited it. It is one keystroke from
 * `?? 0`, and `?? 0` type-checks, reads as defensive, and silently asserts
 * that the country generated nothing.
 *
 * A `Figure` cannot be used as a number without deciding what absence means:
 *
 *     const mw = figure.value;          // does not compile
 *     const mw = figure ?? 0;           // does not compile
 *     if (figure.known) figure.value;   // compiles — the check is the door
 *
 * and it cannot be absent without naming who owes it, so a tile can always say
 * what it is waiting for.
 */

/** Who publishes a figure. Absence is always attributable to one of these. */
export type Publisher = 'PGCB' | 'Petrobangla' | 'SREDA' | 'BPDB' | 'BERC' | 'NLDC';

export type Figure =
  | { readonly known: true; readonly value: number }
  | { readonly known: false; readonly awaiting: Publisher };

/** A figure the source published. `0` is a perfectly good known value. */
export function known(value: number): Figure {
  return { known: true, value };
}

/** A figure nobody has published, and the publisher who would. */
export function awaiting(publisher: Publisher): Figure {
  return { known: false, awaiting: publisher };
}

/**
 * Lift a nullable reading from a parser into a `Figure`.
 *
 * The boundary function. Parsers legitimately produce `number | null` because
 * that is what reading a spreadsheet cell yields; this is where that stops
 * being ambiguous. Note that `0` stays known — PGCB prints 0 on an hour it
 * served everything, and that is a measurement.
 */
export function fromNullable(value: number | null | undefined, publisher: Publisher): Figure {
  return typeof value === 'number' && Number.isFinite(value)
    ? { known: true, value }
    : { known: false, awaiting: publisher };
}

/** The number, or `null` — for the render boundary, which has to print something. */
export function valueOrNull(figure: Figure): number | null {
  return figure.known ? figure.value : null;
}

/** The publisher owed, or `undefined` when the figure is present. */
export function awaitingPublisher(figure: Figure): Publisher | undefined {
  return figure.known ? undefined : figure.awaiting;
}

/**
 * Apply a conversion, carrying absence through untouched.
 *
 * `gwhToAvgMw(x)` on an absent figure is not `0`; it is still absent, still
 * owed by the same publisher. Every unit conversion in the pipeline should go
 * through here rather than unwrapping first.
 */
export function mapFigure(figure: Figure, fn: (value: number) => number): Figure {
  return figure.known ? { known: true, value: fn(figure.value) } : figure;
}

/**
 * Combine two figures. Absent on either side is absent in the result — and it
 * keeps the *first* absent publisher, because that is the one the reader needs
 * to chase.
 *
 * This is the rule the comparison engine most needs: a percentage change
 * between a known figure and a gap is not 0%, not 100%, and not "—" with a
 * green arrow beside it. It does not exist.
 */
export function combine(a: Figure, b: Figure, fn: (a: number, b: number) => number): Figure {
  if (!a.known) return a;
  if (!b.known) return b;
  return { known: true, value: fn(a.value, b.value) };
}

/**
 * The signed difference between two figures — never a grade.
 *
 * Named rather than left to `combine` because the doctrine is specific here:
 * a forecast is reported against an actual as a signed difference, and the
 * codebase deliberately does not score it.
 */
export function difference(actual: Figure, reference: Figure): Figure {
  return combine(actual, reference, (a, b) => a - b);
}

/** True when every figure in the set is known — for a chart that needs a full row. */
export function allKnown(figures: readonly Figure[]): boolean {
  return figures.every((f) => f.known);
}

/** The known values only, for a sum or a max that tolerates gaps. */
export function knownValues(figures: readonly Figure[]): number[] {
  return figures.filter((f): f is Extract<Figure, { known: true }> => f.known).map((f) => f.value);
}

/**
 * Peak of the stated figures, or absent when none was stated.
 *
 * The shape `peakLoadShedMw` needed: an hour with no published shedding is not
 * an hour with zero shedding, so a day where every hour is unstated has no
 * peak at all — while a day that states 0 for every hour genuinely peaked at 0.
 */
export function peak(figures: readonly Figure[], publisher: Publisher): Figure {
  const stated = knownValues(figures);
  return stated.length ? { known: true, value: Math.max(...stated) } : { known: false, awaiting: publisher };
}

/** Sum of the stated figures, absent when none was stated. */
export function total(figures: readonly Figure[], publisher: Publisher): Figure {
  const stated = knownValues(figures);
  return stated.length ? { known: true, value: stated.reduce((a, b) => a + b, 0) } : { known: false, awaiting: publisher };
}

/**
 * Render a figure, having been told what absence looks like.
 *
 * There is no default. A caller that wants to print a figure must supply the
 * absent branch, which is the whole point: the decision is made once, visibly,
 * at the place it is displayed.
 */
export function renderFigure<T>(
  figure: Figure,
  render: { known: (value: number) => T; absent: (publisher: Publisher) => T },
): T {
  return figure.known ? render.known(figure.value) : render.absent(figure.awaiting);
}
