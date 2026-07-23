import 'server-only';

import type { ReactNode } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { DatasetTable, ExportMeta } from '@/lib/data/grid/grid-export.server';
import {
  GRID_EXPORT_DATASETS,
  type GridExportDatasetKey,
  type ExportRow,
} from '@/lib/data/grid/grid-export-datasets';
import {
  HBarChart,
  LineChart,
  ColumnChart,
  DonutChart,
  Sparkline,
  FUEL_COLORS,
  SERIES_BLUE,
  SERIES_ORANGE,
  GOOD,
  CRITICAL,
  type BarDatum,
} from '@/lib/data/grid/grid-export-charts.server';
import { Icon, type IconName } from '@/lib/data/grid/grid-export-icons.server';
import { F, FM, FB } from '@/lib/data/grid/grid-export-fonts.server';
import {
  computeInsights,
  computeSummary,
  rowNum,
  aggSum,
  aggAvg,
  fmt,
  type SummaryTile,
} from '@/lib/data/grid/grid-export-insights.server';

// Never hyphen-break words mid-cell ("MM- CFD"); wrap at word boundaries only.
Font.registerHyphenationCallback((word) => [word]);

/** Rows per dataset shown in the PDF report; the full data lives in CSV/Excel. */
export const PDF_MAX_ROWS_PER_DATASET = 80;

// Editorial ink — one ink, one accent; hairlines carry the structure.
const INK = '#111827';
const SECONDARY = '#475569';
const MUTED = '#94a3b8';
const HAIR = '#e5e7eb';
const RULE = '#111827';
const ACCENT = '#2563eb';
const WARM = '#b45309';

const SECTION_ICONS: Record<GridExportDatasetKey, IconName> = {
  kpi: 'gauge',
  generation: 'zap',
  regional: 'map',
  imports: 'globe',
  hourly: 'clock',
  gas_production: 'flame',
  gas_distribution: 'network',
  outages: 'alert',
  fin_tariff: 'trend',
  fin_budget: 'bank',
  fin_system_loss: 'percent',
  fin_economics: 'globe',
  fin_petrobangla: 'factory',
  pb_timeline: 'flame',
  pb_fields: 'layers',
  pb_sgfl: 'droplet',
  pb_distribution: 'factory',
};

const CATEGORY_SOURCE: Record<string, string> = {
  daily: 'PGCB Daily Progress Reports / NLDC',
  petrobangla: 'Petrobangla daily gas production & supply reports',
  financial: 'BPDB, BERC, Ministry of Finance & audited financial statements',
};

/** Decorative category accents — distinct in colour AND as grey values in B&W print. */
const CATEGORY_ACCENT: Record<string, string> = {
  daily: '#2563eb',
  petrobangla: '#ea580c',
  financial: '#7c3aed',
};

/** Long tables render denser (two-column bands) with higher display caps. */
const TWO_COL_KEYS = new Set<GridExportDatasetKey>([
  'hourly',
  'pb_fields',
  'pb_distribution',
  'gas_production',
  'gas_distribution',
  'regional',
  'imports',
]);
const DISPLAY_CAPS: Partial<Record<GridExportDatasetKey, number>> = {
  hourly: 168,
  pb_fields: 168,
  pb_distribution: 160,
  outages: 120,
  gas_production: 90,
  gas_distribution: 90,
};

// Embed the wordmark once per process (tiny PNG). Falls back to a text wordmark
// if the asset can't be read (kept available on Vercel via outputFileTracingIncludes).
let logoDataUri: string | null | undefined;
function getLogo(): string | null {
  if (logoDataUri !== undefined) return logoDataUri;
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'images', 'esb-logo.png'));
    logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    logoDataUri = null;
  }
  return logoDataUri;
}

// ---- value formatting ------------------------------------------------------

function num(v: ExportRow[string], maximumFractionDigits: number): string {
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '';
    return v.toLocaleString('en-US', { maximumFractionDigits });
  }
  return v == null ? '' : String(v);
}
const n2 = (v: ExportRow[string]) => num(v, 2);
const n0 = (v: ExportRow[string]) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.round(v).toLocaleString('en-US')
    : v == null
      ? ''
      : String(v);
const asText = (v: ExportRow[string]) => (v == null ? '' : String(v));


/** Strip HTML, non-Latin (Bengali etc.) and control chars; collapse whitespace. */
function cleanText(v: ExportRow[string]): string {
  const s = v == null ? '' : String(v);
  const cleaned = s
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\x20-\x7E]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 170 ? `${cleaned.slice(0, 167)}...` : cleaned;
}

// ---- per-dataset column layout (deterministic widths, human labels) --------

type Align = 'left' | 'right';
type PdfCol = {
  key: string;
  label: string;
  width: string;
  align?: Align;
  lines?: number;
  fmt?: (v: ExportRow[string]) => string;
};

const NUM: Partial<PdfCol> = { align: 'right', lines: 1, fmt: n2 };
const INT: Partial<PdfCol> = { align: 'right', lines: 1, fmt: n0 };

const VIEWS: Record<GridExportDatasetKey, { title: string; columns: PdfCol[] }> = {
  kpi: {
    title: 'Daily KPI Snapshot',
    columns: [
      { key: 'date', label: 'Date', width: '7%' },
      { key: 'day_peak_gen_mw', label: 'Day Peak Gen MW', width: '7.5%', ...NUM },
      { key: 'evening_peak_gen_mw', label: 'Eve Peak Gen MW', width: '7.5%', ...NUM },
      { key: 'day_peak_demand_mw', label: 'Day Peak Dem MW', width: '7.5%', ...NUM },
      { key: 'evening_peak_demand_mw', label: 'Eve Peak Dem MW', width: '7.5%', ...NUM },
      { key: 'min_gen_mw', label: 'Min Gen MW', width: '6.5%', ...NUM },
      { key: 'max_gen_mw', label: 'Max Gen MW', width: '6.5%', ...NUM },
      { key: 'total_energy_gen_mkwh', label: 'Gen MKWh', width: '6.5%', ...NUM },
      { key: 'total_energy_demand_mkwh', label: 'Demand MKWh', width: '6.5%', ...NUM },
      { key: 'total_energy_unserved_mkwh', label: 'Unserved MKWh', width: '6.5%', ...NUM },
      { key: 'max_temp_c', label: 'Max C', width: '5%', ...NUM },
      { key: 'gas_to_power_mmcfd', label: 'Gas-Power MMCFD', width: '7.5%', ...NUM },
      { key: 'avg_production_cost_tk_kwh', label: 'Avg Cost Tk/KWh', width: '6.5%', ...NUM },
      { key: 'total_daily_cost_bdt', label: 'Daily Cost BDT', width: '11.5%', ...INT },
    ],
  },
  generation: {
    title: 'Generation Mix & Cost',
    columns: [
      { key: 'date', label: 'Date', width: '11%' },
      { key: 'fuel', label: 'Fuel', width: '20%', align: 'left', lines: 1, fmt: asText },
      { key: 'generation_mkwh', label: 'Gen (MKWh)', width: '14%', ...NUM },
      { key: 'generation_share_pct', label: 'Gen Share %', width: '12%', ...NUM },
      { key: 'unit_cost_tk_kwh', label: 'Unit Cost (Tk/KWh)', width: '14%', ...NUM },
      { key: 'daily_cost_bdt', label: 'Daily Cost (BDT)', width: '17%', ...INT },
      { key: 'cost_share_pct', label: 'Cost Share %', width: '12%', ...NUM },
    ],
  },
  regional: {
    title: 'Regional Demand & Load-Shedding',
    columns: [
      { key: 'date', label: 'Date', width: '13%' },
      { key: 'zone', label: 'Zone', width: '27%', align: 'left', lines: 1, fmt: asText },
      { key: 'demand_mw', label: 'Demand (MW)', width: '16%', ...NUM },
      { key: 'demand_share_pct', label: 'Demand Share %', width: '14%', ...NUM },
      { key: 'load_shed_mw', label: 'Load-Shed (MW)', width: '16%', ...NUM },
      { key: 'load_shed_pct', label: 'Shed %', width: '14%', ...NUM },
    ],
  },
  imports: {
    title: 'Cross-Border Imports',
    columns: [
      { key: 'date', label: 'Date', width: '12%' },
      { key: 'source', label: 'Source', width: '34%', align: 'left', lines: 2, fmt: asText },
      { key: 'energy_mkwh', label: 'Energy (MKWh)', width: '16%', ...NUM },
      { key: 'peak_flow_mw', label: 'Peak Flow (MW)', width: '16%', ...NUM },
      { key: 'interconnector_type', label: 'Type', width: '22%', align: 'left', lines: 2, fmt: asText },
    ],
  },
  hourly: {
    title: 'Hourly Load Curve',
    columns: [
      { key: 'date', label: 'Date', width: '16%' },
      { key: 'hour', label: 'Hour', width: '14%', align: 'left', lines: 1, fmt: asText },
      { key: 'generation_mw', label: 'Generation (MW)', width: '24%', ...NUM },
      { key: 'demand_mw', label: 'Demand (MW)', width: '24%', ...NUM },
      { key: 'load_shed_mw', label: 'Load-Shed (MW)', width: '22%', ...NUM },
    ],
  },
  gas_production: {
    title: 'Gas Production',
    columns: [
      { key: 'date', label: 'Date', width: '11%' },
      { key: 'company', label: 'Company', width: '33%', align: 'left', lines: 2, fmt: asText },
      { key: 'fields', label: 'Fields', width: '9%', ...INT },
      { key: 'gas_mmcfd', label: 'Gas (MMCFD)', width: '16%', ...NUM },
      { key: 'condensate_bbl', label: 'Condensate (bbl)', width: '16%', ...NUM },
      { key: 'share_pct', label: 'Share %', width: '15%', ...NUM },
    ],
  },
  gas_distribution: {
    title: 'Gas Distribution',
    columns: [
      { key: 'date', label: 'Date', width: '11%' },
      { key: 'company', label: 'Company', width: '29%', align: 'left', lines: 2, fmt: asText },
      { key: 'power_mmcfd', label: 'Power (MMCFD)', width: '15%', ...NUM },
      { key: 'fertilizer_mmcfd', label: 'Fertilizer (MMCFD)', width: '16%', ...NUM },
      { key: 'others_mmcfd', label: 'Others (MMCFD)', width: '14%', ...NUM },
      { key: 'total_mmcfd', label: 'Total (MMCFD)', width: '15%', ...NUM },
    ],
  },
  outages: {
    title: 'Transmission Events Log',
    columns: [
      { key: 'date', label: 'Date', width: '10%' },
      { key: 'event', label: 'Event', width: '72%', align: 'left', lines: 3, fmt: cleanText },
      { key: 'load_type', label: 'Type', width: '18%', align: 'left', lines: 2, fmt: asText },
    ],
  },
  fin_tariff: {
    title: 'Tariff vs Generation Cost',
    columns: [
      { key: 'period', label: 'Period', width: '34%', align: 'left', lines: 1, fmt: asText },
      { key: 'gen_cost_tk_kwh', label: 'Gen Cost (Tk/KWh)', width: '22%', ...NUM },
      { key: 'bulk_tariff_tk_kwh', label: 'Bulk Tariff (Tk/KWh)', width: '22%', ...NUM },
      { key: 'deficit_tk_kwh', label: 'Deficit (Tk/KWh)', width: '22%', ...NUM },
    ],
  },
  fin_budget: {
    title: 'National Power Budget',
    columns: [
      { key: 'fiscal_year', label: 'Fiscal Year', width: '22%', align: 'left', lines: 1, fmt: asText },
      { key: 'total_budget_crore_bdt', label: 'Total Budget (Cr BDT)', width: '28%', ...INT },
      { key: 'power_energy_allocation_crore_bdt', label: 'Power Alloc (Cr BDT)', width: '28%', ...INT },
      { key: 'power_share_pct', label: 'Power Share %', width: '22%', ...NUM },
    ],
  },
  fin_system_loss: {
    title: 'System Loss by Utility',
    columns: [
      { key: 'fiscal_year', label: 'Fiscal Year', width: '14%', align: 'left', lines: 1, fmt: asText },
      { key: 'bpdb_pct', label: 'BPDB %', width: '9.5%', ...NUM },
      { key: 'reb_pct', label: 'REB %', width: '9.5%', ...NUM },
      { key: 'dpdc_pct', label: 'DPDC %', width: '9.5%', ...NUM },
      { key: 'desco_pct', label: 'DESCO %', width: '9.5%', ...NUM },
      { key: 'wzpdco_pct', label: 'WZPDCO %', width: '9.5%', ...NUM },
      { key: 'nesco_pct', label: 'NESCO %', width: '9.5%', ...NUM },
      { key: 'distribution_pct', label: 'Distribution %', width: '10%', ...NUM },
      { key: 'transmission_pct', label: 'Transmission %', width: '10%', ...NUM },
      { key: 'total_td_pct', label: 'Total T&D %', width: '9%', ...NUM },
    ],
  },
  fin_economics: {
    title: 'Macro-Economic Indicators',
    columns: [
      { key: 'year', label: 'Year', width: '12%', align: 'left', lines: 1, fmt: asText },
      { key: 'exchange_rate_bdt_usd', label: 'Exch (BDT/USD)', width: '15%', ...NUM },
      { key: 'inflation_pct', label: 'Inflation %', width: '13%', ...NUM },
      { key: 'spot_lng_usd_mmbtu', label: 'Spot LNG ($/MMBtu)', width: '16%', ...NUM },
      { key: 'import_coal_usd_ton', label: 'Import Coal ($/ton)', width: '16%', ...NUM },
      { key: 'retail_diesel_bdt_l', label: 'Diesel (BDT/L)', width: '14%', ...NUM },
      { key: 'retail_octane_bdt_l', label: 'Octane (BDT/L)', width: '14%', ...NUM },
    ],
  },
  fin_petrobangla: {
    title: 'Petrobangla Audited Financials',
    columns: [
      { key: 'fiscal_year', label: 'Fiscal Year', width: '22%', align: 'left', lines: 1, fmt: asText },
      { key: 'revenue_crore_bdt', label: 'Revenue (Cr BDT)', width: '26%', ...INT },
      { key: 'lng_cost_crore_bdt', label: 'LNG Cost (Cr BDT)', width: '26%', ...INT },
      { key: 'net_profit_crore_bdt', label: 'Net Profit (Cr BDT)', width: '26%', ...INT },
    ],
  },
  pb_timeline: {
    title: 'Petrobangla Gas Totals',
    columns: [
      { key: 'date', label: 'Date', width: '22%' },
      { key: 'grand_total_gas_mmcfd', label: 'Total Gas (MMCFD)', width: '30%', ...NUM },
      { key: 'producing_fields', label: 'Producing Fields', width: '24%', ...INT },
      { key: 'power_plants', label: 'Power Plants', width: '24%', ...INT },
    ],
  },
  pb_fields: {
    title: 'Petrobangla Gas Fields',
    columns: [
      { key: 'date', label: 'Date', width: '11%' },
      { key: 'company', label: 'Company', width: '12%', align: 'left', lines: 1, fmt: asText },
      { key: 'field', label: 'Field', width: '20%', align: 'left', lines: 1, fmt: asText },
      { key: 'gas_mmcfd', label: 'Gas (MMCFD)', width: '13%', ...NUM },
      { key: 'condensate_bbld', label: 'Condensate (BBLD)', width: '13%', ...NUM },
      { key: 'producing_wells', label: 'Wells', width: '10%', ...INT },
      { key: 'capacity_mmcfd', label: 'Capacity (MMCFD)', width: '12%', ...NUM },
      { key: 'production_share_pct', label: 'Prod Share %', width: '9%', ...NUM },
    ],
  },
  pb_sgfl: {
    title: 'SGFL Petroleum Products',
    columns: [
      { key: 'date', label: 'Date', width: '16%' },
      { key: 'ngl_bbld', label: 'NGL (BBLD)', width: '12%', ...NUM },
      { key: 'condensate_bbld', label: 'Condensate (BBLD)', width: '12%', ...NUM },
      { key: 'lpg_kg', label: 'LPG (Kg)', width: '12%', ...NUM },
      { key: 'ms_bbld', label: 'MS (BBLD)', width: '12%', ...NUM },
      { key: 'octane_bbld', label: 'Octane (BBLD)', width: '12%', ...NUM },
      { key: 'kerosene_bbld', label: 'Kerosene (BBLD)', width: '12%', ...NUM },
      { key: 'diesel_bbld', label: 'Diesel (BBLD)', width: '12%', ...NUM },
    ],
  },
  pb_distribution: {
    title: 'Power-Plant Gas Supply',
    columns: [
      { key: 'date', label: 'Date', width: '12%' },
      { key: 'company', label: 'Company', width: '14%', align: 'left', lines: 1, fmt: asText },
      { key: 'power_plant', label: 'Power Plant', width: '40%', align: 'left', lines: 2, fmt: asText },
      { key: 'demand_mmcfd', label: 'Demand (MMCFD)', width: '17%', ...NUM },
      { key: 'supply_mmcfd', label: 'Supply (MMCFD)', width: '17%', ...NUM },
    ],
  },
};

// ---- charts per dataset ----------------------------------------------------

/** A curated figure for a dataset, or null when a table alone reads better. */
function renderChart(table: DatasetTable): { caption: string; chart: ReactNode } | null {
  const rows = table.rows;
  if (rows.length === 0) return null;

  switch (table.key) {
    case 'generation': {
      const data = aggSum(rows, 'fuel', 'generation_mkwh')
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((d) => ({ ...d, color: FUEL_COLORS[d.label] }));
      if (!data.length) return null;
      return {
        caption: 'Generation by fuel over the range, MKWh and share of mix',
        chart: <HBarChart data={data} unit="MKWh" showShare />,
      };
    }
    case 'regional': {
      const data = aggAvg(rows, 'zone', 'demand_mw').sort((a, b) => b.value - a.value);
      return { caption: 'Average demand by zone, MW', chart: <HBarChart data={data} unit="MW" /> };
    }
    case 'imports': {
      const data = aggSum(rows, 'source', 'energy_mkwh').sort((a, b) => b.value - a.value);
      return {
        caption: 'Imported energy by interconnector over the range, MKWh and share',
        chart: <HBarChart data={data} unit="MKWh" showShare />,
      };
    }
    case 'gas_production': {
      const data = aggSum(rows, 'company', 'gas_mmcfd').sort((a, b) => b.value - a.value);
      return {
        caption: 'Gas production by company over the range, MMCFD and share',
        chart: <HBarChart data={data} unit="MMCFD" showShare />,
      };
    }
    case 'kpi': {
      if (rows.length < 2) return null;
      const xLabels = rows.map((r) => String(r.date));
      const series = [
        { name: 'Demand', color: SERIES_ORANGE, values: rows.map((r) => rowNum(r, 'total_energy_demand_mkwh')) },
        { name: 'Generation', color: SERIES_BLUE, values: rows.map((r) => rowNum(r, 'total_energy_gen_mkwh')) },
      ];
      return {
        caption: 'Daily energy demand vs generation, MKWh — the shaded band is energy that went unserved',
        chart: (
          <LineChart
            series={series}
            xLabels={xLabels}
            unit="MKWh"
            annotateMax
            fillBetween
            gapLabel="unserved energy"
          />
        ),
      };
    }
    case 'hourly': {
      // Average day profile: mean generation/demand/shed per hour across the range.
      const byHour = new Map<string, { g: number; d: number; s: number; c: number }>();
      for (const r of rows) {
        const h = String(r.hour).slice(0, 2);
        const cur = byHour.get(h) ?? { g: 0, d: 0, s: 0, c: 0 };
        cur.g += rowNum(r, 'generation_mw');
        cur.d += rowNum(r, 'demand_mw');
        cur.s += rowNum(r, 'load_shed_mw');
        cur.c += 1;
        byHour.set(h, cur);
      }
      const hours = [...byHour.keys()].sort();
      if (hours.length < 2) return null;
      const at = (h: string) => byHour.get(h)!;
      const series = [
        { name: 'Avg demand', color: SERIES_ORANGE, values: hours.map((h) => at(h).d / at(h).c) },
        { name: 'Avg generation', color: SERIES_BLUE, values: hours.map((h) => at(h).g / at(h).c) },
        { name: 'Avg load-shed', color: CRITICAL, values: hours.map((h) => at(h).s / at(h).c) },
      ];
      return {
        caption: 'Average 24-hour load profile across the range, MW — the dotted line is load-shedding',
        chart: <LineChart series={series} xLabels={hours.map((h) => `${h}:00`)} unit="MW" annotateMax />,
      };
    }
    case 'fin_tariff': {
      if (rows.length < 2) return null;
      const xLabels = rows.map((r) => String(r.period));
      const series = [
        { name: 'Generation cost', color: SERIES_ORANGE, values: rows.map((r) => rowNum(r, 'gen_cost_tk_kwh')) },
        { name: 'Bulk tariff', color: SERIES_BLUE, values: rows.map((r) => rowNum(r, 'bulk_tariff_tk_kwh')) },
      ];
      return {
        caption: 'Generation cost vs bulk tariff, Tk/KWh — the shaded band is the per-unit deficit',
        chart: (
          <LineChart series={series} xLabels={xLabels} unit="Tk/KWh" fillBetween gapLabel="deficit" />
        ),
      };
    }
    case 'fin_system_loss': {
      if (rows.length < 2) return null;
      const ordered = [...rows].reverse();
      const xLabels = ordered.map((r) => String(r.fiscal_year));
      const series = [{ name: 'Total T&D loss', color: SERIES_BLUE, values: ordered.map((r) => rowNum(r, 'total_td_pct')) }];
      return {
        caption: 'Total transmission & distribution loss by fiscal year, percent',
        chart: <LineChart series={series} xLabels={xLabels} unit="%" />,
      };
    }
    case 'fin_budget': {
      const data = rows.map((r) => ({ label: String(r.fiscal_year), value: rowNum(r, 'power_energy_allocation_crore_bdt') }));
      return {
        caption: 'Power & energy fiscal allocation by year, Crore BDT',
        chart: <ColumnChart data={data} unit="Crore BDT" />,
      };
    }
    case 'fin_petrobangla': {
      const data = rows.map((r) => ({ label: String(r.fiscal_year), value: rowNum(r, 'net_profit_crore_bdt') }));
      return {
        caption: 'Petrobangla net result by fiscal year, Crore BDT',
        chart: <ColumnChart data={data} unit="Crore BDT" signColors />,
      };
    }
    case 'pb_timeline': {
      if (rows.length < 2) return null;
      const xLabels = rows.map((r) => String(r.date));
      const series = [
        { name: 'Total gas production', color: SERIES_BLUE, values: rows.map((r) => rowNum(r, 'grand_total_gas_mmcfd')) },
      ];
      return {
        caption: 'National daily gas production, MMCFD',
        chart: <LineChart series={series} xLabels={xLabels} unit="MMCFD" annotateMax />,
      };
    }
    case 'pb_fields': {
      const data = aggAvg(rows, 'field', 'gas_mmcfd')
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
      if (!data.length) return null;
      return { caption: 'Average gas output by field, MMCFD — top 15', chart: <HBarChart data={data} unit="MMCFD" /> };
    }
    case 'pb_distribution': {
      const data = aggAvg(rows, 'power_plant', 'supply_mmcfd')
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
      if (!data.length) return null;
      return {
        caption: 'Average gas supply to power plants, MMCFD — top 15',
        chart: <HBarChart data={data} unit="MMCFD" />,
      };
    }
    default:
      return null;
  }
}

// ---- outage event parsing (custom timeline layout) -------------------------

type ParsedOutage = {
  date: string;
  time: string;
  desc: string;
  cause: string;
  cat: string;
  color: string;
};

function parseOutage(row: ExportRow): ParsedOutage {
  // PGCB report formats vary by day: sometimes the whole event text lives in the
  // time field; other days split it across plant/reason. Merge all of them.
  const eventTxt = cleanText(row.event);
  const plant = cleanText(row.plant);
  const reason = cleanText(row.reason);

  const m = /^(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?\s*-?\s*(.*)$/.exec(eventTxt);
  const time = m ? (m[2] ? `${m[1]}-${m[2]}` : m[1]) : '';
  let rest = (m ? m[3] : eventTxt).trim();

  // Fold in plant/reason text that isn't already part of the event string
  // (reason usually contains the plant text, so prefer the longer of the two).
  const extra = reason.includes(plant) && reason ? reason : [plant, reason].filter(Boolean).join(' ');
  if (extra) {
    const probe = extra.slice(0, 30);
    if (!rest.includes(probe)) rest = rest ? `${rest} ${extra}` : extra;
  }

  let cause = '';
  const dueIdx = rest.search(/Due to/i);
  if (dueIdx > 0) {
    cause = rest.slice(dueIdx).trim();
    rest = rest.slice(0, dueIdx).trim();
  }

  const hay = `${eventTxt} ${plant} ${reason}`;
  let cat = 'EVENT';
  let color = MUTED;
  if (/Scheduled/i.test(hay)) {
    cat = 'SCHEDULED';
    color = ACCENT;
  } else if (/Forced/i.test(hay)) {
    cat = 'FORCED';
    color = '#ea580c';
  } else if (/Tripped/i.test(hay)) {
    cat = 'TRIPPED';
    color = CRITICAL;
  } else if (/sync/i.test(hay)) {
    cat = 'SYNC';
    color = GOOD;
  }
  return { date: String(row.date ?? ''), time, desc: rest, cause, cat, color };
}

// ---- styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontSize: 8,
    color: INK,
    fontFamily: F,
  },
  runningHead: {
    position: 'absolute',
    top: 18,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: HAIR,
    paddingBottom: 6,
  },
  runningHeadLogo: { width: 48, height: 14, objectFit: 'contain' },
  runningHeadText: { fontSize: 6, color: MUTED, letterSpacing: 1.2, fontFamily: FM },

  footer: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: HAIR,
    paddingTop: 6,
    fontSize: 6,
    color: MUTED,
  },

  // section
  section: { marginTop: 6 },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'flex-end' },
  sectionNo: { fontSize: 18, fontFamily: FB, color: '#d1d5db', marginRight: 9, lineHeight: 1 },
  sectionTitle: { fontSize: 12.5, fontFamily: FB, color: INK, lineHeight: 1 },
  sectionIcon: { marginLeft: 7, marginBottom: 0.5 },
  sectionMetaRight: { marginLeft: 'auto', fontSize: 6, color: MUTED, letterSpacing: 1, fontFamily: FM },
  sectionRule: { height: 0.75, backgroundColor: RULE, marginTop: 7, marginBottom: 12 },

  // key finding
  finding: { flexDirection: 'row', marginBottom: 14 },
  findingBar: { width: 2, backgroundColor: ACCENT, borderRadius: 1, marginRight: 8 },
  findingBody: { flex: 1 },
  findingLabel: { fontSize: 5.5, letterSpacing: 1.5, color: ACCENT, fontFamily: FM, marginBottom: 3 },
  findingText: { fontSize: 7.8, color: SECONDARY, lineHeight: 1.6 },

  // figure
  figure: { marginBottom: 14 },
  figHeadRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  figLabel: { fontSize: 5.8, letterSpacing: 1.4, color: ACCENT, fontFamily: FM, marginRight: 7 },
  figTitle: { fontSize: 8.5, fontFamily: FB, color: INK, flex: 1 },
  figSource: { fontSize: 5.6, color: MUTED, marginLeft: 10, maxWidth: 230, textAlign: 'right' },

  // booktabs table
  tableWrap: { marginTop: 2 },
  tableTopRule: { height: 1.1, backgroundColor: RULE },
  tableBottomRule: { height: 1.1, backgroundColor: RULE },
  headRow: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: '#9ca3af', paddingVertical: 2 },
  headCell: {
    color: SECONDARY,
    fontFamily: FM,
    fontSize: 6,
    paddingVertical: 3.5,
    paddingHorizontal: 3,
    lineHeight: 1.25,
    letterSpacing: 0.3,
  },
  row: { flexDirection: 'row', borderTopWidth: 0.4, borderTopColor: '#f1f3f5', minHeight: 13.5 },
  cell: {
    fontSize: 7,
    paddingVertical: 3.2,
    paddingHorizontal: 3,
    color: '#1f2937',
    lineHeight: 1.3,
  },
  tableCaption: { fontSize: 5.8, color: MUTED, marginTop: 5 },

  // outage timeline
  outDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderTopWidth: 0.5,
    borderTopColor: HAIR,
    paddingVertical: 3.5,
    paddingHorizontal: 4,
  },
  outDateText: { fontSize: 7, fontFamily: FB, color: INK },
  outDateCount: { fontSize: 6, color: MUTED, marginLeft: 6 },
  outRow: { flexDirection: 'row', borderTopWidth: 0.4, borderTopColor: '#f1f3f5', paddingVertical: 3, paddingHorizontal: 4 },
  outTime: { width: '9%', fontSize: 6.6, color: SECONDARY },
  outBody: { flex: 1, paddingRight: 6 },
  outDesc: { fontSize: 7, color: '#1f2937', lineHeight: 1.35 },
  outCause: { fontSize: 6.2, color: MUTED, lineHeight: 1.3, marginTop: 1 },
  outCat: { width: '11%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  outCatDot: { width: 3.5, height: 3.5, borderRadius: 2, marginRight: 3 },
  outCatText: { fontSize: 5.4, letterSpacing: 0.6, fontFamily: FM },

  // cover
  coverPage: { padding: 42, fontFamily: F, color: INK },
  coverMast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coverLogo: { width: 128, height: 37, objectFit: 'contain' },
  coverMastRight: { fontSize: 6.5, color: MUTED, letterSpacing: 1.5, fontFamily: FM },
  mastInfo: { alignItems: 'flex-end' },
  mastInfoSite: { fontSize: 7.5, color: INK, fontFamily: FM, marginBottom: 2 },
  mastInfoLine: { fontSize: 6, color: MUTED, marginBottom: 1.5 },
  coverMastRule: { height: 0.75, backgroundColor: RULE, marginTop: 12 },
  coverKicker: { fontSize: 8, letterSpacing: 3, color: ACCENT, fontFamily: FM, marginTop: 46 },
  coverTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  coverTitle: { fontSize: 34, fontFamily: FB, color: INK, lineHeight: 1.12 },
  coverTitleDivider: { width: 1, height: 76, backgroundColor: '#cbd5e1', marginLeft: 20, marginRight: 20 },
  coverTitleAccent: { fontSize: 34, fontFamily: FB, color: ACCENT, lineHeight: 1.12 },
  coverRule: { width: 70, height: 3, backgroundColor: ACCENT, marginTop: 16 },
  coverSubtitle: { fontSize: 9.5, color: SECONDARY, lineHeight: 1.65, maxWidth: 430, marginTop: 14 },
  coverMetaRow: { flexDirection: 'row', marginTop: 30 },
  coverMetaCell: { marginRight: 36 },
  coverMetaLabel: { fontSize: 5.8, letterSpacing: 1.4, color: MUTED, fontFamily: FM, marginBottom: 4 },
  coverMetaValue: { fontSize: 8.5, color: INK, lineHeight: 1.4 },

  heroStrip: {
    position: 'absolute',
    left: 42,
    right: 42,
    bottom: 76,
    borderTopWidth: 1.1,
    borderTopColor: RULE,
    paddingTop: 16,
    flexDirection: 'row',
  },
  heroItem: { flex: 1, paddingRight: 16 },
  heroItemDivider: { borderLeftWidth: 0.5, borderLeftColor: HAIR, paddingLeft: 16 },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  heroLabel: { fontSize: 6, letterSpacing: 1.4, color: MUTED, fontFamily: FM, marginLeft: 4 },
  heroValue: { fontSize: 21, fontFamily: FB, color: INK },
  heroSub: { fontSize: 6.4, color: SECONDARY, marginTop: 4 },

  coverFootRow: {
    position: 'absolute',
    left: 42,
    right: 42,
    bottom: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: HAIR,
    paddingTop: 7,
  },
  coverFootText: { fontSize: 6, color: MUTED },

  // summary
  pageTitle: { fontSize: 16, fontFamily: FB, color: INK, marginTop: 2 },
  pageTitleRule: { width: 52, height: 2.5, backgroundColor: ACCENT, marginTop: 7, marginBottom: 16 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '32.5%',
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 9,
    paddingBottom: 5,
    marginBottom: 11,
  },
  tileTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center' },
  tileLabel: { fontSize: 6, letterSpacing: 1.1, color: MUTED, fontFamily: FM, marginLeft: 4 },
  tileValue: { fontSize: 16, fontFamily: FB, color: INK, marginTop: 5 },
  tileSub: { fontSize: 6.4, color: SECONDARY, marginTop: 3.5 },

  duoRow: { flexDirection: 'row', marginTop: 10 },
  mixCard: { flex: 1, marginRight: 22 },
  cardLabel: { fontSize: 6, letterSpacing: 1.4, color: ACCENT, fontFamily: FM, marginBottom: 8 },
  mixBody: { flexDirection: 'row', alignItems: 'center' },
  mixLegend: { flex: 1, marginLeft: 14 },
  mixLegendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4.5 },
  mixChip: { width: 7, height: 7, borderRadius: 2, marginRight: 5 },
  mixLegendLabel: { fontSize: 7.2, color: '#1f2937', flex: 1 },
  mixLegendValue: { fontSize: 7, color: MUTED },

  highlightsCard: { flex: 1.3 },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  highlightNo: { width: 14, fontSize: 7.2, fontFamily: FB, color: ACCENT, marginTop: 0.5 },
  highlightText: { flex: 1, fontSize: 7.6, color: '#1f2937', lineHeight: 1.6 },

  contents: { marginTop: 14, borderTopWidth: 0.5, borderTopColor: HAIR, paddingTop: 10 },
  contentsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  contentsItem: { width: '25%', flexDirection: 'row', marginBottom: 5, paddingRight: 10 },
  contentsNo: { fontSize: 6.5, fontFamily: FM, color: MUTED, width: 16 },
  contentsText: { flex: 1, fontSize: 7, color: '#1f2937' },
  contentsRows: { fontSize: 6.2, color: MUTED },

  clampNote: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  clampBar: { width: 2, backgroundColor: WARM, borderRadius: 1, marginRight: 7 },
  clampText: { flex: 1, fontSize: 7.4, color: WARM, lineHeight: 1.55 },

  // two-column dense tables
  twoColBand: { flexDirection: 'row', marginBottom: 8 },
  twoCol: { flex: 1 },
  twoColRight: { marginLeft: 12 },
  headCellSm: {
    color: SECONDARY,
    fontFamily: FM,
    fontSize: 5.4,
    paddingVertical: 2.5,
    paddingHorizontal: 2.5,
    lineHeight: 1.2,
    letterSpacing: 0.2,
  },
  rowSm: { flexDirection: 'row', borderTopWidth: 0.4, borderTopColor: '#f1f3f5', minHeight: 11 },
  cellSm: { fontSize: 6.2, paddingVertical: 2.2, paddingHorizontal: 2.5, color: '#1f2937', lineHeight: 1.2 },

  // compact event log
  outRowSm: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 0.4,
    borderTopColor: '#f1f3f5',
    paddingVertical: 2.6,
    paddingHorizontal: 2,
  },
  outWhen: { width: '18%', fontSize: 5.8, color: SECONDARY, fontFamily: FM },
  outDescSm: { flex: 1, fontSize: 6.3, color: '#1f2937', lineHeight: 1.3, paddingRight: 4 },
  outCauseSpan: { fontSize: 6, color: MUTED },
  outCatSm: { width: '13%', fontSize: 5.2, letterSpacing: 0.5, fontFamily: FM, textAlign: 'right' },

  // notes & methodology
  notesGrid: { flexDirection: 'row', marginTop: 4 },
  notesCol: { flex: 1, paddingRight: 26 },
  notesText: { fontSize: 7.6, color: SECONDARY, lineHeight: 1.7, marginBottom: 10 },
  glossRow: { flexDirection: 'row', marginBottom: 4.5 },
  glossTerm: { width: 62, fontSize: 7, fontFamily: FM, color: INK },
  glossDef: { flex: 1, fontSize: 7, color: SECONDARY, lineHeight: 1.55 },
});

// ---- building blocks -------------------------------------------------------

function RunningHead({ meta }: { meta: ExportMeta }) {
  const logo = getLogo();
  return (
    <View style={styles.runningHead} fixed>
      {logo ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={logo} style={styles.runningHeadLogo} />
      ) : (
        <Text style={styles.runningHeadText}>ESB POWERLINE</Text>
      )}
      <Text style={styles.runningHeadText}>
        POWER GRID DATA REPORT · {meta.from} TO {meta.to}
      </Text>
    </View>
  );
}

function PageFooter({ meta }: { meta: ExportMeta }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Prepared for {meta.memberName} · ESB PowerLine · not for redistribution</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function KeyFinding({ lines, accent = ACCENT }: { lines: string[]; accent?: string }) {
  if (lines.length === 0) return null;
  return (
    <View style={styles.finding}>
      <View style={[styles.findingBar, { backgroundColor: accent }]} />
      <View style={styles.findingBody}>
        <Text style={[styles.findingLabel, { color: accent }]}>KEY FINDING</Text>
        {lines.map((l, i) => (
          <Text key={i} style={styles.findingText}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

function FigureFrame({
  no,
  title,
  source,
  children,
}: {
  no: number;
  title: string;
  source: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.figure} wrap={false}>
      <View style={styles.figHeadRow}>
        <Text style={styles.figLabel}>FIGURE {no}</Text>
        <Text style={styles.figTitle}>{title}</Text>
        <Text style={[styles.figSource, { maxLines: 1, textOverflow: 'ellipsis' }]}>Source: {source}</Text>
      </View>
      {children}
    </View>
  );
}

function BookTable({ table, columns, cap }: { table: DatasetTable; columns: PdfCol[]; cap: number }) {
  const shown = table.rows.slice(0, cap);
  const truncated = table.rows.length - shown.length;
  return (
    <View style={styles.tableWrap}>
      <View style={styles.tableTopRule} />
      <View style={styles.headRow} fixed>
        {columns.map((c) => (
          <Text key={c.key} style={[styles.headCell, { width: c.width, textAlign: c.align ?? 'left' }]}>
            {c.label.toUpperCase()}
          </Text>
        ))}
      </View>
      {shown.map((row, ri) => (
        <View key={ri} style={styles.row} wrap={false}>
          {columns.map((c) => (
            <Text
              key={c.key}
              style={[
                styles.cell,
                { width: c.width, textAlign: c.align ?? 'left', maxLines: c.lines ?? 1, textOverflow: 'ellipsis' },
              ]}
            >
              {(c.fmt ?? asText)(row[c.key])}
            </Text>
          ))}
        </View>
      ))}
      <View style={styles.tableBottomRule} />
      {truncated > 0 && (
        <Text style={styles.tableCaption}>
          Showing {shown.length} of {table.rows.length} rows — the complete series ships in the CSV / Excel export.
        </Text>
      )}
    </View>
  );
}

/** MM-DD in dense layouts; the full range is stated in the running head. */
function shortDate(v: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.slice(5) : v;
}

/** Long series rendered as side-by-side column bands — half the pages, same data. */
const ROWS_PER_COL_BAND = 34;

function TwoColTable({ table, columns, cap }: { table: DatasetTable; columns: PdfCol[]; cap: number }) {
  const shown = table.rows.slice(0, cap);
  const truncated = table.rows.length - shown.length;
  const bands: ExportRow[][][] = [];
  for (let i = 0; i < shown.length; i += ROWS_PER_COL_BAND * 2) {
    const chunk = shown.slice(i, i + ROWS_PER_COL_BAND * 2);
    const half = Math.ceil(chunk.length / 2);
    bands.push([chunk.slice(0, half), chunk.slice(half)]);
  }
  const renderCell = (row: ExportRow, c: PdfCol) => {
    const v = (c.fmt ?? asText)(row[c.key]);
    return c.key === 'date' ? shortDate(v) : v;
  };
  return (
    <View style={styles.tableWrap}>
      {bands.map((cols, bi) => (
        <View key={bi} style={styles.twoColBand} wrap={false}>
          {cols.map((rows, ci) =>
            rows.length === 0 ? null : (
              <View key={ci} style={ci ? [styles.twoCol, styles.twoColRight] : styles.twoCol}>
                <View style={styles.tableTopRule} />
                <View style={styles.headRow}>
                  {columns.map((c) => (
                    <Text key={c.key} style={[styles.headCellSm, { width: c.width, textAlign: c.align ?? 'left' }]}>
                      {c.label.toUpperCase()}
                    </Text>
                  ))}
                </View>
                {rows.map((row, ri) => (
                  <View key={ri} style={styles.rowSm}>
                    {columns.map((c) => (
                      <Text
                        key={c.key}
                        style={[
                          styles.cellSm,
                          { width: c.width, textAlign: c.align ?? 'left', maxLines: 1, textOverflow: 'ellipsis' },
                        ]}
                      >
                        {renderCell(row, c)}
                      </Text>
                    ))}
                  </View>
                ))}
                <View style={styles.tableBottomRule} />
              </View>
            ),
          )}
        </View>
      ))}
      <Text style={styles.tableCaption}>
        {truncated > 0
          ? `Showing ${shown.length} of ${table.rows.length} rows, two-column layout (dates as MM-DD) — the complete series ships in the CSV / Excel export.`
          : 'Two-column layout — read each block top-to-bottom, left column first. Dates shown as MM-DD.'}
      </Text>
    </View>
  );
}

/** Events rendered as compact two-column log entries — colour + spelled-out category. */
const OUT_EVENTS_PER_COL = 18;

function OutageTimeline({ table, cap }: { table: DatasetTable; cap: number }) {
  const parsed = table.rows.slice(0, cap).map(parseOutage);
  const truncated = table.rows.length - parsed.length;
  const bands: ParsedOutage[][][] = [];
  for (let i = 0; i < parsed.length; i += OUT_EVENTS_PER_COL * 2) {
    const chunk = parsed.slice(i, i + OUT_EVENTS_PER_COL * 2);
    const half = Math.ceil(chunk.length / 2);
    bands.push([chunk.slice(0, half), chunk.slice(half)]);
  }
  return (
    <View style={styles.tableWrap}>
      {bands.map((cols, bi) => (
        <View key={bi} style={styles.twoColBand} wrap={false}>
          {cols.map((events, ci) =>
            events.length === 0 ? null : (
              <View key={ci} style={ci ? [styles.twoCol, styles.twoColRight] : styles.twoCol}>
                <View style={styles.tableTopRule} />
                {events.map((e, i) => (
                  <View key={i} style={styles.outRowSm}>
                    <Text style={styles.outWhen}>
                      {shortDate(e.date)}
                      {e.time ? ` ${e.time}` : ''}
                    </Text>
                    <Text style={[styles.outDescSm, { maxLines: 2, textOverflow: 'ellipsis' }]}>
                      {e.desc || '—'}
                      {e.cause ? <Text style={styles.outCauseSpan}> — {e.cause}</Text> : null}
                    </Text>
                    <Text style={[styles.outCatSm, { color: e.color }]}>{e.cat}</Text>
                  </View>
                ))}
                <View style={styles.tableBottomRule} />
              </View>
            ),
          )}
        </View>
      ))}
      <Text style={styles.tableCaption}>
        {truncated > 0
          ? `Showing ${parsed.length} of ${table.rows.length} events — the complete log ships in the CSV / Excel export.`
          : `${parsed.length} events across the range — categories colour-coded and spelled out for print.`}
      </Text>
    </View>
  );
}

function CoverPage({ tables, meta, summary }: { tables: DatasetTable[]; meta: ExportMeta; summary: ReturnType<typeof computeSummary> }) {
  const logo = getLogo();
  const populated = tables.filter((t) => t.rows.length > 0);
  const totalRows = populated.reduce((s, t) => s + t.rows.length, 0);

  const t = new Map(summary.tiles.map((x) => [x.label, x]));
  const heroes: SummaryTile[] = [];
  const gen = t.get('Energy Generated');
  const peak = t.get('Peak Generation');
  const cost = t.get('Avg Production Cost');
  const unserved = t.get('Energy Unserved');
  if (gen) heroes.push(gen);
  if (peak) heroes.push(peak);
  if (cost) heroes.push(cost);
  if (unserved) heroes.push(unserved);
  if (heroes.length === 0) {
    heroes.push(
      { icon: 'layers', label: 'Datasets', value: String(populated.length), sub: 'curated data series' },
      { icon: 'calendar', label: 'Coverage', value: meta.from, sub: `to ${meta.to}` },
      { icon: 'gauge', label: 'Data points', value: totalRows.toLocaleString('en-US'), sub: 'rows in this report' },
    );
  }

  return (
    <Page size="A4" orientation="landscape" style={styles.coverPage}>
      <View style={styles.coverMast}>
        {logo ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={logo} style={styles.coverLogo} />
        ) : (
          <Text style={{ fontSize: 15, fontFamily: FB }}>ESB POWERLINE</Text>
        )}
        <View style={styles.mastInfo}>
          <Text style={styles.mastInfoSite}>esbpowerline.com</Text>
          <Text style={styles.mastInfoLine}>Bangladesh power &amp; energy — news, data &amp; analysis</Text>
          <Text style={styles.mastInfoLine}>Daily PGCB · Petrobangla · BPDB archives since 2013</Text>
        </View>
      </View>
      <View style={styles.coverMastRule} />

      <Text style={styles.coverKicker}>DATA REPORT · {meta.from} TO {meta.to}</Text>
      <View style={styles.coverTitleRow}>
        <Text style={styles.coverTitle}>Power Grid &{'\n'}Gas System Review</Text>
        <View style={styles.coverTitleDivider} />
        <Text style={styles.coverTitleAccent}>Grid{'\n'}Explorer</Text>
      </View>
      <View style={styles.coverRule} />
      <Text style={styles.coverSubtitle}>
        PGCB, BPDB and Petrobangla source records — parsed, reconciled and curated into audit-ready
        tables, annotated figures and computed findings for professional use.
      </Text>

      <View style={styles.coverMetaRow}>
        <View style={styles.coverMetaCell}>
          <Text style={styles.coverMetaLabel}>PREPARED FOR</Text>
          <Text style={styles.coverMetaValue}>{meta.memberName}</Text>
        </View>
        <View style={styles.coverMetaCell}>
          <Text style={styles.coverMetaLabel}>ACCESS TIER</Text>
          <Text style={styles.coverMetaValue}>{meta.tierLabel}</Text>
        </View>
        <View style={styles.coverMetaCell}>
          <Text style={styles.coverMetaLabel}>GENERATED</Text>
          <Text style={styles.coverMetaValue}>{new Date(meta.generatedAt).toUTCString()}</Text>
        </View>
        <View style={styles.coverMetaCell}>
          <Text style={styles.coverMetaLabel}>CONTENTS</Text>
          <Text style={styles.coverMetaValue}>
            {populated.length} datasets · {totalRows.toLocaleString('en-US')} data points
          </Text>
        </View>
      </View>

      <View style={styles.heroStrip}>
        {heroes.slice(0, 4).map((h, i) => (
          <View key={i} style={i === 0 ? styles.heroItem : [styles.heroItem, styles.heroItemDivider]}>
            <View style={styles.heroLabelRow}>
              <Icon name={h.icon} size={8} color={ACCENT} />
              <Text style={styles.heroLabel}>{h.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroValue}>{h.value}</Text>
            {h.spark && h.spark.length > 1 ? (
              <View style={{ marginTop: 4 }}>
                <Sparkline values={h.spark} width={92} height={14} />
              </View>
            ) : (
              <Text style={styles.heroSub}>{h.sub}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.coverFootRow}>
        <Text style={styles.coverFootText}>
          Source: PGCB Daily Progress Reports · NLDC · BPDB financial audits · Petrobangla daily gas reports
        </Text>
        <Text style={styles.coverFootText}>esbpowerline.com</Text>
      </View>
    </Page>
  );
}

function SummaryPage({
  meta,
  summary,
  sections,
}: {
  meta: ExportMeta;
  summary: ReturnType<typeof computeSummary>;
  sections: Array<{ table: DatasetTable; no: number }>;
}) {
  const { tiles, mix, mixTotal, highlights } = summary;

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <RunningHead meta={meta} />
      <Text style={styles.pageTitle}>Executive Summary</Text>
      <View style={styles.pageTitleRule} />

      {meta.clampNote ? (
        <View style={styles.clampNote}>
          <View style={styles.clampBar} />
          <Text style={styles.clampText}>{meta.clampNote}</Text>
        </View>
      ) : null}

      {tiles.length > 0 && (
        <View style={styles.tileGrid}>
          {tiles.map((tile, i) => (
            <View key={i} style={styles.tile}>
              <View style={styles.tileTopRow}>
                <View style={styles.tileLabelRow}>
                  <Icon name={tile.icon} size={8} color={ACCENT} />
                  <Text style={styles.tileLabel}>{tile.label.toUpperCase()}</Text>
                </View>
                {tile.spark && tile.spark.length > 1 ? <Sparkline values={tile.spark} width={58} height={13} /> : null}
              </View>
              <Text style={styles.tileValue}>{tile.value}</Text>
              <Text style={[styles.tileSub, tile.subColor ? { color: tile.subColor } : {}]}>{tile.sub}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.duoRow}>
        {mix && (
          <View style={styles.mixCard}>
            <Text style={styles.cardLabel}>GENERATION MIX — SHARE OF ENERGY</Text>
            <View style={styles.mixBody}>
              <DonutChart data={mix} centerLabel={fmt(mixTotal, 0)} centerSub="MKWh total" />
              <View style={styles.mixLegend}>
                {mix.slice(0, 8).map((d, i) => (
                  <View key={i} style={styles.mixLegendRow}>
                    <View style={[styles.mixChip, { backgroundColor: d.color ?? SERIES_BLUE }]} />
                    <Text style={styles.mixLegendLabel}>{d.label}</Text>
                    <Text style={styles.mixLegendValue}>
                      {fmt(d.value, 0)} · {mixTotal > 0 ? fmt((d.value / mixTotal) * 100, 1) : '0'}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
        {highlights.length > 0 && (
          <View style={styles.highlightsCard}>
            <Text style={styles.cardLabel}>KEY FINDINGS</Text>
            {highlights.map((h, i) => (
              <View key={i} style={styles.highlightRow}>
                <Text style={styles.highlightNo}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.contents}>
        <Text style={styles.cardLabel}>REPORT CONTENTS</Text>
        <View style={styles.contentsGrid}>
          {sections.map(({ table, no }) => (
            <View key={table.key} style={styles.contentsItem}>
              <Text style={styles.contentsNo}>{String(no).padStart(2, '0')}</Text>
              <Text style={styles.contentsText}>
                {VIEWS[table.key].title} <Text style={styles.contentsRows}>· {table.rows.length}</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      <PageFooter meta={meta} />
    </Page>
  );
}

function DatasetSection({
  table,
  no,
  figNo,
  first,
}: {
  table: DatasetTable;
  no: number;
  figNo: number | null;
  first: boolean;
}) {
  const view = VIEWS[table.key];
  const def = GRID_EXPORT_DATASETS[table.key];
  const chart = renderChart(table);
  const insights = computeInsights(table);
  const source = CATEGORY_SOURCE[def.category] ?? CATEGORY_SOURCE.daily;

  // Scope tag — honest about what slice of data this tier is seeing.
  const fullLen = def.kind === 'static' ? def.rows().length : null;
  const scopeTag =
    def.kind === 'static'
      ? fullLen !== null && table.rows.length < fullLen
        ? 'RECENT HISTORY · TIER-LIMITED'
        : 'FULL HISTORY'
      : 'SELECTED RANGE';

  // Respect per-dataset column selection: only render columns present on the table.
  const selected = new Set(table.columns.map((c) => c.key));
  const columns = view.columns.filter((c) => selected.has(c.key));

  const accent = CATEGORY_ACCENT[def.category] ?? ACCENT;
  const cap = DISPLAY_CAPS[table.key] ?? PDF_MAX_ROWS_PER_DATASET;

  return (
    <View style={styles.section} break={!first}>
      <View wrap={false}>
        <View style={styles.sectionHeadRow}>
          <Text style={[styles.sectionNo, { color: accent }]}>{String(no).padStart(2, '0')}</Text>
          <Text style={styles.sectionTitle}>{view.title}</Text>
          <View style={styles.sectionIcon}>
            <Icon name={SECTION_ICONS[table.key]} size={9} color={MUTED} strokeWidth={1.8} />
          </View>
          <Text style={styles.sectionMetaRight}>
            {table.rows.length} ROWS · {scopeTag}
          </Text>
        </View>
        <View style={styles.sectionRule} />
        <KeyFinding lines={insights} />
      </View>

      {chart && figNo !== null && (
        <FigureFrame no={figNo} title={chart.caption} source={source}>
          {chart.chart}
        </FigureFrame>
      )}

      {table.key === 'outages' ? (
        <OutageTimeline table={table} cap={cap} />
      ) : TWO_COL_KEYS.has(table.key) ? (
        <TwoColTable table={table} columns={columns} cap={cap} />
      ) : (
        <BookTable table={table} columns={columns} cap={cap} />
      )}
    </View>
  );
}

const GLOSSARY: Array<[string, string]> = [
  ['MW', 'Megawatt — instantaneous power (capacity or demand).'],
  ['MKWh', 'Million kilowatt-hours — energy over a period.'],
  ['MMCFD', 'Million cubic feet of gas per day.'],
  ['BBLD', 'Barrels of liquid (condensate / products) per day.'],
  ['Tk/KWh', 'Taka per kilowatt-hour — per-unit cost or tariff.'],
  ['Cr BDT', 'Crore taka (10 million BDT).'],
  ['T&D loss', 'Energy lost between generation and billed consumption.'],
  ['Unserved', 'Demand that could not be supplied (load-shedding).'],
];

function NotesPage({ meta }: { meta: ExportMeta }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <RunningHead meta={meta} />
      <Text style={styles.pageTitle}>Notes & Methodology</Text>
      <View style={styles.pageTitleRule} />
      <View style={styles.notesGrid}>
        <View style={styles.notesCol}>
          <Text style={styles.cardLabel}>METHODOLOGY</Text>
          <Text style={styles.notesText}>
            ESB PowerLine parses the daily PGCB Daily Progress Report and Petrobangla daily gas report
            documents, normalises every table into a structured archive, and reconciles field-level
            figures against published grand totals (variance-checked). This report was assembled from
            that archive for the selected date range and access tier; every figure and finding is
            computed from the rows included here — not copied from third-party summaries.
          </Text>
          <Text style={styles.cardLabel}>DATA SOURCES</Text>
          <Text style={styles.notesText}>
            Grid operations — PGCB Daily Progress Reports / NLDC.{'\n'}
            Gas system — Petrobangla daily production & supply reports.{'\n'}
            Financials — BPDB &amp; Petrobangla audited statements, BERC tariff orders, Ministry of
            Finance budget documents.
          </Text>
          <Text style={styles.cardLabel}>COVERAGE &amp; ACCESS</Text>
          <Text style={styles.notesText}>
            Date range {meta.from} to {meta.to} · {meta.tierLabel}. Daily datasets reflect the selected
            range; financial series reflect the history available on this plan. Full-resolution data
            ships with the CSV and Excel exports.
          </Text>
        </View>
        <View style={styles.notesCol}>
          <Text style={styles.cardLabel}>GLOSSARY</Text>
          {GLOSSARY.map(([term, def]) => (
            <View key={term} style={styles.glossRow}>
              <Text style={styles.glossTerm}>{term}</Text>
              <Text style={styles.glossDef}>{def}</Text>
            </View>
          ))}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.cardLabel}>DISCLAIMER</Text>
            <Text style={styles.notesText}>
              Compiled from public records for information and research. Figures should be verified
              against primary sources before commercial or investment decisions. Prepared for{' '}
              {meta.memberName}; not for redistribution. © ESB PowerLine · esbpowerline.com
            </Text>
          </View>
        </View>
      </View>
      <PageFooter meta={meta} />
    </Page>
  );
}

function ReportDocument({ tables, meta }: { tables: DatasetTable[]; meta: ExportMeta }) {
  const summary = computeSummary(tables);
  const hasSummaryContent = summary.tiles.length > 0 || summary.highlights.length > 0 || !!summary.mix;

  // Precompute section + figure numbering.
  let fig = 0;
  const sections = tables.map((table, i) => ({
    table,
    no: i + 1,
    figNo: renderChart(table) ? ++fig : null,
  }));

  return (
    <Document title="ESB PowerLine - Power Grid Data Report" author="ESB PowerLine">
      <CoverPage tables={tables} meta={meta} summary={summary} />
      {hasSummaryContent && <SummaryPage meta={meta} summary={summary} sections={sections} />}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <RunningHead meta={meta} />
        {sections.map(({ table, no, figNo }, i) => (
          <DatasetSection key={table.key} table={table} no={no} figNo={figNo} first={i === 0} />
        ))}
        <PageFooter meta={meta} />
      </Page>
      <NotesPage meta={meta} />
    </Document>
  );
}

export async function renderGridPdf(tables: DatasetTable[], meta: ExportMeta): Promise<Buffer> {
  return renderToBuffer(<ReportDocument tables={tables} meta={meta} />);
}
