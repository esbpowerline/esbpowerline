'use client';

import { Fragment, useEffect, useState } from 'react';
import { ChevronRight, Database, Droplet, Info } from 'lucide-react';
import type { GasDistributionItem, GasProductionItem } from '@/lib/data/grid/types';
import { formatNumber } from '@/lib/utils';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { GridLockedContent } from './GridLockedContent';
import { GridCardFooter } from './GridExplorerUI';
import { PetrobanglaGasKpiStrip } from './PetrobanglaGasKpiStrip';
import {
  DISTRIBUTOR_COLORS,
  DistributionCompanyDetail,
  PRODUCER_COLORS,
  ProductionCompanyDetail,
  distributionCompanyForLabel,
  producerKeyFromLabel,
  productionFieldsForLabel,
  usePetrobanglaArchiveDay,
} from './PetrobanglaSectionDetail';

interface GasTabProps {
  selectedDate: string;
  systemStatsDate: string;
  gasProductionData: GasProductionItem[];
  gasDistributionData: GasDistributionItem[];
  totalGasSupply: number;
  totalCondensate: number;
  isLocked?: boolean;
  requiredTier?: string;
  onTryDemo?: () => void;
}

export function GasTab({
  selectedDate,
  systemStatsDate,
  gasProductionData,
  gasDistributionData,
  totalGasSupply,
  totalCondensate,
  isLocked,
  requiredTier,
  onTryDemo,
}: GasTabProps) {
  const { day: archiveDay, gasDay } = usePetrobanglaArchiveDay(selectedDate);
  const [expandedProd, setExpandedProd] = useState<string | null>(null);
  const [expandedDist, setExpandedDist] = useState<string | null>(null);

  // The gas report lags the grid report: PGCB publishes a day's grid figures
  // the next morning, Petrobangla the morning after that. So the newest day on
  // the site routinely has grid data and no gas, and its gas sections are
  // written as the six company rows zeroed — the shape the site uses for "not
  // published yet".
  //
  // The rest of this tab already handles that by falling back to the nearest
  // report: the caption names it, and the per-company detail cards read from
  // it. The summary tables did not, so they showed zeros beneath a caption
  // promising a report that has figures — nothing visible until a row was
  // clicked, which is where the fallback took over. They now read from the same
  // day the caption names.
  const [fallback, setFallback] = useState<{
    production: GasProductionItem[];
    distribution: GasDistributionItem[];
  } | null>(null);
  const selectedDayHasGas = gasProductionData.some((g) => (g.gas ?? 0) > 0);

  useEffect(() => {
    if (selectedDayHasGas || !gasDay || gasDay === selectedDate) {
      setFallback(null);
      return;
    }
    let live = true;
    fetchDailyReport(gasDay).then((res) => {
      if (!live) return;
      const gas = res.ok ? res.data.gasProductionData ?? [] : [];
      setFallback(
        gas.some((g) => (g.gas ?? 0) > 0)
          ? { production: gas, distribution: res.ok ? res.data.gasDistributionData ?? [] : [] }
          : null,
      );
    });
    return () => {
      live = false;
    };
  }, [selectedDayHasGas, gasDay, selectedDate]);

  const productionRows = fallback?.production ?? gasProductionData;
  const distributionRows = fallback?.distribution ?? gasDistributionData;
  // Recomputed from the rows actually on screen, so the total cannot describe a
  // different day from the rows above it.
  const productionTotalGas = fallback
    ? fallback.production.reduce((sum, g) => sum + (g.gas ?? 0), 0)
    : totalGasSupply;
  const productionTotalCondensate = fallback
    ? fallback.production.reduce((sum, g) => sum + (g.condensate ?? 0), 0)
    : totalCondensate;
  // The grid date would name a day these figures are not from once the
  // fallback is in effect, and the footer is the line a reader cites.
  const gasReportDate = fallback && archiveDay
    ? archiveDay.report.report_date_label
    : systemStatsDate;

  // Rounded list rows need the separate-borders model (collapsed cells can't round).
  const listTable = 'grid-explorer-table border-separate [border-spacing:0_0.375rem]';
  const rowTd = 'bg-muted/10 transition-colors group-hover:bg-muted/20';
  const totalTd = 'bg-muted/25';
  // While a detail card is open, its table goes into focus mode: the column
  // header and totals hide (the card supersedes them) and the other rows
  // shrink to name-only pills that switch the expansion on click.
  const prodFocused = expandedProd != null;
  const distFocused = expandedDist != null;

  const reportCaption =
    archiveDay && gasDay ? (
      <p className="grid-explorer-chart-card__sub mt-0.5">
        <span className="text-amber-500 font-semibold">
          Report: {archiveDay.report.report_date_label}
        </span>{' '}
        — 8:00 AM → 8:00 AM gas day, archived under its end date ({gasDay})
        {gasDay !== selectedDate && (
          <span className="text-muted-foreground"> • nearest report to your selected date</span>
        )}
      </p>
    ) : null;

  if (selectedDate < '2020-01-12') {
    return (
      <div className="grid-explorer-panel space-y-6">
        <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
            <Info className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-foreground mb-2">Petrobangla Gas Production &amp; Distribution Data</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            No official records are available for the selected date. Petrobangla gas production tracking officially started on January 12, 2020.
          </p>
          <div className="mt-4 text-[10px] text-muted-foreground">Official Backlog Start Date: January 12, 2020</div>
        </div>
      </div>
    );
  }

  if (!gasProductionData.length) {
    return (
      <div className="grid-explorer-panel space-y-6">
        <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
            <Info className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-foreground mb-2">Petrobangla Gas &amp; LNG Supply</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            PGCB grid data is available for this date, but Petrobangla production and distribution tables are missing from the daily record. Re-run the official ingest when Petrobangla reports are online.
          </p>
        </div>
      </div>
    );
  }

  // All five off the rows on screen, for the same reason as the production
  // totals: a total that sums a different day from the rows above it is worse
  // than no total.
  const totalActiveFields = productionRows.reduce((sum, item) => sum + (item.fields || 0), 0);
  const distPowerTotal = distributionRows.reduce((sum, item) => sum + item.power, 0);
  const distFertTotal = distributionRows.reduce((sum, item) => sum + item.fertilizer, 0);
  const distOthersTotal = distributionRows.reduce((sum, item) => sum + item.others, 0);
  const distGrandTotal = distributionRows.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="grid-explorer-panel space-y-6">
      <PetrobanglaGasKpiStrip selectedDate={selectedDate} />

      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Droplet className="h-5 w-5 text-sky-500 shrink-0" />
          <div>
            <h3 className="grid-explorer-chart-card__title">
              Daily Gas &amp; Condensate Production
              <sup className="text-emerald-500 font-extrabold text-[10px] ml-2 select-none">Daily</sup>
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Petrobangla Production &amp; Marketing Division Report •{' '}
              <span className="text-sky-500 font-semibold">{coverageLabel('gasProduction')}</span> •{' '}
              Click a company for per-field detail
            </p>
            {reportCaption}
          </div>
        </div>

        <div className="grid-explorer-table-wrap">
          <GridLockedContent
            locked={isLocked || false}
            requiredTier={requiredTier as any}
            selectedDate={selectedDate}
            variant="micro"
            onTryDemo={onTryDemo}
          >
          <table className={listTable}>
            {!prodFocused && (
              <thead>
                <tr>
                  <th>Field / Company Operator</th>
                  <th className="text-left">Active Fields/Wells</th>
                  <th className="text-left">Gas Produced (MMCFD)</th>
                  <th className="text-left">Condensate Produced (BBL)</th>
                  <th className="text-left">National Gas Share</th>
                </tr>
              </thead>
            )}
            <tbody>
              {productionRows.map((gp, idx) => {
                const detailFields = productionFieldsForLabel(archiveDay, gp.company);
                const expandable = detailFields.length > 0;
                const expanded = expandable && expandedProd === gp.company;
                const producerKey = producerKeyFromLabel(gp.company);
                const colors = PRODUCER_COLORS[producerKey];
                return (
                  <Fragment key={idx}>
                    {!expanded && prodFocused && (
                      <tr
                        className={`group ${expandable ? 'cursor-pointer' : ''}`}
                        onClick={expandable ? () => setExpandedProd(gp.company) : undefined}
                      >
                        <td colSpan={5} className={`rounded-xl pl-3 !py-2 font-semibold ${rowTd}`}>
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            {expandable && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                            {colors && <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />}
                            {gp.company}
                          </span>
                        </td>
                      </tr>
                    )}
                    {!expanded && !prodFocused && (
                      <tr
                        className={`group ${expandable ? 'cursor-pointer' : ''}`}
                        aria-expanded={expandable ? false : undefined}
                        onClick={expandable ? () => setExpandedProd(gp.company) : undefined}
                      >
                        <td className={`font-semibold rounded-l-xl pl-3 ${rowTd}`}>
                          <span className="inline-flex items-center gap-2">
                            {expandable && (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            {colors && <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />}
                            {gp.company}
                          </span>
                        </td>
                        <td className={`text-left tabular-nums text-muted-foreground ${rowTd}`}>{gp.fields || '—'}</td>
                        <td className={`text-left tabular-nums font-medium ${rowTd}`}>{gp.gas ? gp.gas.toFixed(1) : '-'}</td>
                        <td className={`text-left tabular-nums ${rowTd}`}>{gp.condensate !== undefined ? formatNumber(Math.round(gp.condensate)) : '-'}</td>
                        <td className={`text-left rounded-r-xl ${rowTd}`}>
                          {gp.share !== undefined ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted/40 sm:w-20">
                                <span
                                  className={`block h-full rounded-full ${colors?.bar || 'bg-primary'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, gp.share))}%` }}
                                />
                              </span>
                              <span className="tabular-nums text-muted-foreground">{gp.share.toFixed(1)}%</span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    )}
                    {expanded && (
                      <tr>
                        <td colSpan={5} className="!p-0">
                          <div className="py-2">
                            <ProductionCompanyDetail
                              fields={detailFields}
                              grandTotal={archiveDay?.production?.grand_total ?? null}
                              producerKey={producerKey}
                              label={gp.company}
                              onToggle={() => setExpandedProd(null)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!prodFocused && (
                <tr className="font-bold">
                  <td className={`rounded-l-xl pl-3 ${totalTd}`}>Grand Total Production</td>
                  <td className={`text-left ${totalTd}`}>{totalActiveFields} Fields</td>
                  <td className={`text-left text-primary ${totalTd}`}>{formatNumber(productionTotalGas, 1)}</td>
                  <td className={`text-left ${totalTd}`}>{formatNumber(productionTotalCondensate, 1)}</td>
                  <td className={`text-left rounded-r-xl ${totalTd}`}>100.0%</td>
                </tr>
              )}
            </tbody>
          </table>
          </GridLockedContent>
        </div>

        <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
          <p><strong>What is being shown?</strong></p>
          <p className="leading-relaxed">This table displays the daily gas volume (MMCFD) and associated condensate liquids (BBL) produced by local gas fields and foreign operators (Chevron, Tullow), alongside imported liquefied natural gas (LNG) regasified into the grid.</p>
          <p className="leading-relaxed"><strong>Analytical Insight:</strong> Chevron (operating the Bibiyana field) remains the dominant producer of natural gas in Bangladesh, supplying over 50% of domestic gas. The high dependency on a single field and company exposes the entire gas-to-power supply chain to operational vulnerability and highlights the urgency of expanding national exploration or gas import capacity.</p>
          <p className="leading-relaxed"><strong>How Petrobangla calculates this:</strong> Each report covers an 8:00 AM → 8:00 AM &ldquo;gas day&rdquo; and is dated by the morning it closes — the report for the 31 Dec → 1 Jan window is filed under 1 Jan. In the per-field detail, <em>% T. Cap</em> is a field&apos;s gas output divided by national installed capacity, and <em>% T. Prod</em> is its share of the day&apos;s grand-total production. Sub-totals are recomputed from volumes exactly as Petrobangla computes its own subtotal lines; the PDF&apos;s per-field % column is rounded to one decimal (and occasionally misprinted at source), so summing that printed column can drift a few tenths from the official subtotal.</p>
        </div>

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Production Reports
            </a>
          </span>
          <span>Audited by: Petrobangla Production &amp; Marketing Division</span>
          <span className="font-medium">Reporting Period: Daily Field Snapshot (Date: {gasReportDate})</span>
        </GridCardFooter>
      </div>

      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Database className="h-5 w-5 text-sky-600 shrink-0" />
          <div>
            <h3 className="grid-explorer-chart-card__title">
              Sectorwise Gas Distribution
              <sup className="text-emerald-500 font-extrabold text-[10px] ml-2 select-none">Daily</sup>
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Allocated supply (MMCFD) across regional gas distributors •{' '}
              <span className="text-sky-500 font-semibold">{coverageLabel('gasProduction')}</span> •{' '}
              Click a distributor for per-plant detail
            </p>
            {reportCaption}
          </div>
        </div>

        <div className="grid-explorer-table-wrap">
          <GridLockedContent
            locked={isLocked || false}
            requiredTier={requiredTier as any}
            selectedDate={selectedDate}
            variant="micro"
            onTryDemo={onTryDemo}
          >
          <table className={listTable}>
            {!distFocused && (
              <thead>
                <tr>
                  <th>Distributor</th>
                  <th className="text-left">Power Grid Supply</th>
                  <th className="text-left">Fertilizer Supply</th>
                  <th className="text-left">Industrial / Others</th>
                  <th className="text-left">Total Gas Distributed</th>
                </tr>
              </thead>
            )}
            <tbody>
              {distributionRows.map((gd, idx) => {
                const detailCompany = distributionCompanyForLabel(archiveDay, gd.company);
                const expandable = detailCompany != null;
                const expanded = expandable && expandedDist === gd.company;
                const distributorKey = gd.company.toUpperCase().split(/[\s(]/)[0];
                const colors = DISTRIBUTOR_COLORS[distributorKey];
                const shareOfTotal = distGrandTotal > 0 ? (gd.total / distGrandTotal) * 100 : null;
                return (
                  <Fragment key={idx}>
                    {!expanded && distFocused && (
                      <tr
                        className={`group ${expandable ? 'cursor-pointer' : ''}`}
                        onClick={expandable ? () => setExpandedDist(gd.company) : undefined}
                      >
                        <td colSpan={5} className={`rounded-xl pl-3 !py-2 font-semibold ${rowTd}`}>
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            {expandable && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                            {colors && <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />}
                            {gd.company}
                          </span>
                        </td>
                      </tr>
                    )}
                    {!expanded && !distFocused && (
                      <tr
                        className={`group ${expandable ? 'cursor-pointer' : ''}`}
                        aria-expanded={expandable ? false : undefined}
                        onClick={expandable ? () => setExpandedDist(gd.company) : undefined}
                      >
                        <td className={`font-semibold rounded-l-xl pl-3 ${rowTd}`}>
                          <span className="inline-flex items-center gap-2">
                            {expandable && (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            {colors && <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />}
                            {gd.company}
                          </span>
                        </td>
                        <td className={`text-left tabular-nums ${rowTd}`}>{gd.power.toFixed(1)}</td>
                        <td className={`text-left tabular-nums ${rowTd}`}>{gd.fertilizer.toFixed(1)}</td>
                        <td className={`text-left tabular-nums text-muted-foreground ${rowTd}`}>{gd.others.toFixed(1)}</td>
                        <td className={`text-left rounded-r-xl ${rowTd}`}>
                          <span className="inline-flex items-center gap-2">
                            {shareOfTotal != null && (
                              <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted/40 sm:w-20">
                                <span
                                  className={`block h-full rounded-full ${colors?.bar || 'bg-primary'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, shareOfTotal))}%` }}
                                />
                              </span>
                            )}
                            <span className="tabular-nums font-semibold">{gd.total.toFixed(1)}</span>
                          </span>
                        </td>
                      </tr>
                    )}
                    {expanded && detailCompany && (
                      <tr>
                        <td colSpan={5} className="!p-0">
                          <div className="py-2">
                            <DistributionCompanyDetail
                              company={detailCompany}
                              distributorKey={distributorKey}
                              label={gd.company}
                              onToggle={() => setExpandedDist(null)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!distFocused && (
                <tr className="font-bold">
                  <td className={`rounded-l-xl pl-3 ${totalTd}`}>National Total Supply</td>
                  <td className={`text-left tabular-nums text-primary ${totalTd}`}>{distPowerTotal.toFixed(1)}</td>
                  <td className={`text-left tabular-nums ${totalTd}`}>{distFertTotal.toFixed(1)}</td>
                  <td className={`text-left tabular-nums ${totalTd}`}>{distOthersTotal.toFixed(1)}</td>
                  <td className={`text-left tabular-nums text-primary rounded-r-xl ${totalTd}`}>{distGrandTotal.toFixed(1)}</td>
                </tr>
              )}
            </tbody>
          </table>
          </GridLockedContent>
        </div>

        <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
          <p><strong>What is being shown?</strong></p>
          <p className="leading-relaxed">This table tracks the distribution of natural gas across different sectors (power grid generators, fertilizer plants, and industrial/domestic consumers) by regional distribution utilities.</p>
          <p className="leading-relaxed"><strong>Analytical Insight:</strong> Natural gas distribution is heavily skewed toward the power sector and industrial customers. Titas Gas (TGTDCL) remains the largest distributor by volume. Under gas supply shortages, fertilizer plants and industries are often rationed to prioritize power generation, illustrating the competing demands for limited gas supply.</p>
          <p className="leading-relaxed"><strong>How Petrobangla calculates this:</strong> In the per-plant detail, &ldquo;demand&rdquo; is each plant&apos;s nominal gas requirement at full output and &ldquo;supply&rdquo; is the metered delivery over the same 8:00 AM → 8:00 AM gas day; plants with zero supply form the report&apos;s shutdown list. Because plants never all peak simultaneously, Petrobangla also applies its own diversity factor (typically ×0.85) to raw power demand to estimate the realistic requirement — the True Power-Gas Gap KPI above is measured against that adjusted demand, not the raw plant total.</p>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-sky-500" /> Gas Sector Acronyms &amp; Units Footnote
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-[10px] text-muted-foreground leading-relaxed">
            <div>
              <strong className="text-foreground block font-bold mb-0.5">MMCFD</strong>
              Million Standard Cubic Feet per Day. Standard unit of gas volume flow rate.
            </div>
            <div>
              <strong className="text-foreground block font-bold mb-0.5">BBL (Barrel of Oil)</strong>
              Standard unit of volume for crude oil and petroleum products (1 BBL = 42 US gallons or ~159 liters).
            </div>
            <div>
              <strong className="text-foreground block font-bold mb-0.5">LNG (Liquefied Natural Gas)</strong>
              Natural gas cooled to liquid state (-162°C) for shipping, then regasified back into the grid.
            </div>
            <div>
              <strong className="text-foreground block font-bold mb-0.5">BGFCL / SGFL / BAPEX</strong>
              National gas production state companies (Bangladesh Gas Fields, Sylhet Gas Fields, and BAPEX exploration).
            </div>
            <div>
              <strong className="text-foreground block font-bold mb-0.5">TGTDCL / BGDCL / KGDCL</strong>
              Gas distribution companies (Titas Gas, Bakhrabad Gas, and Karnaphuli Gas Distribution).
            </div>
            <div>
              <strong className="text-foreground block font-bold mb-0.5">RPGCL</strong>
              Rupantarita Prakritik Gas Company Limited, responsible for gas imports and LNG terminal operations.
            </div>
          </div>
        </div>

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Distribution Reports
            </a>
          </span>
          <span>Audited by: Distributor Billing Audits (TGTDCL, KGDCL, JGTDSL)</span>
          <span className="font-medium">Reporting Period: Daily Distribution Allocation (Date: {gasReportDate})</span>
        </GridCardFooter>
      </div>
    </div>
  );
}