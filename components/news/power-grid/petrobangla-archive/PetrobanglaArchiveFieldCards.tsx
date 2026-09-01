'use client';

import { useMemo, useState , type ReactNode} from 'react';
import { Info, LineChart as LineChartIcon } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn, formatNumber } from '@/lib/utils';
import {
  FIELD_LIFELINE_META,
  MAJOR_FIELDS,
  PB_ARCHIVE_COLORS,
} from '@/lib/data/petrobangla/constants';
import type { ArchiveRangePreset } from '@/lib/data/petrobangla/archiveRange';
import type { AudienceMode, PetrobanglaDaily, PetrobanglaTimelineDay } from '@/lib/data/petrobangla/types';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { ArchiveBadge, ArchiveInsightCallout, ArchiveRangeLockedOverlay } from './PetrobanglaArchiveShared';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';

type SortKey = 'largest' | 'decline' | 'depleted';

function fieldInsight(mode: AudienceMode, fieldName: string): string {
  const meta = FIELD_LIFELINE_META[fieldName as keyof typeof FIELD_LIFELINE_META];
  if (!meta) return '';
  if (mode === 'researcher') return meta.researcher;
  if (mode === 'investor') return meta.investor;
  if (mode === 'analyst') return meta.analyst;
  return meta.simple;
}

const MODE_INTRO: Record<AudienceMode, string> = {
  simple: 'Hover a field for a plain-language snapshot. Click for daily history.',
  analyst: 'Sparklines show full archive trend. Hover for decline rates, well counts, and basin context.',
  investor: 'Concentration and import-cost risks highlighted. Hover for dependency signals.',
  researcher: 'Hover for operator, basin, and filing notes. Click opens raw daily series.',
};

export function PetrobanglaArchiveFieldCards({
  rangeDays,
  preset,
  latestDay,
  mode,
  embedded = false,
  compact = false,
  rangeToolbar,
  onClose,
}: {
  rangeDays: PetrobanglaTimelineDay[];
  preset: ArchiveRangePreset;
  latestDay: PetrobanglaDaily | null;
  mode: AudienceMode;
  embedded?: boolean;
  compact?: boolean;
  rangeToolbar?: ReactNode;
  onClose?: () => void;
}) {
  const [sort, setSort] = useState<SortKey>('largest');
  const [modalField, setModalField] = useState<string | null>(null);
  const [hoverField, setHoverField] = useState<string | null>(null);

  const cards = useMemo(() => {
    return MAJOR_FIELDS.map((fieldName) => {
      const series = rangeDays
        .map((d) => ({ date: d.date, gas: d.major_fields?.[fieldName] ?? 0 }))
        .filter((p) => p.gas > 0);
      const current = series[series.length - 1]?.gas ?? 0;
      const peak = series.reduce((best, p) => (p.gas > best.gas ? p : best), { date: '', gas: 0 });
      const pctFromPeak = peak.gas > 0 ? ((current - peak.gas) / peak.gas) * 100 : 0;
      const latestField = latestDay?.production.fields.find((f) => f.field === fieldName);
      const wells = latestField?.producing_wells ?? 0;
      const capacity = latestField?.capacity_mmcfd ?? 0;
      const util = capacity > 0 ? (current / capacity) * 100 : 0;
      const isRpgcl = fieldName === 'R-LNG Terminal';
      const domesticTotal = latestDay
        ? latestDay.production.fields
            .filter((f) => f.company_code !== 'RPGCL')
            .reduce((s, f) => s + f.gas_mmcfd, 0)
        : 0;
      const concentrationRisk = !isRpgcl && domesticTotal > 0 && fieldName === 'Bibiyana' && current / domesticTotal > 0.25;
      const meta = FIELD_LIFELINE_META[fieldName];

      const recent30 = series.slice(-30);
      const recentAvg = recent30.length
        ? recent30.reduce((s, p) => s + p.gas, 0) / recent30.length
        : 0;
      const trend30 = recent30.length >= 2
        ? recent30[recent30.length - 1].gas - recent30[0].gas
        : 0;
      const declineRate30 = (recent30.length >= 2 && recent30[0].gas > 0)
        ? (trend30 / recent30[0].gas) * 100
        : 0;

      return {
        fieldName,
        series,
        current,
        peak,
        pctFromPeak,
        wells,
        capacity,
        util,
        concentrationRisk,
        isRpgcl,
        meta,
        recentAvg,
        trend30,
        declineRate30,
      };
    });
  }, [rangeDays, latestDay]);

  const sorted = [...cards].sort((a, b) => {
    if (sort === 'largest') return b.current - a.current;
    if (sort === 'decline') return a.declineRate30 - b.declineRate30;
    return a.pctFromPeak - b.pctFromPeak;
  });

  const showDetail = mode !== 'simple';
  const wrapperClass = embedded ? 'space-y-4 grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

  return (
    <div className={wrapperClass}>
      <div
        className={cn(
          'grid-explorer-chart-card__head gas-reserve-field-sort',
          !embedded && 'grid-explorer-chart-card__head--border',
        )}
      >
        {compact && (
          <div className="gas-reserve-archive-view-toolbar flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            <div className="min-w-0 flex-1 text-center md:text-left">
              <p className="gas-reserve-archive-view-toolbar__title">Field Lifeline Cards</p>
              <p className="gas-reserve-archive-view-toolbar__sub">
                Major producers · archive sparklines
              </p>
            </div>
            {rangeToolbar && <div className="shrink-0">{rangeToolbar}</div>}
          </div>
        )}
        {!compact && (
          <div className="gas-reserve-field-sort__title">
            <h3 className="grid-explorer-chart-card__title">Field Lifeline Cards<ArchiveBadge /></h3>
            <p className="grid-explorer-chart-card__sub">
              Eight major producers · archive sparklines · hover for field context
            </p>
          </div>
        )}
        <div className="gas-reserve-field-sort__chips">
          {([
            ['largest', 'Largest producer'],
            ['decline', 'Fastest decline'],
            ['depleted', 'Most depleted'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              className={cn('grid-explorer-chip text-[10px] cursor-pointer', sort === k && 'bg-primary/10 text-primary')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground px-4 -mt-1 flex items-center gap-1.5">
        <Info className="h-3 w-3 shrink-0 opacity-70" />
        {MODE_INTRO[mode]}
      </p>

      {mode === 'investor' && (
        <ArchiveInsightCallout>
          Bibiyana concentration above 25% of domestic supply flags single-field dependency risk for the gas-to-power chain.
        </ArchiveInsightCallout>
      )}

      {mode === 'analyst' && (
        <ArchiveInsightCallout>
          30-day trend on each card complements the full-archive sparkline — use both to spot short-term swings vs structural decline.
        </ArchiveInsightCallout>
      )}

      <ArchiveRangeLockedOverlay preset={preset} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 p-4">
        {sorted.map((c) => {
          const isHovered = hoverField === c.fieldName;
          return (
            <div key={c.fieldName} className="relative">
              <button
                type="button"
                onClick={() => setModalField(c.fieldName)}
                onMouseEnter={() => setHoverField(c.fieldName)}
                onMouseLeave={() => setHoverField(null)}
                onFocus={() => setHoverField(c.fieldName)}
                onBlur={() => setHoverField(null)}
                className={cn(
                  'w-full text-left rounded-2xl border border-border/50 bg-muted/5 p-3 transition-colors',
                  'hover:border-primary/30 focus-visible:border-primary/40 focus-visible:outline-none',
                  isHovered && 'border-primary/25 shadow-sm',
                  c.concentrationRisk && mode === 'investor' && 'ring-1 ring-amber-500/30',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-sm leading-tight">{c.fieldName}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.concentrationRisk && mode === 'investor' && (
                      <span className="text-[9px] font-bold text-amber-500 uppercase">Risk</span>
                    )}
                    {c.isRpgcl && (
                      <span className="text-[9px] font-bold text-violet-500 uppercase">LNG</span>
                    )}
                  </div>
                </div>
                <div className="h-10 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      role="img"
                      aria-label={`${c.fieldName} gas production sparkline, chart`}
                      accessibilityLayer={false}
                      data={c.series}
                    >
                      <Line
                        type="monotone"
                        dataKey="gas"
                        stroke={c.isRpgcl ? PB_ARCHIVE_COLORS.lng : PB_ARCHIVE_COLORS.domestic}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <ChartDataTable
                    caption={`${c.fieldName} — daily gas production`}
                    categoryHeader="Date"
                    categories={c.series.map((p) => p.date)}
                    series={[
                      { label: c.fieldName, unit: 'MMCFD', values: columnOf(c.series, 'gas') },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-lg font-bold tabular-nums">
                  <span>
                    {formatNumber(c.current, 1)}{' '}
                    <span className="text-[10px] font-normal text-muted-foreground">MMCFD</span>
                  </span>
                  <GridProvenanceTag kind="P" />
                </div>
                <div className={cn('flex items-center gap-1.5 text-[10px] tabular-nums', c.pctFromPeak < -20 ? 'text-red-500' : 'text-muted-foreground')}>
                  <span>
                    {c.pctFromPeak >= 0 ? '+' : ''}{c.pctFromPeak.toFixed(0)}% from peak ({formatNumber(c.peak.gas, 0)} · {c.peak.date})
                  </span>
                  <GridProvenanceTag kind="D" />
                </div>
                {showDetail && (
                  <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums">{c.wells} wells</span>
                      <GridProvenanceTag kind="P" />
                      <span className="tabular-nums">· {c.util.toFixed(0)}% capacity util</span>
                      <GridProvenanceTag kind="D" />
                    </div>
                    <div className={cn('flex items-center gap-1.5 tabular-nums', c.trend30 < 0 ? 'text-red-500/80' : 'text-emerald-600/80')}>
                      <span>30d trend: {c.trend30 >= 0 ? '+' : ''}{formatNumber(c.trend30, 1)} MMCFD</span>
                      <GridProvenanceTag kind="D" />
                    </div>
                  </div>
                )}
              </button>

              {isHovered && c.meta && (
                <div
                  className="gas-reserve-field-tooltip"
                  role="tooltip"
                >
                  <p className="gas-reserve-field-tooltip__eyebrow">{c.meta.operator}</p>
                  <p className="gas-reserve-field-tooltip__role">{c.meta.role}</p>
                  <p className="gas-reserve-field-tooltip__body">{fieldInsight(mode, c.fieldName)}</p>
                  <div className="gas-reserve-field-tooltip__stats">
                    <span className="inline-flex items-center gap-1">
                      <span className="tabular-nums">30d avg {formatNumber(c.recentAvg, 0)}</span>
                      <GridProvenanceTag kind="D" />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="tabular-nums">{c.wells} wells</span>
                      <GridProvenanceTag kind="P" />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="tabular-nums">{c.util.toFixed(0)}% util</span>
                      <GridProvenanceTag kind="D" />
                    </span>
                  </div>
                  <p className="gas-reserve-field-tooltip__foot">Click for full daily history</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </ArchiveRangeLockedOverlay>

      {modalField && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={() => setModalField(null)}>
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const card = cards.find((c) => c.fieldName === modalField);
              const meta = card?.meta;
              return (
                <>
                  <div className="flex items-start gap-2 mb-3">
                    <LineChartIcon className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-lg">{modalField}</h4>
                      {meta && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {meta.operator} · {meta.basin}
                        </p>
                      )}
                    </div>
                  </div>
                  {meta && (
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed border-b border-border/30 pb-3">
                      {fieldInsight(mode, modalField)}
                    </p>
                  )}
                  <div className="grid-explorer-table-wrap max-h-64 overflow-auto">
                    <table className="grid-explorer-table text-xs">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Gas MMCFD<GridProvenanceTag kind="P" className="ml-1" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(card?.series ?? []).slice(-90).reverse().map((p) => (
                          <tr key={p.date}><td className="tabular-nums">{p.date}</td><td className="tabular-nums">{formatNumber(p.gas, 1)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="mt-3 grid-explorer-chip text-xs" onClick={() => setModalField(null)}>Close</button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="px-4 pb-4 text-[11px] text-muted-foreground">
        {mode === 'simple' && (
          <p><strong>Layman:</strong> Same wells, less gas over time means the underground reservoir is tiring.</p>
        )}
        {mode === 'analyst' && (
          <p><strong>Analyst note:</strong> Pair field cards with National Timeline and Power Gas Gap tabs to connect field decline to plant rationing.</p>
        )}
        {mode === 'investor' && (
          <p><strong>Investor lens:</strong> Rising LNG share alongside falling domestic peaks signals structural import dependency — model fuel-cost pass-through accordingly.</p>
        )}
        {mode === 'researcher' && (
          <p><strong>Researcher:</strong> Raw daily JSON linked from archive footer · major_fields series in timeline-summary.json.</p>
        )}
      </div>
    </div>
  );
}