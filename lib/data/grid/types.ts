/** Shared TypeScript types for PGCB daily grid reports. */

export interface GridSystemStats {
  date: string;
  dayPeakGen: number;
  eveningPeakGen: number;
  dayPeakDemand: number | null;
  eveningPeakDemand: number;
  /**
   * The day's own generation extremes, as PGCB defines them: `maxGen` is the
   * peak of the daily load curve, `minGen` the 08:00 morning trough.
   * null where the source report states neither and carries no load curve —
   * chiefly days archived before 2018. Never inferred from another figure.
   */
  minGen: number | null;
  maxGen: number | null;
  totalEnergyGen: number;
  /**
   * All four are read from the source report, never inferred. null on layouts
   * that do not publish them — previously these were an estimate
   * (load-shed x 4 / 1000, generation + that, day peak + half the shedding)
   * and maxTemp was the constant 32.8 on every day in the archive.
   */
  totalEnergyUnserved: number | null;
  totalEnergyDemand: number | null;
  maxTemp: number | null;
  totalGasSuppliedPower: number;
  avgProductionCost: number;
  totalDailyCost: number;
}

export interface GridGenerationItem {
  name: string;
  gen: number;
  /** PGCB's published production cost in Taka; null where the layout omits it.
   *  Was generation x a hardcoded per-fuel tariff. */
  cost: number | null;
  /** Derived from the two published figures (cost / kWh), not an input. */
  unitCost: number | null;
  color: string;
}

export interface GasProductionItem {
  company: string;
  fields: number;
  gas: number;
  condensate: number;
  share: number;
}

export interface GasDistributionItem {
  company: string;
  power: number;
  fertilizer: number;
  others: number;
  total: number;
}

export interface BorderImportItem {
  source: string;
  energy: number;
  peakFlow: number;
  type: string;
}

export interface RegionalDemandItem {
  zone: string;
  loadShed: number;
  demand: number;
  pct: number;
}

export interface DailyOutageItem {
  time: string;
  plant: string;
  load: string;
  reason: string;
  full_desc?: string;
}

export interface HourlyLoadItem {
  time: string;
  /** Measured — the L-Curve TOTAL column for this hour. */
  generation: number;
  /**
   * PGCB publishes load shedding at the evening peak hour only, so these are
   * non-null on exactly that one hour and null everywhere else. They used to
   * be filled across 18:00-23:00 with total shedding x 0.8 and charted as a
   * measured profile.
   */
  loadShed: number | null;
  demand: number | null;
}

/** One power station's figures for the reported day, from the Forecast sheet. */
export interface PlantActual {
  name: string;
  fuel: string;
  producer: string;
  /** Unit breakdown as printed, e.g. "1*273+1*139". */
  installedCapacity: string;
  installedMw: number | null;
  presentCapacityMw: number | null;
  /** Output at the day and evening peaks — the reported day, not the forecast. */
  dayPeakMw: number;
  eveningPeakMw: number;
}

/** Hourly output per station, from the GenLog sheet (2025+ reports only). */
export interface GenLogStation {
  name: string;
  capacityMw: number;
  /** One value per entry in `hours`. */
  hourlyMw: number[];
}

export interface GenLog {
  hours: string[];
  stations: GenLogStation[];
  /** PGCB's own roll-up columns, kept so the station figures can be checked. */
  totals: { national?: number[]; eastern?: number[]; western?: number[] };
}

/**
 * Per-station detail for one day, served from `{date}-plants.json` rather than
 * the daily payload — it is ~55KB a day and only needed when the tab is opened.
 * A day only has a file if its figures reconciled against P1 and the load curve.
 */
export interface DailyPlantDetail {
  date: string;
  plants?: PlantActual[];
  genlog?: GenLog;
}

export interface GridDailyData {
  systemStats: GridSystemStats;
  generationData: GridGenerationItem[];
  gasProductionData?: GasProductionItem[];
  gasDistributionData?: GasDistributionItem[];
  borderImportsData?: BorderImportItem[];
  regionalDemandData?: RegionalDemandItem[];
  dailyOutages?: DailyOutageItem[];
  hourlyLoadData?: HourlyLoadItem[];
}

/** Known Petrobangla gas production entity names (full company labels). */
export const PETROBANGLA_GAS_PRODUCTION_COMPANIES = [
  'BGFCL (Titas, Habiganj, Bakhrabad)',
  'SGFL (Sylhet, Rashidpur, Kailashtila)',
  'BAPEX (Shahbazpur, Srikail, Begumganj)',
  'Chevron (Bibiyana, Jalalabad, Moulavibazar)',
  'Tullow (Bangora)',
  'RPGCL (R-LNG Import / LNG Terminal)',
] as const;

/** Known Petrobangla gas distribution company names. */
export const PETROBANGLA_GAS_DISTRIBUTION_COMPANIES = [
  'TGTDCL (Dhaka & Mymensingh)',
  'BGDCL (Cumilla & Sylhet)',
  'KGDCL (Chattogram)',
  'JGTDSL (Sylhet region)',
  'PGCL (Rajshahi & Rangpur)',
  'SGCL (Barishal & Khulna)',
] as const;

/** Required fuels in daily generationData. Wind is optional (often absent in PGCB reports). */
export const REQUIRED_GENERATION_FUELS = [
  'Gas',
  'Coal',
  'HFO',
  'Hydro',
  'Solar',
  'Imports',
  'HSD (Diesel)',
] as const;

export const OPTIONAL_GENERATION_FUELS = ['Wind'] as const;

/** @deprecated Use REQUIRED_GENERATION_FUELS — Wind is optional. */
export const EXPECTED_GENERATION_FUELS = [...REQUIRED_GENERATION_FUELS, ...OPTIONAL_GENERATION_FUELS] as const;