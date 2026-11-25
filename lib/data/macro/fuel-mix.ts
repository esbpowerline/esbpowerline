/**
 * The base a monthly fuel-mix share is a share OF: the sum of the month's fuel
 * rows, imports included.
 *
 * Macro Trends divided each slice by `total_net_generation` — PGCB's "Total Net
 * Generation (Excluding Import)" — while the slices include the import row, so
 * August 2026 summed to 118.5% (10,792.7 of slices over 9,111.0) and the donut
 * centre printed 9,111 under a ring that drew 10,793. The fuel rows also sum ~38
 * above that total before imports, so this is the sum of the rows, not net +
 * imports re-derived. Negative or missing rows add nothing.
 */
export function fuelMixTotal(generationByFuel: object | null | undefined): number {
  return Object.values(generationByFuel ?? {}).reduce((sum: number, v: unknown) => sum + (typeof v === "number" && v > 0 ? v : 0), 0);
}

/** `part` as a percentage of `total`; 0 when there is no total to divide by. */
export function sharePct(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}
