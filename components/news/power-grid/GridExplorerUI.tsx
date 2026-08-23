'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Children, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

type GridIcon = LucideIcon | ComponentType<{ className?: string }>;
import { cn } from '@/lib/utils';
import { ModernTooltip } from '@/components/shared/ModernTooltip';

/* ── Data cadence badges (title / KPI labels) ── */

// The 600-weight tones in light mode: the 500s sat at ~3:1 against the card at
// 10px, which Lighthouse rightly fails — small text needs 4.5:1.
const BADGE_TONE: Record<string, string> = {
  daily: 'text-emerald-600 dark:text-emerald-400',
  live: 'text-emerald-600 dark:text-emerald-400',
  archive: 'text-sky-600 dark:text-sky-400',
  monthly: 'text-orange-600 dark:text-orange-400',
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

/** The heading line of the P/D tooltip — the claim in two words. */
const GRID_PROVENANCE_HEADING: Record<GridProvenance, string> = {
  P: 'Published figure',
  D: 'Derived figure',
};

/**
 * The P/D mark.
 *
 * The explanation used to ride on the native `title` attribute, which meant the
 * single most-repeated piece of methodology on the site — it appears over 160
 * times in the explorer alone — was delivered by the browser's own tooltip:
 * roughly a second of delay, no styling, no dark mode, and nothing at all on
 * touch. It now uses the same portal tooltip as the rest of the site, wrapped in
 * a `span` so it stays legal inside the sentences and table cells it sits in.
 *
 * `aria-label` and the tooltip's own `role="tooltip"` carry the meaning for
 * assistive tech, so nothing is lost by dropping `title`.
 */
export function GridProvenanceTag({ kind, className }: { kind: GridProvenance; className?: string }) {
  return (
    <ModernTooltip
      label={GRID_PROVENANCE_HEADING[kind]}
      hint={GRID_PROVENANCE_TITLE[kind]}
      variant="data"
      wrapperAs="span"
      fast
      className={cn('grid-provenance-tag-wrap', className)}
    >
      {/* Deliberately not focusable. The explorer carries over 160 of these on
          one page, so making each a tab stop would put 160 stops between a
          keyboard reader and the date picker. The meaning travels on the
          `aria-label` — which is what a screen reader announced from `title`
          before this — and the full methodology is a heading-level disclosure
          at the top of the page rather than something only a hover reveals. */}
      <span
        className={cn('grid-provenance-tag', `grid-provenance-tag--${kind.toLowerCase()}`)}
        aria-label={kind === 'P' ? 'Published figure' : 'Derived figure'}
        role="note"
      >
        {kind}
      </span>
    </ModernTooltip>
  );
}

/* ── Paging long tables ─────────────────────────────────────────────────── */

/**
 * Page state for a long table.
 *
 * Returns the slice to render plus everything the pager needs to draw itself.
 * The page resets whenever the row count changes, because a filter that shrinks
 * a list to nine rows should not leave a reader stranded on page four looking
 * at nothing.
 */
export function useTablePager<T>(rows: T[], initialSize = 25) {
  const [pageSize, setPageSize] = useState(initialSize);
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [total, pageSize]);

  const start = (current - 1) * pageSize;
  const end = Math.min(start + pageSize, total);

  return {
    rows: rows.slice(start, end),
    page: current,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    from: total === 0 ? 0 : start + 1,
    to: end,
  };
}

/** 1 … 4 5 6 … 20 — never more than seven slots, so the row cannot reflow. */
function pagerNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

// The same three the admin panel offers, so the two halves of the product
// behave identically.
const PAGE_SIZES = [25, 50, 100];

/**
 * The pager under a long table.
 *
 * One component for the whole explorer: the substation registry had grown its
 * own with prev/next only, and every other long list had nothing at all, so a
 * reader met 149 power stations as one scroll. Same controls, same wording and
 * same page sizes wherever a list is long enough to need them — which is also
 * what makes them predictable.
 */
export function GridTablePager({
  page,
  totalPages,
  pageSize,
  total,
  from,
  to,
  onPage,
  onPageSize,
  noun = 'rows',
  className,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  /** What is being listed, for the count line: "of 149 stations". */
  noun?: string;
  className?: string;
}) {
  if (total <= PAGE_SIZES[0] && totalPages <= 1) return null;

  return (
    <div className={cn('grid-pager', className)}>
      <p className="grid-pager__count">
        Showing <strong>{from.toLocaleString()}</strong>–<strong>{to.toLocaleString()}</strong> of{' '}
        <strong>{total.toLocaleString()}</strong> {noun}
      </p>

      <div className="grid-pager__size">
        <span>Show</span>
        {PAGE_SIZES.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={pageSize === n}
            className={cn('grid-pager__size-btn', pageSize === n && 'is-active')}
            onClick={() => onPageSize(n)}
          >
            {n}
          </button>
        ))}
        <span>per page</span>
      </div>

      {totalPages > 1 ? (
        <nav className="grid-pager__nav" aria-label="Table pages">
          <button type="button" className="grid-pager__step" disabled={page === 1}
            onClick={() => onPage(1)} aria-label="First page">«</button>
          <button type="button" className="grid-pager__step" disabled={page === 1}
            onClick={() => onPage(Math.max(1, page - 1))} aria-label="Previous page">‹</button>
          {pagerNumbers(page, totalPages).map((n, i) =>
            n === '…' ? (
              <span key={`gap-${i}`} className="grid-pager__gap" aria-hidden>…</span>
            ) : (
              <button
                key={n}
                type="button"
                className={cn('grid-pager__num', n === page && 'is-current')}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            ),
          )}
          <button type="button" className="grid-pager__step" disabled={page === totalPages}
            onClick={() => onPage(Math.min(totalPages, page + 1))} aria-label="Next page">›</button>
          <button type="button" className="grid-pager__step" disabled={page === totalPages}
            onClick={() => onPage(totalPages)} aria-label="Last page">»</button>
        </nav>
      ) : null}
    </div>
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

/**
 * The prose under a chart: what it shows, and what to read from it.
 *
 * Measured on a 393px screen, this block came to 281px against a plot of
 * roughly 228px — the explanation was taller than the thing it explained, and
 * a reader scrolling a phone met more words than data on every card.
 *
 * So on a phone the heading becomes the control and the body is closed until
 * asked for. It is not removed and not shortened: this is the layer that makes
 * the figures legible to someone who does not already know the sector, and
 * cutting it would trade the product's whole purpose for a shorter page.
 * Above 40rem nothing changes and the prose is simply open.
 */
export function GridExplanationBlock({
  what,
  insight,
  insightLabel = 'Analytical Insight:',
  className,
}: {
  what: ReactNode;
  insight?: ReactNode;
  /** Some cards read their second paragraph as instruction rather than
   *  analysis; those say so instead of being reworded to fit the default. */
  insightLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        'grid-explorer-explain bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2',
        open && 'is-open',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid-explorer-explain__toggle"
        aria-expanded={open}
      >
        <strong>What is being shown?</strong>
        <ChevronDown className="grid-explorer-explain__chevron h-3.5 w-3.5 shrink-0" />
      </button>
      <p className="grid-explorer-explain__heading">
        <strong>What is being shown?</strong>
      </p>
      <div className="grid-explorer-explain__body space-y-2">
        <div className="leading-relaxed">{what}</div>
        {insight && (
          <p className="leading-relaxed">
            <strong>{insightLabel}</strong> {insight}
          </p>
        )}
      </div>
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

/**
 * How many columns a strip of this many tiles wants.
 *
 * The base strip is five columns, which is right for exactly one strip on the
 * page. A three-tile strip on a five-column grid leaves two empty columns and
 * reads as though two figures failed to load — which is what the Petrobangla
 * gas strip did, since it renders between one and three tiles depending on
 * what the day's report carries.
 *
 * Applied only when the caller has not named a variant itself, so every
 * existing `--four` / `--six` call site behaves exactly as before.
 */
const GRID_KPI_STRIP_COUNT_VARIANT: Record<number, string> = {
  1: 'grid-explorer-kpi-strip--one',
  2: 'grid-explorer-kpi-strip--two',
  3: 'grid-explorer-kpi-strip--three',
  4: 'grid-explorer-kpi-strip--four',
  6: 'grid-explorer-kpi-strip--six',
};

export function GridKpiStrip({
  children,
  className,
  stripRef,
  layer = 'panel',
  collapsibleAfter,
}: {
  children: ReactNode;
  className?: string;
  stripRef?: React.RefObject<HTMLDivElement | null>;
  layer?: GridKpiStripLayer;
  /**
   * Below 40rem, show this many tiles and fold the rest behind a control.
   *
   * The page strip carries six. Two-up on a phone that is three rows of
   * figures before the tab bar is even reached, and a reader has to scroll
   * past all of it to find out whether the grid coped today. Folding is a
   * phone-only behaviour: the CSS that hides the remainder is inside the
   * media query, so every tile renders unconditionally on a desktop and this
   * prop changes nothing there.
   *
   * The tiles stay in the DOM either way — this hides them, it does not stop
   * rendering them, so nothing that reads the strip loses a figure.
   */
  collapsibleAfter?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  const folds = collapsibleAfter != null && items.length > collapsibleAfter;
  const countVariant = className?.includes('grid-explorer-kpi-strip--')
    ? undefined
    : GRID_KPI_STRIP_COUNT_VARIANT[items.length];

  return (
    <div
      ref={stripRef}
      data-expanded={folds && expanded ? 'true' : undefined}
      className={cn(
        'grid-explorer-kpi-strip relative',
        GRID_KPI_STRIP_LAYER[layer],
        countVariant,
        folds && 'grid-explorer-kpi-strip--folds',
        className,
      )}
    >
      {folds
        ? items.map((child, i) => (
            <div
              key={i}
              className={cn(
                'grid-explorer-kpi-slot',
                i >= collapsibleAfter! && 'grid-explorer-kpi-overflow',
              )}
            >
              {child}
            </div>
          ))
        : children}

      {folds && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid-explorer-kpi-more"
          aria-expanded={expanded}
        >
          {expanded
            ? 'Show fewer'
            : `Show ${items.length - collapsibleAfter!} more`}
        </button>
      )}
    </div>
  );
}

export function GridKpiLabel({ children }: { children: ReactNode }) {
  return <div className="grid-explorer-kpi__label">{children}</div>;
}

/**
 * Movement against the mean of the days before this one.
 *
 * Direction is stated, never coloured by direction alone: on this strip a fall
 * in demand and a fall in shedding are opposite kinds of news, so `polarity`
 * says which way is good and green/red follow that rather than the arrow.
 * `neutral` leaves it grey for figures that are not better or worse either way.
 */
export function GridKpiTrend({
  current,
  baseline,
  days,
  unit = '',
  polarity = 'neutral',
}: {
  current: number | null | undefined;
  baseline: number | null | undefined;
  days: number;
  unit?: string;
  polarity?: 'up-good' | 'down-good' | 'neutral';
}) {
  if (current == null || baseline == null || !Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) {
    return null;
  }
  const diff = current - baseline;
  const pct = (diff / Math.abs(baseline)) * 100;
  // Under half a percent the arrow would be noise dressed as a signal.
  const flat = Math.abs(pct) < 0.5;
  const good = polarity === 'neutral' ? null : (diff > 0) === (polarity === 'up-good');
  const tone = flat || good == null ? 'text-muted-foreground' : good ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive';
  const arrow = flat ? '→' : diff > 0 ? '▲' : '▼';
  return (
    <span
      className={cn(
        'grid-explorer-kpi__trend inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 font-semibold tabular-nums',
        tone,
      )}
    >
      <span aria-hidden>{arrow}</span>
      {flat ? 'level' : `${Math.abs(pct).toFixed(1)}%`}
      <span className="font-normal text-muted-foreground">
        vs {days}-day avg{unit ? ` (${Math.round(baseline).toLocaleString('en-IN')}${unit})` : ''}
      </span>
    </span>
  );
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
        {hint && (
          <p className="grid-explorer-kpi__hint text-[9px] text-muted-foreground mt-1 leading-snug tabular-nums">
            {hint}
          </p>
        )}
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
        // Stated rather than inherited: the panel is a portal-less child of the
        // tile, so a tile that ever set its own text alignment would drag eight
        // label/value rows along with it.
        'absolute text-left text-card-foreground border border-border/80 p-4 md:p-5 rounded-2xl shadow-2xl z-[110] top-[calc(100%+12px)] pointer-events-none bg-card transition-all duration-200 ease-out opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto',
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
        <Icon className="h-3.5 w-3.5 shrink-0" />
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
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground inline-flex items-center gap-1 min-w-0">
        {provenance && <GridProvenanceTag kind={provenance} />}
        {label}
      </span>
      <span className={cn('font-bold text-foreground text-right tabular-nums', valueClass)}>
        {value}
      </span>
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
  provenance,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
  dotColor?: string;
  /**
   * Whose figure this row is. Optional so existing callers keep working, but a
   * row inside a hover panel is exactly where a reader decides whether to quote
   * a number, so it should be set wherever the answer is known.
   */
  provenance?: GridProvenance;
}) {
  return (
    <>
      <span className="grid-chart-tooltip__label flex items-center gap-1.5">
        {dotColor ? (
          <span className="grid-chart-tooltip__dot shrink-0" style={{ background: dotColor }} />
        ) : (
          <span className="grid-chart-tooltip__dot shrink-0 bg-transparent" />
        )}
        {provenance ? <GridProvenanceTag kind={provenance} /> : null}
        {label}
      </span>
      <span
        className={cn('grid-chart-tooltip__value text-right tabular-nums', valueClass)}
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
