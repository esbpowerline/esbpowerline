'use client';

/**
 * The 24-Hour System Load Curve.
 *
 * Built as SVG rather than assembled from a chart library, because the thing
 * worth showing is not three series — it is the distance between two of them.
 *
 * What the day actually is: demand rises and falls on its own rhythm,
 * generation follows it as far as it can, and wherever generation cannot reach,
 * the grid sheds load. The old chart drew those as a line, an area, and a set of
 * bars on a second axis — and carried a note apologising that the bars had to
 * live on their own scale "or it would be a flat line on the floor". A chart
 * that needs a footnote explaining why its most important series is unreadable
 * is telling you the composition is wrong.
 *
 * So the composition here is:
 *
 *   · Generation is a grounded mass. It is what the country actually had.
 *   · Demand is the ceiling above it — what the country asked for.
 *   · The band between them is the shortfall, filled in the warning colour.
 *     It is not a fourth series; it is the space two series leave, which is
 *     exactly what unserved demand is.
 *   · Shedding gets an intensity strip along the foot instead of a second axis,
 *     so its shape is legible without pretending megawatt-hours of shortfall
 *     and megawatts of load share a scale.
 *
 * Two details that are corrections rather than decoration:
 *
 *   · Time is positioned by real minutes, not by row index. PGCB publishes 24
 *     hourly readings plus the evening-peak half hour at 19:30; spaced evenly,
 *     that half hour occupied a full hour of width and stretched the evening.
 *   · The night hours carry a faint tint. A load curve is a circadian object and
 *     the shape means little without knowing which end is the small hours.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { minutesOf, monotonePath, type Pt } from '@/components/news/power-grid/svgChart';
import { LOAD_CURVE_COLORS } from '@/lib/data/grid/chart-palette';

export type LoadCurveRow = {
  time: string;
  generation: number | null;
  demand: number | null;
  loadShed: number | null;
};

export type LoadCurvePeaks = {
  dayPeakGen?: number | null;
  eveningPeakGen?: number | null;
  minGen?: number | null;
  peakTimes?: Record<string, string | undefined> | null;
};



/**
 * The half-hour sample's own colour.
 *
 * PGCB's 25th reading is a half-hour sample at 19:30, not another hour, and
 * with every bar now one width there was nothing to say so. Gold rather than
 * the demand amber — close enough to read as "look at this one", far enough
 * from the two curve colours that it is not mistaken for either of them.
 */
// The half-hour tick. Takes the palette's amber rather than restating it, so
// the mark and the demand series it sits under cannot drift apart.
const HALF_HOUR_MARK = LOAD_CURVE_COLORS.demand.dark;

/** True for a reading that is not on a whole hour. */
function isHalfHour(time: string): boolean {
  return !/:00$/.test(time);
}

/** The shed strip and the gutter above it, inside the bottom padding. */
const STRIP_H = 32;
const STRIP_GAP = 10;
/** Room under the strip for the hour labels. */
const AXIS_LABEL_H = 20;

const PAD = {
  top: 26,
  // Matched to the left gutter. At 16 against 52 the plot sat visibly
  // off-centre in its card, with a wide column of tick labels on one side and
  // nothing on the other.
  right: 38,
  // Everything below the plot has to fit here: the gutter, the shed strip and
  // the hour labels under it. At 44 it did not — the labels were drawn at y=367
  // inside a 360px box and only appeared at all because the SVG allows
  // overflow, landing on top of the key beneath the chart.
  bottom: STRIP_GAP + STRIP_H + AXIS_LABEL_H,
  left: 38,
};



/**
 * An axis floor and ticks for a series that never approaches zero.
 *
 * A national load curve sits between roughly 13 and 18 GW. Anchored at zero,
 * three quarters of the plot is a solid block carrying no information and the
 * day's whole shape — the morning trough, the midday climb, the evening peak —
 * is squeezed into the top fifth. The chart looked flat, which is the one thing
 * a load curve is not.
 *
 * So the axis starts below the day's minimum rather than at zero. That is a
 * real trade and it is paid for openly: the floor is a labelled tick like every
 * other, and the generation fill fades out towards it instead of sitting on it
 * as a mass, so nothing reads as "this is the magnitude from zero". The band
 * between the curves — the quantity the chart is actually about — is a
 * difference and is unaffected by where the axis starts.
 */
function niceScale(min: number, max: number, count = 4): { lo: number; hi: number; ticks: number[] } {
  if (!(max > 0) || !Number.isFinite(min)) return { lo: 0, hi: Math.max(max, 1), ticks: [0] };
  const span = Math.max(max - min, max * 0.05, 1);
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) ?? mag * 10;
  // A step of headroom each side keeps the peak off the ceiling and the trough
  // off the floor, so neither reads as clipped.
  const lo = Math.max(0, Math.floor((min - step * 0.55) / step) * step);
  const hi = Math.ceil((max + step * 0.35) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-6; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

/**
 * A tick label short enough to live in a narrow gutter.
 *
 * "12.0k" carries a decimal that is always zero on a round tick and costs the
 * width the plot wanted back, so the decimal appears only when it says
 * something: 12000 -> "12k", 12500 -> "12.5k".
 */
function formatMw(v: number): string {
  if (v < 1000) return String(Math.round(v));
  const k = v / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

/**
 * A shed bar trimmed to the plot it belongs to.
 *
 * Bars are centred on their hour, so the first and last sat half outside the
 * frame — 22px of the midnight bar hanging into the value-axis labels and the
 * same again past the right edge. The strip ended up visibly wider than the
 * chart above it, which is what made it look off-balance rather than merely
 * uneven.
 */
function clampedBar(
  model: { x: (m: number) => number; plotW: number },
  mins: number,
  w: number,
): { x: number; w: number } {
  // Nudged inside the plot, not trimmed to it. Trimming halved the midnight and
  // 23:00 bars — 11.5px against 23.1px for the other twenty-three — which read
  // as two odd bars in an otherwise even row. Since width carries no meaning
  // here, moving a bar a few pixels off its own centre costs nothing, while
  // cutting it in half looks like a fault.
  const right = PAD.left + model.plotW;
  const width = Math.max(1, Math.min(w, model.plotW));
  let left = model.x(mins) - width / 2;
  if (left < PAD.left) left = PAD.left;
  if (left + width > right) left = right - width;
  return { x: left, w: width };
}

/**
 * The shed baseline, as spans of hours that actually reported a figure.
 *
 * Drawn as one line from edge to edge it asserted a continuous record, so the
 * two days in 2026 whose shedding column is null for all 24 hours looked
 * identical to a day that shed nothing all day. Each span is bounded by the
 * halfway point to the neighbouring reading, so the gap opens exactly where the
 * silence is.
 *
 * Exported so the three states — a figure, a published zero, and no figure at
 * all — can be tested. They are only distinguishable on days that are
 * tier-locked in the browser, which is precisely the case that should not rest
 * on someone happening to look.
 */
export function shedBaselineRuns(
  rows: readonly { mins: number; loadShed: number | null }[],
  x: (mins: number) => number,
  leftEdge: number,
  rightEdge: number,
): { from: number; to: number }[] {
  const runs: { from: number; to: number }[] = [];
  let run: { from: number; to: number } | null = null;
  rows.forEach((d, i) => {
    if (d.loadShed == null) {
      if (run) { runs.push(run); run = null; }
      return;
    }
    const prev = rows[i - 1];
    const next = rows[i + 1];
    const from = prev ? x((d.mins + prev.mins) / 2) : leftEdge;
    const to = next ? x((d.mins + next.mins) / 2) : rightEdge;
    if (run && Math.abs(run.to - from) < 0.5) run.to = to;
    else { if (run) runs.push(run); run = { from, to }; }
  });
  if (run) runs.push(run);
  return runs;
}

export function LoadCurveCanvas({
  rows,
  peaks,
  generationColor,
  demandColor,
  shedColor,
  axisColor,
  gridColor,
  reportDate,
}: {
  rows: LoadCurveRow[];
  peaks: LoadCurvePeaks;
  generationColor: string;
  demandColor: string;
  shedColor: string;
  axisColor: string;
  gridColor: string;
  reportDate?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(360);
  const [cursor, setCursor] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
      setHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(
    () =>
      rows
        .map((r) => ({ ...r, mins: minutesOf(r.time) }))
        .filter((r): r is LoadCurveRow & { mins: number } => r.mins != null)
        .sort((a, b) => a.mins - b.mins),
    [rows],
  );

  const model = useMemo(() => {
    if (!width || data.length < 2) return null;

    const plotW = Math.max(10, width - PAD.left - PAD.right);
    const plotH = Math.max(40, height - PAD.top - PAD.bottom);
    const stripTop = PAD.top + plotH + STRIP_GAP;

    // The axis spans the whole day even when the last reading is 23:00, so the
    // curve is not stretched to fill time it does not cover.
    // The axis spans the readings, not the calendar day. Anchored to 00:00-24:00
    // it reserved a full hour of width past the last reading at 23:00 and the
    // curve stopped an inch short of its own frame.
    const t0 = data[0].mins;
    const t1 = data[data.length - 1].mins;
    const span = Math.max(1, t1 - t0);
    const x = (mins: number) => PAD.left + ((mins - t0) / span) * plotW;
    const pxPerMin = plotW / span;

    /**
     * One width for every bar, set by the tightest spacing in the day.
     *
     * PGCB publishes 24 hourly readings plus a half-hour sample at 19:30 — 25
     * on 144 of 2026's 146 days — so most points sit 60 minutes apart and three
     * of them 30. A single width taken from the average made every bar ~45px
     * while 19:00 and 19:30 were 27px apart, and those two merged into one
     * block. Sizing each bar to its own nearest gap fixed the overlap but left
     * three narrow bars among twenty-two wide ones, which reads as a mistake.
     *
     * It was also the wrong idea. A bar here is an instantaneous megawatt
     * reading at a moment, not energy accumulated over the span around it, so
     * width should carry no meaning at all — varying it implied a duration the
     * figure does not have. Every bar is now the same, narrow enough that the
     * closest pair in the day still clears.
     */
    const tightestGap = data.reduce((min, d, i) => {
      if (i === 0) return min;
      return Math.min(min, d.mins - data[i - 1].mins);
    }, 60);
    const uniformBarW = Math.max(2, tightestGap * pxPerMin * 0.78);
    const barWidths = data.map(() => uniformBarW);

    const vals = data.flatMap((d) => [d.demand, d.generation].filter((v): v is number => v != null));
    const scale = niceScale(Math.min(...vals), Math.max(...vals));
    const y = (v: number) =>
      PAD.top + plotH - ((v - scale.lo) / (scale.hi - scale.lo || 1)) * plotH;

    const genPts = data.filter((d) => d.generation != null).map((d) => ({ x: x(d.mins), y: y(d.generation as number) }));
    const demPts = data.filter((d) => d.demand != null).map((d) => ({ x: x(d.mins), y: y(d.demand as number) }));

    const genLine = monotonePath(genPts);
    const demLine = monotonePath(demPts);
    const base = PAD.top + plotH;

    const genArea = genPts.length
      ? `${genLine} L ${genPts[genPts.length - 1].x} ${base} L ${genPts[0].x} ${base} Z`
      : '';

    // The shortfall band: demand's curve out, generation's curve back. Only
    // drawn where both exist, so a day publishing demand at the peak hour alone
    // does not get a band spanning hours it never measured.
    const bothPts = data.filter((d) => d.demand != null && d.generation != null);
    const deficit =
      bothPts.length > 1
        ? `${monotonePath(bothPts.map((d) => ({ x: x(d.mins), y: y(d.demand as number) })))} L ${
            x(bothPts[bothPts.length - 1].mins)
          } ${y(bothPts[bothPts.length - 1].generation as number)} ${monotonePath(
            [...bothPts].reverse().map((d) => ({ x: x(d.mins), y: y(d.generation as number) })),
          ).replace(/^M/, 'L')} Z`
        : '';

    const maxShed = Math.max(...data.map((d) => d.loadShed ?? 0), 1);
    const worstShed = data.reduce<(typeof data)[number] | null>(
      (acc, d) => ((d.loadShed ?? 0) > (acc?.loadShed ?? -1) ? d : acc),
      null,
    );

    const baselineRuns = shedBaselineRuns(data, x, PAD.left, PAD.left + plotW);

    return {
      plotW, plotH, base, stripTop, x, y, maxShed, worstShed,
      genLine, demLine, genArea, deficit,
      ticks: scale.ticks,
      floor: scale.lo,
      barWidths, t0, t1, baselineRuns,
      // Whole hours on a 3-hour step that lie inside the span the readings
      // cover, so no label points at time the chart does not draw.
      // Six-hour step below ~560px: at 393px the 3-hour labels ran into each
      // other ("00:0003:00", "18:0021:00") on the phone screenshot of
      // 2026-09-02. Nine labels need ~46px each; a phone card has ~340px.
      hourTicks: Array.from({ length: 9 }, (_, i) => i * 3)
        .filter((h) => (width < 560 ? h % 6 === 0 : true))
        .filter((h) => h * 60 >= t0 - 1 && h * 60 <= t1 + 1),
      dayMaxGen: Math.max(...data.map((d) => d.generation ?? 0), 0),
    };
  }, [data, width, height]);

  const active = cursor != null ? data[cursor] : null;

  const pointAt = useCallback(
    (clientX: number) => {
      const el = hostRef.current;
      if (!el || !model) return null;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left;
      let best = 0;
      let bestD = Infinity;
      data.forEach((d, i) => {
        const dist = Math.abs(model.x(d.mins) - px);
        if (dist < bestD) { bestD = dist; best = i; }
      });
      return best;
    },
    [data, model],
  );

  const onMove = (e: React.PointerEvent) => {
    if (pinned) return;
    const i = pointAt(e.clientX);
    if (i != null) setCursor(i);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setCursor((c) => {
        const next = (c ?? -1) + (e.key === 'ArrowRight' ? 1 : -1);
        return Math.max(0, Math.min(data.length - 1, next));
      });
    } else if (e.key === 'Escape') {
      setCursor(null);
      setPinned(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPinned((p) => !p);
    }
  };

  const flags = useMemo(() => {
    const peakTimes = peaks.peakTimes ?? {};
    if (!model) return [];
    const out: { mins: number; value: number; label: string }[] = [];
    const add = (time: string | undefined, label: string) => {
      if (!time) return;
      const mins = minutesOf(time);
      if (mins == null) return;
      const row = data.find((d) => d.mins === mins);
      if (!row || row.generation == null) return;
      out.push({ mins, value: row.generation, label });
    };
    // Evening peak first: where two flags collide it is the one that survives,
    // because it is the moment the grid is most stretched.
    add(peakTimes.eveningPeakGen ?? undefined, 'Evening peak');
    add(peakTimes.dayPeakGen ?? undefined, 'Day peak');
    const deduped = out.filter((f, i, arr) => arr.findIndex((o) => o.mins === f.mins) === i);
    // Same hour is not the only way two labels collide — two hours an inch
    // apart overlap just as badly once the label is drawn.
    const kept: typeof deduped = [];
    for (const f of deduped) {
      if (kept.every((k) => Math.abs(model.x(k.mins) - model.x(f.mins)) > 104)) kept.push(f);
    }
    return kept;
  }, [model, data, peaks.peakTimes]);

  /** Which hours the report names, so the readout can say what it is looking at. */
  const peakLabelByMins = useMemo(() => {
    const pt = peaks.peakTimes ?? {};
    const map = new Map<number, string>();
    const put = (time: string | undefined, label: string) => {
      const mins = time ? minutesOf(time) : null;
      if (mins != null && !map.has(mins)) map.set(mins, label);
    };
    put(pt.eveningPeakGen ?? undefined, 'Evening peak');
    put(pt.dayPeakGen ?? undefined, 'Day peak');
    put(pt.minGen ?? undefined, 'Day minimum');
    return map;
  }, [peaks.peakTimes]);

  /**
   * The figures the key carries.
   *
   * Every one is a reading the report states or the largest of those readings —
   * nothing integrated over the day. A total of unserved energy would mean
   * treating each figure as a rate held for a full hour, which is wrong for the
   * 19:30 half-hour row, and the card's prose already carries that total with
   * the caveat attached. A key is the wrong place for a number that needs one.
   */
  const summary = useMemo(() => {
    const hoursShed = data.filter((d) => (d.loadShed ?? 0) > 0).length;
    const peakOf = (pick: (d: (typeof data)[number]) => number | null) =>
      data.reduce<{ v: number; time: string } | null>((acc, d) => {
        const v = pick(d);
        return v != null && (acc == null || v > acc.v) ? { v, time: d.time } : acc;
      }, null);

    return {
      hoursShed,
      total: data.length,
      genPeak: peakOf((d) => d.generation),
      demPeak: peakOf((d) => d.demand),
      worstShed: peakOf((d) => d.loadShed),
      widestGap: peakOf((d) =>
        d.demand != null && d.generation != null ? d.demand - d.generation : null,
      ),
      peakShed: Math.max(...data.map((d) => d.loadShed ?? 0), 0),
    };
  }, [data]);

  return (
    <figure className="load-curve" aria-label={`24-hour system load curve${reportDate ? ` for ${reportDate}` : ''}`}>
      <div
        ref={hostRef}
        className="load-curve__canvas"
        tabIndex={0}
        role="application"
        aria-label="Load curve. Use left and right arrow keys to step through the hours."
        onPointerMove={onMove}
        onPointerLeave={() => { if (!pinned) setCursor(null); }}
        onPointerDown={(e) => { const i = pointAt(e.clientX); if (i != null) { setCursor(i); setPinned(true); } }}
        onKeyDown={onKey}
      >
        {model && (
          <svg width={width} height={height} className="load-curve__svg" aria-hidden="true">
            <defs>
              <linearGradient id={`gen-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={generationColor} stopOpacity={0.42} />
                <stop offset="55%" stopColor={generationColor} stopOpacity={0.16} />
                <stop offset="100%" stopColor={generationColor} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`def-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={shedColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={shedColor} stopOpacity={0.07} />
              </linearGradient>
              <linearGradient id={`night-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={axisColor} stopOpacity={0.07} />
                <stop offset="100%" stopColor={axisColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`dusk-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={axisColor} stopOpacity={0} />
                <stop offset="100%" stopColor={axisColor} stopOpacity={0.07} />
              </linearGradient>
            </defs>

            {/* Night, faded into day rather than stopped at a hard edge — the
                grid does not change character at exactly 06:00. */}
            {/* Clamped to the span the readings cover. Drawn from a fixed
                00:00-24:00 they ran past the plot edge once the axis stopped
                following the calendar day. */}
            {(() => {
              const clampX = (mins: number) => model.x(Math.min(Math.max(mins, model.t0), model.t1));
              const dawn = clampX(6 * 60);
              const dusk = clampX(18 * 60);
              const left = clampX(model.t0);
              const right = clampX(model.t1);
              return (
                <>
                  {dawn > left && (
                    <rect x={left} y={PAD.top} width={dawn - left} height={model.plotH} fill={`url(#night-${uid})`} />
                  )}
                  {right > dusk && (
                    <rect x={dusk} y={PAD.top} width={right - dusk} height={model.plotH} fill={`url(#dusk-${uid})`} />
                  )}
                </>
              );
            })()}

            {model.ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + model.plotW} y1={model.y(t)} y2={model.y(t)}
                  stroke={gridColor} strokeOpacity={0.3} strokeDasharray="3 6" />
                <text x={PAD.left - 8} y={model.y(t)} dy="0.32em" textAnchor="end"
                  className="load-curve__tick" fill={axisColor}>{formatMw(t)}</text>
              </g>
            ))}

            {/* The axis does not start at zero, so it says so. Without this the
                fill reads as the whole of generation rather than its top slice. */}
            {model.floor > 0 && (
              // Drawn on the axis, straddling the baseline — not in the label
              // column. Anchored at PAD.left - 13 it ran x=25 to x=30 while the
              // tick labels are right-anchored ending at x=30, so the two
              // chevrons sat on top of the last character of the floor label and
              // read as a stray glyph over "12k" rather than as an axis break.
              <g className="load-curve__break" aria-hidden="true">
                <path
                  d={`M ${PAD.left - 5} ${model.base + 3} l 9 -6`}
                  fill="none" stroke={axisColor} strokeOpacity={0.55} strokeWidth={1.25} strokeLinecap="round"
                />
                <path
                  d={`M ${PAD.left - 1} ${model.base + 3} l 9 -6`}
                  fill="none" stroke={axisColor} strokeOpacity={0.55} strokeWidth={1.25} strokeLinecap="round"
                />
              </g>
            )}
            <text x={PAD.left - 8} y={PAD.top - 12} textAnchor="end" className="load-curve__unit" fill={axisColor}>MW</text>

            {model.deficit && <path d={model.deficit} fill={`url(#def-${uid})`} />}
            {model.genArea && <path d={model.genArea} fill={`url(#gen-${uid})`} />}
            {model.demLine && (
              <path d={model.demLine} fill="none" stroke={demandColor} strokeWidth={1.75}
                strokeDasharray="5 4" strokeLinecap="round" opacity={0.95} />
            )}
            {model.genLine && (
              <path d={model.genLine} fill="none" stroke={generationColor} strokeWidth={2.5} strokeLinecap="round" />
            )}

            {/* Peak flags, drawn on the generation curve where the report says
                the peak occurred rather than at the curve's own maximum — the
                two can differ and PGCB's stated hour is the published fact. */}
            {flags.map((f) => (
              <g key={f.label} className="load-curve__flag">
                <line x1={model.x(f.mins)} x2={model.x(f.mins)} y1={model.y(f.value)} y2={PAD.top + 4}
                  stroke={generationColor} strokeOpacity={0.35} strokeDasharray="2 4" />
                <circle cx={model.x(f.mins)} cy={model.y(f.value)} r={3.5} fill={generationColor} />
                <text x={model.x(f.mins)} y={PAD.top - 2} textAnchor={model.x(f.mins) > PAD.left + model.plotW * 0.75 ? 'end' : 'middle'}
                  className="load-curve__flag-label" fill={axisColor}>{f.label}</text>
              </g>
            ))}

            {/* ── Load shedding ──────────────────────────────────────────────
                Its own panel, because it is a different measurement from the
                band above it — PGCB's published shortage column, not our
                subtraction — and because it is the series a reader has come to
                look at.

                Three states, drawn as three different things:

                  shed > 0   a bar, height and weight both by size
                  shed = 0   a flat stub on the baseline: reported, and none
                  shed null  nothing, and the baseline breaks underneath

                That distinction is not decorative. 1,388 of 2026's hourly rows
                are a published zero across 91 days, and another 48 are null; a
                strip that draws nothing for both told a reader those 91 days
                had no data when what they had was a grid that shed nothing. */}
            <rect x={PAD.left} y={model.stripTop} width={model.plotW} height={STRIP_H}
              rx={3} fill={gridColor} opacity={0.12} />

            {/* The strip's ceiling is the day's own worst hour. Stated, so the
                bar heights have a referent instead of being pure ranking. */}
            {model.worstShed && (model.worstShed.loadShed ?? 0) > 0 && (
              <>
                <line x1={PAD.left} x2={PAD.left + model.plotW} y1={model.stripTop} y2={model.stripTop}
                  stroke={shedColor} strokeOpacity={0.3} strokeDasharray="2 4" />
                {/* Right-aligned inside the strip, not in the gutter. Stacked
                    under the value axis it sat 10px below the lowest MW tick and
                    the two read as one column of unrelated numbers. */}
                <text x={PAD.left + model.plotW - 3} y={model.stripTop - 3} textAnchor="end"
                  className="load-curve__strip-max" fill={shedColor}>
                  peak {formatMw(model.maxShed)} MW
                </text>
              </>
            )}
            <text x={PAD.left - 8} y={model.stripTop + STRIP_H + 1} textAnchor="end"
              className="load-curve__strip-label" fill={axisColor}>SHED</text>

            {data.map((d, i) => {
              const bar = clampedBar(model, d.mins, model.barWidths[i]);
              const hovered = cursor != null && data[cursor]?.time === d.time;

              // Not published: draw nothing. The baseline break below says so.
              if (d.loadShed == null) return null;

              // Published as none: a stub on the floor, in the axis colour
              // rather than the warning one — nothing was shed, so nothing
              // should read as a warning.
              if (d.loadShed <= 0) {
                return (
                  <rect key={d.time} x={bar.x} y={model.stripTop + STRIP_H - 2}
                    width={bar.w} height={2} rx={1}
                    fill={isHalfHour(d.time) ? HALF_HOUR_MARK : axisColor}
                    opacity={hovered ? 0.75 : isHalfHour(d.time) ? 0.6 : 0.3} />
                );
              }

              const share = d.loadShed / model.maxShed;
              const h = Math.max(3, share * (STRIP_H - 3));
              const half = isHalfHour(d.time);
              // Weight as well as height. Across 26 pixels the difference
              // between 1,978 MW and 2,087 MW is one pixel; carrying severity in
              // the fill too means the bad hours read at a glance.
              const opacity = 0.34 + share * 0.5;
              return (
                <rect key={d.time} x={bar.x} y={model.stripTop + STRIP_H - h}
                  width={bar.w} height={h} rx={1.5}
                  fill={half ? HALF_HOUR_MARK : shedColor}
                  opacity={half ? Math.min(0.95, opacity + 0.2) : opacity}
                  // Hover is a stroke, not more opacity — opacity is already
                  // spoken for by severity and the two collided.
                  stroke={hovered ? shedColor : 'none'} strokeWidth={hovered ? 1.5 : 0} />
              );
            })}

            {/* The baseline, drawn only under hours that reported. A gap is the
                one honest way to say "this hour published no figure". */}
            {model.baselineRuns.map((run) => (
              <line key={run.from} x1={run.from} x2={run.to}
                y1={model.stripTop + STRIP_H} y2={model.stripTop + STRIP_H}
                stroke={gridColor} strokeOpacity={0.55} />
            ))}

            {/* Every third hour, and only hours the axis actually spans. The
                fixed 0-24 list printed a label for midnight-at-the-end that no
                reading reaches, and stepped in fours, which left the evening —
                where the day's story is — with one label between 16:00 and
                20:00. */}
            {model.hourTicks.map((h, i, arr) => (
              <text key={h} x={model.x(h * 60)} y={model.stripTop + STRIP_H + 14}
                textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}
                className="load-curve__tick" fill={axisColor}>
                {String(h % 24).padStart(2, '0')}:00
              </text>
            ))}

            {active && active.mins != null && (
              <g className="load-curve__cursor">
                <line x1={model.x(active.mins)} x2={model.x(active.mins)} y1={PAD.top} y2={model.stripTop + STRIP_H}
                  stroke={axisColor} strokeOpacity={0.35} strokeWidth={1} />
                {active.demand != null && (
                  <circle cx={model.x(active.mins)} cy={model.y(active.demand)} r={4.5}
                    fill={demandColor} stroke="var(--card, #fff)" strokeWidth={1.5} />
                )}
                {active.generation != null && (
                  <circle cx={model.x(active.mins)} cy={model.y(active.generation)} r={4.5}
                    fill={generationColor} stroke="var(--card, #fff)" strokeWidth={1.5} />
                )}
              </g>
            )}
          </svg>
        )}

        {/* The readout is HTML over the SVG: crisp type, real wrapping, and it
            can use the card's own styles instead of re-implementing them. */}
        {active && model && (
          <div
            className="load-curve__readout"
            style={{
              left: `${Math.min(Math.max(model.x(active.mins), PAD.left + 4), PAD.left + model.plotW - 4)}px`,
              // Flip to the other side near the right edge so the panel never
              // leaves the card.
              transform: model.x(active.mins) > PAD.left + model.plotW * 0.62
                ? 'translate(calc(-100% - 14px), 0)' : 'translate(14px, 0)',
            }}
          >
            <div className="load-curve__readout-time">
              <span>{active.time}</span>
              {isHalfHour(active.time) && (
                <span className="load-curve__tag" style={{ color: HALF_HOUR_MARK }}>
                  half-hour sample
                </span>
              )}
              {peakLabelByMins.has(active.mins) && (
                <span className="load-curve__tag">{peakLabelByMins.get(active.mins)}</span>
              )}
              {pinned && <span className="load-curve__pin">pinned</span>}
            </div>

            {/* Met against unmet, drawn. The two figures are already listed
                below; this is the one line that says how big the shortfall was
                relative to what was being asked for, which is the question the
                numbers alone make you do arithmetic for. */}
            {active.demand != null && active.generation != null && active.demand > 0 && (
              <div className="load-curve__meter" aria-hidden="true">
                <span
                  className="load-curve__meter-fill"
                  style={{
                    width: `${Math.min(100, (active.generation / active.demand) * 100)}%`,
                    background: generationColor,
                  }}
                />
                <span className="load-curve__meter-rest" style={{ background: shedColor }} />
              </div>
            )}
            {active.demand != null && active.generation != null && active.demand > 0 && (
              <div className="load-curve__meter-caption">
                <span style={{ color: generationColor }}>
                  {((active.generation / active.demand) * 100).toFixed(1)}% of demand met
                </span>
                <GridProvenanceTag kind="D" className="ml-1" />
              </div>
            )}

            <dl className="load-curve__readout-list">
              <div><dt style={{ color: demandColor }}><GridProvenanceTag kind="P" className="mr-1" />Demand</dt>
                <dd>{active.demand == null ? '—' : `${formatNumber(Math.round(active.demand))} MW`}</dd></div>
              <div><dt style={{ color: generationColor }}><GridProvenanceTag kind="P" className="mr-1" />Generation</dt>
                <dd>{active.generation == null ? '—' : `${formatNumber(Math.round(active.generation))} MW`}</dd></div>
              <div><dt style={{ color: shedColor }}><GridProvenanceTag kind="P" className="mr-1" />Load shed</dt>
                <dd>
                  {active.loadShed == null ? (
                    <span className="load-curve__muted">not published</span>
                  ) : active.loadShed <= 0 ? (
                    <span className="load-curve__muted">none</span>
                  ) : (
                    `${formatNumber(Math.round(active.loadShed))} MW`
                  )}
                </dd></div>
              {active.demand != null && active.generation != null && (
                <div className="load-curve__readout-gap">
                  <dt><GridProvenanceTag kind="D" className="mr-1" />Unmet</dt>
                  <dd>
                    {formatNumber(Math.round(active.demand - active.generation))} MW
                    <span className="load-curve__sub">
                      {((1 - active.generation / active.demand) * 100).toFixed(1)}% of demand
                    </span>
                  </dd>
                </div>
              )}
              {/* Where this hour sat in the day, so a figure is not read in
                  isolation — 16,190 MW means little until you know it is the
                  day's highest. */}
              {active.generation != null && model.dayMaxGen > 0 && (
                <div className="load-curve__readout-gap">
                  <dt><GridProvenanceTag kind="D" className="mr-1" />Share of day peak</dt>
                  <dd>
                    {((active.generation / model.dayMaxGen) * 100).toFixed(1)}%
                    <span className="load-curve__sub">
                      peak {formatNumber(Math.round(model.dayMaxGen))} MW
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* The key doubles as the day's summary. Naming four colours is the least
          a legend can do; each entry also carries the figure that series
          reached, so the chart can be read once without hovering and the marks
          beneath the plot have a number attached to them.

          Each entry also carries the same P/D mark the scrub readout puts on
          that series. It is not a second claim — it is the one already made on
          hover, said where a reader who never hovers can see it, which is what
          the generation-mix and interconnector keys already do. */}
      <figcaption className="load-curve__caption">
        <span className="load-curve__key">
          <span className="load-curve__swatch" style={{ background: generationColor }} />
          <span className="load-curve__key-text">
            <span className="load-curve__key-label">
              <GridProvenanceTag kind="P" className="mr-1" />
              Generation
            </span>
            {summary.genPeak && (
              <span className="load-curve__key-value">
                peak {formatNumber(Math.round(summary.genPeak.v))} MW · {summary.genPeak.time}
              </span>
            )}
          </span>
        </span>

        <span className="load-curve__key">
          <span className="load-curve__swatch load-curve__swatch--dashed" style={{ borderColor: demandColor }} />
          <span className="load-curve__key-text">
            <span className="load-curve__key-label">
              <GridProvenanceTag kind="P" className="mr-1" />
              Demand
            </span>
            {summary.demPeak && (
              <span className="load-curve__key-value">
                peak {formatNumber(Math.round(summary.demPeak.v))} MW · {summary.demPeak.time}
              </span>
            )}
          </span>
        </span>

        <span className="load-curve__key">
          <span className="load-curve__swatch load-curve__swatch--band" style={{ background: shedColor }} />
          <span className="load-curve__key-text">
            <span className="load-curve__key-label">
              <GridProvenanceTag kind="D" className="mr-1" />
              Unmet demand
            </span>
            {summary.widestGap && (
              <span className="load-curve__key-value">
                widest {formatNumber(Math.round(summary.widestGap.v))} MW · {summary.widestGap.time}
              </span>
            )}
          </span>
        </span>

        <span className="load-curve__key">
          <span className="load-curve__swatch load-curve__swatch--bar" style={{ background: shedColor }} />
          <span className="load-curve__key-text">
            <span className="load-curve__key-label">
              <GridProvenanceTag kind="P" className="mr-1" />
              Load shed, by hour
            </span>
            {summary.worstShed == null ? (
              <span className="load-curve__key-value">not published</span>
            ) : summary.worstShed.v <= 0 ? (
              <span className="load-curve__key-value">none reported all day</span>
            ) : (
              <span className="load-curve__key-value">
                worst {formatNumber(Math.round(summary.worstShed.v))} MW · {summary.worstShed.time}
              </span>
            )}
          </span>
        </span>

        <span className="load-curve__key">
          <span className="load-curve__swatch load-curve__swatch--bar" style={{ background: HALF_HOUR_MARK }} />
          <span className="load-curve__key-text">
            <span className="load-curve__key-label">19:30 sample</span>
            <span className="load-curve__key-value">PGCB&rsquo;s extra half-hour reading</span>
          </span>
        </span>

        <span className="load-curve__hint">
          Hover or use arrow keys to read an hour · click to pin
        </span>
      </figcaption>

      {/* What a screen reader gets instead of the picture. */}
      <table className="sr-only">
        <caption>Hourly generation, demand and load shedding{reportDate ? ` on ${reportDate}` : ''}</caption>
        <thead><tr><th>Hour</th><th>Generation MW</th><th>Demand MW</th><th>Load shed MW</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.time}>
              <th scope="row">{d.time}</th>
              {/* Spoken aloud, an em dash is silence or "dash" — neither of
                  which says the source published nothing. The word does. */}
              <td>{d.generation ?? 'not published'}</td>
              <td>{d.demand ?? 'not published'}</td>
              <td>{d.loadShed ?? 'not published'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sr-only">
        Load was shed in {summary.hoursShed} of {summary.total} published hours, worst at{' '}
        {model?.worstShed?.time ?? 'an unpublished hour'} with{' '}
        {formatNumber(Math.round(summary.peakShed))} MW unserved.
      </p>
    </figure>
  );
}

export default LoadCurveCanvas;
