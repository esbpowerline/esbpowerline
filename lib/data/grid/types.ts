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
  /**
   * P1 "Total Gas Supplied … MMCFD": gas delivered to the power sector on the
   * energy day. It is about a third of Petrobangla's national grand total and
   * must never stand in for it (see the Gas Supply tile incident in
   * home-snapshot-core.ts).
   */
  totalGasSuppliedPower: number;
  /**
   * Derived, not P1's printed "Production Cost per KWHr": the parser divides
   * `totalDailyCost` by `totalEnergyGen` (parse_daily_reports.py:1890) and
   * never reads the printed cell. Every surface must mark it D.
   */
  avgProductionCost: number;
  /** P1 "Production Cost (Tk.)" total row, in Taka. */
  totalDailyCost: number;
  /**
   * The clock time P1 stamps against each figure above — the hour the peak was
   * actually measured, which PGCB has always printed and the parser read past
   * until now. Present only for the figures a given layout stamps, so a
   * missing key means the sheet published no time, never midnight.
   *
   * The evening peak hour genuinely moves (18:00–21:00 across verified
   * 2025–26 days), so anything naming a fixed hour in prose should read this
   * instead.
   */
  peakTimes?: {
    dayPeakGen?: string;
    dayPeakDemand?: string;
    eveningPeakGen?: string;
    eveningPeakDemand?: string;
    minGen?: string;
    maxGen?: string;
  };
}

/**
 * One zone's row of P1's "Zone-wise Generation Summary" — the national fuel
 * mix broken out by zone, and PGCB's only published statement of where each
 * zone's energy comes from. Energy in MKWh, normalised from whichever unit the
 * caption states.
 */
export interface ZoneGenerationItem {
  zone: string;
  /** Keyed by the same fuel names as `generationData`. A layout that omits a
   *  fuel omits the key; zero is a published zero. */
  fuels: Record<string, number>;
  /** PGCB's own row total where it prints one, so a row whose parts do not add
   *  up keeps the published figure rather than a silently corrected sum. */
  total: number;
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

/** One timestamp on the interconnector, indexed to match `EwicData.corridors`. */
export interface EwicRow {
  time: string;
  /** Positive is West to East, the direction the sheet's own footnote defines. */
  mw: (number | null)[];
  mvar: (number | null)[];
}

/** A circuit's metered energy for the day. Two circuits per corridor. */
export interface EwicCircuit {
  circuit: string;
  direction: 'Export' | 'Import';
  /**
   * Kilowatt-hours. The sheet heads this column "Energy (MkWHr)" and prints
   * kWh — 42.8 million of them on 2026-08-13, against a national 361.36 MKWh.
   * The unit is corrected at parse; the figure is untouched.
   */
  energyKwh: number | null;
}

/** A reconciliation the parser ran and wants the reader to see. */
export interface EwicCheck {
  scope: string;
  message: string;
}

export interface EwicData {
  corridors: string[];
  rows: EwicRow[];
  circuits: EwicCircuit[];
  totals: { export?: number | null; import?: number | null };
  /** Empty when everything reconciled. Never suppressed. */
  checks: EwicCheck[];
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
  /** Null where PGCB left the cell blank — not a measured zero. */
  eveningPeakMw: number | null;
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
  /** Null on the 2018-2024 YesterdayGen sheet, which prints no capacity row. */
  capacityMw: number | null;
  /**
   * One value per entry in `hours`. Null where PGCB left the cell blank — from
   * 2018 to 2024 whole stations are blank all day, which is not generation of
   * zero.
   */
  hourlyMw: (number | null)[];
}

export interface GenLog {
  hours: string[];
  stations: GenLogStation[];
  /** PGCB's own roll-up columns, kept so the station figures can be checked. */
  totals: { national?: (number | null)[]; eastern?: (number | null)[]; western?: (number | null)[] };
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
  /** What PGCB expected of each station on this day, published the day before. */
  plantForecast?: PlantForecast;
}

/**
 * PGCB's per-station availability forecast for this day.
 *
 * The 2025+ Forecast sheet prints two projections per station beside the
 * actuals: `Forecasted Available Gen.` — what the station is expected to be
 * able to offer — and `Effective Available Gen.` — what PGCB expects to
 * actually be able to take from it. Where they differ, the gap is a constraint
 * PGCB is anticipating, and the station's `remarks` usually name it ("Gas
 * shortage", "Coal shortage", "Liquid fuel shortage").
 *
 * Anchored to the day it describes, so it sits beside that day's actuals.
 * Present on the 2025+ layout only — earlier sheets carry no such columns.
 */
export interface PlantForecast {
  targetDay: string;
  /** The energy day of the report that carried it — targetDay minus one. */
  issuedOn: string;
  issuedIn: string;
  stationCount: number;
  /**
   * The station sums at the evening peak. BOTH are stored rather than only
   * their difference, because they do not behave as a system forecast: on
   * 2026-08-17 the stations sum to 20,220 MW forecast-available and 13,382 MW
   * effective, while the same report forecasts 16,130 MW of generation at the
   * evening peak and the grid delivered 15,891 MW. The effective sum therefore
   * sits BELOW both — it is a station-by-station availability figure, not a
   * prediction of system output, and presenting the gap alone would read as a
   * shortfall claim the source does not make.
   */
  forecastAvailableEveningMw: number;
  effectiveAvailableEveningMw: number;
  deratedStations: number;
  deratedMwAtEveningPeak: number;
  stations: Array<{
    name: string;
    fuel: string | null;
    producer: string | null;
    forecastDayPeakMw: number | null;
    forecastEveningPeakMw: number | null;
    effectiveDayPeakMw: number | null;
    effectiveEveningPeakMw: number | null;
    remarks: string | null;
  }>;
}

/**
 * PGCB's projection for this day, published the day BEFORE in that day's
 * workbook — "Forecast Scenario" on the 2025+ layout, the block below the lone
 * "Forecast" divider before it.
 *
 * It anchors here, to the day it describes, rather than to the report that
 * issued it: a forecast for 1 April belongs on 1 April, beside the actuals it
 * can be judged against. `issuedOn` names the energy day whose report carried
 * it, so the lead time is never in doubt.
 *
 * Absent on days whose issuing workbook is not held — roughly a quarter of the
 * archive has one. Absent is not "no shortfall was expected".
 */
export interface GridForecast {
  /** The day this projects. Equals the key of the file it sits on. */
  targetDay: string;
  /**
   * The energy day of the report that carried it — always targetDay minus one.
   *
   * This is NOT when the forecast was issued. The workbook reporting energy day
   * D is filed on D+1 and its scenario targets D+1, so the projection is
   * published on the day it describes. `issuedAt` carries the actual instant.
   */
  issuedOn: string;
  /**
   * When PGCB's Operation Information System generated the report, from the
   * stamp it prints — "generated digitally ... at 10:06 hrs on 17-08-2026".
   *
   * Consistently ~10:00 on the TARGET day across every 2025+ report checked,
   * which makes this a same-day projection with eight to eleven hours of lead
   * to the evening peak, not a day-ahead one. Absent on the pre-2025 layout,
   * which prints no stamp.
   */
  issuedAt?: string;
  /**
   * The forecast load curve for the target day: 24 hourly rows plus the 18:30
   * and 19:30 samples PGCB takes around the evening peak.
   *
   * Comparable hour-for-hour against `hourlyLoadData`, which holds the actual
   * curve for the same day. Note the lead time above: rows before `issuedAt`
   * were published after those hours had already passed, so they are not
   * predictions and must not be scored as though they were.
   *
   * Present only on the 2025+ layout; earlier reports forecast summary
   * figures alone.
   */
  hourly?: Array<{
    time: string;
    generationMw: number | null;
    loadShedMw: number | null;
    demandMw: number | null;
  }>;
  /** The workbook, named as PGCB names it. */
  issuedIn: string;
  /** Which layout stated it: 'scenario' from 2025, 'divider' before. */
  layout: 'scenario' | 'divider';
  /**
   * Which of the project's two workbook stores this was read from.
   *
   * Both hold the document PGCB issued. `erp.powergrid.gov.bd` is not a third
   * party republishing the report — it is the portal PGCB's own site links as
   * its Daily Operation Report, and pgcb.gov.bd hosts no daily report files at
   * all. Sampled 2026-08-19 across 15 days spanning 2014-2026 and every
   * container format (.xls, .xlsm, .xlsx): the held copy is byte-identical to
   * what that portal serves today, on all 15.
   *
   * So this records WHERE the archive keeps the file, not how trustworthy it
   * is. 'source-copy' means the primary store; 'erp-store' means the copy
   * acquired from the portal. Neither is second-hand.
   */
  issuedFrom?: 'source-copy' | 'erp-mirror' | 'converted-text';
  /** Why a converted-text read was necessary, where it was. */
  issuedFromNote?: string;
  maxDemandEveningMw?: number;
  maxDemandDayMw?: number;
  /**
   * The 2014-era sheets forecast ONE demand figure, "Maximum Demand
   * (Generation end)", with no evening/day split. It is kept apart from the
   * pair above rather than filed under `maxDemandEveningMw`, because calling
   * it an evening peak would invent a distinction PGCB did not draw. Present
   * only where the split pair is genuinely absent.
   */
  maxDemandMw?: number;
  maxGenEveningMw?: number;
  totalEnergyGenMkwh?: number;
  /** Generation-end reserve. Pre-2025 layouts only. */
  reserveMw?: number;
  /**
   * "Shortage (Generation end)" on the 2014-era sheets — the same quantity as
   * `reserveMw` with the sign reversed, printed negative when generation was
   * expected to fall short. Not folded into `reserveMw`: flipping a published
   * sign is a restatement, not a parse.
   */
  shortageMw?: number;
  /** Probable maximum temperature in Dhaka. 2025+ layouts only. */
  maxTempC?: number;
  totalLoadShedMw?: number;
  /** Per-area shortfall PGCB expected at the evening peak, in MW. Present only
   *  where the nine areas sum to PGCB's own stated total. */
  areaLoadShedMw?: Record<string, number>;
  /** True where the area row was found but did not reconcile, so it was
   *  dropped. Distinguishes "we could not read it" from "none was published". */
  areaLoadShedUnread?: boolean;
}

/**
 * The span of time each publisher's figures on this day actually cover.
 *
 * Written by scripts/repair_daily_windows.py so the page never has to infer a
 * window, and so an export carries the same statement the page makes. The two
 * do not coincide: PGCB's energy day runs midnight to midnight, Petrobangla's
 * gas day 08:00 to 08:00, and they share only 16 of their 24 hours.
 *
 * See lib/data/grid/observation-window.ts for the anchor rule and for what may
 * legitimately be compared with what.
 */
export interface GridObservationWindows {
  /** Always "+06:00". Both publishers report Bangladesh local clock time. */
  timezone: string;
  pgcb?: {
    unit: string;
    start: string;
    end: string;
    /** The date PGCB files this workbook under — the energy day plus one. */
    filedAs: string;
    sourceFile?: string | null;
  };
  petrobangla?: {
    unit: string;
    start: string;
    end: string;
    /** The morning the window closes, which is how Petrobangla names the PDF. */
    filedAs: string;
    /** The range printed on the PDF itself, e.g. "16-17 Aug, 2026". */
    publishedLabel?: string | null;
    /** The reporting period as printed, e.g. "8.00 to 8.00". */
    period?: string | null;
    sourceFile?: string | null;
  };
}

export interface GridDailyData {
  systemStats: GridSystemStats;
  generationData: GridGenerationItem[];
  gasProductionData?: GasProductionItem[];
  gasDistributionData?: GasDistributionItem[];
  borderImportsData?: BorderImportItem[];
  regionalDemandData?: RegionalDemandItem[];
  /** Zone x fuel from P1, in the order PGCB prints. Absent on the layouts
   *  whose P1 carries no zone generation table — which is not the same as nine
   *  zones that generated nothing. */
  zoneGenerationData?: ZoneGenerationItem[];
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
  /** East-West Interconnector flow. Absent on the layouts with no EWIC sheet. */
  ewicData?: EwicData;
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
  /** What span of time this day's figures cover, per publisher. */
  observationWindows?: GridObservationWindows;
  /** What PGCB expected of this day, published the day before. */
  forecast?: GridForecast;
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