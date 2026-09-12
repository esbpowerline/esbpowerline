'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileText,
  FileType2,
  Loader2,
  Minus,
  Scale,
} from 'lucide-react';
import { CmsCard, CmsFilterTabs } from '@/components/cms/CmsUI';
import { cn } from '@/lib/utils';
import { useTablePager, GridTablePager } from '@/components/news/power-grid/GridExplorerUI';
import {
  exportComparisonDocument,
  exportSheetDocument,
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
  DocFormat,
  DocumentPayload,
  MonthlyComparisonPayload,
  MonthlySeriesPayload,
  RangeSeriesPayload,
  YoyBootstrap,
} from '@/lib/actions/yoy-comparison';
import type { YoyResult } from '@/lib/data/grid/yoy-comparison';
import type { ComparisonRow } from '@/lib/data/grid/comparison';
import {
  createArchiveIndex,
  formatIso,
  priorYearIso as priorYearOf,
  type ArchiveIndex,
} from '@/lib/data/grid/archive-coverage';
import { GridDatePicker } from '@/components/cms/yoy/GridDatePicker';
import { GridMonthPicker } from '@/components/cms/yoy/GridMonthPicker';
import { MetricPicker, SectionChips } from '@/components/cms/yoy/MetricPicker';
import { useYoyUrl, type YoyUrl } from '@/components/cms/yoy/useYoyUrl';
import {
  metricLabel,
  sectionLabel,
  strings,
  toBnDigits,
  unitLabel,
  verdictOf,
  type Lang,
} from '@/lib/data/grid/comparison-i18n';

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

/** The valid values, so a hand-edited `?mode=` cannot put the panel nowhere. */
const MODE_IDS = ['sheet', 'compare', 'range', 'months'] as const;
const LANGS = ['en', 'bn'] as const;

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'sheet', label: 'YoY Sheet' },
  { id: 'compare', label: 'Compare two days' },
  { id: 'range', label: 'Range export' },
  { id: 'months', label: 'Compare months' },
];

/* ── shared bits ─────────────────────────────────────────────────────────── */

/**
 * Hand the browser a file.
 *
 * Two details that look like ceremony and are not. The anchor has to be in the
 * document: Firefox ignores `click()` on a detached one, so the button did
 * nothing there and said nothing about it. And the object URL must outlive the
 * click — revoking it on the next line races the download the click just
 * started, which is how a large export intermittently produced no file. One
 * turn of the event loop is enough for the browser to have taken the blob.
 */
function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

function download(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  saveBlob(filename, new Blob([text], { type: mime }));
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

// The primary action colour, not green: on this surface green means "fine",
// and a Generate button is not a status.
const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40';
const btnGhost =
  'inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-semibold transition hover:bg-muted/60 disabled:opacity-40';

function Notice({ tone, children }: { tone: 'warn' | 'info'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border p-3 text-[12px]',
        tone === 'warn'
          ? 'border-[hsl(var(--staff-warn)/0.4)] bg-[hsl(var(--staff-warn)/0.07)] text-[hsl(var(--staff-warn))]'
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
      // The route reports whether it replaced a file. These sheets are named per
      // day, so saving under a date already filed silently clobbers it — the
      // server computes that flag and nothing was showing it.
      let overwrote = false;
      try {
        const parsed = JSON.parse(raw) as {
          message?: string;
          error?: string;
          path?: string;
          overwrote?: boolean;
        };
        message = parsed.message ?? parsed.error ?? parsed.path ?? message;
        overwrote = parsed.overwrote === true;
      } catch {
        // Not JSON — an HTML error page means the route is not there at all.
        if (message.startsWith('<')) message = `Archive route returned ${res.status} ${res.statusText}.`;
      }
      if (res.ok && overwrote) {
        setState({ tone: 'warn', message: `Replaced the sheet already filed at ${message}` });
        return;
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
            state.tone === 'ok' ? 'text-[hsl(var(--staff-ok))]' : 'text-[hsl(var(--staff-warn))]',
          )}
        >
          {state.message}
        </span>
      )}
    </>
  );
}

/* ── the comparison table ────────────────────────────────────────────────── */

/**
 * Colour says whether the day got better, not whether the number got bigger.
 *
 * Load shedding falling by 300 MW and generation rising by 300 MW are both good
 * news for the grid, and the old table painted the first one red purely because
 * the figure went down — telling the reader the opposite of what happened.
 * `verdictOf` holds which direction is an improvement for each metric, and
 * anything it will not judge (demand, temperature) is left uncoloured rather
 * than given a colour that would read as praise or blame.
 */
const VERDICT_STYLE = {
  up: {
    chip: 'bg-[hsl(var(--staff-ok)/0.1)] text-[hsl(var(--staff-ok))] ring-[hsl(var(--staff-ok)/0.2)]',
    text: 'text-[hsl(var(--staff-ok))]',
    Icon: ArrowUpRight,
  },
  down: {
    chip: 'bg-[hsl(var(--staff-bad)/0.1)] text-[hsl(var(--staff-bad))] ring-[hsl(var(--staff-bad)/0.2)]',
    text: 'text-[hsl(var(--staff-bad))]',
    Icon: ArrowDownRight,
  },
  none: {
    chip: 'bg-muted/60 text-muted-foreground ring-border/50',
    text: 'text-muted-foreground',
    Icon: Minus,
  },
} as const;

/** Digits swap to Bengali numerals with the language; the arrows do not. */
function loc(text: string, lang: Lang): string {
  return lang === 'bn' ? toBnDigits(text) : text;
}

function figure(v: number | null, lang: Lang): string {
  if (v === null) return '—';
  const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
  return loc(s.replace(/\B(?=(\d{3})+(?!\d))(?=[^.]*$)/g, ','), lang);
}

/**
 * A count of rows by how they moved, for the strip above the table.
 *
 * Four outcomes, not three. A row where both days published a figure but the
 * engine refused to subtract them — a total summed over six zones against one
 * summed over nine — was landing in "no change", which is a claim, and a false
 * one: the figures differ by 2,031 MW. It gets its own count.
 */
function tally(rows: ComparisonRow[]) {
  let better = 0;
  let worse = 0;
  let flat = 0;
  let unpublished = 0;
  let incomparable = 0;
  for (const r of rows) {
    if (r.a === null || r.b === null) {
      unpublished += 1;
      continue;
    }
    // Both figures present and no delta means the engine declined the
    // arithmetic; `changeOf` sets a delta in every other case.
    if (r.delta === null) {
      incomparable += 1;
      continue;
    }
    const v = verdictOf(r.id, r.delta);
    if (v === 'up') better += 1;
    else if (v === 'down') worse += 1;
    else flat += 1;
  }
  return { better, worse, flat, unpublished, incomparable };
}

function SummaryStrip({ rows }: { rows: ComparisonRow[] }) {
  const { better, worse, flat, unpublished, incomparable } = tally(rows);
  const items = [
    { n: better, label: 'improved', cls: VERDICT_STYLE.up.chip, Icon: ArrowUpRight },
    { n: worse, label: 'worsened', cls: VERDICT_STYLE.down.chip, Icon: ArrowDownRight },
    { n: flat, label: 'no change', cls: VERDICT_STYLE.none.chip, Icon: Minus },
    {
      n: incomparable,
      label: 'not like for like',
      cls: 'bg-[hsl(var(--staff-accent)/0.1)] text-[hsl(var(--staff-accent))] ring-[hsl(var(--staff-accent)/0.2)]',
      Icon: Scale,
    },
    {
      n: unpublished,
      label: 'not published',
      cls: 'bg-[hsl(var(--staff-warn)/0.1)] text-[hsl(var(--staff-warn))] ring-[hsl(var(--staff-warn)/0.2)]',
      Icon: AlertTriangle,
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* A zero count is dropped: four chips reading 0 crowd out the two that
          matter, and "0 not published" is not news. */}
      {items.filter((x) => x.n > 0).map(({ n, label, cls, Icon }) => (
        <span
          key={label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset',
            cls,
          )}
        >
          <Icon className="h-3 w-3" />
          <span className="tabular-nums">{n}</span>
          <span className="font-medium opacity-80">{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * One comparison, as a table both the daily and the monthly mode render.
 *
 * It replaced two hand-maintained copies of the same markup that had already
 * drifted apart, and it groups the rows under their section rather than
 * printing 230 undifferentiated lines: the section is the first thing an
 * editor scans for, and it was previously only visible in the .txt export.
 */
function ComparisonTable({
  rows,
  a,
  b,
  lang,
  sectionName,
}: {
  rows: ComparisonRow[];
  a: string;
  b: string;
  lang: Lang;
  sectionName: (id: string) => string;
}) {
  const t = strings(lang);
  const pager = useTablePager(rows, 25);

  const head = 'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';
  const cell = 'px-3 py-2 align-middle';

  return (
    <>
      <div className="max-h-[36rem] overflow-auto rounded-[var(--r-lg)] border border-[var(--line)]">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-[12px]">
          <thead>
            {/* Sticky: a 230-row comparison scrolls well past the headings, and
                the two date columns are indistinguishable without them. */}
            <tr className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <th className={cn(head, 'text-left')}>{t.metric}</th>
              <th className={cn(head, 'text-left')}>{t.unit}</th>
              <th className={cn(head, 'text-right')}>{a}</th>
              <th className={cn(head, 'text-right')}>{b}</th>
              <th className={cn(head, 'text-right')}>{t.change}</th>
              <th className={cn(head, 'text-right')}>{t.changePct}</th>
              <th className={cn(head, 'text-left')}>{t.note}</th>
            </tr>
          </thead>
          <tbody>
            {pager.rows.map((r, i) => {
              // Section headings are inserted between rows, so they are worked
              // out from the page being shown rather than the whole list —
              // otherwise a page starting mid-section would have no heading.
              const prev = i > 0 ? pager.rows[i - 1] : null;
              const opensSection = !prev || prev.section !== r.section;
              const v = verdictOf(r.id, r.delta);
              const style = VERDICT_STYLE[v];
              const Arrow = style.Icon;
              const unpublished = r.a === null || r.b === null;

              return (
                <React.Fragment key={r.id}>
                  {opensSection && (
                    <tr>
                      <th
                        colSpan={7}
                        scope="colgroup"
                        className="border-y border-border/50 bg-muted/40 px-3 py-1.5 text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                      >
                        {sectionLabel(r.section, sectionName(r.section), lang)}
                      </th>
                    </tr>
                  )}
                  <tr
                    className={cn(
                      'border-b border-border/30 transition-colors hover:bg-muted/30',
                      // A row with a missing figure is tinted rather than left
                      // to look like an ordinary row that happens to hold a
                      // dash. It is a gap in the record, and it should read as
                      // one at a glance.
                      unpublished && 'bg-[hsl(var(--staff-warn)/0.05)]',
                    )}
                  >
                    <td className={cn(cell, 'font-medium')}>{metricLabel(r.id, r.label, lang)}</td>
                    <td className={cn(cell, 'whitespace-nowrap text-muted-foreground')}>
                      {unitLabel(r.unit, lang)}
                    </td>
                    <td className={cn(cell, 'text-right tabular-nums')}>{figure(r.a, lang)}</td>
                    <td className={cn(cell, 'text-right font-semibold tabular-nums')}>
                      {figure(r.b, lang)}
                    </td>
                    <td className={cn(cell, 'text-right tabular-nums', style.text)}>
                      {r.delta === null ? '—' : `${r.delta >= 0 ? '+' : ''}${figure(r.delta, lang)}`}
                    </td>
                    <td className={cn(cell, 'text-right')}>
                      {r.pct === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums ring-1 ring-inset',
                            style.chip,
                          )}
                        >
                          <Arrow className="h-3 w-3" />
                          {loc(`${Math.abs(r.pct).toFixed(1)}%`, lang)}
                        </span>
                      )}
                    </td>
                    <td className={cn(cell, 'text-[11.5px] text-muted-foreground')}>{r.note ?? ''}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* A colour that means "better" rather than "bigger" has to say so, or a
          reader seeing shedding fall in green assumes the table is broken. */}
      <p className="text-[11.5px] text-muted-foreground">
        <span className="font-semibold text-[hsl(var(--staff-ok))]">Green</span> is an
        improvement for that metric and{' '}
        <span className="font-semibold text-[hsl(var(--staff-bad))]">red</span> a worsening — so
        shedding falling is green and shedding rising is red. Demand and temperature are never
        coloured: a change in either is neither good nor bad on its own.
      </p>

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
    </>
  );
}

/* ── Word and PDF ────────────────────────────────────────────────────────── */

/**
 * Both binary exports, and the one place their failures are shown.
 *
 * The .txt/.csv/.json buttons build a Blob from a string the panel already
 * holds; these two have to ask the server to typeset a document, which can fail
 * for a reason the operator needs to read — a Bengali PDF with no Bengali font
 * being the one that actually happens.
 */
function DocumentButtons({
  run,
  disabled,
  lang,
}: {
  run: (format: DocFormat) => Promise<DocumentPayload>;
  disabled?: boolean;
  /** Only used for the Bengali caveat below; the buttons stay in English. */
  lang: Lang;
}) {
  const [busy, setBusy] = useState<DocFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(format: DocFormat) {
    setBusy(format);
    setError(null);
    try {
      const res = await run(format);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Base64 to Blob rather than a data: URL — a 230-row PDF overruns the URL
      // length limit in some browsers, and fails silently when it does.
      // Decoded by hand rather than with `fetch('data:…')`, which would be
      // neater but is blocked here: our connect-src does not list `data:`.
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      saveBlob(res.filename, new Blob([bytes], { type: res.mime }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => go('docx')}
        disabled={disabled || busy !== null}
        className={btnGhost}
      >
        {busy === 'docx' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {busy === 'docx' ? 'Preparing…' : 'Download .docx'}
      </button>
      <button
        type="button"
        onClick={() => go('pdf')}
        disabled={disabled || busy !== null}
        className={btnGhost}
      >
        {busy === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileType2 className="h-4 w-4" />
        )}
        {busy === 'pdf' ? 'Preparing…' : 'Download .pdf'}
      </button>
      {error && (
        <span className="basis-full pb-1 text-[12px] text-[hsl(var(--staff-warn))]">
          {error}
        </span>
      )}
      {/* Said here rather than buried in the file, because here is where the
          choice is made. The PDF's Bengali is readable but its ra-conjuncts
          form wrongly — react-pdf's shaper, not the font — while Word shapes
          the text on the reader's own machine and gets them right. */}
      {lang === 'bn' && (
        <span className="basis-full text-[11px] text-muted-foreground">
          For Bengali, prefer .docx — the PDF&rsquo;s ra-conjuncts form wrongly (react-pdf&rsquo;s
          shaper, not the font), while Word shapes the text on the reader&rsquo;s own machine.
        </span>
      )}
    </>
  );
}

/* ── the published sheet, as a table ─────────────────────────────────────── */

/**
 * The year-on-year sheet is nine rows, and it was being shown as the raw
 * monospace block the exporter produces — columns held together by space
 * padding, which only line up in a monospaced font and do not line up at all in
 * Bengali, where no monospaced face exists. It read as broken output rather
 * than as the headline nine figures of the day.
 *
 * So the figures are drawn, and the raw block is kept underneath for the reader
 * who wants to see exactly what Copy and .txt will hand them.
 *
 * Nine rows is few enough to be generous with: the two years get real columns,
 * the change gets a chip, and the row carries the same colour rule as every
 * other table here — `verdictOf`, keyed on the comparison engine's own metric
 * ids, so shedding falling is green here exactly as it is over there.
 */
function SheetTable({ result }: { result: Extract<YoyResult, { ok: true }> }) {
  const bn = result.lang === 'bn';

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)]">
      <table className="w-full border-separate border-spacing-0 text-[13px]">
        <thead>
          <tr className="bg-muted/60">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {bn ? 'বিবরণ' : 'Metric'}
            </th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {bn ? 'একক' : 'Unit'}
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {result.aLabel}
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {result.bLabel}
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {bn ? 'পরিবর্তন' : 'Change'}
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {bn ? 'পরিবর্তন %' : 'Change %'}
            </th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r) => {
            const v = verdictOf(r.id, r.b - r.a);
            const style = VERDICT_STYLE[v];
            const Arrow = style.Icon;
            return (
              <tr key={r.id} className="border-t border-border/40 transition-colors hover:bg-muted/25">
                <td className="px-4 py-2.5 font-semibold">{r.label}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-muted-foreground">
                  {r.unit}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {r.aText}
                </td>
                {/* The later year is the story; the earlier one is context. */}
                <td className="px-4 py-2.5 text-right text-[14px] font-bold tabular-nums">
                  {r.bText}
                </td>
                {/* The absolute change, in the same units as the two columns
                    before it. It was missing here while every other table in
                    the section carried it, and a percentage on its own does not
                    tell a desk how many megawatts moved. */}
                <td className={cn('px-4 py-2.5 text-right tabular-nums', style.text)}>
                  {r.deltaText}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums ring-1 ring-inset',
                      style.chip,
                    )}
                  >
                    <Arrow className="h-3.5 w-3.5" />
                    {r.pctText}%
                  </span>
                  {/* The published sheet prints 0.0% against a base of zero,
                      and this shows what the sheet shows. But 0 MW to 1,553 MW
                      is not a 0% move, it is a move with no ratio, so it is
                      said here rather than left to read as "no change". The
                      colour still comes from the direction, which is real. */}
                  {r.pct === null && (
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {bn ? 'আগের বছর শূন্য' : 'from zero'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── mode 1: the published year-on-year sheet ────────────────────────────── */

function SheetMode({ bootstrap, archive, url, lang }: { bootstrap: YoyBootstrap; archive: ArchiveIndex; url: YoyUrl; lang: Lang }) {
  // The sheet needs the day AND the same day a year earlier, so a link is
  // validated against that rule, not merely against the archive.
  const canSheet = useCallback(
    (iso: string) => archive.has(iso) && archive.has(priorYearOf(iso)),
    [archive],
  );
  const [date, setDate] = useState(() => url.day('date', bootstrap.latestDate ?? '', canSheet));
  const [result, setResult] = useState<YoyResult | null>(bootstrap.initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = useCallback(
    (next: string, forLang: Lang) => {
      setError(null);
      if (!next) return;
      startTransition(async () => {
        try {
          setResult(await generateYoySheet(next, forLang));
        } catch (e) {
          setResult(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      });
    },
    [],
  );

  /**
   * The sheet is built server-side in one language or the other, so changing
   * either the day or the Output language has to rebuild it — there is nothing
   * on the client to re-render into Bengali.
   *
   * Keyed on what the bootstrap already painted rather than on "is this the
   * first render". A mount guard was correct until links arrived: opening
   * `?date=2026-08-14` skipped the only effect run and left the editor looking
   * at the sheet for a different day than the calendar showed.
   */
  useEffect(() => {
    url.patch({ date });
  }, [date, url]);

  const built = useRef(`${bootstrap.latestDate ?? ''}|en`);
  useEffect(() => {
    const key = `${date}|${lang}`;
    if (built.current === key) return;
    built.current = key;
    generate(date, lang);
  }, [lang, date, generate, bootstrap.latestDate]);

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        The same day one year apart, in the fixed format the desk publishes. Grid and gas are both
        read from the chosen energy day — Petrobangla files the 08:00–08:00 window under the
        following date, so a day is only ready once that report has landed.
      </p>

      <div className="grid-controls">
        {/* A day needs its own figures AND the same day a year earlier, so the
            calendar refuses anything missing either. It used to accept any day
            in the span and answer with an error. */}
        <GridDatePicker
          label="Energy day"
          id="yoy-date"
          value={date}
          onChange={setDate}
          archive={archive}
          selectable={canSheet}
          unselectableHint="A day is offered only when the archive holds it and the same day a year earlier."
        />
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
        {/* The sheet is already typeset — fixed columns, Bengali numerals — so
            both documents carry it as a monospaced block rather than rebuilding
            it as a table and losing the format the desk publishes. */}
        <DocumentButtons
          lang={lang}
          disabled={!result?.ok || pending || !date}
          run={(format) => exportSheetDocument(date, format, lang)}
        />
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
          <SheetTable result={result} />

          {/* Kept, but folded away: this is the artefact Copy, .txt and the
              archive folder actually hand over, and an editor checking a
              published file needs to see it exactly as it will be written. It
              is not what the page should open on, though — as the whole
              preview it read as broken output. */}
          <details className="rounded-lg border border-border/60 bg-muted/20">
            <summary className="cursor-pointer select-none px-4 py-2.5 text-[12px] font-semibold text-muted-foreground">
              Raw sheet — exactly what Copy, .txt and the archive folder write
            </summary>
            <pre className="overflow-x-auto border-t border-border/60 p-4 text-[12px] leading-[1.65] font-mono whitespace-pre">
              {result.text}
            </pre>
          </details>

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

function CompareMode({ bootstrap, archive, url, lang }: { bootstrap: YoyBootstrap; archive: ArchiveIndex; url: YoyUrl; lang: Lang }) {
  const anchor = bootstrap.latestDate ?? bootstrap.newestArchiveDate ?? '';
  const sectionIds = useMemo(() => bootstrap.sections.map((s) => s.id), [bootstrap.sections]);

  const [bDate, setBDate] = useState(() => url.day('b', anchor));
  const [aDate, setADate] = useState(() => url.day('a', anchor ? priorYearIso(anchor) : ''));
  const [sections, setSections] = useState<SectionId[]>(() =>
    url.list('sections', sectionIds, sectionIds),
  );
  const [metricIds, setMetricIds] = useState<string[]>([]);
  const [payload, setPayload] = useState<ComparisonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // One write per settled state rather than one per setter, so a swap does not
  // put a half-swapped pair in the bar on its way through.
  useEffect(() => {
    url.patch({ a: aDate, b: bDate, sections: sections.join(',') });
  }, [aDate, bDate, sections, url]);

  // Every run is stamped; a slower earlier request must not overwrite a newer
  // result when the editor is clicking through sections quickly.
  const runId = useRef(0);

  useEffect(() => {
    if (!aDate || !bDate) return;
    const id = ++runId.current;
    setError(null);
    startTransition(async () => {
      try {
        const next = await runComparison(aDate, bDate, sections, metricIds, lang);
        if (id === runId.current) setPayload(next);
      } catch (e) {
        if (id === runId.current) {
          setPayload(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    });
  }, [aDate, bDate, sections, metricIds, lang]);

  const ok = payload?.ok ? payload : null;
  const stem = `Grid_Compare_${aDate}_vs_${bDate}`;
  const sectionName = useCallback(
    (id: string) => bootstrap.sections.find((x) => x.id === id)?.label ?? id,
    [bootstrap.sections],
  );

  /**
   * The comparisons the desk actually reaches for, one press each.
   *
   * They move the FIRST day and leave the second alone: the second is "the day
   * I am writing about" and the first is whatever I am measuring it against.
   * Each lands on the nearest archived day, because an exact year back is a
   * gap 81 times in this archive, and offers nothing when there is none within
   * reach rather than silently choosing something far away.
   */
  const presets = useMemo(
    () =>
      [
        { label: 'Year before', delta: null as number | null },
        { label: 'Month before', delta: -30 },
        { label: 'Week before', delta: -7 },
        { label: 'Day before', delta: -1 },
      ].map((p) => ({
        label: p.label,
        to: bDate
          ? archive.nearest(p.delta === null ? priorYearOf(bDate) : shiftIso(bDate, p.delta))
          : null,
      })),
    [bDate, archive],
  );

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

      <div className="grid-controls">
        <GridDatePicker
          label="First day"
          id="cmp-a"
          value={aDate}
          onChange={setADate}
          archive={archive}
        />
        {/* The two days are read left to right, and getting them the wrong way
            round inverts every sign in the table. Fixing that meant retyping
            both dates. */}
        <button
          type="button"
          className="grid-controls__swap"
          onClick={() => {
            setADate(bDate);
            setBDate(aDate);
          }}
          title="Swap the two days"
          aria-label="Swap the two days"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
        <GridDatePicker
          label="Second day"
          id="cmp-b"
          value={bDate}
          onChange={setBDate}
          archive={archive}
        />

        <div className="grid-date-field">
          <span className="grid-date-field__label">Jump to</span>
          <div className="grid-presets">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                className="grid-preset"
                disabled={!p.to}
                title={p.to ? formatIso(p.to) : 'Not in the archive'}
                onClick={() => p.to && setADate(p.to)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {pending && (
          <span className="inline-flex items-center gap-1.5 pb-2 text-[12px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Comparing…
          </span>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold">Sections</p>
        <SectionChips
          sections={bootstrap.sections}
          selected={sections}
          onToggle={toggleSection}
          onAll={() => {
            setSections(bootstrap.sections.map((x) => x.id));
            setMetricIds([]);
          }}
        />
      </div>

      {error && <Notice tone="warn">{error}</Notice>}
      {payload && !payload.ok && <Notice tone="warn">{payload.error}</Notice>}

      {ok && (
        <>
          <MetricPicker
            metrics={ok.available}
            sections={bootstrap.sections}
            selected={metricIds}
            onChange={setMetricIds}
            disabled={pending}
          />

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
            <DocumentButtons
              lang={lang}
              disabled={pending}
              run={(format) =>
                exportComparisonDocument({
                  kind: 'days',
                  a: aDate,
                  b: bDate,
                  sections,
                  metricIds,
                  format,
                  lang,
                })
              }
            />
            <SaveToArchive filename={`${stem}.txt`} text={ok.text} disabled={pending} />
          </div>

          <SummaryStrip rows={ok.rows} />

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

          <ComparisonTable
            rows={ok.rows}
            a={ok.a}
            b={ok.b}
            lang={lang}
            sectionName={sectionName}
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

function RangeMode({ bootstrap, archive, url }: { bootstrap: YoyBootstrap; archive: ArchiveIndex; url: YoyUrl }) {
  const end0 = bootstrap.newestArchiveDate ?? '';
  const [start, setStart] = useState(() => url.day('from', end0 ? shiftIso(end0, -29) : ''));
  const [end, setEnd] = useState(() => url.day('to', end0));

  useEffect(() => {
    url.patch({ from: start, to: end });
  }, [start, end, url]);
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

      <div className="grid-controls">
        {/* Boundaries, not members: the days between are allowed to be missing —
            that is the point of the export — but a range that STARTS on a day
            we do not hold begins with a blank column, which is only ever a
            typo. So the two ends come out of the archive like everywhere else. */}
        <GridDatePicker
          label="Start"
          id="rng-start"
          value={start}
          onChange={setStart}
          archive={archive}
        />
        <GridDatePicker
          label="End"
          id="rng-end"
          value={end}
          onChange={setEnd}
          archive={archive}
        />

        <div className="grid-date-field">
          <span className="grid-date-field__label">Length</span>
          <div className="grid-presets">
            {[7, 30, 90, 365].map((n) => (
              <button
                key={n}
                type="button"
                className="grid-preset"
                disabled={!end || pending}
                title={`The ${n} days ending ${end ? formatIso(end) : ''}`}
                onClick={() => setStart(shiftIso(end, -(n - 1)))}
              >
                {n}d
              </button>
            ))}
          </div>
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

          <MetricPicker
            metrics={seriesOk.available.map((m) => ({ ...m, section: 'all' }))}
            selected={metricIds}
            onChange={build}
            disabled={pending}
          />
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
            <div className="rounded-lg border border-[hsl(var(--staff-warn)/0.4)] bg-[hsl(var(--staff-warn)/0.07)] p-3 text-[12px] text-[hsl(var(--staff-warn))]">
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

const MONTH_VIEWS = ['compare', 'range'] as const;

function MonthsMode({ bootstrap, archive, url, lang }: { bootstrap: YoyBootstrap; archive: ArchiveIndex; url: YoyUrl; lang: Lang }) {
  const newest = bootstrap.months[0] ?? '';
  const oldest = bootstrap.months[bootstrap.months.length - 1] ?? '';
  const archived = useMemo(() => new Set(bootstrap.months), [bootstrap.months]);

  const [view, setView] = useState<MonthView>(() => url.one('view', 'compare', MONTH_VIEWS));

  const monthlyIds = useMemo(
    () => bootstrap.monthlySections.map((s) => s.id),
    [bootstrap.monthlySections],
  );
  const [bMonth, setBMonth] = useState(() => url.month('b', newest, archived));
  const [aMonth, setAMonth] = useState(() =>
    url.month('a', newest ? priorYearMonth(newest) : '', archived),
  );
  const [sections, setSections] = useState<MonthlySectionId[]>(() =>
    url.list('msections', monthlyIds, monthlyIds),
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
        const next = await runMonthlyComparison(aMonth, bMonth, sections, metricIds, lang);
        if (id === runId.current) setPayload(next);
      } catch (e) {
        if (id === runId.current) {
          setPayload(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    });
  }, [view, aMonth, bMonth, sections, metricIds, lang]);

  const ok = payload?.ok ? payload : null;
  const stem = `Grid_Compare_Months_${aMonth}_vs_${bMonth}`;
  // The monthly engine has its own section vocabulary, so the table has to be
  // told where to look; left to the daily names it would print "Load shedding"
  // over the substation rows.
  const sectionName = useCallback(
    (id: string) => bootstrap.monthlySections.find((x) => x.id === id)?.label ?? id,
    [bootstrap.monthlySections],
  );

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
  const [rStart, setRStart] = useState(() =>
    url.month('ms', newest ? priorYearMonth(newest) : '', archived),
  );
  const [rEnd, setREnd] = useState(() => url.month('me', newest, archived));

  useEffect(() => {
    url.patch({
      view,
      a: aMonth,
      b: bMonth,
      ms: rStart,
      me: rEnd,
      msections: sections.join(','),
    });
  }, [view, aMonth, bMonth, rStart, rEnd, sections, url]);
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
          {/* The same controls panel as the Sheet, Compare and Range tabs —
              this tab's pickers sat bare in a flex row. */}
          <div className="grid-controls">
            <GridMonthPicker
              label="First month"
              value={aMonth}
              onChange={setAMonth}
              months={bootstrap.months}
            />
            <button
              type="button"
              className="grid-controls__swap"
              onClick={() => {
                setAMonth(bMonth);
                setBMonth(aMonth);
              }}
              title="Swap the two months"
              aria-label="Swap the two months"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <GridMonthPicker
              label="Second month"
              value={bMonth}
              onChange={setBMonth}
              months={bootstrap.months}
            />
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
            <SectionChips
              sections={bootstrap.monthlySections}
              selected={sections}
              onToggle={toggleSection}
              onAll={() => {
                setSections(bootstrap.monthlySections.map((x) => x.id));
                setMetricIds([]);
              }}
            />
          </div>

          {error && <Notice tone="warn">{error}</Notice>}
          {payload && !payload.ok && <Notice tone="warn">{payload.error}</Notice>}

          {ok && (
            <>
              <MetricPicker
                metrics={ok.available}
                sections={bootstrap.monthlySections}
                selected={metricIds}
                onChange={setMetricIds}
                disabled={pending}
              />

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
                <DocumentButtons
                  lang={lang}
                  disabled={pending}
                  run={(format) =>
                    exportComparisonDocument({
                      kind: 'months',
                      a: aMonth,
                      b: bMonth,
                      sections,
                      metricIds,
                      format,
                      lang,
                    })
                  }
                />
                <SaveToArchive filename={`${stem}.txt`} text={ok.text} disabled={pending} />
              </div>

              <SummaryStrip rows={ok.rows} />

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

              <ComparisonTable
                rows={ok.rows}
                a={ok.a}
                b={ok.b}
                lang={lang}
                sectionName={sectionName}
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

          <div className="grid-controls">
            <GridMonthPicker
              label="Start month"
              value={rStart}
              onChange={setRStart}
              months={bootstrap.months}
            />
            <GridMonthPicker
              label="End month"
              value={rEnd}
              onChange={setREnd}
              months={bootstrap.months}
            />
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

              <MetricPicker
                metrics={seriesOk.available.map((m) => ({ ...m, section: 'all' }))}
                selected={rMetricIds}
                onChange={buildSeries}
                disabled={pending}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── the panel ───────────────────────────────────────────────────────────── */

export function YoyComparisonPanel({ bootstrap }: { bootstrap: YoyBootstrap }) {
  // Built once for the whole panel: the index binary-searches 63 runs, and
  // rebuilding it per mode would throw that away on every tab press. It also
  // has to exist before the URL is read, because the URL is validated against
  // it — a link to a day we no longer hold falls back rather than erroring.
  const archive = useMemo(() => createArchiveIndex(bootstrap.coverage), [bootstrap.coverage]);
  const url = useYoyUrl(archive);

  const [mode, setMode] = useState<Mode>(() => url.one('mode', 'sheet', MODE_IDS));
  const [lang, setLang] = useState<Lang>(() => url.one('lang', 'en', LANGS));

  // Written from the resolved state rather than at each click, so the link
  // self-heals: arriving on `?mode=nonsense&lang=xx` shows the sheet in
  // English AND rewrites the bar to say so, instead of leaving an address that
  // describes a panel nobody is looking at.
  useEffect(() => {
    url.patch({ mode, lang });
  }, [mode, lang, url]);

  /**
   * One sweep for the keys belonging to modes that are not mounted.
   *
   * Each mode corrects its own keys as it renders, which leaves a hand-edited
   * `?a=2014-02-10` sitting in the bar while the sheet tab is open — invalid,
   * inert, and copied into whatever link the editor shares next. The panel can
   * check those without mounting anything, because it holds both section
   * vocabularies and the archive index.
   */
  const swept = useRef(false);
  useEffect(() => {
    if (swept.current) return;
    swept.current = true;

    const months = new Set(bootstrap.months);
    const dailyIds = new Set<string>(bootstrap.sections.map((x) => x.id));
    const monthIds = new Set<string>(bootstrap.monthlySections.map((x) => x.id));
    const drop: Partial<Record<string, string>> = {};

    for (const key of ['date', 'a', 'b', 'from', 'to'] as const) {
      const v = url.initial[key];
      // `a` and `b` are days in one mode and months in another, so a value is
      // kept when it is valid as either.
      if (v && !archive.has(v) && !months.has(v)) drop[key] = '';
    }
    for (const key of ['ms', 'me'] as const) {
      const v = url.initial[key];
      if (v && !months.has(v)) drop[key] = '';
    }
    for (const [key, vocab] of [
      ['sections', dailyIds],
      ['msections', monthIds],
    ] as const) {
      const v = url.initial[key];
      if (v && !v.split(',').every((x) => vocab.has(x))) drop[key] = '';
    }

    if (Object.keys(drop).length) url.patch(drop);
  }, [url, archive, bootstrap.months, bootstrap.sections, bootstrap.monthlySections]);

  return (
    // No card title: it repeated the page header directly above it.
    <CmsCard>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          {/* This picks the language of the OUTPUT — the comparison being
              previewed and the files exported from it — not the language of
              the CMS. The panel around it stays in English, because it is the
              desk's own working surface; what changes is the table, the text
              block, the .docx and the .pdf, which are what leaves the building.

              It changes what those say, not what the engine computed. The
              figures, the units and the `—` rule are identical in both; the
              labels the desk knows by heart are translated, and names PGCB and
              Petrobangla print in English — stations, gas fields, substations —
              stay as the archive has them rather than becoming a glossary we
              would have to maintain.

              Labelled, because an unlabelled EN/বাংলা pair beside the mode tabs
              reads as "switch the CMS to Bengali", which is exactly what it
              does not do. */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Output
            </span>
            {/* The kit's filter tabs, like the mode tabs beside it. It was a
                second segmented control with a green active state. */}
            <div className="admin-filter-tabs" role="group" aria-label="Language of the preview and exports">
              {(['en', 'bn'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={cn('admin-filter-tab', lang === code && 'admin-filter-tab--active')}
                >
                  {code === 'en' ? 'English' : 'বাংলা'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mode === 'sheet' && <SheetMode bootstrap={bootstrap} archive={archive} url={url} lang={lang} />}
        {mode === 'compare' && <CompareMode bootstrap={bootstrap} archive={archive} url={url} lang={lang} />}
        {mode === 'range' && <RangeMode bootstrap={bootstrap} archive={archive} url={url} />}
        {mode === 'months' && <MonthsMode bootstrap={bootstrap} archive={archive} url={url} lang={lang} />}
      </div>
    </CmsCard>
  );
}
