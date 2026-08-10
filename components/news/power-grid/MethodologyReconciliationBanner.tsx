'use client';

import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';

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
  // Both figures in each pair come from the SAME PGCB sheet: one is a headline
  // the report states, the other is our sum of the itemised rows underneath it.
  // This banner used to present the difference as auxiliary station use plus
  // grid loss — a transmission chain between a busbar and a delivery point —
  // which is not a mechanism that exists between two lines of one page. On
  // 2026-08-08 it would have explained a gap of 0.007 MKWh, about two seconds
  // of national output, as 8-10% station self-consumption.
  //
  // What it says now is what can be shown: which number the source states,
  // which one we computed, how far apart they are, and that the residual is
  // unexplained. Naming a cause we cannot demonstrate is what made the old
  // copy wrong, not the arithmetic.
  const genGapMkwh = grossEnergyGenMkwh - netEnergyGenMkwh;
  const genGapAbsMkwh = Math.abs(genGapMkwh);
  const genGapPct = netEnergyGenMkwh > 0 ? (genGapAbsMkwh / netEnergyGenMkwh) * 100 : 0;
  const sumExceedsHeadline = genGapMkwh > 0;
  // Below this the two agree to the precision either figure is printed at, so
  // there is nothing to reconcile and saying otherwise invents a discrepancy.
  const genMaterial = genGapAbsMkwh >= 0.05;

  const publishedCostCr = netDailyCostBdt / 10_000_000;
  const summedCostCr = grossDailyCostBdt / 10_000_000;
  const costGapCr = summedCostCr - publishedCostCr;
  const costGapAbsCr = Math.abs(costGapCr);
  const sumExceedsPublishedCost = costGapCr > 0;
  const costMaterial = costGapAbsCr >= 0.005;

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
              ? 'Where each figure comes from, and why two totals on this page can differ. Click to collapse.'
              : 'Where each figure comes from, and why two totals on this page can differ. Click to drop down.'}
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
            Every figure on this tab carries a mark. <GridProvenanceTag kind="P" /> means PGCB,
            Petrobangla or SREDA states the number and we reproduce it unchanged.{' '}
            <GridProvenanceTag kind="D" /> means we calculated it from published figures — a sum, a
            share, an average or a subtraction that the source does not itself print.{' '}
            <strong>No figure on this page is independently audited</strong>, by us or by anyone
            whose report we hold; we reproduce daily operational reports as published.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="p-4 bg-card border border-border/30 rounded-xl space-y-2 shadow-sm">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                1. Two generation totals
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The <strong>Daily Generation</strong> KPI is PGCB&apos;s own headline energy figure{' '}
                <GridProvenanceTag kind="P" />. The <strong>Generation Mix Snapshot</strong> total is
                our sum of the per-fuel rows in the zone-wise table <GridProvenanceTag kind="D" />.
                Both are printed on the same report, and PGCB does not state that they must agree.
              </p>
              <div className="bg-muted/10 p-2 rounded border border-border/20 font-mono text-[10px] text-foreground">
                <div>Published headline = {netEnergyGenMkwh.toFixed(2)} MKWh</div>
                <div>Sum of fuel rows = {grossEnergyGenMkwh.toFixed(2)} MKWh</div>
                <div className="font-bold border-t border-border/30 mt-1 pt-1 text-primary">
                  {genMaterial
                    ? `Unexplained residual = ${sumExceedsHeadline ? '+' : '−'}${genGapAbsMkwh.toFixed(2)} MKWh (${genGapPct.toFixed(2)}%)`
                    : 'The two agree for this day'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-card border border-border/30 rounded-xl space-y-2 shadow-sm">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                2. Two cost totals
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The <strong>Est. Fuel Cost</strong> KPI is the <code>Total :</code> row PGCB prints
                at the foot of its production-cost block <GridProvenanceTag kind="P" />. The{' '}
                <strong>Daily Fuel &amp; Import Cost</strong> header adds up the per-fuel bars above
                it <GridProvenanceTag kind="D" />.
              </p>
              <div className="bg-muted/10 p-2 rounded border border-border/20 font-mono text-[10px] text-foreground">
                <div>Published total = {publishedCostCr.toFixed(2)} Cr BDT</div>
                <div>Sum of fuel costs = {summedCostCr.toFixed(2)} Cr BDT</div>
                <div className="font-bold border-t border-border/30 mt-1 pt-1 text-emerald-500">
                  {costMaterial
                    ? `Unexplained residual = ${sumExceedsPublishedCost ? '+' : '−'}${costGapAbsCr.toFixed(2)} Cr BDT`
                    : 'The two agree for this day'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/5 border border-border/20 rounded-xl space-y-2.5 text-[11px] text-muted-foreground">
            <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
              What a residual can and cannot tell you
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 leading-relaxed">
              <div className="space-y-1">
                <p className="font-bold text-foreground">A headline is not a sum</p>
                <p>
                  PGCB states a day total and, separately, a fuel breakdown. Nothing in the report
                  claims the second adds to the first, and on most days it very nearly does. A small
                  residual is the normal state of two independently stated figures.
                </p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/30 pt-2 md:pt-0 md:pl-4">
                <p className="font-bold text-foreground">A large residual is a defect signal</p>
                <p>
                  Where the gap runs to whole percent, the likelier cause is a fuel row this
                  archive failed to read than anything physical — 2019-07-28 is missing its gas and
                  coal rows and shows a 68% gap. Treat a wide residual as a reason to distrust the
                  breakdown, not as a measurement.
                </p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/30 pt-2 md:pt-0 md:pl-4">
                <p className="font-bold text-foreground">We do not attribute it</p>
                <p>
                  Station auxiliary use and transmission loss are real quantities, but PGCB does not
                  publish them on this report and we cannot derive them from it. This banner
                  previously named them as the cause; it no longer does, because that was an
                  explanation the data did not support.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/20 text-[10px] text-muted-foreground/80 leading-relaxed">
            <div>
              ※ <strong>This day:</strong> on <strong>{reportDate}</strong>,{' '}
              {genMaterial ? (
                <>
                  the fuel-mix sum and the published headline differ by{' '}
                  <strong>{genGapAbsMkwh.toFixed(2)} MKWh</strong> ({genGapPct.toFixed(2)}%), which
                  this page does not attribute to a cause.
                </>
              ) : (
                <>
                  the fuel-mix sum and the published headline agree to{' '}
                  <strong>{genGapAbsMkwh.toFixed(2)} MKWh</strong> — there is no discrepancy to
                  explain.
                </>
              )}
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
