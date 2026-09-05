/**
 * Money for the tariff engine: integer paisa, never a float.
 *
 * `0.1 + 0.2 !== 0.3` is a curiosity in most of this codebase and a defect
 * here, because the output of this module is what a reader will hold against
 * their own bill. Every amount below is an integer count of paisa (1 Taka =
 * 100 paisa) and every rate is an integer paisa-per-unit, so the whole energy
 * charge is integer multiplication with no rounding at all.
 *
 * Rounding happens in exactly one place — `paisaTimesQuantity`, used only for
 * the demand charge, where the quantity (sanctioned load in kW) may be
 * fractional. It rounds half away from zero, which is what "round half up" means
 * for the positive amounts a bill contains, and it is documented on the
 * component's `working` string so a reader can see it happened.
 *
 * Consumption is required to be a whole number of units. That is not a
 * simplification: BERC's slabs are expressed in whole units ("০-৫০ ইউনিট"),
 * meters read in whole units, and accepting 50.5 kWh would invite a rounding
 * question the instruments do not answer.
 */

/** An integer count of paisa. 463 is Tk 4.63. */
export type Paisa = number;

export function isPaisa(n: unknown): n is Paisa {
  return typeof n === 'number' && Number.isSafeInteger(n);
}

/** Tk 4.63 → 463. For reading rule files and writing tests, never for arithmetic. */
export function takaToPaisa(taka: number): Paisa {
  // The instruments quote at most two decimals. Scaling by 100 and rounding
  // absorbs the representation error in a literal like 15.01 without pretending
  // to more precision than the document has.
  return Math.round(taka * 100);
}

/** 463 → "4.63". Always two decimals; a bill that prints "Tk 4.6" looks wrong. */
export function formatTaka(p: Paisa): string {
  const sign = p < 0 ? '-' : '';
  const abs = Math.abs(p);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Exact: rate in paisa × a whole number of units. No rounding is possible. */
export function paisaTimesUnits(rate: Paisa, units: number): Paisa {
  if (!Number.isSafeInteger(units)) {
    throw new RangeError(`paisaTimesUnits expects whole units, received ${units}`);
  }
  return rate * units;
}

/**
 * Rate in paisa × a possibly-fractional quantity, rounded half away from zero.
 *
 * The quantity is taken to three decimals — enough for a sanctioned load like
 * 7.5 kW and more than any instrument states — and converted to an integer
 * before multiplying, so the float only ever appears in the caller's literal.
 */
export function paisaTimesQuantity(rate: Paisa, quantity: number): Paisa {
  if (!Number.isFinite(quantity)) {
    throw new RangeError(`paisaTimesQuantity expects a finite quantity, received ${quantity}`);
  }
  const milli = Math.round(quantity * 1000);
  const product = rate * milli;
  const sign = product < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(product) / 1000);
}

export function sumPaisa(amounts: readonly Paisa[]): Paisa {
  return amounts.reduce((a, b) => a + b, 0);
}

/**
 * Percentage change, to two decimals, or null when it would be meaningless.
 *
 * Mirrors `changeOf` in `lib/data/grid/comparison.ts`: a percentage against a
 * base of zero is not 100% and not Infinity, it is undefined, and the archive
 * has published a fabricated "-100%" from exactly this arithmetic before.
 */
export function percentChange(from: Paisa, to: Paisa): number | null {
  if (from === 0) return null;
  return Math.round(((to - from) / from) * 10000) / 100;
}
