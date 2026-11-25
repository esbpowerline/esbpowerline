import { formatNumber } from '@/lib/utils';
import type { BorderImportItem } from './types';

/**
 * The interconnectors' summed peak flow, or null when any line states none.
 *
 * A line with no stated peak leaves the national figure unknown, not smaller:
 * adding up the lines that have one prints a partial total under the whole
 * total's label. 2018-01-21 is why this exists — a blank cell read as zero
 * printed "0 MW" beside 11.99 GWh of imports.
 */
export function sumPeakFlowMw(rows: readonly BorderImportItem[]): number | null {
  // P1's lines only. Their peaks are read at one hour -- P1's "Peak Hr Flow" --
  // while the Nepal row is the whole day's maximum off the En-Curve, so adding
  // it mixed two instants: 1,838 MW on 6 Nov 2026 against the 1,799.76 MW P1
  // prints for 18:00 under the same heading.
  const lines = rows.filter((r) => !isCurveDerivedImport(r));
  if (!lines.length || lines.some((r) => r.peakFlow == null)) return null;
  return lines.reduce((sum, r) => sum + (r.peakFlow ?? 0), 0);
}

/** The Nepal row: not in P1's interconnector block, computed from the En-Curve. */
export function isCurveDerivedImport(row: Pick<BorderImportItem, 'source'>): boolean {
  return /nepal/i.test(row.source);
}

/** `sumPeakFlowMw` for a table cell: whole megawatts, or a dash. */
export function formatPeakFlowTotal(rows: readonly BorderImportItem[]): string {
  const total = sumPeakFlowMw(rows);
  return total == null ? '—' : formatNumber(Math.round(total));
}
