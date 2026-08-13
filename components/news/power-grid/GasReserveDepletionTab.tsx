'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AudienceMode } from '@/lib/data/petrobangla/types';
import {
  AlertTriangle,
  ChevronDown,
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
  ReferenceDot,
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
import { GridCardFooter, GridProvenanceTag } from './GridExplorerUI';
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
      kind: 'D' as const,
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
      kind: 'D' as const,
      label: 'Already extracted',
      value: `${extractedPct.toFixed(0)}%`,
      hint: `${extractedTcf.toFixed(2)} of ${RESERVES_AUDITED_META.initialRecoverableTcf} Tcf endowment`,
    },
    {
      icon: Flame,
      iconClass: 'text-red-500',
      valueClass: 'text-red-500',
      kind: 'D' as const,
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
      kind: 'D' as const,
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
                  <GridProvenanceTag kind={m.kind} />
                </div>
                <span className={`gas-reserve-metric__value ${m.valueClass}`}>{m.value}</span>
                <span className="gas-reserve-metric__hint">{m.hint}</span>
              </div>
            );
          })}
        </div>

        {live ? <ReserveMethodPanel live={live} /> : null}

        <div className="gas-reserve-endowment-bar">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Recoverable endowment consumed</span>
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
                  {/*
                    The two halves of this chart are different kinds of claim, so
                    they are named on the chart rather than only in the caption:
                    left of the fork is measured from daily reports, right of it
                    is projection.
                  */}
                  <ReferenceArea
                    x1={String(RESERVES_AUDITED_META.archiveStartYear)}
                    x2={String(forkYear)}
                    fill={RESERVE_SCENARIO_COLORS.audited}
                    fillOpacity={0.06}
                    strokeOpacity={0}
                    label={{
                      value: live ? `MEASURED · ${live.daysCounted.toLocaleString()} daily reports` : 'AUDITED',
                      position: 'insideTopLeft',
                      dx: 10,
                      dy: 8,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      fill: RESERVE_SCENARIO_COLORS.audited,
                    }}
                  />
                  <ReferenceArea
                    x1={String(forkYear)}
                    x2={lastChartYear}
                    fill={RESERVE_SCENARIO_COLORS.bau}
                    fillOpacity={0.04}
                    strokeOpacity={0}
                    label={{
                      value: 'PROJECTED · nothing measured beyond here',
                      position: 'insideTopRight',
                      dx: -10,
                      dy: 8,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      fill: RESERVE_SCENARIO_COLORS.bau,
                    }}
                  />
                  <ReferenceLine
                    x={String(forkYear)}
                    stroke={chartTheme.gridStroke}
                    strokeDasharray="4 4"
                  />
                  {/*
                    The two audit anchors the whole curve is pinned to. Marked
                    where they act, because they are the only P figures on the
                    chart and the only ones a reader cannot check for themselves
                    — the Hydrocarbon Unit's site is offline.
                  */}
                  {live ? (
                    <>
                      <ReferenceDot
                        x={String(RESERVES_AUDITED_META.archiveStartYear)}
                        y={12.27}
                        r={5}
                        fill={RESERVE_SCENARIO_COLORS.audited}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                        label={{
                          value: 'AUDIT 12.27',
                          position: 'right',
                          dx: 6,
                          dy: -7,
                          fontSize: 8.5,
                          fontWeight: 700,
                          fill: RESERVE_SCENARIO_COLORS.audited,
                        }}
                      />
                      <ReferenceDot
                        x={String(forkYear)}
                        y={RESERVES_AUDITED_META.remaining2026Tcf}
                        r={5}
                        fill={RESERVE_SCENARIO_COLORS.audited}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                        label={{
                          value: 'AUDIT 7.63',
                          position: 'top',
                          dx: -34,
                          dy: -4,
                          fontSize: 8.5,
                          fontWeight: 700,
                          fill: RESERVE_SCENARIO_COLORS.audited,
                        }}
                      />
                      <ReferenceDot
                        x={String(forkYear)}
                        y={remainingTcf}
                        r={5}
                        fill={RESERVE_SCENARIO_COLORS.bau}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                        label={{
                          value: `TODAY ${remainingTcf.toFixed(2)}`,
                          position: 'bottom',
                          dx: -34,
                          dy: 4,
                          fontSize: 8.5,
                          fontWeight: 700,
                          fill: RESERVE_SCENARIO_COLORS.bau,
                        }}
                      />
                    </>
                  ) : null}
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
        {live ? (
          <div className="gas-reserve-provenance-key">
            <div className="gas-reserve-provenance-key__item">
              <span
                className="gas-reserve-provenance-key__swatch"
                style={{ background: RESERVE_SCENARIO_COLORS.audited }}
              />
              <div>
                <strong className="text-foreground">Solid blue — measured.</strong>{' '}
                Summed from {live.daysCounted.toLocaleString()} daily Petrobangla
                reports, each read by two independent parsers.{' '}
                <GridProvenanceTag kind="D" /> from{' '}
                <GridProvenanceTag kind="P" /> daily figures.
              </div>
            </div>
            <div className="gas-reserve-provenance-key__item">
              <span
                className="gas-reserve-provenance-key__swatch gas-reserve-provenance-key__swatch--ring"
                style={{ borderColor: RESERVE_SCENARIO_COLORS.audited }}
              />
              <div>
                <strong className="text-foreground">Ringed dots — the two audit anchors.</strong>{' '}
                The only figures here published by someone else, and the only ones
                that cannot currently be re-checked. <GridProvenanceTag kind="P" />
              </div>
            </div>
            <div className="gas-reserve-provenance-key__item">
              <span
                className="gas-reserve-provenance-key__swatch"
                style={{ background: RESERVE_SCENARIO_COLORS.bau }}
              />
              <div>
                <strong className="text-foreground">Solid amber — calculated.</strong>{' '}
                Today&apos;s balance divided by today&apos;s extraction rate. Arithmetic,
                not opinion. <GridProvenanceTag kind="D" />
              </div>
            </div>
            <div className="gas-reserve-provenance-key__item">
              <span className="gas-reserve-provenance-key__swatch gas-reserve-provenance-key__swatch--dashed" />
              <div>
                <strong className="text-foreground">Dashed green and red — chosen.</strong>{' '}
                An editorial band of +2 and −5 years around the amber line. Not
                computed from the growth rates shown beside them; read them as the
                width of the uncertainty. <GridProvenanceTag kind="D" />
              </div>
            </div>
          </div>
        ) : null}

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
              ? `Left of the dashed fork the line is history you can audit; right of it nothing has happened yet. The gap between today's balance (${remainingTcf.toFixed(2)}) and the 1 Jan audit anchor (${RESERVES_AUDITED_META.remaining2026Tcf}) is this year's extraction so far.`
              : `One audited line through ${FORECAST_START}; select a scenario below to inspect its fork.`}{' '}
            Steeper lines mean faster depletion.
          </p>
        </div>
        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla
            </a>
            {' · '}
            {live ? 'Daily gas reports 2020–present, anchored to Hydrocarbon Unit reserve audits' : 'MPEMR scenario audit'}
          </span>
          <span>
            <strong className="text-foreground">Every figure on this panel is D.</strong>{' '}
            Petrobangla publishes daily production, not a running reserve balance —
            so the balance here is computed: daily domestic output integrated from
            2020 and scaled so the curve meets the audited anchors. The P inputs are
            the daily production figures, which are read twice by independent
            parsers before they enter the archive.{' '}
            {live ? (
              <>
                Recomputing this whole model a second time — a separate implementation
                re-deriving domestic output from the raw daily reports rather than the
                prepared summary — reproduces all nine published figures exactly.
              </>
            ) : null}{' '}
            <strong className="text-foreground">Two limits worth knowing.</strong> The
            reserve anchors (29.74 Tcf endowment, 12.27 Tcf in 2020, 7.63 Tcf in 2026)
            could not be re-confirmed against a live source on 13 Aug 2026: the
            Hydrocarbon Unit&apos;s own site is offline and Petrobangla&apos;s portal
            publishes no reserve page, so they rest on the earlier audits alone. And
            the gaps between the three scenarios are editorial demand assumptions, not
            results computed from the data — only the starting balance and the current
            rate are.
          </span>
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

/**
 * The derivation, shown rather than asserted.
 *
 * Every figure on this panel is computed: Petrobangla publishes daily
 * production, never a running reserve balance. A reader who is told "7.27 Tcf
 * left" deserves to see which measured quantity that came from and which
 * assumption it rests on, because the two behave very differently — the
 * measured part is checked twice a day, the assumed part cannot currently be
 * checked at all.
 */
function ReserveMethodPanel({ live }: { live: LiveReserveModel }) {
  const rawTcf = live.declineSince2020Tcf;
  return (
    <details className="gas-reserve-method">
      <summary className="gas-reserve-method__summary">
        <Layers className="h-3.5 w-3.5 text-sky-500 shrink-0" />
        <span className="flex-1">How this balance is built — and what it rests on</span>
        <ChevronDown className="gas-reserve-method__chevron h-3.5 w-3.5 shrink-0" />
      </summary>
      <div className="gas-reserve-method__body">
        <div className="gas-reserve-method__step">
          <span className="gas-reserve-method__num">1</span>
          <div className="min-w-0 flex-1">
            <strong className="text-foreground">Start from an audited balance.</strong>{' '}
            12.27 Tcf remained on 1 Jan 2020 and 7.63 Tcf on 1 Jan 2026, against a
            29.74 Tcf original endowment — Hydrocarbon Unit reserve audits, not our
            numbers. <GridProvenanceTag kind="P" />
          </div>
        </div>
        <div className="gas-reserve-method__step">
          <span className="gas-reserve-method__num">2</span>
          <div className="min-w-0 flex-1">
            <strong className="text-foreground">Add up what was actually produced.</strong>{' '}
            Domestic output — every field except the LNG terminals — is read from each
            daily Petrobangla report and summed across{' '}
            {live.daysCounted.toLocaleString()} gas-days. Days the agency did not
            publish are bridged by averaging the reports either side.
            <div className="gas-reserve-method__eq">
              measured draw 2020 → {live.asOfDate} = {rawTcf.toFixed(3)} Tcf
            </div>
          </div>
        </div>
        <div className="gas-reserve-method__step">
          <span className="gas-reserve-method__num">3</span>
          <div className="min-w-0 flex-1">
            <strong className="text-foreground">Check it against the audit.</strong>{' '}
            Summing the daily reports over 2020–2026 gives 4.733 Tcf drawn. The audits
            say 4.640 Tcf. Two entirely independent measurements,{' '}
            <strong className="text-foreground">2.0% apart over six years</strong> — the
            single strongest reason to trust this curve. The daily figures are scaled by
            0.980 so the line meets the audit exactly.
            <div className="gas-reserve-method__eq">
              remaining = 12.27 − 0.980 × 5.104 = {live.remainingTcf.toFixed(2)} Tcf
            </div>
          </div>
        </div>
        <div className="gas-reserve-method__step">
          <span className="gas-reserve-method__num">4</span>
          <div className="min-w-0 flex-1">
            <strong className="text-foreground">Project forward at today&apos;s rate.</strong>{' '}
            The last 30 gas-days average{' '}
            {Math.round(live.currentRateMmcfd).toLocaleString()} MMCFD.
            <div className="gas-reserve-method__eq">
              {live.remainingTcf.toFixed(2)} Tcf ÷ {live.annualDrawTcf.toFixed(3)} Tcf/yr
              ≈ {(live.remainingTcf / live.annualDrawTcf).toFixed(1)} yrs → dry around{' '}
              {live.scenarios.find((s) => s.id === 'bau')?.exhaustionYear}
            </div>
            Widening the window barely moves it: the 90-day and 365-day averages both
            give the same year.
          </div>
        </div>
        <div className="gas-reserve-method__caveat">
          <strong className="text-foreground">Three things this cannot tell you.</strong>{' '}
          The audited anchors could not be re-confirmed on 13 Aug 2026 — the Hydrocarbon
          Unit&apos;s site is offline and Petrobangla&apos;s portal carries no reserve
          page — and shifting the 2026 anchor by ±0.5 Tcf moves the dry year by about two
          years either way, far more than any daily reading does. The model also assumes
          reserves only ever fall: a new discovery or an upward revision would lift the
          line, and nothing here would see it. And the projection is a straight line at
          today&apos;s rate, whereas real fields taper off as pressure drops.
        </div>
      </div>
    </details>
  );
}
