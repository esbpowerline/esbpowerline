'use client';

import type * as React from 'react';
import { Info, Globe } from 'lucide-react';
import { GridLockedContent } from '@/components/news/power-grid/GridLockedContent';
import { ImportsKpiStrip } from '@/components/news/power-grid/TabKpiStrips';
import { DailyBadge, GridProvenanceTag, GridCardFooter, GridSourceFiles } from '@/components/news/power-grid/GridExplorerUI';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { formatNumber } from '@/lib/utils';
import { formatPeakFlowTotal } from '@/lib/data/grid/border-imports';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { DEMO_DATE } from '@/components/news/power-grid/tabs/shared';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import type { BorderImportItem, GridGenerationItem, GridSystemStats } from '@/lib/data/grid/types';

export type ImportsPanelProps = {
  /** The selected day and the payload read from it. */
  day: {
    selectedDate: string;
    tierLockRequired: GridAccessTier | null;
    systemStats: GridSystemStats;
    generationData: GridGenerationItem[];
    borderImportsData: BorderImportItem[];
    sourceFiles: { pgcb?: string | undefined; petrobangla?: string | undefined; } | undefined;
  };
  /** Values the parent derives from the day (totals, chart series, flags). */
  derived: {
    importsCost: number | null;
    importsEnergyMkwh: number | null;
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

export function ImportsPanel({ day, derived, actions, slots }: ImportsPanelProps) {
  const { selectedDate, tierLockRequired, systemStats, generationData, borderImportsData, sourceFiles } = day;
  const { importsCost, importsEnergyMkwh } = derived;
  const { setSelectedDate } = actions;
  const { dayWindowStrip, provenanceNote, methodologyBanner } = slots;
  return (
    selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">Cross-Border Power Imports Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. PGCB import data tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          <ImportsKpiStrip
            systemStats={systemStats}
            generationData={generationData}
            borderImportsData={borderImportsData}
            sourceFiles={sourceFiles}
          />

          {dayWindowStrip}
          {provenanceNote}
          {methodologyBanner}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Globe className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">Cross-Border Power Imports Tracker<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">Import allocations and power trade as filed for the day (Report: {systemStats.date}) • <span className="text-primary font-semibold text-xs">{coverageLabel('borderImports')}</span></p>
              </div>
            </div>

            {/* Phone: five short rows become a compact table that fits 390px, so the
                text keeps its place on tablets only (see "IMPORTS tab" in
                grid-explorer-mobile.css). */}
            <p className="grid-explorer-table-scroll-hint ge-imp-hint sm:hidden mx-4" role="note">
              Swipe horizontally to see all columns
            </p>
            <div className="grid-explorer-table-wrap grid-explorer-table-wrap--sticky-col">
              <table className="grid-explorer-table ge-compact-table ge-imports-table">
                <thead>
                  <tr>
                    <th>Import Source / Line</th>
                    {/* "C/B Interconnector (West)" and the rest are our own
                        labels for the lines, not a classification PGCB prints. */}
                    <th className="ge-imp-type-col">Type<GridProvenanceTag kind="D" className="ml-1" /></th>
                    {/* Energy and peak are published per line in P1 — except
                        Nepal, whose row is derived from the half-hourly curve
                        and is marked on the row itself. */}
                    <th className="text-left"><span className="ge-imp-long">Daily Energy Imported (MKWh)</span><span className="ge-imp-short" aria-hidden="true">Energy MKWh</span><GridProvenanceTag kind="P" className="ml-1" /></th>
                    {/* P1 prints "Peak Hr Flow … MW at 21:00 hrs." — an instantaneous
                        flow at one hour. "Capacity Served" read as a capacity. */}
                    <th className="text-left"><span className="ge-imp-long">Peak Hour Flow (MW)</span><span className="ge-imp-short" aria-hidden="true">Peak MW</span><GridProvenanceTag kind="P" className="ml-1" /></th>
                    {/*
                      The blended-rate column is deliberately not here. PGCB
                      prices imports as one line covering Bheramara, Adani and
                      Tripura together, so any Tk/kWh from it is a single average
                      over three separate commercial agreements at different
                      prices. Published as a rate it reads as "what Bangladesh
                      pays for imported power", or worse as one supplier's
                      tariff, and neither is something the report supports. The
                      cost PGCB does publish stays; the average it implies does
                      not.
                    */}
                    <th className="text-left"><span className="ge-imp-long">Cost (Cr Tk)</span><span className="ge-imp-short" aria-hidden="true">Cost Cr Tk</span><GridProvenanceTag kind="P" className="ml-1" /><span className="font-normal text-muted-foreground"> — all lines</span></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Energy and peak flow are published per line. Cost is not:
                      PGCB's production-cost table carries one "Import" figure
                      for all three interconnectors together.

                      Both derived columns used to be filled from that blended
                      rate, which put the SAME Tk/kWh against Bheramara, Adani
                      and Tripura on every day in the archive — three different
                      agreements shown at one price, in a column headed "Unit
                      Rate", where it reads as each line's contracted tariff.
                      The cost column was the same number times this row's
                      energy, so it carried nothing the energy column did not
                      already say while implying a per-line bill that PGCB has
                      never published. */}
                  {borderImportsData.map((bi, idx) => {
                    // PGCB's P1 interconnector block names three lines and not
                    // Nepal — parse_daily_reports says so in its own docstring —
                    // so the Nepal row's energy and peak come from the En-Curve's
                    // Nepal column instead: summed and halved for the day, and
                    // its maximum for the peak. Published and derived rows sit in
                    // the same columns, so the difference is marked on the row.
                    const derivedRow = /nepal/i.test(bi.source);
                    return (
                    <tr key={idx}>
                      <td className="font-semibold">
                        {bi.source}
                        {/* Phone: the Type column is folded into a sub-line here. */}
                        <span className="ge-imp-type-sub" aria-hidden="true">{bi.type}</span>
                        {derivedRow && (
                          <span
                            className="ml-1.5 inline-block px-1.5 py-px rounded border text-[9px] font-bold align-middle bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            title="PGCB does not list this line in its production-cost interconnector block. Its energy and peak are computed here from the half-hourly generation curve PGCB publishes — the day's samples summed and halved, and their maximum."
                          >
                            from curve
                          </span>
                        )}
                      </td>
                      <td className="ge-imp-type-col text-muted-foreground">{bi.type}</td>
                      <td className="text-left tabular-nums font-semibold">
                        {bi.energy.toFixed(2)}
                        <GridProvenanceTag kind={derivedRow ? 'D' : 'P'} className="ml-1" />
                      </td>
                      <td className="text-left tabular-nums">
                        {bi.peakFlow == null ? '—' : formatNumber(Math.round(bi.peakFlow))}
                        {bi.peakFlow != null && <GridProvenanceTag kind={derivedRow ? 'D' : 'P'} className="ml-1" />}
                      </td>
                      <td className="text-left tabular-nums text-muted-foreground" title="PGCB publishes one import cost covering all interconnectors, not a figure per line">—</td>
                    </tr>
                    );
                  })}
                  <tr className="border-t border-border/80 font-bold bg-muted/20">
                    <td>Total Grid Imports<span className="ge-imp-type-sub" aria-hidden="true">National aggregate</span></td>
                    <td className="ge-imp-type-col text-muted-foreground">National aggregate</td>
                    <td className="text-left tabular-nums text-primary">{borderImportsData.reduce((sum, i) => sum + i.energy, 0).toFixed(2)}</td>
                    <td className="text-left tabular-nums">{formatPeakFlowTotal(borderImportsData)}</td>
                    {/* The published import cost itself, not the line sum times
                        the blended rate. Those two disagree, because P1's fuel
                        table and the interconnector block state slightly
                        different import energy — 46.50 against 45.60 MKWh on
                        2026-08-08 — so recomputing produced a total that was
                        neither figure. A day whose report carries no
                        production-cost block still shows "—": a 0.00 total
                        reads as "imports were free". */}
                    <td className="text-left tabular-nums">
                      {importsCost == null ? '—' : `${(importsCost / 10000000).toFixed(2)} Cr`}
                      <GridProvenanceTag kind="P" className="ml-1" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <MobileFold title="Why cost is shown once, and the lines"><div className="p-4 bg-muted/20 border border-border/40 rounded-xl mt-4 text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                <strong>Why cost is shown once, and no rate at all:</strong> PGCB reports energy and peak
                flow for each interconnector, but prices imports as a single line in its production-cost
                table — one figure covering all of them. Bheramara, Adani Godda and Tripura are separate
                contracts at different prices, and the report does not say what those prices are. Dividing
                the one cost by the one energy would give a single average across all three, which is not
                the tariff of any of them, so no per-unit rate is published here.
                {importsEnergyMkwh != null && borderImportsData.length > 0 && (() => {
                  const lineSum = borderImportsData.reduce((sum, i) => sum + i.energy, 0);
                  // PGCB states import energy in two places and they disagree,
                  // which matters for reading the cost against the line total.
                  return Math.abs(lineSum - importsEnergyMkwh) > 0.05 ? (
                    <> The cost above covers the {importsEnergyMkwh.toFixed(2)} MKWh the fuel table
                    reports, which differs from the {lineSum.toFixed(2)} MKWh these lines add up to — PGCB
                    states import energy in two places and they do not always agree.</>
                  ) : null;
                })()}
              </p>
              <p>
                <strong>The lines:</strong> Adani Cross-Border Interconnector (Godda Coal Power) provides dedicated
                base-load supply directly to the northern grid interface. HVDC Bheramara is the main synchronous
                link with the Indian National Grid (NTPC/PowerGrid).
              </p>
            </div></MobileFold>

            {/* Card Metadata Footer */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, import stats block; Nepal from the En-Curve stack</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>As published. Not independently audited.</span>
              <span className="font-medium">Reporting Period: Daily Interconnector Flow (Date: {systemStats.date})</span>
            </GridCardFooter>
          </div>
        </div>
        </GridLockedContent> )
  );
}
