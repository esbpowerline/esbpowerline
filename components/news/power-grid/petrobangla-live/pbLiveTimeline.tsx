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
  GridChartExternalLegend,
  GridChartTooltipShell,
  GridRechartsTooltip,
  gridChartXAxisProps,
  gridChartYAxisProps,
} from '@/components/news/PowerGridChartUI';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { cn, formatNumber, formatTooltipDate, formatDynamicXAxisDate } from '@/lib/utils';
import { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import { liveWeekTimelinePoints, formatLiveWeekAxisLabel } from '@/lib/data/petrobangla/computeLiveWeek';
import { decimateTimelineDays } from '@/lib/data/petrobangla/compute';
import type { PetrobanglaLiveWeekBundle, PetrobanglaTimelineDay } from '@/lib/data/petrobangla/types';
import { LiveBadge } from './pbLiveShared';
import { chartGridProps } from '@/lib/data/grid/chart-axis';

function LiveWeekTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ReturnType<typeof liveWeekTimelinePoints>[number] & { highlight?: boolean } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const nationalColor = PB_ARCHIVE_COLORS.national;
  const demandColor = PB_ARCHIVE_COLORS.powerDemand;
  const supplyColor = PB_ARCHIVE_COLORS.powerSupply;
  const fulfillmentColor = d.fulfillment < 45 ? PB_ARCHIVE_COLORS.shortage : PB_ARCHIVE_COLORS.fertilizer;

  // Format the ISO date, not the window label: "01-02 Aug, 2026" parses as
  // 1 August 2002. Every other tooltip in the grid UI passes d.date.
  return (
    <GridChartTooltipShell title={formatTooltipDate(d.date)} accent={nationalColor}>
      <div className="grid-chart-tooltip__grid">
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: nationalColor }} />
          National gas
          <GridProvenanceTag kind="P" />
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: nationalColor }}>
          {formatNumber(d.totalGas, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: demandColor }} />
          Power demand
          <GridProvenanceTag kind="P" />
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: demandColor }}>
          {formatNumber(d.powerDemand, 1)} MMCFD
        </span>
        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: supplyColor }} />
          Power supply
          <GridProvenanceTag kind="P" />
        </span>
        <span className="grid-chart-tooltip__value" style={{ color: supplyColor }}>
          {formatNumber(d.powerSupply, 1)} MMCFD
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
      {d.highlight && (
        <div className="grid-chart-tooltip__foot text-primary font-semibold">Grid date highlighted</div>
      )}
    </GridChartTooltipShell>
  );
}

export function PbLiveTimeline({
  bundle,
  timelineDays,
  chartsReady,
  highlightDate,
  compact = false,
  fillHeight = false,
}: {
  bundle?: PetrobanglaLiveWeekBundle;
  timelineDays?: PetrobanglaTimelineDay[];
  chartsReady: boolean;
  highlightDate?: string;
  compact?: boolean;
  fillHeight?: boolean;
}) {
  const chartTheme = useChartTheme();
  const dayCount = timelineDays ? timelineDays.length : bundle ? bundle.days.length : 0;

  const points = useMemo(() => {
    if (timelineDays) {
      return timelineDays.map((d) => ({
        date: d.date,
        label: d.date,
        axisLabel: formatDynamicXAxisDate(d.date, timelineDays.length),
        totalGas: d.total_gas,
        powerDemand: d.power_demand ?? 0,
        powerSupply: d.power_supply ?? 0,
        fulfillment: d.power_fulfillment_pct ?? 0,
      }));
    }
    if (bundle) {
      return liveWeekTimelinePoints(bundle);
    }
    return [];
  }, [bundle, timelineDays]);

  const decimatedPoints = useMemo(() => decimateTimelineDays(points, 180), [points]);

  const data = useMemo(() => {
    return decimatedPoints.map((p) => ({
      ...p,
      highlight: p.date === highlightDate,
    }));
  }, [decimatedPoints, highlightDate]);

  const nationalColor = PB_ARCHIVE_COLORS.national;
  const demandColor = PB_ARCHIVE_COLORS.powerDemand;

  return (
    <div className={cn('flex flex-col', fillHeight ? 'flex-1 min-h-0 gap-2' : 'space-y-3')}>
      {!compact && (
        <h4 className="grid-explorer-chart-card__title text-sm shrink-0">
          {dayCount}-day timeline<LiveBadge />
        </h4>
      )}
      <div className="gas-reserve-archive-chart-block">
        <div
          className={cn(
            'grid-explorer-chart-area grid-explorer-chart-area--md w-full gas-reserve-archive-chart-block__plot',
            fillHeight && 'gas-reserve-live-week__chart-area',
            compact && !fillHeight && 'min-h-[10rem]',
          )}
        >
        {chartsReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart role="img" aria-label="{dayCount}-day timeline, chart" data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
              <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
              <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'axisLabel', minTickGap: 30 })} />
              <YAxis yAxisId="left" {...gridChartYAxisProps(chartTheme, { domain: [0, 'auto'] })} />
              <GridRechartsTooltip content={<LiveWeekTooltip />} cursor={{ stroke: chartTheme.gridStroke, strokeWidth: 1 }} />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="powerSupply"
                fill={PB_ARCHIVE_COLORS.powerSupply}
                stroke={PB_ARCHIVE_COLORS.powerSupply}
                fillOpacity={0.22}
                legendType="none"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalGas"
                stroke={nationalColor}
                strokeWidth={2.5}
                dot={{ r: 4, fill: nationalColor }}
                legendType="none"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="powerDemand"
                stroke={demandColor}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                legendType="none"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid-explorer-skeleton" />
        )}
        </div>
        <GridChartExternalLegend
          position="bottom"
          items={[
            { id: 'national', label: 'National gas', color: nationalColor, variant: 'line', provenance: 'P' },
            { id: 'demand', label: 'Power demand', color: demandColor, variant: 'dashed', provenance: 'P' },
            { id: 'supply', label: 'Power supply', color: PB_ARCHIVE_COLORS.powerSupply, variant: 'area', provenance: 'P' },
          ]}
        />
      </div>
      <p className={cn('text-[10px] text-muted-foreground leading-relaxed flex flex-wrap items-center gap-x-2', fillHeight && 'shrink-0')}>
        <span>
          {compact
            ? 'National supply, power demand, and allocation.'
            : `Supply, power demand, and allocation — ${dayCount} gas-days.`}
        </span>
        {highlightDate && data.some((d) => d.highlight) && (
          <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            Grid date highlighted
          </span>
        )}
      </p>
    </div>
  );
}