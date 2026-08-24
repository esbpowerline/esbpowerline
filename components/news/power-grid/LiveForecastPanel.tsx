'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GridCardFooter,
  GridExplanationBlock,
  GridProvenanceTag,
  GridSourceFiles,
  LiveBadge,
} from '@/components/news/power-grid/GridExplorerUI';
import { ForecastCurveCanvas } from '@/components/news/power-grid/ForecastCurveCanvas';
import {
  friendlyHour,
  minutesOfRow,
  type ForecastVsLive,
  type ForecastVsLiveRow,
  type ForwardForecast,
} from '@/lib/data/grid/forward-forecast';

/**
 * Today's forecast against today's posted hours, while today is still running.
 *
 * The card below this one compares a settled day out of the archive. This one
 * cannot wait for the archive: PGCB's projection for today is filed in this
 * morning's workbook and only reaches the archive tomorrow, by which point the
 * NLDC hours it should be read against are yesterday's news. So the forward
 * half is published on its own by `scripts/build_forward_forecast.py`, and this
 * reads it beside the same live route the homepage panel uses.
 *
 * The drawing is `ForecastCurveCanvas` — the same chart the archive card uses,
 * deliberately. A second visual language for the same comparison would imply a
 * second kind of measurement, and there isn't one: only the vintage of the
 * actuals differs, hourly page now versus audited workbook tomorrow. That is
 * said in words instead, where it belongs.
 *
 * It renders nothing at all unless both halves are present and describe the
 * same day. A forecast with no posted hours, or posted hours with no forecast,
 * is not half a comparison — it is a different chart, and this card declines
 * to become one.
 */

function fmt(value: number | null, dp = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** Signed, never scored — the same stance the archive card takes. */
function Gap({ mw }: { mw: number | null }) {
  if (mw == null) return <span className="text-muted-foreground">—</span>;
  const rounded = Math.round(mw);
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        rounded > 0 && 'text-emerald-600 dark:text-emerald-400',
        rounded < 0 && 'text-amber-600 dark:text-amber-400',
        rounded === 0 && 'text-muted-foreground',
      )}
    >
      {rounded > 0 ? '+' : rounded < 0 ? '−' : ''}
      {fmt(Math.abs(rounded))}
    </span>
  );
}

/**
 * Minutes past midnight in Dhaka, and the clock face that goes with it.
 *
 * Read through Intl rather than off the local clock. Everything on this card is
 * Bangladesh wall-clock -- PGCB's stamp, NLDC's hours, the forecast rows -- and
 * a reader in another timezone comparing those to their own midnight would draw
 * exactly the wrong conclusion about which hours have happened.
 */
function dhakaNow(): { minutes: number; clock: string; hourKey: string; date: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  // Intl gives hour 24 at midnight under hourCycle h23/h24 in some engines.
  const hh = Number(get('hour')) % 24;
  const mm = Number(get('minute'));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    minutes: hh * 60 + mm,
    clock: `${pad(hh)}:${pad(mm)}`,
    hourKey: `${pad(hh)}:00`,
    date: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

function useDhakaClock() {
  const [now, setNow] = useState<ReturnType<typeof dhakaNow> | null>(null);
  useEffect(() => {
    setNow(dhakaNow());
    const id = setInterval(() => setNow(dhakaNow()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * One tile of the headline row.
 *
 * Equal columns with a rule between them, not four free-floating blocks: the
 * figures are different widths and the old flex row let each one sit wherever
 * its content ended, so the strip read as ragged with a hole on the right. The
 * grid decides the columns and the tile fills its share.
 */
function Stat({
  label,
  index,
  children,
  foot,
  tone,
}: {
  label: React.ReactNode;
  index: number;
  children: React.ReactNode;
  foot?: React.ReactNode;
  /** The now tile is the one a reader should land on first. */
  tone?: 'now';
}) {
  return (
    <div
      className={cn(
        'live-forecast-stat flex flex-col justify-between gap-1.5 min-w-0 px-4 py-3',
        tone === 'now' && 'bg-primary/[0.04]',
      )}
      style={{ '--i': index } as React.CSSProperties}
    >
      <span
        className={cn(
          'text-[10px] font-semibold uppercase tracking-wider leading-tight',
          tone === 'now' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      <span className="text-[15px] md:text-base font-bold tabular-nums leading-none whitespace-nowrap">
        {children}
      </span>
      <span className="text-[10px] text-muted-foreground/80 leading-snug min-h-[1.2em]">
        {foot ?? ''}
      </span>
    </div>
  );
}

export function LiveForecastPanel({
  forecast,
  comparison,
  chartTheme,
  toggle,
  className,
}: {
  /** Today's forward forecast, as published by build_forward_forecast.py. */
  forecast: ForwardForecast;
  /** Already aligned against the posted hours by the section above. */
  comparison: ForecastVsLive;
  /** Same palette the other canvases draw with, so the axes match. */
  chartTheme: {
    primary: string;
    accent: string;
    destructive: string;
    axisTick: string;
    gridStroke: string;
  };
  /** The day switch, owned by ForecastSection and rendered in this head. */
  toggle?: React.ReactNode;
  className?: string;
}) {
  // The clock only speaks for THIS card while the card's day is the day in
  // Dhaka. Past midnight the live route still serves yesterday until NLDC
  // posts the new day's first hour, and an ungated clock then read 00:20 as
  // "right now" against yesterday's 00:00 row -- pointing at an hour that had
  // happened a full day earlier. Once the day has turned, the card says the
  // day is over instead of pretending to be live.
  const clock = useDhakaClock();
  const now = clock && clock.date === comparison.day ? clock : null;
  const dayIsOver = Boolean(clock && clock.date !== comparison.day);
  // Every row of the day, newest first -- including the hours still ahead. The
  // table used to drop them, which hid the half of the forecast that has not
  // been tested yet and made a day look complete at noon.
  const rows: ForecastVsLiveRow[] = [...comparison.rows].reverse();
  const { issuedClock } = comparison;
  const latest = comparison.latestMatched;
  const nowRow = now ? comparison.rows.find((r) => r.time === now.hourKey) ?? null : null;
  // The evening peak is what the whole report is planned around, so the curve
  // marks it — PGCB's projected hour, since no audited one exists yet.
  const peakRow = comparison.rows.reduce<ForecastVsLiveRow | null>(
    (best, r) =>
      r.forecastGenMw != null && (best?.forecastGenMw == null || r.forecastGenMw > best.forecastGenMw)
        ? r
        : best,
    null,
  );

  return (
    <div className={cn('grid-explorer-chart-card card live-forecast-card', className)}>
      <div className="grid-explorer-chart-card__head">
        <div className="flex items-center gap-2.5 min-w-0">
          <Activity className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h3 className="grid-explorer-chart-card__title">
              Today against Forecast
              <LiveBadge />
            </h3>
            <p className="grid-explorer-chart-card__sub">
              PGCB&apos;s projection for {comparison.day} <GridProvenanceTag kind="P" />
              {issuedClock ? (
                <>
                  {' '}issued at{' '}
                  <span className="text-primary font-semibold text-xs tabular-nums">
                    {issuedClock}
                  </span>{' '}
                  this morning
                </>
              ) : null}
              , against the{' '}
              <span className="tabular-nums">{comparison.coverage.matched}</span> hours NLDC has
              posted since. The day is not over and this is not the archive: these figures are
              replaced by the audited workbook tomorrow.
            </p>
          </div>
        </div>
        {toggle ?? <span className="grid-explorer-chip">Live</span>}
      </div>

      {/* Four equal columns separated by rules, not four blocks floating in a
          gap: the figures are different widths, so a gapped flex row left the
          strip ragged with dead space on the right. The last tile is the day's
          progress, which is the one that answers "so what does this mean right
          now" -- it leads on desktop by sitting where the eye finishes. */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/40 border-b border-border/40">
        <Stat
          label={
            dayIsOver
              ? 'This day has ended'
              : now
                ? `Right now · ${friendlyHour(now.hourKey)}`
                : 'Right now'
          }
          index={0}
          tone="now"
          foot={
            dayIsOver
              ? `Dhaka is into ${clock ? friendlyHour(clock.hourKey) : 'the next day'} of the following day; the audited workbook follows this morning`
              : now && nowRow
                ? nowRow.actualGenMw != null
                  ? `NLDC posted ${fmt(nowRow.actualGenMw)} MW against ${fmt(nowRow.forecastGenMw)} forecast`
                  : `PGCB forecast ${fmt(nowRow.forecastGenMw)} MW; this hour is not posted yet`
                : 'waiting for the clock'
          }
        >
          {dayIsOver ? (
            <span className="text-muted-foreground text-xs font-semibold">complete</span>
          ) : now && nowRow ? (
            nowRow.genGapMw != null ? (
              <>
                <Gap mw={nowRow.genGapMw} />
                <span className="text-muted-foreground/70 font-normal ml-1 text-[10px]">MW</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs font-semibold">not posted yet</span>
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Stat>
        <Stat
          label={`Newest posted hour · ${latest ? friendlyHour(latest.time) : '—'}`}
          index={1}
          foot={
            latest
              ? `${fmt(latest.forecastGenMw)} forecast, ${fmt(latest.actualGenMw)} posted`
              : undefined
          }
        >
          <Gap mw={latest?.genGapMw ?? null} />
          <span className="text-muted-foreground/70 font-normal ml-1 text-[10px]">MW</span>
        </Stat>
        <Stat
          label="Mean gap so far"
          index={2}
          foot={`across ${comparison.coverage.scored} hours forecast ahead of the clock`}
        >
          <Gap mw={comparison.meanGenGapMw} />
          <span className="text-muted-foreground/70 font-normal ml-1 text-[10px]">MW</span>
        </Stat>
        <Stat
          label="Day so far"
          index={3}
          foot={
            comparison.coverage.matched > comparison.coverage.scored
              ? `${comparison.coverage.matched - comparison.coverage.scored} predate the ${
                  issuedClock ?? 'morning'
                } stamp, so they are recorded, not forecast`
              : 'every posted hour was forecast ahead of the clock'
          }
        >
          {comparison.coverage.matched}
          <span className="text-muted-foreground/70 font-normal ml-1 text-[10px]">
            of {comparison.coverage.forecastHours} hours in
          </span>
        </Stat>
      </div>

      {/* The chart carries the reading; the table below is for the reader who
          wants the figure rather than the shape. */}
      <div className="px-2 pt-3 pb-1">
        <ForecastCurveCanvas
          points={comparison.rows.map((r) => ({
            time: r.time,
            forecastMw: r.forecastGenMw,
            actualMw: r.actualGenMw,
            beforeIssue: r.beforeIssue,
          }))}
          forecastColor={chartTheme.accent}
          actualColor={chartTheme.primary}
          shortColor={chartTheme.destructive}
          overColor={chartTheme.accent}
          axisColor={chartTheme.axisTick}
          gridColor={chartTheme.gridStroke}
          issuedClock={issuedClock}
          eveningPeakTime={peakRow?.time ?? null}
          nowMinutes={now?.minutes ?? null}
        />
      </div>

      {/* The day is 26 rows and the settled card that shares this slot is a
          third of the height. Left unbounded the switch changed the document
          by a thousand pixels, and at the foot of the page no amount of scroll
          compensation can absorb that -- the browser clamps to the new maximum
          and the reader is thrown. Bounding the list keeps the two vintages
          within a card of each other AND spares the page a table longer than
          most of its charts; the header stays put while it scrolls. */}
      <div className="grid-explorer-table-wrap grid-explorer-table-wrap--sticky-head max-h-[24rem]">
        <table className="grid-explorer-table table-fixed">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[19%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead>
            <tr>
              <th>Hour</th>
              <th className="text-left">When</th>
              <th className="text-left">
                Forecast gen <GridProvenanceTag kind="P" />
              </th>
              <th className="text-left">
                Posted gen <GridProvenanceTag kind="P" />
              </th>
              <th className="text-left">
                Difference <GridProvenanceTag kind="D" />
              </th>
              <th className="text-left">
                Demand gap <GridProvenanceTag kind="D" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isNow = now != null && row.time === now.hourKey;
              const ahead = now != null && minutesOfRow(row.time) > now.minutes;
              return (
                <tr
                  key={row.time}
                  className={cn(
                    isNow && 'bg-primary/[0.06]',
                    !isNow && (ahead || row.beforeIssue) && 'opacity-60',
                  )}
                >
                  <td className="font-semibold tabular-nums">{row.time}</td>
                  {/* The column that ties the sheet to the clock. A reader who
                      opens this at midnight should not have to work out which
                      of 26 rows has happened -- and "12 AM" is how they hold
                      the hour, where "00:00" is how PGCB prints it. */}
                  <td className="text-[11px] leading-snug">
                    <span className="font-semibold text-foreground">{friendlyHour(row.time)}</span>
                    <span className="block text-muted-foreground/80">
                      {isNow
                        ? 'happening now'
                        : ahead
                          ? 'still to come'
                          : row.beforeIssue
                            ? 'before the forecast was filed'
                            : row.actualGenMw != null
                              ? 'posted'
                              : 'due, not posted yet'}
                    </span>
                  </td>
                  <td className="tabular-nums">
                    {fmt(row.forecastGenMw)}
                    <span className="text-muted-foreground/70 ml-1">MW</span>
                  </td>
                  <td className="tabular-nums">
                    {row.actualGenMw != null ? (
                      <>
                        {fmt(row.actualGenMw)}
                        <span className="text-muted-foreground/70 ml-1">MW</span>
                      </>
                    ) : (
                      // Never a zero and never a dash alone: an hour that has
                      // not arrived and an hour NLDC failed to post are
                      // different facts, and the When column has just said
                      // which one this is.
                      <span className="text-muted-foreground/60 italic text-[11px]">
                        {ahead ? 'awaiting' : 'not posted'}
                      </span>
                    )}
                  </td>
                  <td>
                    <Gap mw={row.genGapMw} />
                  </td>
                  <td>
                    <Gap mw={row.demandGapMw} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <GridExplanationBlock
        what={
          <>
            PGCB files a projection for the coming day inside the workbook it publishes each
            morning — hour by hour generation, demand and load shed. NLDC separately posts what
            the grid actually did, an hour at a time, on the same portal. This card holds the two
            against each other while the day is still running, matching only hours that belong to{' '}
            {comparison.day}. An hour PGCB projected but NLDC has not yet posted is left blank
            rather than filled with a zero.
          </>
        }
        insight={
          <>
            Hours before the {issuedClock ?? 'morning'} stamp had already happened when the report
            was generated. They are drawn dashed and unshaded, and kept out of the mean and the
            widest gap: PGCB published them, but they were never predictions. Everything after it
            is reported as a signed difference and left there — positive means the grid generated
            more than was projected for that hour, negative less. Nothing is scored, because PGCB
            projects a system it does not fully control. The audited figures arrive with
            tomorrow&apos;s workbook and may differ from the hourly page.
          </>
        }
      />

      <GridCardFooter>
        <GridSourceFiles
          files={[
            { label: 'PGCB', name: forecast.issuedIn },
            { label: 'NLDC', name: 'hourly generation & demand pages' },
          ]}
        />
        <span className="font-medium">Reporting Period: Projection for {comparison.day}</span>
      </GridCardFooter>
    </div>
  );
}
