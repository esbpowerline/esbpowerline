'use client';

/**
 * Published vs Derived — every control total the three agencies print, beside
 * our own recomputation of it from the same document's itemised rows.
 *
 * This is the `GridProvenance` distinction made checkable rather than asserted.
 * Elsewhere on the page a `P` tag says "the source states this" and a `D` tag
 * says "we calculated this". Here both numbers exist for the same quantity, so
 * the reader can see whether a published figure is actually supported by the
 * rows printed underneath it.
 *
 * Three outcomes, and the difference between them matters:
 *
 *   exact      P and D agree to the last printed digit.
 *   rounding   they differ by less than the source's own printing precision can
 *              resolve. A total printed in whole MW cannot be closer to a sum of
 *              nine whole-MW rows than 0.5 x 9. This is not a fudge factor; the
 *              band is computed per check from how many terms were summed and
 *              how many decimals the source prints.
 *   defect     they differ by more than that. The published figure is kept as
 *              published — nothing here is corrected — and the disagreement is
 *              recorded with the arithmetic that shows it.
 *
 * Data: /data/grid-verification/_index.json (small, always loaded) plus one
 * month file fetched on demand.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Scale, ShieldCheck, Sigma } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GridCardFooter,
  GridExplanationBlock,
  GridKpiCell,
  GridKpiStrip,
  GridProvenanceTag,
} from '@/components/news/power-grid/GridExplorerUI';

type Status = 'exact' | 'rounding' | 'fail';

interface CheckRow {
  agency: string;
  check: string;
  published: number | null;
  derived: number | null;
  delta: number | null;
  terms: number | null;
  tolerance: number | null;
  status: Status;
  independent: boolean;
}

interface Defect {
  agency: string;
  kind: string;
  detail?: string | null;
  corroborated_by?: string | null;
}

interface DayDetail {
  date: string;
  agencies: Record<string, { label: string; checks: number; exact: number; rounding: number; failures: number }>;
  checks: CheckRow[];
  /** Every pair recomputed for the day, including those not itemised below. */
  checks_total?: number;
  /** Pairs that agree to the last printed digit and are not
   *  geometry-independent. They are counted but not listed — itemising all of
   *  them across thirteen years is 1.1 million rows. */
  checks_omitted_exact?: number;
  defects: Defect[];
  sources: Record<string, string>;
  headline: {
    pb_gas_production_mmcfd: number | null;
    pgcb_day_peak_mw: number | null;
    pgcb_eve_peak_mw: number | null;
    bpdb_day_peak_mw: number | null;
    bpdb_eve_peak_mw: number | null;
    cross_agency_ok: boolean | null;
  };
  coverage: { pb_words: number | null; pb_words_unassigned: number | null };
}

interface WithheldDay {
  date: string;
  sources: string[];
  disagreements: { source: string; figure: string; a: number | string | null; b: number | string | null; why: string }[];
}

interface MonthFile {
  month: string;
  days: Record<string, DayDetail>;
  totals: Totals;
  dual?: { gated: boolean; note: string; withheld: WithheldDay[] };
}

interface Totals {
  days: number;
  checks: number;
  exact: number;
  rounding: number;
  failures: number;
  defects: number;
  cross_agency_ok: number;
  cross_agency_days: number;
  dual_confirmed_days?: number;
  dual_withheld_days?: number;
}

interface IndexFile {
  generated_at: string;
  provenance: Record<string, string>;
  method: string;
  dual_method?: string;
  months: {
    month: string;
    totals: Totals;
    days: Record<string, { checks: number; failures: number; defects: number; agencies: string[]; cross_agency_ok: boolean | null }>;
    dual?: { gated: boolean; withheld: number };
  }[];
  totals: Totals;
  defect_kinds: Record<string, number>;
}

const DEFECT_LABEL: Record<string, string> = {
  present_exceeds_installed: 'Present capacity printed above installed capacity',
  national_grid_total_lags_one_row: 'National Grid Total column lags one row',
  national_grid_total_corrupt: 'National Grid Total cell holds a corrupt value',
  headline_disagrees_with_plant_table: 'Headline figure disagrees with its own plant table',
  stale_subtotal_carried_forward: "Sub-total carried forward from the previous day",
};

const num = (v: number | null | undefined, dp = 2) =>
  v === null || v === undefined ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: dp });

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, [string, string]> = {
    exact: ['Exact', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'],
    rounding: ['Rounding', 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'],
    fail: ['Defect', 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'],
  };
  const [label, cls] = map[status];
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold', cls)}>
      {label}
    </span>
  );
}

export function PublishedVsDerivedTab({ latestGridDay }: { latestGridDay?: string }) {
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<MonthFile | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [agency, setAgency] = useState<string>('all');
  const [onlyInteresting, setOnlyInteresting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/grid-verification/_index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: IndexFile) => {
        if (!alive) return;
        setIndex(j);
        setMonth(j.months[j.months.length - 1]?.month ?? null);
      })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!month) return;
    let alive = true;
    setMonthData(null);
    fetch(`/data/grid-verification/${month}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: MonthFile) => {
        if (!alive) return;
        setMonthData(j);
        const days = Object.keys(j.days).sort();
        // open on the most interesting day rather than an arbitrary one
        const withDefect = days.find((d) => j.days[d].defects.length > 0);
        setDay(withDefect ?? days[0] ?? null);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [month]);

  const detail = day && monthData ? monthData.days[day] : null;

  const rows = useMemo(() => {
    if (!detail) return [];
    let r = detail.checks;
    if (agency !== 'all') r = r.filter((x) => x.agency === agency);
    if (onlyInteresting) r = r.filter((x) => x.status !== 'exact' || x.independent);
    return r;
  }, [detail, agency, onlyInteresting]);

  const handleMonth = useCallback((m: string) => setMonth(m), []);

  if (loading) {
    return (
      <div className="space-y-6 grid-explorer-subpanel" aria-busy="true">
        <div className="grid-explorer-skeleton h-24 rounded-2xl" />
        <div className="grid-explorer-skeleton h-96 rounded-2xl" />
      </div>
    );
  }
  if (error || !index) {
    return (
      <div className="p-6 text-sm text-muted-foreground border border-border/40 rounded-2xl">
        Verification data is not available. {error}
      </div>
    );
  }

  const t = index.totals;
  const agree = t.exact + t.rounding;
  const agreePct = t.checks ? (agree / t.checks) * 100 : 0;

  // This page went two months stale once without saying so: it claimed coverage
  // to June while the explorer served August. Coverage is therefore stated
  // against the newest day the site actually has, so a gap is visible here
  // rather than inferred by a reader comparing two tabs.
  const coveredThrough = index.months[index.months.length - 1]?.month ?? null;
  const gridMonth = latestGridDay?.slice(0, 7) ?? null;
  const behind = Boolean(coveredThrough && gridMonth && gridMonth > coveredThrough);

  return (
    <div className="space-y-6 grid-explorer-subpanel">
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-3.5 py-2.5 text-[11px] leading-relaxed',
          behind
            ? 'border-amber-500/30 bg-amber-500/[0.07]'
            : 'border-border/40 bg-muted/[0.06]',
        )}
      >
        {behind ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        )}
        <span className="text-muted-foreground">
          <strong className="text-foreground">Checked through {coveredThrough ?? '—'}.</strong>{' '}
          {behind ? (
            <>
              The explorer now carries data to {latestGridDay}, which is past that — so the
              most recent days on this site have <strong className="text-foreground">not
              been through these checks yet</strong>.
            </>
          ) : (
            <>Current with the newest day the explorer carries{latestGridDay ? ` (${latestGridDay})` : ''}.</>
          )}{' '}
          Last run {index.generated_at?.slice(0, 10)}.
        </span>
      </div>
      {/* ── headline ─────────────────────────────────────────────── */}
      <GridKpiStrip>
        <GridKpiCell
          icon={Sigma}
          label="Published totals recomputed"
          value={t.checks.toLocaleString('en-US')}
          provenance="D"
          hint={`${t.days} days, ${index.months.length} months`}
        />
        <GridKpiCell
          icon={CheckCircle2}
          iconClassName="text-emerald-500"
          label="Reproduced from source rows"
          value={`${agreePct.toFixed(2)}%`}
          provenance="D"
          hint={`${t.exact.toLocaleString('en-US')} exact, ${t.rounding.toLocaleString('en-US')} within printing precision`}
        />
        <GridKpiCell
          icon={AlertTriangle}
          iconClassName={t.failures ? 'text-amber-500' : 'text-emerald-500'}
          label="Source defects found"
          value={String(t.defects)}
          provenance="D"
          hint="published figure kept as published"
        />
        <GridKpiCell
          icon={Scale}
          label="PGCB = BPDB peak"
          value={`${t.cross_agency_ok}/${t.cross_agency_days}`}
          provenance="D"
          hint="two agencies, two formats, same day"
        />
        {(t.dual_confirmed_days ?? 0) + (t.dual_withheld_days ?? 0) > 0 && (
          <GridKpiCell
            icon={ShieldCheck}
            iconClassName="text-emerald-500"
            label="Read twice, agreed"
            value={String(t.dual_confirmed_days ?? 0)}
            provenance="D"
            hint={`days confirmed by two independent engines · ${t.dual_withheld_days ?? 0} withheld`}
          />
        )}
      </GridKpiStrip>

      {/* ── what P and D mean here ───────────────────────────────── */}
      <div className="rounded-2xl border border-border/40 bg-muted/5 p-4 text-xs leading-relaxed text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-foreground font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" /> How to read this
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GridProvenanceTag kind="P" /> {index.provenance.P}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GridProvenanceTag kind="D" /> {index.provenance.D}
          </span>
        </div>
        <p>{index.method}</p>
        {index.dual_method && <p className="mt-2">{index.dual_method}</p>}
      </div>

      {/* ── month picker, one row per year ───────────────────────── */}
      <div className="space-y-1.5">
        {Array.from(new Set(index.months.map((m) => m.month.slice(0, 4))))
          .sort()
          .map((year) => (
            <div key={year} className="flex flex-wrap items-center gap-1.5">
              <span className="w-9 shrink-0 text-[11px] font-bold text-muted-foreground tabular-nums">
                {year}
              </span>
              {index.months
                .filter((m) => m.month.startsWith(year))
                .map((m) => {
                  const active = m.month === month;
                  const bad = m.totals.defects > 0;
                  return (
                    <button
                      key={m.month}
                      type="button"
                      onClick={() => handleMonth(m.month)}
                      title={m.dual?.gated
                        ? `Dual-parse gated: every day read twice by independent engines${m.dual.withheld ? `, ${m.dual.withheld} day${m.dual.withheld === 1 ? '' : 's'} withheld` : ''}`
                        : undefined}
                      className={cn(
                        'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150',
                        active
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-transparent text-muted-foreground border-border/40 hover:text-foreground',
                      )}
                    >
                      {m.month.slice(5)}
                      {m.dual?.gated && (
                        <ShieldCheck className="inline-block h-3 w-3 ml-1 -mt-0.5 text-emerald-500" />
                      )}
                      <span className="ml-1.5 opacity-70">
                        {m.totals.checks.toLocaleString('en-US')}
                      </span>
                      {bad && <span className="ml-1 text-amber-500">•</span>}
                    </button>
                  );
                })}
            </div>
          ))}
      </div>

      {/* ── day strip ────────────────────────────────────────────── */}
      {monthData && (
        <div className="rounded-2xl border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-3 flex-wrap">
            <h4 className="text-sm font-semibold">{monthData.month} — operating days</h4>
            <p className="text-[11px] text-muted-foreground">
              {monthData.totals.checks.toLocaleString('en-US')} P/D pairs ·{' '}
              {monthData.totals.failures} beyond rounding · {monthData.totals.defects} defects
            </p>
          </div>
          <div className="p-3 flex flex-wrap gap-1">
            {Object.keys(monthData.days)
              .sort()
              .map((d) => {
                const dd = monthData.days[d];
                const active = d === day;
                const bad = dd.defects.length > 0;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    title={`${d} — ${dd.checks.length} pairs, ${dd.defects.length} defects`}
                    className={cn(
                      'w-9 h-9 text-[11px] font-semibold rounded-lg border transition-all',
                      active
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : bad
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                          : 'bg-transparent text-muted-foreground border-border/30 hover:text-foreground',
                    )}
                  >
                    {d.slice(-2)}
                  </button>
                );
              })}
          </div>

          {/* dual-parse gate: what this month's figures were read by, and
              which days did not clear it */}
          {monthData.dual?.gated && (
            <div className="px-4 py-3 border-t border-border/40 bg-emerald-500/5 text-[11px] leading-relaxed">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Dual-parse gated
              </span>{' '}
              <span className="text-muted-foreground">{monthData.dual.note}</span>
              {monthData.dual.withheld.length > 0 && (
                <div className="mt-2 space-y-2">
                  {monthData.dual.withheld.map((w) => (
                    <div key={w.date} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        {w.date} withheld
                      </span>{' '}
                      <span className="text-muted-foreground">
                        — engines disagreed on {w.disagreements.length}{' '}
                        figure{w.disagreements.length === 1 ? '' : 's'} ({w.sources.join(', ')})
                      </span>
                      {w.disagreements.slice(0, 4).map((g, i) => (
                        <p key={i} className="text-muted-foreground mt-0.5 tabular-nums">
                          {g.source} · {g.figure}: {String(g.a ?? '—')} vs {String(g.b ?? '—')} — {g.why}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── the day ──────────────────────────────────────────────── */}
      {detail && (
        <div className="rounded-2xl border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h4 className="text-sm font-semibold">{detail.date}</h4>
              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {Object.entries(detail.agencies).map(([k, v]) => (
                  <span key={k}>
                    {v.label} <span className="font-semibold text-foreground">{v.checks}</span>
                    {v.failures > 0 && <span className="text-amber-500"> · {v.failures} defect</span>}
                  </span>
                ))}
              </div>
            </div>
            {detail.coverage.pb_words !== null && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Petrobangla page coverage:{' '}
                <span className="text-foreground font-medium">
                  {detail.coverage.pb_words!.toLocaleString('en-US')} of{' '}
                  {detail.coverage.pb_words!.toLocaleString('en-US')} words
                </span>{' '}
                assigned to a named block — nothing on the page is unaccounted for.
              </p>
            )}
          </div>

          {/* defects first: they are the reason this view exists */}
          {detail.defects.length > 0 && (
            <div className="px-4 py-3 border-b border-border/40 bg-amber-500/5 space-y-2">
              {detail.defects.map((d, i) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {DEFECT_LABEL[d.kind] ?? d.kind}
                  </span>
                  <span className="text-muted-foreground"> — {d.agency}</span>
                  {d.detail && <p className="text-muted-foreground mt-0.5">{d.detail}</p>}
                  {d.corroborated_by && (
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      Corroborated by: {d.corroborated_by}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* filters */}
          <div className="px-4 py-2 border-b border-border/40 flex flex-wrap items-center gap-2">
            {['all', ...Object.keys(detail.agencies)].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAgency(a)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all',
                  agency === a
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-muted-foreground border-border/30 hover:text-foreground',
                )}
              >
                {a === 'all' ? 'All' : detail.agencies[a]?.label ?? a}
              </button>
            ))}
            <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInteresting}
                onChange={(e) => setOnlyInteresting(e.target.checked)}
                className="accent-primary"
              />
              Hide pairs that agree exactly
            </label>
          </div>
          {!onlyInteresting && (detail.checks_omitted_exact ?? 0) > 0 && (
            <p className="px-4 pb-2 text-[11px] text-muted-foreground">
              {detail.checks_omitted_exact!.toLocaleString('en-US')} of this
              day&rsquo;s {detail.checks_total!.toLocaleString('en-US')} pairs agree to the
              last printed digit and are counted but not listed individually — the
              itemised rows below are every disagreement, every pair inside the rounding
              band, and every geometry-independent check.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="text-left font-semibold px-4 py-2">Quantity</th>
                  <th className="text-right font-semibold px-3 py-2">
                    Published <GridProvenanceTag kind="P" />
                  </th>
                  <th className="text-right font-semibold px-3 py-2">
                    Derived <GridProvenanceTag kind="D" />
                  </th>
                  <th className="text-right font-semibold px-3 py-2">Δ</th>
                  <th className="text-right font-semibold px-3 py-2">Terms</th>
                  <th className="text-left font-semibold px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border/20">
                    <td className="px-4 py-1.5">
                      {r.check}
                      {r.independent && (
                        <span
                          className="ml-1.5 text-[9px] font-semibold text-sky-600 dark:text-sky-400"
                          title="The two sides come from different parts of the document, so this check can fail for reasons other than arithmetic."
                        >
                          INDEPENDENT
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{num(r.published)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{num(r.derived)}</td>
                    <td
                      className={cn(
                        'px-3 py-1.5 text-right tabular-nums',
                        r.status === 'fail' && 'text-red-600 dark:text-red-400 font-semibold',
                      )}
                    >
                      {num(r.delta, 3)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                      {r.terms ?? '—'}
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Every pair on this day agrees exactly. Untick the filter to see all{' '}
                      {detail.checks.length.toLocaleString('en-US')}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <GridExplanationBlock
            what={
              <>
                Each row is one figure the agency prints (<GridProvenanceTag kind="P" />) beside our
                recomputation of it from the itemised rows the same document prints above that total
                (<GridProvenanceTag kind="D" />). Rows marked <strong>INDEPENDENT</strong> compare
                two different parts of the document — or two different agencies — rather than a
                total against its own components, so they can catch an error that internally
                consistent arithmetic cannot.
              </>
            }
            insight={
              <>
                A published total that its own rows reproduce is corroborated. Where the two
                disagree by more than the source&apos;s printing precision allows, the published
                figure is left exactly as published and the disagreement is recorded — this pipeline
                never edits a source.
              </>
            }
          />

          <GridCardFooter>
            <span>
              Source: Petrobangla, PGCB (NLDC) and BPDB daily operational reports as published.
            </span>
            <span>Audited by: no third party — these are arithmetic checks against the documents themselves.</span>
            <span className="font-medium">Generated {index.generated_at.slice(0, 10)}</span>
          </GridCardFooter>
        </div>
      )}
    </div>
  );
}

export default PublishedVsDerivedTab;
