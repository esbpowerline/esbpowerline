'use client';

import type * as React from 'react';
import { Info, Cable, FileText, Factory } from 'lucide-react';
import { GridLockedContent } from '@/components/news/power-grid/GridLockedContent';
import { RegionalKpiStrip } from '@/components/news/power-grid/TabKpiStrips';
import { DailyBadge, GridProvenanceTag, GridCardFooter, GridSourceFiles } from '@/components/news/power-grid/GridExplorerUI';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { formatNumber, cn } from '@/lib/utils';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { InterconnectorCanvas } from '@/components/news/power-grid/InterconnectorCanvas';
import { DEMO_DATE } from '@/components/news/power-grid/tabs/shared';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import type { DailyOutageItem, EwicData, GridSystemStats, RegionalDemandItem, ZoneGenerationItem } from '@/lib/data/grid/types';
import type { ChartTheme } from '@/hooks/useChartTheme';

export type RegionalPanelProps = {
  /** The selected day and the payload read from it. */
  day: {
    selectedDate: string;
    tierLockRequired: GridAccessTier | null;
    systemStats: GridSystemStats;
    regionalDemandData: RegionalDemandItem[];
    sourceFiles: { pgcb?: string | undefined; petrobangla?: string | undefined; } | undefined;
    regionalDemandSource: "p1-published" | "derived-served-plus-shed" | "bpdb-published" | null | undefined;
    dailyOutages: DailyOutageItem[];
    zoneGenerationData: ZoneGenerationItem[];
  };
  /** Values the parent derives from the day (totals, chart series, flags). */
  derived: {
    eveningPeakStamp: string | null;
    totalRegionalDemand: number;
    totalRegionalLoadShed: number;
    avgRegionalPct: string;
    zoneGenNationalTotal: number;
    zoneGenFuels: string[];
    formatZoneEnergy: (value: number | undefined) => string;
    zoneGenPublishedTotals: Record<string, number>;
    ewic: EwicData | null;
    ewicTotalMkwh: number | null;
    ewicShareOfGen: number | null;
    ewicExceedsGeneration: boolean;
    ewicNet: { westToEast: boolean; } | null;
    ewicPeakSum: { mw: number; time: string; } | null;
    ewicCircuitBars: { circuit: string; energyKwh: number; pct: number; corridorIndex: number; }[];
  };
  /** View state and theme the parent owns; kept there so it survives a tab switch exactly as before. */
  ui: {
    belowDesktop: boolean;
    showAllOutages: boolean;
    chartTheme: ChartTheme;
  };
  /** State setters owned by the parent. */
  actions: {
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
    setShowAllOutages: React.Dispatch<React.SetStateAction<boolean>>;
  };
};

export function RegionalPanel({ day, derived, ui, actions }: RegionalPanelProps) {
  const { selectedDate, tierLockRequired, systemStats, regionalDemandData, sourceFiles, regionalDemandSource, dailyOutages, zoneGenerationData } = day;
  const { eveningPeakStamp, totalRegionalDemand, totalRegionalLoadShed, avgRegionalPct, zoneGenNationalTotal, zoneGenFuels, formatZoneEnergy, zoneGenPublishedTotals, ewic, ewicTotalMkwh, ewicShareOfGen, ewicExceedsGeneration, ewicNet, ewicPeakSum, ewicCircuitBars } = derived;
  const { belowDesktop, showAllOutages, chartTheme } = ui;
  const { setSelectedDate, setShowAllOutages } = actions;
  return (
    selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">Zone-wise Demand &amp; Load-Shedding Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. Zone-wise demand and load-shedding tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          {/* The zone table is BPDB's on the days PGCB published none, so the
              strip names whichever sheet this day's rows actually came from. */}
          <RegionalKpiStrip
            systemStats={systemStats}
            regionalDemandData={regionalDemandData}
            sourceFiles={sourceFiles}
            sourceLabel={
              regionalDemandSource === 'bpdb-published'
                ? 'BPDB daily generation report — zone table'
                : 'P1 sheet — zone-wise demand and load-shed table'
            }
          />

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Regional Table */}
            <div className="grid-explorer-chart-card card lg:col-span-2">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <Cable className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">Zone-wise Demand &amp; Load-Shedding<DailyBadge /></h3>
                  {/* The hour is read from P1's own stamp rather than named in
                      prose. It genuinely varies (18:00–21:00 across verified
                      2025–26 days), which is why hardcoding one here was wrong
                      on most days; the sheet has always printed it. Omitted,
                      not guessed, on layouts that carry no stamp. */}
                  <p className="grid-explorer-chart-card__sub">
                    SCADA readings at the evening peak hour {regionalDemandSource === 'bpdb-published' ? 'BPDB' : 'PGCB'} reports for the day
                    {eveningPeakStamp ? (
                      <> — <span className="text-foreground font-semibold">{eveningPeakStamp} hr</span><GridProvenanceTag kind="P" className="ml-1" /></>
                    ) : null}
                    {' '}• <span className="text-primary font-semibold text-xs">{coverageLabel('regionalDemand')}</span>
                  </p>
                </div>
              </div>

              {/* Four columns, and the first is the zone name — so below 40rem
                  each zone becomes a labelled block instead of something to be
                  dragged sideways. */}
              <div className="grid-explorer-table-wrap">
                <table className="grid-explorer-table grid-explorer-table--stack ge-zone-compact">
                  <thead>
                    <tr>
                      <th>Grid Zone</th>
                      <th className="text-left">Evening Demand (MW)<GridProvenanceTag kind={regionalDemandSource === 'derived-served-plus-shed' ? 'D' : 'P'} className="ml-1" /></th>
                      <th className="text-left">Load-Shedding (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-left">Shedding Severity<GridProvenanceTag kind="D" className="ml-1" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalDemandData.map((rd, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold">{rd.zone}</td>
                        {/* Unit on the cell, not only in the header: on a phone the
                            header is hidden and this read "6,259" beside "743 MW". */}
                        <td data-label="Evening demand" className="text-left tabular-nums font-medium">{formatNumber(rd.demand)} MW</td>
                        <td data-label="Load-shedding" className="text-left tabular-nums text-destructive font-semibold">
                          {rd.loadShed > 0 ? `${rd.loadShed} MW` : '0 MW'}
                        </td>
                        <td data-label="Severity" className="text-left tabular-nums">
                          {rd.loadShed > 0 ? (
                            <div className="flex items-center justify-start gap-1.5">
                              <span className="font-mono font-bold text-xs text-amber-500">{rd.pct}%</span>
                              <div className="w-12 h-2 rounded bg-muted overflow-hidden">
                                {/* Linear. This bar used to be drawn at pct x 4,
                                    so every zone at or above 25% shed painted
                                    full and the bar contradicted the number
                                    printed beside it. The footer states the
                                    method, so the drawing has to match it. */}
                                <div
                                  className="h-full bg-amber-500 rounded grid-bar-fill"
                                  style={{ width: `${Math.min(rd.pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-emerald-500 text-xs font-semibold">Clean (0%)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="is-total border-t border-border/80 font-bold bg-muted/20">
                      <td>Entire Grid Total<GridProvenanceTag kind="D" className="ml-1" /></td>
                      <td data-label="Evening demand" className="text-left tabular-nums text-primary">{formatNumber(totalRegionalDemand)} MW</td>
                      <td data-label="Load-shedding" className="text-left tabular-nums text-destructive">{formatNumber(totalRegionalLoadShed)} MW</td>
                      {/* Not the mean of the nine zone percentages — the
                          demand-weighted grid ratio. Labelled accordingly. */}
                      <td data-label="Severity" className="text-left tabular-nums text-primary">{avgRegionalPct}% grid-wide</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <MobileFold title="About this table"><div className="px-4 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                {regionalDemandSource === 'bpdb-published' ? (
                  <>
                    <strong className="text-foreground">This day is BPDB&rsquo;s table, not PGCB&rsquo;s.</strong>{' '}
                    No PGCB report for this date is held, so the figures come from BPDB&rsquo;s own
                    published zone Demand / Supply / Load-shed table for the same evening peak —
                    a second publisher of the same reading, checked against BPDB&rsquo;s printed
                    total. Severity and the totals row are computed here.
                  </>
                ) : regionalDemandSource === 'derived-served-plus-shed' ? (
                  <>
                    On this day the demand figure is reconstructed as area served + load-shed
                    (no local copy of PGCB&rsquo;s printed Demand column yet) — a derived stand-in,
                    not the published cell. Load-shed is PGCB&rsquo;s own figure; severity and the
                    totals row are computed here.
                  </>
                ) : (
                  <>
                    Demand and load-shed are PGCB&rsquo;s own zone table, verified cell-for-cell
                    against the source workbooks across 2025 and 2026. Severity and the totals row
                    are computed here.
                  </>
                )}
              </div></MobileFold>

              {/* Card Metadata Footer */}
              {/* The method behind the only computed column on this card,
                  stated rather than left to be inferred from the D tag. */}
              <MobileFold title="How severity is calculated"><div className="px-4 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">How severity is calculated</span>
                <GridProvenanceTag kind="D" className="ml-1.5" />
                <span className="mx-1.5 text-muted-foreground/50">·</span>
                Shedding severity = that zone&rsquo;s load-shed ÷ its demand × 100, to one decimal.
                Demand is the full figure including the shed portion, so severity is the share of
                demand that went unserved; the bar is drawn to the same percentage. The final row
                divides the summed shed by the summed demand — a grid-wide ratio, which is not the
                same as averaging the nine zone percentages and will read lower when shedding
                falls on the smaller zones. Both inputs are published; neither publisher states a
                severity figure.
              </div></MobileFold>

              <GridCardFooter>
                {regionalDemandSource === 'bpdb-published' ? (
                  <span>Source: <a href="https://misc.bpdb.gov.bd/daily-generation-archive" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Daily Generation Report</a> — zone table</span>
                ) : (
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, zone-wise demand and load-shed table</span>
                )}
                {/* On BPDB-sourced days the PGCB workbook is not what produced this
                    table, so naming it would miscredit the figures. */}
                {regionalDemandSource !== 'bpdb-published' && sourceFiles?.pgcb ? (
                  <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} />
                ) : null}
                <span>As published. Not independently audited.</span>
                <span className="font-medium">Reporting Period: Evening Peak Load (Date: {systemStats.date})</span>
              </GridCardFooter>
            </div>

            {/* Daily Outage Log */}
            <div className="grid-explorer-chart-card card lg:col-span-1">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <FileText className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">NLDC Outage Log<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">Outage events as printed in the day&rsquo;s report ({systemStats.date}) •<span className="text-primary font-semibold text-xs">{coverageLabel('outages')}</span></p>
                  {/* Not uniformly P: PGCB prints ONE free-text description per
                      event, and the asset/cause split shown below is ours. */}
                  <p className="mt-1.5 text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <GridProvenanceTag kind="P" /> time, description, lost load
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GridProvenanceTag kind="D" /> split into asset and cause
                    </span>
                  </p>
                </div>
              </div>

              {/* Grows into whatever height the zone table beside it sets, rather
                  than stopping at a fixed 31.5rem and leaving the footer stranded
                  at the bottom of the stretched card. The basis keeps that height
                  when the card stands alone (one column on small screens), and
                  min-h-0 lets the scroll container shrink instead of forcing the
                  full list height. */}
              <div className="ge-outage-list space-y-4 flex-[1_1_31.5rem] min-h-0 overflow-y-auto pr-1">
                {(belowDesktop && !showAllOutages ? dailyOutages.slice(0, 5) : dailyOutages).map((o, idx) => (
                  <div key={idx} className="ge-outage-item p-3 bg-muted/15 border border-border/30 rounded-lg text-xs space-y-1">
                    <div className="ge-outage-item__head flex justify-between gap-3 font-bold text-foreground">
                      <span>{o.plant}</span>
                      <span className="text-muted-foreground font-mono font-normal">{o.time}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <span>{o.reason}</span>
                      {/* `load` holds a published MW figure only when the report
                          prints one; otherwise the parser stores the literal
                          "HT Outage", which is a category, not a measurement,
                          and must not be styled like one. */}
                      {/\d/.test(o.load) ? (
                        <span className="font-semibold text-destructive whitespace-nowrap">
                          {o.load}
                          <GridProvenanceTag kind="P" className="ml-1" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 whitespace-nowrap italic">
                          no load stated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Phone/tablet only: the full list is one tap away, nothing is dropped. */}
                {belowDesktop && dailyOutages.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllOutages((v) => !v)}
                    className="ge-outage-toggle w-full rounded-lg border border-border/50 text-sm font-semibold text-primary"
                  >
                    {showAllOutages ? 'Show fewer' : `Show all ${dailyOutages.length}`}
                  </button>
                ) : null}
              </div>

              {/* Card Metadata Footer */}
              <GridCardFooter>
                <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, NLDC daily outage log</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
                <span>Asset and cause are cut from PGCB&rsquo;s single event description; the wording is theirs.</span>
                <span className="font-medium">Reporting Period: 24-Hour Logs (Date: {systemStats.date})</span>
              </GridCardFooter>
            </div>

            {/* Zone-wise generation. The table above is what each zone was
                asked for; this is what it produced. The two are deliberately
                never divided into one another — demand there is MW at a single
                instant, generation here is MKWh across the whole day, and a
                self-sufficiency ratio built from the pair would be meaningless.
                Read side by side they still carry the point: Mymensingh's four
                MKWh against Barishal's sixty is the transmission task. */}
            {zoneGenerationData.length > 0 ? (
              <div className="grid-explorer-chart-card card lg:col-span-3">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <Factory className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Zone-wise Generation by Fuel<DailyBadge /></h3>
                    <p className="grid-explorer-chart-card__sub">
                      Energy generated inside each zone across the full day, in MKWh
                      {zoneGenNationalTotal > 0 ? <> • {zoneGenNationalTotal.toFixed(2)} MKWh national <GridProvenanceTag kind="P" /></> : null}
                    </p>
                  </div>
                  <span className="grid-explorer-chip">P1</span>
                </div>

                {/* Nine zones by eight fuels. Stacked whole that is 72
                    label/value pairs on a phone, half of them zero, so the
                    zeros drop out of the list and are named together on the
                    "No output" line below each zone — moved, not discarded. */}
                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table grid-explorer-table--stack-wide ge-zone-compact">
                    <thead>
                      <tr>
                        <th>Grid Zone</th>
                        {zoneGenFuels.map((fuel) => (
                          <th key={fuel} className="text-left whitespace-nowrap">
                            {/* The eight fuel hues cannot be told apart by colour
                                alone, so each is named here beside its swatch
                                rather than relying on a legend. */}
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                aria-hidden="true"
                                className="inline-block h-2 w-2 rounded-sm shrink-0"
                                style={{ backgroundColor: chartTheme.fuel(fuel) }}
                              />
                              {fuel}
                            </span>
                            <GridProvenanceTag kind="P" className="ml-1" />
                          </th>
                        ))}
                        <th className="text-left">Zone Total<GridProvenanceTag kind="P" className="ml-1" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneGenerationData.map((zg) => (
                        <tr key={zg.zone}>
                          <td className="font-semibold whitespace-nowrap">{zg.zone}</td>
                          {zoneGenFuels.map((fuel) => (
                            <td
                              key={fuel}
                              data-label={fuel}
                              className={cn(
                                'text-left tabular-nums',
                                zg.fuels[fuel]
                                  ? 'font-medium'
                                  : 'is-zero text-muted-foreground/60',
                              )}
                            >
                              {formatZoneEnergy(zg.fuels[fuel])}
                            </td>
                          ))}
                          <td data-label="Zone total" className="text-left tabular-nums font-semibold text-primary">{zg.total.toFixed(2)}</td>
                          {/* Phone only. Named rather than counted: "5 fuels at
                              zero" would be a summary, and this is the reading
                              PGCB published for each of them. */}
                          <td data-label="No output" className="grid-explorer-table__zeros">
                            {zoneGenFuels.filter((f) => !zg.fuels[f]).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                      <tr className="is-total border-t border-border/80 font-bold bg-muted/20">
                        <td>National Total</td>
                        {zoneGenFuels.map((fuel) => (
                          <td
                            key={fuel}
                            data-label={fuel}
                            className={cn(
                              'text-left tabular-nums',
                              zoneGenPublishedTotals[fuel] ? '' : 'is-zero',
                            )}
                          >
                            {formatZoneEnergy(zoneGenPublishedTotals[fuel])}
                          </td>
                        ))}
                        <td data-label="Zone total" className="text-left tabular-nums text-primary">{zoneGenNationalTotal.toFixed(2)}</td>
                        <td data-label="No output" className="grid-explorer-table__zeros">
                          {zoneGenFuels.filter((f) => !zoneGenPublishedTotals[f]).join(', ') || '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <MobileFold title="Every figure on this card is published"><div className="px-4 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Every figure on this card is published</span>
                  <GridProvenanceTag kind="P" className="ml-1.5" />
                  <span className="mx-1.5 text-muted-foreground/50">·</span>
                  PGCB prints this table zone by zone and states its own National Total row, which is
                  the row shown here and the same one the fuel-mix chart is built from. The nine zone
                  rows sum to it, so the two are a check on each other rather than one being derived
                  from the other. A dash means the fuel has no column on this day&rsquo;s sheet; a
                  zero means the zone generated none. Figures under 0.01 MKWh are shown as
                  &lsquo;&lt;0.01&rsquo; rather than rounded to nothing.
                </div></MobileFold>

                <GridCardFooter>
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, zone-wise generation summary</span>
                  {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
                  <span>As published. Not independently audited.</span>
                  <span className="font-medium">Reporting Period: Full day (Date: {systemStats.date})</span>
                </GridCardFooter>
              </div>
            ) : null}

            {/* East-West Interconnector. Full width, and last: the two cards
                above are the two halves of each zone's day — what it was asked
                for, and what it generated — and this is the wire that carries
                the difference between the country's halves. A 24-hour series
                also reads better across the full width than in two thirds. */}
            {ewic ? (
              <div className="grid-explorer-chart-card card lg:col-span-3">
                <div className="grid-explorer-chart-card__head">
                  <div className="flex items-center gap-2.5 min-w-0">
                  <Cable className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <h3 className="grid-explorer-chart-card__title">East-West Interconnector Transfer<DailyBadge /></h3>
                    <p className="grid-explorer-chart-card__sub">
                      Hourly flow across the three corridors joining the western and eastern grids
                      {ewicTotalMkwh != null ? (
                        <> • {ewicTotalMkwh.toFixed(2)} MKWh transferred <GridProvenanceTag kind="P" />
                          {ewicShareOfGen != null ? <> · {ewicShareOfGen.toFixed(1)}% of national generation <GridProvenanceTag kind="D" /></> : null}
                          {ewicExceedsGeneration ? (
                            <span className="text-amber-600 dark:text-amber-500 font-semibold">
                              {' '}· exceeds the day&rsquo;s national generation — see the reconciliation note
                            </span>
                          ) : null}
                          {ewicNet ? <> · flowing {ewicNet.westToEast ? 'west to east' : 'east to west'}</> : null}
                          {ewicPeakSum ? <> · peak {formatNumber(Math.round(Math.abs(ewicPeakSum.mw)))} MW at {ewicPeakSum.time}<GridProvenanceTag kind="P" /></> : null}
                        </>
                      ) : null}
                    </p>
                  </div>
                  </div>
                  <span className="grid-explorer-chip">EWIC</span>
                </div>

                {/* The sheet's own footnote defines the sign, and the whole card
                    is unreadable without it — so it is stated, not buried. */}
                <p className="text-[11px] text-muted-foreground mb-3">
                  Positive MW is flow from <strong>West to East</strong>; negative is East to West.
                  Every reading in the archive so far has been positive — the western grid has
                  exported to the eastern one on every hour on record, and Total Import has been
                  zero on every day.
                </p>

                {/* Corridor names appear on the lanes and again on the bands
                    they label, so no separate legend is carried: a key exists to
                    stop a reader matching colours, and there is nothing here to
                    match. */}
                <InterconnectorCanvas
                  corridors={ewic.corridors}
                  rows={ewic.rows}
                  color={(i) => chartTheme.categorical(i)}
                  axisColor={chartTheme.axisTick}
                  gridColor={chartTheme.gridStroke}
                  reportDate={systemStats.date}
                />

                {/* Per-circuit metered energy. Ranked, and labelled in place —
                    six bars do not need a second colour scale to be read. */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Metered energy by circuit <GridProvenanceTag kind="P" />
                  </h4>
                  <div className="space-y-1.5">
                    {ewicCircuitBars.map((c) => (
                      <div key={c.circuit} className="ge-circuit-row flex items-center gap-3 text-[11px]">
                        <span className="w-44 shrink-0 text-muted-foreground truncate">{c.circuit}</span>
                        <span className="flex-1 h-3 rounded-sm bg-muted/30 overflow-hidden">
                          <span className="block h-full rounded-sm grid-bar-fill" style={{ width: `${c.pct}%`, background: chartTheme.categorical(c.corridorIndex) }} />
                        </span>
                        <span className="w-24 shrink-0 text-right font-semibold tabular-nums">{(c.energyKwh / 1e6).toFixed(2)} MKWh</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* A failed reconciliation is shown to the reader, not swallowed
                    — the same rule the gas Sub-Total gate follows. */}
                {ewic.checks.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
                    <div className="text-[11px] font-bold text-amber-500 mb-1">Reconciliation note</div>
                    {ewic.checks.map((c) => (
                      <p key={c.scope} className="text-[11px] text-muted-foreground leading-relaxed">{c.message}</p>
                    ))}
                  </div>
                ) : null}

                <GridCardFooter>
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — EWIC sheet, East-West Interconnector Log</span>
                  {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
                  <span>Flows and circuit energy as published. The energy column is headed &ldquo;MkWHr&rdquo; and printed in kWh; converted here, not restated.</span>
                  <span className="font-medium">Reporting Date: {systemStats.date}</span>
                </GridCardFooter>
              </div>
            ) : null}

          </div>

          {/*
            "Transmission Grid Assets" was removed here.

            It rendered `settings.gridLines` — four rows typed into the admin
            Settings form, with a hardcoded fallback — under a footer crediting
            "Power Grid Bangladesh PLC — transmission line register" and a link
            to pgcb.gov.bd. No such register is read by anything in this
            pipeline, so the card attributed hand-entered content to an agency
            that never supplied it, beside genuinely daily PGCB data, in a tab
            keyed to a date the card had no relationship with. Its subtitle also
            claimed "Tracked since 2014" for a list carrying no dates at all.

            The right fix would be a real source. There is not one: PGCB
            publishes no machine-readable line register, and nothing in the daily
            report carries per-line capacity or status. Rather than keep a card
            whose provenance cannot be stated truthfully, it is gone. The
            settings field and the admin editor are left in place, so this can
            return the day it has something behind it.
          */}
        </div>
        </GridLockedContent> )
  );
}
