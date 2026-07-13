'use client';

import { useMemo , type ReactNode} from 'react';
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
  GridChartTooltipShell,
  GridRechartsTooltip,
  gridChartXAxisProps,
  gridChartYAxisProps,
  GridRechartsLegend,
} from '@/components/news/PowerGridChartUI';
import { cn, formatNumber, formatTooltipDate } from '@/lib/utils';
import { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import { filterTimelineDays, stressedPlants, worstPowerGapDays } from '@/lib/data/petrobangla/compute';
import type { ArchiveRangePreset } from '@/lib/data/petrobangla/archiveRange';
import type { AudienceMode, PetrobanglaDaily, PetrobanglaTimelineDay } from '@/lib/data/petrobangla/types';
import { ArchiveBadge, ArchiveChartFooter, ArchiveRangeLockedOverlay } from './PetrobanglaArchiveShared';

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
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: POWER_GAP_COLORS.demand }}>
          {formatNumber(d.demand, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: POWER_GAP_COLORS.supply }} />
          Power supply
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: POWER_GAP_COLORS.supply }}>
          {formatNumber(d.supply, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: POWER_GAP_COLORS.gap }} />
          Shortage
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: POWER_GAP_COLORS.gap }}>
          {formatNumber(d.gap, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: fulfillmentColor }} />
          Fulfillment
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
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <div>
            <h3 className="grid-explorer-chart-card__title">Power Gas Gap<ArchiveBadge /></h3>
            <p className="grid-explorer-chart-card__sub">Power sector gas demand vs actual supply · why plants starve</p>
          </div>
        </div>
      )}

      <ArchiveRangeLockedOverlay preset={preset} className="mt-4 px-4" onClose={onClose}>
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.dualAxis}>
                <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'date', tickFormatter: (v: string) => v.slice(0, 7), interval: Math.floor(chartData.length / 10) })} />
                <YAxis yAxisId="left" {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => formatNumber(v, 0) })} />
                <YAxis yAxisId="right" orientation="right" {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => `${v}%`, domain: [0, 100] })} />
                <GridRechartsTooltip content={<PowerGapTooltip />} cursor={{ stroke: chartTheme.gridStroke, strokeWidth: 1 }} />
                <GridRechartsLegend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="gap"
                  name="Shortage (MMCFD)"
                  fill={POWER_GAP_COLORS.gap}
                  stroke={POWER_GAP_COLORS.gap}
                  fillOpacity={0.15}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="demand"
                  name="Power demand"
                  stroke={POWER_GAP_COLORS.demand}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="supply"
                  name="Power supply"
                  stroke={POWER_GAP_COLORS.supply}
                  strokeWidth={2}
                  dot={false}
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
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid-explorer-skeleton" />
          )}
        </div>
      </ArchiveRangeLockedOverlay>

      <div className="p-4 grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Worst 10 days (gap)</h4>
          <div className="grid-explorer-table-wrap max-h-48 overflow-auto">
            <table className="grid-explorer-table text-xs">
              <thead><tr><th>Date</th><th>Gap MMCFD</th><th>Fulfillment</th></tr></thead>
              <tbody>
                {worst.map((w) => (
                  <tr key={w.date}>
                    <td>{w.date}</td>
                    <td className="text-red-500 tabular-nums">{formatNumber(w.gap, 1)}</td>
                    <td className="tabular-nums">{w.fulfillment.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Stressed plants · {selectedDay ? selectedDay.report.report_date_start : '—'}
          </h4>
          <div className="grid-explorer-table-wrap max-h-48 overflow-auto">
            <table className="grid-explorer-table text-xs">
              <thead><tr><th>Plant</th><th>DISCO</th><th>Demand</th><th>Supply</th></tr></thead>
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
