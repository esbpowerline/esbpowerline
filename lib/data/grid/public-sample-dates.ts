/**
 * Days that are public to everyone regardless of tier, because the UI hands them
 * out as free samples. They sit outside the rolling visitor window, so without an
 * explicit allowlist the gate treats them like any other archive day and 403s the
 * very click that was meant to demo the product.
 *
 * Middleware and the components that offer the samples both read this list, so a
 * date can never be offered in the UI without also being served.
 */

/** Target of the "Try demo" button on every locked Grid Explorer panel. */
export const GRID_DEMO_DATE = '2026-06-22';

/** Free left-hand baseline in the Petrobangla archive comparison. */
export const COMPARE_FREE_BASELINE_DATE = '2024-07-02';

export const PUBLIC_SAMPLE_DATES: readonly string[] = [
  GRID_DEMO_DATE,
  COMPARE_FREE_BASELINE_DATE,
];

export function isPublicSampleDate(isoDate: string): boolean {
  return PUBLIC_SAMPLE_DATES.includes(isoDate);
}
