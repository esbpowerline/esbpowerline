import type { GridSystemStats } from '@/lib/data/grid/types';

/**
 * PGCB printed the same evening-peak figure for demand and generation, at the
 * same instant — its way of saying no load was shed at the peak, so demand was
 * whatever was supplied.
 *
 * Readers took the matching tiles for a glitch. From 13 Nov 2026 they matched
 * every day (13,564.41 / 13,564.41 at 18:30 on the 14th, Energy Unserved 0),
 * where through the summer shedding at the peak kept them hundreds of MW
 * apart. Checked against P1 on 13 workbooks from 7 Oct to 23 Nov: every equal
 * day shows 0 MW shed at the peak hour in P4. The figures are PGCB's; this only
 * names what the equality means.
 */
export function peakDemandEqualsGeneration(
  s: Pick<GridSystemStats, 'eveningPeakDemand' | 'eveningPeakGen' | 'peakTimes'> | null | undefined,
): boolean {
  if (!s || s.eveningPeakDemand == null || s.eveningPeakGen == null) return false;
  if (Math.abs(s.eveningPeakDemand - s.eveningPeakGen) >= 0.005) return false;
  return (s.peakTimes?.eveningPeakDemand ?? null) === (s.peakTimes?.eveningPeakGen ?? null);
}

/** Tile line, kept short enough for a KPI hint. */
export const PEAK_SERVED_HINT = 'equals generation · no shed at peak';

/** Briefing sentence. */
export const PEAK_SERVED_NOTE =
  'PGCB printed the same figure for evening-peak demand and generation: no load was shed at the peak, so demand equalled what was supplied. This is the report, not a gap in it.';
