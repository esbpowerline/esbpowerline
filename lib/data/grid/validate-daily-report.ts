import { z } from 'zod';
import type { GridDailyData } from '@/lib/data/grid/types';
import {
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
  totalEnergyGen: z.number(),
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
    peakFlow: z.number(),
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
    // Populated on the published evening peak hour only.
    loadShed: z.number().nullable(),
    demand: z.number().nullable(),
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
    if (!fuels.has(expected) && process.env.NODE_ENV === 'development') {
      console.warn(`[daily-report] Missing generation fuel "${expected}" on ${isoDate}`);
    }
  }
  warnCompanyNames(result.data, isoDate);
}