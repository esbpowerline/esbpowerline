import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The rounding bound in `verify-source.mjs`, and why it is not a fudge.
 *
 * Two days — 2026-08-08 and 2026-08-09 — carried an `INDICATOR` verdict, the
 * most serious in the ledger, meaning "a published figure disagrees with its
 * source, fix now". Both deltas were exactly 0.1 MMCFD against totals near
 * 2,350: four thousandths of a percent, on a figure every card renders as a
 * whole number.
 *
 * They were not misreads. Petrobangla prints each company row to one decimal,
 * so each carries up to 0.05 of rounding; six rows compound to 0.3, and
 * `gasDomestic` inherits seven roundings at 0.35. Two correct sums of the same
 * rounded inputs can legally land that far apart. The old flat 0.05 could not
 * express that, so the check reported arithmetic as a data fault.
 *
 * The danger in widening any tolerance is that it stops catching what it was
 * for. These assert both halves: the noise clears, and a misread does not.
 */

const SOURCE = readFileSync(path.join(process.cwd(), 'scripts', 'verify-source.mjs'), 'utf8');

/** Mirrors `toleranceFor` in the script. Kept in step by the guard below. */
const DERIVED_TERMS: Record<string, number> = {
  gasTotalProduction: 6,
  gasDomestic: 7,
  gasLng: 1,
};
const EPS_ABS = 0.05;
const HALF_STEP = 0.05;

const toleranceFor = (p: string) => (DERIVED_TERMS[p] ? DERIVED_TERMS[p] * HALF_STEP : EPS_ABS);
const agrees = (p: string, a: number, b: number) => Math.abs(a - b) <= toleranceFor(p);

describe('verify:source rounding bound', () => {
  it('clears the two INDICATOR days that were arithmetic, not error', () => {
    // The exact figures from verification/source-ledger.json.
    expect(agrees('gasTotalProduction', 2353, 2352.9)).toBe(true);
    expect(agrees('gasDomestic', 1623.5, 1623.4)).toBe(true);
    expect(agrees('gasTotalProduction', 2375, 2374.9)).toBe(true);
    expect(agrees('gasDomestic', 1626, 1625.9)).toBe(true);
  });

  it('still catches a misread digit', () => {
    // A wrong digit in any row moves the total by at least 0.1 there and
    // normally far more. Nothing at or above the printed step gets through.
    expect(agrees('gasTotalProduction', 2353, 2352.0)).toBe(false);
    expect(agrees('gasTotalProduction', 2353, 2352.6)).toBe(false);
    expect(agrees('gasDomestic', 1623.5, 1623.0)).toBe(false);
    expect(agrees('gasTotalProduction', 2353, 2453)).toBe(false);
  });

  it('leaves figures read straight off the sheet on the tight epsilon', () => {
    // Only derived sums get the compounding allowance. A peak demand is one
    // printed number and has no rounding to compound.
    expect(toleranceFor('eveningPeakDemand')).toBe(EPS_ABS);
    expect(agrees('eveningPeakDemand', 16740, 16740.1)).toBe(false);
  });

  it('the bound is never wider than the arithmetic justifies', () => {
    // A guard against the tolerance quietly growing later: six one-decimal
    // rows cannot compound past 0.3, whatever anyone needs it to do.
    for (const [indicator, terms] of Object.entries(DERIVED_TERMS)) {
      expect(toleranceFor(indicator), indicator).toBeLessThanOrEqual(terms * HALF_STEP);
      expect(toleranceFor(indicator), indicator).toBeLessThan(0.5);
    }
  });

  it('stays in step with the script it mirrors', () => {
    // This file restates the rule; if the script's numbers move, it must too.
    expect(SOURCE).toContain('const PRINTED_STEP_MMCFD = 0.1;');
    for (const [indicator, terms] of Object.entries(DERIVED_TERMS)) {
      expect(SOURCE).toMatch(new RegExp(`${indicator}:\\s*${terms}`));
    }
  });
});
