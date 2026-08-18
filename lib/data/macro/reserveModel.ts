/**
 * The gas-reserve depletion model, as built by scripts/build_reserve_model.py.
 *
 * Two published quantities, joined field by field: Petrobangla's own field-wise
 * reserve statement (how much is left in each field, stated for 1 July 2025)
 * and this archive's daily production reports (how fast each field is actually
 * emptying). Nothing here is a scenario anyone invented — the numbers come from
 * a table Petrobangla prints and a series it publishes every morning.
 *
 * The two forward paths are not "optimistic" and "pessimistic". They are the
 * two ways of resolving a genuine disagreement between those inputs: the
 * booked 2P reserves cannot support the production the fields are currently on
 * track to deliver, so either output falls faster than it has been (reserves
 * binding) or reserves get revised up (decline binding). The gap between them
 * is the honest uncertainty, and both ends are sourced.
 */

export interface ReserveAnchor {
  as_of: string;
  document: string;
  producing_remaining_bcf: number;
  producing_cumulative_bcf: number;
  recoverable_2p_bcf: number;
}

export interface ReserveValidationRow {
  fiscal_year: string;
  window: [string, string];
  published_production_bcf: number;
  measured_production_bcf: number;
  difference_bcf: number;
  difference_pct: number;
  published_source: string;
}

export interface ReserveRevisionRow {
  from: string;
  to: string;
  reserve_revision_bcf: number;
  production_bcf: number;
  net_change_in_remaining_bcf: number;
  /** Reserves added against reserves produced. Below 100% is depletion. */
  reserve_replacement_pct: number | null;
}

export type DeclineBasis =
  | 'exponential-fit'
  | 'flat-or-rising-held-flat'
  | 'fit-too-weak-held-flat'
  | 'insufficient-history';

export interface ReserveField {
  field: string;
  section: 'producing' | 'non_producing' | 'production_suspended';
  discovery_year: number;
  estimated_by: string;
  estimate_year: number;
  recoverable_2p_bcf: number;
  published_cumulative_bcf: number;
  published_remaining_bcf: number | null;
  measured_drawn_since_anchor_bcf: number;
  remaining_now_bcf: number;
  rate_now_mmcfd: number;
  share_of_national_pct: number;
  decline_pct_yr: number;
  decline_r2: number | null;
  decline_basis: DeclineBasis;
  months_fitted: number;
  beyond_published_reserve: boolean;
  years_left_at_current_rate: number | null;
  decline_required_by_2p_pct_yr: number | null;
  implied_recovery_at_measured_decline_bcf: number | null;
  implied_revision_bcf: number | null;
}

export interface ReserveTrajectoryPoint {
  m: number;
  rate: number;
  left: number;
  over?: number;
}

export interface ReserveProfile {
  /** Named wedges, largest first, with an aggregate in the last slot. */
  fields: string[];
  named_share_pct: number;
  history: { month: string; v: number[] }[];
  forecast: { m: number; v: number[] }[];
  basis: string;
}

export interface ReserveSupplyMixRow {
  year: string;
  days: number;
  domestic_mmcfd: number;
  rlng_mmcfd: number;
  import_share_pct: number | null;
}

/** A one-month collapse that reverses — demand or an outage, never depletion. */
export interface ReserveAnomaly {
  month: string;
  mmcfd: number;
  baseline_mmcfd: number;
  drop_pct: number;
  recovered_by: string;
  reading: string;
}

export interface ReserveReplacement {
  today_domestic_mmcfd: number;
  today_rlng_mmcfd: number | null;
  today_import_share_pct: number | null;
  gap_5y_mmcfd: { reserves_binding: number; decline_binding: number };
  gap_10y_mmcfd: { reserves_binding: number; decline_binding: number };
  note: string;
}

export interface ReserveModel {
  as_of: string;
  archive_days: number;
  anchor: {
    as_of: string;
    document: string;
    table: string;
    pages: number[];
    producing_remaining_bcf: number;
    non_producing_remaining_bcf: number;
    suspended_remaining_bcf: number;
    grand_total_remaining_bcf: number;
    initial_recoverable_2p_bcf: number;
    cumulative_produced_bcf: number;
  };
  validation: ReserveValidationRow[];
  revisions: ReserveRevisionRow[];
  now: {
    national_rate_mmcfd: number;
    producing_remaining_bcf: number;
    producing_remaining_tcf: number;
    drawn_since_anchor_bcf: number;
    rate_from_fields_beyond_published_reserve_mmcfd: number;
    produced_beyond_published_reserve_bcf: number;
  };
  history: {
    monthly_rate: { month: string; mmcfd: number; days: number }[];
    anchors: ReserveAnchor[];
  };
  fields: ReserveField[];
  profile: ReserveProfile;
  supply_mix: ReserveSupplyMixRow[];
  anomalies: ReserveAnomaly[];
  replacement: ReserveReplacement;
  reserve_pools_bcf: {
    producing_now: number;
    discovered_undeveloped: number;
    production_suspended: number;
  };
  trajectory: {
    step: string;
    reserves_binding: ReserveTrajectoryPoint[];
    decline_binding: ReserveTrajectoryPoint[];
    flat: ReserveTrajectoryPoint[];
  };
  headline: {
    years_at_current_rate_no_decline: number | null;
    years_until_rate_halves: number | null;
    years_until_rate_is_a_tenth: number | null;
    years_until_half_the_reserve_is_gone: number | null;
    rate_in_5_years_mmcfd: number;
    rate_in_10_years_mmcfd: number;
    recovered_in_10_years_bcf: number;
    rate_in_5_years_at_measured_decline_mmcfd: number;
    rate_in_10_years_at_measured_decline_mmcfd: number;
    unbooked_gas_needed_by_10_years_bcf: number;
    reserve_replacement_pct_latest: number | null;
    reserve_replacement_window: string | null;
    new_gas_needed_to_hold_flat_10y_bcf: number;
  };
  method: {
    decline: string;
    flat_or_rising: string;
    economic_limit_mmcfd: number;
    not_modelled: string[];
  };
}

/**
 * The sensitivity run — how far the projection moves when the five modelling
 * choices are varied one at a time. Built by scripts/reserve_sensitivity.py.
 *
 * It exists to answer the only fair question about a published forecast: not
 * "is it tuned" — nothing here is fitted to a target — but "how much of this
 * is your choices rather than the data". The answer belongs on the page next
 * to the projection, not in a footnote nobody reads.
 */
export interface ReserveSensitivityCase {
  y5: number;
  y10: number;
  y15: number;
  halves_in: number | null;
}

export interface ReserveSensitivity {
  as_of: string;
  rate_now_mmcfd: number;
  base: { reserves: ReserveSensitivityCase; decline: ReserveSensitivityCase };
  variants: {
    variant: string;
    note: string;
    reserves: ReserveSensitivityCase;
    decline: ReserveSensitivityCase;
  }[];
  spread: { y5: [number, number]; y10: [number, number]; y5_pct: number; y10_pct: number };
}

/**
 * Paths relative to `public/data`. Readers pass these to `fetchDataJson`, which
 * picks the published copy over the file that shipped with the build — a rerun
 * of the model published from the admin panel used to need a redeploy to show.
 */
export const RESERVE_MODEL_PATH = 'petrobangla/reserve-model.json';
export const RESERVE_SENSITIVITY_PATH = 'petrobangla/reserve-sensitivity.json';

export const RESERVE_MODEL_URL = `/data/${RESERVE_MODEL_PATH}`;
export const RESERVE_SENSITIVITY_URL = `/data/${RESERVE_SENSITIVITY_PATH}`;

/** Fractional year of an ISO date, for placing a point on a year axis. */
export function fractionalYear(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const start = Date.UTC(y, 0, 1);
  const at = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  return y + (at - start) / 86_400_000 / 365.25;
}

/** Calendar year (fractional) of a trajectory point, `m` months after as-of. */
export function pointYear(model: ReserveModel, p: ReserveTrajectoryPoint): number {
  return fractionalYear(model.as_of) + p.m / 12;
}

/**
 * The measured history of the reserve balance, one point per published anchor
 * plus the archive-integrated position today.
 *
 * Deliberately not a continuous line back to 2020: between statements the
 * balance moves for two different reasons — gas produced, which this archive
 * measures, and reserves re-estimated, which nobody can measure from outside —
 * so drawing a smooth curve through the anchors would assert that the second
 * did not happen. It did: 2P was revised up 944 BCF in FY2023-24, more than
 * that year's production.
 */
export function reserveHistoryPoints(model: ReserveModel) {
  const anchors = model.history.anchors.map((a) => ({
    year: fractionalYear(a.as_of),
    bcf: a.producing_remaining_bcf,
    label: a.as_of,
    document: a.document,
    kind: 'published' as const,
  }));
  return [
    ...anchors,
    {
      year: fractionalYear(model.as_of),
      bcf: model.now.producing_remaining_bcf,
      label: model.as_of,
      document: 'Latest anchor less production measured in this archive',
      kind: 'measured' as const,
    },
  ];
}

export function formatTcf(bcf: number): string {
  return (bcf / 1000).toFixed(2);
}

/** "in 4.4 years" → the calendar year it lands in, for prose. */
export function yearOf(model: ReserveModel, yearsOut: number | null): number | null {
  if (yearsOut == null) return null;
  return Math.round(fractionalYear(model.as_of) + yearsOut);
}
