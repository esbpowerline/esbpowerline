import { z } from 'zod';
import type { GridDailyData } from '@/lib/data/grid/types';
import {
  GENERATION_FUEL_ALIASES,
  REQUIRED_GENERATION_FUELS,
  PETROBANGLA_GAS_DISTRIBUTION_COMPANIES,
  PETROBANGLA_GAS_PRODUCTION_COMPANIES,
} from '@/lib/data/grid/types';

const systemStatsSchema = z.object({
  date: z.string().min(1),
  dayPeakGen: z.number(),
  eveningPeakGen: z.number(),
  dayPeakDemand: z.number().nullable(),
  eveningPeakDemand: z.number(),
  // Nullable across the board: every one of these is read from the source
  // report, and a layout that does not publish one reports null rather than
  // an estimate dressed as a measurement.
  minGen: z.number().nullable(),
  maxGen: z.number().nullable(),
  totalEnergyGen: z.number().nullable(),
  totalEnergyUnserved: z.number().nullable(),
  totalEnergyDemand: z.number().nullable(),
  maxTemp: z.number().nullable(),
  totalGasSuppliedPower: z.number(),
  avgProductionCost: z.number(),
  totalDailyCost: z.number(),
});

const generationItemSchema = z.object({
  name: z.string(),
  gen: z.number(),
  // Published cost, and the unit cost derived from it. Null where the source
  // layout carries no production-cost block.
  cost: z.number().nullable(),
  unitCost: z.number().nullable(),
  color: z.string(),
});

const gasProductionSchema = z.object({
  company: z.string(),
  fields: z.number(),
  gas: z.number(),
  condensate: z.number(),
  share: z.number(),
});

const gasDistributionSchema = z.object({
  company: z.string(),
  power: z.number(),
  fertilizer: z.number(),
  others: z.number(),
  total: z.number(),
});

export const dailyReportSchema = z.object({
  systemStats: systemStatsSchema,
  generationData: z.array(generationItemSchema).min(1),
  gasProductionData: z.array(gasProductionSchema).optional(),
  gasDistributionData: z.array(gasDistributionSchema).optional(),
  borderImportsData: z.array(z.object({
    source: z.string(),
    energy: z.number(),
    peakFlow: z.number().nullable(),
    type: z.string(),
  })).optional(),
  regionalDemandData: z.array(z.object({
    zone: z.string(),
    loadShed: z.number(),
    demand: z.number(),
    pct: z.number(),
  })).optional(),
  dailyOutages: z.array(z.object({
    time: z.string(),
    plant: z.string(),
    load: z.string(),
    reason: z.string(),
    full_desc: z.string().optional(),
  })).optional(),
  hourlyLoadData: z.array(z.object({
    time: z.string(),
    generation: z.number(),
    // Published every hour by the P4 sheet; on the older layouts that carry no
    // P4, only the evening peak hour has them.
    loadShed: z.number().nullable(),
    demand: z.number().nullable(),
  })).optional(),
  // Half-hourly fuel split. `mw` is positional against `fuels`, so a row of a
  // different length would silently re-label every series after the gap.
  energyCurveData: z.object({
    fuels: z.array(z.string()).min(1),
    rows: z.array(z.object({
      time: z.string(),
      mw: z.array(z.number().nullable()),
    })).min(1),
  }).refine(
    (c) => c.rows.every((r) => r.mw.length === c.fuels.length),
    { message: 'every energy-curve row must carry one value per fuel' },
  ).optional(),
  // Zod strips keys a schema does not name. This schema gates what
  // lib/actions/data-releases.ts writes, so a field missing here is a field
  // silently dropped from every day published through the admin panel — the
  // page would render the runtime day without its source citation, its
  // observation windows or its forecast, and nothing would report an error.
  sourceFiles: z.object({
    pgcb: z.string().optional(),
    petrobangla: z.string().optional(),
  }).optional(),
  observationWindows: z.object({
    timezone: z.string(),
    pgcb: z.object({
      unit: z.string(),
      start: z.string(),
      end: z.string(),
      filedAs: z.string(),
      sourceFile: z.string().nullish(),
    }).optional(),
    petrobangla: z.object({
      unit: z.string(),
      start: z.string(),
      end: z.string(),
      filedAs: z.string(),
      publishedLabel: z.string().nullish(),
      period: z.string().nullish(),
      sourceFile: z.string().nullish(),
    }).optional(),
  }).optional(),
  forecast: z.object({
    targetDay: z.string(),
    issuedOn: z.string(),
    issuedIn: z.string(),
    layout: z.enum(['scenario', 'divider']),
    issuedFrom: z.enum(['source-copy', 'erp-mirror', 'converted-text']).optional(),
    issuedFromNote: z.string().optional(),
    issuedAt: z.string().optional(),
    hourly: z.array(z.object({
      time: z.string(),
      generationMw: z.number().nullable(),
      loadShedMw: z.number().nullable(),
      demandMw: z.number().nullable(),
    })).optional(),
    maxDemandEveningMw: z.number().optional(),
    maxDemandDayMw: z.number().optional(),
    maxDemandMw: z.number().optional(),
    maxGenEveningMw: z.number().optional(),
    totalEnergyGenMkwh: z.number().optional(),
    reserveMw: z.number().optional(),
    shortageMw: z.number().optional(),
    maxTempC: z.number().optional(),
    totalLoadShedMw: z.number().optional(),
    areaLoadShedMw: z.record(z.string(), z.number()).optional(),
    areaLoadShedUnread: z.boolean().optional(),
  }).refine(
    // A forecast describes the day AFTER the one that published it. A record
    // where those are not one day apart has been filed against the wrong day,
    // which is the whole failure this layer exists to prevent.
    (f) => {
      const issued = Date.parse(`${f.issuedOn}T00:00:00Z`);
      const target = Date.parse(`${f.targetDay}T00:00:00Z`);
      return Number.isFinite(issued) && Number.isFinite(target)
        && target - issued === 86_400_000;
    },
    { message: 'a forecast must target the day after the report that issued it' },
  ).optional(),
  // Present on some archived days and previously unnamed here for the same
  // reason: naming them keeps a release from dropping them.
  regionalDemandSource: z.enum([
    'p1-published',
    'derived-served-plus-shed',
    'bpdb-published',
  ]).nullish(),
  zoneGenerationData: z.array(z.object({
    zone: z.string(),
    fuels: z.record(z.string(), z.number()),
    total: z.number(),
  })).optional(),
});

export type DailyReportValidation = z.SafeParseReturnType<GridDailyData, GridDailyData>;

export function validateDailyReport(data: unknown): DailyReportValidation {
  return dailyReportSchema.safeParse(data);
}

function warnCompanyNames(report: GridDailyData, isoDate: string): void {
  if (!report.gasProductionData?.length) return;
  for (const row of report.gasProductionData) {
    const known = PETROBANGLA_GAS_PRODUCTION_COMPANIES.some((name) => row.company.startsWith(name.split(' ')[0]));
    if (!known && process.env.NODE_ENV === 'development') {
      console.warn(`[daily-report] Unknown gas production company "${row.company}" on ${isoDate}`);
    }
  }
  if (report.gasDistributionData?.length) {
    for (const row of report.gasDistributionData) {
      const known = PETROBANGLA_GAS_DISTRIBUTION_COMPANIES.some((name) => row.company.startsWith(name.split(' ')[0]));
      if (!known && process.env.NODE_ENV === 'development') {
        console.warn(`[daily-report] Unknown gas distribution company "${row.company}" on ${isoDate}`);
      }
    }
  }
}

/** Dev-time schema warning — no-op in production builds unless explicitly enabled. */
export function warnIfInvalidDailyReport(data: unknown, isoDate: string): void {
  if (process.env.NODE_ENV === 'production' && process.env.DAILY_REPORT_VALIDATE !== '1') {
    return;
  }
  const result = validateDailyReport(data);
  if (!result.success) {
    console.warn(`[daily-report] Schema validation failed for ${isoDate}:`, result.error.flatten());
    return;
  }
  const fuels = new Set(result.data.generationData.map((g) => g.name));
  for (const expected of REQUIRED_GENERATION_FUELS) {
    const names = [expected, ...(GENERATION_FUEL_ALIASES[expected] ?? [])];
    if (!names.some((n) => fuels.has(n)) && process.env.NODE_ENV === 'development') {
      console.warn(`[daily-report] Missing generation fuel "${expected}" on ${isoDate}`);
    }
  }
  warnCompanyNames(result.data, isoDate);
}