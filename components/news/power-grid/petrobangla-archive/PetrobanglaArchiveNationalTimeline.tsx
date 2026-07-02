'use client';

import { useMemo, useState } from 'react';
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
import { cn, formatNumber } from '@/lib/utils';
import { PB_ARCHIVE_COLORS, ARCHIVE_START_DATE } from '@/lib/data/petrobangla/constants';
import { filterTimelineDays, movingAverage } from '@/lib/data/petrobangla/compute';
import type { AudienceMode, PetrobanglaTimelineSummary } from '@/lib/data/petrobangla/types';
import { ArchiveBadge, ArchiveChartFooter, ArchiveInsightCallout } from './PetrobanglaArchiveShared';

type RangePreset = '1Y' | '3Y' | 'ALL';

export function PetrobanglaArchiveNationalTimeline({
  timeline,
  mode,
  chartsReady,
  embedded = false,
  compact = false,
}: {
  timeline: PetrobanglaTimelineSummary;
  mode: AudienceMode;
  chartsReady: boolean;
  embedded?: boolean;
  compact?: boolean;
}) {
  const chartTheme = useChartTheme();
  const [preset, setPreset] = useState<RangePreset>('ALL');
  const [showMa, setShowMa] = useState(mode === 'analyst');

  const chartData = useMemo(() => {
    const end = timeline.days[timeline.days.length - 1]?.date;
    let start = ARCHIVE_START_DATE;
    if (preset === '1Y' && end) {
      const [y, m, d] = end.split('-').map(Number);
      start = `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    } else if (preset === '3Y' && end) {
      const [y, m, d] = end.split('-').map(Number);
      start = `${y - 3}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    const rows = filterTimelineDays(timeline.days, start, end);
    const totals = rows.map((r) => r.total_gas);
    const ma = movingAverage(totals, 7);
    return rows.map((r, i) => ({
      date: r.date,
      label: r.date.slice(0, 7),
      domestic: r.domestic_gas,
      lng: r.lng_gas,
      total: r.total_gas,
      totalMa: ma[i],
    }));
  }, [timeline, preset]);

  const legendItems = useMemo((): GridChartLegendItem[] => {
    const items: GridChartLegendItem[] = [
      { id: 'domestic', label: 'Domestic gas', color: PB_ARCHIVE_COLORS.domestic, variant: 'area' },
      { id: 'lng', label: 'Imported LNG', color: PB_ARCHIVE_COLORS.lng, variant: 'area' },
      { id: 'total', label: 'Grand total', color: PB_ARCHIVE_COLORS.totalLine, variant: 'dashed' },
    ];
    if (showMa) {
      items.push({ id: 'ma', label: '7-day MA', color: PB_ARCHIVE_COLORS.ma, variant: 'line' });
    }
    return items;
  }, [showMa]);

  const rangeControls = (
    <div className="gas-reserve-archive-view-toolbar__controls">
      <div className="gas-reserve-archive-range" role="group" aria-label="Timeline range">
        {(['1Y', '3Y', 'ALL'] as RangePreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={cn(
              'gas-reserve-archive-range__btn',
              preset === p && 'gas-reserve-archive-range__btn--active',
            )}
          >
            {p === 'ALL' ? 'All' : p}
          </button>
        ))}
      </div>
      {mode === 'analyst' && (
        <button
          type="button"
          onClick={() => setShowMa((v) => !v)}
          className={cn(
            'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle',
            showMa && 'gas-reserve-archive-range__btn--active',
          )}
        >
          7-day MA
        </button>
      )}
    </div>
  );

  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

  return (
    <div className={cn(wrapperClass, compact ? 'space-y-3' : 'space-y-4')}>
      {compact ? (
        <div className="gas-reserve-archive-view-toolbar">
          <div className="min-w-0">
            <p className="gas-reserve-archive-view-toolbar__title">National timeline</p>
            <p className="gas-reserve-archive-view-toolbar__sub">
              {timeline.ok_days.toLocaleString()} verified days · domestic vs LNG
            </p>
          </div>
          {rangeControls}
        </div>
      ) : (
        <>
          <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
            <div className="flex-1 min-w-0">
              <h3 className="grid-explorer-chart-card__title">
                National Gas Timeline (2020→today)<ArchiveBadge />
              </h3>
              <p className="grid-explorer-chart-card__sub">
                Domestic fields vs imported LNG · {timeline.ok_days.toLocaleString()} verified days
              </p>
            </div>
            {rangeControls}
          </div>
          <ArchiveInsightCallout>
            Domestic fields vs imported LNG — LNG rising while domestic output falls is the long-term pattern.
          </ArchiveInsightCallout>
        </>
      )}

      <div className="gas-reserve-archive-chart-block">
        <div
          className={cn(
            'grid-explorer-chart-area w-full gas-reserve-archive-chart-block__plot',
            compact ? 'gas-reserve-archive-timeline' : 'grid-explorer-chart-area--lg',
          )}
        >
        {chartsReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
              <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
              <XAxis
                {...gridChartXAxisProps(chartTheme, {
                  dataKey: 'date',
                  tickFormatter: (v: string) => v.slice(0, 7),
                  interval: Math.floor(chartData.length / 12),
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
                    <GridChartTooltipShell title={d.date} accent={PB_ARCHIVE_COLORS.domestic}>
                      <div className="grid-chart-tooltip__grid">
                        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.domestic }} />
                          Domestic gas
                        </span>
                        <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.domestic }}>
                          {formatNumber(d.domestic, 1)} MMCFD
                        </span>
                        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.lng }} />
                          Imported LNG
                        </span>
                        <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.lng }}>
                          {formatNumber(d.lng, 1)} MMCFD
                        </span>
                        <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.totalLine }} />
                          Grand total
                        </span>
                        <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.totalLine }}>
                          {formatNumber(d.total, 1)} MMCFD
                        </span>
                        {showMa && d.totalMa != null && (
                          <>
                            <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                              <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.ma }} />
                              7-day MA
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
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                legendType="none"
              />
              {showMa && (
                <Line
                  type="monotone"
                  dataKey="totalMa"
                  stroke={PB_ARCHIVE_COLORS.ma}
                  strokeWidth={1.5}
                  dot={false}
                  legendType="none"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid-explorer-skeleton" />
        )}
        </div>

        <GridChartExternalLegend items={legendItems} position="bottom" />
      </div>

      {!compact && (
        <ArchiveChartFooter
          embedded={embedded}
          dayCount={chartData.length}
          caption="Domestic production vs LNG imports. Dashed line = national total."
        />
      )}
    </div>
  );
}