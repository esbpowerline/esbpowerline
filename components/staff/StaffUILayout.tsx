import { Children, type CSSProperties } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DevCompileHint } from '@/components/shared/DevCompileHint';

type LayoutProps = {
  children: React.ReactNode;
  className?: string;
};

type CardGridProps = LayoutProps & {
  cols?: 2 | 3;
};

export function StaffSectionStack({ children, className }: LayoutProps) {
  return <div className={cn('admin-section-stack', className)}>{children}</div>;
}

/** The most items one row may hold at each width band (phone, tablet, laptop, wide). */
type RowMax = { sm: number; md: number; lg: number; xl: number };

/** Stat tiles and action pills: small enough to sit two-up even on a phone. */
const STAT_ROW_MAX: RowMax = { sm: 2, md: 3, lg: 4, xl: 6 };

/** Cards hold lists and charts: one per row on a phone, never more than four. */
const CARD_ROW_MAX: RowMax = { sm: 1, md: 2, lg: 3, xl: 4 };

const BANDS = ['sm', 'md', 'lg', 'xl'] as const;

/**
 * The fewest columns that still fit `n` items into the fewest rows.
 *
 * `auto-fit, minmax(10rem, 1fr)` chose the column count from the viewport and
 * never looked at the items, and every strip on this surface has conditional
 * members (Members, Pending Comments, Featured, Breaking, Notices). So a
 * six-tile day at 1366px wrapped 5 + 1 — one tile alone on a row of empty
 * cells — and a five-tile day went 4 + 1. Dividing by the row count first
 * gives 3 + 2 and 3 + 3 instead.
 */
function balancedCols(n: number, max: number): number {
  if (n <= 1) return 1;
  return Math.ceil(n / Math.ceil(n / max));
}

/**
 * Balancing cannot remove every orphan — 7 at three-up is still 3 + 3 + 1 —
 * so an item that would sit alone on the last row takes the whole row
 * instead of one cell beside empty ones. A short row of two or more stays
 * item-sized.
 */
function lastSpan(n: number, cols: number): string {
  return cols > 1 && n > cols && n % cols === 1 ? '1 / -1' : 'auto';
}

/**
 * An evenly spaced grid whose column count comes from how many items it holds.
 * One gap both ways (staff-surface.css `.admin-stat-grid`), equal to a card's
 * own padding.
 */
export function StaffTileGrid({
  children,
  className,
  max = STAT_ROW_MAX,
}: LayoutProps & { max?: RowMax }) {
  // toArray drops the `false`/`null` a conditional `{x > 0 && <Tile />}` leaves.
  const count = Children.toArray(children).length;
  const style: Record<string, string | number> = {};
  for (const band of BANDS) {
    const cols = balancedCols(count, max[band]);
    style[`--stat-cols-${band}`] = cols;
    style[`--stat-last-${band}`] = lastSpan(count, cols);
  }
  return (
    <div className={cn('admin-stat-grid', className)} style={style as CSSProperties}>
      {children}
    </div>
  );
}

/** KPI tiles and action pills. */
export function StaffStatGrid({ children, className }: LayoutProps) {
  return <StaffTileGrid className={className}>{children}</StaffTileGrid>;
}

/** A row of cards that share one height: 1 / 2 / 3 / 4 across, balanced. */
export function StaffCardRow({ children, className }: LayoutProps) {
  return (
    <StaffTileGrid max={CARD_ROW_MAX} className={cn('admin-card-row', className)}>
      {children}
    </StaffTileGrid>
  );
}

export function StaffCardGrid({ children, className, cols = 2 }: CardGridProps) {
  return (
    <div
      className={cn(
        'admin-card-grid',
        cols === 3 && 'admin-card-grid--cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StaffActionsGrid({ children, className }: LayoutProps) {
  return <div className={cn('admin-actions-grid', className)}>{children}</div>;
}

export function StaffListStack({ children, className }: LayoutProps) {
  return <div className={cn('admin-list-stack', className)}>{children}</div>;
}

export function StaffDenseList({ children, className }: LayoutProps) {
  return <div className={cn('admin-dense-list', className)}>{children}</div>;
}

export function StaffScheduleList({ children, className }: LayoutProps) {
  return <div className={cn('admin-schedule-list', className)}>{children}</div>;
}

export function StaffFilterTabs({ children, className }: LayoutProps) {
  return <div className={cn('admin-filter-tabs', className)}>{children}</div>;
}

export function StaffCardFooter({
  children,
  className,
  href,
  external,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  external?: boolean;
}) {
  const classes = cn('admin-card-footer', className);

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}

export function StaffPageSkeleton({ children, className }: LayoutProps) {
  return (
    <div className={cn('admin-page-skeleton animate-pulse', className)}>
      <DevCompileHint />
      {children}
    </div>
  );
}