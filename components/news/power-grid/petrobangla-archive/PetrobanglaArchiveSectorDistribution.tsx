'use client';

import { useMemo , type ReactNode} from 'react';
import { PieChart } from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import {
  GRID_EXPLORER_CHART_MARGIN,
  GridChartExternalLegend,
  GridChartTooltipShell,
  GridRechartsTooltip,
  gridChartXAxisProps,
  gridChartYAxisProps,
  type GridChartLegendItem,
} from '@/components/news/PowerGridChartUI';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { cn, formatNumber, formatTooltipDate } from '@/lib/utils';
import { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import { filterTimelineDays } from '@/lib/data/petrobangla/compute';
import type { ArchiveRangePreset } from '@/lib/data/petrobangla/archiveRange';
import type { PetrobanglaTimelineDay } from '@/lib/data/petrobangla/types';
import { ArchiveBadge, ArchiveChartFooter, ArchiveRangeLockedOverlay } from './PetrobanglaArchiveShared';
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import {
  SERIES_COLORS,
  SERIES_UNMAPPED,
  STATUS_COLORS,
  CHART_INK,
} from '@/lib/data/grid/chart-palette';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';

const SECTOR_COLORS = {
  powerSupply: PB_ARCHIVE_COLORS.domestic,
  fertSupply: PB_ARCHIVE_COLORS.fertilizer,
  others: PB_ARCHIVE_COLORS.others,
  powerDemand: PB_ARCHIVE_COLORS.powerDemand,
} as const;

// null where Petrobangla published nothing for the day. These used to be
// `?? 0`, which drew an unpublished window as a real zero — a national gas
// collapse on the chart and "0.0" in the screen-reader table. Null is not zero.
type SectorRow = {
  date: string;
  powerSupply: number | null;
  powerDemand: number | null;
  fertSupply: number | null;
  fertDemand: number | null;
  others: number | null;
};

const mmcfd = (v: number | null) => (v === null ? '—' : `${formatNumber(v, 1)} MMCFD`);
const pct = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)}%`);
const ratio = (num: number | null, den: number | null) =>
  num === null || den === null || den <= 0 ? null : (num / den) * 100;

function SectorTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: SectorRow }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  // A share of the day needs every sector published; one missing row makes the
  // total — and therefore every share — unknowable, not smaller.
  const total =
    d.powerSupply === null || d.fertSupply === null || d.others === null
      ? null
      : d.powerSupply + d.fertSupply + d.others;
  const powerShare = ratio(d.powerSupply, total);
  const fertShare = ratio(d.fertSupply, total);
  const othersShare = ratio(d.others, total);

  const powerFulfillment = ratio(d.powerSupply, d.powerDemand);
  const fertFulfillment = ratio(d.fertSupply, d.fertDemand);

  return (
    <GridChartTooltipShell title={formatTooltipDate(d.date)} accent={SECTOR_COLORS.powerSupply}>
      <div className="grid-chart-tooltip__grid" style={{ gridTemplateColumns: 'auto auto auto auto', gap: '0.4rem 0.8rem', alignItems: 'center' }}>
        <span className="text-[9px] font-bold text-muted-foreground uppercase">Sector</span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">
          Volume<GridProvenanceTag kind="P" className="ml-1" />
        </span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">
          Share of Day<GridProvenanceTag kind="D" className="ml-1" />
        </span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">
          Fulfillment<GridProvenanceTag kind="D" className="ml-1" />
        </span>

        {/* Power Sector Row */}
        <span className="grid-chart-tooltip__label flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: SECTOR_COLORS.powerSupply }} />
          Power supply
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-semibold" style={{ color: SECTOR_COLORS.powerSupply }}>
          {mmcfd(d.powerSupply)}
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right text-muted-foreground/80">
          {pct(powerShare)}
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-bold" style={{ color: powerFulfillment === null ? undefined : powerFulfillment >= 80 ? SERIES_COLORS.retailDiesel : powerFulfillment >= 50 ? SERIES_COLORS.bdGasTariff : STATUS_COLORS.critical }}>
          {pct(powerFulfillment)}
        </span>

        {/* Fertilizer Sector Row */}
        <span className="grid-chart-tooltip__label flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: SECTOR_COLORS.fertSupply }} />
          Fertilizer
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-semibold" style={{ color: SECTOR_COLORS.fertSupply }}>
          {mmcfd(d.fertSupply)}
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right text-muted-foreground/80">
          {pct(fertShare)}
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-bold" style={{ color: fertFulfillment === null ? undefined : fertFulfillment >= 80 ? SERIES_COLORS.retailDiesel : fertFulfillment >= 50 ? SERIES_COLORS.bdGasTariff : STATUS_COLORS.critical }}>
          {pct(fertFulfillment)}
        </span>

        {/* Others/Industry Row */}
        <span className="grid-chart-tooltip__label flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: SECTOR_COLORS.others }} />
          Others / Industry
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-semibold" style={{ color: SECTOR_COLORS.others }}>
          {mmcfd(d.others)}
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right text-muted-foreground/80">
          {pct(othersShare)}
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-medium text-muted-foreground/40">
          —
        </span>
      </div>
      <div className="grid-chart-tooltip__foot mt-2 pt-1.5 border-t border-border/20 text-[9px] text-muted-foreground leading-normal space-y-0.5">
        <div><strong>Calculation:</strong> Share = Sector Supply / Total Supply ({total === null ? 'not fully published' : `${formatNumber(total, 1)} MMCFD`}).</div>
        <div>Fulfillment = Supply / Demand (Others is assumed 100% allocation).</div>
      </div>
    </GridChartTooltipShell>
  );
}

export function PetrobanglaArchiveSectorDistribution({
  rangeDays,
  preset,
  chartsReady,
  embedded = false,
  compact = false,
  rangeToolbar,
  onClose,
}: {
  rangeDays: PetrobanglaTimelineDay[];
  preset: ArchiveRangePreset;
  chartsReady: boolean;
  embedded?: boolean;
  compact?: boolean;
  rangeToolbar?: ReactNode;
  onClose?: () => void;
}) {
  const chartTheme = useChartTheme();

  const chartData = useMemo(() => {
    return filterTimelineDays(rangeDays).map((d) => ({
      date: d.date,
      powerSupply: d.power_supply ?? null,
      powerDemand: d.power_demand ?? null,
      fertSupply: d.fertilizer_supply ?? null,
      fertDemand: d.fertilizer_demand ?? null,
      others: d.others_mmcfd ?? null,
    }));
  }, [rangeDays]);

  const legendItems: GridChartLegendItem[] = [
    { id: 'powerSupply', label: 'Power supply', color: SECTOR_COLORS.powerSupply, variant: 'area', provenance: 'P' },
    { id: 'fertSupply', label: 'Fertilizer supply', color: SECTOR_COLORS.fertSupply, variant: 'area', provenance: 'P' },
    { id: 'others', label: 'Others/Industry', color: SECTOR_COLORS.others, variant: 'area', provenance: 'P' },
    { id: 'powerDemand', label: 'Power demand', color: SECTOR_COLORS.powerDemand, variant: 'dashed', provenance: 'P' },
  ];

  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

  return (
    <div className={cn(wrapperClass, compact ? 'space-y-3' : 'space-y-4')}>
      {compact && (
        <div className="gas-reserve-archive-view-toolbar flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="gas-reserve-archive-view-toolbar__title">Sector Gas Allocation</p>
            <p className="gas-reserve-archive-view-toolbar__sub">
              Power vs Fertilizer vs Others
            </p>
          </div>
          {rangeToolbar && <div className="shrink-0">{rangeToolbar}</div>}
        </div>
      )}
      {!compact && (
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border flex items-center gap-2.5">
          <PieChart role="img" aria-label="Sector Gas Allocation, chart" className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <h3 className="grid-explorer-chart-card__title">Who Gets the Gas<ArchiveBadge /></h3>
            <p className="grid-explorer-chart-card__sub">Sector allocation — power, fertilizer, industry/others</p>
          </div>
        </div>
      )}

      <ArchiveRangeLockedOverlay preset={preset} className="mt-4" onClose={onClose}>
        <div className="gas-reserve-archive-chart-block">
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg gas-reserve-archive-chart-block__plot">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart role="img" aria-label="Who Gets the Gas, chart" accessibilityLayer={false} data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'date', tickFormatter: (v: string) => v.slice(0, 7), interval: Math.floor(chartData.length / 10) })} />
                <YAxis {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => formatNumber(v, 0) })} />
                <GridRechartsTooltip content={<SectorTooltip />} cursor={{ stroke: chartTheme.gridStroke, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="others" name="Others/Industry" stackId="s" fill={SECTOR_COLORS.others} stroke={SECTOR_COLORS.others} fillOpacity={0.2} legendType="none" />
                <Area type="monotone" dataKey="fertSupply" name="Fertilizer supply" stackId="s" fill={SECTOR_COLORS.fertSupply} stroke={SECTOR_COLORS.fertSupply} fillOpacity={0.25} legendType="none" />
                <Area type="monotone" dataKey="powerSupply" name="Power supply" stackId="s" fill={SECTOR_COLORS.powerSupply} stroke={SECTOR_COLORS.powerSupply} fillOpacity={0.2} legendType="none" />
                <Line type="monotone" dataKey="powerDemand" name="Power demand" stroke={SECTOR_COLORS.powerDemand} strokeWidth={2} dot={false} strokeDasharray="4 4" legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid-explorer-skeleton" />
          )}
        </div>
        <ChartDataTable
          caption="Who Gets the Gas — sector allocation of power, fertilizer and other supply vs power demand, by day"
          categoryHeader="Date"
          categories={chartData.map((d) => d.date)}
          series={[
            { label: 'Power supply', unit: 'MMCFD', values: columnOf(chartData, 'powerSupply') },
            { label: 'Fertilizer supply', unit: 'MMCFD', values: columnOf(chartData, 'fertSupply') },
            { label: 'Others/Industry', unit: 'MMCFD', values: columnOf(chartData, 'others') },
            { label: 'Power demand', unit: 'MMCFD', values: columnOf(chartData, 'powerDemand') },
          ]}
        />
        <GridChartExternalLegend items={legendItems} position="bottom" />
        </div>
      </ArchiveRangeLockedOverlay>

      {!compact && (
        <ArchiveChartFooter
          embedded={embedded}
          dayCount={chartData.length}
          caption="Sector shares over time — power demand (dashed) vs what plants actually receive."
        />
      )}
    </div>
  );
}
