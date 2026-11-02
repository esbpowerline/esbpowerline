'use client';

import { SAMPLE_1930_COLOR } from '@/lib/data/grid/chart-palette';
import type * as React from 'react';
import { Info, Activity } from 'lucide-react';
import { GridLockedContent } from '@/components/news/power-grid/GridLockedContent';
import { DailyBadge, GridProvenanceTag, GridCardFooter, GridSourceFiles } from '@/components/news/power-grid/GridExplorerUI';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { LoadCurveCanvas } from '@/components/news/power-grid/LoadCurveCanvas';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { formatNumber } from '@/lib/utils';
import { GenerationMixCard } from '@/components/news/power-grid/GenerationMixCard';
import { DailyCostCard } from '@/components/news/power-grid/DailyCostCard';
import { ForecastSection } from '@/components/news/power-grid/ForecastSection';
import { DEMO_DATE } from '@/components/news/power-grid/tabs/shared';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import type { GridForecast, GridGenerationItem, GridSystemStats, HourlyLoadItem } from '@/lib/data/grid/types';
import type { ChartTheme } from '@/hooks/useChartTheme';

export type OverviewPanelProps = {
  /** The selected day and the payload read from it. */
  day: {
    selectedDate: string;
    tierLockRequired: GridAccessTier | null;
    systemStats: GridSystemStats;
    hourlyLoadData: HourlyLoadItem[];
    sourceFiles: { pgcb?: string | undefined; petrobangla?: string | undefined; } | undefined;
    generationData: GridGenerationItem[];
    forecast: GridForecast | undefined;
  };
  /** Values the parent derives from the day (totals, chart series, flags). */
  derived: {
    curveIsHourly: boolean;
    sheddingIsHourly: boolean;
    showShedding: boolean;
    pieGenerationData: GridGenerationItem[];
    totalGenMkwhr: number;
    hasGenerationChartData: boolean;
    dailyCostChartData: { costCrore: number; name: string; gen: number; cost: number | null; unitCost: number | null; color: string; }[];
    hasPublishedFuelCost: boolean;
    totalCostBdt: number;
  };
  /** View state and theme the parent owns; kept there so it survives a tab switch exactly as before. */
  ui: {
    chartsReady: boolean;
    LOAD_CURVE_COLORS: { readonly generation: string; readonly demand: string; };
    chartTheme: ChartTheme;
    hoveredIndex: number | null;
    hoveredCostIndex: number | null;
  };
  /** State setters owned by the parent. */
  actions: {
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
    setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>;
    setHoveredCostIndex: React.Dispatch<React.SetStateAction<number | null>>;
  };
  /** Pre-built elements shared by several tabs. */
  slots: {
    dayWindowStrip: React.JSX.Element;
    provenanceNote: React.JSX.Element;
    methodologyBanner: React.JSX.Element | null;
  };
};

export function OverviewPanel({ day, derived, ui, actions, slots }: OverviewPanelProps) {
  const { selectedDate, tierLockRequired, systemStats, hourlyLoadData, sourceFiles, generationData, forecast } = day;
  const { curveIsHourly, sheddingIsHourly, showShedding, pieGenerationData, totalGenMkwhr, hasGenerationChartData, dailyCostChartData, hasPublishedFuelCost, totalCostBdt } = derived;
  const { chartsReady, LOAD_CURVE_COLORS, chartTheme, hoveredIndex, hoveredCostIndex } = ui;
  const { setSelectedDate, setHoveredIndex, setHoveredCostIndex } = actions;
  const { dayWindowStrip, provenanceNote, methodologyBanner } = slots;
  return (
    selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">PGCB Grid Overview Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. PGCB data tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          {dayWindowStrip}
          {provenanceNote}
          {methodologyBanner}
        {/* 24-Hour System Load Curve — leads the tab. The KPI strip above has
            just told the reader the size of the deficit; the next question is
            when and for how long the shedding ran, and this is the only card
            that answers it. The mix and cost cards follow as "what ran". */}
        <div className="grid-explorer-chart-card card">
          <div className="grid-explorer-chart-card__head">
            <div className="flex items-center gap-2.5 min-w-0">
              <Activity className="h-5 w-5 shrink-0 text-destructive" />
              <div className="min-w-0">
                {/* Named for what the sheet is: P4 is "Hourly Demand, Generation & Load-Shed
                    Report" and the L-Curve is "DAILY GENERATION CURVE". "System Load
                    Curve" called a generation series a load series. */}
                <h3 className="grid-explorer-chart-card__title">24-Hour Generation, Demand &amp; Load-Shed<DailyBadge /></h3>
                <p className="grid-explorer-chart-card__sub">
                  {curveIsHourly
                    ? <>Generation, demand and load shedding for every hour PGCB publishes, from the NLDC hourly report (Date: {systemStats.date})</>
                    : sheddingIsHourly
                      ? <>Hourly generation and load shedding from the NLDC hourly report; demand as published for the evening peak hour (Date: {systemStats.date})</>
                      : <>Hourly generation from the NLDC load curve; demand and load shedding as published for the evening peak hour (Date: {systemStats.date})</>}
                  {' • '}<span className="text-primary font-semibold text-xs">
                    {coverageLabel(curveIsHourly || sheddingIsHourly ? 'hourlyShedding' : 'loadCurve')}
                  </span>
                </p>
              </div>
            </div>
            <span className="grid-explorer-chip bg-destructive/10 text-destructive border-destructive/20">NLDC SCADA Curve</span>
          </div>

          {/* No fixed height here. The load curve sizes itself — a plot of its
              own plus the key beneath it — and the shared chart-area class caps
              at 24rem, which is shorter than the two together. The overflow
              landed the key's hint line on top of the paragraph below the card. */}
          <div className="mt-4">
            {hourlyLoadData.length === 0 ? (
              // Reports before 2018 carry no load-curve sheet. Drawing empty
              // axes would imply a flat or missing grid rather than an
              // unpublished measurement.
              <div className="min-h-[16rem] flex flex-col items-center justify-center text-center gap-2 px-6">
                <p className="text-sm font-semibold text-muted-foreground">No load curve published for this day</p>
                <p className="text-xs text-muted-foreground/80 max-w-md">
                  PGCB&apos;s report for {systemStats.date} does not include the half-hourly NLDC load-curve
                  sheet. Daily totals and peaks above are unaffected.
                </p>
              </div>
            ) : chartsReady ? (
              <LoadCurveCanvas
                rows={hourlyLoadData as never}
                peaks={{
                  dayPeakGen: systemStats.dayPeakGen,
                  eveningPeakGen: systemStats.eveningPeakGen,
                  minGen: systemStats.minGen,
                  peakTimes: systemStats.peakTimes ?? null,
                }}
                generationColor={LOAD_CURVE_COLORS.generation}
                demandColor={LOAD_CURVE_COLORS.demand}
                shedColor={chartTheme.destructive}
                axisColor={chartTheme.axisTick}
                gridColor={chartTheme.gridStroke}
                reportDate={systemStats.date}
              />
            ) : (
              // Matches the figure it stands in for — canvas plus key — so the
              // card does not jump when the chart arrives.
              <div className="grid-explorer-skeleton h-[25.5rem] rounded-xl" />
            )}
          </div>

          {/* Shedding had its own right-hand axis here, with a note explaining
              that on the generation scale it would be "a flat line on the
              floor". The note was right and the axis was the wrong answer to
              it: two quantities that do not share a scale should not share a
              frame pretending they do. The curve now carries the shortfall as
              the band between demand and generation, and shedding's own
              published column runs as an intensity strip along the foot — no
              second axis, and nothing to apologise for. */}
          {showShedding && chartsReady && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              The band between the two curves is demand the grid did not meet.{' '}
              <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load shedding</span>
              {' '}below it is PGCB&apos;s own published figure for each hour, drawn against the
              worst hour of the day rather than a megawatt scale of its own.
            </p>
          )}

          {/* Card Explanation Block */}
          {(() => {
            // On the older layouts PGCB publishes demand and load shedding for
            // the evening peak hour only, so this reports that hour rather than
            // the maximum of a series that used to be filled in across
            // 18:00-23:00.
            const peakRow = hourlyLoadData.find((h) => h.demand != null || h.loadShed != null) ?? null;

            // Whole hours only. PGCB adds the evening-peak half hour (19:30) as
            // a 25th row — and on the pre-2019 layouts 18:30 as well — so a row
            // is not the same thing as an hour. Counting rows inflated both the
            // day's energy total and the hour tally: a 24-hour day with a 19:30
            // sample reported "shed in 25 of the 25 published hours", which is
            // one more hour than the day has. Every figure below is measured on
            // this list so the count, the denominator and the MWh total all
            // describe the same thing.
            const wholeHourRows = hourlyLoadData.filter((h) => h.time.endsWith(':00'));

            // With an hourly sheet the interesting figures are the day's own
            // extremes, not one nominated hour.
            const shedHours = wholeHourRows.filter((h) => (h.loadShed ?? 0) > 0);
            const worstShed = shedHours.length
              ? [...shedHours].sort((a, b) => (b.loadShed ?? 0) - (a.loadShed ?? 0))[0]
              : null;
            // A day total is only honest where the hours it sums are the day.
            // 71 archived days publish 23 hourly rows rather than 24, so the
            // figure is withheld there instead of being presented as the day.
            const shedTotalMwh =
              sheddingIsHourly && wholeHourRows.length >= 24
                ? wholeHourRows.reduce((sum, h) => sum + (h.loadShed ?? 0), 0)
                : 0;

            return (
              <MobileFold title="What is being shown?">
              <div className="bg-muted/10 p-4 border border-border/40 rounded-xl text-xs text-muted-foreground space-y-2 mt-4">
                <p><strong>What is being shown?</strong></p>
                {/* The series names here are painted from LOAD_CURVE_COLORS rather
                    than from Tailwind's palette. text-amber-500 is not
                    the colour the demand line is drawn in, so the prose
                    used to name a series in a shade the chart never uses. */}
                {/* The shedding strip only exists on days
                    that shed something, so the prose names them only then — a day
                    PGCB reports as nil is described by its own sentence rather than
                    pointed at an axis the reader cannot see. */}
                {curveIsHourly ? (
                  <>
                    <p className="leading-relaxed">
                      Everything on this chart comes from one sheet — PGCB&apos;s hourly demand,
                      generation and load-shed table — which states each figure for every hour it
                      publishes. Most days carry <strong>25 readings, not 24</strong>: the
                      twenty-four hours plus a half-hour sample at 19:30 taken across the
                      evening-peak window.
                    </p>
                    <dl className="grid-load-glossary">
                      <div>
                        <dt style={{ color: LOAD_CURVE_COLORS.generation }}>
                          Generation <GridProvenanceTag kind="P" />
                        </dt>
                        <dd>
                          The megawatts actually produced and delivered at that moment — the blue
                          mass. This is what the country <em>had</em>.
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: LOAD_CURVE_COLORS.demand }}>
                          Demand <GridProvenanceTag kind="P" />
                        </dt>
                        <dd>
                          What the country <em>asked for</em> — the dashed ceiling. PGCB publishes
                          this column, but it is not measured independently: across all 3,600 hourly
                          rows of 2026 it equals <em>generation + 1.045 × load shed</em>, to within
                          a megawatt. The 4.5% is a network-loss allowance — shedding is counted
                          where consumers are, generation where the plants are — so demand is
                          reconstructed on the generation side of the network rather than metered
                          at the door.
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: chartTheme.destructive }}>
                          Unmet demand <GridProvenanceTag kind="D" />
                        </dt>
                        <dd>
                          The shaded band between the two curves: demand minus generation. It is
                          the electricity the country asked for and did not get. This is our
                          subtraction, not a figure PGCB states &mdash; and because demand is built
                          from the shed column above, the band is the same quantity as the strip
                          below, 4.5% larger. It is drawn because a shortfall is easier to judge as
                          a gap between two lines than as a number in a table.
                        </dd>
                      </div>
                      {showShedding ? (
                        <div>
                          <dt style={{ color: chartTheme.destructive }}>
                            Load shed, by hour <GridProvenanceTag kind="P" />
                          </dt>
                          <dd>
                            PGCB&apos;s own third column, along the foot: load the grid deliberately
                            disconnected because it could not supply it. This is the published
                            figure and the one to quote. Bars are sized against the day&apos;s worst
                            hour, so the strip shows shape and severity rather than a second
                            megawatt scale. A flat grey stub means an hour PGCB reported as
                            <em> none</em>; a gap in the baseline means an hour it did not report
                            at all.
                          </dd>
                        </div>
                      ) : (
                        <div>
                          <dt style={{ color: chartTheme.destructive }}>Load shed, by hour</dt>
                          <dd>
                            Nothing to show: this report states no load shedding in any hour of this
                            day, which is why the two curves meet all the way across.
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt style={{ color: SAMPLE_1930_COLOR }}>19:30 sample</dt>
                        <dd>
                          The gold bar. PGCB takes one extra reading half an hour before the
                          evening-peak hour, so it sits closer to its neighbours than the rest.
                          It is a reading like any other, not a separate series &mdash; marked only
                          so its spacing does not read as a mistake.
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : sheddingIsHourly ? (
                  <p className="leading-relaxed">The <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.generation }}>Actual Generation</span> curve is read from PGCB&apos;s hourly station log, which carries a national total and a shortage figure at every hourly stamp{showShedding
                    ? <>; the <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load Shedding</span> strip along the foot is that shortage column, sized against the day's worst hour.</>
                    : <>, and records no shortage in any hour of this day.</>} That sheet publishes no demand column, so <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.demand }}>Demand</span> is the evening-peak figure from the report&apos;s front page and appears as a single marked point rather than a curve.</p>
                ) : (
                  <p className="leading-relaxed">The hourly <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.generation }}>Actual Generation</span> curve is the NLDC load-curve sheet, logged every half hour. <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.demand }}>Total Demand</span>{showShedding
                    ? <> and the <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load Shedding Deficit</span> are published for the evening peak hour only on this report&apos;s layout, so they appear as single marks rather than continuous lines, and the shortfall band is drawn only where both were measured.</>
                    : <> is published for the evening peak hour only on this report&apos;s layout, so it appears as a single marked point rather than a continuous line.</>}</p>
                )}
                <p className="leading-relaxed">
                  {/* Everything in this sentence is counted or summed here — PGCB
                      states the hourly figures, not the tallies drawn from them. */}
                  <strong>Operational Insights <GridProvenanceTag kind="D" /></strong>: The load curve illustrates the shape of generation across this day.
                  {(curveIsHourly || sheddingIsHourly) && worstShed ? (
                    <>
                      {' '}Load was shed in <span className="font-semibold text-primary">{shedHours.length} of the {wholeHourRows.length} published hours</span>, worst at{' '}
                      <span className="font-semibold text-primary">{worstShed.time} Hr</span> with{' '}
                      <span className="font-bold text-destructive tabular-nums">{formatNumber(Math.round(worstShed.loadShed ?? 0))} MW</span> unserved
                      {shedTotalMwh > 0 && (
                        <> — around <span className="font-bold text-foreground tabular-nums">{formatNumber(Math.round(shedTotalMwh))} MWh</span> across the day, taking each hourly figure as the rate for that hour.</>
                      )}
                    </>
                  ) : curveIsHourly || sheddingIsHourly ? (
                    ' No load shedding was recorded in any published hour of this day.'
                  ) : peakRow && peakRow.demand != null ? (
                    <>
                      {' '}At the evening peak (<span className="font-semibold text-primary tabular-nums">{peakRow.time} Hr</span>) PGCB reported demand of <span className="font-bold text-foreground">{formatNumber(Math.round(peakRow.demand))} MW</span>
                      {peakRow.loadShed != null && peakRow.loadShed > 0 ? (
                        <> against <span className="font-bold text-destructive tabular-nums">{formatNumber(Math.round(peakRow.loadShed))} MW</span> of load shedding.</>
                      ) : (
                        ' with no load shedding recorded.'
                      )}
                    </>
                  ) : (
                    ' This report does not publish an evening-peak demand or load-shedding figure.'
                  )}
                </p>
              </div>
              </MobileFold>
            );
          })()}

          {/* Card Metadata Footer */}
          <GridCardFooter>
            <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P4 sheet, hourly generation, demand and load-shed columns</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
            <span>Hourly figures as published; hour counts and day totals are ours. Not independently audited.</span>
            <span className="font-medium">Reporting Period: 24-Hour SCADA Log (Date: {systemStats.date})</span>
          </GridCardFooter>
        </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generation Pie Chart — the card's JSX lives in GenerationMixCard,
              moved verbatim; hover state stays here because the mix stack,
              donut and legend all read it. */}
          <GenerationMixCard
            generationData={generationData}
            pieGenerationData={pieGenerationData}
            totalGenMkwhr={totalGenMkwhr}
            hasGenerationChartData={hasGenerationChartData}
            chartsReady={chartsReady}
            chartTheme={chartTheme}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            sourceFiles={sourceFiles}
            systemStats={systemStats}
          />

          {/* Cost Bar Chart — likewise DailyCostCard, moved verbatim. */}
          <DailyCostCard
            dailyCostChartData={dailyCostChartData}
            hasPublishedFuelCost={hasPublishedFuelCost}
            totalCostBdt={totalCostBdt}
            chartsReady={chartsReady}
            chartTheme={chartTheme}
            hoveredCostIndex={hoveredCostIndex}
            setHoveredCostIndex={setHoveredCostIndex}
            sourceFiles={sourceFiles}
            systemStats={systemStats}
          />
        </div>


        {/* Last card on the tab, deliberately.

            This led the tab at first, which was wrong twice over: it pushed
            every chart below the fold, and it put a projection ahead of the
            measurements it should be read against. A reader should see what
            the grid did — the load curve, the mix, the cost — and only then
            what was expected of it. Renders nothing on days whose issuing
            workbook is absent. */}
        {/* One card, two vintages: the running day checked against NLDC's
            hourly page, or the settled day checked against the audited
            workbook. The section picks the default and owns the switch; with
            no live half it renders the settled card exactly as before. */}
        <ForecastSection
          forecast={forecast}
          systemStats={systemStats}
          hourlyLoadData={hourlyLoadData}
          actualsFrom={sourceFiles?.pgcb}
          chartTheme={chartTheme}
        />
      </div>
      </GridLockedContent> )
  );
}
