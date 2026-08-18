'use client';

/**
 * BPDB's annual accounts, beside the daily fuel-only table.
 *
 * The daily table prices electricity by the fuel burnt that day, because that
 * is all PGCB publishes daily. Read on its own it says imports are the
 * cheapest power on the grid, at around 6 Tk/kWh -- an artefact of imports
 * having no fuel line at all, not a finding about imports. This card puts
 * BPDB's own accounts next to it: what BPDB paid, per head, for a whole
 * financial year, and what a unit from each source actually cost once the
 * purchase price rather than the fuel bill is used.
 *
 * Everything from the accounts is Published. The rates marked Derived are one
 * division each, and both of their published inputs are shown so the arithmetic
 * can be checked without opening the PDF.
 *
 * Built from the explorer's own card vocabulary -- `grid-explorer-chart-card`,
 * the KPI strip, the mix stack, the data table, the explanation block and the
 * card footer -- rather than a private set of boxes, so it carries the same
 * weight as the cards it sits between.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Coins, Factory, Flame, Globe, Landmark, Scale, Wallet, Zap } from 'lucide-react';

import {
  BPDB_ANNUAL_ACCOUNTS,
  BPDB_IMPORT_CAVEAT,
  BPDB_OWN_GENERATION_NOTE,
  type BpdbAnnualAccounts,
  type BpdbCostGroup,
} from '@/lib/data/bpdb-annual-accounts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { cn } from '@/lib/utils';

import {
  GridCardFooter,
  GridDataBadge,
  GridExplanationBlock,
  GridKpiCell,
  GridKpiStrip,
  GridProvenanceTag,
} from './GridExplorerUI';
import { CustomDropdown } from './shared';

const GROUP_LABEL: Record<BpdbCostGroup, string> = {
  purchase: 'Electricity BPDB bought',
  'own-fuel': 'Fuel BPDB burnt itself',
  fixed: 'Fixed and staff costs',
  network: 'Network charges',
};

/**
 * Cost heads are not fuels, so they take the categorical slots rather than the
 * fuel palette -- assigned in a fixed order here so a year missing a group does
 * not repaint the others. These were four hand-picked Tailwind utilities until
 * now, outside the validated table and never checked for CVD separation.
 */
const GROUP_SLOT: Record<BpdbCostGroup, number> = {
  purchase: 0,
  'own-fuel': 1,
  fixed: 2,
  network: 3,
};

/**
 * How BPDB labels the generation it paid for. `SingleBuyerTotal` is the sum of
 * the others, not a peer -- including it as a segment would double the bar.
 */
const SOURCE_LABEL: Record<string, string> = {
  PublicSector: 'Public sector',
  JointVenture: 'Joint venture',
  PrivateSector: 'Private — IPP & rental',
  PowerImport: 'Imported from India',
};
const SOURCE_ORDER = ['PublicSector', 'JointVenture', 'PrivateSector', 'PowerImport'];

const fmtCrore = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Headline form of the same figure: a KPI tile is read, not audited. */
const fmtCroreShort = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: 0 });

/**
 * Crore BDT over MkWh, in Taka per kWh. One Crore is 1e7 Taka and one MkWh is
 * 1e6 kWh, so the conversion is a factor of ten -- written out because getting
 * it wrong by an order of magnitude would still look plausible.
 */
const perUnit = (crore: number, mkwh: number) => (crore * 1e7) / (mkwh * 1e6);

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
  const chartTheme = useChartTheme();

  // The explorer's own dropdown, so the one control on this card behaves like
  // the Year / Month / Day controls above it. Each of those has its outside-
  // click handled by the page's single listener; this card owns its own,
  // because it is mounted independently of that component's ref list.
  const [fyOpen, setFyOpen] = useState(false);
  const fyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fyOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (fyRef.current && !fyRef.current.contains(e.target as Node)) setFyOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFyOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [fyOpen]);

  // Newest first, against the ascending order the dataset is written in: the
  // card opens on the newest year, so the selected row is the one at the top of
  // the menu, and it is the year a reader opening annual accounts usually wants.
  //
  // Labelled without the "FY", which the trigger's own prefix already carries;
  // repeating it down every row of the menu adds nothing to tell them apart.
  const fyOptions = useMemo(
    () => [...years].reverse().map((y) => ({ label: y.fy, value: y.fy })),
    [years],
  );

  const heads = useMemo(() => [...year.heads].sort((a, b) => b.crore - a.crore), [year]);
  const headsTotal = heads.reduce((s, h) => s + h.crore, 0);
  // BPDB prints the total itself; showing our sum beside it is the check.
  const printedTotal = year.totalOperatingExpensesCrore;
  const reconciles = Math.abs(headsTotal - printedTotal) <= 0.05;

  /** The four cost groups, largest first, for the stack above the table. */
  const groups = useMemo(() => {
    const byGroup = new Map<BpdbCostGroup, number>();
    for (const h of heads) byGroup.set(h.group, (byGroup.get(h.group) ?? 0) + h.crore);
    return [...byGroup.entries()]
      .map(([group, crore]) => ({ group, crore }))
      .sort((a, b) => b.crore - a.crore);
  }, [heads]);

  const imp = year.derived.importUnitCost;
  const priv = year.derived.privateUnitCost;
  const sys = year.derived.systemAllInUnitCost;
  const pubAllIn = year.published.generationCostPerUnit;
  const pubFuel = year.published.fuelCostPerUnitThermal;

  // What the accounts say about the year as a whole, rather than per unit.
  const sales = year.energySalesCrore;
  const subsidy = year.subsidyCrore;
  const operatingGap = sales != null ? printedTotal - sales : null;
  // Deliberately NOT "opex minus sales minus subsidy". BPDB has income lines
  // beyond energy sales, so a residual computed from these three would be a
  // deficit figure the accounts never state -- and its sign flips across years.
  const subsidyShareOfGap =
    operatingGap != null && operatingGap > 0 && subsidy != null
      ? (subsidy / operatingGap) * 100
      : null;

  // What a unit cost BPDB against what BPDB sold it for. Only the years that
  // publish both carry this, which is currently FY 2022-23 alone.
  const cost = year.published.bulkSupplyCostPerUnit;
  const tariff = year.published.bulkTariffPerUnit;
  const recovery = cost && tariff ? (tariff.value / cost.value) * 100 : null;

  // Where the electricity BPDB paid for came from. SingleBuyerTotal is the sum
  // of the rest, so it is the published check, never a segment.
  const sources = useMemo(() => {
    const rows = SOURCE_ORDER.filter((k) => (year.generationMkwh[k] ?? 0) > 0).map((k) => ({
      key: k,
      label: SOURCE_LABEL[k] ?? k,
      mkwh: year.generationMkwh[k],
    }));
    const segmentSum = rows.reduce((s, r) => s + r.mkwh, 0);
    return { rows, segmentSum, printed: year.generationMkwh.SingleBuyerTotal };
  }, [year]);

  return (
    <div className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
        <Landmark className="h-5 w-5 text-primary shrink-0" />
        <div className="min-w-0">
          <h3 className="grid-explorer-chart-card__title">
            BPDB Annual Accounts
            {/* Same cadence badge the rest of the explorer uses, rather than a
                bare uncoloured superscript. */}
            <GridDataBadge cadence="monthly" label="Annual" />
          </h3>
          <p className="grid-explorer-chart-card__sub">
            Purchase prices over a whole financial year, from BPDB&rsquo;s own published accounts —
            the capacity payments and contracted charges a daily fuel bill cannot show
          </p>
        </div>
        {/* Right-aligned menu: the card runs to the page edge on wide layouts,
            and a left-aligned one would open past it. */}
        <div className="relative z-50 ml-auto w-36 shrink-0 sm:w-40">
          <CustomDropdown
            value={fy}
            onChange={setFy}
            options={fyOptions}
            placeholder="Financial year"
            isOpen={fyOpen}
            setIsOpen={setFyOpen}
            dropdownRef={fyRef}
            icon={<Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />}
            prefixLabel="FY"
            layout="list"
            align="right"
            noBackground
            // One row per published financial year, and BPDB adds at most one a
            // year — the whole set renders without a scrollbar.
            boundedList
          />
        </div>
      </div>

      {/* What a unit cost, by where it came from. */}
      <GridKpiStrip className="grid-explorer-kpi-strip--four">
        <GridKpiCell
          icon={Globe}
          label="Imports, annual"
          value={imp ? `${imp.value.toFixed(2)} Tk` : '—'}
          provenance="D"
          hint={
            imp
              ? `${fmtCrore(imp.numeratorCrore)} Cr ÷ ${imp.denominatorMkwh.toLocaleString('en-US')} MkWh`
              : `Not separable in FY ${year.fy}`
          }
        />
        <GridKpiCell
          icon={Factory}
          label="IPP & rental"
          value={priv ? `${priv.value.toFixed(2)} Tk` : '—'}
          provenance="D"
          hint={
            priv
              ? `${fmtCrore(priv.numeratorCrore)} Cr ÷ ${priv.denominatorMkwh.toLocaleString('en-US')} MkWh`
              : `Not separable in FY ${year.fy}`
          }
        />
        <GridKpiCell
          icon={Zap}
          label="All-in generation"
          value={pubAllIn ? `${pubAllIn.value.toFixed(2)} Tk` : '—'}
          provenance="P"
          hint={pubAllIn ? `BPDB's own figure, FY ${year.fy}` : `Not printed for FY ${year.fy}`}
        />
        <GridKpiCell
          icon={Flame}
          label="Thermal fuel only"
          value={pubFuel ? `${pubFuel.value.toFixed(2)} Tk` : '—'}
          provenance="P"
          hint={pubFuel ? `BPDB's own figure, FY ${year.fy}` : `Not printed for FY ${year.fy}`}
        />
      </GridKpiStrip>

      {/* What the year cost and what came in against it. */}
      <GridKpiStrip className="grid-explorer-kpi-strip--four mt-1">
        <GridKpiCell
          icon={Wallet}
          label="Operating expenditure"
          value={`${fmtCroreShort(printedTotal)} Cr`}
          provenance="P"
          hint="Total operating expenses, Crore BDT"
        />
        <GridKpiCell
          icon={Coins}
          label="Energy sales revenue"
          value={sales != null ? `${fmtCroreShort(sales)} Cr` : '—'}
          provenance="P"
          hint={sales != null ? 'Revenue from energy sales' : `Not printed for FY ${year.fy}`}
        />
        <GridKpiCell
          icon={Landmark}
          label="Government subsidy"
          value={subsidy != null ? `${fmtCroreShort(subsidy)} Cr` : '—'}
          provenance="P"
          hint={
            subsidyShareOfGap != null
              ? `Covers ${subsidyShareOfGap.toFixed(0)}% of the shortfall`
              : `Not stated for FY ${year.fy}`
          }
        />
        <GridKpiCell
          icon={Scale}
          label="Cost recovered in tariff"
          value={recovery != null ? `${recovery.toFixed(0)}%` : '—'}
          provenance="D"
          hint={
            cost && tariff
              ? `Sold at ${tariff.value.toFixed(2)} against ${cost.value.toFixed(2)} Tk/kWh`
              : `Bulk tariff not printed for FY ${year.fy}`
          }
        />
      </GridKpiStrip>

      {/* Operating expenditure, grouped then itemised. */}
      <div className="mt-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Operating expenditure by head
            <GridProvenanceTag kind="P" className="ml-1.5" />
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {fmtCrore(printedTotal)} Crore BDT
          </span>
        </div>

        <div className="grid-explorer-mix-stack" aria-hidden>
          {groups.map((g) => (
            <div
              key={g.group}
              className="grid-explorer-mix-stack__seg"
              style={{
                width: `${(g.crore / headsTotal) * 100}%`,
                backgroundColor: chartTheme.categorical(GROUP_SLOT[g.group]),
              }}
            />
          ))}
        </div>

        {/* The stack encodes the group in colour; this names each one beside its
            swatch, so identity never rests on the colour alone. The shares are
            this page's arithmetic over BPDB's amounts, so the row says so. */}
        <div className="-mt-2 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[10px] text-muted-foreground/80">
            Share of total
            <GridProvenanceTag kind="D" className="ml-1" />
          </span>
          {groups.map((g) => (
            <span
              key={g.group}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: chartTheme.categorical(GROUP_SLOT[g.group]) }}
                aria-hidden
              />
              <span className="text-foreground">{GROUP_LABEL[g.group]}</span>
              <span className="tabular-nums">{((g.crore / headsTotal) * 100).toFixed(1)}%</span>
            </span>
          ))}
        </div>

        <div className="grid-explorer-table-wrap grid-explorer-table-wrap--compact">
          <table className="grid-explorer-table grid-explorer-table--stack">
            <thead>
              <tr>
                <th>Cost head</th>
                <th className="text-left">Group</th>
                {/* Marked per column, as every other table on the explorer is:
                    the amount is BPDB's, the share is this page's division. */}
                <th className="text-right">
                  Crore BDT
                  <GridProvenanceTag kind="P" className="ml-1" />
                </th>
                <th className="text-right">
                  Share
                  <GridProvenanceTag kind="D" className="ml-1" />
                </th>
              </tr>
            </thead>
            <tbody>
              {heads.map((h) => (
                <tr key={h.key}>
                  <td className="font-semibold text-foreground">{h.label}</td>
                  <td data-label="Group" className="text-left">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ backgroundColor: chartTheme.categorical(GROUP_SLOT[h.group]) }}
                        aria-hidden
                      />
                      {GROUP_LABEL[h.group]}
                    </span>
                  </td>
                  {/* A head the two extraction engines read differently, settled
                      against BPDB's own printed total. Still published — but it
                      was not read cleanly twice, and saying so is the point of
                      marking anything at all. */}
                  <td data-label="Crore BDT" className="text-right tabular-nums">
                    {h.resolvedBy && (
                      <span
                        className="mr-1 cursor-help font-bold text-amber-500"
                        title={`The two extraction engines disagreed on this head; the figure shown is the one BPDB's ${h.resolvedBy} supports.`}
                        aria-label={`Reconciled against BPDB's ${h.resolvedBy}`}
                      >
                        †
                      </span>
                    )}
                    {fmtCrore(h.crore)}
                  </td>
                  <td data-label="Share" className="text-right tabular-nums text-muted-foreground">
                    {((h.crore / headsTotal) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="is-total border-t border-border/80 bg-muted/20 font-bold">
                <td>Total operating expenses</td>
                <td />
                <td data-label="Crore BDT" className="text-right tabular-nums text-primary">{fmtCrore(printedTotal)}</td>
                <td data-label="Share" className="text-right tabular-nums text-primary">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Who generated the power BPDB paid for. An ownership split, not a fuel
          split: it is what the purchase heads above were spent on. */}
      {sources.rows.length > 1 && (
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Where the power came from
              <GridProvenanceTag kind="P" className="ml-1.5" />
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {(sources.printed ?? sources.segmentSum).toLocaleString('en-US')} MkWh
            </span>
          </div>

          <div className="grid-explorer-mix-stack" aria-hidden>
            {sources.rows.map((r, i) => (
              <div
                key={r.key}
                className="grid-explorer-mix-stack__seg"
                style={{
                  width: `${(r.mkwh / sources.segmentSum) * 100}%`,
                  backgroundColor: chartTheme.categorical(i),
                }}
              />
            ))}
          </div>

          {/* MkWh is BPDB's; the percentage beside it is this page's. */}
          <div className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[10px] text-muted-foreground/80">
              MkWh <GridProvenanceTag kind="P" /> · share <GridProvenanceTag kind="D" />
            </span>
            {sources.rows.map((r, i) => (
              <span
                key={r.key}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: chartTheme.categorical(i) }}
                  aria-hidden
                />
                <span className="text-foreground">{r.label}</span>
                <span className="tabular-nums">
                  {r.mkwh.toLocaleString('en-US')} MkWh ·{' '}
                  {((r.mkwh / sources.segmentSum) * 100).toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <GridExplanationBlock
        className="mt-4 rounded-lg border border-border/40"
        what={
          <>
            <p>
              PGCB publishes a fuel cost daily; nobody publishes a daily all-in cost. BPDB&rsquo;s
              audited accounts do, once a year, and this card reads FY {year.fy} of them. The four
              rates above are per unit: the two marked{' '}
              <GridProvenanceTag kind="D" /> divide one published figure by another and print both
              inputs, the two marked <GridProvenanceTag kind="P" /> are BPDB&rsquo;s own. The
              expenditure table is every head BPDB itemises, and{' '}
              {reconciles ? (
                <>
                  the {heads.length} of them sum to {fmtCrore(headsTotal)} Crore BDT against the{' '}
                  {fmtCrore(printedTotal)} Crore BDT printed as Total Operating Expenses — they
                  reconcile.
                </>
              ) : (
                <>
                  the {heads.length} of them sum to {fmtCrore(headsTotal)} Crore BDT against the{' '}
                  {fmtCrore(printedTotal)} Crore BDT printed as Total Operating Expenses, a
                  difference of {fmtCrore(Math.abs(headsTotal - printedTotal))} Crore. Both figures
                  are as published; the discrepancy is BPDB&rsquo;s.
                </>
              )}
              {sources.printed != null && (
                <>
                  {' '}
                  The {sources.rows.length} generation sources sum to{' '}
                  {sources.segmentSum.toLocaleString('en-US')} MkWh against the{' '}
                  {sources.printed.toLocaleString('en-US')} MkWh printed as the single-buyer total
                  {Math.abs(sources.segmentSum - sources.printed) <= 2
                    ? ', which reconciles too.'
                    : `, a difference of ${Math.abs(sources.segmentSum - sources.printed).toLocaleString('en-US')} MkWh.`}
                </>
              )}
            </p>
            {sys && cost && (
              <p>
                Dividing that total by the {year.bulkSalesMkwh?.toLocaleString('en-US')} MkWh BPDB
                reports selling in bulk gives {sys.value.toFixed(2)} Tk/kWh{' '}
                <GridProvenanceTag kind="D" />, against the {cost.value.toFixed(2)} Tk/kWh BPDB
                prints as its average bulk supply cost <GridProvenanceTag kind="P" />. BPDB does not
                state which denominator it used, so the two are close rather than identical.
              </p>
            )}
            {/* How the numbers got off the PDF. Without this the P mark says
                only "BPDB printed it", not "and it was read correctly". */}
            <p>
              <strong>How these were extracted.</strong> BPDB publishes the accounts as a PDF, not
              as data. Two engines read every figure independently — one by column geometry, one by
              requiring BPDB&rsquo;s own Performance-over-Budget column to reconcile — and a figure
              ships only where the two agree, or where BPDB&rsquo;s printed total settles the
              disagreement. A figure settled that way is marked{' '}
              <span className="font-bold text-amber-500">†</span> in the table
              {heads.some((h) => h.resolvedBy) ? (
                <>
                  {' '}
                  — {heads.filter((h) => h.resolvedBy).length} of the {heads.length} heads this year
                </>
              ) : (
                <>, and no head this year needed it</>
              )}
              . Amounts print in Lac Taka on the older reports and Crore on the newer ones; the unit
              is read off each page rather than assumed, because taking it for granted is a
              factor-of-100 error.
            </p>
            <p>
              <strong>What is not here.</strong> Coverage stops at FY {years[years.length - 1].fy}.
              BPDB lists FY 2023-24 and FY 2024-25 with no file attached, and every report before FY{' '}
              {years[0].fy} is a page scan with no text layer. Neither gap is filled by inference,
              and FY 2021-22 is absent from the series for the same reason — so this is not
              current-year data. {BPDB_IMPORT_CAVEAT}
            </p>
            <p className="text-muted-foreground/90">{BPDB_OWN_GENERATION_NOTE}</p>
          </>
        }
        insight={
          <>
            {dailyImportRate != null && dailyImportRate > 0 && imp && (
              <>
                The daily table prices imports at {dailyImportRate.toFixed(2)} Tk/kWh; BPDB paid{' '}
                {imp.value.toFixed(2)} Tk/kWh for the same electricity across the year, because a
                daily figure is a fuel cost and imported power has no fuel line at all.{' '}
              </>
            )}
            {priv && imp && (
              <>
                Against {priv.value.toFixed(2)} Tk/kWh for power bought from private producers,
                imports were the cheaper purchase that year, not the dearer one.{' '}
              </>
            )}
            {operatingGap != null && operatingGap > 0 && (
              <>
                BPDB spent {fmtCrore(operatingGap)} Crore BDT more than it earned selling energy
                {subsidyShareOfGap != null && (
                  <>, and a subsidy covered {subsidyShareOfGap.toFixed(0)}% of that shortfall</>
                )}
                ; BPDB books other income beyond energy sales, so this is not its bottom line.{' '}
              </>
            )}
            {cost && tariff && recovery != null && (
              <>
                A unit cost {cost.value.toFixed(2)} Tk/kWh to supply in bulk and sold for{' '}
                {tariff.value.toFixed(2)} — a shortfall of{' '}
                {(cost.value - tariff.value).toFixed(2)} Tk on every kWh, which is what the subsidy
                is for.
              </>
            )}
            {!imp && !operatingGap && BPDB_IMPORT_CAVEAT}
          </>
        }
      />

      <GridCardFooter>
        <span>
          Source:{' '}
          {year.source.url ? (
            <a
              href={year.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
              title={year.source.url}
            >
              {year.source.file}
            </a>
          ) : (
            <span className="text-foreground">{year.source.file}</span>
          )}{' '}
          — {year.source.statement}
          {year.source.printedUnit !== 'Crore BDT' && (
            <>, printed in {year.source.printedUnit} and converted (1 Crore = 100 Lac)</>
          )}
        </span>
        <span>As published. Not independently audited.</span>
        <span className="font-medium">Reporting Period: Financial year {year.fy}</span>
        <span className={cn('text-muted-foreground/80')}>
          Series ends at FY {years[years.length - 1].fy} — BPDB lists FY 2023-24 and FY 2024-25 with
          no file attached, and its earlier reports are page scans with no readable text.
        </span>
      </GridCardFooter>
    </div>
  );
}
