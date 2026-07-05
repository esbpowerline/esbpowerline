'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GridTableDensity = 'comfortable' | 'compact';

export interface GridDataTableProps {
  children: ReactNode;
  /** Sticky header row when scrolling vertically inside the wrap */
  stickyHeader?: boolean;
  /** Pin first column when scrolling horizontally (wide tables) */
  stickyFirstCol?: boolean;
  density?: GridTableDensity;
  maxHeight?: string;
  isLoading?: boolean;
  skeletonRows?: number;
  skeletonCols?: number;
  empty?: boolean;
  emptyMessage?: string;
  footer?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <table className="grid-explorer-table w-full">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}>
              <div className="grid-explorer-table-skeleton h-3 w-16 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}>
                <div
                  className="grid-explorer-table-skeleton h-3 rounded"
                  style={{ width: `${48 + ((r + c) % 4) * 12}%` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Professional data-table shell for Grid Explorer tabular views.
 * Pairs with `.grid-explorer-table` in globals.css — sticky header, density, numeric alignment.
 */
export function GridDataTable({
  children,
  stickyHeader = true,
  stickyFirstCol = false,
  density = 'comfortable',
  maxHeight = 'min(70vh, 42rem)',
  isLoading = false,
  skeletonRows = 8,
  skeletonCols = 6,
  empty = false,
  emptyMessage = 'No rows match the current filters.',
  footer,
  className,
  'aria-label': ariaLabel,
}: GridDataTableProps) {
  return (
    <div className={cn('grid-explorer-datatable', className)}>
      <div
        className={cn(
          'grid-explorer-table-wrap',
          stickyHeader && 'grid-explorer-table-wrap--sticky-head',
          stickyFirstCol && 'grid-explorer-table-wrap--sticky-col',
          density === 'compact' && 'grid-explorer-table-wrap--compact',
        )}
        style={{ maxHeight }}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {isLoading ? (
          <TableSkeleton rows={skeletonRows} cols={skeletonCols} />
        ) : empty ? (
          <div className="grid-explorer-table-empty" role="status">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
      {footer}
    </div>
  );
}