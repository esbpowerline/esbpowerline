'use client';

import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GridForecast, GridSystemStats, HourlyLoadItem } from '@/lib/data/grid/types';
import {
  DailyBadge,
  GridCardFooter,
  GridExplanationBlock,
  GridProvenanceTag,
  GridSourceFiles,
} from '@/components/news/power-grid/GridExplorerUI';
import { ForecastCurveCanvas } from '@/components/news/power-grid/ForecastCurveCanvas';

/**
 * What PGCB said the day would be, next to what it was.
 *
 * Every PGCB workbook publishes two days: the reported day's actuals and a
 * projection. The archive read the first and discarded the second for years —
 * for a good reason, since scanning the whole Forecast sheet let tomorrow's
 * figures overwrite today's, but the fix threw away the only forward-looking
 * statement either agency makes.
 *
 * It is recovered here and anchored to the day it DESCRIBES rather than the
 * report that issued it, so this card needs no second fetch: `forecast` and
 * `systemStats` on the same day's payload are the two halves of one comparison.
 *
 * Nothing here is scored or graded. A miss is reported as a signed difference
 * against the published projection and left at that — PGCB forecasts a system
 * it does not fully control, and calling a 400 MW overshoot a failure would be
 * a judgement this page has no standing to make.
 *
 * Styling follows the rest of the explorer rather than inventing its own: the
 * `grid-explorer-chart-card` shell with its `__head`/`__title`/`__sub` parts,
 * `grid-explorer-table` for both tables, `GridExplanationBlock` for the
 * disclosure and `GridCardFooter` for provenance. It was hand-rolled at first —
 * bespoke radii, its own type scale, its own table markup — and read as a
 * foreign component dropped onto the page.
 */

type Comparison = {
  label: string;
  unit: string;
  forecast: number | null | undefined;
  actual: number | null | undefined;
  /** Decimal places for both figures and the gap. */
  dp: number;
  note?: string;
};

function fmt(value: number | null | undefined, dp: number): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** Signed difference, coloured the way the rest of the explorer colours deltas. */
function Delta({ gap, dp, pct }: { gap: number | null; dp: number; pct: number | null }) {
  if (gap == null) {
    // One side unpublished. An em dash, never a zero: "the forecast was exactly
    // right" and "one of these two figures does not exist" must not render the
    // same.
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        gap > 0 && 'text-emerald-600 dark:text-emerald-400',
        gap < 0 && 'text-amber-600 dark:text-amber-400',
        gap === 0 && 'text-muted-foreground',
      )}
    >
      {gap > 0 ? '+' : gap < 0 ? '−' : ''}
      {fmt(Math.abs(gap), dp)}
      {pct != null && (
        <span className="text-muted-foreground/70 font-normal ml-1">
          ({pct > 0 ? '+' : pct < 0 ? '−' : ''}
          {Math.abs(pct).toFixed(1)}%)
        </span>
      )}
    </span>
  );
}

export function ForecastVsActualPanel({
  forecast,
  systemStats,
  hourlyLoadData,
  chartTheme,
  className,
}: {
  forecast?: GridForecast | null;
  systemStats: GridSystemStats;
  /** The day's measured curve, for the hour-by-hour comparison. */
  hourlyLoadData?: HourlyLoadItem[];
  /** Same palette the other canvases draw with, so the axes match. */
  chartTheme: {
    primary: string;
    accent: string;
    destructive: string;
    axisTick: string;
    gridStroke: string;
  };
  className?: string;
}) {
  // "10:06" from the stored instant, without a date library and without
  // shifting it into the reader's zone — the stamp is Bangladesh local time and
  // is meaningful only as such.
  const issuedClock = forecast?.issuedAt ? forecast.issuedAt.slice(11, 16) : null;
  const issuedHour = issuedClock ? Number(issuedClock.slice(0, 2)) : null;
  // The evening peak sits at 18:00-21:00; 20:00 is the middle of it and close
  // enough for a lead figure that is explicitly "roughly".
  const leadHours = issuedHour == null ? null : Math.max(0, 20 - issuedHour);

  // Hour-by-hour, forecast against measured. Rows stamped before the report was
  // generated are marked rather than dropped: PGCB published them, so they
  // belong on the page, but they had already happened and scoring them as
  // predictions would invent an accuracy the forecast never claimed.
  const actualByHour = new Map((hourlyLoadData ?? []).map((h) => [h.time, h]));
  const hourly = (forecast?.hourly ?? []).map((row) => {
    const actual = actualByHour.get(row.time);
    const gap =
      row.generationMw != null && actual?.generation != null
        ? actual.generation - row.generationMw
        : null;
    const hour = Number(row.time.slice(0, 2));
    return {
      ...row,
      actualMw: actual?.generation ?? null,
      gap,
      beforeIssue: issuedHour != null && hour < issuedHour,
    };
  });
  const scored = hourly.filter((h) => !h.beforeIssue && h.gap != null);
  const meanAbsGap = scored.length
    ? scored.reduce((sum, h) => sum + Math.abs(h.gap!), 0) / scored.length
    : null;
  const worst = scored.length
    ? scored.reduce((a, b) => (Math.abs(b.gap!) > Math.abs(a.gap!) ? b : a))
    : null;

  if (!forecast) return null;

  const rows: Comparison[] = [
    {
      label: 'Peak generation, evening',
      unit: 'MW',
      forecast: forecast.maxGenEveningMw,
      actual: systemStats.eveningPeakGen,
      dp: 0,
    },
    {
      label: 'Peak demand, evening',
      unit: 'MW',
      forecast: forecast.maxDemandEveningMw,
      actual: systemStats.eveningPeakDemand,
      dp: 0,
    },
    {
      label: 'Peak demand, day',
      unit: 'MW',
      forecast: forecast.maxDemandDayMw,
      actual: systemStats.dayPeakDemand,
      dp: 0,
    },
    // The 2014-era sheets forecast one demand figure and did not say which peak
    // it referred to. It is set against the evening peak because that is the
    // day's higher of the two and the one PGCB planned against, and the row
    // says so rather than quietly labelling it "evening".
    {
      label: 'Peak demand (undifferentiated)',
      unit: 'MW',
      forecast: forecast.maxDemandMw,
      actual: systemStats.eveningPeakDemand,
      dp: 0,
      note: 'The 2014 layout forecast a single peak demand without naming day or evening; the actual shown is the evening peak.',
    },
    {
      label: 'Total energy generated',
      unit: 'MKWh',
      forecast: forecast.totalEnergyGenMkwh,
      actual: systemStats.totalEnergyGen,
      dp: 2,
    },
    {
      label: 'Maximum temperature, Dhaka',
      unit: '°C',
      forecast: forecast.maxTempC,
      actual: systemStats.maxTemp,
      dp: 1,
      note: 'Published on the 2025 layout only.',
    },
  ].filter((r) => r.forecast != null || r.actual != null);

  if (!rows.length) return null;

  const areas = forecast.areaLoadShedMw
    ? Object.entries(forecast.areaLoadShedMw).filter(([, mw]) => mw > 0)
    : [];

  return (
    <div className={cn('grid-explorer-chart-card card', className)}>
      <div className="grid-explorer-chart-card__head">
        <div className="flex items-center gap-2.5 min-w-0">
          <Target className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h3 className="grid-explorer-chart-card__title">
              Forecast against Outturn
              <DailyBadge />
            </h3>
            {/* This said the projection was published "one day ahead", which
                the source contradicts. PGCB's own stamp — "generated digitally
                from OIS at 10:06 hrs on 17-08-2026" — puts it at ~10:00 on the
                day it describes, on every 2025+ report checked. Calling that a
                day-ahead forecast overstates the lead and flatters the result. */}
            <p className="grid-explorer-chart-card__sub">
              PGCB&apos;s projection for {forecast.targetDay} <GridProvenanceTag kind="P" />
              {issuedClock ? (
                <>
                  {' '}issued at{' '}
                  <span className="text-primary font-semibold text-xs tabular-nums">
                    {issuedClock}
                  </span>{' '}
                  that morning — roughly {leadHours} hours before the evening peak, not a day
                  ahead.
                </>
              ) : (
                <>
                  {' '}carried by the report for energy day{' '}
                  <span className="tabular-nums">{forecast.issuedOn}</span>; this layout prints no
                  generation time, so the lead is unknown.
                </>
              )}
            </p>
          </div>
        </div>
        <span className="grid-explorer-chip">Forecast</span>
      </div>

      <div className="grid-explorer-table-wrap">
        {/* Fixed layout with explicit widths. `grid-explorer-table` uses auto
            layout, which is right for the seven-column fuel table but leaves a
            four-column one strung across 1,480px with the numbers marooned
            mid-row. The columns are apportioned instead so the table fills the
            card deliberately rather than by accident. */}
        <table className="grid-explorer-table table-fixed">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr>
              <th>Measure</th>
              <th className="text-left">
                Forecast <GridProvenanceTag kind="P" />
              </th>
              <th className="text-left">
                Actual <GridProvenanceTag kind="P" />
              </th>
              <th className="text-left">
                Difference <GridProvenanceTag kind="D" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const both =
                row.forecast != null &&
                row.actual != null &&
                Number.isFinite(row.forecast) &&
                Number.isFinite(row.actual);
              const gap = both ? row.actual! - row.forecast! : null;
              const pct =
                both && row.forecast !== 0 ? (gap! / Math.abs(row.forecast!)) * 100 : null;
              return (
                <tr key={row.label}>
                  <td className="font-semibold">
                    {row.label}
                    {row.note && (
                      <span className="block text-[10px] font-normal text-muted-foreground/80 leading-snug mt-0.5">
                        {row.note}
                      </span>
                    )}
                  </td>
                  <td className="tabular-nums">
                    {fmt(row.forecast, row.dp)}
                    <span className="text-muted-foreground/70 ml-1">{row.unit}</span>
                  </td>
                  <td className="tabular-nums">
                    {fmt(row.actual, row.dp)}
                    <span className="text-muted-foreground/70 ml-1">{row.unit}</span>
                  </td>
                  <td>
                    <Delta gap={gap} dp={row.dp} pct={pct} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(areas.length > 0 ||
        forecast.totalLoadShedMw != null ||
        forecast.areaLoadShedUnread ||
        forecast.shortageMw != null) && (
        <div className="mt-4 rounded-xl border border-border/30 bg-muted/10 p-4 space-y-2">
          <p className="text-xs font-bold text-foreground">
            Load shedding expected at the evening peak <GridProvenanceTag kind="P" />
          </p>
          {forecast.areaLoadShedUnread ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              The area breakdown on this report did not reconcile against its own stated total, so
              it is not shown. The total below is PGCB&apos;s own.
            </p>
          ) : areas.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {areas.map(([zone, mw]) => (
                <span key={zone}>
                  {zone}{' '}
                  <span className="tabular-nums font-semibold text-foreground">
                    {mw.toLocaleString('en-US')} MW
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              None forecast in any of the nine areas.
            </p>
          )}
          <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
            {forecast.totalLoadShedMw != null && (
              <>
                Forecast total{' '}
                <span className="tabular-nums font-semibold text-foreground">
                  {forecast.totalLoadShedMw.toLocaleString('en-US')} MW
                </span>
              </>
            )}
            {forecast.reserveMw != null && (
              <>
                {' · reserve expected at generation end '}
                <span className="tabular-nums font-semibold text-foreground">
                  {forecast.reserveMw.toLocaleString('en-US')} MW
                </span>
              </>
            )}
            {/* The 2014 sheets print this instead of a reserve, and print it
                negative when generation was expected to fall short. The sign is
                reproduced, not flipped into a reserve. */}
            {forecast.shortageMw != null && (
              <>
                {' · shortage expected at generation end '}
                <span className="tabular-nums font-semibold text-foreground">
                  {forecast.shortageMw.toLocaleString('en-US')} MW
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {hourly.length > 0 && (
        <div className="mt-5">
          <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground">
                Forecast curve against the measured one
              </h4>
              {meanAbsGap != null && (
                <p className="grid-explorer-chart-card__sub">
                  Mean absolute miss{' '}
                  <span className="text-primary font-semibold text-xs tabular-nums">
                    {Math.round(meanAbsGap).toLocaleString('en-US')} MW
                  </span>{' '}
                  across {scored.length} forecast hours <GridProvenanceTag kind="D" />
                  {worst && (
                    <>
                      {' · widest at '}
                      <span className="tabular-nums font-semibold text-foreground">
                        {worst.time}
                      </span>{' '}
                      ({worst.gap! > 0 ? '+' : '−'}
                      {Math.abs(Math.round(worst.gap!)).toLocaleString('en-US')} MW)
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Drawn, not tabulated. 26 rows of numbers answered "what was the
              forecast at 03:00", which nobody asks; the curve answers "where
              did it drift", which is the question. */}
          <ForecastCurveCanvas
            points={hourly.map((h) => ({
              time: h.time,
              forecastMw: h.generationMw,
              actualMw: h.actualMw,
              beforeIssue: h.beforeIssue,
            }))}
            forecastColor={chartTheme.accent}
            actualColor={chartTheme.primary}
            // The band and the strip are signed, so they need the same two
            // colours the tables use for a miss — amber for short of forecast,
            // emerald for over. One flat wash for both directions was the
            // chart's worst fault: it hid the only thing worth seeing.
            shortColor={chartTheme.destructive}
            overColor={chartTheme.accent}
            axisColor={chartTheme.axisTick}
            gridColor={chartTheme.gridStroke}
            issuedClock={issuedClock}
            eveningPeakTime={systemStats.peakTimes?.eveningPeakGen ?? null}
          />
        </div>
      )}

      <GridExplanationBlock
        what={
          <>
            PGCB publishes two days in every daily report: the reported day&apos;s actuals and a
            projection for the next. This card sets that projection against what the grid then
            did. The projection is issued at about 10:00 on the morning of the day it describes,
            so hours marked <strong>past</strong> in the curve had already happened when it was
            written — they are published figures rather than predictions, and are excluded from
            the mean miss above.
          </>
        }
        insight={
          <>
            A miss is shown as a signed difference and nothing more. PGCB forecasts a system it
            does not fully control — a plant trips, gas runs short, weather moves — so a gap is
            not in itself a failure of forecasting, and this page does not grade it as one. What
            the series does support is a question no single day answers: whether the misses lean
            consistently one way, and whether that lean shifts with the season or the fuel mix.
          </>
        }
      />

      <GridCardFooter>
        <span>
          Source:{' '}
          <a
            href="https://www.pgcb.gov.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            PGCB Daily Report
          </a>{' '}
          —{' '}
          {forecast.layout === 'scenario'
            ? 'the "Forecast Scenario" block'
            : 'the next-day block of the Forecast sheet'}{' '}
          in the report for {forecast.issuedOn}
        </span>
        <GridSourceFiles files={[{ label: 'PGCB', name: forecast.issuedIn }]} />
        <span>As published by PGCB. Not audited.</span>
        {/* Which store held the workbook. This said "no copy of this workbook as
            issued is held", which is not true: the ERP portal is the one PGCB's
            own site links as its Daily Operation Report, pgcb.gov.bd hosts no
            daily reports at all, and the held copies are byte-identical to what
            that portal serves. */}
        {forecast.issuedFrom === 'erp-mirror' && (
          <span>Workbook acquired from PGCB&apos;s ERP portal</span>
        )}
        {forecast.issuedFrom === 'converted-text' && (
          <span>Read from a pre-converted text copy — no workbook is held for this day</span>
        )}
        <span className="font-medium">
          Reporting Period: Projection for {forecast.targetDay}
          {issuedClock ? `, issued ${issuedClock} that day` : ''}
        </span>
      </GridCardFooter>
    </div>
  );
}
