'use client';

import { useState } from 'react';
import { Zap, Droplet, Cable, Info, ChevronDown } from 'lucide-react';
import { cn, formatNumber, formatUnitRate } from '@/lib/utils';
import type { GridDailyData } from '@/lib/data/grid/types';

/**
 * The print-only "National Power Grid Audit Report".
 *
 * Moved out of PowerGridExplorer.tsx (O7, Phase 3): it was rendered, hidden by
 * `hidden print:block`, on every tab of every visit - about 230 DOM nodes no
 * screen ever shows. The explorer now mounts it only while the browser is
 * printing (see usePrintMode). Markup and classes are unchanged, so the
 * printed page is the same. `isMethodologyOpen` lived in the explorer but its
 * only reader was this block's button, which cannot be clicked on screen, so it
 * is local state here.
 */
export function GridPrintReport({
  systemStats,
  generationData,
  totalGenMkwhr,
  totalCostBdt,
  hasPublishedFuelCost,
  gasProductionData,
  gasDistributionData,
  regionalDemandData,
  regionalDemandSource,
  dailyOutages,
}: {
  systemStats: GridDailyData['systemStats'];
  generationData: GridDailyData['generationData'];
  totalGenMkwhr: number;
  totalCostBdt: number;
  hasPublishedFuelCost: boolean;
  gasProductionData: NonNullable<GridDailyData['gasProductionData']>;
  gasDistributionData: NonNullable<GridDailyData['gasDistributionData']>;
  regionalDemandData: NonNullable<GridDailyData['regionalDemandData']>;
  regionalDemandSource: GridDailyData['regionalDemandSource'];
  dailyOutages: NonNullable<GridDailyData['dailyOutages']>;
}) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  return (
    <div className="hidden print:block print-report space-y-10">
      {/* Report Header */}
      <div className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Bangladesh Energy Sector Briefing</div>
            {/* p, not h1: a second h1 in the document costs the page its
                single-heading structure for crawlers. */}
            <p className="text-3xl font-bold tracking-tight text-foreground mt-1">National Power Grid Audit Report</p>
            <p className="text-xs text-muted-foreground mt-1">Comprehensive grid performance analytics, fuel audits, and asset directories.</p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-foreground">ESB PowerLine Intelligence</div>
            <div className="text-muted-foreground mt-0.5 font-semibold text-primary">Classification: Member Executive Briefing</div>
            <div className="text-muted-foreground">Generated: {systemStats.date}</div>
          </div>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Evening Peak Demand</span>
          <div className="text-lg font-bold text-foreground mt-1">{formatNumber(Math.round(systemStats.eveningPeakDemand))} MW</div>
        </div>
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Evening Peak Gen</span>
          <div className="text-lg font-bold text-foreground mt-1">{formatNumber(Math.round(systemStats.eveningPeakGen))} MW</div>
        </div>
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Daily Generation</span>
          <div className="text-lg font-bold text-foreground mt-1">{systemStats.totalEnergyGen == null ? '—' : `${systemStats.totalEnergyGen.toFixed(1)} MKWh`}</div>
        </div>
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Avg. Generation Cost</span>
          <div className="text-lg font-bold text-foreground mt-1">{formatUnitRate(systemStats.avgProductionCost)} Tk/kWh</div>
        </div>
      </div>

      {/* Section 1: Daily Generation Mix & Fuel Audits */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Zap className="h-4 w-4 shrink-0" /> 1. Daily Generation Mix & Fuel Audits
        </h2>
        <table className="print-report-table w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="text-left py-1.5 px-2 font-bold">Fuel Type</th>
              <th className="text-right py-1.5 px-2 font-bold">Output (MKWh)</th>
              <th className="text-right py-1.5 px-2 font-bold">Daily Cost (BDT)</th>
              <th className="text-right py-1.5 px-2 font-bold">Unit Cost (Tk/kWh)</th>
              <th className="text-right py-1.5 px-2 font-bold">System Share</th>
            </tr>
          </thead>
          <tbody>
            {generationData.map((item) => (
              <tr key={item.name} className="border-b border-border/40">
                <td className="py-1.5 px-2 font-medium">{item.name}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{item.gen.toFixed(2)}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{item.cost != null && item.cost > 0 ? formatNumber(item.cost) : '—'}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{item.unitCost != null && item.unitCost > 0 ? `${item.unitCost.toFixed(2)} Tk` : '—'}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{((item.gen / totalGenMkwhr) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="font-bold bg-muted/5 border-t border-border">
              <td className="py-1.5 px-2">Total System</td>
              <td className="text-right py-1.5 px-2 tabular-nums">{totalGenMkwhr.toFixed(2)}</td>
              <td className="text-right py-1.5 px-2 tabular-nums">{hasPublishedFuelCost ? formatNumber(totalCostBdt) : '—'}</td>
              <td className="text-right py-1.5 px-2 tabular-nums">{hasPublishedFuelCost ? `${formatUnitRate(totalCostBdt / (totalGenMkwhr * 1000000))} Tk` : '—'}</td>
              <td className="text-right py-1.5 px-2">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Gas Distribution & LNG Supply */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Droplet className="h-4 w-4 shrink-0" /> 2. Gas Distribution & LNG Supply
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Daily Production by Operator</h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Operator / Field</th>
                  <th className="text-right py-1.5 px-2">Gas (MMCFD)</th>
                  <th className="text-right py-1.5 px-2">Share</th>
                </tr>
              </thead>
              <tbody>
                {gasProductionData.map((gp, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 px-2 font-medium">{gp.company}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gp.gas.toFixed(1)}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gp.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            {/* Petrobangla's distribution table has three supply columns: Power
                Plants, Fertilizer and "Others-Supl.". It publishes no industry
                split; calling the third column Industry claimed one. */}
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Power, Fertilizer and Others Distribution</h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Distributor</th>
                  <th className="text-right py-1.5 px-2">Power (MMCFD)</th>
                  <th className="text-right py-1.5 px-2">Others (Suppl.)</th>
                  <th className="text-right py-1.5 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {gasDistributionData.map((gd, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 px-2 font-medium">{gd.company}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gd.power.toFixed(1)}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gd.others.toFixed(1)}</td>
                    <td className="text-right py-1 px-2 tabular-nums font-semibold">{gd.total.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: Regional Grid Performance & Outages */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Cable className="h-4 w-4 shrink-0" /> 3. Regional Grid Performance & Outage Logs
        </h2>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
              Zone-wise Demand &amp; Load-Shedding
              {/* The printed report must name the publisher too: on days with no
                  PGCB copy these are BPDB's figures. */}
              <span className="normal-case font-normal text-muted-foreground/80">
                {' '}— {regionalDemandSource === 'bpdb-published' ? 'BPDB' : 'PGCB'} published
                {regionalDemandSource === 'derived-served-plus-shed' ? ' (demand derived)' : ''}
              </span>
            </h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Grid Zone</th>
                  <th className="text-right py-1.5 px-2">Demand (MW)</th>
                  <th className="text-right py-1.5 px-2">Load-Shedding (MW)</th>
                  <th className="text-right py-1.5 px-2">Shedding Share</th>
                </tr>
              </thead>
              <tbody>
                {regionalDemandData.map((rd, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 px-2 font-medium">{rd.zone}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{formatNumber(rd.demand)}</td>
                    <td className="text-right py-1 px-2 tabular-nums text-destructive font-semibold">{rd.loadShed > 0 ? `${rd.loadShed} MW` : '0 MW'}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{rd.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="col-span-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">NLDC Outage Log (Yesterday)</h3>
            <div className="space-y-2 text-[9px]">
              {dailyOutages.slice(0, 6).map((o, idx) => (
                <div key={idx} className="p-2 border border-border/40 rounded bg-muted/5 space-y-0.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span className="truncate pr-1">{o.plant}</span>
                    <span className="font-mono text-muted-foreground font-normal shrink-0">{o.time}</span>
                  </div>
                  <div className="text-muted-foreground truncate">{o.reason}</div>
                  <div className="text-destructive font-semibold">{o.load}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/*
        Section 4, "Infrastructure Assets & Planning Tracker", was removed with
        the Transmission Grid Assets card it mirrored. Its one remaining table
        printed the same hand-entered `settings.gridLines` rows under a "Source:
        PGCB System Operations & NLDC National Grid Map" credit — a second false
        attribution for the same unsourced content, and worse here, because a
        printed report is the artefact a reader keeps and cites. Its sibling
        (hardcoded "Upcoming Generation Projects") had already gone for the same
        reason, leaving the section with nothing that could be sourced.
      */}

      {/* Data Methodology & Reconciliation Guide */}
      <div className="card mt-6 border border-border/60 bg-muted/5 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
          className="w-full flex items-center justify-between p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted/15 transition-colors select-none"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
            Data Methodology &amp; Reconciliation Guide
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isMethodologyOpen && "rotate-180")} />
        </button>

        {isMethodologyOpen && (
          <div className="p-4 md:p-6 border-t border-border/40 text-xs text-muted-foreground/90 space-y-4 leading-relaxed bg-card text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Estimated Net Fuel Cost (KPI Card)
                </h4>
                <p>
                  The <strong>Est. Fuel Cost</strong> card at the top of the Grid Explorer displays the <strong>Net System Level Cost</strong>. This reflects the actual cost of bulk power injected and distributed to the national grid after accounting for generating station auxiliary consumption and grid transmission losses.
                </p>
                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1.5 font-mono text-[10px] md:text-xs text-foreground">
                  <div className="font-bold text-[10px] uppercase text-primary/80">Calculation Formula:</div>
                  <div>Net System Cost = Total Net Energy Generated (MKWh) × Avg Production Cost (Tk/kWh) × 10,000,000</div>
                  <div className="text-muted-foreground mt-1 text-[9px]">※ Excludes auxiliary consumption (~8-10%) and transmission losses (~3%).</div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Gross Production Cost Breakdown (Charts)
                </h4>
                <p>
                  The <strong>Daily Fuel &amp; Import Cost</strong> chart displays the <strong>Gross Production Cost</strong>. It aggregates the cost of fuel burned directly at the generator busbar and cross-border transactions at their individual unit rates.
                </p>
                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1.5 font-mono text-[10px] md:text-xs text-foreground">
                  <div className="font-bold text-[10px] uppercase text-emerald-500/80">Calculation Formula:</div>
                  <div>Gross Cost = Sum of [Individual Fuel Gross Generation (MKWh) × Estimated Fuel Unit Rate (Tk/kWh) × 1,000,000]</div>
                  <div className="text-muted-foreground mt-1 text-[9px]">※ Reflected directly in the fuel/import cost breakdown bars.</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 text-[11px] leading-relaxed space-y-1 text-muted-foreground/80">
              <p className="font-semibold text-foreground">Why do the values differ?</p>
              <p>
                PGCB's daily grid reports list Net System generation separately from Gross Station generation. The difference is the <strong>Grid Dispatch Loss &amp; Aux overhead</strong>. For instance, on July 24, 2024, Gross Generation was <strong>345.90 MKWh</strong> (leading to a gross cost of 217.24 Crore BDT), while Net Grid Dispatch was <strong>315.27 MKWh</strong> (representing a net cost of 174.2 Crore BDT under PGCB's bulk system average tariff of 5.526 Tk/kWh).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Report Footer */}
      <div className="border-t border-border/40 pt-4 text-[9px] text-muted-foreground flex justify-between">
        <span>Report Document ID: ESB-AUDIT-2026-Q2</span>
        <span>© 2026 ESB PowerLine Services. All rights reserved. Generated on secure member access session.</span>
      </div>
    </div>
  );
}
