'use client';

/**
 * BPDB's annual accounts, beside the daily fuel-only table.
 *
 * The daily table prices electricity by the fuel burnt that day, because that
 * is all PGCB publishes daily. Read on its own it says imports are the
 * cheapest power on the grid, at around 6 Tk/kWh -- an artefact of imports
 * having no fuel line at all, not a finding about imports. This panel puts
 * BPDB's own accounts next to it: what BPDB paid, per head, for a whole
 * financial year, and what a unit from each source actually cost once the
 * purchase price rather than the fuel bill is used.
 *
 * Everything from the accounts is Published. The three per-unit rates marked
 * Derived are one division each, and both of their published inputs are shown
 * so the arithmetic can be checked without opening the PDF.
 */

import { useMemo, useState } from 'react';

import {
  BPDB_ANNUAL_ACCOUNTS,
  BPDB_IMPORT_CAVEAT,
  BPDB_OWN_GENERATION_NOTE,
  type BpdbAnnualAccounts,
  type BpdbCostGroup,
} from '@/lib/data/bpdb-annual-accounts';

import { GridProvenanceTag } from './GridExplorerUI';

const GROUP_LABEL: Record<BpdbCostGroup, string> = {
  'own-fuel': 'Fuel BPDB burnt itself',
  purchase: 'Electricity BPDB bought',
  fixed: 'Fixed and staff costs',
  network: 'Network charges',
};

/** Deliberately not a per-fuel palette — these are cost heads, not fuels. */
const GROUP_COLOR: Record<BpdbCostGroup, string> = {
  'own-fuel': 'bg-orange-500',
  purchase: 'bg-sky-500',
  fixed: 'bg-violet-500',
  network: 'bg-emerald-500',
};

const fmtCrore = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Crore BDT over MkWh, in Taka per kWh. One Crore is 1e7 Taka and one MkWh is
 * 1e6 kWh, so the conversion is a factor of ten -- written out because getting
 * it wrong by an order of magnitude would still look plausible.
 */
const perUnit = (crore: number, mkwh: number) => (crore * 1e7) / (mkwh * 1e6);

function RateTile({
  label,
  value,
  kind,
  note,
  tone = 'neutral',
  workings,
}: {
  label: string;
  value: number;
  kind: 'P' | 'D';
  note: string;
  tone?: 'neutral' | 'warn';
  workings?: string;
}) {
  return (
    <div
      className={
        'rounded-lg border px-2.5 py-2 ' +
        (tone === 'warn'
          ? 'border-amber-500/30 bg-amber-500/[0.07]'
          : 'border-border/40 bg-card/60')
      }
      title={workings}
    >
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label} <GridProvenanceTag kind={kind} />
      </div>
      <div
        className={
          'text-base font-bold tabular-nums ' +
          (tone === 'warn' ? 'text-amber-600 dark:text-amber-500' : 'text-foreground')
        }
      >
        {value.toFixed(2)}
      </div>
      <div className="text-[9px] text-muted-foreground">{note}</div>
    </div>
  );
}

export function BpdbAccountsPanel({
  /** The Imports rate from the daily fuel-only table, for the contrast. */
  dailyImportRate,
}: {
  dailyImportRate?: number | null;
}) {
  const years = BPDB_ANNUAL_ACCOUNTS;
  const [fy, setFy] = useState(years[years.length - 1].fy);
  const year = useMemo<BpdbAnnualAccounts>(
    () => years.find((y) => y.fy === fy) ?? years[years.length - 1],
    [years, fy],
  );

  const heads = useMemo(
    () => [...year.heads].sort((a, b) => b.crore - a.crore),
    [year],
  );
  const headsTotal = heads.reduce((s, h) => s + h.crore, 0);
  // BPDB prints the total itself; showing our sum beside it is the check.
  const printedTotal = year.totalOperatingExpensesCrore;
  const reconciles = Math.abs(headsTotal - printedTotal) <= 0.05;

  const imp = year.derived.importUnitCost;
  const priv = year.derived.privateUnitCost;
  const sys = year.derived.systemAllInUnitCost;
  const pubAllIn = year.published.generationCostPerUnit;
  const pubFuel = year.published.fuelCostPerUnitThermal;

  return (
    <div className="mb-3 rounded-xl border border-border/50 bg-muted/15 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground font-semibold text-[11px]">
          What BPDB actually paid, from its own annual accounts
        </p>
        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Financial year</span>
          <select
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            className="rounded-md border border-border/50 bg-card px-1.5 py-0.5 text-[10px] text-foreground"
            aria-label="BPDB accounts financial year"
          >
            {years.map((y) => (
              <option key={y.fy} value={y.fy}>
                FY {y.fy}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/*
        The headline contrast. The daily table's Imports rate and BPDB's annual
        one measure the same electricity and disagree by roughly half, because
        the daily figure is a fuel cost and imported power has no fuel line.
      */}
      {imp && (
        <p className="mb-2.5 text-[11px] leading-relaxed">
          {dailyImportRate != null && dailyImportRate > 0 && (
            <>
              The table above prices imports at{' '}
              <strong className="text-foreground tabular-nums">
                {dailyImportRate.toFixed(2)} Tk/kWh
              </strong>{' '}
              today.{' '}
            </>
          )}
          BPDB&apos;s accounts say it paid{' '}
          <strong className="text-foreground tabular-nums">
            {imp.value.toFixed(2)} Tk/kWh
          </strong>{' '}
          for imported electricity across FY {year.fy} —{' '}
          {fmtCrore(imp.numeratorCrore)} Crore BDT for{' '}
          {imp.denominatorMkwh.toLocaleString('en-US')} MkWh
          {priv && (
            <>
              {' '}
              — against{' '}
              <strong className="text-foreground tabular-nums">
                {priv.value.toFixed(2)} Tk/kWh
              </strong>{' '}
              for power bought from private producers
            </>
          )}
          . These are purchase prices for a whole year, so unlike the daily table they
          already contain the capacity payments and contracted charges that a fuel cost
          cannot show.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {imp && (
          <RateTile
            label="Imports, annual"
            value={imp.value}
            kind="D"
            tone="warn"
            note={`Tk/kWh — FY ${year.fy}`}
            workings={`${fmtCrore(imp.numeratorCrore)} Crore BDT ÷ ${imp.denominatorMkwh.toLocaleString('en-US')} MkWh. ${BPDB_IMPORT_CAVEAT}`}
          />
        )}
        {priv && (
          <RateTile
            label="IPP + rental"
            value={priv.value}
            kind="D"
            tone="warn"
            note={`Tk/kWh — FY ${year.fy}`}
            workings={`${fmtCrore(priv.numeratorCrore)} Crore BDT ÷ ${priv.denominatorMkwh.toLocaleString('en-US')} MkWh`}
          />
        )}
        {/*
          Both of these are BPDB's own per-unit figures for this financial
          year. The card further down the page carries a different and more
          recent BPDB all-in rate from the annual tariff series, so each says
          which year it belongs to -- two unlabelled "BPDB all-in" numbers on
          one screen read as a contradiction rather than as two years.
        */}
        {pubAllIn && (
          <RateTile
            label={`All-in generation, FY ${year.fy}`}
            value={pubAllIn.value}
            kind="P"
            note="Tk/kWh — BPDB's own figure"
            workings={`Printed by BPDB in ${pubAllIn.source}, Key Statistics`}
          />
        )}
        {pubFuel && (
          <RateTile
            label={`Thermal fuel only, FY ${year.fy}`}
            value={pubFuel.value}
            kind="P"
            note="Tk/kWh — BPDB's own figure"
            workings={`Printed by BPDB in ${pubFuel.source}, Key Statistics. ${BPDB_OWN_GENERATION_NOTE}`}
          />
        )}
      </div>

      {/* The cost heads themselves, largest first. */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Operating expenditure by head, FY {year.fy} <GridProvenanceTag kind="P" />
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {fmtCrore(printedTotal)} Crore BDT total
          </span>
        </div>
        <ul className="space-y-1">
          {heads.map((h) => {
            const pct = (h.crore / headsTotal) * 100;
            return (
              <li key={h.key} className="flex items-center gap-2 text-[10px]">
                <span
                  className={`h-2 w-2 shrink-0 rounded-sm ${GROUP_COLOR[h.group]}`}
                  aria-hidden
                />
                <span className="w-[42%] shrink-0 truncate text-foreground" title={GROUP_LABEL[h.group]}>
                  {h.label}
                </span>
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border/40">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${GROUP_COLOR[h.group]} opacity-70`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                  {fmtCrore(h.crore)}
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/*
        BPDB's own arithmetic failing is a finding, not a reason to withhold
        its figures -- so the check is reported either way rather than used as
        a filter. It has held to within a paisa in every year extracted.
      */}
      <p className="mt-2 text-[10px] text-muted-foreground">
        {reconciles ? (
          <>
            These {heads.length} heads sum to {fmtCrore(headsTotal)} Crore BDT against the{' '}
            {fmtCrore(printedTotal)} Crore BDT BPDB prints as Total Operating Expenses — they
            reconcile.
          </>
        ) : (
          <>
            These {heads.length} heads sum to {fmtCrore(headsTotal)} Crore BDT against the{' '}
            {fmtCrore(printedTotal)} Crore BDT BPDB prints as Total Operating Expenses, a
            difference of {fmtCrore(Math.abs(headsTotal - printedTotal))} Crore. Both figures are
            as published; the discrepancy is BPDB&apos;s.
          </>
        )}
      </p>

      {sys && year.published.bulkSupplyCostPerUnit && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Dividing that total by the {year.bulkSalesMkwh?.toLocaleString('en-US')} MkWh BPDB
          reports selling in bulk gives {sys.value.toFixed(2)} Tk/kWh{' '}
          <GridProvenanceTag kind="D" />, against the{' '}
          {year.published.bulkSupplyCostPerUnit.value.toFixed(2)} Tk/kWh BPDB prints as its
          average bulk supply cost <GridProvenanceTag kind="P" />. BPDB does not state which
          denominator it used, so the two are close rather than identical.
        </p>
      )}

      <p className="mt-2 border-t border-border/30 pt-2 text-[10px] text-muted-foreground">
        Source:{' '}
        {year.source.url ? (
          <a
            href={year.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
            title={year.source.url}
          >
            {year.source.file}
          </a>
        ) : (
          <span className="text-foreground">{year.source.file}</span>
        )}
        , {year.source.statement}
        {year.source.printedUnit !== 'Crore BDT' && (
          <> — printed in {year.source.printedUnit}, converted to Crore BDT (1 Crore = 100 Lac)</>
        )}
        . Published by Bangladesh Power Development Board at bpdb.gov.bd.{' '}
        <strong className="text-foreground">
          The series stops at FY {years[years.length - 1].fy}
        </strong>{' '}
        — BPDB lists FY 2023-24 and FY 2024-25 with no file attached, and its earlier reports are
        page scans with no readable text.
      </p>
    </div>
  );
}
