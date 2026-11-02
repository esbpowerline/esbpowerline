'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Database, Droplet, Info } from 'lucide-react';
import type { GasDistributionItem, GasProductionItem } from '@/lib/data/grid/types';
import { formatNumber } from '@/lib/utils';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { GridLockedContent } from './GridLockedContent';
import { MobileFold } from './MobileFold';
import {
  GridCardFooter,
  GridDataBadge,
  GridExplanationBlock,
  GridProvenanceTag,
} from './GridExplorerUI';
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

/**
 * Column tracks for the two disclosure lists. The name column takes the slack
 * and the figure columns are sized to their widest realistic value, so the
 * header, every row and the totals line up on one grid — which is what lets a
 * row open without anything else on the list moving.
 */
const PROD_COLS = 'minmax(11rem, 1.6fr) minmax(6rem, 0.9fr) minmax(7rem, 0.9fr) minmax(8rem, 1fr)';
const DIST_COLS =
  'minmax(11rem, 1.5fr) minmax(5.5rem, 0.8fr) minmax(5.5rem, 0.8fr) minmax(6rem, 0.8fr) minmax(8rem, 1fr)';

/**
 * A figure in a disclosure row.
 *
 * The list is not marked up as a table. It reads as one, but each row is a
 * button that opens a panel, and `role="row"` on a button would take its button
 * semantics — and therefore the expandability — away from screen readers. The
 * column header is decorative instead, and every figure carries its own label:
 * visually on phones where the header is dropped, and to assistive tech
 * everywhere, so a value is never announced as a bare number.
 */
function Figure({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`gas-disclosure__num ${className}`}>
      <span className="gas-disclosure__label">{label}</span>
      {children}
    </span>
  );
}

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

  // While a company is open the list dims everything else rather than rebuilding
  // itself: the header, the totals and the unopened rows all stay exactly where
  // they are, so the only thing that moves is the panel opening. See the
  // .gas-disclosure block in globals.css for why that replaced a table.
  const prodFocused = expandedProd != null;
  const distFocused = expandedDist != null;

  // Which end of the window the file is keyed on is not fixed: through 2026-06
  // the archive stores a report under the date its window ends, and the
  // reconstructed 2026-08 files under the date it starts. Say which one this is
  // rather than asserting one of them.
  const reportCaption =
    archiveDay && gasDay ? (
      <p className="grid-explorer-chart-card__sub mt-0.5">
        <span className="text-amber-500 font-semibold">
          Report: {archiveDay.report.report_date_label}
        </span>{' '}
        — 8:00 AM → 8:00 AM gas day, archived under its{' '}
        {archiveDay.report.gas_day_start === gasDay
          ? 'start date'
          : archiveDay.report.gas_day_end === gasDay
            ? 'end date'
            : 'file date'}{' '}
        ({gasDay})
        {gasDay !== selectedDate && (
          <span className="text-muted-foreground"> • nearest report to your selected date</span>
        )}
      </p>
    ) : null;

  if (selectedDate < '2020-01-12') {
    return (
      <div className="grid-explorer-panel space-y-6">
        <div className="grid-explorer-chart-card card flex min-h-[400px] max-lg:min-h-0 max-lg:py-10 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Info className="h-8 w-8 shrink-0 text-primary" />
          </span>
          <h4 className="text-base font-bold text-foreground">Petrobangla Gas Production &amp; Distribution Data</h4>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            No official records are available for the selected date. Petrobangla gas production tracking officially started on January 12, 2020.
          </p>
          <div className="text-[10px] tabular-nums text-muted-foreground">Official Backlog Start Date: January 12, 2020</div>
        </div>
      </div>
    );
  }

  if (!gasProductionData.length) {
    return (
      <div className="grid-explorer-panel space-y-6">
        <div className="grid-explorer-chart-card card flex min-h-[400px] max-lg:min-h-0 max-lg:py-10 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Droplet className="h-8 w-8 shrink-0 text-sky-500" />
          </span>
          <h4 className="text-base font-bold text-foreground">Petrobangla Gas &amp; LNG Supply</h4>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            PGCB grid data is available for this date, but Petrobangla production and distribution tables are missing from the daily record. Re-run the official ingest when Petrobangla reports are online.
          </p>
        </div>
      </div>
    );
  }

  // All five off the rows on screen, for the same reason as the production
  // totals: a total that sums a different day from the rows above it is worse
  // than no total.
  // Petrobangla's own printed grand total for the day these rows describe,
  // from the validated archive parse. It is the control total this table's
  // company rows should reproduce.
  const petrobanglaGrandTotal =
    archiveDay?.production?.grand_total?.gas_mmcfd ?? null;

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
              <GridDataBadge cadence="daily" />
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Petrobangla Production &amp; Marketing Division Report •{' '}
              <span className="text-sky-500 font-semibold">{coverageLabel('gasProduction')}</span> •{' '}
              <span className="max-lg:hidden">Click</span>
              <span className="lg:hidden">Tap</span> a company for per-field detail
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
          <div
            className="gas-disclosure"
            data-focused={prodFocused}
            style={{ ['--gas-cols' as string]: PROD_COLS }}
            role="list"
            aria-label="Daily gas and condensate production by company"
          >
            <div className="gas-disclosure__head" aria-hidden="true">
                {/*
                  "Active Fields/Wells" was removed. It was six constants baked
                  into parse_daily_reports — 5, 5, 9, 3, 1, 0 — that never moved
                  across 4,171 days despite a header promising a daily count, and
                  two of them disagree with Petrobangla's own field list (BAPEX
                  operates 8, not 9; RPGCL's R-LNG Terminal is 1, not 0). They
                  did not even match the parser's own field-name lists. Nothing
                  replaces it: Petrobangla does publish producing wells per
                  field, but this tab's data does not carry them.
                */}
                {/*
                  P, not D. Petrobangla prints a Sub-Total row per company
                  carrying gas, condensate and "% of Total Production", and
                  these columns reproduce those three. They were briefly marked
                  D on the reasoning that the parser sums per-field lines rather
                  than reading the printed subtotal — but the figures it is
                  reproducing are published ones, and once the extractor bug
                  below was fixed they match to the digit: 479.9 / 139.5 / 91.9 /
                  912.1 / 729.5 MMCFD and 20.4 / 5.9 / 3.9 / 38.8 / 31.0 % on
                  2026-08-08, against Petrobangla's own subtotals. The strip
                  under the table proves it for whichever day is on screen.
                */}
              <span>Field / Company Operator</span>
              <span>
                Gas Produced (MMCFD)
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
              <span>
                Condensate Produced (BBLD)
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
              <span>
                National Gas Share
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
            </div>

            {productionRows.map((gp, idx) => {
              const detailFields = productionFieldsForLabel(archiveDay, gp.company);
              const expandable = detailFields.length > 0;
              const expanded = expandable && expandedProd === gp.company;
              const producerKey = producerKeyFromLabel(gp.company);
              const colors = PRODUCER_COLORS[producerKey];
              return (
                <div
                  key={idx}
                  className={`gas-disclosure__item${expandable ? ' gas-disclosure__item--expandable' : ''}`}
                  data-open={expanded}
                  style={colors ? ({ ['--gas-accent' as string]: colors.accent }) : undefined}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="gas-disclosure__row"
                    aria-expanded={expandable ? expanded : undefined}
                    aria-controls={expandable ? `gas-prod-panel-${idx}` : undefined}
                    disabled={!expandable}
                    onClick={
                      expandable
                        ? () => setExpandedProd(expanded ? null : gp.company)
                        : undefined
                    }
                  >
                    <span className="gas-disclosure__name">
                      {expandable && (
                        <ChevronRight className="gas-disclosure__chevron h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {colors && (
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{gp.company}</span>
                    </span>
                    <Figure label="Gas (MMCFD)" className="font-medium">
                      {gp.gas ? gp.gas.toFixed(1) : '—'}
                    </Figure>
                    {/* BBLD, as the PDF's units line says — barrels per day, a
                        rate. "BBL" turned it into a stock. */}
                    <Figure label="Condensate (BBLD)">
                      {gp.condensate !== undefined ? formatNumber(Math.round(gp.condensate)) : '—'}
                    </Figure>
                    <span className="gas-disclosure__share">
                      <span className="gas-disclosure__label">National share</span>
                      {gp.share !== undefined ? (
                        <>
                          <span className="gas-disclosure__track" aria-hidden="true">
                            <span
                              className={`gas-disclosure__fill ${colors?.bar || 'bg-primary'}`}
                              style={{ width: `${Math.min(100, Math.max(0, gp.share))}%` }}
                            />
                          </span>
                          <span className="gas-disclosure__num text-muted-foreground">
                            {gp.share.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </button>

                  {/* Mounted whether or not it is open, so the panel has a height
                      to animate from in both directions. Its contents are only
                      built for the open company, which is the expensive part. */}
                  <div className="gas-disclosure__panel" id={`gas-prod-panel-${idx}`}>
                    <div className="gas-disclosure__panel-inner">
                      <div className="px-2 pb-2.5 pt-0.5">
                        {expanded && (
                          <ProductionCompanyDetail
                            fields={detailFields}
                            grandTotal={archiveDay?.production?.grand_total ?? null}
                            producerKey={producerKey}
                            label={gp.company}
                            inline
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="gas-disclosure__total" role="listitem">
              <span>
                Grand Total Production
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
              <Figure label="Gas (MMCFD)" className="text-primary">
                {formatNumber(productionTotalGas, 1)}
              </Figure>
              <Figure label="Condensate (BBL)">
                {formatNumber(productionTotalCondensate, 1)}
              </Figure>
              <Figure label="National share">100.0%</Figure>
            </div>
          </div>
          </GridLockedContent>
        </div>

        {/*
          The company rows are rebuilt from the report's per-field lines, so
          they are checked against the grand total the same report prints rather
          than assumed to match it.

          This is what caught the extract_production_values bug: a field name
          qualified after the matched part — "Kailashtila #1 (Silicagel)" — ended
          the number scan early and returned zero, so SGFL published 45.3 MMCFD
          short every day. Days re-ingested since the fix reconcile to 0.1;
          days still carrying figures parsed before it will read "differs by N"
          here until they are re-ingested, which is the honest signal to give.
        */}
        {petrobanglaGrandTotal != null && productionTotalGas > 0 && (() => {
          const delta = productionTotalGas - petrobanglaGrandTotal;
          const ok = Math.abs(delta) <= 0.5;
          return (
            <div className="mt-3 rounded-lg border border-border/50 bg-muted/15 p-3 text-[11px]">
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 tabular-nums">
                <span className="text-muted-foreground">
                  Company rows sum
                  <GridProvenanceTag kind="D" className="ml-1" />
                </span>
                <span>
                  {`${formatNumber(productionTotalGas, 1)} vs ${formatNumber(petrobanglaGrandTotal, 1)} MMCFD published by Petrobangla`}
                  <GridProvenanceTag kind="P" className="ml-1" />
                  <span
                    className={
                      ok
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold ml-2'
                        : 'text-amber-600 dark:text-amber-400 font-bold ml-2'
                    }
                  >
                    {ok ? 'agrees' : `differs by ${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
                  </span>
                </span>
              </div>
              {!ok && (
                <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
                  Petrobangla&rsquo;s own grand total is the figure to trust here. The company rows
                  above are summed from the report&rsquo;s per-field lines by the grid parser, and on
                  this day that sum does not reproduce the total the same report prints.
                </p>
              )}
            </div>
          );
        })()}

        <GridExplanationBlock
          what={
            <>
              <p className="leading-relaxed">This table displays the daily gas volume (MMCFD) and associated condensate liquids (BBLD, barrels per day) produced by local gas fields and foreign operators (Chevron, Tullow), alongside imported liquefied natural gas (LNG) regasified into the grid.</p>
              {/* Computed from the rows on screen. The old sentence said Chevron
                  supplied "over 50% of domestic gas" directly beneath a table
                  showing 37.4% — both true (the 50% excluded LNG), but a reader
                  saw a contradiction. Now the two shares are stated with their
                  denominators, from this day's figures. */}
              {(() => {
                const rows = productionRows.filter((g) => (g.gas ?? 0) > 0);
                const lng = rows.filter((g) => /RPGCL|LNG/i.test(g.company));
                const domestic = rows.filter((g) => !/RPGCL|LNG/i.test(g.company));
                const national = rows.reduce((s, g) => s + (g.gas ?? 0), 0);
                const domesticTotal = domestic.reduce((s, g) => s + (g.gas ?? 0), 0);
                const top = domestic.slice().sort((a, b) => (b.gas ?? 0) - (a.gas ?? 0))[0];
                if (!top || national <= 0 || domesticTotal <= 0) return null;
                const lngTotal = lng.reduce((s, g) => s + (g.gas ?? 0), 0);
                return (
                  <p className="leading-relaxed">
                    <strong>Reading this day:</strong> {top.company} is the largest domestic producer,
                    at {((top.gas ?? 0) / domesticTotal * 100).toFixed(1)}% of gas from Bangladeshi fields
                    and {((top.gas ?? 0) / national * 100).toFixed(1)}% of the national total once imported
                    LNG ({formatNumber(lngTotal, 1)} MMCFD, {(lngTotal / national * 100).toFixed(1)}%) is counted.
                    That concentration in one field and one importer is the exposure the gas-to-power chain carries.
                  </p>
                );
              })()}
              <p className="leading-relaxed"><strong>How Petrobangla calculates this:</strong> Each report covers an 8:00 AM → 8:00 AM &ldquo;gas day&rdquo; and is dated by the morning it closes — the report for the 31 Dec → 1 Jan window is filed under 1 Jan. In the per-field detail, <em>% T. Cap</em> is a field&apos;s gas output divided by national installed capacity, and <em>% T. Prod</em> is its share of the day&apos;s grand-total production. Sub-totals are recomputed from volumes exactly as Petrobangla computes its own subtotal lines; the PDF&apos;s per-field % column is rounded to one decimal (and occasionally misprinted at source), so summing that printed column can drift a few tenths from the official subtotal.</p>
            </>
          }
        />

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Production Reports
            </a>
          </span>
          <span>As published. Not independently audited.</span>
          <span className="font-medium">Reporting Period: Daily Field Snapshot (Date: {gasReportDate})</span>
        </GridCardFooter>
      </div>

      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Database className="h-5 w-5 text-sky-600 shrink-0" />
          <div>
            <h3 className="grid-explorer-chart-card__title">
              Sectorwise Gas Distribution
              <GridDataBadge cadence="daily" />
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Allocated supply (MMCFD) across regional gas distributors •{' '}
              <span className="text-sky-500 font-semibold">{coverageLabel('gasProduction')}</span> •{' '}
              <span className="max-lg:hidden">Click</span>
              <span className="lg:hidden">Tap</span> a distributor for per-plant detail
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
          <div
            className="gas-disclosure"
            data-focused={distFocused}
            style={{ ['--gas-cols' as string]: DIST_COLS }}
            role="list"
            aria-label="Daily gas distribution by distributor"
          >
            {/* Sector splits are read per distributor from the report's
                distribution table; the row total is our sum of the three. */}
            <div className="gas-disclosure__head" aria-hidden="true">
              <span>Distributor</span>
              {/* Column names follow the PDF's own distribution table: Power
                  Plants · Fertilizer · Others-Supl. Petrobangla publishes no
                  industrial split, so "Industrial / Others" under a P mark
                  claimed a figure the source never states. */}
              <span>
                Power Plants Supply
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
              <span>
                Fertilizer Supply
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
              <span>
                Others (Suppl.)
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
              <span>
                Total Gas Distributed
                <GridProvenanceTag kind="P" className="ml-1" />
              </span>
            </div>

            {distributionRows.map((gd, idx) => {
              const detailCompany = distributionCompanyForLabel(archiveDay, gd.company);
              const expandable = detailCompany != null;
              const expanded = expandable && expandedDist === gd.company;
              const distributorKey = gd.company.toUpperCase().split(/[\s(]/)[0];
              const colors = DISTRIBUTOR_COLORS[distributorKey];
              const shareOfTotal = distGrandTotal > 0 ? (gd.total / distGrandTotal) * 100 : null;
              return (
                <div
                  key={idx}
                  className={`gas-disclosure__item${expandable ? ' gas-disclosure__item--expandable' : ''}`}
                  data-open={expanded}
                  style={colors ? ({ ['--gas-accent' as string]: colors.accent }) : undefined}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="gas-disclosure__row"
                    aria-expanded={expandable ? expanded : undefined}
                    aria-controls={expandable ? `gas-dist-panel-${idx}` : undefined}
                    disabled={!expandable}
                    onClick={
                      expandable
                        ? () => setExpandedDist(expanded ? null : gd.company)
                        : undefined
                    }
                  >
                    <span className="gas-disclosure__name">
                      {expandable && (
                        <ChevronRight className="gas-disclosure__chevron h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {colors && (
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{gd.company}</span>
                    </span>
                    <Figure label="Power grid">{gd.power.toFixed(1)}</Figure>
                    <Figure label="Fertilizer">{gd.fertilizer.toFixed(1)}</Figure>
                    <Figure label="Industrial / others" className="text-muted-foreground">
                      {gd.others.toFixed(1)}
                    </Figure>
                    <span className="gas-disclosure__share">
                      <span className="gas-disclosure__label">Total distributed</span>
                      {shareOfTotal != null && (
                        <span className="gas-disclosure__track" aria-hidden="true">
                          <span
                            className={`gas-disclosure__fill ${colors?.bar || 'bg-primary'}`}
                            style={{ width: `${Math.min(100, Math.max(0, shareOfTotal))}%` }}
                          />
                        </span>
                      )}
                      <span className="gas-disclosure__num font-semibold">
                        {gd.total.toFixed(1)}
                      </span>
                    </span>
                  </button>

                  <div className="gas-disclosure__panel" id={`gas-dist-panel-${idx}`}>
                    <div className="gas-disclosure__panel-inner">
                      <div className="px-2 pb-2.5 pt-0.5">
                        {expanded && detailCompany && (
                          <DistributionCompanyDetail
                            company={detailCompany}
                            distributorKey={distributorKey}
                            label={gd.company}
                            inline
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="gas-disclosure__total" role="listitem">
              <span>National Total Supply</span>
              <Figure label="Power grid" className="text-primary">
                {distPowerTotal.toFixed(1)}
              </Figure>
              <Figure label="Fertilizer">{distFertTotal.toFixed(1)}</Figure>
              <Figure label="Industrial / others">{distOthersTotal.toFixed(1)}</Figure>
              <Figure label="Total distributed" className="text-primary">
                {distGrandTotal.toFixed(1)}
              </Figure>
            </div>
          </div>
          </GridLockedContent>
        </div>

        <GridExplanationBlock
          what={
            <>
              <p className="leading-relaxed">This table tracks the distribution of natural gas across different sectors (power grid generators, fertilizer plants, and industrial/domestic consumers) by regional distribution utilities.</p>
              <p className="leading-relaxed"><strong>Analytical Insight:</strong> Natural gas distribution is heavily skewed toward the power sector and industrial customers. Titas Gas (TGTDCL) remains the largest distributor by volume. Under gas supply shortages, fertilizer plants and industries are often rationed to prioritize power generation, illustrating the competing demands for limited gas supply.</p>
              <p className="leading-relaxed"><strong>How Petrobangla calculates this:</strong> In the per-plant detail, &ldquo;demand&rdquo; is each plant&apos;s nominal gas requirement at full output and &ldquo;supply&rdquo; is the metered delivery over the same 8:00 AM → 8:00 AM gas day; plants with zero supply form the report&apos;s shutdown list. Because plants never all peak simultaneously, Petrobangla also applies its own diversity factor (typically ×0.85) to raw power demand to estimate the realistic requirement — the True Power-Gas Gap KPI above is measured against that adjusted demand, not the raw plant total.</p>
            </>
          }
        />

        {/* Phones: the acronym glossary is reference material, so it sits behind
            a fold (MobileFold is a no-op wrapper at >=1024px). */}
        <MobileFold title="Gas sector acronyms & units">
        <div className="mt-4 space-y-3 rounded-2xl border border-border/30 bg-muted/5 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 text-sky-500" /> Gas Sector Acronyms &amp; Units Footnote
          </div>
          <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed text-muted-foreground sm:grid-cols-3 md:grid-cols-6">
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
        </MobileFold>

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Distribution Reports
            </a>
          </span>
          <span>As published. Not independently audited.</span>
          <span className="font-medium">Reporting Period: Daily Distribution Allocation (Date: {gasReportDate})</span>
        </GridCardFooter>
      </div>
    </div>
  );
}