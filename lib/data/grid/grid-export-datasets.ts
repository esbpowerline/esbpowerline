import type { GridDailyData } from '@/lib/data/grid/types';
import type { GridExplorerTab } from '@/lib/grid-explorer-url';
import { macroTariffData } from '@/lib/data/macro/tariff';
import { nationalBudgetData } from '@/lib/data/macro/budget';
import { systemLossData } from '@/lib/data/macro/system-loss';
import { macroEconomicData, petrobanglaAuditedFinancials } from '@/lib/data/macro/economics';

/**
 * Registry of datasets a member can export. Pure & client-safe (no fs /
 * server-only): the export dialog imports labels + categories + column metadata,
 * while the server aggregator imports the extractors / static row builders.
 *
 * Two kinds:
 *  - `daily`  — one row per date in the selected range (from the PGCB archive).
 *  - `static` — a full-history series (financial / macro), independent of range.
 *
 * Values are exported raw (full precision) — a data export is for analysis, so
 * unlike the on-screen UI we do not truncate rates.
 */
export type GridExportDatasetKey =
  // daily grid
  | 'kpi'
  | 'generation'
  | 'regional'
  | 'imports'
  | 'hourly'
  | 'gas_production'
  | 'gas_distribution'
  | 'outages'
  // financial & macro (static, full history)
  | 'fin_tariff'
  | 'fin_budget'
  | 'fin_system_loss'
  | 'fin_economics'
  | 'fin_petrobangla'
  // petrobangla gas archive (range-scoped)
  | 'pb_timeline'
  | 'pb_fields'
  | 'pb_sgfl'
  | 'pb_distribution';

export type GridExportCategory = 'daily' | 'financial' | 'petrobangla';

export type ExportColumn = { key: string; header: string };
export type ExportRow = Record<string, string | number>;

/** Minimal structural shapes of the Petrobangla archive fields we read. */
export type PetrobanglaDayInput = {
  production?: {
    fields?: Array<{
      company_code?: string | null;
      field?: string | null;
      gas_mmcfd?: number | null;
      condensate_bbld?: number | null;
      producing_wells?: number | null;
      capacity_mmcfd?: number | null;
      pct_of_total_production?: number | null;
    }>;
  };
  sgfl?: {
    products?: {
      ngl?: number | null;
      cond?: number | null;
      lpg?: number | null;
      ms?: number | null;
      octane?: number | null;
      kerosene?: number | null;
      diesel?: number | null;
    };
  };
  distribution?: {
    companies?: Array<{
      company_code?: string | null;
      power_plants?: Array<{
        name?: string | null;
        demand_mmcfd?: number | null;
        supply_mmcfd?: number | null;
      }>;
    }>;
  };
};

export type PetrobanglaIndexDayInput = {
  date: string;
  grand_total_gas_mmcfd?: number | null;
  field_count?: number | null;
  plant_count?: number | null;
};

type DailyDataset = {
  kind: 'daily';
  key: GridExportDatasetKey;
  category: 'daily';
  label: string;
  sheetName: string;
  columns: ExportColumn[];
  extract: (data: GridDailyData, date: string) => ExportRow[];
};

type StaticDataset = {
  kind: 'static';
  key: GridExportDatasetKey;
  category: 'financial';
  label: string;
  sheetName: string;
  columns: ExportColumn[];
  rows: () => ExportRow[];
  /** True when rows() returns newest-first (affects tier clamping to "recent"). */
  latestFirst?: boolean;
};

type PetrobanglaDayDataset = {
  kind: 'petrobangla-day';
  key: GridExportDatasetKey;
  category: 'petrobangla';
  label: string;
  sheetName: string;
  columns: ExportColumn[];
  extract: (data: PetrobanglaDayInput, date: string) => ExportRow[];
};

type PetrobanglaIndexDataset = {
  kind: 'petrobangla-index';
  key: GridExportDatasetKey;
  category: 'petrobangla';
  label: string;
  sheetName: string;
  columns: ExportColumn[];
  extract: (day: PetrobanglaIndexDayInput) => ExportRow[];
};

export type GridExportDataset =
  | DailyDataset
  | StaticDataset
  | PetrobanglaDayDataset
  | PetrobanglaIndexDataset;

const num = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

/** Like `num`, but exports an empty cell for a genuinely unknown value.
 *  Coercing those to 0 would read as "the grid generated nothing". */
const numOrBlank = (value: number | null | undefined): number | string =>
  typeof value === 'number' && Number.isFinite(value) ? value : '';

// ---- daily grid datasets ---------------------------------------------------

const DAILY_DATASETS: Record<string, DailyDataset> = {
  kpi: {
    kind: 'daily',
    key: 'kpi',
    category: 'daily',
    label: 'Daily KPI Snapshot',
    sheetName: 'KPI Snapshot',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'day_peak_gen_mw', header: 'day_peak_gen_mw' },
      { key: 'evening_peak_gen_mw', header: 'evening_peak_gen_mw' },
      { key: 'day_peak_demand_mw', header: 'day_peak_demand_mw' },
      { key: 'evening_peak_demand_mw', header: 'evening_peak_demand_mw' },
      { key: 'min_gen_mw', header: 'min_gen_mw' },
      { key: 'max_gen_mw', header: 'max_gen_mw' },
      { key: 'total_energy_gen_mkwh', header: 'total_energy_gen_mkwh' },
      { key: 'total_energy_demand_mkwh', header: 'total_energy_demand_mkwh' },
      { key: 'total_energy_unserved_mkwh', header: 'total_energy_unserved_mkwh' },
      { key: 'max_temp_c', header: 'max_temp_c' },
      { key: 'gas_to_power_mmcfd', header: 'gas_to_power_mmcfd' },
      { key: 'avg_production_cost_tk_kwh', header: 'avg_production_cost_tk_kwh' },
      { key: 'total_daily_cost_bdt', header: 'total_daily_cost_bdt' },
    ],
    extract: (data, date) => {
      const s = data.systemStats;
      if (!s) return [];
      return [
        {
          date,
          day_peak_gen_mw: num(s.dayPeakGen),
          evening_peak_gen_mw: num(s.eveningPeakGen),
          day_peak_demand_mw: numOrBlank(s.dayPeakDemand),
          evening_peak_demand_mw: num(s.eveningPeakDemand),
          min_gen_mw: numOrBlank(s.minGen),
          max_gen_mw: numOrBlank(s.maxGen),
          total_energy_gen_mkwh: num(s.totalEnergyGen),
          total_energy_demand_mkwh: numOrBlank(s.totalEnergyDemand),
          total_energy_unserved_mkwh: numOrBlank(s.totalEnergyUnserved),
          max_temp_c: numOrBlank(s.maxTemp),
          gas_to_power_mmcfd: num(s.totalGasSuppliedPower),
          avg_production_cost_tk_kwh: num(s.avgProductionCost),
          total_daily_cost_bdt: num(s.totalDailyCost),
        },
      ];
    },
  },
  generation: {
    kind: 'daily',
    key: 'generation',
    category: 'daily',
    label: 'Generation Mix & Cost',
    sheetName: 'Generation Mix',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'fuel', header: 'fuel' },
      { key: 'generation_mkwh', header: 'generation_mkwh' },
      { key: 'generation_share_pct', header: 'generation_share_pct' },
      { key: 'unit_cost_tk_kwh', header: 'unit_cost_tk_kwh' },
      { key: 'daily_cost_bdt', header: 'daily_cost_bdt' },
      { key: 'cost_share_pct', header: 'cost_share_pct' },
    ],
    extract: (data, date) => {
      const gen = data.generationData ?? [];
      const totalGen = gen.reduce((s, g) => s + num(g.gen), 0);
      const totalCost = gen.reduce((s, g) => s + num(g.cost), 0);
      return gen.map((g) => ({
        date,
        fuel: g.name,
        generation_mkwh: num(g.gen),
        generation_share_pct: totalGen ? Number(((num(g.gen) / totalGen) * 100).toFixed(2)) : 0,
        unit_cost_tk_kwh: num(g.unitCost),
        daily_cost_bdt: num(g.cost),
        cost_share_pct: totalCost ? Number(((num(g.cost) / totalCost) * 100).toFixed(2)) : 0,
      }));
    },
  },
  regional: {
    kind: 'daily',
    key: 'regional',
    category: 'daily',
    label: 'Regional Demand & Load-Shedding',
    sheetName: 'Regional Demand',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'zone', header: 'zone' },
      { key: 'demand_mw', header: 'demand_mw' },
      { key: 'demand_share_pct', header: 'demand_share_pct' },
      { key: 'load_shed_mw', header: 'load_shed_mw' },
      { key: 'load_shed_pct', header: 'load_shed_pct' },
    ],
    extract: (data, date) => {
      const rows = data.regionalDemandData ?? [];
      const totalDemand = rows.reduce((s, r) => s + num(r.demand), 0);
      return rows.map((r) => ({
        date,
        zone: r.zone,
        demand_mw: num(r.demand),
        demand_share_pct: totalDemand ? Number(((num(r.demand) / totalDemand) * 100).toFixed(2)) : 0,
        load_shed_mw: num(r.loadShed),
        load_shed_pct: num(r.pct),
      }));
    },
  },
  imports: {
    kind: 'daily',
    key: 'imports',
    category: 'daily',
    label: 'Cross-Border Imports',
    sheetName: 'Border Imports',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'source', header: 'source' },
      { key: 'energy_mkwh', header: 'energy_mkwh' },
      { key: 'peak_flow_mw', header: 'peak_flow_mw' },
      { key: 'interconnector_type', header: 'interconnector_type' },
    ],
    extract: (data, date) =>
      (data.borderImportsData ?? []).map((b) => ({
        date,
        source: b.source,
        energy_mkwh: num(b.energy),
        peak_flow_mw: num(b.peakFlow),
        interconnector_type: b.type ?? '',
      })),
  },
  hourly: {
    kind: 'daily',
    key: 'hourly',
    category: 'daily',
    label: 'Hourly Load Curve',
    sheetName: 'Hourly Load',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'hour', header: 'hour' },
      { key: 'generation_mw', header: 'generation_mw' },
      { key: 'demand_mw', header: 'demand_mw' },
      { key: 'load_shed_mw', header: 'load_shed_mw' },
    ],
    extract: (data, date) =>
      (data.hourlyLoadData ?? []).map((h) => ({
        date,
        hour: h.time,
        generation_mw: num(h.generation),
        // Blank on every hour but the published evening peak. Exporting 0
        // would read as "no shedding this hour" rather than "not reported".
        demand_mw: numOrBlank(h.demand),
        load_shed_mw: numOrBlank(h.loadShed),
      })),
  },
  gas_production: {
    kind: 'daily',
    key: 'gas_production',
    category: 'daily',
    label: 'Gas Production',
    sheetName: 'Gas Production',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'company', header: 'company' },
      { key: 'fields', header: 'fields' },
      { key: 'gas_mmcfd', header: 'gas_mmcfd' },
      { key: 'condensate_bbl', header: 'condensate_bbl' },
      { key: 'share_pct', header: 'share_pct' },
    ],
    extract: (data, date) =>
      (data.gasProductionData ?? []).map((g) => ({
        date,
        company: g.company,
        fields: num(g.fields),
        gas_mmcfd: num(g.gas),
        condensate_bbl: num(g.condensate),
        share_pct: num(g.share),
      })),
  },
  gas_distribution: {
    kind: 'daily',
    key: 'gas_distribution',
    category: 'daily',
    label: 'Gas Distribution',
    sheetName: 'Gas Distribution',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'company', header: 'company' },
      { key: 'power_mmcfd', header: 'power_mmcfd' },
      { key: 'fertilizer_mmcfd', header: 'fertilizer_mmcfd' },
      { key: 'others_mmcfd', header: 'others_mmcfd' },
      { key: 'total_mmcfd', header: 'total_mmcfd' },
    ],
    extract: (data, date) =>
      (data.gasDistributionData ?? []).map((g) => ({
        date,
        company: g.company,
        power_mmcfd: num(g.power),
        fertilizer_mmcfd: num(g.fertilizer),
        others_mmcfd: num(g.others),
        total_mmcfd: num(g.total),
      })),
  },
  outages: {
    kind: 'daily',
    key: 'outages',
    category: 'daily',
    label: 'Transmission Outages',
    sheetName: 'Outages',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'event', header: 'event' },
      { key: 'load_type', header: 'load_type' },
      { key: 'plant', header: 'plant' },
      { key: 'reason', header: 'reason' },
    ],
    extract: (data, date) =>
      (data.dailyOutages ?? []).map((o) => ({
        date,
        event: o.time ?? '',
        load_type: o.load ?? '',
        plant: o.plant ?? '',
        reason: o.reason ?? o.full_desc ?? '',
      })),
  },
};

// ---- financial / macro datasets (static, full history) ---------------------

const STATIC_DATASETS: Record<string, StaticDataset> = {
  fin_tariff: {
    kind: 'static',
    key: 'fin_tariff',
    category: 'financial',
    label: 'Tariff vs Generation Cost',
    sheetName: 'Tariff vs Cost',
    columns: [
      { key: 'period', header: 'period' },
      { key: 'gen_cost_tk_kwh', header: 'gen_cost_tk_kwh' },
      { key: 'bulk_tariff_tk_kwh', header: 'bulk_tariff_tk_kwh' },
      { key: 'deficit_tk_kwh', header: 'deficit_tk_kwh' },
    ],
    rows: () =>
      macroTariffData.map((d) => ({
        period: d.year,
        gen_cost_tk_kwh: num(d.cost),
        bulk_tariff_tk_kwh: num(d.tariff),
        deficit_tk_kwh: Number((num(d.cost) - num(d.tariff)).toFixed(2)),
      })),
  },
  fin_budget: {
    kind: 'static',
    key: 'fin_budget',
    category: 'financial',
    label: 'National Power Budget',
    sheetName: 'Power Budget',
    columns: [
      { key: 'fiscal_year', header: 'fiscal_year' },
      { key: 'total_budget_crore_bdt', header: 'total_budget_crore_bdt' },
      { key: 'power_energy_allocation_crore_bdt', header: 'power_energy_allocation_crore_bdt' },
      { key: 'power_share_pct', header: 'power_share_pct' },
    ],
    rows: () =>
      nationalBudgetData.map((d) => ({
        fiscal_year: d.fiscal_year,
        total_budget_crore_bdt: num(d.total_budget_crore_tk),
        power_energy_allocation_crore_bdt: num(d.power_energy_allocation_crore_tk),
        power_share_pct: num(d.percentage),
      })),
  },
  fin_system_loss: {
    kind: 'static',
    key: 'fin_system_loss',
    category: 'financial',
    label: 'System Loss by Utility',
    sheetName: 'System Loss',
    latestFirst: true,
    columns: [
      { key: 'fiscal_year', header: 'fiscal_year' },
      { key: 'bpdb_pct', header: 'bpdb_pct' },
      { key: 'reb_pct', header: 'reb_pct' },
      { key: 'dpdc_pct', header: 'dpdc_pct' },
      { key: 'desco_pct', header: 'desco_pct' },
      { key: 'wzpdco_pct', header: 'wzpdco_pct' },
      { key: 'nesco_pct', header: 'nesco_pct' },
      { key: 'distribution_pct', header: 'distribution_pct' },
      { key: 'transmission_pct', header: 'transmission_pct' },
      { key: 'total_td_pct', header: 'total_td_pct' },
    ],
    rows: () =>
      systemLossData.map((d) => ({
        fiscal_year: d.fiscal_year,
        bpdb_pct: num(d.bpdb),
        reb_pct: num(d.reb),
        dpdc_pct: num(d.dpdc),
        desco_pct: num(d.desco),
        wzpdco_pct: d.wzpdco == null ? '' : num(d.wzpdco),
        nesco_pct: d.nesco == null ? '' : num(d.nesco),
        distribution_pct: num(d.distribution),
        transmission_pct: num(d.transmission),
        total_td_pct: num(d.total_td),
      })),
  },
  fin_economics: {
    kind: 'static',
    key: 'fin_economics',
    category: 'financial',
    label: 'Macro-Economic Indicators',
    sheetName: 'Macro Economics',
    columns: [
      { key: 'year', header: 'year' },
      { key: 'exchange_rate_bdt_usd', header: 'exchange_rate_bdt_usd' },
      { key: 'inflation_pct', header: 'inflation_pct' },
      { key: 'spot_lng_usd_mmbtu', header: 'spot_lng_usd_mmbtu' },
      { key: 'import_coal_usd_ton', header: 'import_coal_usd_ton' },
      { key: 'retail_diesel_bdt_l', header: 'retail_diesel_bdt_l' },
      { key: 'retail_octane_bdt_l', header: 'retail_octane_bdt_l' },
    ],
    rows: () =>
      macroEconomicData.map((d) => ({
        year: d.year,
        exchange_rate_bdt_usd: num(d.exchangeRate),
        inflation_pct: num(d.inflation),
        spot_lng_usd_mmbtu: num(d.spotLng),
        import_coal_usd_ton: num(d.importCoal),
        retail_diesel_bdt_l: num(d.retailDiesel),
        retail_octane_bdt_l: num(d.retailOctane),
      })),
  },
  fin_petrobangla: {
    kind: 'static',
    key: 'fin_petrobangla',
    category: 'financial',
    label: 'Petrobangla Audited Financials',
    sheetName: 'Petrobangla Financials',
    columns: [
      { key: 'fiscal_year', header: 'fiscal_year' },
      { key: 'revenue_crore_bdt', header: 'revenue_crore_bdt' },
      { key: 'lng_cost_crore_bdt', header: 'lng_cost_crore_bdt' },
      { key: 'net_profit_crore_bdt', header: 'net_profit_crore_bdt' },
    ],
    rows: () =>
      petrobanglaAuditedFinancials.map((d) => ({
        fiscal_year: d.year,
        revenue_crore_bdt: num(d.revenue),
        lng_cost_crore_bdt: num(d.lngCost),
        net_profit_crore_bdt: num(d.netProfit),
      })),
  },
};

// ---- petrobangla gas archive (range-scoped) --------------------------------

const PETROBANGLA_DATASETS: Record<string, PetrobanglaDayDataset | PetrobanglaIndexDataset> = {
  pb_timeline: {
    kind: 'petrobangla-index',
    key: 'pb_timeline',
    category: 'petrobangla',
    label: 'Petrobangla Gas Totals (daily)',
    sheetName: 'PB Gas Totals',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'grand_total_gas_mmcfd', header: 'grand_total_gas_mmcfd' },
      { key: 'producing_fields', header: 'producing_fields' },
      { key: 'power_plants', header: 'power_plants' },
    ],
    extract: (day) => [
      {
        date: day.date,
        grand_total_gas_mmcfd: num(day.grand_total_gas_mmcfd),
        producing_fields: num(day.field_count),
        power_plants: num(day.plant_count),
      },
    ],
  },
  pb_fields: {
    kind: 'petrobangla-day',
    key: 'pb_fields',
    category: 'petrobangla',
    label: 'Petrobangla Gas Fields (daily)',
    sheetName: 'PB Gas Fields',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'company', header: 'company' },
      { key: 'field', header: 'field' },
      { key: 'gas_mmcfd', header: 'gas_mmcfd' },
      { key: 'condensate_bbld', header: 'condensate_bbld' },
      { key: 'producing_wells', header: 'producing_wells' },
      { key: 'capacity_mmcfd', header: 'capacity_mmcfd' },
      { key: 'production_share_pct', header: 'production_share_pct' },
    ],
    extract: (data, date) =>
      (data.production?.fields ?? []).map((f) => ({
        date,
        company: f.company_code ?? '',
        field: f.field ?? '',
        gas_mmcfd: num(f.gas_mmcfd),
        condensate_bbld: num(f.condensate_bbld),
        producing_wells: num(f.producing_wells),
        capacity_mmcfd: num(f.capacity_mmcfd),
        production_share_pct: num(f.pct_of_total_production),
      })),
  },
  pb_sgfl: {
    kind: 'petrobangla-day',
    key: 'pb_sgfl',
    category: 'petrobangla',
    label: 'SGFL Petroleum Products (daily)',
    sheetName: 'SGFL Products',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'ngl_bbld', header: 'ngl_bbld' },
      { key: 'condensate_bbld', header: 'condensate_bbld' },
      { key: 'lpg_kg', header: 'lpg_kg' },
      { key: 'ms_bbld', header: 'ms_bbld' },
      { key: 'octane_bbld', header: 'octane_bbld' },
      { key: 'kerosene_bbld', header: 'kerosene_bbld' },
      { key: 'diesel_bbld', header: 'diesel_bbld' },
    ],
    extract: (data, date) => {
      const p = data.sgfl?.products;
      if (!p) return [];
      return [
        {
          date,
          ngl_bbld: num(p.ngl),
          condensate_bbld: num(p.cond),
          lpg_kg: num(p.lpg),
          ms_bbld: num(p.ms),
          octane_bbld: num(p.octane),
          kerosene_bbld: num(p.kerosene),
          diesel_bbld: num(p.diesel),
        },
      ];
    },
  },
  pb_distribution: {
    kind: 'petrobangla-day',
    key: 'pb_distribution',
    category: 'petrobangla',
    label: 'Power-Plant Gas Supply (daily)',
    sheetName: 'PB Plant Supply',
    columns: [
      { key: 'date', header: 'date' },
      { key: 'company', header: 'company' },
      { key: 'power_plant', header: 'power_plant' },
      { key: 'demand_mmcfd', header: 'demand_mmcfd' },
      { key: 'supply_mmcfd', header: 'supply_mmcfd' },
    ],
    extract: (data, date) =>
      (data.distribution?.companies ?? []).flatMap((c) =>
        (c.power_plants ?? []).map((p) => ({
          date,
          company: c.company_code ?? '',
          power_plant: p.name ?? '',
          demand_mmcfd: num(p.demand_mmcfd),
          supply_mmcfd: num(p.supply_mmcfd),
        })),
      ),
  },
};

export const GRID_EXPORT_DATASETS: Record<GridExportDatasetKey, GridExportDataset> = {
  ...DAILY_DATASETS,
  ...STATIC_DATASETS,
  ...PETROBANGLA_DATASETS,
} as Record<GridExportDatasetKey, GridExportDataset>;

export const ALL_DATASET_KEYS: GridExportDatasetKey[] = [
  'kpi',
  'generation',
  'regional',
  'imports',
  'hourly',
  'gas_production',
  'gas_distribution',
  'outages',
  'fin_tariff',
  'fin_budget',
  'fin_system_loss',
  'fin_economics',
  'fin_petrobangla',
  'pb_timeline',
  'pb_fields',
  'pb_sgfl',
  'pb_distribution',
];

/** Category groupings for the export picker UI. */
export const GRID_EXPORT_CATEGORIES: Array<{
  id: GridExportCategory;
  label: string;
  hint: string;
  keys: GridExportDatasetKey[];
}> = [
  {
    id: 'daily',
    label: 'Daily Grid',
    hint: 'Per-day data for your selected range',
    keys: ['kpi', 'generation', 'regional', 'imports', 'hourly', 'gas_production', 'gas_distribution', 'outages'],
  },
  {
    id: 'petrobangla',
    label: 'Petrobangla Gas Archive',
    hint: 'Daily gas production & supply for your selected range',
    keys: ['pb_timeline', 'pb_fields', 'pb_sgfl', 'pb_distribution'],
  },
  {
    id: 'financial',
    label: 'Financials & Macro',
    hint: 'Full-history annual series (range does not apply)',
    keys: ['fin_tariff', 'fin_budget', 'fin_system_loss', 'fin_economics', 'fin_petrobangla'],
  },
];

export function datasetCategory(key: GridExportDatasetKey): GridExportCategory {
  return GRID_EXPORT_DATASETS[key].category;
}

/** Petrobangla datasets are read from a separate archive with its own catalog. */
export function isPetrobanglaKey(key: GridExportDatasetKey): boolean {
  return GRID_EXPORT_DATASETS[key].category === 'petrobangla';
}

const COLUMN_UNIT_TOKENS: Record<string, string> = {
  mw: 'MW',
  mkwh: 'MKWh',
  mmcfd: 'MMCFD',
  bdt: 'BDT',
  usd: 'USD',
  pct: '%',
  kwh: 'KWh',
  tk: 'Tk',
  bbl: 'bbl',
  bbld: 'BBLD',
  mmbtu: 'MMBtu',
  ton: 'ton',
  kg: 'Kg',
  c: '°C',
  ngl: 'NGL',
  lpg: 'LPG',
  ms: 'MS',
  td: 'T&D',
  bpdb: 'BPDB',
  reb: 'REB',
  dpdc: 'DPDC',
  desco: 'DESCO',
  wzpdco: 'WZPDCO',
  nesco: 'NESCO',
};

/** Human-readable label for a raw column header (used by the picker UI). */
export function columnLabel(header: string): string {
  const words = header.split('_').map((p) => COLUMN_UNIT_TOKENS[p] ?? p.charAt(0).toUpperCase() + p.slice(1));
  return words
    .join(' ')
    .replace('Tk KWh', 'Tk/KWh')
    .replace('BDT USD', 'BDT/USD')
    .replace('BDT L', 'BDT/L')
    .replace('USD MMBtu', 'USD/MMBtu')
    .replace('USD ton', 'USD/ton');
}

export function isDatasetKey(value: string): value is GridExportDatasetKey {
  return (ALL_DATASET_KEYS as string[]).includes(value);
}

/** Which datasets the "current view" of a given Explorer tab maps to. */
export function tabToDatasetKeys(tab: GridExplorerTab): GridExportDatasetKey[] {
  switch (tab) {
    case 'gen':
      return ['generation'];
    case 'renewables':
      return ['generation'];
    case 'gas':
      return ['gas_production', 'gas_distribution'];
    case 'imports':
      return ['imports'];
    case 'regional':
      return ['regional'];
    case 'transmission':
      return ['outages', 'hourly', 'fin_system_loss'];
    // Per-station detail lives in its own lazy-loaded file, so the closest
    // exportable equivalent is the hourly system curve plus the fuel mix.
    case 'plants':
      return ['hourly', 'generation'];
    case 'overview':
      return ['kpi', 'generation'];
    case 'macro':
      return ['fin_tariff', 'fin_budget', 'fin_economics', 'fin_petrobangla'];
    default:
      return ['kpi', 'generation'];
  }
}

/** Parse the `datasets` query param — 'all' or a comma list of known keys. */
export function parseDatasetKeys(raw: string | null): GridExportDatasetKey[] {
  if (!raw || raw === 'all') return [...ALL_DATASET_KEYS];
  const keys = raw
    .split(',')
    .map((s) => s.trim())
    .filter(isDatasetKey);
  const unique = Array.from(new Set(keys));
  return ALL_DATASET_KEYS.filter((k) => unique.includes(k));
}

/**
 * Parse per-dataset column selection from `col_<key>=a,b,c` params. Returns a map
 * of dataset key → allowed column keys. Datasets absent from the map export all
 * columns. Only columns that exist on the dataset are kept.
 */
export function parseColumnSelection(
  params: URLSearchParams,
  keys: GridExportDatasetKey[],
): Partial<Record<GridExportDatasetKey, string[]>> {
  const out: Partial<Record<GridExportDatasetKey, string[]>> = {};
  for (const key of keys) {
    const raw = params.get(`col_${key}`);
    if (!raw) continue;
    const wanted = new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
    const valid = GRID_EXPORT_DATASETS[key].columns.map((c) => c.key).filter((c) => wanted.has(c));
    if (valid.length) out[key] = valid;
  }
  return out;
}
