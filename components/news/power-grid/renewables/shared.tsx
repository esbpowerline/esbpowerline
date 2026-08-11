'use client';

/** Presentation helpers shared by the Renewables cards. */

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** Fixed-decimal grouping, so columns of figures line up. */
export const fmt = (v: number, dp = 3) =>
  v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

export const OK_CLASS = 'text-emerald-600 dark:text-emerald-400 font-bold ml-2';
export const WARN_CLASS = 'text-amber-600 dark:text-amber-400 font-bold ml-2';

/** Rows shown before a long list asks to be expanded. */
export const REGISTER_INITIAL_ROWS = 15;
export const YEAR_INITIAL_ROWS = 8;

/** Only this status is installed capacity; the rest are pipeline or retired. */
export const STATUS_RUNNING = 'Completed & Running';

/**
 * All six statuses SREDA offers in its own filter, not just the four that
 * happened to appear in the first sample — Solar Park alone carries ten
 * "Rejected from Planning/Implementation" projects.
 */
export const STATUS_STYLE: Record<string, string> = {
  'Completed & Running': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  'Implementation Ongoing': 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25',
  'Under Maintenance': 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25',
  'Under Planning': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  'Obsolete System/Plant': 'bg-muted text-muted-foreground border-border/50',
  'Rejected from Planning/Implementation':
    'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
};

export const statusClass = (status: string) =>
  STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground border-border/50';

/**
 * A count chip in a card title, so the size of a list is legible before it is
 * read. Same treatment as the Power Stations tab.
 */
export function CountChip({ children }: { children: ReactNode }) {
  return (
    <span className="grid-explorer-chip ml-2 bg-primary/10 text-primary border-primary/20">
      {children}
    </span>
  );
}

/**
 * Show the first `initial` rows of a long list and a control to reveal the rest.
 *
 * The register runs to 76 projects for Solar Park and the reconciliation to 34
 * checks; rendering either in full pushes everything below it off the page. The
 * full count is always stated on the control, so a collapsed list never reads as
 * a complete one.
 */
export function useExpandable<T>(rows: T[], initial: number) {
  const [expanded, setExpanded] = useState(false);
  return {
    shown: expanded ? rows : rows.slice(0, initial),
    expanded,
    toggle: () => setExpanded((v) => !v),
    hidden: Math.max(0, rows.length - initial),
  };
}

export function ShowMoreRow({
  colSpan,
  expanded,
  hidden,
  total,
  noun,
  onToggle,
}: {
  colSpan: number;
  expanded: boolean;
  hidden: number;
  total: number;
  noun: string;
  onToggle: () => void;
}) {
  if (hidden === 0) return null;
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-full py-2 text-[11px] font-semibold text-primary hover:bg-muted/30 transition-colors flex items-center justify-center gap-1.5"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Show fewer
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Show all {total} {noun} ({hidden} more)
            </>
          )}
        </button>
      </td>
    </tr>
  );
}
