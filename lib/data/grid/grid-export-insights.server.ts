import 'server-only';

import type { DatasetTable } from '@/lib/data/grid/grid-export.server';
import type { ExportRow } from '@/lib/data/grid/grid-export-datasets';
import {
  FUEL_COLORS,
  SERIES_BLUE,
  SERIES_ORANGE,
  GOOD,
  CRITICAL,
  type BarDatum,
} from '@/lib/data/grid/grid-export-charts.server';
import type { IconName } from '@/lib/data/grid/grid-export-icons.server';

/**
 * The shared analysis layer: computed findings and executive-summary metrics
 * derived from the exported rows. Consumed by BOTH the PDF report and the Excel
 * workbook, so every format carries the same depth.
 */

export const rowNum = (r: ExportRow, k: string): number => (typeof r[k] === 'number' ? (r[k] as number) : 0);
export const sumBy = (rows: ExportRow[], k: string) => rows.reduce((s, r) => s + rowNum(r, k), 0);
export const avgBy = (rows: ExportRow[], k: string) => (rows.length ? sumBy(rows, k) / rows.length : 0);

export function aggSum(rows: ExportRow[], groupKey: string, valueKey: string): BarDatum[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[groupKey] ?? '');
    m.set(k, (m.get(k) ?? 0) + rowNum(r, valueKey));
  }
  return [...m.entries()].map(([label, value]) => ({ label, value }));
}

export function aggAvg(rows: ExportRow[], groupKey: string, valueKey: string): BarDatum[] {
  const sum = new Map<string, number>();
  const count = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[groupKey] ?? '');
    sum.set(k, (sum.get(k) ?? 0) + rowNum(r, valueKey));
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  return [...sum.entries()].map(([label, s]) => ({ label, value: s / (count.get(label) || 1) }));
}

export const fmt = (v: number, d = 1) => v.toLocaleString('en-US', { maximumFractionDigits: d });
export const fmtCr = (bdt: number) => `${(bdt / 1e7).toLocaleString('en-US', { maximumFractionDigits: 1 })} Cr`;
const n0 = (v: number) => Math.round(v).toLocaleString('en-US');

const FALLBACK_COLORS = [SERIES_BLUE, SERIES_ORANGE, '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

// ---- computed insights -----------------------------------------------------

export function computeInsights(table: DatasetTable): string[] {
  const rows = table.rows;
  if (rows.length === 0) return [];
  const out: string[] = [];

  switch (table.key) {
    case 'kpi': {
      const peak = rows.reduce((a, b) => (rowNum(b, 'evening_peak_gen_mw') > rowNum(a, 'evening_peak_gen_mw') ? b : a));
      out.push(`Evening peak generation reached ${n0(rowNum(peak, 'evening_peak_gen_mw'))} MW on ${peak.date}.`);
      const unserved = sumBy(rows, 'total_energy_unserved_mkwh');
      const demand = sumBy(rows, 'total_energy_demand_mkwh');
      if (demand > 0) {
        out.push(`Unserved energy totalled ${fmt(unserved, 2)} MKWh — ${fmt((unserved / demand) * 100, 2)}% of demand across the range.`);
      }
      if (rows.length > 1) {
        const first = rowNum(rows[0], 'avg_production_cost_tk_kwh');
        const last = rowNum(rows[rows.length - 1], 'avg_production_cost_tk_kwh');
        if (first > 0) {
          const pct = ((last - first) / first) * 100;
          out.push(`Avg production cost moved from ${fmt(first, 2)} to ${fmt(last, 2)} Tk/KWh (${pct >= 0 ? '+' : ''}${fmt(pct, 1)}%).`);
        }
      }
      break;
    }
    case 'generation': {
      const byFuel = aggSum(rows, 'fuel', 'generation_mkwh').sort((a, b) => b.value - a.value);
      const totalGen = byFuel.reduce((s, d) => s + d.value, 0);
      if (byFuel[0] && totalGen > 0) {
        out.push(`${byFuel[0].label} led generation with ${fmt(byFuel[0].value, 0)} MKWh — ${fmt((byFuel[0].value / totalGen) * 100, 1)}% of the mix.`);
      }
      const withGen = aggAvg(rows.filter((r) => rowNum(r, 'generation_mkwh') > 0), 'fuel', 'unit_cost_tk_kwh')
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value);
      if (withGen.length >= 2) {
        const hi = withGen[0];
        const lo = withGen[withGen.length - 1];
        out.push(`${hi.label} was the costliest source at ${fmt(hi.value, 2)} Tk/KWh — ${fmt(hi.value / Math.max(lo.value, 0.01), 1)}x the ${lo.label.toLowerCase()} rate.`);
      }
      break;
    }
    case 'regional': {
      const shed = aggAvg(rows, 'zone', 'load_shed_mw').sort((a, b) => b.value - a.value);
      const pct = new Map(aggAvg(rows, 'zone', 'load_shed_pct').map((d) => [d.label, d.value]));
      if (shed[0] && shed[0].value > 0) {
        out.push(`${shed[0].label} bore the heaviest load-shedding — avg ${fmt(shed[0].value, 0)} MW (${fmt(pct.get(shed[0].label) ?? 0, 1)}% of its demand).`);
      }
      const zero = shed.filter((d) => d.value === 0).length;
      if (zero > 0) out.push(`${zero} of ${shed.length} zones recorded zero load-shedding over the range.`);
      break;
    }
    case 'imports': {
      const total = sumBy(rows, 'energy_mkwh');
      const bySource = aggSum(rows, 'source', 'energy_mkwh').sort((a, b) => b.value - a.value);
      if (bySource[0] && total > 0) {
        out.push(`Cross-border imports delivered ${fmt(total, 0)} MKWh, led by ${bySource[0].label} (${fmt((bySource[0].value / total) * 100, 1)}%).`);
      }
      break;
    }
    case 'hourly': {
      const eve = rows.filter((r) => Number(String(r.hour).slice(0, 2)) >= 18);
      const day = rows.filter((r) => {
        const h = Number(String(r.hour).slice(0, 2));
        return h >= 6 && h < 18;
      });
      const eveAvg = avgBy(eve, 'demand_mw');
      const dayAvg = avgBy(day, 'demand_mw');
      if (dayAvg > 0) out.push(`Evening demand ran ${fmt(((eveAvg - dayAvg) / dayAvg) * 100, 1)}% above the daytime average.`);
      const shedHours = rows.filter((r) => rowNum(r, 'load_shed_mw') > 0).length;
      if (shedHours > 0) out.push(`Load-shedding appeared in ${shedHours} of ${rows.length} recorded hours.`);
      break;
    }
    case 'gas_production': {
      const byCo = aggSum(rows, 'company', 'gas_mmcfd').sort((a, b) => b.value - a.value);
      const total = byCo.reduce((s, d) => s + d.value, 0);
      const lng = byCo.find((d) => d.label.includes('RPGCL'));
      if (lng && total > 0) {
        out.push(`Imported LNG (RPGCL) supplied ${fmt((lng.value / total) * 100, 1)}% of gas; ${byCo[0].label.split(' (')[0]} was the largest single source.`);
      }
      break;
    }
    case 'gas_distribution': {
      const power = sumBy(rows, 'power_mmcfd');
      const total = sumBy(rows, 'total_mmcfd');
      const byCo = aggSum(rows, 'company', 'total_mmcfd').sort((a, b) => b.value - a.value);
      if (total > 0 && byCo[0]) {
        out.push(`${fmt((power / total) * 100, 1)}% of distributed gas went to power generation; ${byCo[0].label.split(' (')[0]} handled the largest volume.`);
      }
      break;
    }
    case 'outages': {
      const sched = rows.filter((r) => /Scheduled/i.test(String(r.event))).length;
      const forced = rows.filter((r) => /Forced/i.test(String(r.event))).length;
      const tripped = rows.filter((r) => /Tripped/i.test(String(r.event))).length;
      out.push(`${rows.length} grid events logged — ${sched} scheduled shutdowns, ${forced} forced, ${tripped} trips.`);
      const byDay = aggSum(rows.map((r) => ({ ...r, one: 1 })), 'date', 'one').sort((a, b) => b.value - a.value);
      if (byDay[0]) out.push(`Busiest day was ${byDay[0].label} with ${fmt(byDay[0].value, 0)} events.`);
      break;
    }
    case 'fin_tariff': {
      const first = rows[0];
      const last = rows[rows.length - 1];
      out.push(`The cost-tariff deficit stands at ${fmt(rowNum(last, 'deficit_tk_kwh'), 2)} Tk/KWh (${last.period}), vs ${fmt(rowNum(first, 'deficit_tk_kwh'), 2)} in ${first.period}.`);
      break;
    }
    case 'fin_budget': {
      const last = rows[rows.length - 1];
      const prev = rows[rows.length - 2];
      let line = `${last.fiscal_year} power allocation: ${n0(rowNum(last, 'power_energy_allocation_crore_bdt'))} Cr BDT (${fmt(rowNum(last, 'power_share_pct'), 2)}% of the national budget)`;
      if (prev) {
        const dir = rowNum(last, 'power_energy_allocation_crore_bdt') < rowNum(prev, 'power_energy_allocation_crore_bdt') ? 'down' : 'up';
        line += `, ${dir} from ${n0(rowNum(prev, 'power_energy_allocation_crore_bdt'))} Cr the prior year.`;
      } else line += '.';
      out.push(line);
      break;
    }
    case 'fin_system_loss': {
      const latest = rows[0];
      const earliest = rows[rows.length - 1];
      out.push(`Total T&D loss stands at ${fmt(rowNum(latest, 'total_td_pct'), 2)}% (${latest.fiscal_year}), improved from ${fmt(rowNum(earliest, 'total_td_pct'), 2)}% in ${earliest.fiscal_year}.`);
      break;
    }
    case 'fin_economics': {
      const first = rows[0];
      const last = rows[rows.length - 1];
      out.push(`The taka moved from ${fmt(rowNum(first, 'exchange_rate_bdt_usd'), 1)} to ${fmt(rowNum(last, 'exchange_rate_bdt_usd'), 1)} BDT/USD; latest inflation ${fmt(rowNum(last, 'inflation_pct'), 2)}%.`);
      break;
    }
    case 'fin_petrobangla': {
      const last = rows[rows.length - 1];
      const profit = rowNum(last, 'net_profit_crore_bdt');
      out.push(
        profit < 0
          ? `${last.fiscal_year}: net loss of ${n0(Math.abs(profit))} Cr BDT as LNG costs (${n0(rowNum(last, 'lng_cost_crore_bdt'))} Cr) outpaced revenue.`
          : `${last.fiscal_year}: net profit of ${n0(profit)} Cr BDT on ${n0(rowNum(last, 'revenue_crore_bdt'))} Cr revenue.`,
      );
      break;
    }
    case 'pb_timeline': {
      const vals = rows.map((r) => rowNum(r, 'grand_total_gas_mmcfd')).filter((v) => v > 0);
      if (vals.length) {
        out.push(`National gas production averaged ${fmt(avgBy(rows, 'grand_total_gas_mmcfd'), 0)} MMCFD (range ${fmt(Math.min(...vals), 0)} to ${fmt(Math.max(...vals), 0)}).`);
      }
      break;
    }
    case 'pb_fields': {
      const byField = aggAvg(rows, 'field', 'gas_mmcfd').sort((a, b) => b.value - a.value);
      const fields = new Set(rows.map((r) => r.field)).size;
      if (byField[0]) out.push(`${byField[0].label} was the top field at avg ${fmt(byField[0].value, 0)} MMCFD across ${fields} producing fields.`);
      break;
    }
    case 'pb_sgfl': {
      out.push(`SGFL output averaged ${fmt(avgBy(rows, 'diesel_bbld'), 0)} BBLD diesel and ${fmt(avgBy(rows, 'condensate_bbld'), 0)} BBLD condensate per day.`);
      break;
    }
    case 'pb_distribution': {
      const demand = sumBy(rows, 'demand_mmcfd');
      const supply = sumBy(rows, 'supply_mmcfd');
      const byPlant = aggAvg(rows, 'power_plant', 'supply_mmcfd').sort((a, b) => b.value - a.value);
      if (demand > 0 && byPlant[0]) {
        out.push(`Plant gas supply met ${fmt((supply / demand) * 100, 1)}% of stated demand; ${byPlant[0].label} drew the largest allocation.`);
      }
      break;
    }
  }
  return out.slice(0, 2);
}

// ---- executive summary derivation ------------------------------------------

export type SummaryTile = {
  icon: IconName;
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  spark?: number[];
};

export function computeSummary(tables: DatasetTable[]) {
  const byKey = new Map(tables.map((t) => [t.key, t]));
  const kpi = byKey.get('kpi');
  const generation = byKey.get('generation');

  const tiles: SummaryTile[] = [];
  if (kpi && kpi.rows.length > 0) {
    const rows = kpi.rows;
    const peak = rows.reduce((a, b) => (rowNum(b, 'evening_peak_gen_mw') > rowNum(a, 'evening_peak_gen_mw') ? b : a));
    tiles.push({
      icon: 'zap',
      label: 'Peak Generation',
      value: `${n0(rowNum(peak, 'evening_peak_gen_mw'))} MW`,
      sub: `evening peak · ${peak.date}`,
    });
    tiles.push({
      icon: 'gauge',
      label: 'Energy Generated',
      value: `${fmt(sumBy(rows, 'total_energy_gen_mkwh'), 0)} MKWh`,
      sub: `${rows.length} day${rows.length === 1 ? '' : 's'} total`,
      spark: rows.map((r) => rowNum(r, 'total_energy_gen_mkwh')),
    });
    const unserved = sumBy(rows, 'total_energy_unserved_mkwh');
    const demand = sumBy(rows, 'total_energy_demand_mkwh');
    tiles.push({
      icon: 'alert',
      label: 'Energy Unserved',
      value: `${fmt(unserved, 2)} MKWh`,
      sub: demand > 0 ? `${fmt((unserved / demand) * 100, 2)}% of demand` : '',
      subColor: unserved > 0 ? CRITICAL : GOOD,
    });
    const first = rowNum(rows[0], 'avg_production_cost_tk_kwh');
    const last = rowNum(rows[rows.length - 1], 'avg_production_cost_tk_kwh');
    const costDelta = rows.length > 1 && first > 0 ? ((last - first) / first) * 100 : null;
    tiles.push({
      icon: 'trend',
      label: 'Avg Production Cost',
      value: `${fmt(avgBy(rows, 'avg_production_cost_tk_kwh'), 2)} Tk/KWh`,
      sub: costDelta === null ? 'range average' : `${costDelta >= 0 ? '+' : ''}${fmt(costDelta, 1)}% over range`,
      subColor: costDelta === null ? undefined : costDelta > 0 ? CRITICAL : GOOD,
      spark: rows.map((r) => rowNum(r, 'avg_production_cost_tk_kwh')),
    });
    tiles.push({
      icon: 'flame',
      label: 'Gas to Power',
      value: `${fmt(avgBy(rows, 'gas_to_power_mmcfd'), 0)} MMCFD`,
      sub: 'daily average',
    });
    tiles.push({
      icon: 'bank',
      label: 'Total Fuel Cost',
      value: `${fmtCr(sumBy(rows, 'total_daily_cost_bdt'))} BDT`,
      sub: 'gross production cost',
    });
  }

  let mix: BarDatum[] | null = null;
  let mixTotal = 0;
  if (generation && generation.rows.length > 0) {
    const data = aggSum(generation.rows, 'fuel', 'generation_mkwh')
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((d, i) => ({ ...d, color: FUEL_COLORS[d.label] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
    if (data.length) {
      mix = data;
      mixTotal = data.reduce((s, d) => s + d.value, 0);
    }
  }

  const highlights: string[] = [];
  for (const t of tables) {
    if (highlights.length >= 6) break;
    const ins = computeInsights(t);
    if (ins[0]) highlights.push(ins[0]);
  }

  return { tiles, mix, mixTotal, highlights };
}
