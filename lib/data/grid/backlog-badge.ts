/**
 * The age badge beside the Grid Explorer's active reporting date.
 *
 * Lifted out of PowerGridExplorer.tsx when that file hit its size budget
 * (2026-09-03). It was always pure — two dates in, a label and a class out —
 * and it is easier to reason about here, where the one case that used to be
 * wrong is visible: a day PAST the newest one held was badged "Latest",
 * because the old code only asked whether the difference was `<= 0`. Since the
 * picker now runs to today, that case is common rather than unreachable, and
 * saying LATEST above a panel that says the report has not been filed is a
 * plain contradiction.
 */
import type { PendingStatus } from '@/lib/data/grid/pending-days';

export interface BacklogBadge {
  readonly className: string;
  readonly text: string;
}

const DAY_MS = 86_400_000;

export function backlogBadge(
  selected: string,
  latest: string,
  /** Set when the selected day is pending; see pending-days.ts. */
  pending?: PendingStatus | null,
): BacklogBadge {
  if (pending) {
    return {
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      text: pending === 'in-progress' ? 'In Progress' : 'Awaiting',
    };
  }

  try {
    const diffTime = new Date(latest).getTime() - new Date(selected).getTime();
    if (Number.isNaN(diffTime)) throw new Error('unparseable date');
    if (diffTime <= 0) {
      return { className: 'bg-primary/10 text-primary border border-primary/20', text: 'Latest' };
    }

    const diffDays = Math.round(diffTime / DAY_MS);
    const text =
      diffDays < 30
        ? `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'} Ago`
        : diffDays < 365
          ? (() => {
              const m = Math.round(diffDays / 30.4);
              return `${m} ${m === 1 ? 'Month' : 'Months'} Ago`;
            })()
          : `${(diffDays / 365).toFixed(1)} Years Ago`;

    // The colour walks from recent to deep-historical, so a reader can tell at
    // a glance how far back they have wandered without reading the number.
    if (diffDays < 90) {
      return { className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', text };
    }
    if (diffDays < 365) {
      return { className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20', text };
    }
    if (diffDays < 1095) {
      return { className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20', text };
    }
    if (diffDays < 2555) {
      return { className: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20', text };
    }
    return {
      className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold',
      text,
    };
  } catch {
    return { className: 'bg-muted text-muted-foreground', text: 'Archive' };
  }
}
