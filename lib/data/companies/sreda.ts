/**
 * SREDA renewable capacity — build-time fallback for the Overview KPI strip.
 *
 * The Renewables tab reads the dated snapshots in `public/data/sreda/daily/`
 * directly and does not use this file. These constants exist only so the
 * Overview strip renders a figure before any snapshot is fetched, so they must
 * be a faithful copy of a real SREDA publication rather than a rounded
 * approximation of one.
 *
 * Refreshed 2026-08-11 from SREDA's National Database of Renewable Energy,
 * "Technology wise Generation" (https://ndre.sreda.gov.bd/index.php?id=8),
 * SREDA last update 2026-08-09 13:57:56. The previous values (1,805.84 MW total,
 * a 33,092 MW national base) matched no SREDA page and carried no date.
 *
 * Capacity is MWp — peak DC, as SREDA reports it — while the national installed
 * capacity it is divided by is in MW. SREDA itself performs that division to
 * publish its 5.62% headline, so the share below reproduces SREDA's own
 * arithmetic rather than asserting the two units are interchangeable.
 */

export interface SredaRenewableItem {
  tech: string;
  capacity: number;
  share: number;
  iconName: 'Sun' | 'Droplet' | 'Globe' | 'Activity' | 'Database';
}

/**
 * Per-source totals, summed from SREDA's technology-wise rows. SREDA's own
 * Total row states 1823.572 MWp against the 1823.574 these sum to — a 0.002
 * rounding difference in the source, left as published.
 */
export const sredaRenewablesData: SredaRenewableItem[] = [
  { tech: 'Solar', capacity: 1530.484, share: 83.93, iconName: 'Sun' },
  { tech: 'Hydro', capacity: 230.0, share: 12.61, iconName: 'Droplet' },
  { tech: 'Wind', capacity: 62.0, share: 3.4, iconName: 'Globe' },
  { tech: 'Biogas', capacity: 0.69, share: 0.04, iconName: 'Activity' },
  { tech: 'Biomass', capacity: 0.4, share: 0.02, iconName: 'Database' },
];

/** SREDA's own published Total row (MWp). */
export const totalCapacityRenewables = 1823.572;

/** Total national installed capacity (MW), SREDA Electricity Generation Mix. */
export const NATIONAL_INSTALLED_CAPACITY_MW = 32474;

/**
 * Renewables as a share of national installed capacity (%).
 *
 * 1823.572 / 32474 = 5.615%, which SREDA publishes as 5.62%.
 */
export const renewableGridSharePct =
  (totalCapacityRenewables / NATIONAL_INSTALLED_CAPACITY_MW) * 100;

/** The SREDA publication these constants were copied from. */
export const SREDA_FALLBACK_AS_OF = '2026-08-09';
export const SREDA_FALLBACK_SOURCE_URL = 'https://ndre.sreda.gov.bd/index.php?id=8';
