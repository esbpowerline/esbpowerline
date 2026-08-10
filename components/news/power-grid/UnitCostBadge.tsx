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
    title:
      'Administered rate, not a measurement. The publisher applies a fixed Tk/kWh to '
      + 'this fuel rather than reporting an observed cost — the figure is identical on '
      + 'essentially every day of the year — so it should not be read as a daily cost.',
  },
  'published-only': {
    label: '1×',
    cls: 'bg-muted text-muted-foreground border-border/40',
    title:
      'Derived from this agency’s published cost and energy. No second publisher '
      + 'states the same inputs for this fuel, so there is no independent check.',
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
