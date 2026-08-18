'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { minutesOf, monotonePath, type Pt } from '@/components/news/power-grid/svgChart';

/**
 * PGCB's forecast curve against the day the grid actually had.
 *
 * The first version of this was a 26-row table, which was accurate and
 * unreadable. The second was two thin lines and a flat green wash, which was
 * worse: it looked like a chart without doing a chart's job. Neither answered
 * the question a reader brings — *where did the forecast go wrong, by how much,
 * and in which direction* — and the wash in particular concealed the one thing
 * that matters most, because it shaded over-forecast and under-forecast in the
 * same colour.
 *
 * What this draws instead:
 *
 *   · Two smooth curves — forecast and measured — using the same monotone
 *     cubic as the load curve, so neither invents a megawatt between samples.
 *   · The band between them shaded BY SIGN. Amber where the grid fell short of
 *     the forecast, green where it beat it. The band is the subject of the
 *     chart, so it must say which way it went.
 *   · A signed error strip along the foot, one bar per hour, above and below a
 *     zero line. This is the actual information: at a glance, whether the
 *     misses lean one way and where the day came apart.
 *   · The evening peak marked on both curves, because that is the moment the
 *     whole report is planned around.
 *   · A hover readout giving both figures and the miss for any hour.
 *
 * The honesty constraint the drawing must not blur: hours before the report was
 * generated are dashed, unshaded and excluded from the strip. PGCB published
 * them, but they had already happened, so they are not predictions and drawing
 * them like the rest would claim an accuracy the forecast never asserted.
 */

export interface ForecastCurvePoint {
  time: string;
  forecastMw: number | null;
  actualMw: number | null;
  beforeIssue: boolean;
}

/** The signed-error strip and the gutter above it, inside the bottom padding. */
const STRIP_H = 40;
const STRIP_GAP = 12;
const AXIS_LABEL_H = 18;

const PAD = {
  top: 24,
  right: 40,
  bottom: STRIP_GAP + STRIP_H + AXIS_LABEL_H,
  left: 44,
};
// Height is fixed; width comes from the host element, so the drawing fills
// whatever column it is given. A fixed viewBox scaled to fit letterboxed the
// chart inside its own card — ~912px of drawing centred in 1480px of card,
// with the axis labels shrunk to match. VIEW_W is only the fallback for the
// first paint, before the observer reports.
const VIEW_W_FALLBACK = 900;
const VIEW_H = 300;

/**
 * An axis floor for a series that never approaches zero.
 *
 * National generation sits between roughly 13 and 18 GW; anchored at zero the
 * day's whole shape collapses into the top fifth and the chart reads flat,
 * which is the one thing this day is not. Same trade the load curve makes, paid
 * for the same way — the floor is a labelled tick like any other.
 */
function niceScale(min: number, max: number, count = 4) {
  const span = Math.max(max - min, max * 0.04, 1);
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) ?? mag * 10;
  const lo = Math.max(0, Math.floor((min - step * 0.5) / step) * step);
  const hi = Math.ceil((max + step * 0.35) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-6; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

function formatMw(v: number): string {
  if (v < 1000) return String(Math.round(v));
  const k = v / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

export function ForecastCurveCanvas({
  points,
  forecastColor,
  actualColor,
  shortColor,
  overColor,
  axisColor,
  gridColor,
  issuedClock,
  eveningPeakTime,
}: {
  points: ForecastCurvePoint[];
  forecastColor: string;
  actualColor: string;
  /** Grid below forecast. */
  shortColor: string;
  /** Grid above forecast. */
  overColor: string;
  axisColor: string;
  gridColor: string;
  issuedClock?: string | null;
  /** PGCB's own stamp for the evening peak hour, where the day states one. */
  eveningPeakTime?: string | null;
}) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const hostRef = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(VIEW_W_FALLBACK);
  const [activeMins, setActiveMins] = useState<number | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    // Measured directly first, then observed. A ResizeObserver's first callback
    // is delivered on an animation frame, and a tab that is not painting never
    // gets one — the chart then sits at its fallback width forever, which is
    // exactly what it did. Reading the box here means the correct width is in
    // place on the frame after mount whatever the tab is doing, and the
    // observer only has to handle later resizes.
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const VIEW_W = width;

  const model = useMemo(() => {
    const rows = points
      .map((p) => ({ ...p, mins: minutesOf(p.time) }))
      .filter((p): p is ForecastCurvePoint & { mins: number } => p.mins != null)
      .sort((a, b) => a.mins - b.mins);
    if (!rows.length) return null;

    const values = rows.flatMap((r) =>
      [r.forecastMw, r.actualMw].filter((v): v is number => v != null),
    );
    if (!values.length) return null;

    const { lo, hi, ticks } = niceScale(Math.min(...values), Math.max(...values));
    const plotW = VIEW_W - PAD.left - PAD.right;
    const plotH = VIEW_H - PAD.top - PAD.bottom;
    const x = (mins: number) => PAD.left + (mins / 1440) * plotW;
    const y = (v: number) => PAD.top + plotH - ((v - lo) / (hi - lo || 1)) * plotH;

    const pts = (pick: (r: (typeof rows)[number]) => number | null, keep?: (r: (typeof rows)[number]) => boolean) =>
      rows
        .filter((r) => pick(r) != null && (!keep || keep(r)))
        .map((r): Pt => ({ x: x(r.mins), y: y(pick(r)!) }));

    // Split at the issue time so the two halves of the forecast can be drawn
    // differently. The last pre-issue point is repeated as the first live one so
    // the dashed and solid strokes meet instead of leaving a gap.
    const preIssue = rows.filter((r) => r.beforeIssue);
    const live = rows.filter((r) => !r.beforeIssue);
    const bridge = preIssue.length && live.length ? [preIssue[preIssue.length - 1]] : [];

    const scored = live.filter((r) => r.forecastMw != null && r.actualMw != null);

    // The band, cut into runs of one sign so each can be filled for what it is.
    const bands: { d: string; short: boolean }[] = [];
    let run: typeof scored = [];
    let runShort: boolean | null = null;
    const flush = () => {
      if (run.length > 1 && runShort != null) {
        const top = run.map((r) => `${x(r.mins).toFixed(1)},${y(r.forecastMw!).toFixed(1)}`);
        const bot = [...run].reverse().map((r) => `${x(r.mins).toFixed(1)},${y(r.actualMw!).toFixed(1)}`);
        bands.push({ d: `M${top.join('L')}L${bot.join('L')}Z`, short: runShort });
      }
      run = [];
    };
    for (const r of scored) {
      const short = r.actualMw! < r.forecastMw!;
      if (runShort == null || short === runShort) {
        run.push(r);
        runShort = short;
      } else {
        // The crossing point belongs to both runs, or the fills leave a notch.
        run.push(r);
        flush();
        run = [r];
        runShort = short;
      }
    }
    flush();

    const errors = scored.map((r) => ({
      mins: r.mins,
      time: r.time,
      err: r.actualMw! - r.forecastMw!,
      // A half-hour sample is a different reading, not another hour, and the
      // strip says so rather than leaving two indistinguishable neighbours.
      halfHour: !/:00$/.test(r.time),
    }));
    const tightestGap = rows.reduce(
      (min, r, i) => (i === 0 ? min : Math.min(min, r.mins - rows[i - 1].mins)),
      60,
    );
    const maxAbsErr = Math.max(1, ...errors.map((e) => Math.abs(e.err)));
    const stripTop = PAD.top + plotH + STRIP_GAP;
    const stripMid = stripTop + STRIP_H / 2;

    const peakMins = eveningPeakTime ? minutesOf(eveningPeakTime) : null;
    const peak = peakMins != null ? rows.find((r) => r.mins === peakMins) : null;

    return {
      rows,
      x,
      y,
      lo,
      hi,
      ticks,
      plotW,
      plotH,
      stripTop,
      stripMid,
      maxAbsErr,
      errors,
      bands,
      forecastPast: monotonePath(pts((r) => r.forecastMw, (r) => r.beforeIssue)),
      forecastLive: monotonePath(
        [...bridge, ...live].filter((r) => r.forecastMw != null).map((r): Pt => ({ x: x(r.mins), y: y(r.forecastMw!) })),
      ),
      actual: monotonePath(pts((r) => r.actualMw)),
      issuedMins: issuedClock ? minutesOf(issuedClock) : null,
      peak,
      // Sized from the TIGHTEST gap in the day, not from the sample count.
      //
      // PGCB publishes 24 hourly readings plus half-hour samples at 18:30 and
      // 19:30 around the evening peak. Dividing the plot by 26 assumes even
      // spacing and gives every bar ~32px, while 18:00 and 18:30 sit only 28px
      // apart — so the five bars across the peak overlapped into a solid block
      // exactly where the day is most interesting. The load curve next door hit
      // this and solved it the same way; width carries no meaning on either
      // chart, so one narrow width that clears the closest pair is correct.
      barW: Math.max(2, tightestGap * (plotW / 1440) * 0.78),
    };
  }, [points, issuedClock, eveningPeakTime, VIEW_W]);

  const onMove = useCallback(
    (ev: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !model) return;
      const box = svg.getBoundingClientRect();
      const px = ((ev.clientX - box.left) / box.width) * VIEW_W;
      const mins = ((px - PAD.left) / model.plotW) * 1440;
      let best: number | null = null;
      let bestD = Infinity;
      for (const r of model.rows) {
        const d = Math.abs(r.mins - mins);
        if (d < bestD) {
          bestD = d;
          best = r.mins;
        }
      }
      setActiveMins(bestD <= 60 ? best : null);
    },
    [model, VIEW_W],
  );

  if (!model) return null;
  const active = activeMins == null ? null : model.rows.find((r) => r.mins === activeMins) ?? null;
  const activeErr =
    active && active.forecastMw != null && active.actualMw != null
      ? active.actualMw - active.forecastMw
      : null;

  return (
    <figure
      ref={hostRef as React.RefObject<HTMLElement>}
      className="forecast-curve relative"
      aria-label="PGCB forecast generation against measured generation"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        width={VIEW_W}
        height={VIEW_H}
        className="block w-full touch-none"
        onPointerMove={onMove}
        onPointerLeave={() => setActiveMins(null)}
      >
        <defs>
          <linearGradient id={`fc-short-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shortColor} stopOpacity={0.32} />
            <stop offset="100%" stopColor={shortColor} stopOpacity={0.14} />
          </linearGradient>
          <linearGradient id={`fc-over-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={overColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={overColor} stopOpacity={0.12} />
          </linearGradient>
        </defs>

        {model.ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={VIEW_W - PAD.right}
              y1={model.y(t)}
              y2={model.y(t)}
              stroke={gridColor}
              strokeOpacity={0.45}
              strokeWidth={0.7}
            />
            <text x={PAD.left - 7} y={model.y(t) + 3.5} textAnchor="end" fontSize={9.5} fill={axisColor}>
              {formatMw(t)}
            </text>
          </g>
        ))}

        {/* Everything left of this line is hindsight, not forecast. */}
        {model.issuedMins != null && (
          <g>
            <rect
              x={PAD.left}
              y={PAD.top}
              width={Math.max(0, model.x(model.issuedMins) - PAD.left)}
              height={model.plotH}
              fill={axisColor}
              opacity={0.045}
            />
            <line
              x1={model.x(model.issuedMins)}
              x2={model.x(model.issuedMins)}
              y1={PAD.top}
              y2={model.stripTop + STRIP_H}
              stroke={axisColor}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.6}
            />
            <text x={model.x(model.issuedMins) - 6} y={PAD.top + 10} textAnchor="end" fontSize={9} fill={axisColor} opacity={0.85}>
              already happened
            </text>
            <text x={model.x(model.issuedMins) + 6} y={PAD.top + 10} fontSize={9} fill={axisColor} opacity={0.85}>
              forecast from {issuedClock}
            </text>
          </g>
        )}

        {model.bands.map((b, i) => (
          <path key={i} d={b.d} fill={`url(#fc-${b.short ? 'short' : 'over'}-${uid})`} />
        ))}

        {model.forecastPast && (
          <path d={model.forecastPast} fill="none" stroke={forecastColor} strokeWidth={1.7} strokeDasharray="5 4" opacity={0.55} />
        )}
        {model.forecastLive && (
          <path d={model.forecastLive} fill="none" stroke={forecastColor} strokeWidth={2.4} strokeLinecap="round" />
        )}
        {model.actual && (
          <path d={model.actual} fill="none" stroke={actualColor} strokeWidth={2.4} strokeLinecap="round" />
        )}

        {/* The evening peak — the moment the whole report is planned around. */}
        {model.peak && model.peak.actualMw != null && (
          <g>
            <line
              x1={model.x(model.peak.mins)}
              x2={model.x(model.peak.mins)}
              y1={model.y(model.peak.actualMw)}
              y2={PAD.top + model.plotH}
              stroke={actualColor}
              strokeWidth={0.9}
              strokeDasharray="2 3"
              opacity={0.5}
            />
            {model.peak.forecastMw != null && (
              <circle cx={model.x(model.peak.mins)} cy={model.y(model.peak.forecastMw)} r={3.4} fill={forecastColor} stroke="var(--card,#fff)" strokeWidth={1.4} />
            )}
            <circle cx={model.x(model.peak.mins)} cy={model.y(model.peak.actualMw)} r={4} fill={actualColor} stroke="var(--card,#fff)" strokeWidth={1.5} />
            <text
              x={model.x(model.peak.mins)}
              y={model.y(model.peak.actualMw) - 10}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill={actualColor}
            >
              evening peak
            </text>
          </g>
        )}

        {/* ── signed error strip ── */}
        <text x={PAD.left - 7} y={model.stripMid + 3} textAnchor="end" fontSize={8.5} fill={axisColor} opacity={0.9}>
          miss
        </text>
        <line
          x1={PAD.left}
          x2={VIEW_W - PAD.right}
          y1={model.stripMid}
          y2={model.stripMid}
          stroke={axisColor}
          strokeOpacity={0.45}
          strokeWidth={0.8}
        />
        {model.errors.map((e) => {
          const h = (Math.abs(e.err) / model.maxAbsErr) * (STRIP_H / 2 - 2);
          const short = e.err < 0;
          // Nudged inside the plot rather than trimmed to it: bars are centred
          // on their sample, so midnight and 23:00 hung half outside the frame
          // and the strip read wider than the chart above it.
          const left = Math.min(
            Math.max(model.x(e.mins) - model.barW / 2, PAD.left),
            PAD.left + model.plotW - model.barW,
          );
          return (
            <rect
              key={e.time}
              x={left}
              y={short ? model.stripMid : model.stripMid - h}
              width={model.barW}
              height={Math.max(1.5, h)}
              rx={1}
              fill={short ? shortColor : overColor}
              // Once every bar is one width there is nothing left to say which
              // readings are the half hours, so they carry a hairline outline.
              // Not a different colour: the fill already encodes the SIGN of
              // the miss, and a second meaning on the same channel would make
              // both unreadable.
              stroke={e.halfHour ? axisColor : undefined}
              strokeWidth={e.halfHour ? 0.7 : undefined}
              strokeOpacity={e.halfHour ? 0.65 : undefined}
              opacity={activeMins == null || activeMins === e.mins ? 0.85 : 0.32}
            />
          );
        })}

        {[0, 360, 720, 1080, 1440].map((m) => (
          <text
            key={m}
            x={model.x(m)}
            y={model.stripTop + STRIP_H + 13}
            textAnchor={m === 0 ? 'start' : m === 1440 ? 'end' : 'middle'}
            fontSize={9.5}
            fill={axisColor}
          >
            {String(Math.floor(m / 60)).padStart(2, '0')}:00
          </text>
        ))}

        {active && (
          <g>
            <line
              x1={model.x(active.mins)}
              x2={model.x(active.mins)}
              y1={PAD.top}
              y2={model.stripTop + STRIP_H}
              stroke={axisColor}
              strokeOpacity={0.4}
              strokeWidth={1}
            />
            {active.forecastMw != null && (
              <circle cx={model.x(active.mins)} cy={model.y(active.forecastMw)} r={4.2} fill={forecastColor} stroke="var(--card,#fff)" strokeWidth={1.5} />
            )}
            {active.actualMw != null && (
              <circle cx={model.x(active.mins)} cy={model.y(active.actualMw)} r={4.2} fill={actualColor} stroke="var(--card,#fff)" strokeWidth={1.5} />
            )}
          </g>
        )}
      </svg>

      {/* HTML over the SVG: crisp type and the card's own styles, rather than
          re-implementing a panel in SVG text. */}
      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-border/60 bg-popover/95 px-2.5 py-1.5 text-[10px] shadow-lg backdrop-blur-sm"
          style={{
            left: `${Math.min(Math.max((model.x(active.mins) / VIEW_W) * 100, 6), 78)}%`,
          }}
        >
          <div className="font-bold text-foreground tabular-nums">
            {active.time}
            {active.beforeIssue && (
              <span className="ml-1.5 font-normal text-muted-foreground">already happened</span>
            )}
          </div>
          <div className="mt-0.5 space-y-0.5 text-muted-foreground">
            <div>
              Forecast{' '}
              <span className="tabular-nums font-semibold text-foreground">
                {active.forecastMw == null ? '—' : `${formatNumber(Math.round(active.forecastMw))} MW`}
              </span>
            </div>
            <div>
              Measured{' '}
              <span className="tabular-nums font-semibold text-foreground">
                {active.actualMw == null ? '—' : `${formatNumber(Math.round(active.actualMw))} MW`}
              </span>
            </div>
            {activeErr != null && !active.beforeIssue && (
              <div className="border-t border-border/40 pt-0.5">
                Miss{' '}
                <span
                  className="tabular-nums font-bold"
                  style={{ color: activeErr < 0 ? shortColor : overColor }}
                >
                  {activeErr > 0 ? '+' : '−'}
                  {formatNumber(Math.abs(Math.round(activeErr)))} MW
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <figcaption className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: forecastColor }} />
          Forecast
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: actualColor }} />
          Measured
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: shortColor, opacity: 0.45 }} />
          Grid fell short of forecast
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: overColor, opacity: 0.45 }} />
          Grid beat forecast
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-sm border"
            style={{ borderColor: axisColor, background: 'transparent' }}
          />
          18:30 / 19:30 half-hour reading
        </span>
        <span className="text-muted-foreground/80">Hover for any hour</span>
      </figcaption>
    </figure>
  );
}
