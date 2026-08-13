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

/**
 * Where a figure on the page came from.
 *
 * `P` — the source publication states this number and we reproduce it. It is
 * not a number we have checked, corrected or audited; it is theirs.
 * `D` — we calculated it from published figures. The source never states it.
 *
 * The distinction is the whole point: a reader looking at "7.63 Tk/kWh" cannot
 * otherwise tell that PGCB published the cost and the energy but never that
 * rate, and the page used to make that worse by crediting auditors — BPC, CAG,
 * SF Ahmed & Co. — whose reports nothing in this pipeline has ever opened.
 */
export type GridProvenance = 'P' | 'D';

/**
 * "Published" means any official publication states the figure — any government
 * body, not only PGCB/Petrobangla/BPDB. A Ministry of Finance budget line, a
 * Power Cell loss percentage, a BERC tariff order and a Bangladesh Bank exchange
 * rate are all equally P. What makes a figure P is that someone else printed it
 * and we reproduced it; what makes it D is that we worked it out.
 */
export const GRID_PROVENANCE_TITLE: Record<GridProvenance, string> = {
  P: 'Published — stated in an official publication (any government body or agency) and reproduced here unchanged. Not audited or verified by ESB PowerLine.',
  D: 'Derived — calculated by ESB PowerLine from published figures. The source does not state this number.',
};

export function GridProvenanceTag({ kind, className }: { kind: GridProvenance; className?: string }) {
  return (
    <span
      className={cn('grid-provenance-tag', `grid-provenance-tag--${kind.toLowerCase()}`, className)}
      title={GRID_PROVENANCE_TITLE[kind]}
      aria-label={kind === 'P' ? 'Published figure' : 'Derived figure'}
    >
      {kind}
    </span>
  );
}

export interface GridSourceLink {
  label: string;
  href: string;
}

/**
 * The footer under a data card: who published the figures, and what standing
 * that gives them.
 *
 * The middle slot used to be an `auditedBy` prop rendered as "Audited by: X",
 * and callers filled it with auditors — CAG, IMED, SF Ahmed & Co., MABS & J
 * Partners, even the OPEC Secretariat — none of whose reports anything in this
 * codebase has opened. The prop is now `attribution` and is rendered verbatim,
 * so the component cannot assert an audit on a caller's behalf; a caller that
 * wants to claim one has to write the words itself, and should not.
 */
export function GridSourceFooter({
  source,
  attribution,
  reporting,
  className,
}: {
  source: ReactNode;
  attribution: ReactNode;
  reporting: ReactNode;
  className?: string;
}) {
  return (
    <GridCardFooter className={className}>
      <span>Source: {source}</span>
      <span>{attribution}</span>
      <span className="font-medium">{reporting}</span>
    </GridCardFooter>
  );
}

/** Structured footer with typed source links — for programmatic tab panels */
export function GridSourceFooterLinks({
  sources,
  attribution,
  reportingDate,
  className,
}: {
  sources: GridSourceLink[];
  attribution: string;
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
      attribution={attribution}
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

/**
 * Where a KPI strip sits in the page's stacking order.
 *
 * `relative z-*` makes each strip its own stacking context, so a tooltip inside
 * one — z-110 though it is — can never paint above a *sibling* strip with an
 * equal z-index that comes later in the document. Two strips at the same layer
 * therefore means the upper one's tooltips open underneath the lower one's
 * tiles, which is how the Overview briefings ended up rendering behind the
 * Renewables KPI cells.
 *
 * `page`  the strip at the top of the explorer, whose tooltips drop over the
 *         tab content below it.
 * `panel` a strip inside tab content, which must stay below the page strip.
 *
 * `panel` is the default deliberately: a new strip is nearly always inside a
 * tab, and defaulting to the lower layer makes the safe case the automatic one.
 */
export type GridKpiStripLayer = 'page' | 'panel';

const GRID_KPI_STRIP_LAYER: Record<GridKpiStripLayer, string> = {
  page: 'z-30',
  panel: 'z-20',
};

export function GridKpiStrip({
  children,
  className,
  stripRef,
  layer = 'panel',
}: {
  children: ReactNode;
  className?: string;
  stripRef?: React.RefObject<HTMLDivElement | null>;
  layer?: GridKpiStripLayer;
}) {
  return (
    <div
      ref={stripRef}
      className={cn('grid-explorer-kpi-strip relative', GRID_KPI_STRIP_LAYER[layer], className)}
    >
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
  provenance,
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
  /** Whether the headline value is the source's number or one of ours. */
  provenance?: GridProvenance;
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
        {/* The mark sits with the cadence badge, not against the number: both
            say what kind of figure this is rather than what it reads. */}
        <GridKpiLabel>
          {label}
          {provenance && <GridProvenanceTag kind={provenance} className="ml-2" />}
        </GridKpiLabel>
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

export function GridKpiTooltipRow({
  label,
  value,
  valueClass,
  provenance,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
  provenance?: GridProvenance;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground inline-flex items-center gap-1">
        {provenance && <GridProvenanceTag kind={provenance} />}
        {label}
      </span>
      <span className={cn('font-bold text-foreground text-right', valueClass)}>{value}</span>
    </div>
  );
}

/**
 * The provenance line at the foot of a KPI tooltip. It replaced a row that
 * printed "Audited by: <firm>" on figures no auditor's report reaches this
 * codebase — state who published a number, and say plainly that we did not
 * verify it.
 */
export function GridKpiTooltipAudit({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold', className)}>
      {children}
    </div>
  );
}

/**
 * An academic-style citation for one figure: the document, the part of it the
 * number sits in, and the exact file for this date.
 *
 * The site used to print invented department names — "PGCB System Statistics
 * Division", "Petrobangla Well Status" — which read as separate publications
 * but were all one workbook and one PDF page. Naming the real document and its
 * sheet or section is both honest and more precise: a reader can open the same
 * file and turn to the same sheet.
 */
export function GridKpiTooltipRef({
  refLabel,
  refHref,
  dateLabel,
  sourceFile,
  part,
}: {
  refLabel: string;
  refHref: string;
  dateLabel: string;
  /** Sheet, section or block the figure sits in — "P1 sheet", "II. Distribution". */
  part?: string | null;
  /**
   * The exact document this KPI was read from, for this specific day or month.
   *
   * "Ref: PGCB Daily Log" tells a reader which organisation to trust; the
   * filename tells them which document to ask for. Only the second is checkable,
   * which is the whole point of showing it on the figure itself rather than once
   * at the foot of the page.
   *
   * Omitted rather than guessed when no file is held for that date.
   */
  sourceFile?: string | null;
}) {
  let host = refHref;
  try {
    host = new URL(refHref).host.replace(/^www\./, '');
  } catch {
    /* non-absolute href — show it as given */
  }
  return (
    <div className="grid-kpi-cite">
      <div className="grid-kpi-cite__head">
        <span className="grid-kpi-cite__doc">
          {refLabel}
          {part ? <span className="grid-kpi-cite__part"> · {part}</span> : null}
        </span>
        <span className="grid-kpi-cite__date">{dateLabel}</span>
      </div>
      {sourceFile ? (
        <div className="grid-kpi-cite__row">
          <span className="grid-kpi-cite__key">File</span>
          <code className="grid-kpi-source-file" title={sourceFile}>{sourceFile}</code>
        </div>
      ) : null}
      <div className="grid-kpi-cite__row">
        <span className="grid-kpi-cite__key">From</span>
        {/* Host is shown, full URL on hover — the address bar's worth of
            information without the tooltip wrapping onto three lines. */}
        <a
          href={refHref}
          target="_blank"
          rel="noopener noreferrer"
          title={refHref}
          className="grid-kpi-cite__host"
        >
          {host}
        </a>
      </div>
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
export function GridKpiTooltipGasRef({
  refLabel,
  gasDay,
  sourceFile,
  part,
}: {
  refLabel: string;
  gasDay: string;
  sourceFile?: string | null;
  part?: string | null;
}) {
  return (
    <GridKpiTooltipRef
      refLabel={refLabel}
      part={part}
      refHref="https://www.petrobangla.org.bd/"
      dateLabel={`Gas-day ${gasDay}`}
      sourceFile={sourceFile}
    />
  );
}
/**
 * Names the exact documents a figure came from.
 *
 * "Source: PGCB Daily Report" is an attribution; a filename is a receipt. A
 * reader who wants to check a number can ask the agency for that exact file,
 * and anyone auditing the site can tell at a glance whether a day was built
 * from the agency's own workbook or from a text conversion of it.
 *
 * Renders nothing when no filename is held, rather than inventing one.
 */
export function GridSourceFiles({
  files,
  className,
}: {
  files?: Array<{ label: string; name?: string | null }>;
  className?: string;
}) {
  const named = (files ?? []).filter((f): f is { label: string; name: string } => Boolean(f.name));
  if (!named.length) return null;
  return (
    <span className={cn('grid-source-files', className)}>
      <span className="grid-source-files__lead">Read from:</span>
      {named.map((f, i) => (
        <span key={f.label + f.name} className="grid-source-files__item">
          <span className="grid-source-files__agency">{f.label}</span>
          <code className="grid-source-files__name" title={f.name}>{f.name}</code>
          {i < named.length - 1 ? <span className="grid-source-files__sep">·</span> : null}
        </span>
      ))}
    </span>
  );
}
