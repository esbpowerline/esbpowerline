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
  /**
   * The day's total generation as P1 prints it. Null where that cell is left
   * empty — PGCB does that, and 42 days of early 2018 published a headline of
   * "0.0 MKWh" as a result. Recovered from P2's National Grid Total wherever a
   * source workbook survives; null on the days where none does, because zero
   * generation is a claim the report never made.
   */
  totalEnergyGen: number | null;
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
  /** Measured — P4's Generation column, or the L-Curve TOTAL where P4 is absent. */
  generation: number;
  /**
   * From the P4 sheet, "Hourly Demand, Generation & Load-Shed Report", which
   * publishes all three every hour. Null only on the older layouts that carry
   * no P4: there P1 states the pair for the evening peak alone, so exactly one
   * hour is non-null and the rest are unknown. Zero is a measurement — PGCB
   * prints 0 on hours it served everything.
   *
   * These were once filled across 18:00-23:00 with total shedding x 0.8 and
   * charted as a measured profile; a null here means unpublished, never that.
   */
  loadShed: number | null;
  demand: number | null;
}

/**
 * Half-hourly generation split by fuel and by importer, from the En-Curve
 * sheet. `mw[i]` corresponds to `fuels[i]`; null where the day's sheet carries
 * no such column, which is not the same as zero output.
 *
 * Present only on the 2025+ layout. The columns separate public from private
 * generation and name each import (HVDC Bheramara, Nepal, Tripura, Adani)
 * where `borderImportsData` carries three and no Nepal. The last column,
 * "Shortage", is load shedding at half-hour resolution.
 */
export interface EnergyCurveRow {
  time: string;
  mw: (number | null)[];
}

export interface EnergyCurve {
  fuels: string[];
  rows: EnergyCurveRow[];
}

/**
 * One power station's figures for the reported day.
 *
 * From the Forecast sheet on the 2025+ layout, and from P2 before that —
 * "Evening Peak Generation and Day Long Energy Data of Power Stations", which
 * PGCB has printed in every workbook back to 2014.
 */
export interface PlantActual {
  name: string;
  fuel: string;
  producer: string;
  /** Unit breakdown as printed, e.g. "1*273+1*139". */
  installedCapacity: string;
  installedMw: number | null;
  presentCapacityMw: number | null;
  /**
   * Output at the evening peak, and at the day peak where the report states it.
   * `dayPeakMw` is null on every day sourced from P2, which publishes the
   * evening peak alone — the day peak is a 2025+ Forecast-sheet column.
   */
  dayPeakMw: number | null;
  eveningPeakMw: number;
  /**
   * The station's output over the whole day, in kWh. Published by P2 in every
   * era and read by nothing until now. It says what the peak columns cannot: a
   * plant held at half load all day and one run flat out for an hour can carry
   * the same peak.
   */
  energyKwh?: number | null;
  /** PGCB's own note on the row — "Gas shortage", "Under maintenance". */
  remarks?: string;
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
  /** Where the zone Demand figures came from — the section is PGCB-attributed
   *  by default, so anything else has to say so:
   *    'p1-published'             PGCB's own printed P1 Demand column (P)
   *    'derived-served-plus-shed' reconstructed from P3 area served + P1 shed
   *                               on days whose printed column is not held (D)
   *    'bpdb-published'           BPDB's published zone table, used on days no
   *                               PGCB copy is held. A different publisher of
   *                               the same evening-peak table, so still P —
   *                               but credited to BPDB, never to PGCB.
   *  Absent on files written before this field existed. */
  regionalDemandSource?:
    | 'p1-published'
    | 'derived-served-plus-shed'
    | 'bpdb-published'
    | null;
  dailyOutages?: DailyOutageItem[];
  hourlyLoadData?: HourlyLoadItem[];
  energyCurveData?: EnergyCurve;
  /**
   * The documents this day was actually built from, named exactly as the files
   * are held — so a reader can ask either agency for the same file rather than
   * take "PGCB Daily Report" on trust.
   *
   * `pgcb` is the workbook, named by PGCB for the report date (energy day + 1).
   * `petrobangla` is the gas PDF whose 8am–8am window STARTS on this energy
   * day, and is absent on days whose gas was never published or not held.
   * Absent entirely on files written before this field existed.
   */
  sourceFiles?: {
    pgcb?: string;
    petrobangla?: string;
  };
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

/**
 * Spellings the archive uses for the same fuel. PGCB's own label changed with
 * the 2025 layout and the archive carries both — 'HSD (Diesel)' on the older
 * days, bare 'HSD' from 2025-01-01 on. Neither is wrong, so the completeness
 * check treats them as one fuel rather than warning on every recent day.
 */
export const GENERATION_FUEL_ALIASES: Record<string, readonly string[]> = {
  'HSD (Diesel)': ['HSD'],
};

export const OPTIONAL_GENERATION_FUELS = ['Wind'] as const;

/** @deprecated Use REQUIRED_GENERATION_FUELS — Wind is optional. */
export const EXPECTED_GENERATION_FUELS = [...REQUIRED_GENERATION_FUELS, ...OPTIONAL_GENERATION_FUELS] as const;