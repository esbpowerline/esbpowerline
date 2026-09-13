'use client';

import { AlertTriangle, CalendarClock, CheckCircle2, Database } from 'lucide-react';
import type { IngestCoverage } from '@/lib/data/grid/ingest-coverage.server';
import { IngestDayStrip } from '@/components/admin/IngestDayStrip';
import { AutomationPulseRow } from '@/components/admin/AutomationPulseRow';
import { AdminCard, AdminTableShell } from '@/components/admin/AdminUI';

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
 *
 * Every block is an AdminCard and every table the shell's rows run flush in
 * the card. They were three hand-rolled panels with their own header heights,
 * title sizes and table styles — none of them matching the cards around them.
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
    monthsNeverPublished,
    daysBehind,
    pulse,
    degraded,
  } = coverage;

  const upToDate = awaiting.length === 0;
  const complete = recent.filter((r) => r.heldCount === 4).length;

  return (
    <div className="admin-section-stack">
      <AutomationPulseRow pulse={pulse} degraded={degraded} />

      {/* ── what to do next ─────────────────────────────────────────────── */}
      <AdminCard
        title={
          upToDate
            ? 'Every energy day PGCB has published is on the site'
            : `${awaiting.length} energy day${awaiting.length === 1 ? '' : 's'} to ingest`
        }
        icon={upToDate ? CheckCircle2 : CalendarClock}
        className={upToDate ? 'admin-card--ok' : 'admin-card--warn'}
      >
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {/* The rule that trips everyone: a day's sources appear the next
              morning, so "today" is never ingestable. */}
          Today is {pretty(coverage.today)} in Dhaka, so {pretty(coverage.newestPublishable)} is
          the newest energy day whose report exists — PGCB posts a day&rsquo;s workbook, and
          Petrobangla files its 08:00–08:00 gas window, the following morning.
          {daysBehind !== null && daysBehind > 1 && (
            <> The site is <span className="font-semibold text-foreground">{daysBehind} days</span> behind that.</>
          )}
        </p>

        {awaiting.length > 0 && (
          <div className="admin-card-section">
            <AdminTableShell className="admin-table-shell--flush">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left">Energy day</th>
                    <th className="text-left">PGCB workbook to upload</th>
                    <th className="text-left">Gas report filed under</th>
                  </tr>
                </thead>
                <tbody>
                  {awaiting.slice(0, 10).map((a) => (
                    <tr key={a.date}>
                      <td className="font-semibold tabular-nums">{a.date}</td>
                      <td className="font-mono text-[11.5px]">{a.workbook}</td>
                      <td className="tabular-nums text-muted-foreground">{a.gasFiledUnder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableShell>
            {awaiting.length > 10 && (
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                …and {awaiting.length - 10} older day{awaiting.length - 10 === 1 ? '' : 's'} in the
                last {recent.length}.
              </p>
            )}
          </div>
        )}
      </AdminCard>

      {/* ── days held but incomplete ────────────────────────────────────── */}
      {(gasMissing.length > 0 || plantsMissing.length > 0 || curveMissing.length > 0) && (
        <AdminCard title="Days on the site that are not complete" icon={AlertTriangle} className="admin-card--warn">
          <div className="flex flex-col gap-1.5 text-[12px] text-muted-foreground">
            {gasMissing.length > 0 && (
              <p>
                <span className="font-semibold text-foreground">
                  {gasMissing.length} day{gasMissing.length === 1 ? '' : 's'} with no gas report
                </span>{' '}
                — these publish with the gas figures blank, and the year-on-year sheet refuses to
                build for them: {gasMissing.slice(0, 8).join(', ')}
                {gasMissing.length > 8 ? ` … +${gasMissing.length - 8}` : ''}
              </p>
            )}
            {curveMissing.length > 0 && (
              <p>
                <span className="font-semibold text-foreground">
                  {curveMissing.length} day{curveMissing.length === 1 ? '' : 's'} with no energy curve
                </span>{' '}
                — the Energy Curve tab is empty for them: {curveMissing.slice(0, 8).join(', ')}
                {curveMissing.length > 8 ? ` … +${curveMissing.length - 8}` : ''}
              </p>
            )}
            {plantsMissing.length > 0 && (
              <p>
                <span className="font-semibold text-foreground">
                  {plantsMissing.length} day{plantsMissing.length === 1 ? '' : 's'} with no station detail
                </span>{' '}
                — the Power Stations tab is empty for them: {plantsMissing.slice(0, 8).join(', ')}
                {plantsMissing.length > 8 ? ` … +${plantsMissing.length - 8}` : ''}
              </p>
            )}
            <p className="text-[11px]">
              Run the full ingest for the day below — it produces all four and publishes them together.
            </p>
          </div>
        </AdminCard>
      )}

      {/* ── what the site holds ─────────────────────────────────────────── */}
      <AdminCard title="What the site holds" icon={Database}>
        <AdminTableShell className="admin-table-shell--flush">
          <table className="w-full min-w-[680px] text-[12px]">
            <thead>
              <tr>
                <th className="text-left">Dataset</th>
                <th className="text-right">Held</th>
                <th className="text-left">Span</th>
                <th className="text-right">Missing inside</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="align-top">
                  <td>
                    <p className="font-semibold">{d.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{d.what}</p>
                  </td>
                  <td className="whitespace-nowrap text-right font-bold tabular-nums">
                    {d.held.toLocaleString()}
                    <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">{d.unit}</span>
                    {/* Said, not hidden: on the deployed panel this row can only
                        be counted over the window the compiled index covers, and
                        a total that silently means something narrower than the
                        row beside it is worse than no total. */}
                    {d.windowOnly && (
                      <p className="mt-0.5 text-[10px] font-normal text-muted-foreground">recent window only</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {pretty(d.first)} → {pretty(d.last)}
                  </td>
                  <td className="text-right">
                    {d.missingInside === 0 ? (
                      <span className="text-[11.5px] font-semibold text-[hsl(var(--staff-ok))]">none</span>
                    ) : (
                      <>
                        <span className="font-bold tabular-nums text-[hsl(var(--staff-warn))]">
                          {d.missingInside.toLocaleString()}
                        </span>
                        {d.recentGaps.length > 0 && (
                          <p className="mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                            newest: {d.recentGaps.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </>
                    )}
                    {/* Counted apart, never folded into the number above: a hole
                        the publisher left is a fact about the record, not work.
                        Only the grid and monthly rows have that evidence, and
                        both are PGCB's. */}
                    {d.neverPublished > 0 && (
                      <p className="mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                        +{d.neverPublished.toLocaleString()} PGCB never published
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>

        {/* What "missing" can and cannot mean here. It used to count every
            hole, which read as a to-do list of 81 grid days and three monthly
            reports when 67 of those days and all three months had already been
            shown not to exist (2026-09-13). The publisher's holes are now
            counted apart, from evidence; everything else stays "missing". */}
        <p className="admin-card-section text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Missing</span> means the site does not
          hold the slot and a source is, or may yet be, obtainable.{' '}
          <span className="font-semibold text-foreground">Never published</span> is counted apart,
          from evidence: for grid days, the site&rsquo;s own declaration of days PGCB&rsquo;s archive
          does not index or cannot serve (grid-verification/no-source-days.json); for monthly
          reports, PGCB&rsquo;s ERP. The gas, curve and station rows have no such evidence, so every
          hole in them is counted as ours — Petrobangla&rsquo;s listing carries only a rolling ten
          days, so an older gas gap cannot be re-checked upstream.
        </p>

        {monthsMissing.length > 0 && (
          <p className="admin-card-section text-[11.5px] text-muted-foreground">
            Monthly reports still to find: {monthsMissing.map((m) => pretty(m)).join(', ')}
          </p>
        )}
        {monthsNeverPublished.length > 0 && (
          <p className="admin-card-section text-[11px] leading-relaxed text-muted-foreground">
            PGCB never published{' '}
            {monthsNeverPublished.map((m, i) => (
              <span key={m.month}>
                {i > 0 && '; '}
                <span className="font-semibold text-foreground">{pretty(m.month)}</span> ({m.why})
              </span>
            ))}
            .
          </p>
        )}

        {/* ── the last stretch, day by day ──────────────────────────────── */}
        <div className="admin-card-section">
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
      </AdminCard>
    </div>
  );
}
