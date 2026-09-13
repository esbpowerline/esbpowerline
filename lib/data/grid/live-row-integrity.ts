/**
 * How NLDC's newest generation row stands against its own printed total.
 *
 * The homepage panel used to treat any row whose parts missed the total by
 * more than 1 MW as unreadable and hide all seven tiles that come off it. On
 * 2026-09-13 NLDC's 11:00 row printed 14,854 MW over parts summing to 14,584 —
 * every cell read correctly, the gap NLDC's own — and the panel showed Gen now,
 * Liquid and Hydro as "awaiting", which says nobody has published. NLDC had.
 * Doctrine rule 4 is the other way round: publish as filed, report the
 * discrepancy. So a row that misses by a margin a source slip can explain is
 * shown as filed and flagged; only a row too far off to be anything but a
 * misread is withheld.
 *
 * The line between the two is a share of the total, not a fixed MW. The worst
 * genuine slip on record is 1,000 MW on a 13,592 MW total (2026-08-29 16:00,
 * 7.4%); a column read into the wrong slot moves a whole fuel — gas or coal
 * alone is a third of the grid — which is far past 10%.
 */

export const GROSS_MISMATCH_SHARE = 0.1;

export type GenerationRowIntegrity =
  /** Parts equal the printed total within NLDC's own rounding. */
  | { state: 'consistent' }
  /** Shown as filed, flagged: NLDC's parts and total disagree by a slip's margin. */
  | { state: 'inconsistent'; totalMw: number; partsMw: number; gapMw: number }
  /** Withheld: too far from its own total to be read as NLDC published it. */
  | { state: 'unusable'; totalMw: number; partsMw: number | null; gapMw: number | null };

type RowLike = {
  totalMw: number;
  byFuel: {
    gasMw: number | null;
    liquidMw: number | null;
    coalMw: number | null;
    hydroMw: number | null;
    solarMw: number | null;
    windMw: number | null;
  };
  imports: { totalMw: number | null };
};

/**
 * The same parts the parser reconciles over (`buildLiveGridSnapshot`): every
 * fuel column plus the imports total, counting only the cells NLDC reported.
 */
export function reportedPartsMw(row: RowLike): number | null {
  const f = row.byFuel;
  const parts = [f.gasMw, f.liquidMw, f.coalMw, f.hydroMw, f.solarMw, f.windMw, row.imports.totalMw].filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
}

export function generationRowIntegrity(live: {
  latest: RowLike;
  reconciles?: boolean;
  componentSumMw?: number | null;
}): GenerationRowIntegrity {
  if (live.reconciles !== false) return { state: 'consistent' };
  const totalMw = live.latest.totalMw;
  // Prefer the server's own sum; recompute for a cached response that predates it.
  const partsMw = live.componentSumMw ?? reportedPartsMw(live.latest);
  if (partsMw === null || !Number.isFinite(totalMw) || totalMw <= 0) {
    return { state: 'unusable', totalMw, partsMw, gapMw: null };
  }
  const gapMw = totalMw - partsMw;
  if (Math.abs(gapMw) <= 1) return { state: 'consistent' };
  return Math.abs(gapMw) / totalMw > GROSS_MISMATCH_SHARE
    ? { state: 'unusable', totalMw, partsMw, gapMw }
    : { state: 'inconsistent', totalMw, partsMw, gapMw };
}
