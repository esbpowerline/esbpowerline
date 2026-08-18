'use client';

/**
 * The evidence marker beside a per-fuel unit rate.
 *
 * The rate itself is `D` — no agency prints one. What this says is what stands
 * behind that particular `D`: a second agency's independent arithmetic, a flat
 * administered tariff, or nothing but the one publisher.
 */

import { cn } from '@/lib/utils';
import type { UnitCostFact, UnitCostStatus } from '@/components/news/power-grid/useUnitCostAuthentication';

const STYLE: Record<UnitCostStatus, { label: string; cls: string; title: string }> = {
  corroborated: {
    label: '2×',
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    title:
      'Corroborated. BPDB publishes the same production cost and the same energy '
      + 'independently, in its own Daily Electricity Generation Report with its own '
      + 'control totals, and the rate derived from those figures agrees with this one.',
  },
  disagreement: {
    label: '!=',
    cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    title:
      'Two publishers state the cost and energy behind this rate and they disagree by '
      + 'more than their printing precision allows. Neither figure has been altered.',
  },
  administered: {
    label: 'flat',
    cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    // Not "identical on essentially every day": these rates are revised, and
    // saying otherwise is falsifiable in one query. Hydro held 0.1000 through
    // 2026 apart from 2026-06-30 to 07-15, when it stepped to 3.8100 and back.
    // What makes it administered is that the figure is applied, not observed —
    // it holds to four decimals for long runs and then steps, which no measured
    // daily cost does.
    title:
      'Administered rate, not a measurement. The publisher applies a fixed Tk/kWh to '
      + 'this fuel rather than reporting an observed cost: the figure holds to four '
      + 'decimals for long runs and then steps to a new flat value, so read it as a '
      + 'tariff in force on this day, not as what the fuel cost that day.',
  },
  'published-only': {
    label: '1×',
    cls: 'bg-muted text-muted-foreground border-border/40',
    title:
      'Derived from this agency’s published cost and energy. No second publisher '
      + 'states the same inputs for this fuel, so there is no independent check.',
  },
  'awaiting-witness': {
    label: '1×',
    cls: 'bg-muted text-muted-foreground border-border/40 border-dashed',
    title:
      'Derived from this agency’s published cost and energy, and not yet cross-checked. '
      + 'The second-publisher comparison is a periodic export from BPDB’s own daily '
      + 'reports and this day falls after the last one loaded — so the check is '
      + 'outstanding, not failed, and nothing here says BPDB disagrees.',
  },
};

export function UnitCostBadge({
  fact,
  className,
}: {
  fact: UnitCostFact | undefined;
  className?: string;
}) {
  if (!fact) return null;
  const s = STYLE[fact.status];
  const detail =
    fact.secondPublisherUnitCost != null && fact.secondPublisher
      ? ` ${fact.secondPublisher} derives ${fact.secondPublisherUnitCost.toFixed(4)} Tk/kWh`
        + ` from its own published figures (difference ${Math.abs(fact.delta ?? 0).toFixed(4)}).`
      : fact.status === 'awaiting-witness' && fact.witnessThrough
        ? ` Cross-checks currently run through ${fact.witnessThrough}.`
        : '';
  return (
    <span
      className={cn(
        'ml-1.5 inline-block px-1.5 py-px rounded border text-[9px] font-bold align-middle',
        s.cls,
        className,
      )}
      title={s.title + detail}
    >
      {s.label}
    </span>
  );
}

export default UnitCostBadge;
