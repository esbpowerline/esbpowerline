'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Loader2, Rocket, Sun } from 'lucide-react';
import { AdminCard } from '@/components/admin/AdminUI';

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
      payload: Record<string, unknown>;
      /** Full Petrobangla day — null when no PDF was supplied or it failed. */
      gasArchive: Record<string, unknown> | null;
      validation: { warnings: string[]; summary: ParseSummary; gas: GasSummary | null };
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
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SredaResult | null>(null);

  async function refresh() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/data/sreda', { method: 'POST' });
      setResult((await res.json()) as SredaResult);
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

export function DataIngestPanel({
  status,
  latestSredaDate,
}: {
  status: IngestStatus;
  latestSredaDate: string | null;
}) {
  const latestArchiveDate = status.latestGridDay;
  const [pgcb, setPgcb] = useState<File | null>(null);
  const [pb, setPb] = useState<File | null>(null);
  const [dateOverride, setDateOverride] = useState('');

  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [published, setPublished] = useState<string | null>(null);
  const [steps, setSteps] = useState<Array<{ artifact: string; ok: boolean; detail?: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!pgcb) return;
    setParsing(true);
    setError(null);
    setResult(null);
    setPublished(null);
    try {
      const body = new FormData();
      body.append('pgcb', pgcb);
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
      // One call publishes all five artifacts — the two day files and the three
      // aggregates rebuilt from them — so the site never shows a new grid day
      // beside yesterday's gas totals.
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
        steps?: Array<{ artifact: string; ok: boolean; detail?: string }>;
        note?: string;
      };
      setSteps(json.steps ?? []);
      if (!json.ok) {
        setError(json.error ?? 'Publish failed');
        return;
      }
      setPublished(result.date);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }

  const summary = result?.ok ? result.validation.summary : null;
  const gas = result?.ok ? result.validation.gas : null;
  const warnings = result?.ok ? result.validation.warnings : [];

  return (
    <div className="space-y-4">
      <StatusBanner status={status} />

      <SredaCard latestSredaDate={latestSredaDate} />

      <AdminCard title="1 · Upload the source files" icon={Upload}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold">
              <FileSpreadsheet className="h-3.5 w-3.5" /> PGCB daily report (.xlsx) — required
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setPgcb(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px] file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-[12px]"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              The filename date is the publication date; the energy day is the day before. Override below if the name is unusual.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold">
              <FileText className="h-3.5 w-3.5" /> Petrobangla gas report (.pdf) — optional
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
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold">Energy day override (optional)</label>
            <input
              type="date"
              value={dateOverride}
              onChange={(e) => setDateOverride(e.target.value)}
              className="rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px]"
            />
            {latestArchiveDate && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Latest day currently on the site: <span className="font-semibold">{latestArchiveDate}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleParse}
            disabled={!pgcb || parsing}
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
        <AdminCard title="2 · Review before publishing" icon={CheckCircle2}>
          <div className="space-y-4">
            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/[0.07] p-3">
                <p className="mb-1.5 text-[12px] font-bold text-amber-700 dark:text-amber-400">
                  {warnings.length} thing{warnings.length > 1 ? 's' : ''} to check
                </p>
                <ul className="space-y-1">
                  {warnings.map((w) => (
                    <li key={w} className="text-[11.5px] leading-snug text-muted-foreground">• {w}</li>
                  ))}
                </ul>
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
                      <li key={s.artifact} className="text-[11.5px] text-muted-foreground">
                        {s.ok ? '✓' : '✗'} {s.artifact}
                        {s.detail ? ` — ${s.detail}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <button
                onClick={handlePublish}
                disabled={publishing}
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
