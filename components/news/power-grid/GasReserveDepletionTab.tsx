'use client';

import { useEffect, useMemo, useState } from 'react';
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
  reservesChartSeries,
  reservesChartYMax,
  type ReserveScenarioId,
} from '@/lib/data/macro/reserves';
import {
  computeLiveReserveModel,
  scenarioById,
  type LiveReserveModel,
} from '@/lib/data/macro/reservesLive';
import { PetrobanglaBootstrapProvider, usePetrobanglaBootstrap } from './PetrobanglaBootstrap';
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

function formatGasDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

type ChartRow = {
  year: string;
  audited: number | null;
  lowGrowth: number | null;
  bau: number | null;
  highGrowth: number | null;
};

function ReservesDepletionTooltip({
  active,
  payload,
  forkYear,
  liveAsOf,
}: {
  active?: boolean;
  payload?: { payload?: ChartRow }[];
  forkYear: number;
  liveAsOf: string | null;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const year = Number(d.year);
  const isAudited = year <= forkYear;
  const remainingHere = d.audited ?? d.bau ?? d.lowGrowth ?? d.highGrowth ?? 0;
  const depleted =
    ((RESERVES_AUDITED_META.initialRecoverableTcf - remainingHere) /
      RESERVES_AUDITED_META.initialRecoverableTcf) *
    100;
  const accent = isAudited ? RESERVE_SCENARIO_COLORS.audited : RESERVE_SCENARIO_COLORS.bau;

  const rows: { key: ReserveScenarioId | 'audited'; label: string; value: number | null; color: string }[] =
    isAudited
      ? [{ key: 'audited', label: liveAsOf ? 'Extraction-derived' : 'Audited remaining', value: d.audited, color: RESERVE_SCENARIO_COLORS.audited }]
      : RESERVE_SCENARIOS.map((s) => ({
          key: s.id,
          label: s.shortLabel,
          value: d[s.id],
          color: s.color,
        }));

  return (
    <GridChartTooltipShell
      title={`${d.year}${isAudited ? (liveAsOf && year === forkYear ? ' · Live' : ' · Audited') : ' · Forecast'}`}
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
          ? liveAsOf
            ? `Daily Petrobangla archive · anchored to Hydrocarbon Unit audits`
            : 'Petrobangla Hydrocarbon Unit year-end audit'
          : liveAsOf
            ? `Forked from the live balance on ${formatGasDay(liveAsOf)}`
            : `Forked from ${RESERVES_AUDITED_META.remaining2026Tcf} Tcf baseline`}
      </div>
    </GridChartTooltipShell>
  );
}

export function GasReserveDepletionTab(props: Props) {
  return (
    <PetrobanglaBootstrapProvider>
      <GasReserveDepletionContent {...props} />
    </PetrobanglaBootstrapProvider>
  );
}

function GasReserveDepletionContent({
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

  const { timeline, ensureTimeline } = usePetrobanglaBootstrap();
  useEffect(() => {
    void ensureTimeline();
  }, [ensureTimeline]);

  const live: LiveReserveModel | null = useMemo(
    () => (timeline ? computeLiveReserveModel(timeline) : null),
    [timeline],
  );

  const chartData: ChartRow[] = useMemo(
    () => (live ? live.series : reservesChartSeries()),
    [live],
  );
  const chartYMax = useMemo(() => (live ? live.yMax : reservesChartYMax()), [live]);
  const forkYear = live?.forkYear ?? RESERVES_AUDITED_META.forecastStartYear;
  const lastChartYear = chartData[chartData.length - 1]?.year ?? '2040';

  const remainingTcf = live?.remainingTcf ?? RESERVES_AUDITED_META.remaining2026Tcf;
  const extractedTcf = live?.extractedTcf ?? RESERVES_AUDITED_META.cumulativeExtracted2026Tcf;
  const extractedPct =
    live?.extractedPct ??
    (RESERVES_AUDITED_META.cumulativeExtracted2026Tcf / RESERVES_AUDITED_META.initialRecoverableTcf) * 100;
  const declineSince2020 = live?.declineSince2020Tcf ?? 12.27 - RESERVES_AUDITED_META.remaining2026Tcf;
  const exhaustionWindow = live?.exhaustionWindowLabel ?? '2033–40';
  const asOfLabel = live ? formatGasDay(live.asOfDate) : null;

  const heroMetrics = [
    {
      icon: Droplet,
      iconClass: 'text-sky-500',
      valueClass: 'text-sky-500',
      label: 'Remaining reserves',
      value: remainingTcf.toFixed(2),
      hint: asOfLabel
        ? `Tcf recoverable · live to ${asOfLabel}`
        : `Tcf recoverable · ${RESERVES_AUDITED_META.forecastStartYear} audit`,
    },
    {
      icon: TrendingDown,
      iconClass: 'text-amber-500',
      valueClass: '',
      label: 'Already extracted',
      value: `${extractedPct.toFixed(0)}%`,
      hint: `${extractedTcf.toFixed(2)} of ${RESERVES_AUDITED_META.initialRecoverableTcf} Tcf endowment`,
    },
    {
      icon: Flame,
      iconClass: 'text-red-500',
      valueClass: 'text-red-500',
      label: 'Decline since 2020',
      value: `−${declineSince2020.toFixed(2)}`,
      hint: asOfLabel
        ? `Tcf · 12.27 → ${remainingTcf.toFixed(2)} extraction-derived`
        : 'Tcf · 12.27 → 7.63 audited path',
    },
    {
      icon: AlertTriangle,
      iconClass: 'text-amber-500',
      valueClass: '',
      label: 'Exhaustion window',
      value: exhaustionWindow,
      hint: live
        ? `At ${Math.round(live.currentRateMmcfd).toLocaleString()} MMCFD, 30-day avg`
        : 'Scenario-dependent field depletion',
    },
  ];

  const legendItems = [
    {
      id: 'audited',
      label: live ? 'Extraction-derived history' : 'Audited history',
      color: RESERVE_SCENARIO_COLORS.audited,
      variant: 'line' as const,
    },
    ...RESERVE_SCENARIOS.map((s) => ({
      id: s.id,
      label: `${s.shortLabel} → ${live ? scenarioById(live, s.id).exhaustionYear : s.exhaustionYear}`,
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
              Domestic recoverable gas is finite.{' '}
              {live
                ? `Every daily Petrobangla report draws the balance down — tracked live across ${live.daysCounted.toLocaleString()} gas-days since 2020.`
                : 'Audited balances trace the decline since 2020; scenario forks show when fields run dry.'}
            </p>
          </div>
          <span className="grid-explorer-chip text-destructive border-destructive/25 bg-destructive/10 shrink-0">
            Structural risk
          </span>
        </div>

        <div className="gas-reserve-metric-band">
          {heroMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="gas-reserve-metric">
                <div className="gas-reserve-metric__top">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${m.iconClass}`} />
                  <span className="gas-reserve-metric__label">{m.label}</span>
                </div>
                <span className={`gas-reserve-metric__value ${m.valueClass}`}>{m.value}</span>
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
            <span>Extracted {extractedTcf.toFixed(2)} Tcf</span>
            <span>Left {remainingTcf.toFixed(2)} Tcf</span>
          </div>
        </div>
      </section>

      <div className="grid-explorer-chart-card card gas-reserve-depletion">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Layers className="h-5 w-5 text-sky-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="grid-explorer-chart-card__title">Reserve depletion trajectory</h3>
            <p className="grid-explorer-chart-card__sub">
              {live
                ? `Daily extraction integrated ${RESERVES_AUDITED_META.archiveStartYear}–${forkYear}, anchored to Hydrocarbon Unit audits · scenarios fork from ${remainingTcf.toFixed(2)} Tcf on ${asOfLabel}`
                : `Audited balances ${RESERVES_AUDITED_META.archiveStartYear}–${RESERVES_AUDITED_META.forecastStartYear} · demand scenarios fork from ${RESERVES_AUDITED_META.remaining2026Tcf} Tcf after ${FORECAST_START}`}
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
                    x2={String(forkYear)}
                    fill={RESERVE_SCENARIO_COLORS.audited}
                    fillOpacity={0.06}
                    strokeOpacity={0}
                  />
                  <ReferenceArea
                    x1={String(forkYear)}
                    x2={lastChartYear}
                    fill={RESERVE_SCENARIO_COLORS.bau}
                    fillOpacity={0.04}
                    strokeOpacity={0}
                  />
                  <ReferenceLine
                    x={String(forkYear)}
                    stroke={chartTheme.gridStroke}
                    strokeDasharray="4 4"
                    label={{
                      value: live ? 'Live fork' : 'Forecast fork',
                      position: 'insideTopRight',
                      fontSize: 9,
                      fill: chartTheme.axisTick,
                    }}
                  />
                  <ReferenceLine y={0} stroke={chartTheme.destructive} strokeOpacity={0.35} strokeDasharray="3 3" />
                  <GridRechartsTooltip
                    content={<ReservesDepletionTooltip forkYear={forkYear} liveAsOf={live?.asOfDate ?? null} />}
                    cursor={{ stroke: chartTheme.gridStroke, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="audited"
                    name={live ? 'Extraction-derived' : 'Audited'}
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
            live={live}
          />
        </div>

        <div className="bg-muted/10 px-5 py-3 border-t border-border/40 text-[11px] text-muted-foreground">
          <p>
            <strong>How to read:</strong>{' '}
            {live
              ? `The blue line is cumulative extraction from ${live.daysCounted.toLocaleString()} daily reports, calibrated to the audited balances; select a scenario below to inspect its fork.`
              : `One audited line through ${FORECAST_START}; select a scenario below to inspect its fork.`}{' '}
            Steeper lines mean faster depletion.
          </p>
        </div>
        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Hydrocarbon Unit
            </a>
            {' · '}
            {live ? 'Daily gas reports 2020–present' : 'MPEMR scenario audit'}
          </span>
          <span>Audited by: MPEMR · CAG Bangladesh</span>
          <span className="font-medium">
            {live
              ? `2020–${forkYear} extraction-derived · forks to ${lastChartYear}`
              : '2020–2026 audited · 2026–2038 forecast'}
          </span>
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
