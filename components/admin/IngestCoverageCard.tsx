'use client';

import { AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayRow, IngestCoverage } from '@/lib/data/grid/ingest-coverage.server';

/**
 * What the site holds, and what it still needs — before anything is uploaded.
 *
 * The screen used to say only "next day needed", derived by adding a day to the
 * newest file. That is right only if the archive has no holes, and it has 81 in
 * the grid days alone, 196 in the gas, and thousands in the station detail. An
 * operator had no way to see a gap, or to see a day that was present but
 * incomplete — and a day held without its gas publishes with the gas columns
 * blank, silently.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pretty(key: string | null): string {
  if (!key) return '—';
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (d) return `${Number(d[3])} ${MONTHS[Number(d[2]) - 1]} ${d[1]}`;
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : key;
}

/** One square per day: what the site holds for it, at a glance. */
function DayCell({ row }: { row: DayRow }) {
  const have = [row.grid, row.gas, row.plants].filter(Boolean).length;
  const title =
    `${pretty(row.date)}\n` +
    `${row.grid ? '✓' : '✗'} grid day\n` +
    `${row.gas ? '✓' : '✗'} gas day\n` +
    `${row.plants ? '✓' : '✗'} station detail`;

  return (
    <span
      title={title}
      className={cn(
        'ingest-day',
        !row.grid && 'ingest-day--absent',
        row.grid && have === 3 && 'ingest-day--full',
        row.grid && have === 2 && 'ingest-day--most',
        row.grid && have === 1 && 'ingest-day--thin',
      )}
      aria-label={title}
    />
  );
}

export function IngestCoverageCard({ coverage }: { coverage: IngestCoverage }) {
  const { datasets, recent, awaiting, gasMissing, plantsMissing, monthsMissing, daysBehind } =
    coverage;

  const upToDate = awaiting.length === 0;

  return (
    <div className="space-y-4">
      {/* ── what to do next ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'rounded-xl border p-4',
          upToDate ? 'border-emerald-500/35 bg-emerald-500/[0.05]' : 'border-amber-500/40 bg-amber-500/[0.06]',
        )}
      >
        <div className="flex items-start gap-3">
          {upToDate ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">
              {upToDate
                ? 'Every energy day PGCB has published is on the site.'
                : `${awaiting.length} energy day${awaiting.length === 1 ? '' : 's'} to ingest`}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {/* The rule that trips everyone: a day's sources appear the next
                  morning, so "today" is never ingestable. */}
              Today is {pretty(coverage.today)} in Dhaka, so {pretty(coverage.newestPublishable)} is
              the newest energy day whose report exists — PGCB posts a day&rsquo;s workbook, and
              Petrobangla files its 08:00–08:00 gas window, the following morning.
              {daysBehind !== null && daysBehind > 1 && (
                <> The site is <span className="font-semibold">{daysBehind} days</span> behind that.</>
              )}
            </p>

            {awaiting.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-background">
                <table className="w-full text-[12px]">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-1.5 font-semibold">Energy day</th>
                      <th className="px-3 py-1.5 font-semibold">PGCB workbook to upload</th>
                      <th className="px-3 py-1.5 font-semibold">Gas report filed under</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awaiting.slice(0, 10).map((a) => (
                      <tr key={a.date} className="border-t border-border/40">
                        <td className="px-3 py-1.5 font-semibold tabular-nums">{a.date}</td>
                        <td className="px-3 py-1.5 font-mono text-[11.5px]">{a.workbook}</td>
                        <td className="px-3 py-1.5 tabular-nums text-muted-foreground">
                          {a.gasFiledUnder}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {awaiting.length > 10 && (
                  <p className="border-t border-border/40 px-3 py-1.5 text-[11.5px] text-muted-foreground">
                    …and {awaiting.length - 10} older day{awaiting.length - 10 === 1 ? '' : 's'} in
                    the last {recent.length}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── days held but incomplete ────────────────────────────────────── */}
      {(gasMissing.length > 0 || plantsMissing.length > 0) && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 text-[12px]">
              <p className="font-semibold">Days on the site that are not complete</p>
              {gasMissing.length > 0 && (
                <p className="mt-1 text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {gasMissing.length} day{gasMissing.length === 1 ? '' : 's'} with no gas report
                  </span>{' '}
                  — these publish with the gas figures blank, and the year-on-year sheet refuses to
                  build for them: {gasMissing.slice(0, 8).join(', ')}
                  {gasMissing.length > 8 ? ` … +${gasMissing.length - 8}` : ''}
                </p>
              )}
              {plantsMissing.length > 0 && (
                <p className="mt-1 text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {plantsMissing.length} day{plantsMissing.length === 1 ? '' : 's'} with no station
                    detail
                  </span>{' '}
                  — the per-station section is empty for them: {plantsMissing.slice(0, 8).join(', ')}
                  {plantsMissing.length > 8 ? ` … +${plantsMissing.length - 8}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── what the site holds ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
          <Database className="h-4 w-4 text-muted-foreground" />
          <p className="text-[13px] font-bold">What the site holds</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-[12px]">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2 font-semibold">Dataset</th>
                <th className="px-4 py-2 text-right font-semibold">Held</th>
                <th className="px-4 py-2 font-semibold">Span</th>
                <th className="px-4 py-2 text-right font-semibold">Missing inside</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-t border-border/40 align-top">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{d.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{d.what}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold tabular-nums">
                    {d.held.toLocaleString()}
                    <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">
                      {d.unit}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                    {pretty(d.first)} → {pretty(d.last)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {d.missingInside === 0 ? (
                      <span className="text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-400">
                        none
                      </span>
                    ) : (
                      <>
                        <span className="font-bold tabular-nums text-amber-700 dark:text-amber-400">
                          {d.missingInside.toLocaleString()}
                        </span>
                        {d.recentGaps.length > 0 && (
                          <p className="mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                            newest: {d.recentGaps.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* What "missing" can and cannot mean here. Neither source keeps a
            browsable archive — pgcb.gov.bd/reports/ returns nothing for any
            date, including days the site holds, and Petrobangla's listing
            carries a rolling ten days. So a gap older than that window cannot
            be re-checked against the publisher, and the count below is what the
            site lacks, not proof the report was never issued. */}
        <p className="border-t border-border/50 px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Missing</span> means the site does not
          hold the day. It is not a claim the report was never published: neither publisher keeps a
          browsable archive — Petrobangla&rsquo;s listing carries a rolling ten days, and PGCB&rsquo;s
          report directory returns nothing for any date, including days already on the site. Only
          gaps inside the last ten days can be re-checked upstream.
        </p>

        {monthsMissing.length > 0 && (
          <p className="border-t border-border/50 px-4 py-2 text-[11.5px] text-muted-foreground">
            Monthly reports still to find: {monthsMissing.map((m) => pretty(m)).join(', ')}
          </p>
        )}

        {/* ── the last stretch, day by day ──────────────────────────────── */}
        <div className="border-t border-border/50 px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Last {recent.length} energy days
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="ingest-day ingest-day--full" /> complete
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="ingest-day ingest-day--most" /> grid + one
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="ingest-day ingest-day--thin" /> grid only
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="ingest-day ingest-day--absent" /> nothing
              </span>
            </div>
          </div>
          {/* Oldest on the left, so it reads as time passing. */}
          <div className="ingest-strip">
            {[...recent].reverse().map((r) => (
              <DayCell key={r.date} row={r} />
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <CircleDashed className="h-3 w-3" />
            Hover a square for that day&rsquo;s three artifacts.
          </p>
        </div>
      </div>
    </div>
  );
}
