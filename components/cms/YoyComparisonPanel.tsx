'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { AlertTriangle, Archive, Check, Copy, Download, Loader2 } from 'lucide-react';
import { CmsCard, CmsFilterTabs } from '@/components/cms/CmsUI';
import { cn } from '@/lib/utils';
import { useTablePager, GridTablePager } from '@/components/news/power-grid/GridExplorerUI';
import {
  generateYoySheet,
  runBulkYoySheets,
  runComparison,
  runMonthlyComparison,
  runMonthlySeries,
  runRangeSeries,
} from '@/lib/actions/yoy-comparison';
import type {
  BulkYoyPayload,
  ComparisonPayload,
  MonthlyComparisonPayload,
  MonthlySeriesPayload,
  RangeSeriesPayload,
  YoyBootstrap,
} from '@/lib/actions/yoy-comparison';
import type { YoyResult } from '@/lib/data/grid/yoy-comparison';

/**
 * Four ways to read the archive, on one page: the published year-on-year
 * sheet, a free comparison of any two days, a range export, and the same free
 * comparison over PGCB's monthly reports.
 *
 * The rule the engine enforces and this panel must not undo: **null is never
 * zero.** An unpublished figure shows as `—` with the reason beside it, and no
 * percentage is offered for it. Nothing here fills a gap with a 0.
 */

type Mode = 'sheet' | 'compare' | 'range' | 'months';

/** Taken off the bootstrap rather than imported: the engine is `server-only`. */
type SectionId = YoyBootstrap['sections'][number]['id'];
type MonthlySectionId = YoyBootstrap['monthlySections'][number]['id'];

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'sheet', label: 'Year-on-year sheet' },
  { id: 'compare', label: 'Compare two days' },
  { id: 'range', label: 'Range export' },
  { id: 'months', label: 'Compare months' },
];

/* ── shared bits ─────────────────────────────────────────────────────────── */

function download(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** One day earlier by a year, so the compare tab opens on something sensible. */
function priorYearIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  // 29 February falls back to the 28th, the same way the sheet does.
  if (m[2] === '02' && m[3] === '29') return `${Number(m[1]) - 1}-02-28`;
  return `${Number(m[1]) - 1}-${m[2]}-${m[3]}`;
}

/** The same month a year earlier, so the month tab opens on something sensible. */
function priorYearMonth(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return key;
  return `${Number(m[1]) - 1}-${m[2]}`;
}

/** How many months `start`..`end` spans, inclusive, or null if end precedes start. */
function monthsBetween(start: string, end: string): number | null {
  const a = /^(\d{4})-(\d{2})$/.exec(start);
  const b = /^(\d{4})-(\d{2})$/.exec(end);
  if (!a || !b) return null;
  const from = Number(a[1]) * 12 + Number(a[2]) - 1;
  const to = Number(b[1]) * 12 + Number(b[2]) - 1;
  if (to < from) return null;
  return to - from + 1;
}

function shiftIso(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number | null {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

/** `—` for anything unpublished; never a 0 standing in for a missing figure. */
function fmt(v: number | null): string {
  if (v === null) return '—';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40';
const btnGhost =
  'inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-semibold transition hover:bg-muted/60 disabled:opacity-40';
const inputCls = 'rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px]';

function Notice({ tone, children }: { tone: 'warn' | 'info'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border p-3 text-[12px]',
        tone === 'warn'
          ? 'border-amber-500/40 bg-amber-500/[0.07] text-amber-700 dark:text-amber-400'
          : 'border-border/60 bg-muted/40 text-muted-foreground',
      )}
    >
      {tone === 'warn' && <AlertTriangle className="mt-[1px] h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

function CopyButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
      className={btnPrimary}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/**
 * Writes the file into the W: archive folder through the CMS route. That route
 * is local-only, so a 503 is an ordinary outcome on a deployed instance and is
 * shown as it comes back rather than dressed up as a failure.
 */
function SaveToArchive({ filename, text, disabled }: { filename: string; text: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ tone: 'ok' | 'warn'; message: string } | null>(null);

  async function save() {
    setBusy(true);
    setState(null);
    try {
      const res = await fetch('/api/cms/yoy-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, text }),
      });
      const raw = await res.text();
      let message = raw.trim();
      try {
        const parsed = JSON.parse(raw) as { message?: string; error?: string; path?: string };
        message = parsed.message ?? parsed.error ?? parsed.path ?? message;
      } catch {
        // Not JSON — an HTML error page means the route is not there at all.
        if (message.startsWith('<')) message = `Archive route returned ${res.status} ${res.statusText}.`;
      }
      setState({ tone: res.ok ? 'ok' : 'warn', message: message || `Saved ${filename}` });
    } catch (e) {
      setState({ tone: 'warn', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={save} disabled={disabled || busy} className={btnGhost}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
        Save to archive folder
      </button>
      {state && (
        <span
          className={cn(
            'pb-2 text-[12px]',
            state.tone === 'ok' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
          )}
        >
          {state.message}
        </span>
      )}
    </>
  );
}

/* ── mode 1: the published year-on-year sheet ────────────────────────────── */

function SheetMode({ bootstrap }: { bootstrap: YoyBootstrap }) {
  const [date, setDate] = useState(bootstrap.latestDate ?? '');
  const [result, setResult] = useState<YoyResult | null>(bootstrap.initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate(next: string) {
    setDate(next);
    setError(null);
    if (!next) return;
    startTransition(async () => {
      try {
        setResult(await generateYoySheet(next));
      } catch (e) {
        setResult(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-muted-foreground">
        The same day one year apart, in the fixed format the desk publishes. Grid and gas are both
        read from the chosen energy day — Petrobangla files the 08:00–08:00 window under the
        following date, so a day is only ready once that report has landed.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="yoy-date">
            Energy day
          </label>
          <input
            id="yoy-date"
            type="date"
            value={date}
            min={bootstrap.earliestDate ?? undefined}
            max={bootstrap.newestArchiveDate ?? undefined}
            onChange={(e) => generate(e.target.value)}
            className={inputCls}
          />
        </div>
        <CopyButton text={result?.ok ? result.text : ''} disabled={!result?.ok || pending} />
        <button
          type="button"
          onClick={() => result?.ok && download(result.filename, result.text)}
          disabled={!result?.ok || pending}
          className={btnGhost}
        >
          <Download className="h-4 w-4" />
          Download .txt
        </button>
        <SaveToArchive
          filename={result?.ok ? result.filename : ''}
          text={result?.ok ? result.text : ''}
          disabled={!result?.ok || pending}
        />
        {pending && (
          <span className="inline-flex items-center gap-1.5 pb-2 text-[12px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building…
          </span>
        )}
      </div>

      {(error || (result && !result.ok)) && (
        <Notice tone="warn">{error ?? (result && !result.ok ? result.reason : '')}</Notice>
      )}

      {result?.ok && (
        <>
          <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-4 text-[12px] leading-[1.65] font-mono whitespace-pre">
            {result.text}
          </pre>
          <p className="text-[11.5px] text-muted-foreground">{result.filename}</p>
        </>
      )}

      {!result && !error && (
        <p className="text-[12px] text-muted-foreground">No day in the archive can produce a sheet yet.</p>
      )}
    </div>
  );
}

/* ── mode 2: any two days ────────────────────────────────────────────────── */

function CompareMode({ bootstrap }: { bootstrap: YoyBootstrap }) {
  const anchor = bootstrap.latestDate ?? bootstrap.newestArchiveDate ?? '';
  const [bDate, setBDate] = useState(anchor);
  const [aDate, setADate] = useState(anchor ? priorYearIso(anchor) : '');
  const [sections, setSections] = useState<SectionId[]>(bootstrap.sections.map((s) => s.id));
  const [metricIds, setMetricIds] = useState<string[]>([]);
  const [payload, setPayload] = useState<ComparisonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Every run is stamped; a slower earlier request must not overwrite a newer
  // result when the editor is clicking through sections quickly.
  const runId = useRef(0);

  useEffect(() => {
    if (!aDate || !bDate) return;
    const id = ++runId.current;
    setError(null);
    startTransition(async () => {
      try {
        const next = await runComparison(aDate, bDate, sections, metricIds);
        if (id === runId.current) setPayload(next);
      } catch (e) {
        if (id === runId.current) {
          setPayload(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    });
  }, [aDate, bDate, sections, metricIds]);

  const ok = payload?.ok ? payload : null;
  // Hooks cannot sit behind the `ok` guard below, so the pager is always
  // constructed and simply pages an empty list until a comparison arrives.
  const pager = useTablePager(ok?.rows ?? [], 25);
  const stem = `Grid_Compare_${aDate}_vs_${bDate}`;

  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ id: string; label: string }>>();
    for (const m of ok?.available ?? []) {
      const list = map.get(m.section) ?? [];
      list.push({ id: m.id, label: m.label });
      map.set(m.section, list);
    }
    return map;
  }, [ok]);

  const toggleSection = useCallback((id: SectionId) => {
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    // Metric picks belong to the old section set; drop them rather than let a
    // stale id silently empty the table. Kept identical when already empty so
    // the run below is not triggered twice.
    setMetricIds((prev) => (prev.length ? [] : prev));
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        Any two archived days, side by side — no year-apart constraint. A figure a day did not
        publish shows as <span className="font-mono">—</span> with the reason beside it, and gets no
        percentage; it is never read as zero.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="cmp-a">
            First day
          </label>
          <input
            id="cmp-a"
            type="date"
            value={aDate}
            min={bootstrap.earliestDate ?? undefined}
            max={bootstrap.newestArchiveDate ?? undefined}
            onChange={(e) => setADate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="cmp-b">
            Second day
          </label>
          <input
            id="cmp-b"
            type="date"
            value={bDate}
            min={bootstrap.earliestDate ?? undefined}
            max={bootstrap.newestArchiveDate ?? undefined}
            onChange={(e) => setBDate(e.target.value)}
            className={inputCls}
          />
        </div>
        {pending && (
          <span className="inline-flex items-center gap-1.5 pb-2 text-[12px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Comparing…
          </span>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold">Sections</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {bootstrap.sections.map((s) => (
            <label key={s.id} className="inline-flex items-center gap-2 text-[12px]" title={s.description}>
              <input
                type="checkbox"
                checked={sections.includes(s.id)}
                onChange={() => toggleSection(s.id)}
                className="h-3.5 w-3.5"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {error && <Notice tone="warn">{error}</Notice>}
      {payload && !payload.ok && <Notice tone="warn">{payload.error}</Notice>}

      {ok && (
        <>
          <div className="rounded-lg border border-border/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-semibold">
                Metrics {metricIds.length ? `(${metricIds.length} of ${ok.available.length})` : `(all ${ok.available.length})`}
              </p>
              <button
                type="button"
                onClick={() => setMetricIds([])}
                disabled={!metricIds.length}
                className="text-[12px] font-semibold text-emerald-700 disabled:opacity-40 dark:text-emerald-400"
              >
                Show all
              </button>
            </div>
            <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
              {bootstrap.sections
                .filter((s) => grouped.has(s.id))
                .map((s) => (
                  <div key={s.id}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </p>
                    <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                      {(grouped.get(s.id) ?? []).map((m) => (
                        <label key={m.id} className="inline-flex items-center gap-2 text-[12px]">
                          <input
                            type="checkbox"
                            // No picks at all means "everything", so an untouched
                            // list still reads as fully ticked.
                            checked={metricIds.length === 0 || metricIds.includes(m.id)}
                            onChange={() =>
                              setMetricIds((prev) => {
                                const base = prev.length ? prev : ok.available.map((x) => x.id);
                                const next = base.includes(m.id)
                                  ? base.filter((x) => x !== m.id)
                                  : [...base, m.id];
                                return next.length === ok.available.length ? [] : next;
                              })
                            }
                            className="h-3.5 w-3.5"
                          />
                          <span className="truncate">{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <CopyButton text={ok.text} disabled={pending} />
            <button type="button" onClick={() => download(`${stem}.txt`, ok.text)} className={btnGhost}>
              <Download className="h-4 w-4" /> Download .txt
            </button>
            <button
              type="button"
              onClick={() => download(`${stem}.csv`, ok.csv, 'text/csv;charset=utf-8')}
              className={btnGhost}
            >
              <Download className="h-4 w-4" /> Download .csv
            </button>
            <button
              type="button"
              onClick={() => download(`${stem}.json`, ok.json, 'application/json;charset=utf-8')}
              className={btnGhost}
            >
              <Download className="h-4 w-4" /> Download .json
            </button>
            <SaveToArchive filename={`${stem}.txt`} text={ok.text} disabled={pending} />
          </div>

          {ok.notes.map((n) => (
            <Notice key={n} tone="warn">
              {n}
            </Notice>
          ))}

          {ok.unpublished > 0 && (
            <Notice tone="info">
              {ok.unpublished} row{ok.unpublished === 1 ? '' : 's'} could not be compared — the reason is
              printed against each one. A blank there means the report did not carry the figure, not that
              it was zero.
            </Notice>
          )}

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-[12px]">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Metric</th>
                  <th className="px-3 py-2 font-semibold">Unit</th>
                  <th className="px-3 py-2 text-right font-semibold">{ok.a}</th>
                  <th className="px-3 py-2 text-right font-semibold">{ok.b}</th>
                  <th className="px-3 py-2 text-right font-semibold">Change</th>
                  <th className="px-3 py-2 text-right font-semibold">Change %</th>
                  <th className="px-3 py-2 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {pager.rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-3 py-1.5">{r.label}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{r.unit}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt(r.a)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt(r.b)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {r.delta === null ? '—' : `${r.delta >= 0 ? '+' : ''}${fmt(r.delta)}`}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-1.5 text-right tabular-nums',
                        r.pct !== null && (r.pct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'),
                      )}
                    >
                      {r.pct === null ? '—' : `${r.pct >= 0 ? '▲' : '▼'} ${Math.abs(r.pct).toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-1.5 text-[11.5px] text-muted-foreground">{r.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* A full comparison is ~230 rows. The explorer already settled on one
              pager for every long list, so this uses that rather than growing a
              second set of controls that behave slightly differently. */}
          <GridTablePager
            page={pager.page}
            totalPages={pager.totalPages}
            pageSize={pager.pageSize}
            total={pager.total}
            from={pager.from}
            to={pager.to}
            onPage={pager.setPage}
            onPageSize={pager.setPageSize}
            noun="rows"
          />

          <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-4 text-[12px] leading-[1.65] font-mono whitespace-pre">
            {ok.text}
          </pre>
        </>
      )}
    </div>
  );
}

/* ── mode 3: ranges ──────────────────────────────────────────────────────── */

function RangeMode({ bootstrap }: { bootstrap: YoyBootstrap }) {
  const end0 = bootstrap.newestArchiveDate ?? '';
  const [start, setStart] = useState(end0 ? shiftIso(end0, -29) : '');
  const [end, setEnd] = useState(end0);
  const [metricIds, setMetricIds] = useState<string[]>([]);
  const [series, setSeries] = useState<RangeSeriesPayload | null>(null);
  const [bulk, setBulk] = useState<BulkYoyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const span = daysBetween(start, end);
  const tooLong = span !== null && span > bootstrap.maxRangeDays;
  const seriesOk = series?.ok ? series : null;
  const bulkOk = bulk?.ok ? bulk : null;
  const stem = `Grid_Series_${start}_to_${end}`;

  function build(nextMetricIds: string[]) {
    setMetricIds(nextMetricIds);
    setError(null);
    setBulk(null);
    startTransition(async () => {
      try {
        setSeries(await runRangeSeries(start, end, nextMetricIds));
      } catch (e) {
        setSeries(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function buildBulk() {
    setError(null);
    startTransition(async () => {
      try {
        setBulk(await runBulkYoySheets(start, end));
      } catch (e) {
        setBulk(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        A whole stretch of days at once: metrics down the rows, dates across the columns. Days the
        archive does not hold keep their column and leave it blank — a gap in the record, not a zero.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="rng-start">
            Start
          </label>
          <input
            id="rng-start"
            type="date"
            value={start}
            min={bootstrap.earliestDate ?? undefined}
            max={bootstrap.newestArchiveDate ?? undefined}
            onChange={(e) => setStart(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="rng-end">
            End
          </label>
          <input
            id="rng-end"
            type="date"
            value={end}
            min={bootstrap.earliestDate ?? undefined}
            max={bootstrap.newestArchiveDate ?? undefined}
            onChange={(e) => setEnd(e.target.value)}
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={() => build(metricIds)}
          disabled={!start || !end || span === null || tooLong || pending}
          className={btnPrimary}
        >
          Build range
        </button>
        <button
          type="button"
          onClick={buildBulk}
          disabled={!start || !end || span === null || tooLong || pending}
          className={btnGhost}
        >
          Bulk year-on-year sheets
        </button>
        {pending && (
          <span className="inline-flex items-center gap-1.5 pb-2 text-[12px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the archive…
          </span>
        )}
      </div>

      {span === null ? (
        <Notice tone="warn">Pick a start on or before the end date.</Notice>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          {span} day{span === 1 ? '' : 's'} selected.
        </p>
      )}
      {tooLong && (
        <Notice tone="warn">
          That is longer than {bootstrap.maxRangeDays} days, which is as much as this export will read
          in one go. Narrow the range and try again.
        </Notice>
      )}

      {error && <Notice tone="warn">{error}</Notice>}
      {series && !series.ok && <Notice tone="warn">{series.error}</Notice>}
      {bulk && !bulk.ok && <Notice tone="warn">{bulk.error}</Notice>}

      {seriesOk && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => download(`${stem}.csv`, seriesOk.csv, 'text/csv;charset=utf-8')}
              className={btnGhost}
            >
              <Download className="h-4 w-4" /> Download .csv
            </button>
            <span className="pb-2 text-[12px] text-muted-foreground">
              {seriesOk.metricCount} metric{seriesOk.metricCount === 1 ? '' : 's'} × {seriesOk.dates.length}{' '}
              day{seriesOk.dates.length === 1 ? '' : 's'}
            </span>
          </div>

          {seriesOk.missing.length > 0 && (
            <Notice tone="warn">
              {seriesOk.missing.length} of {seriesOk.dates.length} days are not in the archive, so their
              columns are blank throughout: {seriesOk.missing.slice(0, 12).join(', ')}
              {seriesOk.missing.length > 12 ? ` … and ${seriesOk.missing.length - 12} more` : ''}.
            </Notice>
          )}

          <div className="rounded-lg border border-border/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-semibold">
                Metrics{' '}
                {metricIds.length ? `(${metricIds.length} of ${seriesOk.available.length})` : `(all ${seriesOk.available.length})`}
              </p>
              <button
                type="button"
                onClick={() => build([])}
                disabled={!metricIds.length || pending}
                className="text-[12px] font-semibold text-emerald-700 disabled:opacity-40 dark:text-emerald-400"
              >
                Show all
              </button>
            </div>
            <div className="grid max-h-56 gap-x-4 gap-y-1 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {seriesOk.available.map((m) => (
                <label key={m.id} className="inline-flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={metricIds.length === 0 || metricIds.includes(m.id)}
                    onChange={() => {
                      const base = metricIds.length ? metricIds : seriesOk.available.map((x) => x.id);
                      const next = base.includes(m.id) ? base.filter((x) => x !== m.id) : [...base, m.id];
                      build(next.length === seriesOk.available.length ? [] : next);
                    }}
                    className="h-3.5 w-3.5"
                  />
                  <span className="truncate">
                    {m.label} <span className="text-muted-foreground">({m.unit})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {bulkOk && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => download(`Grid_YoY_Sheets_${start}_to_${end}.txt`, bulkOk.text)}
              className={btnGhost}
            >
              <Download className="h-4 w-4" /> Download {bulkOk.built.length} sheet
              {bulkOk.built.length === 1 ? '' : 's'} (.txt)
            </button>
            <SaveToArchive
              filename={`Grid_YoY_Sheets_${start}_to_${end}.txt`}
              text={bulkOk.text}
              disabled={pending}
            />
          </div>

          {bulkOk.skipped.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/[0.07] p-3 text-[12px] text-amber-700 dark:text-amber-400">
              <p className="font-semibold">
                {bulkOk.skipped.length} day{bulkOk.skipped.length === 1 ? '' : 's'} in the range could not
                produce a sheet:
              </p>
              <ul className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto">
                {bulkOk.skipped.map((s) => (
                  <li key={s.date}>
                    <span className="font-mono">{s.date}</span> — {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── mode 4: any two months ──────────────────────────────────────────────── */

type MonthView = 'compare' | 'range';

function MonthsMode({ bootstrap }: { bootstrap: YoyBootstrap }) {
  const newest = bootstrap.months[0] ?? '';
  const oldest = bootstrap.months[bootstrap.months.length - 1] ?? '';
  const archived = useMemo(() => new Set(bootstrap.months), [bootstrap.months]);

  const [view, setView] = useState<MonthView>('compare');

  const [bMonth, setBMonth] = useState(newest);
  const [aMonth, setAMonth] = useState(newest ? priorYearMonth(newest) : '');
  const [sections, setSections] = useState<MonthlySectionId[]>(
    bootstrap.monthlySections.map((s) => s.id),
  );
  const [metricIds, setMetricIds] = useState<string[]>([]);
  const [payload, setPayload] = useState<MonthlyComparisonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Same stamping as the daily compare: a slower earlier request must not
  // overwrite a newer result.
  const runId = useRef(0);

  useEffect(() => {
    if (view !== 'compare' || !aMonth || !bMonth) return;
    const id = ++runId.current;
    setError(null);
    startTransition(async () => {
      try {
        const next = await runMonthlyComparison(aMonth, bMonth, sections, metricIds);
        if (id === runId.current) setPayload(next);
      } catch (e) {
        if (id === runId.current) {
          setPayload(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    });
  }, [view, aMonth, bMonth, sections, metricIds]);

  const ok = payload?.ok ? payload : null;
  // Hooks cannot sit behind the `ok` guard, so the pager is always constructed
  // and pages an empty list until a comparison arrives. A full monthly
  // comparison is ~471 rows — substations alone are 203 — so it earns its keep.
  const pager = useTablePager(ok?.rows ?? [], 25);
  const stem = `Grid_Compare_Months_${aMonth}_vs_${bMonth}`;

  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ id: string; label: string }>>();
    for (const m of ok?.available ?? []) {
      const list = map.get(m.section) ?? [];
      list.push({ id: m.id, label: m.label });
      map.set(m.section, list);
    }
    return map;
  }, [ok]);

  const toggleSection = useCallback((id: MonthlySectionId) => {
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    setMetricIds((prev) => (prev.length ? [] : prev));
  }, []);

  /* range state */
  const [rStart, setRStart] = useState(newest ? priorYearMonth(newest) : '');
  const [rEnd, setREnd] = useState(newest);
  const [rMetricIds, setRMetricIds] = useState<string[]>([]);
  const [series, setSeries] = useState<MonthlySeriesPayload | null>(null);

  const span = monthsBetween(rStart, rEnd);
  const seriesOk = series?.ok ? series : null;
  const rangeStem = `Grid_Series_Months_${rStart}_to_${rEnd}`;

  function buildSeries(nextMetricIds: string[]) {
    setRMetricIds(nextMetricIds);
    setError(null);
    startTransition(async () => {
      try {
        setSeries(await runMonthlySeries(rStart, rEnd, nextMetricIds));
      } catch (e) {
        setSeries(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  const unarchived = [aMonth, bMonth].filter((m) => m && !archived.has(m));

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        PGCB&rsquo;s monthly reports, side by side — a different document from the daily one, with
        substation max loads, interruption counts and unserved energy the daily report never carries.
        A figure a month did not publish shows as <span className="font-mono">—</span> with the reason
        beside it; it is never read as zero.
      </p>

      <CmsFilterTabs>
        <button
          type="button"
          onClick={() => setView('compare')}
          className={cn('admin-filter-tab', view === 'compare' && 'admin-filter-tab--active')}
        >
          Compare two months
        </button>
        <button
          type="button"
          onClick={() => setView('range')}
          className={cn('admin-filter-tab', view === 'range' && 'admin-filter-tab--active')}
        >
          Range export
        </button>
      </CmsFilterTabs>

      {!bootstrap.months.length && (
        <Notice tone="warn">No monthly report is archived, so there is nothing to compare.</Notice>
      )}

      {view === 'compare' && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="mth-a">
                First month
              </label>
              <input
                id="mth-a"
                type="month"
                value={aMonth}
                min={oldest || undefined}
                max={newest || undefined}
                onChange={(e) => setAMonth(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="mth-b">
                Second month
              </label>
              <input
                id="mth-b"
                type="month"
                value={bMonth}
                min={oldest || undefined}
                max={newest || undefined}
                onChange={(e) => setBMonth(e.target.value)}
                className={inputCls}
              />
            </div>
            <span className="pb-2 text-[12px] text-muted-foreground">
              {bootstrap.months.length} month{bootstrap.months.length === 1 ? '' : 's'} archived
              {oldest && newest ? `, ${oldest} to ${newest}` : ''}.
            </span>
            {pending && (
              <span className="inline-flex items-center gap-1.5 pb-2 text-[12px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Comparing…
              </span>
            )}
          </div>

          {/* The engine has the final say — this only says so sooner. */}
          {unarchived.length > 0 && (
            <Notice tone="warn">
              Not in the archive: {unarchived.join(', ')}. Pick a month that has a report.
            </Notice>
          )}

          <div>
            <p className="mb-1.5 text-[12px] font-semibold">Sections</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {bootstrap.monthlySections.map((s) => (
                <label
                  key={s.id}
                  className="inline-flex items-center gap-2 text-[12px]"
                  title={s.description}
                >
                  <input
                    type="checkbox"
                    checked={sections.includes(s.id)}
                    onChange={() => toggleSection(s.id)}
                    className="h-3.5 w-3.5"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {error && <Notice tone="warn">{error}</Notice>}
          {payload && !payload.ok && <Notice tone="warn">{payload.error}</Notice>}

          {ok && (
            <>
              <div className="rounded-lg border border-border/60 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold">
                    Metrics{' '}
                    {metricIds.length
                      ? `(${metricIds.length} of ${ok.available.length})`
                      : `(all ${ok.available.length})`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMetricIds([])}
                    disabled={!metricIds.length}
                    className="text-[12px] font-semibold text-emerald-700 disabled:opacity-40 dark:text-emerald-400"
                  >
                    Show all
                  </button>
                </div>
                <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                  {bootstrap.monthlySections
                    .filter((s) => grouped.has(s.id))
                    .map((s) => (
                      <div key={s.id}>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {s.label}
                        </p>
                        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                          {(grouped.get(s.id) ?? []).map((m) => (
                            <label key={m.id} className="inline-flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={metricIds.length === 0 || metricIds.includes(m.id)}
                                onChange={() =>
                                  setMetricIds((prev) => {
                                    const base = prev.length ? prev : ok.available.map((x) => x.id);
                                    const next = base.includes(m.id)
                                      ? base.filter((x) => x !== m.id)
                                      : [...base, m.id];
                                    return next.length === ok.available.length ? [] : next;
                                  })
                                }
                                className="h-3.5 w-3.5"
                              />
                              <span className="truncate">{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <CopyButton text={ok.text} disabled={pending} />
                <button type="button" onClick={() => download(`${stem}.txt`, ok.text)} className={btnGhost}>
                  <Download className="h-4 w-4" /> Download .txt
                </button>
                <button
                  type="button"
                  onClick={() => download(`${stem}.csv`, ok.csv, 'text/csv;charset=utf-8')}
                  className={btnGhost}
                >
                  <Download className="h-4 w-4" /> Download .csv
                </button>
                <button
                  type="button"
                  onClick={() => download(`${stem}.json`, ok.json, 'application/json;charset=utf-8')}
                  className={btnGhost}
                >
                  <Download className="h-4 w-4" /> Download .json
                </button>
                <SaveToArchive filename={`${stem}.txt`} text={ok.text} disabled={pending} />
              </div>

              {ok.notes.map((n) => (
                <Notice key={n} tone="warn">
                  {n}
                </Notice>
              ))}

              {ok.unpublished > 0 && (
                <Notice tone="info">
                  {ok.unpublished} row{ok.unpublished === 1 ? '' : 's'} could not be compared — the
                  reason is printed against each one. A blank there means the report did not carry the
                  figure, not that it was zero.
                </Notice>
              )}

              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-[12px]">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Metric</th>
                      <th className="px-3 py-2 font-semibold">Unit</th>
                      <th className="px-3 py-2 text-right font-semibold">{ok.a}</th>
                      <th className="px-3 py-2 text-right font-semibold">{ok.b}</th>
                      <th className="px-3 py-2 text-right font-semibold">Change</th>
                      <th className="px-3 py-2 text-right font-semibold">Change %</th>
                      <th className="px-3 py-2 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pager.rows.map((r) => (
                      <tr key={r.id} className="border-t border-border/40">
                        <td className="px-3 py-1.5">{r.label}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.unit}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{fmt(r.a)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{fmt(r.b)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {r.delta === null ? '—' : `${r.delta >= 0 ? '+' : ''}${fmt(r.delta)}`}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-1.5 text-right tabular-nums',
                            r.pct !== null &&
                              (r.pct >= 0
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-700 dark:text-rose-400'),
                          )}
                        >
                          {r.pct === null ? '—' : `${r.pct >= 0 ? '▲' : '▼'} ${Math.abs(r.pct).toFixed(1)}%`}
                        </td>
                        <td className="px-3 py-1.5 text-[11.5px] text-muted-foreground">{r.note ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <GridTablePager
                page={pager.page}
                totalPages={pager.totalPages}
                pageSize={pager.pageSize}
                total={pager.total}
                from={pager.from}
                to={pager.to}
                onPage={pager.setPage}
                onPageSize={pager.setPageSize}
                noun="rows"
              />

              <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-4 text-[12px] leading-[1.65] font-mono whitespace-pre">
                {ok.text}
              </pre>
            </>
          )}
        </>
      )}

      {view === 'range' && (
        <>
          <p className="text-[12px] text-muted-foreground">
            A stretch of months at once: metrics down the rows, months across the columns. A month the
            archive does not hold keeps its column and leaves it blank — a gap in the record, not a
            zero.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="mrng-start">
                Start month
              </label>
              <input
                id="mrng-start"
                type="month"
                value={rStart}
                min={oldest || undefined}
                max={newest || undefined}
                onChange={(e) => setRStart(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="mrng-end">
                End month
              </label>
              <input
                id="mrng-end"
                type="month"
                value={rEnd}
                min={oldest || undefined}
                max={newest || undefined}
                onChange={(e) => setREnd(e.target.value)}
                className={inputCls}
              />
            </div>
            <button
              type="button"
              onClick={() => buildSeries(rMetricIds)}
              disabled={!rStart || !rEnd || span === null || pending}
              className={btnPrimary}
            >
              Build range
            </button>
            {pending && (
              <span className="inline-flex items-center gap-1.5 pb-2 text-[12px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the archive…
              </span>
            )}
          </div>

          {span === null ? (
            <Notice tone="warn">Pick a start on or before the end month.</Notice>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              {span} month{span === 1 ? '' : 's'} selected.
            </p>
          )}

          {error && <Notice tone="warn">{error}</Notice>}
          {series && !series.ok && <Notice tone="warn">{series.error}</Notice>}

          {seriesOk && (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <button
                  type="button"
                  onClick={() => download(`${rangeStem}.csv`, seriesOk.csv, 'text/csv;charset=utf-8')}
                  className={btnGhost}
                >
                  <Download className="h-4 w-4" /> Download .csv
                </button>
                <span className="pb-2 text-[12px] text-muted-foreground">
                  {seriesOk.metricCount} metric{seriesOk.metricCount === 1 ? '' : 's'} ×{' '}
                  {seriesOk.months.length} month{seriesOk.months.length === 1 ? '' : 's'}
                </span>
              </div>

              {seriesOk.missing.length > 0 && (
                <Notice tone="warn">
                  {seriesOk.missing.length} of {seriesOk.months.length} months have no report, so their
                  columns are blank throughout: {seriesOk.missing.slice(0, 12).join(', ')}
                  {seriesOk.missing.length > 12 ? ` … and ${seriesOk.missing.length - 12} more` : ''}.
                </Notice>
              )}

              <div className="rounded-lg border border-border/60 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold">
                    Metrics{' '}
                    {rMetricIds.length
                      ? `(${rMetricIds.length} of ${seriesOk.available.length})`
                      : `(all ${seriesOk.available.length})`}
                  </p>
                  <button
                    type="button"
                    onClick={() => buildSeries([])}
                    disabled={!rMetricIds.length || pending}
                    className="text-[12px] font-semibold text-emerald-700 disabled:opacity-40 dark:text-emerald-400"
                  >
                    Show all
                  </button>
                </div>
                <div className="grid max-h-56 gap-x-4 gap-y-1 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                  {seriesOk.available.map((m) => (
                    <label key={m.id} className="inline-flex items-center gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        checked={rMetricIds.length === 0 || rMetricIds.includes(m.id)}
                        onChange={() => {
                          const base = rMetricIds.length
                            ? rMetricIds
                            : seriesOk.available.map((x) => x.id);
                          const next = base.includes(m.id)
                            ? base.filter((x) => x !== m.id)
                            : [...base, m.id];
                          buildSeries(next.length === seriesOk.available.length ? [] : next);
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="truncate">
                        {m.label} <span className="text-muted-foreground">({m.unit})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── the panel ───────────────────────────────────────────────────────────── */

export function YoyComparisonPanel({ bootstrap }: { bootstrap: YoyBootstrap }) {
  const [mode, setMode] = useState<Mode>('sheet');

  return (
    <CmsCard title="Grid comparison">
      <div className="space-y-4">
        <CmsFilterTabs>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn('admin-filter-tab', mode === m.id && 'admin-filter-tab--active')}
            >
              {m.label}
            </button>
          ))}
        </CmsFilterTabs>

        {mode === 'sheet' && <SheetMode bootstrap={bootstrap} />}
        {mode === 'compare' && <CompareMode bootstrap={bootstrap} />}
        {mode === 'range' && <RangeMode bootstrap={bootstrap} />}
        {mode === 'months' && <MonthsMode bootstrap={bootstrap} />}
      </div>
    </CmsCard>
  );
}
