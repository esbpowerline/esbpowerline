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
    latestDate: latest.report.report_date_end,
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

export function liveWeekTimelinePoints(bundle: PetrobanglaLiveWeekBundle) {
  return bundle.days.map((d) => {
    const gt = getDistributionGrandTotal(d);
    return {
      date: d.report.report_date_end,
      label: d.report.report_date_label,
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