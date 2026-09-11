'use client';

import { AlertTriangle, CalendarClock, CheckCircle2, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IngestCoverage } from '@/lib/data/grid/ingest-coverage.server';
import { IngestDayStrip } from '@/components/admin/IngestDayStrip';
import { AutomationPulseRow } from '@/components/admin/AutomationPulseRow';

/**
 * What the site holds, and what it still needs — before anything is uploaded.
 *
 * The screen used to say only "next day needed", derived by adding a day to the
 * newest file. That is right only if the archive has no holes, and it has 81 in
 * the grid days alone, 196 in the gas, and thousands in the station detail. An
 * operator had no way to see a gap, or to see a day that was present but
 * incomplete — and a day held without its gas publishes with the gas columns
 * blank, silently.
 *
 * Since 2026-09-11 it also answers "who did this, and when" — the Pi publishes
 * the same release rows this panel does, so the strip shows the automation's
 * work and a hand ingest side by side, and a day done here during Pi
 * maintenance appears in exactly the same place.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pretty(key: string | null): string {
  if (!key) return '—';
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (d) return `${Number(d[3])} ${MONTHS[Number(d[2]) - 1]} ${d[1]}`;
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : key;
}

export function IngestCoverageCard({ coverage }: { coverage: IngestCoverage }) {
  const {
    datasets,
    recent,
    awaiting,
    gasMissing,
    plantsMissing,
    curveMissing,
    monthsMissing,
    daysBehind,
    pulse,
    degraded,
  } = coverage;

  const upToDate = awaiting.length === 0;
  const complete = recent.filter((r) => r.heldCount === 4).length;

  return (
    <div className="space-y-4">
      <AutomationPulseRow pulse={pulse} degraded={degraded} />
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
      {(gasMissing.length > 0 || plantsMissing.length > 0 || curveMissing.length > 0) && (
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
              {curveMissing.length > 0 && (
                <p className="mt-1 text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {curveMissing.length} day{curveMissing.length === 1 ? '' : 's'} with no energy
                    curve
                  </span>{' '}
                  — the Energy Curve tab is empty for them: {curveMissing.slice(0, 8).join(', ')}
                  {curveMissing.length > 8 ? ` … +${curveMissing.length - 8}` : ''}
                </p>
              )}
              {plantsMissing.length > 0 && (
                <p className="mt-1 text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {plantsMissing.length} day{plantsMissing.length === 1 ? '' : 's'} with no station
                    detail
                  </span>{' '}
                  — the Power Stations tab is empty for them: {plantsMissing.slice(0, 8).join(', ')}
                  {plantsMissing.length > 8 ? ` … +${plantsMissing.length - 8}` : ''}
                </p>
              )}
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Run the full ingest for the day below — it produces all four and publishes them
                together.
              </p>
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
                    {/* Said, not hidden: on the deployed panel this row can only
                        be counted over the window the compiled index covers, and
                        a total that silently means something narrower than the
                        row beside it is worse than no total. */}
                    {d.windowOnly && (
                      <p className="mt-0.5 text-[10px] font-normal text-muted-foreground">
                        recent window only
                      </p>
                    )}
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
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Last {recent.length} energy days
              <span className="ml-2 font-normal normal-case tracking-normal">
                <span className="font-bold tabular-nums text-foreground">{complete}</span> complete
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="ingest-day ingest-day--full" /> all four
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="ingest-day ingest-day--partial" /> partial
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="ingest-day ingest-day--absent" /> nothing
              </span>
            </div>
          </div>
          <IngestDayStrip recent={recent} />
          <p className="mt-2.5 text-[10.5px] leading-relaxed text-muted-foreground">
            A square is the energy day, not the filing date. Hover or tap one for its four
            artefacts, who published each, and how many NLDC hours that day holds.
          </p>
        </div>
      </div>
    </div>
  );
}
