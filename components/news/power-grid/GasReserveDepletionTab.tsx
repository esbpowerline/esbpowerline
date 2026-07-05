'use client';

import { useMemo, useState } from 'react';
import type { AudienceMode } from '@/lib/data/petrobangla/types';
import {
  AlertTriangle,
  Database,
  Droplet,
  Flame,
  Layers,
  TrendingDown,
} from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
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
  gridChartSplitUnitTick,
  gridChartXAxisProps,
} from '@/components/news/PowerGridChartUI';
import {
  RESERVE_SCENARIO_COLORS,
  RESERVE_SCENARIOS,
  RESERVES_AUDITED_META,
  reserveDepletionPct,
  reservesChartSeries,
  reservesChartYMax,
  type ReserveScenarioId,
} from '@/lib/data/macro/reserves';
import { GridCardFooter } from './GridExplorerUI';
import { PetrobanglaMacroGasSection } from './PetrobanglaMacroGasSection';
import { GasReserveScenarioOutlook } from './GasReserveScenarioOutlook';

interface Props {
  selectedDate: string;
  systemStatsDate: string;
  pgcbGasTotal?: number;
  chartsReady: boolean;
}

const FORECAST_START = String(RESERVES_AUDITED_META.forecastStartYear);

const HERO_METRICS = [
  {
    icon: Droplet,
    iconClass: 'text-sky-500',
    valueClass: 'text-sky-500',
    label: 'Remaining reserves',
    value: String(RESERVES_AUDITED_META.remaining2026Tcf),
    hint: `Tcf recoverable · ${RESERVES_AUDITED_META.forecastStartYear} audit`,
  },
  {
    icon: TrendingDown,
    iconClass: 'text-amber-500',
    label: 'Already extracted',
    value: null as string | null,
    hint: `${RESERVES_AUDITED_META.cumulativeExtracted2026Tcf} of ${RESERVES_AUDITED_META.initialRecoverableTcf} Tcf endowment`,
  },
  {
    icon: Flame,
    iconClass: 'text-red-500',
    valueClass: 'text-red-500',
    label: 'Decline since 2020',
    value: null as string | null,
    hint: 'Tcf · 12.27 → 7.63 audited path',
  },
  {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    label: 'Exhaustion window',
    value: '2033–37',
    hint: 'Scenario-dependent field depletion',
  },
] as const;

function ReservesDepletionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ReturnType<typeof reservesChartSeries>[number] }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const year = Number(d.year);
  const isAudited = year <= RESERVES_AUDITED_META.forecastStartYear;
  const depleted = reserveDepletionPct(d.year);
  const accent = isAudited ? RESERVE_SCENARIO_COLORS.audited : RESERVE_SCENARIO_COLORS.bau;

  const rows: { key: ReserveScenarioId | 'audited'; label: string; value: number | null; color: string }[] =
    isAudited
      ? [{ key: 'audited', label: 'Audited remaining', value: d.audited, color: RESERVE_SCENARIO_COLORS.audited }]
      : RESERVE_SCENARIOS.map((s) => ({
          key: s.id,
          label: s.shortLabel,
          value: d[s.id],
          color: s.color,
        }));

  return (
    <GridChartTooltipShell
      title={`${d.year}${isAudited ? ' · Audited' : ' · Forecast'}`}
      accent={accent}
      className="min-w-[11rem]"
    >
      <div className="grid-chart-tooltip__grid">
        {rows.flatMap((r) =>
          r.value == null
            ? []
            : [
                <span key={`${r.key}-l`} className="grid-chart-tooltip__label flex items-center gap-1.5">
                  <span className="grid-chart-tooltip__dot shrink-0" style={{ background: r.color }} />
                  {r.label}
                </span>,
                <span key={`${r.key}-v`} className="grid-chart-tooltip__value" style={{ color: r.color }}>
                  {r.value.toFixed(2)} Tcf
                </span>,
              ],
        )}
        <span className="grid-chart-tooltip__label">Endowment used</span>
        <span className="grid-chart-tooltip__value">{depleted.toFixed(1)}%</span>
      </div>
      <div className="grid-chart-tooltip__foot">
        {isAudited
          ? 'Petrobangla Hydrocarbon Unit year-end audit'
          : `Forked from ${RESERVES_AUDITED_META.remaining2026Tcf} Tcf baseline`}
      </div>
    </GridChartTooltipShell>
  );
}

export function GasReserveDepletionTab({
  selectedDate,
  systemStatsDate,
  pgcbGasTotal,
  chartsReady,
}: Props) {
  const chartTheme = useChartTheme();
  const [selectedScenario, setSelectedScenario] = useState<ReserveScenarioId>('bau');
  const [highlightScenario, setHighlightScenario] = useState<ReserveScenarioId | null>(null);
  const chartHighlight = highlightScenario ?? selectedScenario;
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('simple');
  const chartData = useMemo(() => reservesChartSeries(), []);
  const chartYMax = useMemo(() => reservesChartYMax(), []);

  const extractedPct =
    (RESERVES_AUDITED_META.cumulativeExtracted2026Tcf / RESERVES_AUDITED_META.initialRecoverableTcf) * 100;
  const declineSince2020 = 12.27 - RESERVES_AUDITED_META.remaining2026Tcf;

  const heroValues = [
    HERO_METRICS[0].value,
    `${extractedPct.toFixed(0)}%`,
    `−${declineSince2020.toFixed(2)}`,
    HERO_METRICS[3].value,
  ];

  const legendItems = [
    { id: 'audited', label: 'Audited history', color: RESERVE_SCENARIO_COLORS.audited, variant: 'line' as const },
    ...RESERVE_SCENARIOS.map((s) => ({
      id: s.id,
      label: `${s.shortLabel} → ${s.exhaustionYear}`,
      color: s.color,
      variant: (s.id === 'bau' ? 'line' : 'dashed') as 'line' | 'dashed',
    })),
  ];

  return (
    <div className="gas-reserve-tab grid-explorer-subpanel">
      <section className="gas-reserve-hero card">
        <div className="gas-reserve-hero__head">
          <div className="gas-reserve-hero__icon">
            <Database className="h-6 w-6 text-sky-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="gas-reserve-zone-eyebrow">Macro reserves</p>
            <h2 className="gas-reserve-hero__title">Gas Reserve Depletion</h2>
            <p className="gas-reserve-hero__sub">
              Domestic recoverable gas is finite. Audited balances trace the decline since 2020; scenario forks show when fields run dry.
            </p>
          </div>
          <span className="grid-explorer-chip text-destructive border-destructive/25 bg-destructive/10 shrink-0">
            Structural risk
          </span>
        </div>

        <div className="gas-reserve-metric-band">
          {HERO_METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="gas-reserve-metric">
                <div className="gas-reserve-metric__top">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${m.iconClass}`} />
                  <span className="gas-reserve-metric__label">{m.label}</span>
                </div>
                <span className={`gas-reserve-metric__value ${'valueClass' in m ? m.valueClass : ''}`}>
                  {heroValues[i]}
                </span>
                <span className="gas-reserve-metric__hint">{m.hint}</span>
              </div>
            );
          })}
        </div>

        <div className="gas-reserve-endowment-bar">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Recoverable endowment consumed</span>
            <span className="font-semibold tabular-nums">{extractedPct.toFixed(1)}%</span>
          </div>
          <div className="gas-reserve-endowment-bar__track">
            <div
              className="gas-reserve-endowment-bar__fill gas-reserve-endowment-bar__fill--extracted"
              style={{ width: `${extractedPct}%` }}
            />
            <div
              className="gas-reserve-endowment-bar__fill gas-reserve-endowment-bar__fill--remaining"
              style={{ width: `${100 - extractedPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>Extracted {RESERVES_AUDITED_META.cumulativeExtracted2026Tcf} Tcf</span>
            <span>Left {RESERVES_AUDITED_META.remaining2026Tcf} Tcf</span>
          </div>
        </div>
      </section>

      <div className="grid-explorer-chart-card card gas-reserve-depletion">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Layers className="h-5 w-5 text-sky-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="grid-explorer-chart-card__title">Reserve depletion trajectory</h3>
            <p className="grid-explorer-chart-card__sub">
              Audited balances {RESERVES_AUDITED_META.archiveStartYear}–{RESERVES_AUDITED_META.forecastStartYear} ·
              demand scenarios fork from {RESERVES_AUDITED_META.remaining2026Tcf} Tcf after {FORECAST_START}
            </p>
          </div>
        </div>

        <div className="gas-reserve-depletion__body">
          <GridChartExternalLegend items={legendItems} />
          <div className="grid-explorer-chart-area gas-reserve-depletion__chart">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                  <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.28} vertical={false} />
                  <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'year' })} />
                  <YAxis
                    width={48}
                    tick={gridChartSplitUnitTick(chartTheme, 'Tcf')}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={6}
                    domain={[0, chartYMax]}
                    allowDecimals={false}
                  />
                  <ReferenceArea
                    x1={String(RESERVES_AUDITED_META.archiveStartYear)}
                    x2={FORECAST_START}
                    fill={RESERVE_SCENARIO_COLORS.audited}
                    fillOpacity={0.06}
                    strokeOpacity={0}
                  />
                  <ReferenceArea
                    x1={FORECAST_START}
                    x2="2038"
                    fill={RESERVE_SCENARIO_COLORS.bau}
                    fillOpacity={0.04}
                    strokeOpacity={0}
                  />
                  <ReferenceLine
                    x={FORECAST_START}
                    stroke={chartTheme.gridStroke}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Forecast fork',
                      position: 'insideTopRight',
                      fontSize: 9,
                      fill: chartTheme.axisTick,
                    }}
                  />
                  <ReferenceLine y={0} stroke={chartTheme.destructive} strokeOpacity={0.35} strokeDasharray="3 3" />
                  <GridRechartsTooltip content={<ReservesDepletionTooltip />} cursor={{ stroke: chartTheme.gridStroke, strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="audited"
                    name="Audited"
                    stroke={RESERVE_SCENARIO_COLORS.audited}
                    strokeWidth={3}
                    dot={{ fill: RESERVE_SCENARIO_COLORS.audited, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  {RESERVE_SCENARIOS.map((s) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.id}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={chartHighlight && chartHighlight !== s.id ? 1.5 : s.id === 'bau' ? 2.5 : 2}
                      strokeDasharray={s.id === 'bau' ? undefined : '6 4'}
                      opacity={chartHighlight && chartHighlight !== s.id ? 0.35 : 1}
                      dot={{ fill: s.color, r: 3, strokeWidth: 0 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid-explorer-skeleton" />
            )}
          </div>

          <GasReserveScenarioOutlook
            selectedId={selectedScenario}
            highlightId={highlightScenario}
            onSelect={setSelectedScenario}
            onHighlight={setHighlightScenario}
          />
        </div>

        <div className="bg-muted/10 px-5 py-3 border-t border-border/40 text-[11px] text-muted-foreground">
          <p>
            <strong>How to read:</strong> One audited line through {FORECAST_START}; select a scenario below to inspect its fork.
            Steeper lines mean faster depletion.
          </p>
        </div>
        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Hydrocarbon Unit
            </a>
            {' · '}MPEMR scenario audit
          </span>
          <span>Audited by: MPEMR · CAG Bangladesh</span>
          <span className="font-medium">2020–2026 audited · 2026–2038 forecast</span>
        </GridCardFooter>
      </div>

      <PetrobanglaMacroGasSection
        selectedDate={selectedDate}
        systemStatsDate={systemStatsDate}
        pgcbGasTotal={pgcbGasTotal}
        embedded
        audienceMode={audienceMode}
        onAudienceModeChange={setAudienceMode}
      />
    </div>
  );
}