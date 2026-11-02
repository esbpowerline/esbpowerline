'use client';

/**
 * Renewables — what the power-sector agencies actually publish about renewable
 * energy, daily, monthly and as a capacity register.
 *
 * Every figure is one an agency publishes, reproduced unchanged (`P`), or one
 * recomputed from that agency's own itemised rows (`D`). Nothing is modelled
 * here, carried forward from another day, or filled in.
 *
 *   PGCB, daily    per-station output for each renewable plant, and the day's
 *                  energy and production cost by fuel
 *   PGCB, monthly  energy generation by Solar / Hydro / Wind, back to 2013
 *   SREDA          the installed-capacity register, and which organisation owns
 *                  each block of it
 *
 * What this replaced. The tab previously rendered a hardcoded capacity table
 * (1805.84 MW) that matched no SREDA page, beside three claims with no
 * published source: renewable targets of "20.0% by 2030" and "30.0% by 2040"
 * credited to "SREDA Target Sheets" — neither SREDA's site nor its database
 * states any target, and no such document was found; "SREDA and BPDB are
 * deploying 1,800 MW of utility-scale solar parks", against SREDA's own 14
 * parks totalling 745.25 MWp; and two "Audited by" credits, the same false
 * crediting this codebase already removed elsewhere (see GridProvenanceTag).
 * They were deleted rather than replaced, because no published equivalents were
 * found. An empty panel is a true statement; a sourced-looking target is not.
 *
 * Units. SREDA reports capacity in MWp (peak DC); PGCB reports plant capacity
 * in MW and output in MW and MKWh. Converting between MWp and MW needs a
 * performance ratio nobody publishes, so the two are never added or divided
 * into one another — they sit in separate cards and say which they are.
 */

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Droplet,
  Factory,
  Info,
  Leaf,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';
import {
  GridCardFooter,
  GridKpiCell,
  GridKpiStrip,
  GridKpiTooltipAudit,
  GridKpiTooltipBody,
  GridKpiTooltipRef,
  GridKpiTooltipRow,
  GridProvenanceTag,
} from '@/components/news/power-grid/GridExplorerUI';
import {
  GRID_EXPLORER_CHART_MARGIN,
  GridChartExternalLegend,
  GridChartTooltipShell,
  GridRechartsTooltip,
  gridChartXAxisProps,
  gridChartYAxisProps,
  useNarrowChartCard,
  type GridChartLegendItem,
} from '@/components/news/PowerGridChartUI';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';
import { useChartTheme } from '@/hooks/useChartTheme';
import {
  CountChip,
  OK_CLASS,
  WARN_CLASS,
  fmt,
} from '@/components/news/power-grid/renewables/shared';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { useBelowDesktop } from '@/components/news/power-grid/useTapToRead';
import { ProjectRegisterCard } from '@/components/news/power-grid/renewables/ProjectRegisterCard';
import { YearAttributionNote } from '@/components/news/power-grid/renewables/YearAttributionNote';
import { YearWiseTable } from '@/components/news/power-grid/renewables/YearWiseTable';
import { sredaAvailableDates } from '@/lib/data/sreda/available-dates';
// Reads go through the publish manifest so a day or a correction published
// after the last deploy shows here without one.
import { fetchDataJson } from '@/lib/data/runtime-data.client';
import { cn, formatNumber } from '@/lib/utils';
import type { SredaDailyData } from '@/lib/data/sreda/types';
import type { GridDailyData, GridSystemStats } from '@/lib/data/grid/types';
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import {
  SERIES_COLORS,
  SERIES_UNMAPPED,
  STATUS_COLORS,
  CHART_INK,
  resolveFuelColor,
} from '@/lib/data/grid/chart-palette';

/** The fuels PGCB reports that SREDA also counts as renewable. */
const RENEWABLE_FUELS = ['Solar', 'Hydro', 'Wind'] as const;

/**
 * Rates PGCB applies rather than measures. Verified across every 2026 day the
 * archive holds cost for: Wind is 14.7100 Tk/kWh on all of them and Hydro
 * 0.1000 on all but one. A tariff is not a daily observation and must not be
 * read as one.
 */
const ADMINISTERED_FUELS = new Set(['Hydro', 'Wind']);

const FUEL_ICON: Record<string, typeof Sun> = {
  Solar: Sun,
  Wind: Wind,
  Hydro: Droplet,
  Biogas: Leaf,
  Biomass: Factory,
};

/**
 * These three are fuels, and they were the clearest case of the palette being
 * bypassed: Hydro sat at #06b6d4, which is the very value chart-palette.ts
 * opens by warning about — 6.4 delta-E from Gas #0ea5e9, two cyans a
 * colour-blind reader cannot separate. resolveFuelColor returns the validated
 * hue and accepts PGCB's alternate spellings, so this map is now a lookup
 * against the one place a fuel colour is decided.
 */
const FUEL_COLOR: Record<string, string> = {
  Solar: resolveFuelColor('Solar'),
  Hydro: resolveFuelColor('Hydro'),
  Wind: resolveFuelColor('Wind'),
};

const ORG_FULL_NAME: Record<string, string> = {
  BPDB: 'Bangladesh Power Development Board',
  NWPGCL: 'North-West Power Generation Company Limited',
  EGCB: 'Electricity Generation Company of Bangladesh',
  BREB: 'Bangladesh Rural Electrification Board',
  WZPDCL: 'West Zone Power Distribution Company Limited',
  DESCO: 'Dhaka Electric Supply Company Limited',
  NESCO: 'Northern Electric Supply Company Limited',
  DPDC: 'Dhaka Power Distribution Company Limited',
  IDCOL: 'Infrastructure Development Company Limited',
  BADC: 'Bangladesh Agricultural Development Corporation',
  BMDA: 'Barind Multipurpose Development Authority',
  RDA: 'Rural Development Academy',
  DAE: 'Department of Agricultural Extension',
  BARD: 'Bangladesh Academy for Rural Development',
  BARI: 'Bangladesh Agricultural Research Institute',
  BRRI: 'Bangladesh Rice Research Institute',
};

const NDRE = 'https://ndre.sreda.gov.bd/';
const PGCB = 'https://www.pgcb.gov.bd/';

interface PlantRow {
  name: string;
  fuel: string;
  producer: string;
  installedMw: number | null;
  presentCapacityMw: number | null;
  dayPeakMw: number | null;
  eveningPeakMw: number | null;
  energyKwh: number | null;
  remarks?: string;
}

interface MonthlyRow {
  date_key: string;
  total_net_generation: number;
  generation_by_fuel: Record<string, number>;
}

function EmptyCard({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="grid-explorer-chart-card card flex min-h-[180px] flex-col items-center justify-center gap-2 p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/20">
        <Leaf className="h-6 w-6 shrink-0 text-emerald-500" />
      </span>
      <h4 className="text-sm font-bold text-foreground">{title}</h4>
      <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{reason}</p>
    </div>
  );
}

/**
 * The body of a card that has nothing to show — loading, or a page the source
 * did not publish. Same centred treatment as the content it stands in for, so a
 * card does not change shape when its data is missing.
 */
function CardNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 p-6 text-center">
      <Info className="h-5 w-5 shrink-0 text-muted-foreground/70" />
      <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-06" -> "June 2026". The series is monthly, so a day-level formatter would lie. */
function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const idx = Number(m) - 1;
  return MONTH_NAMES[idx] ? `${MONTH_NAMES[idx]} ${y}` : key;
}

export function RenewablesTab({
  isoDate,
  generationData = [],
  systemStats,
  sourceFiles,
}: {
  isoDate: string;
  generationData?: GridDailyData['generationData'];
  systemStats?: GridSystemStats;
  /** Named on each KPI so a reader can request the same workbook. */
  sourceFiles?: GridDailyData['sourceFiles'];
}) {
  const [sreda, setSreda] = useState<SredaDailyData | null>(null);
  const [sredaState, setSredaState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [plants, setPlants] = useState<PlantRow[] | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[] | null>(null);
  const [openKpi, setOpenKpi] = useState<string | null>(null);
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [openTech, setOpenTech] = useState<Set<string>>(new Set());
  const chartTheme = useChartTheme();

  useEffect(() => {
    let alive = true;
    const latest = [...sredaAvailableDates].sort().pop();
    if (!latest) {
      setSredaState('error');
      return;
    }
    fetchDataJson<SredaDailyData>(`sreda/daily/${latest}.json`)
      .then((res) => {
        if (!alive) return;
        const j = res.ok ? res.data : null;
        setSreda(j);
        setSredaState(j ? 'ready' : 'error');
      })
      .catch(() => alive && setSredaState('error'));
    return () => {
      alive = false;
    };
  }, []);

  // Per-station detail is one file per day. A day PGCB never published, or one
  // whose workbook did not reconcile, simply has none — the section says so
  // rather than showing the previous day's stations under this date.
  useEffect(() => {
    let alive = true;
    setPlants(null);
    if (!isoDate) return;
    fetchDataJson<{ plants?: PlantRow[] }>(`plants/${isoDate}.json`)
      .then((res) => alive && setPlants(res.ok ? (res.data?.plants ?? []) : []))
      .catch(() => alive && setPlants([]));
    return () => {
      alive = false;
    };
  }, [isoDate]);

  useEffect(() => {
    let alive = true;
    fetchDataJson<MonthlyRow[]>('pgcb-monthly/_series.json')
      .then((res) => alive && setMonthly(res.ok && Array.isArray(res.data) ? res.data : []))
      .catch(() => alive && setMonthly([]));
    return () => {
      alive = false;
    };
  }, []);

  /* ── Today, from PGCB's own daily report ── */
  const daily = useMemo(() => {
    const rows = (generationData ?? []).filter((r) =>
      (RENEWABLE_FUELS as readonly string[]).includes(r.name),
    );
    const energy = rows.reduce((s, r) => s + (r.gen ?? 0), 0);
    const cost = rows.reduce((s, r) => s + (r.cost ?? 0), 0);
    const totalGen = (generationData ?? []).reduce((s, r) => s + (r.gen ?? 0), 0);
    return {
      rows,
      energy,
      cost,
      totalGen,
      sharePct: totalGen > 0 ? (energy / totalGen) * 100 : null,
    };
  }, [generationData]);

  const renewablePlants = useMemo(
    () =>
      (plants ?? [])
        .filter((p) => (RENEWABLE_FUELS as readonly string[]).includes(p.fuel))
        .sort((a, b) => (b.installedMw ?? 0) - (a.installedMw ?? 0)),
    [plants],
  );

  const plantTotals = useMemo(() => {
    const t = { installed: 0, present: 0, dayPeak: 0, evePeak: 0, energyKwh: 0 };
    for (const p of renewablePlants) {
      t.installed += p.installedMw ?? 0;
      t.present += p.presentCapacityMw ?? 0;
      t.dayPeak += p.dayPeakMw ?? 0;
      t.evePeak += p.eveningPeakMw ?? 0;
      t.energyKwh += p.energyKwh ?? 0;
    }
    return t;
  }, [renewablePlants]);

  /**
   * The station table and the fuel table are two different pages of the same
   * PGCB report, and each fuel's stations should sum to that fuel's published
   * energy. Checking it is free and catches a mis-parsed station list, which a
   * table of plausible-looking plant names would otherwise hide.
   *
   * The band is half of the last digit PGCB prints on the fuel line (two
   * decimals of a MKWh), once for that figure and once for each station summed
   * into it — taken from how the source prints, not chosen.
   */
  const stationVsFuel = useMemo(() => {
    if (!renewablePlants.length || !daily.rows.length) return [];
    return RENEWABLE_FUELS.map((fuel) => {
      const stations = renewablePlants.filter((p) => p.fuel === fuel);
      if (!stations.length) return null;
      const computed = stations.reduce((s, p) => s + (p.energyKwh ?? 0), 0) / 1_000_000;
      const published = daily.rows.find((r) => r.name === fuel)?.gen ?? null;
      if (published == null) return null;
      const tolerance = 0.005 * (stations.length + 1);
      return {
        fuel,
        stations: stations.length,
        published,
        computed,
        delta: computed - published,
        tolerance,
        ok: Math.abs(computed - published) <= tolerance,
      };
    }).filter(Boolean) as {
      fuel: string;
      stations: number;
      published: number;
      computed: number;
      delta: number;
      tolerance: number;
      ok: boolean;
    }[];
  }, [renewablePlants, daily.rows]);

  /* ── Monthly, from PGCB's monthly reports ── */
  // The whole backlog, not a window. PGCB has published this since 2013 and the
  // shape of it — hydro alone until solar appears, wind arriving later still —
  // is the point of showing it at all.
  const monthlySeries = useMemo(() => {
    if (!monthly?.length) return [];
    return monthly
      .filter((m) => m.generation_by_fuel)
      .map((m) => {
        const Solar = Number((m.generation_by_fuel.solar ?? 0).toFixed(3));
        const Hydro = Number((m.generation_by_fuel.hydro ?? 0).toFixed(3));
        const Wind = Number((m.generation_by_fuel.wind ?? 0).toFixed(3));
        const renewable = Solar + Hydro + Wind;
        return {
          month: m.date_key,
          Solar,
          Hydro,
          Wind,
          renewable: Number(renewable.toFixed(3)),
          total: m.total_net_generation,
          sharePct:
            m.total_net_generation > 0
              ? Number(((renewable / m.total_net_generation) * 100).toFixed(2))
              : null,
        };
      });
  }, [monthly]);

  // The legend is the only place a chart can carry provenance: the three bands
  // are PGCB's published monthly energy, the share line is our quotient.
  const monthlyLegend: GridChartLegendItem[] = useMemo(
    () => [
      { id: 'Hydro', label: 'Hydro', color: FUEL_COLOR.Hydro, variant: 'area', provenance: 'P' },
      { id: 'Wind', label: 'Wind', color: FUEL_COLOR.Wind, variant: 'area', provenance: 'P' },
      { id: 'Solar', label: 'Solar', color: FUEL_COLOR.Solar, variant: 'area', provenance: 'P' },
      { id: 'share', label: 'Share of generation', color: SERIES_COLORS.renewableShare, variant: 'line', provenance: 'D' },
    ],
    [],
  );

  /** First month each source appears, which the chart's shape otherwise only implies. */
  const firstAppearance = useMemo(() => {
    const out: Record<string, string | null> = { Solar: null, Wind: null, Hydro: null };
    for (const row of monthlySeries) {
      for (const k of RENEWABLE_FUELS) {
        if (out[k] === null && row[k] > 0) out[k] = row.month;
      }
    }
    return out;
  }, [monthlySeries]);

  const latestMonth = monthlySeries.length ? monthlySeries[monthlySeries.length - 1] : null;
  const latestMonthRenewable = latestMonth
    ? latestMonth.Solar + latestMonth.Hydro + latestMonth.Wind
    : null;

  const sredaTotal = sreda?.technologyTotals?.totalMwp ?? null;
  const checks = sreda?.reconciliation ?? [];
  const failed = checks.filter((c) => !c.ok);
  const grouped = useMemo(() => {
    const rows = sreda?.technologyBreakdown ?? [];
    const order: string[] = [];
    const bySource = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!bySource.has(row.source)) {
        bySource.set(row.source, []);
        order.push(row.source);
      }
      bySource.get(row.source)!.push(row);
    }
    return order.map((source) => ({ source, rows: bySource.get(source)! }));
  }, [sreda]);

  const toggle = (id: string) => setOpenKpi((cur) => (cur === id ? null : id));

  const toggleTech = (source: string) =>
    setOpenTech((cur) => {
      const next = new Set(cur);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });

  const [timelineCardRef, isNarrowTimeline] = useNarrowChartCard();
  // Phone/tablet: station table -> cards, sparser axis ticks. False on the server and first hydration (desktop markup unchanged).
  const small = useBelowDesktop();
  const [showAllStations, setShowAllStations] = useState(false);

  /**
   * One tooltip for the monthly timeline, shared by the combined chart and by
   * the two the card splits into below GRID_DUAL_AXIS_MIN_WIDTH. Defined once
   * so its rows — all three fuels, the renewable total, all generation and the
   * share — cannot drift between the two layouts.
   *
   * Every row is marked, and the marks are not decoration: the three fuels and
   * the month's total generation are columns PGCB prints, while the renewable
   * total and the share are arithmetic done here on top of them. The hover is
   * where a reader reads the actual numbers, so it is the last place the
   * distinction can be left implicit. Marks sit before the name, as they do in
   * the load curve and the dispatch stack.
   */
  const monthlyTimelineTooltip = (
    <GridRechartsTooltip
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload as (typeof monthlySeries)[0];
        return (
          <GridChartTooltipShell title={monthLabel(d.month)} accent={FUEL_COLOR.Solar}>
            <div className="grid-chart-tooltip__grid">
              {RENEWABLE_FUELS.map((k) => (
                <Fragment key={k}>
                  <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                    <span className="grid-chart-tooltip__dot shrink-0" style={{ background: FUEL_COLOR[k] }} />
                    <GridProvenanceTag kind="P" />
                    {k}
                  </span>
                  <span className="grid-chart-tooltip__value" style={{ color: FUEL_COLOR[k] }}>
                    {fmt(d[k], 2)} MKWh
                  </span>
                </Fragment>
              ))}
              <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                <GridProvenanceTag kind="D" />
                Renewable total
              </span>
              <span className="grid-chart-tooltip__value">{fmt(d.renewable, 2)} MKWh</span>
              <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                <GridProvenanceTag kind="P" />
                All generation
              </span>
              <span className="grid-chart-tooltip__value">
                {formatNumber(Math.round(d.total))} MKWh
              </span>
              <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                <span className="grid-chart-tooltip__dot shrink-0" style={{ background: SERIES_COLORS.renewableShare }} />
                <GridProvenanceTag kind="D" />
                Share
              </span>
              <span className="grid-chart-tooltip__value" style={{ color: SERIES_COLORS.renewableShare }}>
                {d.sharePct == null ? '—' : `${d.sharePct.toFixed(2)}%`}
              </span>
            </div>
          </GridChartTooltipShell>
        );
      }}
    />
  );

  const monthlyXAxis = (
    <XAxis
      {...gridChartXAxisProps(chartTheme, {
        dataKey: 'month',
        tickFormatter: (v: string) => v.slice(0, 4),
        // 11px labels at ~15 ticks overlapped on a 360px plot ("201201201…"); ~6 years is readable.
        interval: Math.max(0, Math.floor(monthlySeries.length / (small ? 6 : 14))),
      })}
    />
  );

  return (
    <div className="grid-explorer-panel space-y-6">
      {/* ── KPI strip ── */}
      <GridKpiStrip>
        <GridKpiCell
          icon={Zap}
          iconClassName="text-yellow-500"
          label="Renewable Generation"
          value={daily.rows.length ? `${fmt(daily.energy, 2)} MKWh` : '— MKWh'}
          hint={isoDate ? `PGCB daily report · ${isoDate}` : undefined}
          provenance="D"
          active={openKpi === 'gen'}
          onToggle={() => toggle('gen')}
          tooltipTitle="Renewable Output"
          tooltipIcon={Zap}
          tooltipAccent="text-yellow-500"
          width="sm"
        >
          <GridKpiTooltipBody>
            {daily.rows.map((r) => (
              <GridKpiTooltipRow
                key={r.name}
                provenance="P"
                label={`${r.name}:`}
                value={r.gen == null ? '—' : `${fmt(r.gen, 2)} MKWh`}
              />
            ))}
            <GridKpiTooltipRow
              provenance="D"
              label="Renewable total:"
              value={`${fmt(daily.energy, 2)} MKWh`}
            />
            <GridKpiTooltipRow
              provenance="P"
              label="All fuels:"
              value={daily.totalGen ? `${fmt(daily.totalGen, 2)} MKWh` : '—'}
            />
            <GridKpiTooltipAudit>
              PGCB publishes each fuel&rsquo;s energy; the renewable total is our sum of Solar, Hydro
              and Wind. Not audited.
            </GridKpiTooltipAudit>
            <GridKpiTooltipRef refLabel="PGCB Daily Report" part="En-Curve sheet — per-fuel hourly energy" refHref={PGCB} dateLabel={`Date: ${isoDate}`} sourceFile={sourceFiles?.pgcb} />
          </GridKpiTooltipBody>
        </GridKpiCell>

        <GridKpiCell
          icon={Sun}
          iconClassName="text-amber-500"
          label="Share of Generation"
          value={daily.sharePct == null ? '—' : `${daily.sharePct.toFixed(2)}%`}
          hint="of all energy generated that day"
          provenance="D"
          active={openKpi === 'share'}
          onToggle={() => toggle('share')}
          tooltipTitle="Renewable Share"
          tooltipIcon={Sun}
          tooltipAccent="text-amber-500"
          width="sm"
        >
          <GridKpiTooltipBody>
            <GridKpiTooltipRow provenance="D" label="Renewable:" value={`${fmt(daily.energy, 2)} MKWh`} />
            <GridKpiTooltipRow
              provenance="P"
              label="Total generated:"
              value={daily.totalGen ? `${fmt(daily.totalGen, 2)} MKWh` : '—'}
            />
            <GridKpiTooltipAudit>
              A quotient of two figures PGCB publishes. PGCB does not state this percentage.
            </GridKpiTooltipAudit>
            <GridKpiTooltipRef refLabel="PGCB Daily Report" part="En-Curve sheet — per-fuel hourly energy" refHref={PGCB} dateLabel={`Date: ${isoDate}`} sourceFile={sourceFiles?.pgcb} />
          </GridKpiTooltipBody>
        </GridKpiCell>

        <GridKpiCell
          icon={Factory}
          iconClassName="text-emerald-500"
          label="Renewable Plants Online"
          value={renewablePlants.length ? `${renewablePlants.length}` : '—'}
          hint={
            plantTotals.present
              ? `${formatNumber(Math.round(plantTotals.present))} MW available capacity`
              : 'per-station detail not published'
          }
          provenance="P"
          active={openKpi === 'plants'}
          onToggle={() => toggle('plants')}
          tooltipTitle="Renewable Fleet"
          tooltipIcon={Factory}
          tooltipAccent="text-emerald-500"
          width="sm"
        >
          <GridKpiTooltipBody>
            <GridKpiTooltipRow
              provenance="P"
              label="Installed:"
              value={`${formatNumber(Math.round(plantTotals.installed))} MW`}
            />
            <GridKpiTooltipRow
              provenance="P"
              label="Available today:"
              value={`${formatNumber(Math.round(plantTotals.present))} MW`}
            />
            <GridKpiTooltipRow
              provenance="D"
              label="Sum of day peaks:"
              value={`${formatNumber(Math.round(plantTotals.dayPeak))} MW`}
            />
            <GridKpiTooltipRow
              provenance="D"
              label="Sum of evening peaks:"
              value={`${formatNumber(Math.round(plantTotals.evePeak))} MW`}
            />
            <GridKpiTooltipAudit>
              Station rows as PGCB publishes them. Totals are our sums of those rows.
            </GridKpiTooltipAudit>
            <GridKpiTooltipRef refLabel="PGCB Daily Report" part="En-Curve sheet — per-fuel hourly energy" refHref={PGCB} dateLabel={`Date: ${isoDate}`} sourceFile={sourceFiles?.pgcb} />
          </GridKpiTooltipBody>
        </GridKpiCell>

        <GridKpiCell
          icon={Building2}
          iconClassName="text-primary"
          label="Installed Capacity"
          value={sredaTotal == null ? '—' : `${fmt(sredaTotal, 2)} MWp`}
          hint={sreda ? `SREDA register · ${sreda.date}` : 'SREDA register'}
          provenance="P"
          align="right"
          active={openKpi === 'cap'}
          onToggle={() => toggle('cap')}
          tooltipTitle="SREDA Capacity Register"
          tooltipIcon={Building2}
          tooltipAccent="text-primary"
          width="sm"
        >
          <GridKpiTooltipBody>
            {(sreda?.technologyBreakdown ?? []).length > 0 &&
              grouped.map(({ source, rows }) => (
                <GridKpiTooltipRow
                  key={source}
                  provenance="D"
                  label={`${source}:`}
                  value={`${fmt(rows.reduce((s, r) => s + r.totalMwp, 0), 2)} MWp`}
                />
              ))}
            <GridKpiTooltipRow
              provenance="P"
              label="SREDA total:"
              value={sredaTotal == null ? '—' : `${fmt(sredaTotal, 3)} MWp`}
            />
            <GridKpiTooltipAudit>
              MWp is peak DC capacity, not the MW used for grid capacity — the two are not
              interchangeable and are never combined here.
            </GridKpiTooltipAudit>
            <GridKpiTooltipRef
              refLabel="SREDA NDRE"
              refHref={NDRE}
              dateLabel={`Updated: ${sreda?.lastUpdate ?? '—'}`}
            />
          </GridKpiTooltipBody>
        </GridKpiCell>
      </GridKpiStrip>

      {/* ── Today's renewable output, by fuel ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="grid-explorer-chart-card card">
          <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
            <Zap className="h-5 w-5 text-yellow-500 shrink-0" />
            <div>
              <h3 className="grid-explorer-chart-card__title">Renewable Output by Fuel</h3>
              <p className="grid-explorer-chart-card__sub">
                PGCB daily report {isoDate ? `· ${isoDate}` : ''}
              </p>
            </div>
          </div>

          {daily.rows.length ? (
            <>
              <div className="grid-explorer-table-wrap">
                <table className="grid-explorer-table ge-compact-table ge-rn-fuel">
                  <thead>
                    <tr>
                      <th>Fuel</th>
                      <th className="text-right">Energy (MKWh)<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Cost (Tk)<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Tk/kWh<GridProvenanceTag kind="D" className="ml-1" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.rows.map((r) => {
                      const Icon = FUEL_ICON[r.name] ?? Sun;
                      return (
                        <tr key={r.name}>
                          <td className="font-semibold">
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary shrink-0" />
                              {r.name}
                            </span>
                          </td>
                          <td className="text-right tabular-nums">{r.gen == null ? '—' : fmt(r.gen, 2)}</td>
                          <td className="text-right tabular-nums text-muted-foreground">
                            {r.cost == null ? '—' : formatNumber(r.cost)}
                          </td>
                          <td className="text-right tabular-nums">
                            {r.unitCost == null ? '—' : r.unitCost.toFixed(4)}
                            {ADMINISTERED_FUELS.has(r.name) && (
                              <span
                                className="ml-1.5 inline-block px-1.5 py-px rounded border text-[10px] font-bold align-middle bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                title="Administered rate — the publisher applies a fixed Tk/kWh to this fuel rather than reporting an observed cost, so it should not be read as a daily measurement."
                              >
                                flat
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-border/80 font-bold bg-muted/20">
                      <td>Renewable total<GridProvenanceTag kind="D" className="ml-1" /></td>
                      <td className="text-right tabular-nums text-primary">{fmt(daily.energy, 2)}</td>
                      <td className="text-right tabular-nums">{formatNumber(daily.cost)}</td>
                      <td className="text-right tabular-nums">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <MobileFold title="What does the flat mark mean?">
                <div className="pb-3 text-[11px] text-muted-foreground leading-relaxed">
                  Hydro and Wind carry a <strong>flat</strong>{' '}
                  mark because PGCB applies a fixed rate to
                  them — 0.1000 and 14.7100 Tk/kWh on essentially every day of 2026 — rather than
                  reporting a measured cost. A rate no agency prints is derived either way.
                </div>
              </MobileFold>
            </>
          ) : (
            <CardNotice>PGCB published no fuel-wise generation for this date.</CardNotice>
          )}

          <GridCardFooter>
            <span>
              Source:{' '}
              <a href={PGCB} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                PGCB Daily Generation Report
              </a>
            </span>
            <span className="font-medium">Reported day: {isoDate || '—'}</span>
          </GridCardFooter>
        </div>

        {/* ── Latest published month, beside the daily card ── */}
        <div className="grid-explorer-chart-card card">
          <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
            <Sun className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <h3 className="grid-explorer-chart-card__title">Latest Published Month</h3>
              <p className="grid-explorer-chart-card__sub">
                {latestMonth ? monthLabel(latestMonth.month) : 'PGCB monthly report'}
              </p>
            </div>
          </div>

          {latestMonth && latestMonthRenewable != null ? (
            <div className="space-y-3">
              {/* Four tiles on one grid: same padding, same three lines, and a
                  swatch on every label — including the share, which takes the
                  purple the chart already gives that series — so the labels,
                  the figures and the unit lines each sit on one axis across the
                  row instead of the share tile starting 14px left of the rest. */}
              <div className="grid grid-cols-2 gap-3">
                {RENEWABLE_FUELS.map((k) => (
                  <div key={k} className="min-w-0 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: FUEL_COLOR[k] }} />
                      {k}
                      <GridProvenanceTag kind="P" />
                    </div>
                    <div className="mt-1 text-sm font-bold tabular-nums leading-none">{fmt(latestMonth[k], 2)}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">MKWh</div>
                  </div>
                ))}
                <div className="min-w-0 rounded-lg border border-primary/25 bg-primary/5 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SERIES_COLORS.renewableShare }} />
                    Share of generation
                    <GridProvenanceTag kind="D" />
                  </div>
                  <div className="mt-1 text-sm font-bold tabular-nums leading-none text-primary">
                    {latestMonth.sharePct == null ? '—' : `${latestMonth.sharePct.toFixed(2)}%`}
                  </div>
                  <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                    {fmt(latestMonthRenewable, 2)} of {formatNumber(Math.round(latestMonth.total))} MKWh
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Each figure is from that month&rsquo;s own PGCB report. The share is our quotient of
                the three against the month&rsquo;s published total net generation — PGCB does not
                state a renewable percentage.
              </p>
            </div>
          ) : (
            <CardNotice>PGCB monthly reports could not be loaded.</CardNotice>
          )}

          <GridCardFooter>
            <span>
              Source:{' '}
              <a href={PGCB} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                PGCB Monthly Report
              </a>
            </span>
            <span className="font-medium">{latestMonth ? monthLabel(latestMonth.month) : '—'}</span>
          </GridCardFooter>
        </div>
      </div>

      {/* ── The whole monthly backlog, full width ── */}
      <div ref={timelineCardRef} className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Sun className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="grid-explorer-chart-card__title">Renewable Generation Timeline</h3>
            <p className="grid-explorer-chart-card__sub">
              Every month PGCB has published — energy by Solar, Hydro and Wind, with renewables as a
              share of all generation
            </p>
          </div>
        </div>

        {monthlySeries.length ? (
          /* This card wraps its chart in its own padding, which the other chart
             cards do not. At 362px that p-4 was 32px of the plot's width — the
             difference between this card's 66.4% after the split and the 73.6%
             its siblings reach. Narrow keeps a small gutter and gives the rest
             back to the data; desktop keeps p-4. */
          <div className={cn(isNarrowTimeline ? 'px-0 pb-4 pt-3' : 'p-4')}>
            <GridChartExternalLegend items={monthlyLegend} />
            {/* One gradient per fuel, shared by the narrow and wide plots. A
                flat fill made three slabs of poster paint; a gradient under a
                saturated top edge keeps the band boundaries crisp while letting
                the stack recede where it is deep. */}
            <svg width="0" height="0" aria-hidden="true" className="absolute">
              <defs>
                {RENEWABLE_FUELS.map((k) => (
                  <linearGradient key={k} id={`re-grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FUEL_COLOR[k]} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={FUEL_COLOR[k]} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
            </svg>
            {isNarrowTimeline ? (
              /* Two plots rather than two axes: the stack is MKWh and the share
                 is a percentage, so on a phone they separate by unit instead of
                 competing for one canvas. Combined they plotted 186px of a
                 362px card — 51.4%, the worst on the explorer. */
              <div className="flex flex-col gap-3">
                <div>
                  <p className="grid-explorer-chart-caption">Energy by source (MKWh)</p>
                  <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart role="img" aria-label="Renewable energy by source, monthly, chart" accessibilityLayer={false} data={monthlySeries} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                        <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                        {monthlyXAxis}
                        <YAxis
                          {...gridChartYAxisProps(chartTheme, {
                            tickFormatter: (v) => formatNumber(v, 0),
                            domain: [0, 'auto'],
                          })}
                        />
                        {monthlyTimelineTooltip}
                        {(['Hydro', 'Wind', 'Solar'] as const).map((k) => (
                          <Area
                            key={k}
                            type="monotone"
                            dataKey={k}
                            stackId="re"
                            stroke={FUEL_COLOR[k]}
                            fill={`url(#re-grad-${k})`}
                            fillOpacity={1}
                            strokeWidth={1.5}
                            legendType="none"
                          />
                        ))}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartDataTable
                    caption="Renewable energy by source, monthly, chart"
                    categoryHeader="Month"
                    categories={monthlySeries.map((d) => monthLabel(d.month))}
                    decimals={2}
                    series={[
                      { label: 'Hydro', unit: 'MKWh', values: columnOf(monthlySeries, 'Hydro') },
                      { label: 'Wind', unit: 'MKWh', values: columnOf(monthlySeries, 'Wind') },
                      { label: 'Solar', unit: 'MKWh', values: columnOf(monthlySeries, 'Solar') },
                    ]}
                  />
                </div>
                <div>
                  <p className="grid-explorer-chart-caption">
                    <span className="grid-explorer-chart-caption__swatch" style={{ background: SERIES_COLORS.renewableShare }} />
                    Renewables as a share of all generation (%)
                  </p>
                  <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart role="img" aria-label="Renewable share of generation, monthly, chart" accessibilityLayer={false} data={monthlySeries} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                        <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                        {monthlyXAxis}
                        <YAxis
                          {...gridChartYAxisProps(chartTheme, {
                            tickFormatter: (v) => `${v}%`,
                            domain: [0, 'auto'],
                          })}
                        />
                        {monthlyTimelineTooltip}
                        <Line
                          type="monotone"
                          dataKey="sharePct"
                          stroke="hsl(var(--card))"
                          strokeWidth={3.5}
                          dot={false}
                          activeDot={false}
                          legendType="none"
                          tooltipType="none"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sharePct"
                          stroke={SERIES_COLORS.renewableShare}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0, fill: SERIES_COLORS.renewableShare }}
                          legendType="none"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartDataTable
                    caption="Renewable share of generation, monthly, chart"
                    categoryHeader="Month"
                    categories={monthlySeries.map((d) => monthLabel(d.month))}
                    decimals={2}
                    series={[
                      { label: 'Share of generation', unit: '%', values: columnOf(monthlySeries, 'sharePct') },
                    ]}
                  />
                </div>
              </div>
            ) : (
            <div className="grid-explorer-chart-area grid-explorer-chart-area--lg w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart role="img" aria-label="Renewable Generation Timeline, chart" accessibilityLayer={false} data={monthlySeries} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                  {monthlyXAxis}
                  <YAxis
                    {...gridChartYAxisProps(chartTheme, {
                      yAxisId: 'mkwh',
                      tickFormatter: (v) => formatNumber(v, 0),
                      domain: [0, 'auto'],
                    })}
                  />
                  <YAxis
                    {...gridChartYAxisProps(chartTheme, {
                      yAxisId: 'share',
                      orientation: 'right',
                      tickFormatter: (v) => `${v}%`,
                      domain: [0, 'auto'],
                    })}
                  />
                  {monthlyTimelineTooltip}
                  {/* Hydro first: it is the only source for the first four years,
                      so stacking it at the base keeps the other bands readable
                      once they appear rather than shunting them up and down. */}
                  {(['Hydro', 'Wind', 'Solar'] as const).map((k) => (
                    <Area
                      key={k}
                      yAxisId="mkwh"
                      type="monotone"
                      dataKey={k}
                      stackId="re"
                      /* The original drew a 2px fuel-coloured stroke over a 28%
                         fill, and the eye read the outlines rather than the
                         bands: Wind's stroke was as heavy as Hydro's while the
                         band under it was 8 MKWh against 155. Now the fill
                         carries the quantity and the stroke is only the top
                         edge of that fill, so thickness is the figure. */
                      stroke={FUEL_COLOR[k]}
                      fill={`url(#re-grad-${k})`}
                      fillOpacity={1}
                      strokeWidth={1.5}
                      legendType="none"
                    />
                  ))}
                  {/* Drawn twice: a card-coloured halo, then the line itself.
                      A 1.5px dashed purple line was legible over pale washes
                      and vanishes over solid amber, and it is the one series
                      here that is ours rather than PGCB's — it has to stay
                      readable to stay honest.

                      Solid, not dashed. The dash used to be what said "this one
                      is derived"; the D chip in the legend says it outright now,
                      and a dashed line inside a white halo over a gradient was
                      three textures fighting for the same 2px. */}
                  <Line
                    yAxisId="share"
                    type="monotone"
                    dataKey="sharePct"
                    stroke="hsl(var(--card))"
                    strokeWidth={3.5}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                    tooltipType="none"
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="share"
                    type="monotone"
                    dataKey="sharePct"
                    stroke={SERIES_COLORS.renewableShare}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: SERIES_COLORS.renewableShare }}
                    legendType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            )}
            {!isNarrowTimeline && (
              <ChartDataTable
                caption="Renewable Generation Timeline, chart"
                categoryHeader="Month"
                categories={monthlySeries.map((d) => monthLabel(d.month))}
                decimals={2}
                series={[
                  { label: 'Hydro', unit: 'MKWh', values: columnOf(monthlySeries, 'Hydro') },
                  { label: 'Wind', unit: 'MKWh', values: columnOf(monthlySeries, 'Wind') },
                  { label: 'Solar', unit: 'MKWh', values: columnOf(monthlySeries, 'Solar') },
                  { label: 'Share of generation', unit: '%', values: columnOf(monthlySeries, 'sharePct') },
                ]}
              />
            )}

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
              <span>
                <strong className="text-foreground">{monthlySeries.length}</strong> months published,{' '}
                {monthLabel(monthlySeries[0].month)} &ndash; {monthLabel(monthlySeries[monthlySeries.length - 1].month)}
              </span>
              {RENEWABLE_FUELS.map((k) =>
                firstAppearance[k] ? (
                  <span key={k}>
                    First {k.toLowerCase()} generation:{' '}
                    <strong className="text-foreground">{monthLabel(firstAppearance[k]!)}</strong>
                  </span>
                ) : null,
              )}
            </div>
            <MobileFold title="How to read this chart">
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                Left axis is monthly energy in MKWh, stacked; right axis is renewables as a share of all
                generation that month. Gaps in the line are months PGCB has not published — nothing is
                interpolated across them.
              </p>
            </MobileFold>
          </div>
        ) : (
          <CardNotice>PGCB monthly reports could not be loaded, so no timeline is shown.</CardNotice>
        )}

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href={PGCB} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              PGCB Monthly Reports
            </a>
          </span>
          <span className="font-medium">
            {monthlySeries.length
              ? `${monthlySeries.length} months · through ${monthLabel(monthlySeries[monthlySeries.length - 1].month)}`
              : '—'}
          </span>
        </GridCardFooter>
      </div>

      {/* ── Per-station renewable output ── */}
      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Factory className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <h3 className="grid-explorer-chart-card__title">
              Renewable Power Stations
              {renewablePlants.length > 0 && <CountChip>{renewablePlants.length} stations</CountChip>}
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Every renewable station PGCB lists for this day, with its own output
            </p>
          </div>
        </div>

        {plants === null ? (
          <CardNotice>Loading station detail…</CardNotice>
        ) : renewablePlants.length && small ? (
          <div>
            <ul className="ge-plant-list">
              {(showAllStations ? renewablePlants : renewablePlants.slice(0, 8)).map((p) => (
                <RenewableStationCard key={p.name} p={p} />
              ))}
            </ul>
            {renewablePlants.length > 8 && (
              <button type="button" className="ge-gas-show-all" onClick={() => setShowAllStations((v) => !v)}>
                {showAllStations ? 'Show first 8' : `Show all ${renewablePlants.length} stations`}
              </button>
            )}
            <div className="ge-plant-total">
              <strong>{renewablePlants.length} stations <GridProvenanceTag kind="D" /></strong>
              <span>Installed MW <b>{formatNumber(Math.round(plantTotals.installed))}</b></span>
              <span>Available MW <b>{formatNumber(Math.round(plantTotals.present))}</b></span>
              <span>Day peak MW <b>{formatNumber(Math.round(plantTotals.dayPeak))}</b></span>
              <span>Evening peak MW <b>{formatNumber(Math.round(plantTotals.evePeak))}</b></span>
              <span>Energy MKWh <b className="text-primary">{fmt(plantTotals.energyKwh / 1_000_000, 3)}</b></span>
            </div>
          </div>
        ) : renewablePlants.length ? (
          <div className="grid-explorer-table-wrap">
            <table className="grid-explorer-table">
              <thead>
                <tr>
                  <th>Station</th>
                  {/* Attributes PGCB states about the station, so marked like
                      the register's Agency and Status columns. */}
                  <th>
                    Fuel
                    <GridProvenanceTag kind="P" className="ml-1" />
                  </th>
                  <th>
                    Producer
                    <GridProvenanceTag kind="P" className="ml-1" />
                  </th>
                  <th className="text-right">Installed (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                  <th className="text-right">Available (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                  <th className="text-right">Day peak (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                  <th className="text-right">Evening peak (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                  <th className="text-right">Energy (MKWh)<GridProvenanceTag kind="P" className="ml-1" /></th>
                </tr>
              </thead>
              <tbody>
                {renewablePlants.map((p) => {
                  const Icon = FUEL_ICON[p.fuel] ?? Sun;
                  return (
                    <tr key={p.name}>
                      <td className="font-semibold">{p.name}</td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs">
                          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: FUEL_COLOR[p.fuel] }} />
                          {p.fuel}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground">{p.producer || '—'}</td>
                      <td className="text-right tabular-nums">{p.installedMw ?? '—'}</td>
                      <td className="text-right tabular-nums">{p.presentCapacityMw ?? '—'}</td>
                      <td className="text-right tabular-nums">{p.dayPeakMw ?? '—'}</td>
                      <td className="text-right tabular-nums">{p.eveningPeakMw ?? '—'}</td>
                      <td className="text-right tabular-nums font-medium">
                        {p.energyKwh == null ? '—' : fmt(p.energyKwh / 1_000_000, 3)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border/80 font-bold bg-muted/20">
                  <td colSpan={3}>
                    {renewablePlants.length} stations<GridProvenanceTag kind="D" className="ml-1" />
                  </td>
                  <td className="text-right tabular-nums">{formatNumber(Math.round(plantTotals.installed))}</td>
                  <td className="text-right tabular-nums">{formatNumber(Math.round(plantTotals.present))}</td>
                  <td className="text-right tabular-nums">{formatNumber(Math.round(plantTotals.dayPeak))}</td>
                  <td className="text-right tabular-nums">{formatNumber(Math.round(plantTotals.evePeak))}</td>
                  <td className="text-right tabular-nums text-primary">
                    {fmt(plantTotals.energyKwh / 1_000_000, 3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <CardNotice>
            PGCB published no per-station table for {isoDate || 'this date'}, or the day&rsquo;s
            workbook did not reconcile against its own totals. Nothing from a neighbouring day is
            shown in its place.
          </CardNotice>
        )}

        {stationVsFuel.length > 0 && (
          <div className="mb-3 p-3 rounded-lg border border-border/50 bg-muted/15">
            <div className="text-[11px] font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              {stationVsFuel.every((c) => c.ok) ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              Stations reconciled against PGCB&rsquo;s own fuel totals
            </div>
            <div className="space-y-0.5">
              {stationVsFuel.map((c) => (
                <div key={c.fuel} className="flex justify-between gap-3 text-[11px] tabular-nums">
                  <span className="text-muted-foreground">
                    {c.fuel} — {c.stations} station{c.stations === 1 ? '' : 's'} sum
                    <GridProvenanceTag kind="D" className="ml-1" />
                  </span>
                  <span>
                    {fmt(c.computed)} vs {fmt(c.published, 2)} MKWh published
                    <GridProvenanceTag kind="P" className="ml-1" />
                    <span className={c.ok ? 'text-emerald-600 dark:text-emerald-400 font-bold ml-2' : 'text-amber-600 dark:text-amber-400 font-bold ml-2'}>
                      {c.ok ? 'agrees' : `differs by ${fmt(c.delta)}`}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <MobileFold title="How the stations are checked">
              <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
                The station table and the fuel table are different pages of the same PGCB report, so
                each fuel&rsquo;s stations should sum to its published energy. Band is half of the last
                digit PGCB prints, once per figure summed.
              </p>
            </MobileFold>
          </div>
        )}

        <div className="pb-3 text-[11px] text-muted-foreground leading-relaxed">
          Solar stations report a day peak and no evening peak, because the evening peak is measured
          after sunset. A zero there is a real reading, not a gap.
        </div>

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href={PGCB} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              PGCB Daily Report — station table
            </a>
          </span>
          <span className="font-medium">Reported day: {isoDate || '—'}</span>
        </GridCardFooter>
      </div>

      {/* ── SREDA capacity register ── */}
      {sredaState === 'error' || !sreda ? (
        <EmptyCard
          title="SREDA register unavailable"
          reason="No SREDA snapshot could be loaded. Nothing is shown rather than figures from an earlier date under today's heading."
        />
      ) : (
        <>
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">
                  Installed Capacity by Technology
                  {(sreda.technologyBreakdown?.length ?? 0) > 0 && (
                    <CountChip>{sreda.technologyBreakdown!.length} technologies</CountChip>
                  )}
                </h3>
                <p className="grid-explorer-chart-card__sub">
                  SREDA National Database of Renewable Energy — as published {sreda.lastUpdate}
                </p>
              </div>
            </div>

            {sreda.technologyBreakdown?.length ? (
              <div className="grid-explorer-table-wrap">
                <table className="grid-explorer-table ge-compact-table ge-rn-tech">
                  <thead>
                    <tr>
                      <th>Technology</th>
                      <th className="text-right">Installations<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Off-grid (MWp)<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">On-grid (MWp)<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Total (MWp)<GridProvenanceTag kind="P" className="ml-1" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map(({ source, rows }) => {
                      const Icon = FUEL_ICON[source] ?? Sun;
                      const open = openTech.has(source);
                      const sums = rows.reduce(
                        (acc, r) => {
                          acc.quantity += r.quantity;
                          acc.offGridMwp += r.offGridMwp;
                          acc.onGridMwp += r.onGridMwp;
                          acc.totalMwp += r.totalMwp;
                          return acc;
                        },
                        { quantity: 0, offGridMwp: 0, onGridMwp: 0, totalMwp: 0 },
                      );
                      return (
                        <Fragment key={source}>
                          <tr
                            className="bg-muted/20 cursor-pointer hover:bg-muted/30"
                            aria-expanded={open}
                            onClick={() => toggleTech(source)}
                          >
                            <td className="font-bold text-xs uppercase tracking-wide">
                              <span className="flex items-center gap-2 ge-rn-tech__name">
                                {open ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                                {source}
                                <GridProvenanceTag kind="D" />
                                <span className="text-muted-foreground font-normal normal-case tracking-normal">
                                  {rows.length} {rows.length === 1 ? 'technology' : 'technologies'}
                                </span>
                              </span>
                            </td>
                            <td className="text-right tabular-nums text-muted-foreground">
                              {sums.quantity.toLocaleString('en-US')}
                            </td>
                            <td className="text-right tabular-nums">{fmt(sums.offGridMwp)}</td>
                            <td className="text-right tabular-nums">{fmt(sums.onGridMwp)}</td>
                            <td className="text-right tabular-nums font-medium">{fmt(sums.totalMwp)}</td>
                          </tr>
                          {open && rows.map((r) => (
                            <tr key={`${source}-${r.technology}`}>
                              <td className="pl-6">{r.technology}</td>
                              <td className="text-right tabular-nums text-muted-foreground">
                                {r.quantity.toLocaleString('en-US')}
                              </td>
                              <td className="text-right tabular-nums">{fmt(r.offGridMwp)}</td>
                              <td className="text-right tabular-nums">{fmt(r.onGridMwp)}</td>
                              <td className="text-right tabular-nums font-medium">{fmt(r.totalMwp)}</td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                    {sreda.technologyTotals && (
                      <tr className="border-t border-border/80 font-bold bg-muted/20">
                        <td>SREDA published total<GridProvenanceTag kind="P" className="ml-1" /></td>
                        <td className="text-right tabular-nums">
                          {sreda.technologyTotals.quantity.toLocaleString('en-US')}
                        </td>
                        <td className="text-right tabular-nums">{fmt(sreda.technologyTotals.offGridMwp)}</td>
                        <td className="text-right tabular-nums">{fmt(sreda.technologyTotals.onGridMwp)}</td>
                        <td className="text-right tabular-nums text-primary">{fmt(sreda.technologyTotals.totalMwp)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <CardNotice>
                SREDA&rsquo;s technology-wise page could not be read for this snapshot.
              </CardNotice>
            )}

            <MobileFold title="Installations vs MWp: how to read this">
              <div className="pb-3 text-[11px] text-muted-foreground leading-relaxed">
                <strong>Installations</strong>{' '}
                is a count, not a capacity: 6,037,583 solar home systems
                sit beside 14 solar parks, so the columns cannot be ranked against each other.
                <strong> MWp</strong>{' '}
                is peak DC capacity as SREDA reports it — not the MW used above
                for grid capacity and output. Each source row sums the SREDA-published
                technology rows beneath it — {small ? 'tap' : 'click'} a source to expand or collapse them.
              </div>
            </MobileFold>

            <GridCardFooter>
              <span>
                Source:{' '}
                <a href={`${NDRE}index.php?id=8`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                  SREDA NDRE — Technology wise Generation
                </a>
              </span>
              <span className="font-medium">SREDA last update: {sreda.lastUpdate}</span>
            </GridCardFooter>
          </div>

          {/* ── National installed capacity mix, and commissioning by year ── */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="grid-explorer-chart-card card">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">National Installed Capacity Mix</h3>
                  <p className="grid-explorer-chart-card__sub">
                    Every fuel SREDA counts towards national capacity, renewables among them
                  </p>
                </div>
              </div>

              {sreda.generationMix?.length ? (
                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table ge-compact-table">
                    <thead>
                      <tr>
                        <th>Fuel / Resource</th>
                        <th className="text-right">Installed Capacity (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                        <th className="text-right">Share<GridProvenanceTag kind="P" className="ml-1" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sreda.generationMix.map((r) => {
                        const isRenewable = r.fuel.toLowerCase() === 'renewable';
                        return (
                          <tr key={r.fuel} className={isRenewable ? 'bg-primary/5' : undefined}>
                            <td className={isRenewable ? 'font-bold text-primary' : 'font-semibold'}>{r.fuel}</td>
                            <td className="text-right tabular-nums">{formatNumber(r.capacityMw)}</td>
                            <td className="text-right tabular-nums">{r.sharePct.toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t border-border/80 font-bold bg-muted/20">
                        <td>SREDA published total<GridProvenanceTag kind="P" className="ml-1" /></td>
                        <td className="text-right tabular-nums text-primary">
                          {formatNumber(sreda.totalInstalledMw)}
                        </td>
                        {/*
                          SREDA's Total row spans the capacity and share columns
                          and prints only "32474 MW" — it states no total share.
                          This sum of the printed shares is ours, and marking it
                          P alongside the published capacity claimed SREDA had
                          stated a figure it never printed.
                        */}
                        <td className="text-right tabular-nums">
                          {sreda.generationMix.reduce((s, r) => s + r.sharePct, 0).toFixed(2)}%
                          <GridProvenanceTag kind="D" className="ml-1" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <CardNotice>
                  SREDA&rsquo;s generation-mix page could not be read for this snapshot.
                </CardNotice>
              )}

              <MobileFold title="MW vs MWp on this page">
                <div className="pb-3 text-[11px] text-muted-foreground leading-relaxed">
                  This page states renewable capacity in <strong>MW</strong>; the technology page states
                  the same quantity in <strong>MWp</strong>. SREDA uses both labels for it, and the two
                  figures differ slightly — the reconciliation below reports that rather than picking one.
                </div>
              </MobileFold>

              <GridCardFooter>
                <span>
                  Source:{' '}
                  <a href={`${NDRE}index.php?id=7`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    SREDA NDRE — Electricity Generation Mix
                  </a>
                </span>
                <span className="font-medium">SREDA last update: {sreda.lastUpdate}</span>
              </GridCardFooter>
            </div>

            <div className="grid-explorer-chart-card card">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <Building2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">Capacity Added by Year</h3>
                  <p className="grid-explorer-chart-card__sub">
                    When SREDA records each block of capacity as having come on
                  </p>
                </div>
              </div>

              {sreda.yearWiseTables?.length ? (
                <div className="space-y-4">
                  {sreda.yearWiseTables.map((table) => (
                    <YearWiseTable key={table.category} table={table} />
                  ))}
                  <MobileFold title="What the year column means">
                    <YearAttributionNote tables={sreda.yearWiseTables} />
                  </MobileFold>
                </div>
              ) : (
                <CardNotice>
                  SREDA&rsquo;s year-wise pages could not be read for this snapshot.
                </CardNotice>
              )}

              <GridCardFooter>
                <span>
                  Source:{' '}
                  <a href={`${NDRE}index.php?id=11`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    SREDA NDRE — Year wise Generation
                  </a>
                </span>
                <span className="font-medium">SREDA last update: {sreda.lastUpdate}</span>
              </GridCardFooter>
            </div>
          </div>

          {/* ── Project register ── */}
          {sreda.projectRegisters?.length ? (
            <ProjectRegisterCard
              registers={sreda.projectRegisters}
              technologyBreakdown={sreda.technologyBreakdown ?? []}
              reconciliation={checks}
              lastUpdate={sreda.lastUpdate}
            />
          ) : null}

          {/* ── Owning organisations ── */}
          {sreda.organisationTables?.length ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {sreda.organisationTables.map((table) => (
                <div key={table.category} className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                    <Building2 className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h3 className="grid-explorer-chart-card__title">{table.category}</h3>
                      {/*
                        These organisations are the owners SREDA attributes capacity to in its own
                        table — not separate publishers. The sub-heading says so rather than letting
                        a reader infer BPDB or IDCOL reported these figures to us directly.
                      */}
                      <p className="grid-explorer-chart-card__sub">
                        By implementing organisation, as attributed by SREDA
                      </p>
                    </div>
                  </div>
                  <div className="grid-explorer-table-wrap">
                    <table className="grid-explorer-table ge-compact-table">
                      <thead>
                        <tr>
                          <th>Organisation</th>
                          <th className="text-right">
                            Units
                            <GridProvenanceTag kind="P" className="ml-1" />
                          </th>
                          <th className="text-right">
                            Capacity
                            <GridProvenanceTag kind="P" className="ml-1" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((r) => (
                          <tr key={r.organisation}>
                            <td className="font-semibold">
                              {r.organisation}
                              {ORG_FULL_NAME[r.organisation] && (
                                <span className="block text-[10px] font-normal text-muted-foreground leading-tight">
                                  {ORG_FULL_NAME[r.organisation]}
                                </span>
                              )}
                            </td>
                            <td className="text-right tabular-nums text-muted-foreground align-top">
                              {r.quantity.toLocaleString('en-US')}
                            </td>
                            <td className="text-right tabular-nums align-top">{r.capacityPublished}</td>
                          </tr>
                        ))}
                        {table.publishedTotalMwp !== null && (
                          <tr className="border-t border-border/80 font-bold bg-muted/20">
                            <td>Total<GridProvenanceTag kind="P" className="ml-1" /></td>
                            <td className="text-right tabular-nums">
                              {table.publishedTotalQuantity?.toLocaleString('en-US') ?? '—'}
                            </td>
                            {/* SREDA's own string. Rendering the converted MWp
                                showed 0.29 MWp for a total published as
                                290.9 kWp. */}
                            <td className="text-right tabular-nums text-primary">
                              {table.publishedTotalCapacity ?? `${fmt(table.publishedTotalMwp, 2)} MWp`}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <GridCardFooter>
                    <span>
                      Source:{' '}
                      <a href={table.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                        SREDA NDRE
                      </a>
                    </span>
                  </GridCardFooter>
                </div>
              ))}
            </div>
          ) : null}

          {/* ── Reconciliation ── */}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              {failed.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              )}
              <div className="min-w-0">
                <h3 className="grid-explorer-chart-card__title">
                  Reconciliation of SREDA&rsquo;s own totals
                  <CountChip>
                    {checks.length - failed.length} agree · {failed.length} differ
                  </CountChip>
                </h3>
                <p className="grid-explorer-chart-card__sub">
                  Each published total recomputed from the rows above it, and compared where two
                  SREDA pages state the same quantity
                </p>
              </div>
            </div>

            {checks.length ? (
              <>
                {/* The differences are the story; the other 29 rows are a
                    guarantee, not reading. Default to the ones that moved. */}
                <div className="pt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground">
                    {showAllChecks
                      ? `Showing all ${checks.length} checks`
                      : failed.length > 0
                        ? `Showing the ${failed.length} that differ`
                        : 'Every check agrees'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllChecks((v) => !v)}
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    {showAllChecks ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" /> Show only differences
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" /> Show all {checks.length} checks
                      </>
                    )}
                  </button>
                </div>

                <div className="grid-explorer-table-wrap mt-2 ge-rn-scroll">
                <table className="grid-explorer-table">
                  <thead>
                    <tr>
                      <th>Check</th>
                      <th className="text-right">SREDA states<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Recomputed<GridProvenanceTag kind="D" className="ml-1" /></th>
                      {/* The gap, the band and the verdict are all ours: SREDA
                          publishes neither a difference nor a tolerance. */}
                      <th className="text-right">
                        Difference
                        <GridProvenanceTag kind="D" className="ml-1" />
                      </th>
                      <th className="text-right">
                        Band
                        <GridProvenanceTag kind="D" className="ml-1" />
                      </th>
                      <th className="text-right">
                        Result
                        <GridProvenanceTag kind="D" className="ml-1" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllChecks || failed.length === 0 ? checks : failed).map((c) => (
                      <tr key={c.check}>
                        <td className="text-xs">{c.check}</td>
                        <td className="text-right tabular-nums">{fmt(c.published)}</td>
                        <td className="text-right tabular-nums">{fmt(c.computed)}</td>
                        <td className="text-right tabular-nums">
                          {c.delta > 0 ? '+' : ''}
                          {fmt(c.delta)}
                        </td>
                        <td className="text-right tabular-nums text-muted-foreground">±{c.tolerance}</td>
                        <td className="text-right">
                          <span
                            className={
                              c.ok
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-amber-600 dark:text-amber-400 font-bold'
                            }
                          >
                            {c.ok ? 'agrees' : 'differs'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            ) : (
              <CardNotice>No reconciliation available for this snapshot.</CardNotice>
            )}

            <MobileFold title="How the band is set">
            <div className="pb-4 text-[11px] text-muted-foreground leading-relaxed">
              The band is half of the last digit SREDA prints, once per figure summed — derived from
              how the source states its numbers, not chosen.
              {failed.length > 0 && (
                <>
                  {' '}
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {failed.length} check{failed.length === 1 ? '' : 's'} differ
                  </span>{' '}
                  — two SREDA pages state a different figure for the same quantity on the same day.
                  Both are shown as published. Neither has been adjusted to match the other, and no
                  third figure has been invented to reconcile them.
                </>
              )}
            </div>
            </MobileFold>

            <GridCardFooter>
              <span>
                Source:{' '}
                <a href={NDRE} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                  SREDA NDRE
                </a>
              </span>
              <span className="font-medium">Recomputed by ESB PowerLine from SREDA&rsquo;s published rows</span>
            </GridCardFooter>
          </div>

          {/* ── Carbon: SREDA's projection, labelled as such ── */}
          {sreda.carbonEstimates?.length ? (
            <div className="grid-explorer-chart-card card">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <Leaf className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">Energy &amp; Carbon — Projection</h3>
                  <p className="grid-explorer-chart-card__sub">
                    Modelled projections published by SREDA, not metered generation
                  </p>
                </div>
              </div>

              <MobileFold title="These are estimates: read before using">
              <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                <strong>These are estimates, including the &ldquo;so far&rdquo; column.</strong>{' '}
                SREDA heads both of its column groups &ldquo;Expected Energy Generation&rdquo; — the figures
                are modelled from installed capacity and elapsed time, not measured at a meter. SREDA
                publishes neither the yield assumption nor the emission factor behind them, so they
                cannot be checked, and they are reproduced verbatim rather than recalculated. The
                metered renewable output is in the PGCB cards above.
              </div>
              </MobileFold>

              {/*
                Same cell treatment as every other table in this tab: the label
                column is semibold, figures are plain tabular numerals, and the
                published Total row is the only emphasised one. The four
                projection columns were muted here and nowhere else, which made
                this card read as a different component.
              */}
              <div className="grid-explorer-table-wrap mt-3 ge-rn-scroll">
                <table className="grid-explorer-table">
                  <thead>
                    <tr>
                      <th>Technology</th>
                      <th className="text-right">Installed<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Expected over system life<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Expected CO₂ avoided<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Expected so far<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-right">Expected CO₂ so far<GridProvenanceTag kind="P" className="ml-1" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sreda.carbonEstimates.map((r) => {
                      const isTotal = /^total$/i.test(r.technology);
                      return (
                        <tr
                          key={r.technology}
                          className={isTotal ? 'border-t border-border/80 font-bold bg-muted/20' : undefined}
                        >
                          <td className="font-semibold">{r.technology}</td>
                          <td className="text-right tabular-nums">{r.installedCapacity}</td>
                          <td className="text-right tabular-nums">{r.lifetimeEnergyExpected}</td>
                          <td className="text-right tabular-nums">{r.lifetimeCo2Expected}</td>
                          <td className="text-right tabular-nums">{r.tillTodayEnergyExpected}</td>
                          <td className="text-right tabular-nums">{r.tillTodayCo2Expected}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <GridCardFooter>
                <span>
                  Source:{' '}
                  <a href={`${NDRE}index.php?id=21`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    SREDA NDRE — Energy Generation and Carbon Savings
                  </a>
                </span>
                <span className="font-medium">SREDA last update: {sreda.lastUpdate}</span>
              </GridCardFooter>
            </div>
          ) : null}
        </>
      )}

      <UnitsGlossary />
    </div>
  );
}

/**
 * Phone/tablet card for one renewable station: name + fuel, three key figures
 * (installed, day peak, energy), the rest behind a tap. Same styles as the
 * Power Stations tab's cards; all eight table columns remain reachable.
 */
function RenewableStationCard({ p }: { p: PlantRow }) {
  const [open, setOpen] = useState(false);
  const Icon = FUEL_ICON[p.fuel] ?? Sun;
  return (
    <li className="ge-plant-card">
      <button type="button" className="ge-plant-card__btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ge-plant-card__top">
          <span className="ge-plant-card__name">{p.name}</span>
          {p.fuel ? (
            <span className="ge-plant-card__chip inline-flex items-center gap-1">
              <Icon className="h-3 w-3 shrink-0" style={{ color: FUEL_COLOR[p.fuel] }} aria-hidden />
              {p.fuel}
            </span>
          ) : null}
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
        </span>
        <span className="ge-plant-card__figs">
          <span className="ge-plant-card__fig">
            <span className="ge-plant-card__lab">Installed MW <GridProvenanceTag kind="P" /></span>
            <span className="ge-plant-card__val">{p.installedMw ?? '—'}</span>
          </span>
          <span className="ge-plant-card__fig">
            <span className="ge-plant-card__lab">Day peak MW <GridProvenanceTag kind="P" /></span>
            <span className="ge-plant-card__val font-semibold">{p.dayPeakMw ?? '—'}</span>
          </span>
          <span className="ge-plant-card__fig">
            <span className="ge-plant-card__lab">Energy MKWh <GridProvenanceTag kind="P" /></span>
            <span className="ge-plant-card__val">{p.energyKwh == null ? '—' : fmt(p.energyKwh / 1_000_000, 3)}</span>
          </span>
        </span>
      </button>
      {open && (
        <dl className="ge-plant-card__more">
          <div><dt>Producer <GridProvenanceTag kind="P" /></dt><dd>{p.producer || '—'}</dd></div>
          <div><dt>Available MW <GridProvenanceTag kind="P" /></dt><dd>{p.presentCapacityMw ?? '—'}</dd></div>
          <div><dt>Evening peak MW <GridProvenanceTag kind="P" /></dt><dd>{p.eveningPeakMw ?? '—'}</dd></div>
        </dl>
      )}
    </li>
  );
}

/**
 * Plain-language definitions for every unit on this tab.
 *
 * The agencies mix MW with MWp and kWp, MKWh with GWh and TWh, and tCO₂ with
 * "k tCO₂" and "M tCO₂" — sometimes inside a single table. A reader who does not
 * work in the sector cannot be expected to carry those conversions, and getting
 * one wrong changes a figure by a factor of a thousand.
 */
function UnitsGlossary() {
  const groups: { heading: string; items: { term: string; plain: string }[] }[] = [
    {
      heading: 'Power — how much at one moment',
      items: [
        {
          term: 'MW',
          plain:
            'Megawatt. A rate, not an amount — how much electricity is flowing right now. One megawatt is a million watts, roughly the draw of a few hundred homes.',
        },
        {
          term: 'MWp',
          plain:
            'Megawatt-peak. The most a solar array can produce under standard test conditions — full sun, cool panel. Real output is lower nearly all the time, so MWp and MW are not the same measure and are never added together here.',
        },
        {
          term: 'kWp',
          plain:
            'Kilowatt-peak. One thousandth of a MWp. SREDA prints small installations this way in the same column as large ones, so 292.08 kWp sits beside 43.47 MWp and means far less.',
        },
      ],
    },
    {
      heading: 'Energy — how much over a period',
      items: [
        {
          term: 'kWh',
          plain:
            'Kilowatt-hour — one bar of an electric heater running for an hour. Every unit below is a multiple of it.',
        },
        {
          term: 'MWh',
          plain: 'Megawatt-hour. One thousand kWh. SREDA uses it for its smallest categories.',
        },
        {
          term: 'MKWh',
          plain:
            'Million kilowatt-hours — the unit PGCB uses for a day or a month of generation. Same size as a GWh.',
        },
        {
          term: 'GWh',
          plain: 'Gigawatt-hour. One thousand MWh, and equal to one MKWh.',
        },
        {
          term: 'TWh',
          plain:
            'Terawatt-hour. One thousand GWh — about a month and a half of Bangladesh’s entire electricity generation.',
        },
      ],
    },
    {
      heading: 'Carbon',
      items: [
        {
          term: 'tCO₂',
          plain:
            'Tonnes of carbon dioxide. Here it means emissions SREDA calculates were avoided by generating with renewables instead of fossil fuel.',
        },
        {
          term: 'k tCO₂ · M tCO₂',
          plain: 'Thousand and million tonnes of CO₂. SREDA abbreviates them this way in its own table.',
        },
      ],
    },
    {
      heading: 'Other terms',
      items: [
        {
          term: 'On-grid · Off-grid',
          plain:
            'On-grid feeds the national network. Off-grid serves its own site only — a solar home system, an irrigation pump — and never reaches the grid, so it does not appear in PGCB’s generation figures.',
        },
        {
          term: 'Tk/kWh',
          plain:
            'Taka per kilowatt-hour: what a unit of electricity cost to produce. No agency publishes this rate; it is cost divided by energy, which is why it is marked D.',
        },
        {
          term: 'Installations',
          plain:
            'A count of separate systems, not capacity. Six million solar home systems and fourteen solar parks are both counts, and the two columns cannot be compared.',
        },
      ],
    },
  ];

  return (
    <div className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
        <Info className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <h3 className="grid-explorer-chart-card__title">Units on this page</h3>
          <p className="grid-explorer-chart-card__sub">
            What each abbreviation means, in plain terms
          </p>
        </div>
      </div>
      <MobileFold title="Definitions: power, energy, carbon, other terms">
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.heading}>
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
              {g.heading}
            </h4>
            <dl className="space-y-2">
              {g.items.map((it) => (
                <div key={it.term}>
                  <dt className="text-xs font-bold text-foreground">{it.term}</dt>
                  <dd className="text-[11px] text-muted-foreground leading-relaxed">{it.plain}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {/*
        The marking rule, stated rather than left to be inferred. Without it the
        unmarked first column of every table reads as an oversight.
      */}
      <div className="pb-4 text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Where the marks go.</strong>{' '}
        Every column that states something about a row carries{' '}
        <GridProvenanceTag kind="P" /> or <GridProvenanceTag kind="D" />. The first column of each
        table is the row&rsquo;s own name — the station, technology, organisation, project or year it
        describes — and is left unmarked, because it identifies the row rather than asserting a
        figure about it. Chart series carry the mark in the legend.
      </div>
      </MobileFold>

      <GridCardFooter>
        <span>
          <GridProvenanceTag kind="P" /> a figure the named agency publishes, reproduced unchanged ·{' '}
          <GridProvenanceTag kind="D" /> a figure we calculated from published figures
        </span>
        <span className="font-medium">Definitions by ESB PowerLine</span>
      </GridCardFooter>
    </div>
  );
}

export default RenewablesTab;
