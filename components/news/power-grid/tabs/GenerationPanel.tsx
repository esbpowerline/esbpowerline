'use client';

import type * as React from 'react';
import { Info, Zap, CheckSquare, Activity, BarChart3, Droplet } from 'lucide-react';
import { GridLockedContent } from '@/components/news/power-grid/GridLockedContent';
import { GenerationKpiStrip } from '@/components/news/power-grid/TabKpiStrips';
import { EnergyCurveChart } from '@/components/news/power-grid/EnergyCurveChart';
import { DailyBadge, GridProvenanceTag, GridCardFooter, GridSourceFiles } from '@/components/news/power-grid/GridExplorerUI';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { cn, formatBdtAmount, formatUnitRate } from '@/lib/utils';
import { UnitCostBadge } from '@/components/news/power-grid/UnitCostBadge';
import { macroTariffData } from '@/lib/data/macro/tariff';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { type UnitCostFact } from '@/components/news/power-grid/useUnitCostAuthentication';
import { BpdbAccountsPanel } from '@/components/news/power-grid/BpdbAccountsPanel';
import { DEMO_DATE } from '@/components/news/power-grid/tabs/shared';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import type { GridGenerationItem, GridSystemStats } from '@/lib/data/grid/types';
import type { ChartTheme } from '@/hooks/useChartTheme';

export type GenerationPanelProps = {
  /** The selected day and the payload read from it. */
  day: {
    selectedDate: string;
    tierLockRequired: GridAccessTier | null;
    systemStats: GridSystemStats;
    generationData: GridGenerationItem[];
    sourceFiles: { pgcb?: string | undefined; petrobangla?: string | undefined; } | undefined;
  };
  /** Values the parent derives from the day (totals, chart series, flags). */
  derived: {
    totalGenMkwhr: number;
    totalCostBdt: number;
    unitCostAuth: { loaded: boolean; administeredNote: string | null; witnessThrough: string | null; beyondWitnessCoverage: boolean; factFor(fuelName: string, ownUnitCost: number | null): UnitCostFact | undefined; };
    hasPublishedFuelCost: boolean;
    avgCostPerKwh: number;
  };
  /** View state and theme the parent owns; kept there so it survives a tab switch exactly as before. */
  ui: {
    chartTheme: ChartTheme;
    chartsReady: boolean;
  };
  /** State setters owned by the parent. */
  actions: {
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  };
  /** Pre-built elements shared by several tabs. */
  slots: {
    dayWindowStrip: React.JSX.Element;
    provenanceNote: React.JSX.Element;
    methodologyBanner: React.JSX.Element | null;
  };
};

export function GenerationPanel({ day, derived, ui, actions, slots }: GenerationPanelProps) {
  const { selectedDate, tierLockRequired, systemStats, generationData, sourceFiles } = day;
  const { totalGenMkwhr, totalCostBdt, unitCostAuth, hasPublishedFuelCost, avgCostPerKwh } = derived;
  const { chartTheme, chartsReady } = ui;
  const { setSelectedDate } = actions;
  const { dayWindowStrip, provenanceNote, methodologyBanner } = slots;
  return (
    selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">PGCB Fuel Mix &amp; Generation Cost Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. PGCB generation and cost data tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          <GenerationKpiStrip
            systemStats={systemStats}
            generationData={generationData}
            sourceFiles={sourceFiles}
          />

          {dayWindowStrip}
          {provenanceNote}
          {methodologyBanner}

          {/* The day's fuel mix as a shape rather than a total. Fetches its own
              data — ~5.7KB a day that would otherwise ride on every daily
              payload — and renders nothing on the days whose workbook carries
              no En-Curve sheet. */}
          <EnergyCurveChart
            isoDate={selectedDate}
            reportDate={systemStats.date}
            chartTheme={chartTheme}
            ready={chartsReady}
            sourceFile={sourceFiles?.pgcb}
          />

          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">Generation &amp; Production Cost Breakdown<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">System performance data logged on {systemStats.date} • <span className="text-primary font-semibold text-xs">{coverageLabel('fuelMix')}</span></p>
              </div>
            </div>

            <p className="grid-explorer-table-scroll-hint sm:hidden mx-4 ge-fuel-swipe-hint" role="note">
              Swipe horizontally to see all columns
            </p>
            <div className="grid-explorer-table-wrap grid-explorer-table-wrap--sticky-col">
              <table className="grid-explorer-table grid-explorer-table--stack ge-zone-compact ge-fuel-table">
                <thead>
                  <tr>
                    <th>Fuel / Source</th>
                    {/* Generation and cost are printed by PGCB. The unit rate is
                        not — no agency publishes a Tk/kWh figure — so it is the
                        quotient of the two columns to its left and is tagged D,
                        with a marker saying what independent evidence supports
                        that particular quotient. */}
                    <th className="text-left">Generation (MKWh) <GridProvenanceTag kind="P" /></th>
                    <th className="text-left">Generation Share <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Daily Cost (Crore BDT) <GridProvenanceTag kind="P" /></th>
                    <th className="text-left">Cost Share <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Cost intensity <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Unit Cost (Tk/kWh) <GridProvenanceTag kind="D" /></th>
                  </tr>
                </thead>
                <tbody>
                  {generationData.map((g, idx) => {
                    const genShare = ((g.gen / totalGenMkwhr) * 100).toFixed(2);
                    const costShare = g.cost == null ? null : ((g.cost / totalCostBdt) * 100).toFixed(2);
                    return (
                      <tr key={idx} className={cn(g.gen === 0 && 'opacity-40')}>
                        <td className="font-semibold flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                          {g.name}
                        </td>
                        <td data-label="Gen MKWh · P" className="text-left tabular-nums">{g.gen.toFixed(2)}</td>
                        <td data-label="Gen share · D" className="text-left tabular-nums text-muted-foreground">{genShare}%</td>
                        <td data-label="Cost Cr BDT · P" className="text-left tabular-nums">{g.cost == null ? '—' : formatBdtAmount(g.cost / 10000000)}</td>
                        <td data-label="Cost share · D" className="text-left tabular-nums text-muted-foreground">{costShare == null ? '—' : `${costShare}%`}</td>
                        {/*
                          Cost share divided by generation share. Above 1.0 the fuel
                          is taking more of the bill than of the electricity and is
                          pulling the system average up; below 1.0 it is pulling it
                          down. Unlike the rate beside it this compares fuels fairly,
                          because both halves are shares of the same two totals.
                        */}
                        <td data-label="Intensity · D" className="text-left tabular-nums">
                          {(() => {
                            const gs = totalGenMkwhr > 0 ? g.gen / totalGenMkwhr : 0;
                            const cs = g.cost == null || totalCostBdt <= 0 ? null : g.cost / totalCostBdt;
                            if (cs == null || gs <= 0) return <span className="text-muted-foreground">—</span>;
                            const x = cs / gs;
                            return (
                              <span
                                className={cn(
                                  'font-semibold',
                                  x >= 1.5 && 'text-destructive',
                                  x < 1.5 && x > 1.05 && 'text-amber-600 dark:text-amber-500',
                                  x <= 0.95 && 'text-emerald-600 dark:text-emerald-500',
                                )}
                                title={`${(cs * 100).toFixed(2)}% of cost for ${(gs * 100).toFixed(2)}% of energy`}
                              >
                                {x.toFixed(2)}×
                              </span>
                            );
                          })()}
                        </td>
                        <td data-label="Tk/kWh · D" className="text-left tabular-nums font-mono text-sm">
                          {g.unitCost == null ? '—' : g.unitCost.toFixed(2)}
                          <UnitCostBadge fact={unitCostAuth.factFor(g.name, g.unitCost)} />
                        </td>
                      </tr>
                    );
                  })}
                  {/*
                    Every cell in this row is ours: the two totals are sums of
                    the rows above, the shares are those sums against
                    themselves, and the average is their quotient. PGCB does
                    publish its own energy total, so leaving the row unmarked
                    invited a reader to take our sum for theirs. The note below
                    the table reports how the two compare.
                  */}
                  <tr className="is-total border-t border-border/80 font-bold bg-muted/20">
                    <td>Total System / Average<GridProvenanceTag kind="D" className="ml-1" /></td>
                    <td data-label="Gen MKWh · D" className="text-left tabular-nums">{totalGenMkwhr.toFixed(2)}</td>
                    <td data-label="Gen share · D" className="text-left tabular-nums">100.00%</td>
                    <td data-label="Cost Cr BDT · D" className="text-left tabular-nums">{hasPublishedFuelCost ? (totalCostBdt / 10000000).toFixed(2) : '—'}</td>
                    <td data-label="Cost share · D" className="text-left tabular-nums">{hasPublishedFuelCost ? '100.00%' : '—'}</td>
                    <td data-label="Intensity · D" className="text-left tabular-nums">{hasPublishedFuelCost ? '1.00×' : '—'}</td>
                    <td data-label="Tk/kWh · D" className="text-left tabular-nums font-mono text-sm text-primary">{hasPublishedFuelCost ? formatUnitRate(avgCostPerKwh) : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/*
              The fuel rows and PGCB's own headline total are different cells of
              the same report, so they should agree. The band is half of the last
              digit PGCB prints, once per figure summed — taken from how the
              source states its numbers, not chosen.
            */}
            {systemStats.totalEnergyGen != null && (() => {
              const band = 0.005 * (generationData.length + 1);
              const delta = totalGenMkwhr - systemStats.totalEnergyGen;
              const ok = Math.abs(delta) <= band;
              return (
                <div className="mx-4 mt-3 p-3 rounded-lg border border-border/50 bg-muted/15 text-[11px]">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 tabular-nums">
                    <span className="text-muted-foreground">
                      {`Fuel rows sum${' '}`}
                      <GridProvenanceTag kind="D" />
                    </span>
                    <span>
                      {`${totalGenMkwhr.toFixed(2)} vs ${systemStats.totalEnergyGen.toFixed(2)} MKWh published by PGCB`}
                      <GridProvenanceTag kind="P" className="ml-1" />
                      <span
                        className={
                          ok
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold ml-2'
                            : 'text-amber-600 dark:text-amber-400 font-bold ml-2'
                        }
                      >
                        {ok ? 'agrees' : `differs by ${delta.toFixed(3)}`}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })()}

            {/*
              BPDB's own accounts, which price the same electricity over a
              financial year rather than a fuel bill over a day. Outside the
              unitCostAuth gate below on purpose: that gate waits on a
              per-fuel authentication fetch this panel does not use, and the
              contrast it draws is the whole reason the table needs context.
            */}

            {unitCostAuth.loaded && (
              <div className="ge-unitcost-notes mx-4 mb-4 text-[11px] leading-relaxed text-muted-foreground">
                {/*
                  The daily table is fuel-only because that is all PGCB publishes
                  daily. BPDB's own all-in cost — fuel plus capacity payments,
                  O&M and capital recovery — is published annually, and the gap
                  between the two is the part of the bill this table cannot see.
                  Stating it here stops the daily average being read as "what
                  electricity costs", which understates it by about a third.

                  Sourced from the annual series already on the Macro tab rather
                  than estimated. BERC's tariff orders would give the
                  authoritative split, but they are published as legacy
                  Bengali-encoded PDFs whose text extracts as mojibake, so they
                  are not machine-readable here today.
                */}
                {(() => {
                  const annual = macroTariffData[macroTariffData.length - 1];
                  const allIn = annual?.cost ?? null;
                  const fuelOnly = hasPublishedFuelCost && totalGenMkwhr > 0
                    ? totalCostBdt / (totalGenMkwhr * 1_000_000)
                    : null;
                  if (allIn == null || fuelOnly == null) return null;
                  const nonFuel = allIn - fuelOnly;
                  const pct = (nonFuel / allIn) * 100;
                  return (
                    <div className="mb-3 rounded-xl border border-border/50 bg-muted/15 p-3">
                      <p className="mb-2">
                        <strong className="text-foreground">
                          What this table cannot see: about {pct.toFixed(0)}% of the real bill.
                        </strong>{' '}
                        PGCB publishes a fuel cost daily; nobody publishes a daily all-in cost.
                        BPDB&apos;s own audited bulk cost — which adds capacity payments to
                        plants whether or not they run, O&amp;M and capital recovery — is
                        published annually.
                      </p>
                      <div className="grid grid-cols-3 gap-2 tabular-nums">
                        <div className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Fuel only, today <GridProvenanceTag kind="D" />
                          </div>
                          <div className="text-base font-bold text-foreground">{fuelOnly.toFixed(2)}</div>
                          <div className="text-[9px] text-muted-foreground">Tk/kWh — the table above</div>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            BPDB all-in <GridProvenanceTag kind="P" />
                          </div>
                          <div className="text-base font-bold text-foreground">{allIn.toFixed(2)}</div>
                          <div className="text-[9px] text-muted-foreground">Tk/kWh — {annual.year}, annual</div>
                        </div>
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Not in this table <GridProvenanceTag kind="D" />
                          </div>
                          <div className="text-base font-bold text-amber-600 dark:text-amber-500">
                            {nonFuel.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-muted-foreground">Tk/kWh of non-fuel cost</div>
                        </div>
                      </div>
                      <p className="mt-2">
                        The two are different periods — one day against a financial year — so the
                        gap is indicative of scale, not an exact decomposition of today. It is
                        shown because a reader taking {fuelOnly.toFixed(2)} Tk/kWh as the cost of
                        electricity would be understating it by roughly a third.
                      </p>
                    </div>
                  );
                })()}

                {/*
                  The rate invites a ranking it cannot support. Read naively the
                  table says "imports are cheap, solar is expensive, hydro is
                  free" — and a reader concludes the country should import more
                  and build less solar. Every step of that is wrong, and the
                  reasons are structural rather than arithmetic, so they are
                  stated beside the number rather than left to be inferred.
                */}
                <MobileFold title="Why these rates cannot be ranked" className="mb-3">
                <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
                  <p className="mb-1.5">
                    <strong className="text-foreground">
                      These rates are not comparable to each other, and do not rank the options.
                    </strong>{' '}
                    Each is a <em>fuel or purchase</em> cost divided by the energy that fuel
                    produced. It excludes what a plant costs whether or not it runs — capacity
                    payments to idle IPPs, capital recovery, O&amp;M — and excludes transmission
                    losses. Three consequences worth holding onto:
                  </p>
                  <ul className="space-y-1 ml-1">
                    <li>
                      <strong className="text-foreground">Solar and wind burn no fuel.</strong>{' '}
                      Their figure is the tariff paid under a power-purchase agreement, which is
                      capital recovery. Setting it against gas — a fuel bill that excludes the
                      gas plant&apos;s own capital — compares two different quantities. It does
                      not mean solar costs more to run; a solar plant costs almost nothing to run.
                    </li>
                    <li>
                      <strong className="text-foreground">Hydro is not free.</strong>{' '}
                      Kaptai has no fuel bill and is long since built, so its rate collapses
                      towards zero. It cannot be scaled: the dam is what it is, and the output
                      depends on rainfall.
                    </li>
                    <li>
                      <strong className="text-foreground">Imports cannot simply be increased.</strong>{' '}
                      The rate is contractual, and the volume is capped by what the
                      interconnectors can physically carry — the HVDC link, Adani and Tripura are
                      near their limits on most days. A low rate on a capped supply is not an
                      option to buy more of.
                    </li>
                  </ul>
                  <p className="mt-1.5">
                    The columns that <em>do</em> compare fairly are the two beside each other:
                    <strong className="text-foreground"> Generation Share against Cost Share</strong>.
                    A fuel taking a larger share of the bill than of the electricity is the one
                    raising the average — which is the question the rate column is usually being
                    asked, and cannot answer.
                  </p>
                </div>
                </MobileFold>
                <MobileFold title="How the unit cost is derived, and what the 2× / flat markers mean">
                <p className="mb-1.5">
                  <strong className="text-foreground">How the unit cost is arrived at.</strong>{' '}
                  No agency publishes a Tk/kWh rate. PGCB publishes a production cost in Taka
                  and an energy total in MKWh for each fuel; the rate here is the first divided
                  by the second, which is why it is marked{' '}
                  <GridProvenanceTag kind="D" />. The marker beside each rate says what
                  independent evidence supports it:
                </p>
                {/*
                  Said plainly because a reader who checks the arithmetic will
                  otherwise think the rate is wrong: the Generation column is
                  rounded to two decimals for display, while the rate is computed
                  from the unrounded energy. Wind is the visible case — 0.31 MKWh
                  shown against 0.30624 actual, so dividing the two printed
                  columns gives 14.53 rather than the 14.71 stated.
                */}
                <p className="mb-1.5">
                  <strong className="text-foreground">Why the columns may not divide exactly.</strong>{' '}
                  The rate is computed from the energy PGCB publishes at full precision, while the
                  Generation column is rounded to two decimals to read cleanly. On small fuels the
                  two printed columns therefore divide to something slightly different — Wind shows
                  0.31 MKWh against an actual 0.30624 — so the rate shown is the more precise one,
                  not the one the visible columns produce.
                </p>
                <ul className="space-y-0.5 ml-1">
                  <li>
                    <UnitCostBadge static fact={{ status: 'corroborated' } as UnitCostFact} className="ml-0" />{' '}
                    BPDB publishes the same cost and the same energy in a separate report with
                    its own control totals, and the rate derived from those agrees. Re-measured
                    across every witnessed day from 2025-01-01 to 2026-06-24: gas agrees on
                    274 of 274 days, coal on 274 of 274, imports on 273 of 274 — the exception
                    being 2026-04-03, where BPDB&rsquo;s own page overstates imported energy by
                    exactly 188.00 MKWh while PGCB&rsquo;s three interconnectors sum to its own
                    total.
                  </li>
                  {/*
                    This line used to read "Hydro at 0.1000 on all but one" day
                    of 2026. It is 0.1000 on 128 days and 3.8100 on 16 — the
                    unbroken run 2026-06-30 to 07-15 — so the claim was wrong by
                    fifteen days, and wrong in the direction that overstates our
                    confidence. A tally frozen in prose goes stale the moment the
                    archive grows, which is how it broke; the rates are named
                    here and the counts left to the table itself.
                  */}
                  <li>
                    <UnitCostBadge static fact={{ status: 'administered' } as UnitCostFact} className="ml-0" />{' '}
                    a flat rate the publisher applies rather than measures. Through 2026 PGCB
                    prints Wind at 14.7100 Tk/kWh unchanged, and Hydro at 0.1000 except for
                    2026-06-30 to 07-15, when it stepped to 3.8100 and back. Rates that hold to
                    four decimals for weeks and then jump are tariffs in force, not daily costs.
                  </li>
                  <li>
                    <UnitCostBadge static fact={{ status: 'disagreement' } as UnitCostFact} className="ml-0" />{' '}
                    both agencies state the inputs and they disagree by more than their printing
                    precision allows. Neither figure is altered.
                  </li>
                  <li>
                    <UnitCostBadge static fact={{ status: 'published-only' } as UnitCostFact} className="ml-0" />{' '}
                    correctly derived, but only one agency publishes the inputs, so there is no
                    second witness.
                  </li>
                  <li>
                    <UnitCostBadge static fact={{ status: 'awaiting-witness' } as UnitCostFact} className="ml-0" />{' '}
                    correctly derived, and the cross-check has not been run for this day yet. The
                    BPDB comparison is a periodic export
                    {unitCostAuth.witnessThrough ? ` covering days through ${unitCostAuth.witnessThrough}` : ''};
                    a day past that is unchecked, which is not the same as unconfirmed.
                  </li>
                </ul>
                </MobileFold>
              </div>
            )}

            {/* Card Metadata Footer */}
            {/*
              Two corrections here. The generation and cost figures come from
              PGCB's daily report alone — BPDB is not a source for them, it is
              the second publisher whose independent figures corroborate the
              derived rate, which is a different claim. And the "Audited by BPDB
              Finance / CAG Audit Team" credit was removed: no audit report has
              been opened by anything in this pipeline, the same false crediting
              already stripped from the macro cards (see GridProvenanceTag).
            */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, generation and production cost as published</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>Unit rate corroborated against <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Daily Reports</a>. Not audited.</span>
              <span className="font-medium">Reporting Date: {systemStats.date}</span>
            </GridCardFooter>
          </div>

          {/*
            BPDB's own accounts, which price the same electricity over a
            financial year rather than a fuel bill over a day. Its own card
            directly beneath the daily table on purpose: the contrast between
            the two is the whole reason the table needs context, and it carries
            a card's worth of figures rather than a footnote's.

            Outside the unitCostAuth gate below, which waits on a per-fuel
            authentication fetch this card does not use.
          */}
          <BpdbAccountsPanel
            dailyImportRate={generationData.find((g) => g.name === 'Imports')?.unitCost ?? null}
          />

          {/* Daily Milestones */}
          <div className="grid-explorer-chart-card card p-4">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <CheckSquare className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                {/* P1's own block heading. "Operational Milestones" and "System
                    Margins" were our names, and "margin" reads as reserve margin,
                    which nothing in the block is. */}
                <h3 className="grid-explorer-chart-card__title">Power Supply Scenario<DailyBadge /></h3>
                <p className="grid-explorer-chart-card__sub">PGCB&rsquo;s summary block as printed: generation extremes, temperature, unserved energy and gas supplied to power •<span className="text-primary font-semibold text-xs">{coverageLabel('fuelMix')}</span></p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Activity className="h-4 w-4 shrink-0 text-destructive" />
                  Load-Shedding &amp; Demand
                </div>
                {/* All three are printed by PGCB's P1 sheet. */}
                <div className="ge-kv grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Peak Demand:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">{systemStats.eveningPeakDemand.toFixed(1)} MW</span>
                  <span>Peak Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">{systemStats.eveningPeakGen.toFixed(1)} MW</span>
                  <span>Unserved Energy:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-semibold text-destructive text-left tabular-nums">
                    {systemStats.totalEnergyUnserved == null ? '—' : `${systemStats.totalEnergyUnserved.toFixed(2)} MKWh`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
                  Generation Extremes &amp; Temperature
                </div>
                {/*
                  All three are printed. Max and min generation are PGCB's own
                  stated extremes for the day, not the load curve's — its stated
                  minimum is the 08:00 reading, which is not always the curve's
                  trough — and the temperature comes from the reported-day block,
                  never the "probable" forecast beside it.
                */}
                <div className="ge-kv grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Max Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">
                    {systemStats.maxGen == null ? '—' : `${systemStats.maxGen.toFixed(1)} MW`}
                  </span>
                  <span>Min Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">
                    {systemStats.minGen == null ? '—' : `${systemStats.minGen.toFixed(1)} MW`}
                  </span>
                  <span>Max Temp:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-semibold text-foreground text-left tabular-nums">
                    {systemStats.maxTemp == null ? '—' : `${systemStats.maxTemp.toFixed(1)} °C`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Droplet className="h-4 w-4 shrink-0 text-sky-500" />
                  Gas-to-Power
                </div>
                {/*
                  Gas supplied and gas cost are printed by PGCB — the MMCFD
                  figure is PGCB's own "Total Gas Supplied", not Petrobangla's
                  production total, which is a different measure of a different
                  thing. The unit rate is the quotient of the two, which no
                  agency prints.
                */}
                <div className="ge-kv grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Gas Supplied:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">{systemStats.totalGasSuppliedPower.toFixed(1)} MMCFD</span>
                  <span>Gas Cost:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">
                    {(() => {
                      const c = generationData.find(g => g.name === 'Gas')?.cost;
                      return c == null ? '—' : `${(c / 10000000).toFixed(2)} Crore BDT`;
                    })()}
                  </span>
                  <span>Gas Unit Cost:<GridProvenanceTag kind="D" className="ml-1" /></span>
                  <span className="font-semibold text-primary text-left tabular-nums">
                    {(() => {
                      const u = generationData.find(g => g.name === 'Gas')?.unitCost;
                      return u == null ? '—' : `${u.toFixed(2)} Tk/kWh`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Metadata Footer */}
            {/*
              Every figure on this card is parsed from PGCB's P1 and reported-day
              Forecast block — including "Total Gas Supplied", which is PGCB's
              number rather than Petrobangla's, so the Petrobangla credit was
              wrong. The "Audited by NLDC Operators & Petrobangla Billing" line
              went with it: nothing here has opened an audit.
            */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet and the reported-day Forecast block; Nepal from the En-Curve stack</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>As published by PGCB. Not audited.</span>
              <span className="font-medium">Reporting Period: System Summary (Date: {systemStats.date})</span>
            </GridCardFooter>
          </div>
        </div>
        </GridLockedContent> )
  );
}
