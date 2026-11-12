'use client';

import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
// State, fetches and counts live in useTimeMachine so the phone app's screen shares them.
import { METRICS, STATE_LEGEND, strokeFor, useTimeMachine, type Point } from '@/components/news/power-grid/useTimeMachine';

/**
 * The Time Machine — eleven years of NLDC's hourly archive, scrubbable.
 *
 * The canonical series is hourly and is never resampled here. Everything this
 * renders comes from `/api/grid/history/series`, which aggregates through
 * `history-aggregate.ts`, so the rules about peak stamps, excluded rows and
 * coverage live in one place and this file only draws the answer.
 *
 * The single most important line in this component is `connectNulls={false}`.
 * The archive contains a 517-hour outage in January-February 2017 and 22 days
 * with no observation at all; a chart that joins across it would draw a claim no
 * source made. The break is not a styling choice — `isBreak` is exported from
 * the aggregator for exactly this, and the golden tests assert it.
 */

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function TimeMachineTab() {
  const { metric, setMetric, resolution, setResolution, range, setRange, bounds, data, loading, error, unit, summary } = useTimeMachine();

  return (
    <div className="space-y-6 grid-explorer-subpanel">
      <div className="grid-explorer-chart-card card p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">Time Machine</h3>
              <p className="text-sm text-muted-foreground">
                NLDC&rsquo;s hourly archive
                {bounds && <> — {bounds.earliest} to {bounds.latest}</>}. Hours are reported as
                published; days and months are derived from them.
              </p>
            </div>
            <div className="ge-tm-selects flex flex-wrap gap-2">
              <select
                aria-label="Metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-muted/20 border border-border/60 text-foreground"
              >
                {METRICS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <select
                aria-label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as 'day' | 'month')}
                className="px-3 py-2 text-xs rounded-xl bg-muted/20 border border-border/60 text-foreground"
              >
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>

          {/* The scrubber. Two native date inputs rather than a custom slider:
              they are keyboard-accessible, they work with a thumb, and they
              cannot be dragged outside the archive's own bounds. */}
          <div className="ge-tm-dates flex flex-wrap items-center gap-2 text-xs">
            <label className="text-muted-foreground" htmlFor="tm-from">From</label>
            <input
              id="tm-from" type="date" value={range.from}
              min={bounds?.earliest} max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-muted/20 border border-border/60 text-foreground"
            />
            <label className="text-muted-foreground" htmlFor="tm-to">to</label>
            <input
              id="tm-to" type="date" value={range.to}
              min={range.from} max={bounds?.latest}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-muted/20 border border-border/60 text-foreground"
            />
            {loading && <span className="text-muted-foreground">loading…</span>}
          </div>

          {data?.restriction?.restricted && (
            <div className="text-xs rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 text-sky-700 dark:text-sky-400">
              <strong>The archive holds this period.</strong> Your plan reaches back to{' '}
              <strong>{data.restriction.effective.from}</strong>; you asked from{' '}
              {data.restriction.requested.from}. Everything earlier is marked{' '}
              <em>outside your plan</em> rather than missing — ESB has the data, this view does not
              reach it.
            </div>
          )}

          {error && (
            <div className="text-xs rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-destructive">
              {error}
            </div>
          )}

          <div className="ge-tm-chart h-[320px] w-full">
            {data && data.points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.points} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                  <XAxis dataKey="t" tick={{ fontSize: 10 }} minTickGap={28} />
                  <YAxis tick={{ fontSize: 10 }} width={56} tickFormatter={(v) => fmt(Number(v))} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as Point;
                      return (
                        <div className="grid-hover-panel p-3 text-xs bg-card text-card-foreground w-64 max-w-[calc(100vw-48px)]">
                          <div className="font-bold border-b border-border/40 pb-1.5 mb-2">{p.t}</div>
                          {p.state === 'RESTRICTED' ? (
                            <div className="text-sky-700 dark:text-sky-400">
                              <strong>Outside your plan.</strong> ESB holds this period; your plan
                              does not reach it, so it was not queried. This is not a gap in the
                              archive.
                            </div>
                          ) : p.value === null ? (
                            <div className="text-muted-foreground">
                              <strong>Missing.</strong> ESB queried this period and does not hold
                              enough observations for it. Nothing is estimated in its place.
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground inline-flex items-center gap-1">
                                  <GridProvenanceTag kind={p.state === 'REPORTED' ? 'P' : 'D'} />
                                  {p.state === 'REPORTED' ? 'As published' : 'Mean of regular hours'}
                                </span>
                                <span className="font-bold tabular-nums">{fmt(p.value)} {unit}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                                Coverage {p.coverage.observed} of {p.coverage.expected} regular
                                observations{p.coverage.sufficient ? '' : ' — below the floor, so no value is stated'}.
                              </div>
                            </>
                          )}
                          {p.excluded && Object.keys(p.excluded).length > 0 && (
                            <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                              {Object.entries(p.excluded).map(([k, v]) => (
                                <div key={k}>{v} row(s) set aside: {k.replaceAll('_', ' ').toLowerCase()}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {/* connectNulls={false} is the whole point. See the file header. */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={strokeFor(metric)}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">
                {loading ? 'Loading the archive…' : 'No observations in this range.'}
              </div>
            )}
          </div>

          {summary && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>{summary.present} of {summary.total} periods carry a figure</span>
              {summary.missing > 0 && (
                <span className="text-foreground font-medium">
                  {summary.missing} missing from the archive — shown as breaks
                </span>
              )}
              {summary.restricted > 0 && (
                <span className="text-sky-700 dark:text-sky-400 font-medium">
                  {summary.restricted} outside your plan — held, but not queried
                </span>
              )}
              {Object.entries(summary.excluded).map(([k, v]) => (
                <span key={k} className="text-amber-600 dark:text-amber-400">
                  {v} observation(s) excluded: {k.replaceAll('_', ' ').toLowerCase()}
                </span>
              ))}
            </div>
          )}

          <div className="ge-tm-legend flex flex-wrap gap-3 text-[10px]">
            {STATE_LEGEND.map((s) => (
              <span key={s.state} className="inline-flex items-center gap-1.5" title={s.detail}>
                <span
                  aria-hidden
                  className={
                    s.state === 'RESTRICTED'
                      ? 'inline-block w-5 border-t-2 border-dashed border-sky-500/60'
                      : s.state === 'MISSING'
                      ? 'inline-block w-5 border-t-2 border-dashed border-muted-foreground/50'
                      : s.state === 'ESTIMATED'
                        ? 'inline-block w-5 border-t-2 border-dotted border-muted-foreground/40'
                        : 'inline-block w-5 border-t-2 border-primary'
                  }
                />
                <span className="uppercase tracking-wider font-semibold text-muted-foreground">{s.title}</span>
              </span>
            ))}
          </div>

          {/* The legend's explanations live in `title` tooltips, which a phone can
              never show. Same text, folded, phones/tablets only. */}
          <div className="lg:hidden">
            <MobileFold title="What the line styles mean">
              <dl className="ge-tm-defs">
                {STATE_LEGEND.map((s) => (
                  <div key={s.state}>
                    <dt>{s.title}</dt>
                    <dd>{s.detail.replace('on hover', 'when you tap a point')}</dd>
                  </div>
                ))}
              </dl>
            </MobileFold>
          </div>
        </div>

        <GridCardFooter>
          {data && (
            <>
              Aggregation {data.aggregation} · rules {data.rulesVersion} ·{' '}
              {data.sources.map((s) => `${s.publisher} (${s.documents} documents)`).join(', ') || 'no source documents in range'}.
              Hours are reproduced as NLDC published them; daily and monthly figures are calculated
              here from regular hourly observations only, excluding day and evening peak stamps.
            </>
          )}
        </GridCardFooter>
      </div>
    </div>
  );
}
