import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, PenLine } from 'lucide-react';
import {
  StaffSectionStack,
  StaffStatGrid,
  StaffCardGrid,
  StaffActionsGrid,
  StaffListStack,
  StaffDenseList,
  StaffScheduleList,
  StaffFilterTabs,
  StaffCardFooter,
  StaffPageSkeleton,
} from '@/components/staff/StaffUILayout';

export {
  StaffSectionStack as CmsSectionStack,
  StaffStatGrid as CmsStatGrid,
  StaffCardGrid as CmsCardGrid,
  StaffActionsGrid as CmsActionsGrid,
  StaffListStack as CmsListStack,
  StaffDenseList as CmsDenseList,
  StaffScheduleList as CmsScheduleList,
  StaffFilterTabs as CmsFilterTabs,
  StaffCardFooter as CmsCardFooter,
  StaffPageSkeleton as CmsPageSkeleton,
};

/* ── Page header ── */
export function CmsPageHeader({
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
export function CmsStatCard({
  title,
  value,
  change,
  icon: Icon,
  // Neutral by default. It used to default to `rose`, which after the accent
  // consolidation reads as the destructive colour — so an un-accented count
  // like "Total Views" came out alarm-red.
  accent = 'sky',
  className,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  accent?: 'rose' | 'violet' | 'emerald' | 'amber' | 'sky' | 'red';
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
      {/* No invisible `&nbsp;` filler any more — `.admin-stat-card` is a
          three-row grid, so a tile without a sub-label still aligns with one
          that has it. The placeholder was also read out by screen readers as
          an empty paragraph. */}
      {change && <p className="admin-stat-change">{change}</p>}
    </div>
  );
}

/* ── Content card ── */
export function CmsCard({
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
export function CmsCreateCapsule({
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
export function CmsActionPill({
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
        accent === 'emerald' && 'admin-action-pill--emerald',
        accent === 'emerald' && 'admin-action-pill--primary',
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
export function CmsListRow({
  rank,
  title,
  href,
  meta,
  badge,
  metaNode,
  value,
}: {
  rank?: number;
  title: string;
  href?: string;
  meta?: string;
  /** A rendered status pill. Preferred over `meta` for a status: the raw
   *  string was set in 10px uppercase grey, which read as a caption rather
   *  than the state of the story. */
  badge?: React.ReactNode;
  /** A rendered element for the trailing meta slot — a category chip, say.
   *  Sizes itself, unlike `meta`, which lives in a fixed uppercase column. */
  metaNode?: React.ReactNode;
  value?: string | number;
}) {
  const content = (
    <>
      {rank !== undefined && <span className="admin-rank">{rank}</span>}
      <span className="flex-1 min-w-0 truncate admin-list-title">{title}</span>
      {badge && <span className="shrink-0">{badge}</span>}
      {metaNode && <span className="hidden sm:inline-flex shrink-0">{metaNode}</span>}
      {meta && <span className="admin-list-meta hidden sm:inline">{meta}</span>}
      {value !== undefined && <span className="admin-list-value">{value}</span>}
    </>
  );

  if (href) {
    const external = href.startsWith('http');
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className="admin-list-row group">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="admin-list-row group">
        {content}
      </Link>
    );
  }

  return <div className="admin-list-row">{content}</div>;
}

/* ── Activity feed item ── */
export function CmsActivityItem({
  badge,
  date,
  message,
}: {
  badge: React.ReactNode;
  date: string;
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
export function CmsTableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('admin-table-shell', className)}>{children}</div>;
}

/* ── Metric row (key-value) ── */
export function CmsMetricRow({ label, value, highlight }: { label: React.ReactNode; value: string; highlight?: boolean }) {
  return (
    <div className={cn('admin-metric-row', highlight && 'admin-metric-row--highlight')}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/* ── Tag capsule ── */
export function CmsTagCapsule({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('admin-tag-capsule', className)}>{children}</span>;
}

/* ── Form card ── */
export function CmsFormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('admin-form-card', className)}>{children}</div>;
}

/* ── Loading state ── */
export function CmsLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="admin-loading">
      <div className="admin-loading-spinner" />
      <span>{label}</span>
    </div>
  );
}
