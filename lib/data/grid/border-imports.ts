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
  if (rows.some((r) => r.peakFlow == null)) return null;
  return rows.reduce((sum, r) => sum + (r.peakFlow ?? 0), 0);
}

/** `sumPeakFlowMw` for a table cell: whole megawatts, or a dash. */
export function formatPeakFlowTotal(rows: readonly BorderImportItem[]): string {
  const total = sumPeakFlowMw(rows);
  return total == null ? '—' : formatNumber(Math.round(total));
}
