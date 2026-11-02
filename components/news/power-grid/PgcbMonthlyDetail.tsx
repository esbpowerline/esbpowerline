'use client';

/**
 * The per-month panels for the PGCB Monthly Archives tab.
 *
 * Everything here is driven by the `detail` block of a month's published JSON
 * (see scripts/parse_pgcb_monthly_workbook.py), which covers the 19 populated
 * sheets of the source workbook rather than the two the headline record uses.
 *
 * Colour decisions, in line with the project's data-viz rules:
 *  - The load-shed heatmap encodes MAGNITUDE, so it uses a single-hue sequential
 *    ramp and identifies zones by row label. It deliberately does not use the
 *    nine-way REGIONAL_ZONE_COLORS palette, which fails CVD separation between
 *    Cumilla and Mymensingh (OKLab ΔE 0.9 protan / 11.3 normal vision).
 *  - The one place two series are compared uses #3b82f6 / #ea580c, which passes
 *    every check in both light and dark mode, and is backed by direct value
 *    labels and a table so it never relies on colour alone.
 *  - Status colours (improved / worsened) always ship with a glyph and a label.
 */

import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  Gauge,
  Network,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GridTablePager, useTablePager } from '@/components/news/power-grid/GridExplorerUI';

import { cn } from '@/lib/utils';
import { GridProvenanceTag } from './GridExplorerUI';
import { MobileFold } from './MobileFold';
import type {
  PgcbCircleRow,
  PgcbDailyShedRow,
  PgcbMonthlyDetail,
  PgcbOutageEvent,
  PgcbSystemStat,
} from '@/lib/data/companies/pgcb';
import {
  SERIES_COLORS,
  SERIES_UNMAPPED,
  STATUS_COLORS,
  CHART_INK,
} from '@/lib/data/grid/chart-palette';

/* ------------------------------------------------------------------ utils */

const ZONE_LABELS: Array<{ key: string; label: string }> = [
  { key: 'dhaka', label: 'Dhaka' },
  { key: 'chattogram', label: 'Chattogram' },
  { key: 'cumilla', label: 'Cumilla' },
  { key: 'mymensingh', label: 'Mymensingh' },
  { key: 'sylhet', label: 'Sylhet' },
  { key: 'khulna', label: 'Khulna' },
  { key: 'barishal', label: 'Barishal' },
  { key: 'rajshahi', label: 'Rajshahi' },
  { key: 'rangpur', label: 'Rangpur' },
];

/** The headline record still uses the older spellings; detail uses the current ones. */
const AREA_ALIAS: Record<string, string> = {
  chittagong: 'chattogram',
  comilla: 'cumilla',
  barisal: 'barishal',
};
const canonicalArea = (k: string) => AREA_ALIAS[k.toLowerCase()] ?? k.toLowerCase();

const SERIES_A = SERIES_COLORS.installedCapacity;
const SERIES_B = SERIES_COLORS.peakGeneration;

function fmt(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function pctChange(current: number | null | undefined, prev: number | null | undefined): number | null {
  if (current === null || current === undefined || !prev) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

/* ------------------------------------------------------------- primitives */

function PanelCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  actions,
}: {
  /** The concept this panel is about, in the explorer's own icon vocabulary. */
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="grid-explorer-chart-card card">
      {/* Same head as every other card on the explorer — icon, then the title
          and its sub — rather than a private two-column layout, so these panels
          line up with the tabs either side of them. */}
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border flex-wrap">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <h3 className="grid-explorer-chart-card__title">
            {title}
            {badge && (
              <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                {badge}
              </span>
            )}
          </h3>
          {subtitle && <p className="grid-explorer-chart-card__sub">{subtitle}</p>}
        </div>
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------- tooltip */

interface TipContent {
  heading: string;
  value: string;
  meta?: string | null;
  tone?: 'good' | 'alert';
  /**
   * Provenance of the hovered figure. Carried in the tooltip because most of
   * this panel's numbers are only ever read on hover — a tag on the column
   * header does not tell you whether the cell under the cursor is PGCB's or a
   * total of ours.
   */
  kind?: 'P' | 'D';
}
interface TipState extends TipContent {
  x: number;
  y: number;
}

/**
 * Cursor-following tooltip in the site's popover idiom, rendered `fixed` so it
 * is never clipped by the heatmap's horizontal scroll container. Replaces the
 * browser's native `title`, which cannot be styled and appears on a delay.
 */
function ChartTooltip({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  const clampedX = Math.min(Math.max(tip.x, 90), (typeof window !== 'undefined' ? window.innerWidth : 1200) - 90);
  return (
    <div
      className="fixed z-[200] pointer-events-none"
      style={{ left: clampedX, top: tip.y - 12, transform: 'translate(-50%, -100%)' }}
      role="tooltip"
    >
      <div className="bg-popover text-popover-foreground border border-border/80 rounded-lg shadow-xl px-2.5 py-2 animate-in fade-in zoom-in-95 duration-100">
        <div className="text-[10px] font-bold whitespace-nowrap">{tip.heading}</div>
        <div
          className={cn(
            'text-sm font-bold tabular-nums whitespace-nowrap inline-flex items-center gap-1.5',
            tip.tone === 'good' && 'text-emerald-600 dark:text-emerald-500',
            tip.tone === 'alert' && 'text-rose-600 dark:text-rose-500',
          )}
        >
          {tip.value}
          {tip.kind ? <GridProvenanceTag kind={tip.kind} /> : null}
        </div>
        {tip.meta && (
          <div className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{tip.meta}</div>
        )}
      </div>
      {/* Caret, matching the popover border. */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-popover border-b border-r border-border/80" />
    </div>
  );
}

function useChartTooltip() {
  const [tip, setTip] = useState<TipState | null>(null);
  const show = (e: React.MouseEvent, content: TipContent) =>
    setTip({ ...content, x: e.clientX, y: e.clientY });
  const hide = () => setTip(null);
  return { tip, show, hide };
}

/**
 * A plain-language note under a panel. These figures are industry shorthand, so
 * each panel says what its numbers actually mean rather than assuming the reader
 * already knows.
 */
function Explainer({ children }: { children: React.ReactNode }) {
  // MobileFold: identical output at >=1024px; a 44px "How to read this" row below.
  return (
    <MobileFold title="How to read this">
      <div className="mt-4 pt-3 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </MobileFold>
  );
}

/** A term and its definition, for panels that need several at once. */
function Glossary({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <MobileFold title="Terms used here">
      <div className="mt-4 pt-3 border-t border-border/40 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {items.map(([term, def]) => (
          <p key={term} className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">{term}</span> — {def}
          </p>
        ))}
      </div>
    </MobileFold>
  );
}

/**
 * Direction is stated with a glyph and a word, never colour alone — the colour
 * is a reinforcement for readers who can use it.
 */
function DeltaBadge({
  change,
  goodWhen = 'down',
  suffix = 'vs May',
}: {
  change: number | null;
  goodWhen?: 'up' | 'down';
  suffix?: string;
}) {
  if (change === null || !Number.isFinite(change)) return null;
  const rising = change > 0;
  const good = goodWhen === 'up' ? rising : !rising;
  const flat = Math.abs(change) < 0.05;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold tabular-nums',
        flat
          ? 'text-muted-foreground'
          : good
            ? 'text-emerald-600 dark:text-emerald-500'
            : 'text-rose-600 dark:text-rose-500',
      )}
    >
      <span aria-hidden="true">{flat ? '→' : rising ? '▲' : '▼'}</span>
      {Math.abs(change).toFixed(1)}%
      <span className="font-medium text-muted-foreground">{suffix}</span>
    </span>
  );
}

function StatTile({
  label,
  value,
  unit,
  note,
  change,
  goodWhen,
  compareLabel,
  tone = 'default',
  kind,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  change?: number | null;
  goodWhen?: 'up' | 'down';
  compareLabel?: string;
  tone?: 'default' | 'alert';
  /** P when PGCB prints this line in the report, D when we work it out. */
  kind?: 'P' | 'D';
}) {
  return (
    <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center gap-1">
      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider inline-flex items-center gap-1">
        {label}
        {kind ? <GridProvenanceTag kind={kind} /> : null}
      </div>
      <div
        className={cn(
          'text-2xl font-bold tabular-nums',
          tone === 'alert' ? 'text-rose-600 dark:text-rose-500' : 'text-foreground',
        )}
      >
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
      {/* Only when there is a movement to state — an empty row still spent the
          tile's gap, so tiles with a delta sat a few pixels taller than those
          without and the strip lost its shared baseline. */}
      {change != null && Number.isFinite(change) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <DeltaBadge change={change} goodWhen={goodWhen} suffix={compareLabel} />
        </div>
      )}
      {note && <div className="text-[10px] leading-relaxed text-muted-foreground">{note}</div>}
    </div>
  );
}

/** Magnitude bar: one hue, thin, rounded data-end, value labelled directly. */
function MagnitudeBar({
  label,
  value,
  max,
  unit,
  sub,
  color = SERIES_A,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  sub?: React.ReactNode;
  color?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-32 shrink-0 text-xs font-semibold text-foreground truncate" title={label}>
        {label}
      </div>
      <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-28 shrink-0 text-right text-xs font-bold tabular-nums text-foreground">
        {fmt(value, value < 100 ? 1 : 0)}
        {unit && <span className="ml-1 text-[10px] font-medium text-muted-foreground">{unit}</span>}
        {sub && <div className="text-[10px] font-medium text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="grid-explorer-control w-full sm:w-56 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
    />
  );
}

function TableShell({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid-explorer-table-wrap max-h-96 overflow-auto rounded-xl border border-border/40">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr className="border-b border-border/50 text-muted-foreground text-left">{head}</tr>
        </thead>
        <tbody className="divide-y divide-border/20 text-foreground">{children}</tbody>
      </table>
    </div>
  );
}

const Th = ({ children, align = 'left', kind }: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  kind?: 'P' | 'D';
}) => (
  <th className={cn('py-2 px-3 font-bold whitespace-nowrap', align === 'right' && 'text-right')}>
    <span className="inline-flex items-center gap-1">{children}{kind ? <GridProvenanceTag kind={kind} /> : null}</span>
  </th>
);
const Td = ({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) => (
  <td className={cn('py-1.5 px-3', align === 'right' && 'text-right tabular-nums', className)}>{children}</td>
);

/* --------------------------------------------------- 1. reliability strip */

function ReliabilityStrip({ keyed, prevLabel }: { keyed: Record<string, PgcbSystemStat>; prevLabel: string }) {
  const daysEvening = keyed.days_load_shed_evening;
  const maxShed = keyed.max_load_shed_evening_mw;
  const minShed = keyed.min_load_shed_evening_mw;
  const loadFactor = keyed.monthly_load_factor_pct;
  const daysDay = keyed.days_load_shed_day;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatTile
        kind="P"
        label="Days with load shed"
        value={daysEvening ? fmt(daysEvening.value) : '—'}
        unit="evening peaks"
        note={daysDay ? `${fmt(daysDay.value)} day peaks affected` : undefined}
        change={daysEvening ? pctChange(daysEvening.value, daysEvening.prev_month) : null}
        goodWhen="down"
        compareLabel={prevLabel}
        tone="alert"
      />
      <StatTile
        kind="P"
        label="Max load shed"
        value={maxShed ? fmt(maxShed.value) : '—'}
        unit="MW"
        note={maxShed?.when ? `Peak shortfall on ${maxShed.when}` : undefined}
        change={maxShed ? pctChange(maxShed.value, maxShed.prev_month) : null}
        goodWhen="down"
        compareLabel={prevLabel}
        tone="alert"
      />
      <StatTile
        kind="P"
        label="Min load shed"
        value={minShed ? fmt(minShed.value) : '—'}
        unit="MW"
        note={minShed?.when ? `Best evening peak, ${minShed.when}` : undefined}
        change={minShed ? pctChange(minShed.value, minShed.prev_month) : null}
        goodWhen="down"
        compareLabel={prevLabel}
      />
      <StatTile
        kind="P"
        label="Monthly load factor"
        value={loadFactor ? loadFactor.value.toFixed(2) : '—'}
        unit="%"
        note="Average load against peak demand"
        change={loadFactor ? pctChange(loadFactor.value, loadFactor.prev_month) : null}
        goodWhen="up"
        compareLabel={prevLabel}
      />
    </div>
  );
}

/* ------------------------------------------------ 2. load-shed heatmap */

/**
 * Zero is a state, not a quantity, so it gets its own green rather than the
 * bottom step of the ramp. Everything above zero is magnitude on a single-hue
 * rose ramp, light → dark.
 *
 * Green-to-red is the classic colour-vision trap, so the distinction never rests
 * on hue: every non-zero cell carries its number and zero cells are blank, which
 * separates the two states for a reader who cannot tell the hues apart at all.
 */
function shedCellStyle(value: number | null, max: number): { backgroundColor: string; color: string } {
  if (!value || value <= 0 || max <= 0) {
    return { backgroundColor: 'rgba(16, 185, 129, 0.18)', color: 'transparent' };
  }
  // sqrt keeps the many small values legible against a few very large ones.
  const t = Math.min(1, Math.sqrt(value / max));
  const alpha = 0.15 + t * 0.85;
  return {
    backgroundColor: `rgba(190, 18, 60, ${alpha.toFixed(3)})`,
    color: t > 0.55 ? '#fff' : 'inherit',
  };
}

function LoadShedHeatmap({ rows, peakLabel }: { rows: PgcbDailyShedRow[]; peakLabel: string }) {
  const { tip, show, hide } = useChartTooltip();
  const max = useMemo(
    () =>
      rows.reduce(
        (m, r) => Math.max(m, ...ZONE_LABELS.map((z) => r.zones?.[z.key] ?? 0)),
        0,
      ),
    [rows],
  );
  const zoneTotals = useMemo(
    () =>
      ZONE_LABELS.map((z) => ({
        ...z,
        total: rows.reduce((s, r) => s + (r.zones?.[z.key] ?? 0), 0),
      })),
    [rows],
  );
  const monthTotal = zoneTotals.reduce((s, z) => s + z.total, 0);

  // Older reports (and a few later ones) publish a system-wide load-shed figure
  // without the zone breakdown. Those cells are null, not zero — and painting
  // them green would assert "no load shedding" on months that had plenty of it
  // (Jul 2022 peaked at 2,385 MW with no zone table at all).
  const zonesReported = useMemo(
    () => rows.some((r) => ZONE_LABELS.some((z) => r.zones?.[z.key] != null)),
    [rows],
  );
  const systemPeakShed = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.load_shed_mw ?? 0), 0),
    [rows],
  );

  if (!rows.length) return <p className="text-xs text-muted-foreground">No daily load shedding recorded.</p>;

  return (
    <div className="space-y-3">
      {!zonesReported && systemPeakShed > 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
          This month&apos;s report gives a system-wide load shed of up to {fmt(systemPeakShed)} MW but publishes no
          zone-by-zone breakdown. The zone rows below are blank because the figures were not reported — not because
          nothing was shed. Read the <strong>All zones</strong> row for what PGCB did record.
        </p>
      )}
      {zonesReported && monthTotal === 0 && systemPeakShed === 0 && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          PGCB&apos;s report records no load shedding at {peakLabel.toLowerCase()} on any day this month.
        </p>
      )}
      <div className="grid-explorer-table-wrap overflow-x-auto">
        {/* Full width so the grid fills the card instead of leaving the right third empty. */}
        {/*
          `border-spacing` sits outside the width `w-full` resolves to, so a
          32-column grid overflowed its wrapper by ~3px and raised a full
          horizontal scrollbar for a table that visually fits. The negative
          inline margin reclaims the two outer gaps, which were only padding at
          the table's edges anyway.
        */}
        <table
          className="min-w-[46rem] text-[10px] border-separate table-fixed"
          style={{ borderSpacing: '2px', width: 'calc(100% - 6px)' }}
        >
          <colgroup>
            <col style={{ width: '5.5rem' }} />
            {rows.map((r) => (
              <col key={r.date} />
            ))}
            <col style={{ width: '3.5rem' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card text-left font-bold text-muted-foreground px-1">
                <span className="inline-flex items-center gap-1">Zone<GridProvenanceTag kind="P" /></span>
              </th>
              {rows.map((r) => (
                <th key={r.date} className="font-semibold text-muted-foreground text-center">
                  {Number(r.date.slice(8, 10))}
                </th>
              ))}
              <th className="font-bold text-muted-foreground px-2 text-right">
                <span className="inline-flex items-center gap-1">Total<GridProvenanceTag kind="D" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {zoneTotals.map((z) => (
              <tr key={z.key}>
                <th className="sticky left-0 z-10 bg-card text-left font-semibold text-foreground px-1 whitespace-nowrap">
                  {z.label}
                </th>
                {rows.map((r) => {
                  const raw = r.zones?.[z.key];
                  const v = raw ?? 0;
                  const style = shedCellStyle(v, max);
                  // A null cell is "not reported", not "nothing shed" — say so
                  // rather than let the green read as a measured zero.
                  const tip = {
                    heading: `${z.label} · ${r.date}`,
                    value: raw == null ? 'Not reported' : raw > 0 ? `${fmt(raw)} MW shed` : 'No load shedding',
                    meta: raw == null ? 'No zone breakdown in this report' : `${peakLabel}${raw > 0 && r.time ? ` · ${r.time}` : ''}`,
                    // Null is a gap in PGCB's reporting, so it is neither published
                    // nor derived — leave it untagged rather than assert either.
                    ...(raw == null ? {} : { kind: 'P' as const }),
                    ...(raw == null ? {} : { tone: (raw > 0 ? 'alert' : 'good') as 'alert' | 'good' }),
                  };
                  return (
                    <td
                      key={r.date}
                      className="h-6 text-center rounded-[3px] tabular-nums font-semibold cursor-default transition-[filter] duration-100 hover:brightness-95 dark:hover:brightness-125"
                      style={style}
                      onMouseEnter={(e) => show(e, tip)}
                      onMouseMove={(e) => show(e, tip)}
                      onMouseLeave={hide}
                    >
                      {/* Every non-zero cell is labelled, so "shed" vs "none" never
                          depends on telling green from red. */}
                      {v > 0 ? Math.round(v) : ''}
                    </td>
                  );
                })}
                <td
                  className="px-2 text-right font-bold tabular-nums text-foreground whitespace-nowrap cursor-default"
                  onMouseEnter={(e) =>
                    show(e, {
                      heading: `${z.label} · month total`,
                      value: `${fmt(z.total)} MW shed`,
                      meta: `Summed across every ${peakLabel.toLowerCase()} this month`,
                      kind: 'D' as const,
                      tone: z.total > 0 ? 'alert' : 'good',
                    })
                  }
                  onMouseLeave={hide}
                >
                  {fmt(z.total)}
                </td>
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 z-10 bg-card text-left font-bold text-foreground px-1">
                <span className="inline-flex items-center gap-1">All zones<GridProvenanceTag kind="P" /></span>
              </th>
              {rows.map((r) => (
                <td
                  key={r.date}
                  className="text-center font-bold tabular-nums text-foreground cursor-default"
                  onMouseEnter={(e) =>
                    show(e, {
                      heading: `All zones · ${r.date}`,
                      value: r.load_shed_mw ? `${fmt(r.load_shed_mw)} MW shed` : 'No load shedding',
                      kind: 'P' as const,
                      meta:
                        r.generation_mw && r.demand_mw
                          ? `${fmt(r.generation_mw)} MW generated of ${fmt(r.demand_mw)} MW demanded`
                          : peakLabel,
                      tone: r.load_shed_mw ? 'alert' : 'good',
                    })
                  }
                  onMouseLeave={hide}
                >
                  {r.load_shed_mw ? Math.round(r.load_shed_mw) : ''}
                </td>
              ))}
              <td className="px-2 text-right font-bold tabular-nums text-foreground">
                <span className="inline-flex items-center gap-1 justify-end">{fmt(monthTotal)}<GridProvenanceTag kind="D" /></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-6 h-3 rounded-[3px]"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.18)' }}
            />
            <span className="font-semibold">No shedding</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-semibold">Less</span>
            {[0.15, 0.36, 0.57, 0.78, 1].map((a) => (
              <span
                key={a}
                className="inline-block w-6 h-3 rounded-[3px]"
                style={{ backgroundColor: `rgba(190, 18, 60, ${a})` }}
              />
            ))}
            <span className="font-semibold">More</span>
          </span>
          <span>· worst single cell {fmt(max)} MW</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Worst zone this month:{' '}
          <span className="font-bold text-foreground">
            {zoneTotals.slice().sort((a, b) => b.total - a.total)[0]?.label}
          </span>
        </div>
      </div>

      <Explainer>
        <strong className="text-foreground">How to read this.</strong>{' '}Each cell is one zone on one day, and the
        number is the megawatts of demand that had to be cut in that zone at that day&rsquo;s peak — so a blank green
        cell means everyone who wanted power got it. <strong className="text-foreground">Evening peak</strong>{' '}is the
        daily maximum, usually around 7&ndash;9 pm; <strong className="text-foreground">day peak</strong>{' '}is the
        midday maximum. The <em>Total</em>{' '}column is the sum of that zone&rsquo;s daily cuts across the month, which
        is why it can exceed any single day by a wide margin — it measures how <em>persistently</em>{' '}a zone was cut,
        not how deep the worst cut was.
      </Explainer>

      {/*
        The two totals on this grid come from different places and can legitimately
        disagree, which is worth saying rather than leaving a reader to assume the
        row is the column summed.
      */}
      <p className="text-[10px] text-muted-foreground leading-relaxed inline-flex items-start gap-1.5 flex-wrap">
        <GridProvenanceTag kind="P" />
        <span>
          Every zone cell, and the <strong className="text-foreground">All zones</strong> row,
          is PGCB&apos;s own published figure — that row is the system-wide load shed
          the report states for each day, not the zone cells added up.
        </span>
        <GridProvenanceTag kind="D" />
        <span>
          The <strong className="text-foreground">Total</strong> column and the figure in the
          bottom corner are ours, summed across the month. Because the row and the
          column are measured separately, they need not agree: a month where PGCB
          reports system-wide shedding but no zone breakdown will show a populated
          row above empty cells.
        </span>
      </p>

      <ChartTooltip tip={tip} />
    </div>
  );
}

/* --------------------------------------------- 3. generation by owner */

function GenerationByOwner({ keyed }: { keyed: Record<string, PgcbSystemStat> }) {
  const { tip, show, hide } = useChartTooltip();
  const owners = [
    { label: 'Generation Cos.', stat: keyed.net_generation_gencos_mkwh },
    { label: 'IPP', stat: keyed.net_generation_ipp_mkwh },
    { label: 'BPDB', stat: keyed.net_generation_bpdb_mkwh },
    { label: 'Rental', stat: keyed.net_generation_rental_mkwh },
    { label: 'REB', stat: keyed.net_generation_reb_mkwh },
  ].filter((o) => o.stat) as Array<{ label: string; stat: PgcbSystemStat }>;

  if (!owners.length) return null;
  const total = owners.reduce((s, o) => s + o.stat.value, 0);
  const max = Math.max(...owners.map((o) => o.stat.value));
  const stationUse = keyed.station_use_bpdb_mkwh;

  return (
    <div className="space-y-1">
      {owners.map((o) => (
        <div
          key={o.label}
          onMouseEnter={(e) =>
            show(e, {
              heading: o.label,
              value: `${fmt(o.stat.value, 1)} MKWh`,
              kind: 'P' as const,
              meta: `${((o.stat.value / total) * 100).toFixed(1)}% of net generation${
                o.stat.prev_month ? ` · ${fmt(o.stat.prev_month, 1)} last month` : ''
              }`,
            })
          }
          onMouseLeave={hide}
        >
          <MagnitudeBar
            label={o.label}
            value={o.stat.value}
            max={max}
            unit="MKWh"
            sub={
              <>
                {`${((o.stat.value / total) * 100).toFixed(1)}%`}
                <GridProvenanceTag kind="D" className="ml-1" />
              </>
            }
          />
        </div>
      ))}
      <ChartTooltip tip={tip} />
      <Glossary
        items={[
          [
            'MKWh',
            `million kilowatt-hours — the energy actually produced over the month, not capacity. ${fmt(total, 1)} MKWh in total here.`,
          ],
          ['Net generation', 'output after the plant’s own consumption is subtracted, i.e. what reached the grid.'],
          ['Generation Cos.', 'state-owned generators such as NWPGCL, APSCL and EGCB.'],
          ['IPP', 'Independent Power Producers — privately owned plants selling to the grid under contract.'],
          ['BPDB', 'the Bangladesh Power Development Board’s own plants.'],
          ['REB / Rental', 'Rural Electrification Board plants, and short-term contracted rental capacity.'],
        ]}
      />
      <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
        {stationUse && `BPDB station use of ${fmt(stationUse.value, 1)} MKWh is already deducted. `}
        Electricity imported from India is reported separately and is not counted in these shares.
      </p>
      <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed inline-flex items-start gap-1.5 flex-wrap">
        <GridProvenanceTag kind="P" />
        <span>
          Each owner&apos;s MKWh is PGCB&apos;s own published figure.
        </span>
        <GridProvenanceTag kind="D" />
        <span>
          The percentage shares and the {fmt(total, 1)} MKWh they are taken against are
          ours — PGCB lists the owners separately and prints no combined line.
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------- 4. grid-circle reliability */

function CircleTable({
  rows,
  total,
  unit,
  digits,
  prevLabel,
}: {
  rows: PgcbCircleRow[];
  total: PgcbCircleRow | Record<string, never> | undefined;
  unit: string;
  digits: number;
  prevLabel: string;
}) {
  const totalRow = total && 'current' in total ? (total as PgcbCircleRow) : null;
  return (
    <TableShell
      head={
        <>
          <Th>Grid circle</Th>
          <Th align="right" kind="P">Tripping</Th>
          <Th align="right" kind="P">Emergency</Th>
          <Th align="right" kind="P">Scheduled</Th>
          <Th align="right" kind="P">Total ({unit})</Th>
          <Th align="right">{prevLabel}</Th>
          <Th align="right" kind="D">Change</Th>
        </>
      }
    >
      {rows.map((r) => (
        <tr key={r.circle} className="hover:bg-muted/20">
          <Td className="font-semibold">{r.circle}</Td>
          <Td align="right">{fmt(r.current.tripping, digits)}</Td>
          <Td align="right">{fmt(r.current.emergency, digits)}</Td>
          <Td align="right">{fmt(r.current.scheduled, digits)}</Td>
          <Td align="right" className="font-bold">
            {fmt(r.current.total, digits)}
          </Td>
          <Td align="right" className="text-muted-foreground">
            {fmt(r.previous.total, digits)}
          </Td>
          <Td align="right">
            <DeltaBadge change={pctChange(r.current.total, r.previous.total)} goodWhen="down" suffix="" />
          </Td>
        </tr>
      ))}
      {totalRow && (
        <tr className="bg-muted/25 font-bold">
          <Td className="font-bold">Total</Td>
          <Td align="right">{fmt(totalRow.current.tripping, digits)}</Td>
          <Td align="right">{fmt(totalRow.current.emergency, digits)}</Td>
          <Td align="right">{fmt(totalRow.current.scheduled, digits)}</Td>
          <Td align="right">{fmt(totalRow.current.total, digits)}</Td>
          <Td align="right" className="text-muted-foreground">
            {fmt(totalRow.previous.total, digits)}
          </Td>
          <Td align="right">
            <DeltaBadge change={pctChange(totalRow.current.total, totalRow.previous.total)} goodWhen="down" suffix="" />
          </Td>
        </tr>
      )}
    </TableShell>
  );
}

/* ------------------------------------------- 5. coincident vs own max */

function AreaPeakComparison({
  atSystemPeak,
  ownMax,
}: {
  atSystemPeak: Array<{ key: string; area: string; load_mw: number }>;
  ownMax: Array<{ key: string; area: string; load_mw: number; date?: string | null; hour?: string | null }>;
}) {
  const { tip, show, hide } = useChartTooltip();
  const byKey = new Map(ownMax.map((a) => [canonicalArea(a.key), a]));
  const rows = atSystemPeak
    .map((a) => {
      const own = byKey.get(canonicalArea(a.key));
      const ownMw = own?.load_mw ?? null;
      return {
        area: a.area,
        coincident: a.load_mw,
        own: ownMw,
        // Own maximum is by definition >= coincident, so the difference is the
        // area's diversity: load it carried at some other hour entirely.
        gap: ownMw === null ? null : Math.max(0, ownMw - a.load_mw),
        when: own ? [own.date, own.hour].filter(Boolean).join(' ') : null,
      };
    })
    .sort((x, y) => (y.own ?? y.coincident) - (x.own ?? x.coincident));

  const scaleMax = Math.max(...rows.map((r) => r.own ?? r.coincident), 1);
  const totalCoincident = rows.reduce((s, r) => s + r.coincident, 0);
  const totalOwn = rows.reduce((s, r) => s + (r.own ?? r.coincident), 0);
  const totalGap = totalOwn - totalCoincident;
  const widest = rows.reduce((best, r) => ((r.gap ?? 0) > (best.gap ?? 0) ? r : best), rows[0]);

  return (
    <div className="space-y-5">
      {/* The headline the panel exists to make: the parts sum to more than the whole. */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/50 bg-muted/15 p-4 text-center shadow-sm">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Sum at system peak<GridProvenanceTag kind="D" className="ml-1" />
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground mt-0.5">{fmt(totalCoincident)}</div>
          <div className="text-[10px] text-muted-foreground">MW, all at once</div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-muted/15 p-4 text-center shadow-sm">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Sum of area peaks<GridProvenanceTag kind="D" className="ml-1" />
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground mt-0.5">{fmt(totalOwn)}</div>
          <div className="text-[10px] text-muted-foreground">MW, each at its own hour</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-center shadow-sm">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Diversity<GridProvenanceTag kind="D" className="ml-1" />
          </div>
          <div className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-500 mt-0.5">
            {fmt(totalGap)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            MW never needed together ({((totalGap / totalCoincident) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-semibold flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: SERIES_A }} />
          Drawn at the national peak
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: SERIES_B }} />
          Extra at the area&rsquo;s own peak
        </span>
        <span className="text-muted-foreground font-medium">· bar length = the area&rsquo;s own maximum</span>
      </div>

      <div className="space-y-3">
        {rows.map((r) => {
          const own = r.own ?? r.coincident;
          const gapPct = r.coincident > 0 && r.gap !== null ? (r.gap / r.coincident) * 100 : null;
          return (
            <div
              key={r.area}
              className="group"
              onMouseEnter={(e) =>
                show(e, {
                  heading: r.area,
                  value: `${fmt(own)} MW own peak`,
                  kind: 'P' as const,
                  meta: `${fmt(r.coincident)} MW at the national peak · ${fmt(r.gap)} MW more at its own${
                    r.when ? ` (${r.when})` : ''
                  } · gap is ours (D)`,
                })
              }
              onMouseMove={(e) =>
                show(e, {
                  heading: r.area,
                  value: `${fmt(own)} MW own peak`,
                  kind: 'P' as const,
                  meta: `${fmt(r.coincident)} MW at the national peak · ${fmt(r.gap)} MW more at its own${
                    r.when ? ` (${r.when})` : ''
                  } · gap is ours (D)`,
                })
              }
              onMouseLeave={hide}
            >
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-[11px] font-bold text-foreground">{r.area}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  <span className="font-bold text-foreground">{fmt(own)}</span> MW peak
                  {gapPct !== null && (
                    <>
                      <span className="mx-1.5 opacity-40">|</span>
                      <span className="font-semibold" style={{ color: SERIES_B }}>
                        +{fmt(r.gap)} MW
                      </span>{' '}
                      ({gapPct.toFixed(1)}%) beyond its share of the national peak
                    </>
                  )}
                </span>
              </div>
              {/* One bar per area: the segments sum to the area's own maximum, so the
                  second segment IS the diversity gap rather than something to infer
                  by comparing two separate bars. 2px surface gap between fills. */}
              <div className="relative h-3.5 rounded-full bg-muted/25 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 flex gap-[2px] transition-[filter] duration-100 group-hover:brightness-105"
                  style={{ width: `${(own / scaleMax) * 100}%` }}
                >
                  <div
                    className="h-full rounded-l-full"
                    style={{
                      width: `${own > 0 ? (r.coincident / own) * 100 : 0}%`,
                      backgroundColor: SERIES_A,
                    }}
                  />
                  <div
                    className="h-full rounded-r-full flex-1"
                    style={{ backgroundColor: SERIES_B }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Explainer>
        <strong className="text-foreground">Why the parts exceed the whole.</strong>{' '}The blue segment is what an area
        was drawing at the single instant the national peak occurred. The orange segment is the extra it reached at
        some other hour, on its own busiest day — so the two segments together are that area&rsquo;s own maximum.
        Because areas do not all peak at the same moment, adding up their individual maxima
        ({fmt(totalOwn)} MW) overstates what the grid must supply at once ({fmt(totalCoincident)} MW). That{' '}
        {fmt(totalGap)} MW difference is <strong className="text-foreground">diversity</strong>, and it is real
        capacity the country never has to build.{' '}
        {widest?.gap ? (
          <>
            <strong className="text-foreground">{widest.area}</strong>{' '}is the most out of step this month, peaking{' '}
            {fmt(widest.gap)} MW above its national-peak draw.
          </>
        ) : null}
      </Explainer>

      {/*
        This panel is the clearest case on the tab of P and D sitting side by
        side: PGCB publishes both peak readings per area, and every number the
        panel is actually about — the two sums, their difference, the share —
        exists only because we subtract one from the other.
      */}
      <p className="text-[10px] text-muted-foreground leading-relaxed inline-flex items-start gap-1.5 flex-wrap">
        <GridProvenanceTag kind="P" />
        <span>
          Both readings per area — what it drew at the national peak, and its own
          maximum with the date and hour it happened — are PGCB&apos;s published figures.
        </span>
        <GridProvenanceTag kind="D" />
        <span>
          The two totals, the diversity between them and its percentage are ours. PGCB
          prints no combined figure for either column, and none for the gap; the whole
          comparison is arithmetic on their numbers.
        </span>
      </p>

      <ChartTooltip tip={tip} />
    </div>
  );
}

/* --------------------------------------------------- 6. searchable tables */

const PAGE = 25;

function useFiltered<T>(rows: T[], query: string, match: (row: T, q: string) => boolean) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => match(r, q));
  }, [rows, query, match]);
}

function MoreButton({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null;
  return (
    <button
      type="button"
      onClick={onMore}
      className="mt-3 w-full grid-explorer-control bg-transparent hover:bg-muted/10 hover:border-primary/30 px-3 py-2 text-xs font-bold text-foreground"
    >
      Show {Math.min(PAGE, total - shown)} more · {shown} of {total}
    </button>
  );
}

/* ------------------------------------------------------ 7. outage events */

function OutageEventsPanel({
  events,
  loading,
  expected,
  onLoad,
  opened,
}: {
  events: PgcbOutageEvent[];
  loading: boolean;
  expected: number;
  onLoad: () => void;
  opened: boolean;
}) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const filtered = useFiltered(events, query, (e, q) =>
    [e.substation, e.equipment, e.cause, e.circle].some((v) => v?.toLowerCase().includes(q)),
  );

  if (!opened) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/20">
          <AlertTriangle className="h-6 w-6 shrink-0 text-muted-foreground" />
        </span>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          {fmt(expected)} individual outage events recorded this month — substation and transmission line, emergency
          and scheduled. Loaded separately because the log is larger than the rest of the month combined.
        </p>
        <button
          type="button"
          onClick={onLoad}
          className="grid-explorer-control bg-transparent hover:bg-muted/10 hover:border-primary/30 px-4 py-2 text-xs font-bold text-foreground"
        >
          Load {fmt(expected)} outage events
        </button>
      </div>
    );
  }

  if (loading) return <div className="grid-explorer-skeleton h-64 rounded-xl" />;

  return (
    <div className="space-y-3">
      <SearchBox value={query} onChange={setQuery} placeholder="Search substation, cause…" />
      <TableShell
        head={
          <>
            <Th>Substation</Th>
            <Th>Equipment</Th>
            <Th>Start</Th>
            <Th align="right" kind="P">Duration</Th>
            <Th>Cause</Th>
            <Th align="right" kind="P">Unserved (MWh)</Th>
          </>
        }
      >
        {filtered.slice(0, limit).map((e, i) => (
          <tr key={`${e.substation}-${e.start}-${i}`} className="hover:bg-muted/20">
            <Td className="font-semibold whitespace-nowrap">{e.substation}</Td>
            <Td className="text-muted-foreground">{e.equipment ?? '—'}</Td>
            <Td className="whitespace-nowrap text-muted-foreground">{e.start}</Td>
            <Td align="right">{e.duration ?? '—'}</Td>
            <Td className="max-w-[18rem] truncate">{e.cause ?? '—'}</Td>
            <Td align="right">{fmt(e.unserved_energy_mwh, 1)}</Td>
          </tr>
        ))}
      </TableShell>
      <MoreButton shown={Math.min(limit, filtered.length)} total={filtered.length} onMore={() => setLimit((l) => l + PAGE)} />
      <Glossary
        items={[
          [
            'Equipment',
            'the specific asset that went out — a transformer, breaker or line bay — not the whole substation.',
          ],
          ['Duration', 'how long it stayed out, as hours:minutes:seconds.'],
          [
            'Cause',
            'as recorded by the operator on the day. Wording is theirs and is not standardised between circles.',
          ],
          [
            'Unserved (MWh)',
            'energy not delivered because of that one event. Several rows can share a cause when one fault takes out multiple units at once.',
          ],
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------- main panel */

export function PgcbMonthlyDetail({
  detail,
  monthLabel,
  prevMonthLabel,
  events,
  eventsLoading,
  eventsOpened,
  onLoadEvents,
}: {
  detail: PgcbMonthlyDetail;
  monthLabel: string;
  prevMonthLabel: string;
  events: PgcbOutageEvent[];
  eventsLoading: boolean;
  eventsOpened: boolean;
  onLoadEvents: () => void;
}) {
  const [shedPeak, setShedPeak] = useState<'evening_peak' | 'day_peak'>('evening_peak');
  const [circleMetric, setCircleMetric] = useState<'unserved' | 'tripping'>('unserved');
  const [assetView, setAssetView] = useState<'load' | 'voltage' | 'transformer' | 'interruption'>('load');
  const [assetQuery, setAssetQuery] = useState('');

  const keyed = detail.system?.keyed ?? {};
  const shedRows = detail.daily_load_shedding?.[shedPeak] ?? [];

  // Memoised so the `?? []` fallback doesn't mint a new array each render and
  // invalidate the sort below.
  const substations = useMemo(() => detail.substation_max_load ?? [], [detail.substation_max_load]);
  const voltages = useMemo(() => detail.substation_voltage ?? [], [detail.substation_voltage]);
  const transformers = useMemo(
    () => (detail.transformer_loading ?? []).slice().sort((a, b) => b.loading_pct - a.loading_pct),
    [detail.transformer_loading],
  );
  const interruptions = useMemo(
    () => (detail.interruptions ?? []).slice().sort((a, b) => (b.unserved_mwh ?? 0) - (a.unserved_mwh ?? 0)),
    [detail.interruptions],
  );

  // Substations the report lists without a load sort last rather than as zero.
  const sortedSubstations = useMemo(
    () => substations.slice().sort((a, b) => (b.load_mw ?? -1) - (a.load_mw ?? -1)),
    [substations],
  );

  const filteredLoad = useFiltered(sortedSubstations, assetQuery, (r, q) => r.substation.toLowerCase().includes(q));
  const filteredVolt = useFiltered(voltages, assetQuery, (r, q) => r.substation.toLowerCase().includes(q));
  const filteredTx = useFiltered(transformers, assetQuery, (r, q) =>
    [r.substation, r.transformer].some((v) => v?.toLowerCase().includes(q)),
  );
  const filteredInt = useFiltered(interruptions, assetQuery, (r, q) => r.substation.toLowerCase().includes(q));

  // Four reference tables, the longest in the explorer. Paged rather than
  // grown by a "load more": someone hunting a named substation should be able
  // to step through pages, not scroll past 278 rows to reach the last one.
  const loadPager = useTablePager(filteredLoad, 25);
  const voltPager = useTablePager(filteredVolt, 25);
  const txPager = useTablePager(filteredTx, 25);
  const intPager = useTablePager(filteredInt, 25);

  const fgmo = detail.fgmo ?? [];
  const fgmoActive = fgmo.filter((p) => p.days_active > 0);
  const fgmoCapacity = fgmoActive.reduce((s, p) => s + (p.capacity_mw ?? 0), 0);

  const assetTabs = [
    { id: 'load' as const, label: 'Peak load', count: substations.length },
    { id: 'voltage' as const, label: 'Voltage', count: voltages.length },
    { id: 'transformer' as const, label: 'Transformers', count: transformers.length },
    { id: 'interruption' as const, label: 'Interruptions', count: interruptions.length },
  ].filter((t) => t.count > 0);

  const switchAsset = (id: typeof assetView) => {
    setAssetView(id);
    // Each table owns its own page now, so switching views no longer has to
    // reset a shared row limit.
  };

  const pill = (active: boolean) =>
    cn(
      'px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors duration-150',
      active
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'bg-transparent border-border/40 text-muted-foreground hover:bg-muted/10',
    );

  const stale = detail.data_quality?.stale_current_month_figures ?? [];
  const STALE_LABELS: Record<string, string> = {
    max_evening_peak_gen_mw: 'Maximum evening peak generation',
    max_evening_peak_demand_mw: 'Maximum evening peak demand',
    max_generation_mw: 'Maximum generation',
    max_load_shed_evening_mw: 'Maximum load shed at evening peak',
  };

  return (
    <div className="space-y-6">
      {/* Source-integrity notice. Shown before the figures it concerns, because a
          reader should know before reading them, not after. */}
      {stale.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden="true" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-foreground">Source data note for {monthLabel}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                PGCB&rsquo;s report prints{' '}
                {stale.length === 1 ? 'a figure' : `${stale.length} figures`}{' '}
                in the &ldquo;Current Month&rdquo; column carrying a date from an earlier month — the previous month&rsquo;s number appears to have been
                left in the cell. The published value is shown unchanged below, but it should not be read as{' '}
                {monthLabel}&rsquo;s own maximum.
              </p>
              <ul className="mt-2 space-y-0.5">
                {stale.map((s) => (
                  <li key={s.key} className="text-[11px] text-foreground">
                    <span className="font-bold">{STALE_LABELS[s.key] ?? s.key}</span>{' '}
                    <span className="tabular-nums">{fmt(s.value, 2)}</span>{' '}
                    <span className="text-muted-foreground">— dated {s.printed_date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 1 — reliability headline */}
      {detail.system && (
        <PanelCard
          icon={Gauge}
          title="Load Shedding & Reliability"
          badge="Monthly"
          subtitle={`How often supply fell short in ${monthLabel}, against ${prevMonthLabel}`}
        >
          <ReliabilityStrip keyed={keyed} prevLabel={`vs ${prevMonthLabel}`} />
          <Glossary
            items={[
              [
                'Load shedding',
                'deliberately cutting supply to part of the country because generation cannot meet demand. It is rationing, not a fault.',
              ],
              [
                'Days with load shed',
                `how many days that month needed a cut at the evening peak. ${
                  keyed.days_load_shed_evening ? fmt(keyed.days_load_shed_evening.value) : '—'
                } means it happened on that many separate days.`,
              ],
              [
                'Max / min load shed',
                'the largest and smallest cut made at any evening peak in the month — the worst and best evening.',
              ],
              [
                'Load factor',
                'average demand as a percentage of peak demand. High means demand stayed near its peak all month; low means a short spike over a quiet baseline.',
              ],
            ]}
          />
        </PanelCard>
      )}

      {/* 2 — daily heatmap */}
      {shedRows.length > 0 && (
        <PanelCard
          icon={CalendarDays}
          title="Daily Load Shedding by Zone"
          badge="Monthly"
          subtitle={`Megawatts shed each day at ${shedPeak === 'evening_peak' ? 'evening' : 'day'} peak, ${monthLabel}`}
          actions={
            <div className="flex gap-2">
              <button type="button" className={pill(shedPeak === 'evening_peak')} onClick={() => setShedPeak('evening_peak')}>
                Evening peak
              </button>
              <button type="button" className={pill(shedPeak === 'day_peak')} onClick={() => setShedPeak('day_peak')}>
                Day peak
              </button>
            </div>
          }
        >
          <LoadShedHeatmap rows={shedRows} peakLabel={shedPeak === 'evening_peak' ? 'Evening peak' : 'Day peak'} />
        </PanelCard>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 3 — who generated it */}
        {detail.system && (
          <PanelCard icon={Building2} title="Generation by Owner" badge="Monthly" subtitle={`Net generation share, ${monthLabel}`}>
            <GenerationByOwner keyed={keyed} />
          </PanelCard>
        )}

        {/* 5 — coincident vs own max */}
        {detail.area_supply_at_system_peak?.areas?.length && detail.area_max_load?.length ? (
          <PanelCard
            icon={TrendingUp}
            title="Area Peak Load: Coincident vs Own Maximum"
            badge="Monthly"
            subtitle="Two different peaks, often confused for each other"
          >
            <AreaPeakComparison
              atSystemPeak={detail.area_supply_at_system_peak.areas}
              ownMax={detail.area_max_load}
            />
          </PanelCard>
        ) : null}
      </div>

      {/* 4 — grid circle reliability */}
      {(detail.unserved_energy || detail.tripping_outage) && (
        <PanelCard
          icon={Network}
          title="Grid Circle Reliability"
          badge="Monthly"
          subtitle={
            circleMetric === 'unserved'
              ? 'Energy that could not be delivered, by circle and cause'
              : 'Count of tripping and outage incidents, by circle and cause'
          }
          actions={
            <div className="flex gap-2">
              <button type="button" className={pill(circleMetric === 'unserved')} onClick={() => setCircleMetric('unserved')}>
                Unserved energy
              </button>
              <button type="button" className={pill(circleMetric === 'tripping')} onClick={() => setCircleMetric('tripping')}>
                Tripping & outage
              </button>
            </div>
          }
        >
          {circleMetric === 'unserved' && detail.unserved_energy ? (
            <CircleTable
              rows={detail.unserved_energy.circles}
              total={detail.unserved_energy.total}
              unit="MWh"
              digits={1}
              prevLabel={prevMonthLabel}
            />
          ) : detail.tripping_outage ? (
            <CircleTable
              rows={detail.tripping_outage.circles}
              total={detail.tripping_outage.total}
              unit="count"
              digits={0}
              prevLabel={prevMonthLabel}
            />
          ) : null}
          <Glossary
            items={[
              [
                'Grid circle',
                'PGCB’s maintenance regions for the transmission network. They do not line up exactly with the supply zones above.',
              ],
              [
                'Unserved energy',
                'electricity that could not be delivered, in megawatt-hours. Unlike load shedding this is caused by faults and maintenance, not by a supply shortfall.',
              ],
              ['Tripping', 'equipment disconnecting itself automatically in response to a fault — unplanned.'],
              ['Emergency', 'an unplanned outage taken deliberately, e.g. to make an urgent repair.'],
              [
                'Scheduled',
                'planned maintenance work. High scheduled numbers are usually a sign of upkeep, not of failure.',
              ],
            ]}
          />
        </PanelCard>
      )}

      {/* 6 — asset-level tables */}
      {assetTabs.length > 0 && (
        <PanelCard
          icon={Zap}
          title="Substation & Asset Detail"
          badge="Monthly"
          subtitle={`Per-asset records published for ${monthLabel}`}
          actions={<SearchBox value={assetQuery} onChange={setAssetQuery} placeholder="Search substation…" />}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {assetTabs.map((t) => (
              <button key={t.id} type="button" className={pill(assetView === t.id)} onClick={() => switchAsset(t.id)}>
                {t.label} <span className="opacity-60">({t.count})</span>
              </button>
            ))}
          </div>

          {assetView === 'load' && (
            <>
              <TableShell
                head={
                  <>
                    <Th>Substation</Th>
                    <Th align="right" kind="P">Peak load (MW)</Th>
                    <Th>Recorded at</Th>
                  </>
                }
              >
                {loadPager.rows.map((r) => (
                  <tr key={r.substation} className="hover:bg-muted/20">
                    <Td className="font-semibold">{r.substation}</Td>
                    <Td align="right" className="font-bold">
                      {fmt(r.load_mw, 1)}
                    </Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{r.when ?? '—'}</Td>
                  </tr>
                ))}
              </TableShell>
              <GridTablePager
                page={loadPager.page}
                totalPages={loadPager.totalPages}
                pageSize={loadPager.pageSize}
                total={loadPager.total}
                from={loadPager.from}
                to={loadPager.to}
                onPage={loadPager.setPage}
                onPageSize={loadPager.setPageSize}
                noun="substations"
              />
            </>
          )}

          {assetView === 'voltage' && (
            <>
              <TableShell
                head={
                  <>
                    <Th>Substation</Th>
                    <Th>Class</Th>
                    <Th align="right" kind="P">Rated</Th>
                    <Th align="right" kind="P">Max</Th>
                    <Th align="right" kind="P">Min</Th>
                    <Th align="right" kind="D">Min vs rated</Th>
                  </>
                }
              >
                {voltPager.rows.map((r, i) => {
                  const dev = r.rated_kv && r.min_kv ? ((r.min_kv - r.rated_kv) / r.rated_kv) * 100 : null;
                  const severe = dev !== null && dev <= -10;
                  return (
                    <tr key={`${r.substation}-${i}`} className="hover:bg-muted/20">
                      <Td className="font-semibold">{r.substation}</Td>
                      <Td className="text-muted-foreground">{r.class ?? '—'}</Td>
                      <Td align="right">{fmt(r.rated_kv)}</Td>
                      <Td align="right">{fmt(r.max_kv)}</Td>
                      <Td align="right">{fmt(r.min_kv)}</Td>
                      <Td align="right">
                        {dev === null ? (
                          '—'
                        ) : (
                          <span
                            className={cn(
                              'font-bold',
                              severe ? 'text-rose-600 dark:text-rose-500' : 'text-muted-foreground',
                            )}
                          >
                            {severe && <span aria-hidden="true">⚠ </span>}
                            {dev.toFixed(1)}%
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </TableShell>
              <p className="mt-2 text-[10px] text-muted-foreground">
                ⚠ marks a minimum more than 10% below rated voltage.
              </p>
              <GridTablePager
                page={voltPager.page}
                totalPages={voltPager.totalPages}
                pageSize={voltPager.pageSize}
                total={voltPager.total}
                from={voltPager.from}
                to={voltPager.to}
                onPage={voltPager.setPage}
                onPageSize={voltPager.setPageSize}
                noun="readings"
              />
            </>
          )}

          {assetView === 'transformer' && (
            <>
              <TableShell
                head={
                  <>
                    <Th>Substation</Th>
                    <Th>Transformer</Th>
                    <Th align="right" kind="P">Capacity (MVA)</Th>
                    <Th align="right" kind="P">Peak MW</Th>
                    <Th align="right" kind="D">Loading</Th>
                  </>
                }
              >
                {txPager.rows.map((r, i) => (
                  <tr key={`${r.substation}-${r.transformer}-${i}`} className="hover:bg-muted/20">
                    <Td className="font-semibold">{r.substation}</Td>
                    <Td className="text-muted-foreground">{r.transformer ?? '—'}</Td>
                    <Td align="right">{fmt(r.capacity_mva)}</Td>
                    <Td align="right">{fmt(r.mw)}</Td>
                    <Td align="right">
                      <span
                        className={cn(
                          'font-bold',
                          r.loading_pct >= 80 ? 'text-rose-600 dark:text-rose-500' : 'text-foreground',
                        )}
                      >
                        {r.loading_pct >= 80 && <span aria-hidden="true">⚠ </span>}
                        {r.loading_pct.toFixed(1)}%
                      </span>
                    </Td>
                  </tr>
                ))}
              </TableShell>
              <p className="mt-2 text-[10px] text-muted-foreground">⚠ marks transformers loaded at 80% or above.</p>
              <GridTablePager
                page={txPager.page}
                totalPages={txPager.totalPages}
                pageSize={txPager.pageSize}
                total={txPager.total}
                from={txPager.from}
                to={txPager.to}
                onPage={txPager.setPage}
                onPageSize={txPager.setPageSize}
                noun="transformers"
              />
            </>
          )}

          {assetView === 'interruption' && (
            <>
              <TableShell
                head={
                  <>
                    <Th>Substation</Th>
                    <Th align="right" kind="P">Interruptions</Th>
                    <Th align="right" kind="P">Duration</Th>
                    <Th align="right" kind="P">Unserved (MWh)</Th>
                  </>
                }
              >
                {intPager.rows.map((r, i) => (
                  <tr key={`${r.substation}-${i}`} className="hover:bg-muted/20">
                    <Td className="font-semibold">{r.substation}</Td>
                    <Td align="right">{fmt(r.interruptions)}</Td>
                    <Td align="right" className="text-muted-foreground">
                      {r.duration ?? '—'}
                    </Td>
                    <Td align="right" className="font-bold">
                      {fmt(r.unserved_mwh, 1)}
                    </Td>
                  </tr>
                ))}
              </TableShell>
              <GridTablePager
                page={intPager.page}
                totalPages={intPager.totalPages}
                pageSize={intPager.pageSize}
                total={intPager.total}
                from={intPager.from}
                to={intPager.to}
                onPage={intPager.setPage}
                onPageSize={intPager.setPageSize}
                noun="interruptions"
              />
            </>
          )}

          <Glossary
            items={[
              [
                'Substation',
                'where transmission voltage is stepped down for distribution. Effectively the grid’s delivery point for a town or district.',
              ],
              [
                'Peak load',
                'the highest power that substation delivered at any moment in the month, with the timestamp it happened.',
              ],
              [
                'Rated voltage',
                'the level the substation is designed to run at. Grid voltage drifts with load, and a sustained drop damages equipment.',
              ],
              [
                'Min vs rated',
                'how far the lowest recorded voltage fell below rated. Beyond about −10% (flagged ⚠) is a serious under-voltage event.',
              ],
              [
                'Transformer loading',
                'peak throughput as a percentage of the transformer’s MVA rating. Above 80% (⚠) leaves little headroom for a fault elsewhere.',
              ],
              [
                'Interruptions',
                'how many times supply from that substation was cut, for how long in total, and the resulting unserved energy.',
              ],
            ]}
          />
        </PanelCard>
      )}

      {/* FGMO */}
      {fgmo.length > 0 && (
        <PanelCard
          icon={Activity}
          title="Free Governor Mode of Operation"
          badge="Monthly"
          subtitle="Plants able to respond automatically to frequency deviation — the grid's first line of defence"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatTile kind="D" label="Plants listed" value={fmt(fgmo.length)} />
            <StatTile kind="D" label="Active at least one day" value={fmt(fgmoActive.length)} />
            <StatTile kind="D" label="Capacity on FGMO" value={fmt(fgmoCapacity)} unit="MW" />
            <StatTile
              kind="D"
              label="Full-month participation"
              value={fmt(fgmo.filter((p) => p.days_active >= 28).length)}
              unit="plants"
            />
          </div>
          <TableShell
            head={
              <>
                <Th>Plant</Th>
                <Th>Owner</Th>
                <Th>Fuel</Th>
                <Th align="right" kind="P">Capacity (MW)</Th>
                <Th align="right" kind="P">Days on FGMO</Th>
              </>
            }
          >
            {fgmo
              .slice()
              .sort((a, b) => b.days_active - a.days_active)
              .map((p, i) => (
                <tr key={`${p.plant}-${i}`} className="hover:bg-muted/20">
                  <Td className="font-semibold">{p.plant}</Td>
                  <Td className="text-muted-foreground">{p.owner ?? '—'}</Td>
                  <Td className="text-muted-foreground">{p.fuel ?? '—'}</Td>
                  <Td align="right">{fmt(p.capacity_mw)}</Td>
                  <Td align="right" className="font-bold">
                    {p.days_active}
                  </Td>
                </tr>
              ))}
          </TableShell>
          <Explainer>
            <strong className="text-foreground">Why this matters.</strong>{' '}Grid frequency must hold near 50 Hz. When a
            large plant trips, frequency falls within seconds — far too fast for an operator to react. Plants running
            in <strong className="text-foreground">free governor mode</strong>{' '}sense the drop and raise output
            automatically, holding the system up until slower reserves arrive. A plant is listed here for every day it
            ran in that mode, so a low day count means the plant was available but not contributing that automatic
            response. The wider the participating capacity, the better the grid absorbs a sudden loss.
          </Explainer>
        </PanelCard>
      )}

      {/* Outage events */}
      {(detail.outage_event_count ?? 0) > 0 && (
        <PanelCard
          icon={AlertTriangle}
          title="Outage Event Log"
          badge="Monthly"
          subtitle={`Every recorded substation and transmission outage in ${monthLabel}`}
        >
          <OutageEventsPanel
            events={events}
            loading={eventsLoading}
            expected={detail.outage_event_count ?? 0}
            opened={eventsOpened}
            onLoad={onLoadEvents}
          />
        </PanelCard>
      )}
    </div>
  );
}

export default PgcbMonthlyDetail;
