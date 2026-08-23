'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Loader2, Rocket, Sun, RefreshCw } from 'lucide-react';
import { AdminCard } from '@/components/admin/AdminUI';
// The CMS date-picking vocabulary, verbatim: the year-on-year panel's calendar
// and month picker replace the browser-drawn <input type="date">/<input
// type="month">, which looked like nothing else in the admin surface.
import { GridDatePicker } from '@/components/cms/yoy/GridDatePicker';
import { GridMonthPicker } from '@/components/cms/yoy/GridMonthPicker';
import { buildCoverage, createArchiveIndex, type ArchiveIndex } from '@/lib/data/grid/archive-coverage';
import { availableDates } from '@/lib/data/grid/available-dates';

/**
 * The archive coverage, extended through today.
 *
 * The YoY panel's calendar only offers days the archive holds — the right rule
 * for reading, and the wrong one for ingesting, where the day the operator
 * wants is precisely the one the archive does NOT hold yet. So the index is
 * built from the archive plus every day from its end through today, and the
 * `selectable` rule below lets any day up to today be picked: a missing
 * historical day is exactly the kind an operator may want to backfill.
 */
function useIngestArchive(): { archive: ArchiveIndex; months: string[]; todayIso: string } {
  return useMemo(() => {
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayIso = iso(new Date());
    const days = new Set<string>(availableDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)));
    const last = [...days].sort().pop();
    if (!last || last < todayIso) {
      const cur = last ? new Date(`${last}T00:00:00`) : new Date();
      const end = new Date(`${todayIso}T00:00:00`);
      while (cur < end) {
        cur.setDate(cur.getDate() + 1);
        days.add(iso(cur));
      }
    }
    const list = [...days].sort();
    const archive = createArchiveIndex(buildCoverage(list));
    const months = [...new Set(list.map((d) => d.slice(0, 7)))].sort().reverse();
    return { archive, months, todayIso };
  }, []);
}

type ParseSummary = {
  energyDay: string;
  /** The date printed inside the workbook — the authority, not the filename. */
  sourceGridDate?: string | null;
  hasGas: boolean;
  sections: string[];
  dayPeak?: number | null;
  eveningPeak?: number | null;
  totalEnergy?: number | null;
};

type GasSummary = {
  gasDayStart: string;
  gasDayEnd: string;
  /** The 8am–8am window as printed in the PDF itself. */
  sourcePrintedWindow?: string | null;
  fieldCount: number | null;
  plantCount: number | null;
  totalGasMmcfd: number | null;
  powerDemand: number | null;
  powerSupply: number | null;
  reconciled: boolean | null;
  varianceMmcfd: number | null;
  entityCount: number;
};

type ParseResponse =
  | {
      ok: true;
      date: string;
      /**
       * The grid day — null on a Petrobangla-only upload whose grid day is not
       * on disk yet; the gas archive then publishes alone.
       */
      payload: Record<string, unknown> | null;
      /** Full Petrobangla day — null when no PDF was supplied or it failed. */
      gasArchive: Record<string, unknown> | null;
      validation: {
        warnings: string[];
        /** Same messages, graded — see classify() in ingest_bridge.py. */
        notes?: Array<{ level: 'blocking' | 'caution' | 'info'; message: string }>;
        summary: ParseSummary;
        gas: GasSummary | null;
      };
    }
  | { ok: false; error: string };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2 last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function fmt(n: number | null | undefined, unit: string): string {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toLocaleString()} ${unit}`;
}

export type IngestStatus = {
  latestGridDay: string | null;
  latestGasDay: string | null;
  runtimePublished: string[];
  nextGridDay: string | null;
  expectedWorkbookName: string | null;
  gasBehindBy: number | null;
};

/** What the site has now, and precisely which file produces the next day. */
function StatusBanner({ status }: { status: IngestStatus }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.05] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Grid data on the site through</p>
          <p className="text-[18px] font-bold tabular-nums">{status.latestGridDay ?? '—'}</p>
          {status.runtimePublished.length > 0 && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {status.runtimePublished.length} day{status.runtimePublished.length > 1 ? 's' : ''} published without a deploy
            </p>
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Gas archive through</p>
          <p className="text-[18px] font-bold tabular-nums">{status.latestGasDay ?? '—'}</p>
          {status.gasBehindBy !== null && status.gasBehindBy > 0 && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {status.gasBehindBy} day{status.gasBehindBy > 1 ? 's' : ''} behind the grid
            </p>
          )}
        </div>
      </div>

      {status.nextGridDay && (
        <div className="mt-3 border-t border-primary/20 pt-3">
          <p className="text-[12px]">
            <span className="text-muted-foreground">Next day needed: </span>
            <span className="font-bold tabular-nums">{status.nextGridDay}</span>
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
            Upload <span className="font-mono font-semibold text-foreground">{status.expectedWorkbookName}</span>
            {' '}— PGCB names the workbook for the day <em>after</em> the energy day it describes. Pair it with the gas
            report whose 8am–8am window <em>starts</em> on {status.nextGridDay}.
          </p>
        </div>
      )}
    </div>
  );
}

type SredaResult =
  | { ok: true; unchanged?: boolean; date: string; lastUpdate: string; totalRenewableMw?: number; reGridSharePct?: number; message?: string }
  | { ok: false; error: string };

/**
 * SREDA is the third daily source, but it publishes a web page rather than a
 * file — so it is a refresh button, not an upload. It also needs no Python,
 * which is why this one works from the deployed site too.
 */
function SredaCard({ latestSredaDate }: { latestSredaDate: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SredaResult | null>(null);

  async function refresh() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/data/sreda', { method: 'POST' });
      const json = (await res.json()) as SredaResult;
      setResult(json);
      // The header figures are server-rendered, so without this the card
      // reports a new snapshot while the banner above it still shows the old
      // one — and the operator cannot tell whether it actually landed.
      if (json.ok && !json.unchanged) router.refresh();
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminCard title="SREDA renewables" icon={Sun}>
      <div className="space-y-3">
        <p className="text-[12px] leading-snug text-muted-foreground">
          Total renewable capacity and RE share of grid, scraped from ndre.sreda.gov.bd. These feed
          the homepage snapshot. SREDA publishes no file, so this reads their page directly.
        </p>
        {latestSredaDate && (
          <Row label="Snapshot on the site" value={latestSredaDate} />
        )}
        <button
          onClick={refresh}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-2 text-[13px] font-semibold transition hover:bg-muted/60 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sun className="h-4 w-4" />}
          {busy ? 'Checking SREDA…' : 'Refresh from SREDA'}
        </button>

        {result?.ok === true && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/[0.07] p-3 text-[12px]">
            {result.unchanged ? (
              <span className="text-muted-foreground">{result.message}</span>
            ) : (
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Published {result.date} — {result.totalRenewableMw} MW renewable, {result.reGridSharePct}% of grid.
              </span>
            )}
          </div>
        )}
        {result?.ok === false && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/[0.06] p-3 text-[12px] text-muted-foreground">
            {result.error}
          </div>
        )}
      </div>
    </AdminCard>
  );
}

type RefreshDayOutcome = {
  date: string;
  reason: 'missing-day' | 'missing-gas';
  status: 'ingested' | 'source-pending' | 'partial' | 'failed';
  detail: string;
  steps?: Array<{ step: string; ok: boolean; seconds: number; detail?: string }>;
  publish?: { published: number; unchanged: number; failed: number };
};

type RefreshAllResult =
  | {
      ok: boolean;
      checkedThrough: string;
      upToDate: boolean;
      days: RefreshDayOutcome[];
      skippedOlderGaps: number;
      sreda: SredaResult & { unchanged?: boolean };
      error?: string;
    }
  | { ok: false; error: string };

const REFRESH_MARK: Record<RefreshDayOutcome['status'], { mark: string; cls: string }> = {
  ingested: { mark: '✓', cls: 'text-emerald-600 dark:text-emerald-400' },
  'source-pending': { mark: '…', cls: 'text-muted-foreground' },
  partial: { mark: '△', cls: 'text-amber-600 dark:text-amber-400' },
  failed: { mark: '✗', cls: 'text-rose-600 dark:text-rose-400' },
};

/**
 * The one-stop refresh. Everything below this card still exists for surgery on
 * a single day; this asks the coverage screen what is missing, fetches it from
 * the publishers' own channels, runs the full chain, and publishes — the whole
 * morning routine on one button.
 */
function RefreshAllCard() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RefreshAllResult | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/data/refresh-all', { method: 'POST' });
      const json = (await res.json()) as RefreshAllResult;
      setResult(json);
      // Coverage card and status banner are server-rendered; move them with
      // the refresh rather than waiting for a manual reload.
      router.refresh();
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  const full = result && 'days' in result ? result : null;

  return (
    <AdminCard title="Refresh data" icon={RefreshCw}>
      <div className="space-y-3">
        <p className="text-[12px] leading-snug text-muted-foreground">
          One button for the daily round: checks which recent days the site is missing — a whole day,
          or a day whose gas columns are still blank — downloads the sources from PGCB&apos;s report
          portal and Petrobangla&apos;s listing where no copy is held, runs the full chain (grid day,
          fuel curve, Nepal, station detail, gas archive, timeline, reserve model), publishes the
          result to the live site, and refreshes the SREDA renewables snapshot. BPDB&apos;s daily
          figures arrive inside PGCB&apos;s workbook, which reprints them.
        </p>
        <button
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {busy ? 'Checking the publishers…' : 'Refresh data'}
        </button>
        {busy && (
          <p className="text-[11.5px] text-muted-foreground">
            A day that needs downloading and parsing takes a few minutes — leave this open.
          </p>
        )}

        {full && (
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            {full.upToDate ? (
              <p className="text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-400">
                Grid and gas are current through {full.checkedThrough} — nothing to ingest.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {full.days.map((d) => (
                  <li key={d.date} className="text-[12px]">
                    <span className={`font-bold ${REFRESH_MARK[d.status].cls}`}>
                      {REFRESH_MARK[d.status].mark}
                    </span>{' '}
                    <span className="font-semibold tabular-nums">{d.date}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      ({d.reason === 'missing-day' ? 'day was missing' : 'gas was missing'}) — {d.detail}
                    </span>
                    {d.status !== 'ingested' && d.steps && (
                      <ul className="ml-5 mt-0.5 space-y-0.5">
                        {d.steps
                          .filter((s) => !s.ok)
                          .map((s) => (
                            <li key={s.step} className="text-[11px] text-muted-foreground">
                              ✗ {s.step}
                              {s.detail ? ` — ${s.detail}` : ''}
                            </li>
                          ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-border/40 pt-2 text-[11.5px] text-muted-foreground">
              {full.sreda.ok
                ? full.sreda.unchanged
                  ? 'SREDA: unchanged since the last snapshot.'
                  : `SREDA: new snapshot published (${'date' in full.sreda ? full.sreda.date : ''}).`
                : `SREDA: ${'error' in full.sreda ? full.sreda.error : 'failed'}`}
              {full.skippedOlderGaps > 0 && (
                <> · {full.skippedOlderGaps} older gap{full.skippedOlderGaps > 1 ? 's' : ''} left for manual backfill (see coverage above).</>
              )}
            </p>
          </div>
        )}
        {result && !('days' in result) && !result.ok && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/[0.06] p-3 text-[12px] text-muted-foreground">
            {result.error}
          </div>
        )}
      </div>
    </AdminCard>
  );
}

type LocalStep = {
  artifact: string;
  key: string;
  status: 'published' | 'unchanged' | 'absent' | 'failed';
  detail?: string;
};

const STEP_MARK: Record<LocalStep['status'], string> = {
  published: '✓',
  unchanged: '=',
  absent: '·',
  failed: '✗',
};

type IngestRunResult = {
  ok: boolean;
  date: string;
  steps: Array<{ step: string; ok: boolean; seconds: number; detail?: string }>;
  artifacts: { grid: boolean; curve: boolean; plants: boolean; gas: boolean };
  note?: string | null;
};

/** What the day has on disk, named the way the site's tabs are named. */
function ArtifactRow({ artifacts }: { artifacts: IngestRunResult['artifacts'] }) {
  const items: Array<[string, boolean, string]> = [
    ['Grid day', artifacts.grid, 'Overview, System Snapshot'],
    ['Fuel curve', artifacts.curve, 'Energy Curve chart'],
    ['Station detail', artifacts.plants, 'Power Stations tab'],
    ['Gas day', artifacts.gas, 'Gas & LNG tab'],
  ];
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {items.map(([label, present, feeds]) => (
        <div key={label} className="flex items-baseline gap-2 text-[11.5px]">
          <span className={present ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
            {present ? '✓' : '·'}
          </span>
          <span className="font-semibold">{label}</span>
          <span className="text-muted-foreground">— {present ? feeds : 'not produced yet'}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Publish the files the local ingest chain already wrote.
 *
 * The collect/upload flow below parses a day in the browser and publishes that
 * payload. It cannot publish a day produced the usual way — by running the
 * extractor and its chain on this machine — and it never published the fuel
 * curve or the station detail at all, so a day pushed through it arrived on the
 * site with an empty Energy Curve and Power Stations tab. This reads whatever
 * is on disk for the day and publishes all of it.
 */
function PublishLocalCard({ suggestedDay }: { suggestedDay: string }) {
  const router = useRouter();
  const { archive, months, todayIso } = useIngestArchive();
  const [day, setDay] = useState(suggestedDay);
  const [month, setMonth] = useState('');
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<LocalStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingest, setIngest] = useState<IngestRunResult | null>(null);

  /**
   * Build the complete day before publishing it. The collect-and-parse flow
   * below produces the grid and gas days only; this runs the whole chain, so
   * the curve, the Nepal interconnector, the station detail and the gas
   * timeline exist before anything goes live.
   */
  async function runIngest() {
    if (!day) return;
    setIngesting(true);
    setError(null);
    setIngest(null);
    setDone(null);
    try {
      const res = await fetch('/api/admin/data/ingest-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: day }),
      });
      const json = (await res.json()) as IngestRunResult & { error?: string };
      setIngest(json);
      if (!json.ok && json.error) setError(json.error);
      if (json.ok) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIngesting(false);
    }
  }

  async function run() {
    setBusy(true);
    setError(null);
    setDone(null);
    setSteps([]);
    try {
      const res = await fetch('/api/admin/data/publish-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: day || undefined, month: month || undefined }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        steps?: LocalStep[];
        summary?: { published: number; unchanged: number; absent: number; failed: number };
      };
      setSteps(json.steps ?? []);
      if (!json.ok) {
        setError(json.error ?? 'Publish failed');
        return;
      }
      setDone(
        `${json.summary?.published ?? 0} published, ${json.summary?.unchanged ?? 0} already current` +
          (json.summary?.absent ? `, ${json.summary.absent} not produced yet` : ''),
      );
      // The banner above is server-rendered from the archive and the released
      // keys; refresh it so "grid data on the site through" moves with the
      // publish instead of waiting for a manual reload.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminCard title="Publish what the local ingest produced" icon={Rocket}>
      <div className="space-y-3">
        <p className="text-[12px] text-muted-foreground">
          <strong>Run full ingest</strong> collects the day and runs the whole chain — grid day,
          fuel curve, Nepal interconnector, per-station detail, gas day and the gas aggregates — so
          the day is complete rather than just parsed. <strong>Publish to the site</strong> then
          puts every file the chain wrote onto the live site with no deployment. Files the day does
          not have yet are skipped, not failed.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48">
            <GridDatePicker
              label="Energy day"
              value={day}
              onChange={setDay}
              archive={archive}
              selectable={(iso) => iso <= todayIso}
              unselectableHint="Days after today have no report yet."
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="min-w-44">
              <GridMonthPicker
                label="Month (optional)"
                value={month}
                onChange={setMonth}
                months={months}
              />
            </div>
            {month && (
              <button
                type="button"
                onClick={() => setMonth('')}
                className="rounded-lg border border-border/60 px-2.5 py-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted"
                title="Clear — publish the day only"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={runIngest}
            disabled={ingesting || busy || !day}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-semibold transition hover:bg-muted disabled:opacity-40"
          >
            {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {ingesting ? 'Running the chain…' : 'Run full ingest'}
          </button>
          <button
            onClick={run}
            disabled={busy || ingesting || (!day && !month)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {busy ? 'Publishing…' : 'Publish to the site'}
          </button>
        </div>

        {ingest && (
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-[12px] font-semibold">
              Ingest for {ingest.date} — {ingest.ok ? 'complete' : 'finished with problems'}
            </p>
            <ArtifactRow artifacts={ingest.artifacts} />
            <ul className="space-y-0.5">
              {ingest.steps.map((s) => (
                <li key={s.step} className="text-[11px] text-muted-foreground">
                  {s.ok ? '✓' : '✗'} {s.step}
                  <span className="tabular-nums"> ({s.seconds}s)</span>
                  {s.detail ? ` — ${s.detail}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {done && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/[0.07] p-3">
            <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
              Live now — {done}.
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/[0.07] p-3 text-[12px] text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {steps.length > 0 && (
          <ul className="space-y-0.5">
            {steps.map((s) => (
              <li key={`${s.artifact}:${s.key}`} className="text-[11.5px] text-muted-foreground">
                {STEP_MARK[s.status]} {s.artifact} <span className="tabular-nums">{s.key}</span>
                {s.status === 'unchanged' ? ' — already current' : ''}
                {s.status === 'absent' ? ' — not produced for this day' : ''}
                {s.status === 'failed' && s.detail ? ` — ${s.detail}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminCard>
  );
}

export function DataIngestPanel({
  status,
  latestSredaDate,
}: {
  status: IngestStatus;
  latestSredaDate: string | null;
}) {
  const latestArchiveDate = status.latestGridDay;
  const router = useRouter();
  const { archive, todayIso } = useIngestArchive();
  const [pgcb, setPgcb] = useState<File | null>(null);
  const [pb, setPb] = useState<File | null>(null);
  // Two inputs, two meanings, so two states. They shared one before: picking a
  // day in "Collect from the publishers" silently filled in the upload card's
  // "energy day override", so a later upload was forced onto the collected
  // day's date regardless of which workbook was actually chosen.
  const [collectDate, setCollectDate] = useState('');
  const [dateOverride, setDateOverride] = useState('');

  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [published, setPublished] = useState<string | null>(null);
  const [steps, setSteps] = useState<LocalStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);

  // The server already works out which day is missing; reuse it rather than
  // recomputing the same thing from the latest date and drifting from it.
  const suggestedNextDay = status.nextGridDay ?? '';

  /**
   * Collect the day straight from PGCB and Petrobangla instead of hunting the two
   * files down by hand. It lands in the same review step as an upload — the parse
   * is identical, only the sourcing differs — so nothing publishes unseen.
   */
  async function handleCollect() {
    const day = collectDate || suggestedNextDay;
    if (!day) return;
    setCollecting(true);
    setError(null);
    setResult(null);
    setPublished(null);
    try {
      const body = new FormData();
      body.append('collect', '1');
      body.append('date', day);

      const res = await fetch('/api/admin/data/parse', { method: 'POST', body });
      const json = (await res.json()) as ParseResponse;
      setResult(json);
      if (!json.ok) setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCollecting(false);
    }
  }

  async function handleParse() {
    // Either file alone is a valid upload: the workbook makes a grid day, the
    // gas PDF makes (or completes) a gas day — its printed window names the day.
    if (!pgcb && !pb) return;
    setParsing(true);
    setError(null);
    setResult(null);
    setPublished(null);
    try {
      const body = new FormData();
      if (pgcb) body.append('pgcb', pgcb);
      if (pb) body.append('pb', pb);
      if (dateOverride) body.append('date', dateOverride);

      const res = await fetch('/api/admin/data/parse', { method: 'POST', body });
      const json = (await res.json()) as ParseResponse;
      setResult(json);
      if (!json.ok) setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setParsing(false);
    }
  }

  async function handlePublish() {
    if (!result?.ok) return;
    setPublishing(true);
    setError(null);
    try {
      // One call publishes every artefact the day has — the grid day, its fuel
      // curve and station detail, the gas day, and the aggregates rebuilt from
      // them — so the site never shows a new grid day beside yesterday's gas
      // totals, or beside an empty Energy Curve.
      const res = await fetch('/api/admin/data/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: result.date,
          grid: result.payload,
          gasArchive: result.gasArchive,
          sourceGrid: pgcb?.name,
          sourceGas: pb?.name,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        steps?: LocalStep[];
        note?: string;
      };
      setSteps(json.steps ?? []);
      if (!json.ok) {
        setError(json.error ?? 'Publish failed');
        return;
      }
      setPublished(result.date);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }

  const summary = result?.ok ? result.validation.summary : null;
  const gas = result?.ok ? result.validation.gas : null;
  const notes = result?.ok
    ? result.validation.notes ??
      result.validation.warnings.map((message) => ({ level: 'caution' as const, message }))
    : [];
  const blocking = notes.filter((n) => n.level === 'blocking');

  return (
    <div className="space-y-4">
      <StatusBanner status={status} />

      <RefreshAllCard />

      {/* The next missing day is what an operator opens this screen to ingest;
          defaulting to the newest day already on the site meant every run
          started by re-ingesting a day that was already published. */}
      <PublishLocalCard suggestedDay={suggestedNextDay || latestArchiveDate || ''} />

      <SredaCard latestSredaDate={latestSredaDate} />

      <AdminCard title="1 · Collect from the publishers" icon={Download}>
        <div className="space-y-3">
          <p className="text-[12px] text-muted-foreground">
            Downloads the day&apos;s PGCB workbook from its ERP and the matching Petrobangla gas
            report, then parses them exactly as an upload would. Nothing is taken from EMRD — it
            republishes nothing, it only links back to Petrobangla.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48">
              <GridDatePicker
                label="Energy day"
                value={collectDate || suggestedNextDay}
                onChange={setCollectDate}
                archive={archive}
                selectable={(iso) => iso <= todayIso}
                unselectableHint="Days after today have no report yet."
              />
            </div>
            <button
              onClick={handleCollect}
              disabled={collecting || parsing || !(collectDate || suggestedNextDay)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {collecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {collecting ? 'Collecting from source…' : 'Collect & preview'}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            A day&apos;s report appears the next morning, so today&apos;s is normally available
            tomorrow. If PGCB has not posted it yet you will be told, and nothing is written.
          </p>
        </div>
      </AdminCard>

      <AdminCard title="2 · Or upload the files yourself" icon={Upload}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold">
              <FileSpreadsheet className="h-3.5 w-3.5" /> PGCB daily report — makes the grid day
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm,.docx,.pdf"
              onChange={(e) => setPgcb(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px] file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-[12px]"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              The filename date is the publication date; the energy day is the day before. Override below if the name is unusual.
            </p>
            {/* The workbook is named first because it is the one that cannot go
                wrong. A Word or PDF copy carries no sheet names, so the report's
                sections have to be inferred from its headings — that works, and
                is checked against a real report, but it is an inference and the
                review step says so with a row count for every section it found. */}
            <p className="mt-1 text-[11px] text-muted-foreground">
              <span className="font-semibold">.xlsx</span>, .xls or .xlsm is the workbook PGCB
              files, and the surest option. <span className="font-semibold">.docx</span> and{' '}
              <span className="font-semibold">.pdf</span> copies of the same report are read too —
              their sections are worked out from the document's own headings, and the review step
              lists what was found before you publish.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold">
              <FileText className="h-3.5 w-3.5" /> Petrobangla gas report (.pdf) — makes the gas day; can be uploaded alone
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPb(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px] file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-[12px]"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Gas lags the grid by a day: energy day E needs the report whose 8am–8am window <em>starts</em> on E.
              Without it the day publishes with empty gas figures.
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Uploaded <span className="font-semibold">alone</span>, the PDF is filed by its own printed
              window — when that day&apos;s grid is already on the site, its empty gas rows are filled in;
              when it is not, the gas archive publishes first and the grid follows with its workbook.
            </p>
          </div>

          <div>
            <div className="flex items-end gap-2">
              <div className="min-w-48">
                <GridDatePicker
                  label="Energy day override (optional)"
                  value={dateOverride}
                  onChange={setDateOverride}
                  archive={archive}
                  selectable={(iso) => iso <= todayIso}
                  unselectableHint="Days after today have no report yet."
                />
              </div>
              {dateOverride && (
                <button
                  type="button"
                  onClick={() => setDateOverride('')}
                  className="rounded-lg border border-border/60 px-2.5 py-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted"
                  title="Clear the override — the day is then read from the files themselves"
                >
                  Clear
                </button>
              )}
            </div>
            {latestArchiveDate && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Latest day currently on the site: <span className="font-semibold">{latestArchiveDate}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleParse}
            disabled={(!pgcb && !pb) || parsing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {parsing ? 'Parsing on this machine…' : 'Parse & preview'}
          </button>
        </div>
      </AdminCard>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/[0.06] p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400">Failed</p>
              <p className="mt-1 break-words text-[12px] text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <AdminCard title="3 · Review before publishing" icon={CheckCircle2}>
          <div className="space-y-4">
            {/* Graded, because a note saying "I corrected your data" must not
                look like a note saying "this is the wrong day's file". Falls
                back to treating everything as caution if the parser predates
                the levels. */}
            {notes.length > 0 && (
              <div className="space-y-2">
                {(['blocking', 'caution', 'info'] as const).map((level) => {
                  const group = notes.filter((n) => n.level === level);
                  if (group.length === 0) return null;
                  const style =
                    level === 'blocking'
                      ? { box: 'border-rose-500/50 bg-rose-500/[0.07]', text: 'text-rose-700 dark:text-rose-400', title: `Do not publish — ${group.length} problem${group.length > 1 ? 's' : ''}` }
                      : level === 'caution'
                        ? { box: 'border-amber-500/40 bg-amber-500/[0.07]', text: 'text-amber-700 dark:text-amber-400', title: `${group.length} thing${group.length > 1 ? 's' : ''} to check` }
                        : { box: 'border-border/50 bg-muted/25', text: 'text-muted-foreground', title: `${group.length} correction${group.length > 1 ? 's' : ''} applied automatically` };
                  return (
                    <div key={level} className={`rounded-lg border p-3 ${style.box}`}>
                      <p className={`mb-1.5 text-[12px] font-bold ${style.text}`}>{style.title}</p>
                      <ul className="space-y-1">
                        {group.map((n) => (
                          <li key={n.message} className="text-[11.5px] leading-snug text-muted-foreground">
                            • {n.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <Row label="Energy day" value={summary.energyDay} />
              {/* Filenames are the publication date, a day ahead of the data.
                  Show what the file itself states so the derivation is checkable
                  rather than taken on trust. */}
              {summary.sourceGridDate && (
                <Row
                  label="Date printed in the workbook"
                  value={
                    summary.sourceGridDate === summary.energyDay ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {summary.sourceGridDate} — matches
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">
                        {summary.sourceGridDate} — does NOT match
                      </span>
                    )
                  }
                />
              )}
              <Row label="Day peak generation" value={fmt(summary.dayPeak, 'MW')} />
              <Row label="Evening peak generation" value={fmt(summary.eveningPeak, 'MW')} />
              {/* The Grid Explorer renders this field as MKWh (million kWh); the
                  preview must use the same unit or the reviewer is comparing
                  against a number that means something else. */}
              <Row label="Total energy generated" value={fmt(summary.totalEnergy, 'MKWh')} />
              <Row
                label="Gas figures (grid summary)"
                value={summary.hasGas ? 'present' : 'empty — no PDF parsed'}
              />
              <Row label="Sections parsed" value={summary.sections.length} />
            </div>

            {gas ? (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="mb-2 text-[12px] font-bold">
                  Gas archive · {gas.gasDayStart} → {gas.gasDayEnd}
                </p>
                {gas.sourcePrintedWindow && (
                  <Row label="Window printed in the PDF" value={gas.sourcePrintedWindow} />
                )}
                <Row label="Total gas" value={`${gas.totalGasMmcfd ?? '—'} MMCFD`} />
                <Row label="Production fields" value={gas.fieldCount ?? '—'} />
                <Row label="Distribution plants" value={gas.plantCount ?? '—'} />
                <Row
                  label="Power demand vs supply"
                  value={`${gas.powerDemand ?? '—'} / ${gas.powerSupply ?? '—'} MMCFD`}
                />
                <Row label="Entities" value={gas.entityCount} />
                <Row
                  label="Reconciliation"
                  value={
                    gas.reconciled ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        passed ({gas.varianceMmcfd} MMCFD variance)
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">
                        FAILED ({gas.varianceMmcfd} MMCFD)
                      </span>
                    )
                  }
                />
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="text-[12px] text-muted-foreground">
                  No gas archive — the Gas tab and Petrobangla pages will stay on the previous day.
                </p>
              </div>
            )}

            <details className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <summary className="cursor-pointer text-[12px] font-semibold">Raw payload</summary>
              <pre className="mt-2 max-h-80 overflow-auto text-[10.5px] leading-relaxed">
                {JSON.stringify(result?.ok ? result.payload : {}, null, 2)}
              </pre>
            </details>

            {published ? (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/[0.07] p-3">
                <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
                  Published {published} — live now, no deployment needed.
                </p>
                {steps.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {steps.map((s) => (
                      <li key={`${s.artifact}:${s.key}`} className="text-[11.5px] text-muted-foreground">
                        {STEP_MARK[s.status]} {s.artifact} <span className="tabular-nums">{s.key}</span>
                        {s.status === 'unchanged' ? ' — already current' : ''}
                        {s.status === 'absent' ? ' — not produced for this day' : ''}
                        {s.status === 'failed' && s.detail ? ` — ${s.detail}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <button
                onClick={handlePublish}
                // A blocking note means the parse produced something that must
                // not reach the site — the wrong day's PDF, a failed
                // reconciliation. Disabling is the honest response; a warning
                // beside an enabled button invites publishing anyway.
                disabled={publishing || blocking.length > 0}
                title={blocking.length > 0 ? 'Resolve the problems above before publishing' : undefined}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {publishing ? 'Publishing…' : `Publish ${summary.energyDay} to the site`}
              </button>
            )}
          </div>
        </AdminCard>
      )}
    </div>
  );
}
