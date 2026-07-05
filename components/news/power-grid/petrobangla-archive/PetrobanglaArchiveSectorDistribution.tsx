'use client';

import { useMemo } from 'react';
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
import { formatNumber } from '@/lib/utils';
import { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import { filterTimelineDays } from '@/lib/data/petrobangla/compute';
import type { ArchiveRangePreset } from '@/lib/data/petrobangla/archiveRange';
import type { PetrobanglaTimelineDay } from '@/lib/data/petrobangla/types';
import { ArchiveBadge, ArchiveChartFooter, ArchiveRangeLockedOverlay } from './PetrobanglaArchiveShared';

const SECTOR_COLORS = {
  powerSupply: PB_ARCHIVE_COLORS.domestic,
  fertSupply: PB_ARCHIVE_COLORS.fertilizer,
  others: PB_ARCHIVE_COLORS.others,
  powerDemand: PB_ARCHIVE_COLORS.powerDemand,
} as const;

type SectorRow = {
  date: string;
  powerSupply: number;
  powerDemand: number;
  fertSupply: number;
  fertDemand: number;
  others: number;
};

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

  const total = d.powerSupply + d.fertSupply + d.others;
  const powerShare = total > 0 ? (d.powerSupply / total) * 100 : 0;
  const fertShare = total > 0 ? (d.fertSupply / total) * 100 : 0;
  const othersShare = total > 0 ? (d.others / total) * 100 : 0;

  const powerFulfillment = d.powerDemand > 0 ? (d.powerSupply / d.powerDemand) * 100 : 0;
  const fertFulfillment = d.fertDemand > 0 ? (d.fertSupply / d.fertDemand) * 100 : 0;

  return (
    <GridChartTooltipShell title={d.date} accent={SECTOR_COLORS.powerSupply}>
      <div className="grid-chart-tooltip__grid" style={{ gridTemplateColumns: 'auto auto auto auto', gap: '0.4rem 0.8rem', alignItems: 'center' }}>
        <span className="text-[9px] font-bold text-muted-foreground uppercase">Sector</span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">Volume</span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">Share of Day</span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">Fulfillment</span>

        {/* Power Sector Row */}
        <span className="grid-chart-tooltip__label flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: SECTOR_COLORS.powerSupply }} />
          Power supply
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-semibold" style={{ color: SECTOR_COLORS.powerSupply }}>
          {formatNumber(d.powerSupply, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right text-muted-foreground/80">
          {powerShare.toFixed(1)}%
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-bold" style={{ color: powerFulfillment >= 80 ? '#10b981' : powerFulfillment >= 50 ? '#f59e0b' : '#ef4444' }}>
          {powerFulfillment.toFixed(1)}%
        </span>

        {/* Fertilizer Sector Row */}
        <span className="grid-chart-tooltip__label flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: SECTOR_COLORS.fertSupply }} />
          Fertilizer
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-semibold" style={{ color: SECTOR_COLORS.fertSupply }}>
          {formatNumber(d.fertSupply, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right text-muted-foreground/80">
          {fertShare.toFixed(1)}%
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-bold" style={{ color: fertFulfillment >= 80 ? '#10b981' : fertFulfillment >= 50 ? '#f59e0b' : '#ef4444' }}>
          {fertFulfillment.toFixed(1)}%
        </span>

        {/* Others/Industry Row */}
        <span className="grid-chart-tooltip__label flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: SECTOR_COLORS.others }} />
          Others / Industry
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-semibold" style={{ color: SECTOR_COLORS.others }}>
          {formatNumber(d.others, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right text-muted-foreground/80">
          {othersShare.toFixed(1)}%
        </span>
        <span className="grid-chart-tooltip__value tabular-nums text-right font-medium text-muted-foreground/40">
          —
        </span>
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
}: {
  rangeDays: PetrobanglaTimelineDay[];
  preset: ArchiveRangePreset;
  chartsReady: boolean;
  embedded?: boolean;
  compact?: boolean;
}) {
  const chartTheme = useChartTheme();

  const chartData = useMemo(() => {
    return filterTimelineDays(rangeDays).map((d) => ({
      date: d.date,
      powerSupply: d.power_supply ?? 0,
      powerDemand: d.power_demand ?? 0,
      fertSupply: d.fertilizer_supply ?? 0,
      fertDemand: d.fertilizer_demand ?? 0,
      others: d.others_mmcfd ?? 0,
    }));
  }, [rangeDays]);

  const wrapperClass = embedded ? 'space-y-4 grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

  return (
    <div className={wrapperClass}>
      {!compact && (
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <div>
            <h3 className="grid-explorer-chart-card__title">Who Gets the Gas<ArchiveBadge /></h3>
            <p className="grid-explorer-chart-card__sub">Sector allocation — power, fertilizer, industry/others</p>
          </div>
        </div>
      )}

      <ArchiveRangeLockedOverlay preset={preset} className="mt-4">
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'date', tickFormatter: (v: string) => v.slice(0, 7), interval: Math.floor(chartData.length / 10) })} />
                <YAxis {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => formatNumber(v, 0) })} />
                <GridRechartsTooltip content={<SectorTooltip />} cursor={{ stroke: chartTheme.gridStroke, strokeWidth: 1 }} />
                <GridRechartsLegend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="others" name="Others/Industry" stackId="s" fill={SECTOR_COLORS.others} stroke={SECTOR_COLORS.others} fillOpacity={0.2} />
                <Area type="monotone" dataKey="fertSupply" name="Fertilizer supply" stackId="s" fill={SECTOR_COLORS.fertSupply} stroke={SECTOR_COLORS.fertSupply} fillOpacity={0.25} />
                <Area type="monotone" dataKey="powerSupply" name="Power supply" stackId="s" fill={SECTOR_COLORS.powerSupply} stroke={SECTOR_COLORS.powerSupply} fillOpacity={0.2} />
                <Line type="monotone" dataKey="powerDemand" name="Power demand" stroke={SECTOR_COLORS.powerDemand} strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid-explorer-skeleton" />
          )}
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