export interface SredaRenewableItem {
  tech: string;
  capacity: number;
  share: number;
  iconName: 'Sun' | 'Droplet' | 'Globe' | 'Activity' | 'Database';
}

/** SREDA renewable capacity registry (MW) — static fallback; live data in public/data/sreda/daily/. */
export const sredaRenewablesData: SredaRenewableItem[] = [
  { tech: 'Solar PV', capacity: 1512.75, share: 83.77, iconName: 'Sun' },
  { tech: 'Hydroelectric', capacity: 230.0, share: 12.74, iconName: 'Droplet' },
  { tech: 'Wind Energy', capacity: 62.0, share: 3.43, iconName: 'Globe' },
  { tech: 'Biogas Power', capacity: 0.69, share: 0.04, iconName: 'Activity' },
  { tech: 'Biomass Energy', capacity: 0.40, share: 0.02, iconName: 'Database' },
];

export const totalCapacityRenewables = 1805.84;

/** Total national installed grid capacity (MW) — matches the "National at a Glance" figure. */
export const NATIONAL_INSTALLED_CAPACITY_MW = 33092;

/** Renewables as a share of total national installed capacity (%). */
export const renewableGridSharePct =
  (totalCapacityRenewables / NATIONAL_INSTALLED_CAPACITY_MW) * 100;