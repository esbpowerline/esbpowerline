'use client';

import { useMemo , type ReactNode} from 'react';
import { History } from 'lucide-react';
import { MacroGasInnerSection } from '../MacroGasSectionChrome';
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
import { cn, formatNumber, formatTooltipDate, formatDynamicXAxisDate } from '@/lib/utils';
import { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import { movingAverage } from '@/lib/data/petrobangla/compute';
import type { ArchiveRangePreset } from '@/lib/data/petrobangla/archiveRange';
import type { PetrobanglaTimelineDay, PetrobanglaTimelineSummary } from '@/lib/data/petrobangla/types';
import { ArchiveBadge, ArchiveChartFooter, ArchiveInsightCallout, ArchiveRangeLockedOverlay } from './PetrobanglaArchiveShared';
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';
import { useBelowDesktop } from '@/components/news/power-grid/useTapToRead';

export function PetrobanglaArchiveNationalTimeline({
  timeline,
  rangeDays,
  preset,
  chartsReady,
  showMa = false,
  embedded = false,
  compact = false,
  rangeToolbar,
  onClose,
}: {
  timeline: PetrobanglaTimelineSummary;
  rangeDays: PetrobanglaTimelineDay[];
  preset: ArchiveRangePreset;
  chartsReady: boolean;
  showMa?: boolean;
  embedded?: boolean;
  compact?: boolean;
  rangeToolbar?: ReactNode;
  onClose?: () => void;
}) {
  const chartTheme = useChartTheme();
  // Phones: short weekday names on the 1W axis (see formatDynamicXAxisDate).
  const narrowAxis = useBelowDesktop();

  const chartData = useMemo(() => {
    const totals = rangeDays.map((r) => r.total_gas);
    const ma = movingAverage(totals, 7);
    return rangeDays.map((r, i) => ({
      date: r.date,
      label: r.date.slice(0, 7),
      domestic: r.domestic_gas,
      lng: r.lng_gas,
      total: r.total_gas,
      totalMa: ma[i],
    }));
  }, [rangeDays]);

  const legendItems = useMemo((): GridChartLegendItem[] => {
    const items: GridChartLegendItem[] = [
      { id: 'domestic', label: 'Domestic gas', color: PB_ARCHIVE_COLORS.domestic, variant: 'area', provenance: 'D' },
      { id: 'lng', label: 'Imported LNG', color: PB_ARCHIVE_COLORS.lng, variant: 'area', provenance: 'P' },
      { id: 'total', label: 'Grand total', color: PB_ARCHIVE_COLORS.totalLine, variant: 'dashed', provenance: 'P' },
    ];
    if (showMa) {
      items.push({ id: 'ma', label: '7-day MA', color: PB_ARCHIVE_COLORS.ma, variant: 'line', provenance: 'D' });
    }
    return items;
  }, [showMa]);

  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

  const chartBlock = (
    <div className="gas-reserve-archive-chart-block">
      <ArchiveRangeLockedOverlay preset={preset} onClose={onClose}>
        <div
          className={cn(
            'grid-explorer-chart-area w-full gas-reserve-archive-chart-block__plot',
            compact ? 'gas-reserve-archive-timeline' : 'grid-explorer-chart-area--lg',
          )}
        >
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart role="img" aria-label="National Gas Timeline, chart" accessibilityLayer={false} data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                <XAxis
                  {...gridChartXAxisProps(chartTheme, {
                    dataKey: 'date',
                    tickFormatter: (v: string) => formatDynamicXAxisDate(v, chartData.length, narrowAxis),
                    interval: Math.max(0, Math.floor(chartData.length / 12)),
                  })}
                />
                <YAxis
                  {...gridChartYAxisProps(chartTheme, {
                    tickFormatter: (v) => formatNumber(v, 0),
                    domain: [0, 'auto'],
                  })}
                />
                <GridRechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as (typeof chartData)[0];
                    return (
                      <GridChartTooltipShell title={formatTooltipDate(d.date)} accent={PB_ARCHIVE_COLORS.domestic}>
                        <div className="grid-chart-tooltip__grid">
                          <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                            <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.domestic }} />
                            Domestic gas
                            <GridProvenanceTag kind="D" />
                          </span>
                          <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.domestic }}>
                            {formatNumber(d.domestic, 1)} MMCFD
                          </span>
                          <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                            <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.lng }} />
                            Imported LNG
                            <GridProvenanceTag kind="P" />
                          </span>
                          <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.lng }}>
                            {formatNumber(d.lng, 1)} MMCFD
                          </span>
                          <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                            <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.totalLine }} />
                            Grand total
                            <GridProvenanceTag kind="P" />
                          </span>
                          <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.totalLine }}>
                            {formatNumber(d.total, 1)} MMCFD
                          </span>
                          {showMa && d.totalMa != null && (
                            <>
                              <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                                <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.ma }} />
                                7-day MA
                                <GridProvenanceTag kind="D" />
                              </span>
                              <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.ma }}>
                                {formatNumber(d.totalMa, 1)} MMCFD
                              </span>
                            </>
                          )}
                        </div>
                      </GridChartTooltipShell>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="domestic"
                  stackId="1"
                  stroke={PB_ARCHIVE_COLORS.domestic}
                  fill={PB_ARCHIVE_COLORS.domestic}
                  fillOpacity={0.22}
                  strokeWidth={2}
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="lng"
                  stackId="1"
                  stroke={PB_ARCHIVE_COLORS.lng}
                  fill={PB_ARCHIVE_COLORS.lng}
                  fillOpacity={0.28}
                  strokeWidth={2}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={PB_ARCHIVE_COLORS.totalLine}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: PB_ARCHIVE_COLORS.totalLine }}
                  legendType="none"
                />
                {showMa && (
                  <Line
                    type="monotone"
                    dataKey="totalMa"
                    stroke={PB_ARCHIVE_COLORS.ma}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Loading national timeline...
            </div>
          )}
        </div>
      </ArchiveRangeLockedOverlay>
      {chartsReady && (
        <ChartDataTable
          caption="National Gas Timeline — domestic gas vs imported LNG and grand total, by day"
          categoryHeader="Date"
          categories={chartData.map((d) => d.date)}
          series={[
            { label: 'Domestic gas', unit: 'MMCFD', values: columnOf(chartData, 'domestic') },
            { label: 'Imported LNG', unit: 'MMCFD', values: columnOf(chartData, 'lng') },
            { label: 'Grand total', unit: 'MMCFD', values: columnOf(chartData, 'total') },
            ...(showMa
              ? [{ label: '7-day MA', unit: 'MMCFD', values: columnOf(chartData, 'totalMa') }]
              : []),
          ]}
        />
      )}
      {chartsReady && (
        <GridChartExternalLegend
          items={legendItems}
          className="mt-4"
        />
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={wrapperClass}>
        <MacroGasInnerSection
          icon={History}
          title="National Timeline"
          subtitle={`${timeline.ok_days.toLocaleString()} verified days — domestic vs LNG`}
          toolbar={rangeToolbar}
        >
          <div className="space-y-3">
            {chartBlock}
          </div>
        </MacroGasInnerSection>
      </div>
    );
  }

  return (
    <div className={cn(wrapperClass, 'space-y-4')}>
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border flex items-center gap-2.5">
        <History className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <h3 className="grid-explorer-chart-card__title">
            National Gas Timeline (2020—today)<ArchiveBadge />
          </h3>
          <p className="grid-explorer-chart-card__sub">
            Domestic fields vs imported LNG · {timeline.ok_days.toLocaleString()} verified days
          </p>
        </div>
      </div>
      <ArchiveInsightCallout>
        Domestic fields vs imported LNG — LNG rising while domestic output falls is the long-term pattern.
      </ArchiveInsightCallout>
      {chartBlock}
    </div>
  );
}
