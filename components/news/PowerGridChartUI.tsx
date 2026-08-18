'use client';

import React, { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { Legend, Tooltip, type LegendProps, type YAxisProps } from 'recharts';
import { cn, formatNumber } from '@/lib/utils';
import type { ChartTheme } from '@/hooks/useChartTheme';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';

/**
 * Width at or below which a card cannot afford a second value axis.
 *
 * Measured 2026-08-15 in a 393px viewport. Across the 21 cartesian charts on
 * the explorer the split is exact and has no exceptions in either direction:
 * every chart with one y-axis plots 72-77% of its card, every chart with two
 * plots 50-70%. The macro/budget sub-tab is the controlled case — six charts,
 * one 352px card, one 323px canvas — where single-axis charts plot 259-265px
 * and dual-axis ones 213px. The second axis costs 46-70px depending on how
 * wide its tick labels are, which is 14-21 points of plot ratio and more than
 * the margins have left to give.
 *
 * 420 rather than 393 so a card that is merely narrow — a phone in landscape,
 * a two-column tablet grid — splits before it gets to the point of being
 * unreadable. Above it nothing changes: the desktop chart is the same chart.
 */
export const GRID_DUAL_AXIS_MIN_WIDTH = 420;

/**
 * Observe a card's own width so a chart can change *structure*, not just size.
 *
 * A container query cannot do this job. `@container` styles a subtree, but a
 * dual-axis chart and a pair of stacked single-axis charts are different
 * element trees, and CSS cannot swap one for the other. Rendering both and
 * hiding one is worse than it looks: Recharts measures a `display:none`
 * container as zero and the hidden chart settles at the wrong size.
 *
 * Measuring here is not the trap the CSS layer warns about. That trap is a
 * container trying to *size itself* from its own `cqi`; this only reads a width
 * the layout has already resolved and picks a tree from it.
 */
export function useNarrowChartCard(threshold: number = GRID_DUAL_AXIS_MIN_WIDTH) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setIsNarrow(width <= threshold);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isNarrow] as const;
}

/** Y-axis slot widths — equal L/R keeps dual-axis plot areas visually centered */
export const GRID_Y_AXIS_WIDTH = {
  single: 54,
  dual: 56,
  wide: 62,
  /** Room for two-line ticks: value over unit */
  splitUnit: 48,
  splitUnitDual: 50,
} as const;

/** Standard margins — bottom room fits x-axis ticks; legends sit outside the plot */
export const GRID_CHART_MARGIN = {
  compact: { top: 12, right: 10, left: 4, bottom: 18 },
  legend: { top: 14, right: 6, left: 4, bottom: 18 },
  dualAxis: { top: 14, right: 6, left: 4, bottom: 18 },
  /* `top` was 44 — room for the legend to sit in. It does not sit there:
     Recharts places a top-aligned legend AFTER the top margin and then starts
     the plot below the legend, so the two were counted twice. Measured on a
     393px screen the chart box was 209px, of which 44 was blank, 36 the
     legend and only 81 the plot. The blank band between a card's subtitle and
     its legend was exactly this. 8 is breathing room above the legend; the
     legend still reserves its own height and the plot keeps the rest. */
  topLegend: { top: 8, right: 4, left: 4, bottom: 18 },
} as const;

/** Default margin for inline Grid Explorer charts (non-frame) */
export const GRID_EXPLORER_CHART_MARGIN = {
  default: { top: 12, right: 12, left: 4, bottom: 18 },
  /* `top` was 44 — room for the legend to sit in. It does not sit there:
     Recharts places a top-aligned legend AFTER the top margin and then starts
     the plot below the legend, so the two were counted twice. Measured on a
     393px screen the chart box was 209px, of which 44 was blank, 36 the
     legend and only 81 the plot. The blank band between a card's subtitle and
     its legend was exactly this. 8 is breathing room above the legend; the
     legend still reserves its own height and the plot keeps the rest. */
  topLegend: { top: 8, right: 4, left: 4, bottom: 18 },
  dualAxis: { top: 14, right: 8, left: 4, bottom: 18 },
} as const;

/**
 * Symmetric category padding so first and last marks breathe equally.
 *
 * 16 each side is generous on a 1400px plot and costs a seventh of a 214px
 * one: on a 393px screen the plotted data was 175px of a 326px box, and 40 of
 * the missing 151 was this. 8 still clears a half-width bar at either end.
 */
export const GRID_X_AXIS_PADDING = { left: 8, right: 8 } as const;

const X_TICK_STYLE = { fontSize: 10, dy: 4 } as const;
const Y_TICK_STYLE = { fontSize: 10, dx: -2 } as const;

type GridChartXAxisOptions = {
  dataKey?: string;
  tickFormatter?: (value: string) => string;
  interval?: 'preserveStartEnd' | number;
  minTickGap?: number;
};

type GridChartYAxisOptions = {
  yAxisId?: string;
  orientation?: 'left' | 'right';
  width?: number;
  tickFormatter?: (value: number) => string;
  splitUnit?: string;
  domain?: [number | string | ((n: number) => number), number | string | ((n: number) => number)];
  allowDecimals?: boolean;
};

export function gridChartXAxisProps(chartTheme: ChartTheme, options: GridChartXAxisOptions = {}) {
  return {
    dataKey: options.dataKey ?? 'year',
    tick: { ...gridChartAxisTick(chartTheme), ...X_TICK_STYLE },
    axisLine: false as const,
    tickLine: false as const,
    interval: options.interval ?? ('preserveStartEnd' as const),
    minTickGap: options.minTickGap ?? 14,
    padding: GRID_X_AXIS_PADDING,
    ...(options.tickFormatter ? { tickFormatter: options.tickFormatter } : {}),
  };
}

export function gridChartYAxisProps(
  chartTheme: ChartTheme,
  options: GridChartYAxisOptions = {},
): Partial<YAxisProps> {
  const splitUnit = options.splitUnit;
  const defaultWidth = splitUnit ? GRID_Y_AXIS_WIDTH.splitUnit : GRID_Y_AXIS_WIDTH.single;
  const tick: YAxisProps['tick'] = splitUnit
    ? gridChartSplitUnitTick(chartTheme, splitUnit)
    : { ...gridChartAxisTick(chartTheme), ...Y_TICK_STYLE };

  return {
    ...(options.yAxisId ? { yAxisId: options.yAxisId } : {}),
    ...(options.orientation ? { orientation: options.orientation } : {}),
    width: options.width ?? defaultWidth,
    tick,
    axisLine: false,
    tickLine: false,
    tickMargin: splitUnit ? 6 : 4,
    ...(options.tickFormatter && !splitUnit ? { tickFormatter: options.tickFormatter } : {}),
    ...(options.domain ? { domain: options.domain } : {}),
    ...(options.allowDecimals !== undefined ? { allowDecimals: options.allowDecimals } : {}),
  };
}

/** Explicit plot height — ResponsiveContainer needs a numeric fallback when % height collapses */
export const GRID_CHART_PLOT_HEIGHT = 344;

/** Numeric portion for split-line Y-axis ticks (unit rendered on second line). */
export function formatAxisValueOnly(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `${Math.round(value)}`;
}

export function formatAxisCrore(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k Cr`;
  return `${value} Cr`;
}

export function formatAxisMw(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k MW`;
  return `${value} MW`;
}

/**
 * The same figure without the unit repeated on every tick.
 *
 * "20.0k MW" is eight characters and wraps to two lines in a 54px axis, which
 * on a 360px card spends a fifth of the plot's width restating a unit the axis
 * could say once. Pair this with a `label` on the axis.
 *
 * The decimal appears only when it carries something: 20000 reads "20k" and
 * 2800 reads "2.8k". Rounding everything would overstate the shedding axis,
 * which tops out near 2.8k, by 7%; keeping a decimal everywhere would print
 * "5.0k" beside "10k" on the same axis.
 */
export function formatAxisMwCompact(value: number) {
  if (value < 1000) return `${value}`;
  const k = value / 1000;
  return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
}

export function formatAxisCkm(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k ckm`;
  return `${value} ckm`;
}

type SplitUnitTickProps = {
  x?: string | number;
  y?: string | number;
  payload?: { value?: number };
  unit: string;
  chartTheme: ChartTheme;
};

export function GridChartSplitUnitTick({ x = 0, y = 0, payload, unit, chartTheme }: SplitUnitTickProps) {
  const value = Number(payload?.value ?? 0);
  const num = formatAxisValueOnly(value);
  const tx = typeof x === 'number' ? x : Number(x);
  const ty = typeof y === 'number' ? y : Number(y);
  return (
    <g transform={`translate(${tx},${ty})`}>
      <text
        textAnchor="end"
        fill={chartTheme.axisTick}
        fontSize={10}
        fontWeight={500}
      >
        <tspan x={0} dy={-5}>{num}</tspan>
        <tspan x={0} dy={12} fontSize={9} fill={chartTheme.axisTick} opacity={0.82}>
          {unit}
        </tspan>
      </text>
    </g>
  );
}

export function gridChartSplitUnitTick(chartTheme: ChartTheme, unit: string): NonNullable<YAxisProps['tick']> {
  const Tick = (props: { x?: string | number; y?: string | number; payload?: { value?: number } }) => (
    <GridChartSplitUnitTick {...props} unit={unit} chartTheme={chartTheme} />
  );
  return Tick as NonNullable<YAxisProps['tick']>;
}

export function formatAxisMmcfd(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

export function formatAxisPercent(value: number) {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function formatAxisTk(value: number) {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)} Tk`;
}

/** PGCB monthly archive — January shows full year, July shows mid-year anchor */
export function formatPgcbMonthlyTick(dateKey: string): string {
  const [year, month] = dateKey.split('-');
  const shortYear = year.slice(2);
  if (month === '01') return `Jan ’${shortYear}`;
  if (month === '07') return `Jul ’${shortYear}`;
  return '';
}

export function formatChartTooltipValue(
  value: number | null | undefined,
  options: { unit?: string; decimals?: number } = {},
) {
  if (value == null || Number.isNaN(Number(value))) return 'N/A';
  const num = Number(value);
  const decimals =
    options.decimals ??
    (Math.abs(num) >= 1000 ? 0 : Math.abs(num) >= 100 ? 1 : 2);
  const formatted = formatNumber(num, decimals);
  return options.unit ? `${formatted} ${options.unit}` : formatted;
}

export const REGIONAL_ZONE_COLORS: Record<string, string> = {
  // Region divisions
  dhaka: '#f97316',       // orange
  chittagong: '#3b82f6',  // vivid blue
  khulna: '#06b6d4',      // cyan
  rajshahi: '#10b981',    // emerald
  barisal: '#eab308',     // amber
  sylhet: '#ef4444',      // red
  rangpur: '#ec4899',     // pink
  mymensingh: '#6366f1',  // indigo
  comilla: '#a855f7',     // purple
  
  // Division groups / fallbacks
  central: '#f97316',
  east: '#3b82f6',
  west: '#06b6d4',
  north: '#10b981',
  south: '#a855f7',
};

export const BDT_TO_CRORE = 10_000_000;

export function gridChartAxisTick(chartTheme: ChartTheme) {
  return { fontSize: 10, fill: chartTheme.axisTick };
}

type GridRechartsLegendProps = Omit<LegendProps, 'formatter'> & {
  colorResolver?: (value: string, entry: { color?: string; dataKey?: string | number }) => string;
};

/**
 * Recharts' own legend entry shape, narrowed to what the mark glyph needs.
 * `type` is the series' `legendType`; a dashed stroke is carried on the entry's
 * payload rather than the entry itself.
 */
type RechartsLegendEntry = {
  value?: unknown;
  color?: string;
  dataKey?: string | number;
  type?: string;
  payload?: { strokeDasharray?: string | number };
};

/** Recharts' legendType vocabulary mapped onto the glyph shapes we draw. */
function legendVariantFor(entry: RechartsLegendEntry): GridChartLegendItem['variant'] {
  if (entry.payload?.strokeDasharray) return 'dashed';
  switch (entry.type) {
    case 'rect':
    case 'square':
      return 'bar';
    case 'line':
    case 'plainline':
      return 'line';
    default:
      return 'line';
  }
}

/**
 * The in-plot legend.
 *
 * It renders the *same markup* as `GridChartExternalLegend` rather than
 * Recharts' default rows, because the two were visibly different legends on one
 * page: this one reserved 36px and drew every series as a circle, the external
 * one reserved 15px and drew a bar as a bar and a line as a line. A reader
 * moving between two cards saw two legend languages and no reason for either.
 *
 * Now only the placement differs — inside the chart's own layout here, below
 * the card there — and a legend looks the same wherever it sits.
 */
export function GridRechartsLegend({
  colorResolver,
  verticalAlign = 'bottom',
  ...props
}: GridRechartsLegendProps) {
  const isTop = verticalAlign === 'top';
  return (
    <Legend
      verticalAlign={verticalAlign}
      align="center"
      wrapperStyle={{
        width: '100%',
        left: 0,
        paddingTop: isTop ? 0 : '4px',
        paddingBottom: isTop ? '4px' : 0,
        ...props.wrapperStyle,
      }}
      content={({ payload }) => (
        <GridChartLegendList
          items={((payload ?? []) as RechartsLegendEntry[]).map((entry, i) => {
            const label = String(entry.value ?? '');
            return {
              id: `${entry.dataKey ?? label}-${i}`,
              label,
              color: colorResolver?.(label, entry) ?? entry.color ?? 'currentColor',
              variant: legendVariantFor(entry),
            };
          })}
          inPlot
        />
      )}
      {...props}
    />
  );
}

export type GridChartLegendItem = {
  id: string;
  label: string;
  color: string;
  variant?: 'bar' | 'line' | 'area' | 'dashed';
  /**
   * Whether this series is the agency's own figure or ours.
   *
   * Set it rather than writing "(P)" into `label`: spelled into the text it is
   * a different glyph from the tag used everywhere else on the page for the
   * same claim, and it inherits the series colour, so a "(D)" on a purple line
   * reads as part of the series name rather than as a provenance mark.
   */
  provenance?: 'P' | 'D';
};

/**
 * The legend itself — one list, one set of glyphs, one type scale.
 *
 * Both legend placements render this. `inPlot` only drops the outer margin,
 * because inside a chart Recharts has already reserved the band the legend
 * sits in and an extra margin there pushes the plot up off its own axis.
 */
export function GridChartLegendList({
  items,
  position = 'top',
  inPlot = false,
  className,
}: {
  items: GridChartLegendItem[];
  position?: 'top' | 'bottom';
  inPlot?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'grid-chart-external-legend',
        position === 'bottom' && !inPlot && 'grid-chart-external-legend--bottom',
        inPlot && 'grid-chart-external-legend--in-plot',
        className,
      )}
      aria-label="Chart legend"
    >
      {items.map((item) => (
        <li key={item.id} className="grid-chart-external-legend__item">
          <span
            className={cn(
              'grid-chart-external-legend__glyph',
              item.variant && `grid-chart-external-legend__glyph--${item.variant}`,
            )}
            style={{ '--legend-color': item.color } as React.CSSProperties}
            aria-hidden
          />
          <span
            className="grid-chart-external-legend__label"
            style={{ color: item.color }}
          >
            {item.label}
          </span>
          {item.provenance ? <GridProvenanceTag kind={item.provenance} /> : null}
        </li>
      ))}
    </ul>
  );
}

/** The legend as a sibling of the chart, below or above the plot. */
export function GridChartExternalLegend({
  items,
  position = 'top',
  className,
}: {
  items: GridChartLegendItem[];
  position?: 'top' | 'bottom';
  className?: string;
}) {
  return <GridChartLegendList items={items} position={position} className={className} />;
}

export function GridChartFrame({
  children,
  legend,
  className,
}: {
  children: React.ReactElement;
  legend?: GridChartLegendItem[];
  className?: string;
}) {
  const chart = isValidElement(children)
    ? cloneElement(children, {
        responsive: true,
        width: '100%',
        height: GRID_CHART_PLOT_HEIGHT,
        accessibilityLayer: false,
      } as Record<string, unknown>)
    : children;

  return (
    <div
      className={cn(
        'grid-explorer-chart-frame',
        legend?.length ? 'grid-explorer-chart-frame--with-legend' : undefined,
        className,
      )}
    >
      <div
        className="grid-explorer-chart-plot"
        style={{ width: '100%', height: GRID_CHART_PLOT_HEIGHT }}
      >
        {chart}
      </div>
      {legend?.length ? <GridChartExternalLegend items={legend} /> : null}
    </div>
  );
}

export type MixDatum = { name: string; value: number; mw: number };
export type DemandDatum = { hour: string; demand: number };

export function mixColor(chartTheme: ChartTheme, index: number) {
  return chartTheme.palette[index % chartTheme.palette.length];
}

export function mixShare(value: number, total: number) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
}

/** Shared Recharts tooltip defaults — escape viewbox + consistent z-index */
export const GRID_RECHARTS_TOOLTIP_WRAPPER_STYLE: React.CSSProperties = {
  outline: 'none',
  zIndex: 50,
  pointerEvents: 'none',
};

export const GRID_RECHARTS_TOOLTIP_PROPS = {
  wrapperStyle: GRID_RECHARTS_TOOLTIP_WRAPPER_STYLE,
  allowEscapeViewBox: { x: false, y: false },
} as const;

export function GridRechartsTooltip({
  content,
  cursor,
  wrapperStyle,
  allowEscapeViewBox = { x: false, y: false },
}: {
  content: React.ComponentType<any> | React.ReactElement | ((props: any) => React.ReactNode);
  cursor?: object;
  wrapperStyle?: React.CSSProperties;
  allowEscapeViewBox?: { x: boolean; y: boolean } | boolean;
}) {
  return (
    <Tooltip
      // Recharts ContentType is narrower than our shared tooltip union
      content={content as React.ComponentProps<typeof Tooltip>['content']}
      wrapperStyle={{ ...GRID_RECHARTS_TOOLTIP_WRAPPER_STYLE, ...wrapperStyle }}
      allowEscapeViewBox={allowEscapeViewBox as any}
      cursor={cursor}
    />
  );
}

/**
 * One labelled figure inside a tooltip, with the mark that says whose it is.
 *
 * The shared tooltips used to print a capacity and a share side by side with no
 * distinction between them — one is a figure an agency published, the other is
 * arithmetic of ours, and a hover is exactly where that difference matters
 * because it is where a reader is looking when they decide to quote something.
 */
export function GridTooltipFigure({
  label,
  value,
  provenance,
  dot,
}: {
  label: string;
  value: React.ReactNode;
  provenance: 'P' | 'D';
  dot?: string;
}) {
  return (
    <>
      <span className="grid-chart-tooltip__label">
        {dot ? (
          <span className="grid-chart-tooltip__dot" style={{ background: dot }} />
        ) : null}
        <GridProvenanceTag kind={provenance} className="mr-1" />
        {label}
      </span>
      <span className="grid-chart-tooltip__value">{value}</span>
    </>
  );
}

export function GridChartTooltipShell({
  title,
  accent,
  children,
  className,
}: {
  title?: string;
  accent?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('grid-chart-tooltip', className)}
      style={accent ? ({ '--grid-tip-accent': accent } as React.CSSProperties) : undefined}
    >
      {title ? <div className="grid-chart-tooltip__title">{title}</div> : null}
      {children}
    </div>
  );
}

export function GridPieTooltip({
  active,
  payload,
  totalMw,
}: {
  active?: boolean;
  payload?: { payload?: MixDatum; fill?: string }[];
  totalMw: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const accent = payload[0]?.fill ?? 'hsl(var(--primary))';
  const share = mixShare(row.mw, totalMw);
  return (
    <GridChartTooltipShell title={row.name} accent={accent}>
      <div className="grid-chart-tooltip__grid">
        <GridTooltipFigure label="Capacity" provenance="P" value={`${formatNumber(row.mw)} MW`} />
        <GridTooltipFigure label="Share" provenance="D" value={`${share}%`} />
        <GridTooltipFigure label="Mix index" provenance="D" value={`${row.value}%`} />
      </div>
    </GridChartTooltipShell>
  );
}

export function GridBarTooltip({
  active,
  payload,
  label,
  totalMw,
}: {
  active?: boolean;
  payload?: { payload?: MixDatum; fill?: string }[];
  label?: string;
  totalMw: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const accent = payload[0]?.fill ?? 'hsl(var(--primary))';
  const share = mixShare(row.mw, totalMw);
  return (
    <GridChartTooltipShell title={label ?? row.name} accent={accent}>
      <div className="grid-chart-tooltip__grid">
        <GridTooltipFigure label="Installed" provenance="P" value={`${formatNumber(row.mw)} MW`} />
        <GridTooltipFigure label="Of total" provenance="D" value={`${share}%`} />
      </div>
    </GridChartTooltipShell>
  );
}

export function GridLineTooltip({
  active,
  payload,
  label,
  accent,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
  accent: string;
}) {
  if (!active || !payload?.length) return null;
  const demand = Number(payload[0]?.value ?? 0);
  const gw = (demand / 1000).toFixed(2);
  return (
    <GridChartTooltipShell title={label} accent={accent}>
      <div className="grid-chart-tooltip__row">
        <span className="grid-chart-tooltip__dot grid-chart-tooltip__dot--line" />
        <span className="grid-chart-tooltip__label">
          <GridProvenanceTag kind="P" className="mr-1" />
          Grid demand
        </span>
        <span className="grid-chart-tooltip__value">{formatNumber(demand)} MW</span>
      </div>
      <div className="grid-chart-tooltip__foot">
        <GridProvenanceTag kind="D" className="mr-1" />
        {gw} GW equivalent
      </div>
    </GridChartTooltipShell>
  );
}

export function MixLegend({
  data,
  chartTheme,
  hoveredIndex,
  onHover,
  totalMw,
}: {
  data: MixDatum[];
  chartTheme: ChartTheme;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  totalMw: number;
}) {
  return (
    <>
    <div className="grid-chart-legend">
      {data.map((item, i) => {
        const color = mixColor(chartTheme, i);
        const dimmed = hoveredIndex !== null && hoveredIndex !== i;
        return (
          <button
            key={item.name}
            type="button"
            className={cn('grid-chart-legend__item', dimmed && 'grid-chart-legend__item--dim')}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(i)}
            onBlur={() => onHover(null)}
          >
            <span className="grid-chart-legend__swatch" style={{ backgroundColor: color }} />
            <span className="grid-chart-legend__name">{item.name}</span>
            <span className="grid-chart-legend__meta">{mixShare(item.mw, totalMw)}%</span>
            <span className="grid-chart-legend__val">{formatNumber(item.mw)}</span>
          </button>
        );
      })}
    </div>
    {/* Marked once for the column rather than twice on every row: the share is
        ours, the megawatts are the agency's. */}
    <p className="grid-chart-legend__key">
      <span>Share <GridProvenanceTag kind="D" /></span>
      <span aria-hidden>·</span>
      <span>MW <GridProvenanceTag kind="P" /></span>
    </p>
    </>
  );
}

export function GridStatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const tone =
    lower.includes('construction') || lower.includes('ongoing')
      ? 'warn'
      : lower.includes('tender') || lower.includes('planned')
        ? 'info'
        : lower.includes('operational') || lower.includes('commissioned')
          ? 'ok'
          : 'muted';

  return <span className={cn('grid-status', `grid-status--${tone}`)}>{status}</span>;
}

export function GridLoadMeter({ load }: { load: number }) {
  const tone = load > 85 ? 'high' : load > 70 ? 'mid' : 'low';
  return (
    <div className="grid-load-meter">
      <div className="grid-load-meter__head">
        <span className="grid-load-meter__label">Load factor</span>
        <span className="grid-load-meter__val">{load}%</span>
      </div>
      <div className="grid-load-meter__track">
        <div
          className={cn('grid-load-meter__fill', `grid-load-meter__fill--${tone}`)}
          style={{ width: `${load}%` }}
        />
      </div>
    </div>
  );
}

export function GridLiveBadge({ label = 'Live telemetry' }: { label?: string }) {
  return (
    <span className="grid-live-badge">
      <span className="grid-live-badge__dot" aria-hidden />
      {label}
    </span>
  );
}