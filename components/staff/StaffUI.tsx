import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, PenLine } from 'lucide-react';

export {
  StaffSectionStack,
  StaffTileGrid,
  StaffStatGrid,
  StaffCardRow,
  StaffCardGrid,
  StaffActionsGrid,
  StaffListStack,
  StaffDenseList,
  StaffScheduleList,
  StaffFilterTabs,
  StaffCardFooter,
  StaffPageSkeleton,
} from '@/components/staff/StaffUILayout';

/**
 * The one component kit for both staff surfaces.
 *
 * AdminUI.tsx and CmsUI.tsx were two copies of this file that had drifted
 * apart: the admin stat card still defaulted to `rose` — the destructive red
 * since the accent consolidation — and padded a missing sub-label with an
 * invisible `&nbsp;` paragraph the CMS copy had already dropped; the list rows
 * set `meta` under the title in one panel and in a trailing column in the
 * other; the action pill's arrow was styled inline in one and by class in the
 * other. Both names survive as aliases so no page had to change, but there is
 * one implementation behind them. Fix a primitive here and it is fixed in both.
 */

export type StaffAccent = 'rose' | 'violet' | 'emerald' | 'amber' | 'sky' | 'red';

/* ── Page header ── */
export function StaffPageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('admin-page-header', className)}>
      <div className="admin-page-header__intro">
        {Icon && (
          <div className="admin-page-icon shrink-0">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="admin-page-title">{title}</h1>
          {description && <p className="admin-page-desc">{description}</p>}
        </div>
      </div>
      {children && <div className="admin-page-actions shrink-0">{children}</div>}
    </div>
  );
}

/* ── Stat card ── */
export function StaffStatCard({
  title,
  value,
  change,
  icon: Icon,
  // Neutral by default. `rose` reads as the destructive colour since the
  // accent consolidation, so an un-accented count like "Total Views" used to
  // come out alarm-red.
  accent = 'sky',
  className,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  accent?: StaffAccent;
  className?: string;
}) {
  return (
    <div className={cn('admin-stat-card group', className)} data-accent={accent}>
      <div className="admin-stat-card__head">
        <span className="admin-stat-label">{title}</span>
        {Icon && (
          <div className="admin-stat-icon">
            <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="admin-stat-value">{value}</div>
      {/* No invisible `&nbsp;` filler: `.admin-stat-card` is a three-row grid,
          so a tile without a sub-label still aligns with one that has it. The
          placeholder was also read out by screen readers as an empty paragraph. */}
      {change && <p className="admin-stat-change">{change}</p>}
    </div>
  );
}

/* ── Content card ── */
export function StaffCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
  colSpan,
  style,
}: {
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  colSpan?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn('admin-card', colSpan, className)} style={style}>
      {(title || action) && (
        <div className="admin-card-header">
          {title && (
            <div className="admin-card-header__title">
              {Icon && (
                <span className="admin-card-icon">
                  <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                </span>
              )}
              <h2 className="admin-card-title">{title}</h2>
            </div>
          )}
          {action && <div className="admin-card-action shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('admin-card-body', bodyClassName)}>{children}</div>
    </div>
  );
}

/* ── Compact create capsule (headers & CTAs) ── */
export function StaffCreateCapsule({
  href,
  label = 'New story',
  icon: Icon = PenLine,
}: {
  href: string;
  label?: string;
  icon?: LucideIcon;
}) {
  return (
    <Link href={href} className="editorial-create-capsule group">
      <span className="editorial-create-capsule__icon" aria-hidden>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
      <span className="editorial-create-capsule__label">{label}</span>
    </Link>
  );
}

/* ── Quick action pill ── */
export function StaffActionPill({
  href,
  label,
  icon: Icon,
  description,
  accent,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  accent?: 'default' | 'emerald';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'admin-action-pill group',
        accent === 'emerald' && 'admin-action-pill--emerald admin-action-pill--primary',
      )}
    >
      <span className="admin-action-icon">
        <Icon className="h-[15px] w-[15px]" strokeWidth={2.1} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="admin-action-label">{label}</span>
        {description && <span className="admin-action-desc">{description}</span>}
      </span>
      <ArrowUpRight className="admin-action-arrow h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
    </Link>
  );
}

/* ── Ranked list row ── */
export function StaffListRow({
  rank,
  title,
  href,
  meta,
  badge,
  metaNode,
  value,
  valueLabel,
  highlight,
}: {
  rank?: number;
  title: string;
  href?: string;
  /** Marks one row as the reader's own — the "you" line of a leaderboard. */
  highlight?: boolean;
  /** A secondary line under the title — "12 published", "Sidebar · 1.4%". */
  meta?: string;
  /** A rendered status pill, beside the title. */
  badge?: React.ReactNode;
  /** A rendered element for the trailing slot — a category chip, say. */
  metaNode?: React.ReactNode;
  value?: string | number;
  /** The unit under the value — "views". */
  valueLabel?: string;
}) {
  const content = (
    <>
      {rank !== undefined && <span className="admin-rank">{rank}</span>}
      <span className="flex-1 min-w-0 admin-list-title-wrap">
        <span className="truncate admin-list-title">{title}</span>
        {meta && <span className="admin-list-meta">{meta}</span>}
      </span>
      {badge && <span className="shrink-0">{badge}</span>}
      {metaNode && <span className="hidden sm:inline-flex shrink-0">{metaNode}</span>}
      {value !== undefined && (
        <span className="admin-list-stat">
          <span className="admin-list-value tabular-nums">{value}</span>
          {valueLabel && <span className="admin-list-value-label">{valueLabel}</span>}
        </span>
      )}
    </>
  );

  const rowClass = cn('admin-list-row', highlight && 'admin-list-row--highlight');

  if (href) {
    if (href.startsWith('http')) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={cn(rowClass, 'group')}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cn(rowClass, 'group')}>
        {content}
      </Link>
    );
  }

  return <div className={rowClass}>{content}</div>;
}

/* ── Activity feed item ── */
export function StaffActivityItem({
  badge,
  date,
  message,
}: {
  badge: React.ReactNode;
  date: React.ReactNode;
  message: React.ReactNode;
}) {
  return (
    <div className="admin-activity-item">
      <div className="flex items-center gap-2 flex-wrap">
        {badge}
        <span className="admin-activity-date">{date}</span>
      </div>
      <p className="admin-activity-msg">{message}</p>
    </div>
  );
}

/* ── Table wrapper ── */
export function StaffTableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('admin-table-shell', className)}>{children}</div>;
}

/* ── Metric row (key-value) ── */
export function StaffMetricRow({
  label,
  value,
  highlight,
}: {
  label: React.ReactNode;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('admin-metric-row', highlight && 'admin-metric-row--highlight')}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/* ── Tag capsule ── */
export function StaffTagCapsule({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('admin-tag-capsule', className)}>{children}</span>;
}

/* ── Form card ── */
export function StaffFormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('admin-form-card', className)}>{children}</div>;
}

/* ── Loading state ── */
export function StaffLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="admin-loading">
      <div className="admin-loading-spinner" />
      <span>{label}</span>
    </div>
  );
}
