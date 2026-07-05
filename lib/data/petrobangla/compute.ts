import {
  ARCHIVE_BASELINE_DATE,
  ARCHIVE_BASELINE_GAS,
  ARCHIVE_INSIGHTS,
  ARCHIVE_PEAK,
  ARCHIVE_BASELINE_DOMESTIC_GAS,
  isQuarantined,
} from './constants';
import type {
  ArchiveKpis,
  PetrobanglaDaily,
  PetrobanglaIndex,
  PetrobanglaIndexDay,
  PetrobanglaTimelineDay,
  PetrobanglaTimelineSummary,
  ProductionField,
} from './types';
import { lookupIndexDay, lookupTimelineDay } from './loadArchive';

export function getRpgclGas(fields: ProductionField[]): number {
  return fields
    .filter((f) => f.company_code === 'RPGCL')
    .reduce((s, f) => s + (f.gas_mmcfd || 0), 0);
}

export function getDomesticGas(fields: ProductionField[]): number {
  return fields
    .filter((f) => f.company_code !== 'RPGCL')
    .reduce((s, f) => s + (f.gas_mmcfd || 0), 0);
}

export function getFieldGas(fields: ProductionField[], name: string): number {
  const row = fields.find((f) => f.field === name || f.field.includes(name));
  return row?.gas_mmcfd ?? 0;
}

const EMPTY_DISTRIBUTION_TOTAL = {
  power_demand_mmcfd: 0,
  power_supply_mmcfd: 0,
  fertilizer_demand_mmcfd: 0,
  fertilizer_supply_mmcfd: 0,
  others_supplementary_mmcfd: 0,
  total_mmcfd: 0,
} as const;

/** Older daily JSON uses summary.total_ instead of summary.grand_total */
export function getDistributionGrandTotal(day: PetrobanglaDaily) {
  const summary = day.distribution?.summary;
  const row = summary?.grand_total ?? summary?.total_;
  if (!row) return { ...EMPTY_DISTRIBUTION_TOTAL };
  return {
    power_demand_mmcfd: Number(row.power_demand_mmcfd) || 0,
    power_supply_mmcfd: Number(row.power_supply_mmcfd) || 0,
    fertilizer_demand_mmcfd: Number(row.fertilizer_demand_mmcfd) || 0,
    fertilizer_supply_mmcfd: Number(row.fertilizer_supply_mmcfd) || 0,
    others_supplementary_mmcfd: Number(row.others_supplementary_mmcfd) || 0,
    total_mmcfd: Number(row.total_mmcfd) || 0,
  };
}

export function powerFulfillmentPct(day: PetrobanglaDaily): number {
  const gt = getDistributionGrandTotal(day);
  return gt.power_demand_mmcfd > 0
    ? (gt.power_supply_mmcfd / gt.power_demand_mmcfd) * 100
    : 0;
}

export function computeStressScore(
  day: PetrobanglaDaily,
  peakGas: number,
): { score: number; color: 'green' | 'amber' | 'red' } {
  const fields = day.production.fields;
  const grandTotal = day.production.grand_total.gas_mmcfd;
  const domestic = getDomesticGas(fields);
  const lng = getRpgclGas(fields);
  const bibiyana = getFieldGas(fields, 'Bibiyana');
  const fulfillment = powerFulfillmentPct(day) || 50;

  const domesticShare = grandTotal > 0 ? (domestic / grandTotal) * 100 : 0;
  const lngShare = grandTotal > 0 ? (lng / grandTotal) * 100 : 0;
  const bibDomesticShare = domestic > 0 ? (bibiyana / domestic) * 100 : 0;
  const vsPeak = peakGas > 0 ? (grandTotal / peakGas) * 100 : 100;

  const score = Math.min(
    100,
    Math.round(
      (100 - fulfillment) * 0.3 +
        (100 - domesticShare) * 0.25 +
        lngShare * 0.2 +
        Math.min(bibDomesticShare, 50) * 0.3 +
        (100 - vsPeak) * 0.1,
    ),
  );

  const color = score < 40 ? 'green' : score <= 65 ? 'amber' : 'red';
  return { score, color };
}

export function computeArchiveKpis(day: PetrobanglaDaily): ArchiveKpis {
  const fields = day.production.fields;
  const grandTotal = day.production.grand_total.gas_mmcfd;
  const domestic = getDomesticGas(fields);
  const lng = getRpgclGas(fields);
  const bibiyana = getFieldGas(fields, 'Bibiyana');
  const gt = getDistributionGrandTotal(day);
  const peakGas = lookupTimelineDay(ARCHIVE_PEAK.date)?.total_gas ?? ARCHIVE_PEAK.gas;
  const date = day.report.report_date_start;

  const yearAgo = shiftIsoYear(date, -1);
  const yearAgoGas =
    lookupTimelineDay(yearAgo)?.total_gas ??
    lookupIndexDay(yearAgo)?.grand_total_gas_mmcfd ??
    null;
  const baselineRow = lookupTimelineDay(ARCHIVE_BASELINE_DATE);

  const { score, color } = computeStressScore(day, peakGas);

  return {
    stressScore: score,
    stressColor: color,
    totalGas: grandTotal,
    totalGasDeltaYear: yearAgoGas != null ? grandTotal - yearAgoGas : null,
    totalGasDeltaPeak: grandTotal - peakGas,
    totalGasDeltaBaseline: grandTotal - (baselineRow?.total_gas ?? ARCHIVE_BASELINE_GAS),
    powerFulfillmentPct:
      gt.power_demand_mmcfd > 0
        ? (gt.power_supply_mmcfd / gt.power_demand_mmcfd) * 100
        : 0,
    powerDemand: gt.power_demand_mmcfd,
    powerSupply: gt.power_supply_mmcfd,
    lngSharePct: grandTotal > 0 ? (lng / grandTotal) * 100 : 0,
    lngGasMmcfd: lng,
    domesticGas: domestic,
    domesticDeltaBaseline:
      domestic - (baselineRow?.domestic_gas ?? ARCHIVE_BASELINE_DOMESTIC_GAS),
    activeWells: day.production.grand_total.producing_wells,
    bibiyanaGas: bibiyana,
    bibiyanaDomesticSharePct: domestic > 0 ? (bibiyana / domestic) * 100 : 0,
  };
}

export function computeArchiveKpisPreview(
  indexDay: PetrobanglaIndexDay,
): ArchiveKpis {
  const grandTotal = indexDay.grand_total_gas_mmcfd;
  const date = indexDay.date;
  const yearAgo = shiftIsoYear(date, -1);
  const yearAgoGas = lookupIndexDay(yearAgo)?.grand_total_gas_mmcfd ?? null;
  const peakGas = ARCHIVE_PEAK.gas;
  const baselineRow = lookupTimelineDay(ARCHIVE_BASELINE_DATE);

  return {
    stressScore: 0,
    stressColor: 'green',
    totalGas: grandTotal,
    totalGasDeltaYear: yearAgoGas != null ? grandTotal - yearAgoGas : null,
    totalGasDeltaPeak: grandTotal - peakGas,
    totalGasDeltaBaseline: grandTotal - (baselineRow?.total_gas ?? ARCHIVE_BASELINE_GAS),
    powerFulfillmentPct: 0,
    powerDemand: 0,
    powerSupply: 0,
    lngSharePct: 0,
    lngGasMmcfd: 0,
    domesticGas: 0,
    domesticDeltaBaseline: 0,
    activeWells: indexDay.plant_count, // dummy fallback
    bibiyanaGas: 0,
    bibiyanaDomesticSharePct: 0,
  };
}

function shiftIsoYear(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y + delta}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function filterTimelineDays(
  days: PetrobanglaTimelineDay[],
  start?: string,
  end?: string,
  includeQuarantine = false,
): PetrobanglaTimelineDay[] {
  return days.filter((d) => {
    if (!includeQuarantine && (d.quarantined || d.parse_status !== 'ok')) return false;
    if (start && d.date < start) return false;
    if (end && d.date > end) return false;
    return true;
  });
}

export function movingAverage(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export interface FieldHistoryPoint {
  date: string;
  gas: number;
  wells: number;
  capacity: number;
}

export function buildFieldHistory(
  timeline: PetrobanglaTimelineSummary,
  fieldName: string,
  fullDays: Map<string, PetrobanglaDaily>,
): FieldHistoryPoint[] {
  const points: FieldHistoryPoint[] = [];
  for (const row of timeline.days) {
    if (row.parse_status !== 'ok' || row.quarantined) continue;
    const day = fullDays.get(row.date);
    if (!day) continue;
    const f = day.production.fields.find((x) => x.field === fieldName);
    if (!f) continue;
    points.push({
      date: row.date,
      gas: f.gas_mmcfd,
      wells: f.producing_wells,
      capacity: f.capacity_mmcfd,
    });
  }
  return points;
}

/** Downsample dense timeline series so Recharts stays responsive on mobile. */
export function decimateTimelineDays<T>(rows: T[], maxPoints = 420): T[] {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  return rows.filter((_, i) => i % step === 0 || i === rows.length - 1);
}

export function worstPowerGapDays(
  days: PetrobanglaTimelineDay[],
  limit = 10,
): Array<{ date: string; gap: number; fulfillment: number }> {
  return days
    .filter((d) => d.power_demand != null && d.power_supply != null)
    .map((d) => ({
      date: d.date,
      gap: (d.power_demand as number) - (d.power_supply as number),
      fulfillment: d.power_fulfillment_pct ?? 0,
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit);
}

export function stressedPlants(day: PetrobanglaDaily) {
  const out: Array<{
    name: string;
    disco: string;
    demand: number;
    supply: number;
  }> = [];
  for (const co of day.distribution?.companies ?? []) {
    for (const p of co.power_plants ?? []) {
      const demand = p.demand_mmcfd ?? 0;
      const supply = p.supply_mmcfd ?? 0;
      if (supply === 0 || (demand > 0 && supply < demand * 0.5)) {
        out.push({ name: p.name, disco: co.company_code, demand, supply });
      }
    }
  }
  return out.sort((a, b) => b.demand - a.demand);
}

export function okIndexDays(index: PetrobanglaIndex) {
  return index.days.filter((d) => d.parse_status === 'ok' && !isQuarantined(d.date));
}

export function latestOkDate(index: PetrobanglaIndex): string {
  const ok = okIndexDays(index).map((d) => d.date).sort();
  return ok.length ? ok[ok.length - 1] : ARCHIVE_BASELINE_DATE;
}

/** Map grid backlog date → nearest archive gas-day (exact or prior). */
export function resolveArchiveGasDay(
  gridDate: string,
  index: PetrobanglaIndex,
): { resolved: string | null; exact: boolean } {
  const okDates = okIndexDays(index)
    .map((d) => d.date)
    .sort();
  if (!okDates.length || gridDate < okDates[0]) {
    return { resolved: null, exact: false };
  }
  if (okDates.includes(gridDate)) {
    return { resolved: gridDate, exact: true };
  }
  let nearest: string | null = null;
  for (const d of okDates) {
    if (d <= gridDate) nearest = d;
    else break;
  }
  return { resolved: nearest, exact: false };
}