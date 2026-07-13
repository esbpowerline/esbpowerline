'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

type GridIcon = LucideIcon | ComponentType<{ className?: string }>;
import { cn } from '@/lib/utils';

/* ── Data cadence badges (title / KPI labels) ── */

const BADGE_TONE: Record<string, string> = {
  daily: 'text-emerald-500',
  live: 'text-emerald-500',
  archive: 'text-sky-500',
  monthly: 'text-orange-500',
};

const BADGE_LABEL: Record<string, string> = {
  daily: 'Daily',
  live: 'Live',
  archive: 'Archive',
  monthly: 'Monthly',
};

export type GridCadence = keyof typeof BADGE_TONE;

export function GridDataBadge({ cadence, label }: { cadence: GridCadence; label?: string }) {
  return (
    <sup className={cn(BADGE_TONE[cadence], 'font-extrabold text-[10px] ml-2 select-none')}>
      {label ?? BADGE_LABEL[cadence]}
    </sup>
  );
}

/** @deprecated Use GridDataBadge — kept for gradual migration */
export const DailyBadge = () => <GridDataBadge cadence="daily" />;
/** @deprecated Use GridDataBadge */
export const LiveBadge = () => <GridDataBadge cadence="live" />;
/** @deprecated Use GridDataBadge */
export const ArchiveBadge = () => <GridDataBadge cadence="archive" />;
/** @deprecated Use GridDataBadge */
export const MonthlyBadge = () => <GridDataBadge cadence="monthly" />;

/** Trailing “since YYYY” on KPI labels (archive / live week strips) */
export function GridSinceBadge({ year = '2020' }: { year?: string }) {
  return (
    <sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">
      since {year}
    </sup>
  );
}

/* ── Chart card chrome ── */

export function GridCardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid-explorer-card-footer', className)}>{children}</div>;
}

export interface GridSourceLink {
  label: string;
  href: string;
}

export function GridSourceFooter({
  source,
  auditedBy,
  reporting,
  className,
}: {
  source: ReactNode;
  auditedBy: ReactNode;
  reporting: ReactNode;
  className?: string;
}) {
  return (
    <GridCardFooter className={className}>
      <span>Source: {source}</span>
      <span>Audited by: {auditedBy}</span>
      <span className="font-medium">{reporting}</span>
    </GridCardFooter>
  );
}

/** Structured footer with typed source links — for programmatic tab panels */
export function GridSourceFooterLinks({
  sources,
  auditedBy,
  reportingDate,
  className,
}: {
  sources: GridSourceLink[];
  auditedBy: string;
  reportingDate: string;
  className?: string;
}) {
  return (
    <GridSourceFooter
      className={className}
      source={
        <>
          {sources.map((s, i) => (
            <span key={s.href + s.label}>
              <Link
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                {s.label}
              </Link>
              {i < sources.length - 1 ? ' & ' : ''}
            </span>
          ))}
        </>
      }
      auditedBy={auditedBy}
      reporting={<>Reporting Date: {reportingDate}</>}
    />
  );
}

export function GridExplanationBlock({
  what,
  insight,
  className,
}: {
  what: ReactNode;
  insight?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2',
        className,
      )}
    >
      <p>
        <strong>What is being shown?</strong>
      </p>
      <div className="leading-relaxed">{what}</div>
      {insight && (
        <p className="leading-relaxed">
          <strong>Analytical Insight:</strong> {insight}
        </p>
      )}
    </div>
  );
}

/* ── KPI strip primitives ── */

export function GridKpiStrip({
  children,
  className,
  stripRef,
}: {
  children: ReactNode;
  className?: string;
  stripRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={stripRef} className={cn('grid-explorer-kpi-strip relative z-30', className)}>
      {children}
    </div>
  );
}

export function GridKpiLabel({ children }: { children: ReactNode }) {
  return <div className="grid-explorer-kpi__label">{children}</div>;
}

export function GridKpiCell({
  icon: Icon,
  iconClassName,
  label,
  value,
  hint,
  active,
  align = 'center',
  width = 'md',
  widthClass,
  onToggle,
  tooltipTitle,
  tooltipIcon: TooltipIcon,
  tooltipAccent,
  children,
}: {
  icon: GridIcon;
  iconClassName?: string;
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  active?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: 'sm' | 'md' | 'lg';
  widthClass?: string;
  onToggle?: () => void;
  tooltipTitle?: string;
  tooltipIcon?: GridIcon;
  tooltipAccent?: string;
  children?: ReactNode;
}) {
  const resolvedWidthClass =
    widthClass ??
    (width === 'sm'
      ? 'w-[17.5rem] md:w-80'
      : width === 'lg'
        ? 'w-[19.5rem] md:w-[22rem]'
        : 'w-[18rem] md:w-[20rem]');

  const interactive = Boolean(onToggle);

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        'grid-explorer-kpi stat group hover:z-[100] select-none min-w-0',
        interactive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
      onClick={onToggle}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle?.();
              }
            }
          : undefined
      }
    >
      <Icon className={cn('grid-explorer-kpi__icon shrink-0', iconClassName)} />
      <div className="min-w-0">
        <GridKpiLabel>{label}</GridKpiLabel>
        <div className="grid-explorer-kpi__value">{value}</div>
        {hint && <p className="text-[9px] text-muted-foreground mt-1 leading-snug">{hint}</p>}
      </div>
      {children && tooltipTitle && TooltipIcon && tooltipAccent && (
        <GridKpiTooltipPanel
          title={tooltipTitle}
          icon={TooltipIcon}
          accent={tooltipAccent}
          align={align}
          active={!!active}
          widthClass={resolvedWidthClass}
        >
          {children}
        </GridKpiTooltipPanel>
      )}
    </div>
  );
}

export function GridKpiTooltipPanel({
  title,
  icon: Icon,
  accent,
  align = 'center',
  active,
  widthClass = 'w-[18rem] md:w-[20rem]',
  children,
}: {
  title: string;
  icon: GridIcon;
  accent: string;
  align?: 'left' | 'center' | 'right';
  active: boolean;
  widthClass?: string;
  children: ReactNode;
}) {
  const pos =
    align === 'right'
      ? 'right-0 md:left-1/2 md:-translate-x-1/2'
      : 'left-0 md:left-1/2 md:-translate-x-1/2';

  return (
    <div
      className={cn(
        'absolute text-card-foreground border border-border/80 p-4 md:p-5 rounded-2xl shadow-2xl z-[110] top-[calc(100%+12px)] pointer-events-none bg-card transition-all duration-200 ease-out opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto',
        widthClass,
        pos,
        active && 'opacity-100 scale-100 translate-y-0 pointer-events-auto',
      )}
      style={{ backgroundColor: 'hsl(var(--card))' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-t border-l border-border/80 z-[-1]"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      />
      <div
        className={cn(
          'font-bold text-xs uppercase tracking-wider border-b border-border/60 pb-1.5 mb-2 flex items-center gap-1.5',
          accent,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function GridKpiTooltipBody({ children }: { children: ReactNode }) {
  return <div className="space-y-2 text-[11px] md:text-xs leading-relaxed">{children}</div>;
}

export function GridKpiTooltipRow({ label, value, valueClass }: { label: string; value: ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-bold text-foreground text-right', valueClass)}>{value}</span>
    </div>
  );
}

export function GridKpiTooltipAudit({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold', className)}>
      {children}
    </div>
  );
}

export function GridKpiTooltipRef({
  refLabel,
  refHref,
  dateLabel,
}: {
  refLabel: string;
  refHref: string;
  dateLabel: string;
}) {
  return (
    <div className="pt-1 flex justify-between text-[9px] text-muted-foreground border-t border-border/20">
      <span>
        Ref:{' '}
        <a href={refHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {refLabel}
        </a>
      </span>
      <span>{dateLabel}</span>
    </div>
  );
}

/** Two-column tooltip grid (archive KPI strips) */
export function GridKpiTooltipGridRow({
  label,
  value,
  valueClass,
  dotColor,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
  dotColor?: string;
}) {
  return (
    <>
      <span className="grid-chart-tooltip__label flex items-center gap-1.5">
        {dotColor ? (
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: dotColor }} />
        ) : (
          <span className="grid-chart-tooltip__dot shrink-0 bg-transparent" />
        )}
        {label}
      </span>
      <span
        className={cn('grid-chart-tooltip__value text-right', valueClass)}
        style={dotColor && !valueClass ? { color: dotColor } : undefined}
      >
        {value}
      </span>
    </>
  );
}

export function GridKpiTooltipGrid({ children }: { children: ReactNode }) {
  return <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">{children}</div>;
}

/** Petrobangla gas-day ref line */
export function GridKpiTooltipGasRef({ refLabel, gasDay }: { refLabel: string; gasDay: string }) {
  return (
    <GridKpiTooltipRef
      refLabel={refLabel}
      refHref="https://www.petrobangla.org.bd/"
      dateLabel={`Gas-day ${gasDay}`}
    />
  );
}