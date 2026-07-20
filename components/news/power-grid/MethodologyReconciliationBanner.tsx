'use client';

import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type MethodologyReconciliationBannerProps = {
  expanded: boolean;
  onToggleExpanded: () => void;
  onHide: () => void;
  reportDate: string;
  netEnergyGenMkwh: number;
  grossEnergyGenMkwh: number;
  netDailyCostBdt: number;
  grossDailyCostBdt: number;
};

export function MethodologyReconciliationBanner({
  expanded,
  onToggleExpanded,
  onHide,
  reportDate,
  netEnergyGenMkwh,
  grossEnergyGenMkwh,
  netDailyCostBdt,
  grossDailyCostBdt,
}: MethodologyReconciliationBannerProps) {
  // Gross (fuel-mix chart sum) and net (dispatch KPI) are independent measurements: gross can
  // exceed net (auxiliary use + grid loss) or fall below it (sources/adjustments not itemized in
  // the fuel mix). Present the gap sign-aware so the arithmetic never shows an impossible negative.
  const genGapMkwh = grossEnergyGenMkwh - netEnergyGenMkwh;
  const grossExceedsNet = genGapMkwh > 0.05;
  const genGapAbsMkwh = Math.abs(genGapMkwh);
  const genGapPct = grossEnergyGenMkwh > 0 ? (genGapAbsMkwh / grossEnergyGenMkwh) * 100 : 0;

  const netDailyCostCr = netDailyCostBdt / 10_000_000;
  const grossDailyCostCr = grossDailyCostBdt / 10_000_000;
  const costGapCr = (grossDailyCostBdt - netDailyCostBdt) / 10_000_000;
  const grossCostExceedsNet = costGapCr > 0.005;
  const costGapAbsCr = Math.abs(costGapCr);

  return (
    <div className="mb-4 bg-muted/10 border border-border/20 rounded-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="w-full flex items-center justify-between p-2 px-3 text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors leading-none">
            {expanded
              ? "Seeing a discrepancy? Here's the data methodology & reconciliation callout. Click to collapse."
              : "Seeing a discrepancy? Here's the data methodology & reconciliation callout. Click to drop down."}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t border-border/20 bg-background/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground leading-relaxed">
            To maintain audited reporting standards, the system reconciles data between{' '}
            <strong>Gross Generation (Supplied)</strong> and <strong>Net Grid Dispatch (Delivered)</strong>. This
            explains the discrepancy between the top KPI cards and the detailed fuel charts below:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="p-4 bg-card border border-border/30 rounded-xl space-y-2 shadow-sm">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                1. Generation Volume Discrepancy
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The top <strong>Daily Generation</strong> KPI card shows{' '}
                <strong>{netEnergyGenMkwh.toFixed(1)} MKWh</strong> (Net grid dispatch), while the{' '}
                <strong>Generation Mix Snapshot</strong> chart sums up to{' '}
                <strong>{grossEnergyGenMkwh.toFixed(1)} MKWh</strong> (Gross energy at plant generators).
              </p>
              <div className="bg-muted/10 p-2 rounded border border-border/20 font-mono text-[10px] text-foreground">
                <div>Gross Generation (fuel-mix sum) = {grossEnergyGenMkwh.toFixed(1)} MKWh</div>
                {grossExceedsNet ? (
                  <div>(-) Station auxiliary use &amp; grid loss (~{genGapPct.toFixed(1)}%) = {genGapAbsMkwh.toFixed(1)} MKWh</div>
                ) : (
                  <div>(+) Sources / reconciliation not in fuel mix ({genGapPct.toFixed(1)}%) = {genGapAbsMkwh.toFixed(1)} MKWh</div>
                )}
                <div className="font-bold border-t border-border/30 mt-1 pt-1 text-primary">
                  Net Grid Dispatch = {netEnergyGenMkwh.toFixed(1)} MKWh
                </div>
              </div>
            </div>

            <div className="p-4 bg-card border border-border/30 rounded-xl space-y-2 shadow-sm">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                2. Fuel &amp; Import Cost Discrepancy
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The top <strong>Est. Fuel Cost</strong> KPI card shows{' '}
                <strong>{netDailyCostCr.toFixed(2)} Cr BDT</strong> (Net system cost base), while the{' '}
                <strong>Daily Fuel &amp; Import Cost</strong> bar chart aggregates raw fuel costs to{' '}
                <strong>{grossDailyCostCr.toFixed(2)} Cr BDT</strong> (Gross plant expenditure).
              </p>
              <div className="bg-muted/10 p-2 rounded border border-border/20 font-mono text-[10px] text-foreground">
                <div>Gross Production Cost = {grossDailyCostCr.toFixed(2)} Cr BDT</div>
                {grossCostExceedsNet ? (
                  <div>(-) Loss / aux cost overhead = {costGapAbsCr.toFixed(2)} Cr BDT</div>
                ) : (
                  <div>(+) Cost reconciliation adjustment = {costGapAbsCr.toFixed(2)} Cr BDT</div>
                )}
                <div className="font-bold border-t border-border/30 mt-1 pt-1 text-emerald-500">
                  Net System Cost = {netDailyCostCr.toFixed(2)} Cr BDT
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/5 border border-border/20 rounded-xl space-y-2.5 text-[11px] text-muted-foreground">
            <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
              Reconciliation Path &amp; Operational Flow
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 leading-relaxed">
              <div className="space-y-1">
                <p className="font-bold text-foreground">1. Generation Source (Supplied)</p>
                <p>
                  Generating stations (BPDB, IPPs, Joint Ventures) burn fuels to generate raw electricity. Total
                  generation is measured at the plant generator terminals (busbars) as{' '}
                  <strong>Gross Generation</strong> (as displayed in the charts).
                </p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/30 pt-2 md:pt-0 md:pl-4">
                <p className="font-bold text-foreground">2. Plant Self-Use (Auxiliary Consumption)</p>
                <p>
                  Power plants consume <strong>8-10%</strong> of their gross output internally to run critical
                  infrastructure (cooling pumps, fuel feeders, ventilation, control systems, and facility lighting).
                  This load never enters transmission lines.
                </p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/30 pt-2 md:pt-0 md:pl-4">
                <p className="font-bold text-foreground">3. Grid Transmission &amp; Loss (PGCB &amp; Utilities)</p>
                <p>
                  PGCB receives the remaining net power at step-up transformers and transmits it across the
                  high-voltage grid, losing <strong>~3% (system loss)</strong> to heat and line resistance. The final
                  distributed load delivered to utilities (DESCO, DPDC, etc.) is the{' '}
                  <strong>Net Grid Dispatch</strong> (as displayed in the KPI cards).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/20 text-[10px] text-muted-foreground/80 leading-relaxed">
            <div>
              ※ <strong>Active Example:</strong> On the selected date of <strong>{reportDate}</strong>, the fuel-mix
              sum and net dispatch KPI differ by <strong>{genGapAbsMkwh.toFixed(2)} MKWh</strong> ({genGapPct.toFixed(1)}%),
              {grossExceedsNet
                ? ' reflecting generating-station auxiliary consumption and grid dispatch loss.'
                : ' reflecting sources and reconciliation adjustments not itemized in the plant-level fuel mix.'}
            </div>
            <button
              type="button"
              onClick={onHide}
              className="text-muted-foreground/60 hover:text-foreground hover:bg-muted/15 px-2 py-1 rounded transition-colors text-[9px] font-bold uppercase tracking-wider"
            >
              Hide Banner Completely
            </button>
          </div>
        </div>
      )}
    </div>
  );
}