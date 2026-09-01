'use client';

import { useMemo , type ReactNode} from 'react';
import { CalendarX2, Factory, Flame } from 'lucide-react';
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
import { filterTimelineDays, stressedPlants, worstPowerGapDays } from '@/lib/data/petrobangla/compute';
import type { ArchiveRangePreset } from '@/lib/data/petrobangla/archiveRange';
import type { AudienceMode, PetrobanglaDaily, PetrobanglaTimelineDay } from '@/lib/data/petrobangla/types';
import { ArchiveBadge, ArchiveChartFooter, ArchiveRangeLockedOverlay } from './PetrobanglaArchiveShared';
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';

const POWER_GAP_COLORS = {
  demand: PB_ARCHIVE_COLORS.powerDemand,
  supply: PB_ARCHIVE_COLORS.powerSupply,
  gap: PB_ARCHIVE_COLORS.shortage,
  fulfillment: PB_ARCHIVE_COLORS.lng,
} as const;

type PowerGapRow = {
  date: string;
  demand: number;
  supply: number;
  gap: number;
  fulfillment: number;
};

function PowerGapTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: PowerGapRow }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const fulfillmentColor = POWER_GAP_COLORS.fulfillment;

  return (
    <GridChartTooltipShell title={formatTooltipDate(d.date)} accent={POWER_GAP_COLORS.demand}>
      <div className="grid-chart-tooltip__grid">
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: POWER_GAP_COLORS.demand }} />
          Power demand
          <GridProvenanceTag kind="P" />
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: POWER_GAP_COLORS.demand }}>
          {formatNumber(d.demand, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: POWER_GAP_COLORS.supply }} />
          Power supply
          <GridProvenanceTag kind="P" />
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: POWER_GAP_COLORS.supply }}>
          {formatNumber(d.supply, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: POWER_GAP_COLORS.gap }} />
          Shortage
          <GridProvenanceTag kind="D" />
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: POWER_GAP_COLORS.gap }}>
          {formatNumber(d.gap, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: fulfillmentColor }} />
          Fulfillment
          <GridProvenanceTag kind="D" />
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: fulfillmentColor }}>
          {d.fulfillment.toFixed(1)}%
        </span>
      </div>
      <div className="grid-chart-tooltip__foot mt-2 pt-1.5 border-t border-border/20 text-[9px] text-muted-foreground leading-normal space-y-0.5">
        <div><strong>Calculation:</strong> Shortage = Power Demand - Power Supply.</div>
        <div>Fulfillment = Power Supply / Power Demand (below 50% raises grid instability risk).</div>
      </div>
    </GridChartTooltipShell>
  );
}

export function PetrobanglaArchivePowerGap({
  rangeDays,
  preset,
  selectedDay,
  mode,
  chartsReady,
  embedded = false,
  compact = false,
  rangeToolbar,
  onClose,
}: {
  rangeDays: PetrobanglaTimelineDay[];
  preset: ArchiveRangePreset;
  selectedDay: PetrobanglaDaily | null;
  mode: AudienceMode;
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
      demand: d.power_demand ?? 0,
      supply: d.power_supply ?? 0,
      gap: (d.power_demand ?? 0) - (d.power_supply ?? 0),
      fulfillment: d.power_fulfillment_pct ?? 0,
    }));
  }, [rangeDays]);

  const worst = worstPowerGapDays(filterTimelineDays(rangeDays), 10);
  const plants = selectedDay ? stressedPlants(selectedDay) : [];

  const legendItems: GridChartLegendItem[] = [
    { id: 'demand', label: 'Power demand', color: POWER_GAP_COLORS.demand, variant: 'line', provenance: 'P' },
    { id: 'supply', label: 'Power supply', color: POWER_GAP_COLORS.supply, variant: 'line', provenance: 'P' },
    { id: 'gap', label: 'Shortage (MMCFD)', color: POWER_GAP_COLORS.gap, variant: 'area', provenance: 'D' },
    { id: 'fulfillment', label: 'Fulfillment %', color: POWER_GAP_COLORS.fulfillment, variant: 'dashed', provenance: 'D' },
  ];

  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

  return (
    <div className={cn(wrapperClass, compact ? 'space-y-3' : 'space-y-4')}>
      {compact && (
        <div className="gas-reserve-archive-view-toolbar flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="gas-reserve-archive-view-toolbar__title">Power Sector Gas Gap</p>
            <p className="gas-reserve-archive-view-toolbar__sub">
              Grid-scale rationing
            </p>
          </div>
          {rangeToolbar && <div className="shrink-0">{rangeToolbar}</div>}
        </div>
      )}
      {!compact && (
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border flex items-center gap-2.5">
          <Flame className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <h3 className="grid-explorer-chart-card__title">Power Gas Gap<ArchiveBadge /></h3>
            <p className="grid-explorer-chart-card__sub">Power sector gas demand vs actual supply · why plants starve</p>
          </div>
        </div>
      )}

      <ArchiveRangeLockedOverlay preset={preset} className="mt-4 px-4" onClose={onClose}>
        <div className="gas-reserve-archive-chart-block">
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg gas-reserve-archive-chart-block__plot">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart role="img" aria-label="Power Gas Gap, chart" accessibilityLayer={false} data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.dualAxis}>
                <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
                <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'date', tickFormatter: (v: string) => v.slice(0, 7), interval: Math.floor(chartData.length / 10) })} />
                <YAxis yAxisId="left" {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => formatNumber(v, 0) })} />
                <YAxis yAxisId="right" orientation="right" {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => `${v}%`, domain: [0, 100] })} />
                <GridRechartsTooltip content={<PowerGapTooltip />} cursor={{ stroke: chartTheme.gridStroke, strokeWidth: 1 }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="gap"
                  name="Shortage (MMCFD)"
                  fill={POWER_GAP_COLORS.gap}
                  stroke={POWER_GAP_COLORS.gap}
                  fillOpacity={0.15}
                  legendType="none"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="demand"
                  name="Power demand"
                  stroke={POWER_GAP_COLORS.demand}
                  strokeWidth={2}
                  dot={false}
                  legendType="none"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="supply"
                  name="Power supply"
                  stroke={POWER_GAP_COLORS.supply}
                  strokeWidth={2}
                  dot={false}
                  legendType="none"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fulfillment"
                  name="Fulfillment %"
                  stroke={POWER_GAP_COLORS.fulfillment}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid-explorer-skeleton" />
          )}
        </div>
        <ChartDataTable
          caption="Power Gas Gap — power sector gas demand vs supply, shortage and fulfillment, by day"
          categoryHeader="Date"
          categories={chartData.map((d) => d.date)}
          series={[
            { label: 'Power demand', unit: 'MMCFD', values: columnOf(chartData, 'demand') },
            { label: 'Power supply', unit: 'MMCFD', values: columnOf(chartData, 'supply') },
            { label: 'Shortage', unit: 'MMCFD', values: columnOf(chartData, 'gap') },
            { label: 'Fulfillment', unit: '%', values: columnOf(chartData, 'fulfillment') },
          ]}
        />
        <GridChartExternalLegend items={legendItems} position="bottom" />
        </div>
      </ArchiveRangeLockedOverlay>

      <div className="p-4 grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <CalendarX2 className="h-4 w-4 shrink-0 text-primary" />
            Worst 10 days (gap)
          </h4>
          <div className="grid-explorer-table-wrap max-h-48 overflow-auto">
            <table className="grid-explorer-table text-xs">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Gap MMCFD<GridProvenanceTag kind="D" className="ml-1" /></th>
                  <th>Fulfillment<GridProvenanceTag kind="D" className="ml-1" /></th>
                </tr>
              </thead>
              <tbody>
                {worst.map((w) => (
                  <tr key={w.date}>
                    <td className="tabular-nums">{w.date}</td>
                    <td className="text-red-500 tabular-nums">{formatNumber(w.gap, 1)}</td>
                    <td className="tabular-nums">{w.fulfillment.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Factory className="h-4 w-4 shrink-0 text-primary" />
            <span className="tabular-nums">
              Stressed plants · {selectedDay ? selectedDay.report.report_date_start : '—'}
            </span>
          </h4>
          <div className="grid-explorer-table-wrap max-h-48 overflow-auto">
            <table className="grid-explorer-table text-xs">
              <thead>
                <tr>
                  <th>Plant</th>
                  <th>DISCO</th>
                  <th>Demand<GridProvenanceTag kind="P" className="ml-1" /></th>
                  <th>Supply<GridProvenanceTag kind="P" className="ml-1" /></th>
                </tr>
              </thead>
              <tbody>
                {plants.slice(0, mode === 'simple' ? 8 : 20).map((p) => (
                  <tr key={`${p.disco}-${p.name}`}>
                    <td className="font-medium max-w-[140px] truncate" title={p.name}>{p.name}</td>
                    <td>{p.disco}</td>
                    <td className="tabular-nums">{formatNumber(p.demand, 1)}</td>
                    <td className={cnSupply(p.supply)}>{formatNumber(p.supply, 1)}</td>
                  </tr>
                ))}
                {plants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted-foreground">
                      {selectedDay ? 'No plant outages reported.' : 'Loading daily detail...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!compact && (
        <ArchiveChartFooter
          embedded={embedded}
          day={selectedDay ?? undefined}
          caption="Power plants request gas and receive far less than demanded — below 50% fulfillment, load-shedding risk rises sharply."
        />
      )}
    </div>
  );
}

function cnSupply(s: number) {
  return s === 0 ? 'tabular-nums text-red-500 font-bold' : 'tabular-nums';
}
