import { getDistributionGrandTotal, getFieldGas, getRpgclGas, powerFulfillmentPct, stressedPlants } from './compute';
import type { LiveWeekKpis, PetrobanglaDaily, PetrobanglaLiveWeekBundle } from './types';

export function computeLiveWeekKpis(bundle: PetrobanglaLiveWeekBundle): LiveWeekKpis {
  const days = bundle.days;
  const latest = days[days.length - 1];
  const prev = days.length > 1 ? days[days.length - 2] : null;

  const gases = days.map((d) => d.production.grand_total.gas_mmcfd);
  const weekMin = Math.min(...gases);
  const weekMax = Math.max(...gases);
  const latestGas = latest.production.grand_total.gas_mmcfd;
  const gt = getDistributionGrandTotal(latest);
  const lng = getRpgclGas(latest.production.fields);
  const bibiyana = getFieldGas(latest.production.fields, 'Bibiyana');
  const bibField = latest.production.fields.find((f) => f.field === 'Bibiyana');

  return {
    latestGas,
    latestLabel: latest.report.report_date_label,
    latestDate: gasDayStart(latest),
    latestGasDelta: prev ? latestGas - prev.production.grand_total.gas_mmcfd : null,
    weekAvgGas: gases.reduce((a, b) => a + b, 0) / gases.length,
    powerFulfillmentPct: powerFulfillmentPct(latest),
    powerSupply: gt.power_supply_mmcfd,
    powerDemand: gt.power_demand_mmcfd,
    lngSharePct: latestGas > 0 ? (lng / latestGas) * 100 : 0,
    lngGasMmcfd: lng,
    weekVolatility: weekMax - weekMin,
    weekMinGas: weekMin,
    weekMaxGas: weekMax,
    bibiyanaGas: bibiyana,
    bibiyanaWells: bibField?.producing_wells ?? 0,
  };
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * The day a gas report belongs to: the start of its 08:00–08:00 window.
 *
 * The rolling week used to key on `report_date_end`, so the newest report read
 * as 27 Aug on this panel and 26 Aug on the National Timeline — one day, two
 * dates, depending on which card you looked at. Everything else in the archive
 * keys on the start: the filename, `_index.json`, `timeline-summary.json` and
 * `petrobangla-day.server.ts`'s `windowStart`. This makes the panel agree.
 *
 * `gas_day_start` first, for the reason `windowStart` gives: it comes from the
 * "08:00 hrs to 08:00 hrs" line that defines the window, where
 * `report_date_start` is transcribed from the letterhead and Petrobangla
 * mistypes that on 89 of the 2,297 archived files. The header is the fallback
 * only, for a document old enough not to carry the window at all.
 */
export function gasDayStart(day: PetrobanglaDaily): string {
  return day.report.gas_day_start ?? day.report.report_date_start;
}

/** X-axis label — disambiguate when Petrobangla reuses the same gas-day label on adjacent files. */
export function formatLiveWeekAxisLabel(date: string, label?: string, duplicateGasLabel = false): string {
  if (!duplicateGasLabel && label) {
    return label.split(',')[0]?.trim() ?? date.slice(5);
  }
  const [, m, d] = date.split('-').map(Number);
  if (!m || !d) return date.slice(5);
  return `${d} ${MONTH_SHORT[m - 1] ?? ''}`.trim();
}

export function liveWeekTimelinePoints(bundle: PetrobanglaLiveWeekBundle) {
  const rawLabels = bundle.days.map((d) => d.report.report_date_label?.split(',')[0]?.trim() ?? '');
  const labelCounts = rawLabels.reduce<Record<string, number>>((acc, l) => {
    if (l) acc[l] = (acc[l] ?? 0) + 1;
    return acc;
  }, {});

  return bundle.days.map((d) => {
    const gt = getDistributionGrandTotal(d);
    const gasLabel = d.report.report_date_label?.split(',')[0]?.trim() ?? '';
    const duplicateGasLabel = Boolean(gasLabel && (labelCounts[gasLabel] ?? 0) > 1);
    return {
      date: gasDayStart(d),
      label: d.report.report_date_label,
      axisLabel: formatLiveWeekAxisLabel(gasDayStart(d), d.report.report_date_label, duplicateGasLabel),
      totalGas: d.production.grand_total.gas_mmcfd,
      powerDemand: gt.power_demand_mmcfd,
      powerSupply: gt.power_supply_mmcfd,
      fulfillment: powerFulfillmentPct(d),
    };
  });
}

export function fieldSparklines(bundle: PetrobanglaLiveWeekBundle): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const day of bundle.days) {
    for (const f of day.production.fields) {
      const arr = map.get(f.field) ?? [];
      arr.push(f.gas_mmcfd);
      map.set(f.field, arr);
    }
  }
  return map;
}

export function dayOverDayDelta(left: PetrobanglaDaily, right: PetrobanglaDaily) {
  const lngL = getRpgclGas(left.production.fields);
  const lngR = getRpgclGas(right.production.fields);
  const fulL = powerFulfillmentPct(left);
  const fulR = powerFulfillmentPct(right);

  const movers: { field: string; delta: number }[] = [];
  const lm = new Map(left.production.fields.map((f) => [f.field, f.gas_mmcfd]));
  for (const f of right.production.fields) {
    movers.push({ field: f.field, delta: f.gas_mmcfd - (lm.get(f.field) ?? 0) });
  }
  movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    gasDelta: right.production.grand_total.gas_mmcfd - left.production.grand_total.gas_mmcfd,
    lngDelta: lngR - lngL,
    bibiyanaDelta:
      getFieldGas(right.production.fields, 'Bibiyana') -
      getFieldGas(left.production.fields, 'Bibiyana'),
    fulfillmentDelta: fulR - fulL,
    topMovers: movers.slice(0, 5),
  };
}

export { stressedPlants };