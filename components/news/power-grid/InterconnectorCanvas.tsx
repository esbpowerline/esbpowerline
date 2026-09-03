'use client';

/**
 * East-West Interconnector Transfer — the day.
 *
 * The corridors are stacked rather than overlaid. They all run the same way on
 * every day on record, so the top edge of the stack is the total crossing — and
 * that total is a figure PGCB independently prints on P1 as "Maximum Power Flow
 * (W-E)". Three overlapping lines hid it; here it is the shape of the chart,
 * and the day's maximum is marked where it falls.
 *
 * Bands are named in place rather than against a key underneath, and scrubbing
 * gives the hour's split with each corridor's share of the crossing.
 *
 * The day wipes in west to east when the chart first comes into view, and a
 * file of dots then travels along each corridor's top edge in the direction the
 * power crosses. The dots are a direction cue and nothing more — same speed on
 * every corridor and every day, so nothing about them can be read as a figure —
 * and they stop while a reader is scrubbing. See the `.xgrid` motion block in
 * globals.css; reduced-motion readers get the finished chart, still.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { useSvgTextWidth } from '@/components/news/power-grid/useSvgTextWidth';
import { SvgProvMark, formatK, inkOn, minutesOf, niceTicks } from '@/components/news/power-grid/svgChart';

export type InterconnectorRow = { time: string; mw: (number | null)[] };

const PAD = { top: 34, right: 34, bottom: 26, left: 46 };

/** Geometry of the in-plot P/D mark, in user units. */
const MARK = { size: 11, gap: 6 };


/**
 * A corridor's name and its provenance mark, set as one unit.
 *
 * Name and mark are laid out from a common left edge and the pair is centred on
 * `x`, so the gap between them is a constant 6px whatever the name is — rather
 * than the mark being pushed out from the centre by a guess at the name's width
 * and landing on top of the last letter.
 */
function BandLabel({
  x, y, text, kind, color, minX, maxX,
}: {
  x: number; y: number; text: string; kind: 'P' | 'D';
  color: string; minX: number; maxX: number;
}) {
  const { ref, width } = useSvgTextWidth(text, 5.8);
  const total = width + MARK.gap + MARK.size;
  const left = Math.min(Math.max(x - total / 2, minX), Math.max(minX, maxX - total));
  return (
    <g>
      <text ref={ref} x={left} y={y} dy="0.34em" textAnchor="start"
        className="xgrid__band-label" fill={color}>
        {text}
      </text>
      <SvgProvMark x={left + width + MARK.gap} y={y} kind={kind} color={color} />
    </g>
  );
}

/**
 * The peak pill: a rounded plate holding the figure, its time and the mark.
 *
 * Sized from the measured text rather than a per-character guess, so the plate
 * is never a few pixels too tight around the mark or too loose around a short
 * figure — and the mark keeps the same 6px gap the band labels use.
 */
function PeakPill({
  x, y, label, color, plateColor, minX, maxX,
}: {
  x: number; y: number; label: string;
  color: string; plateColor: string; minX: number; maxX: number;
}) {
  const { ref, width } = useSvgTextWidth(label, 5.1);
  const padX = 9;
  const plateW = padX * 2 + width + MARK.gap + MARK.size;
  const left = Math.min(Math.max(x - plateW / 2, minX), Math.max(minX, maxX - plateW));
  return (
    <g>
      <rect x={left} y={y - 9} width={plateW} height={18} rx={9}
        fill="hsl(var(--card))" stroke={plateColor} strokeOpacity={0.7} />
      <text ref={ref} x={left + padX} y={y} dy="0.33em" textAnchor="start"
        className="xgrid__peak" fill={color}>
        {label}
      </text>
      <SvgProvMark x={left + padX + width + MARK.gap} y={y} kind="P" color={color} />
    </g>
  );
}





export function InterconnectorCanvas({
  corridors,
  rows,
  color,
  axisColor,
  gridColor,
  reportDate,
}: {
  corridors: string[];
  rows: InterconnectorRow[];
  color: (i: number) => string;
  axisColor: string;
  gridColor: string;
  reportDate?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(320);
  const [cursor, setCursor] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    // Measured directly first, then observed -- the same fix the forecast
    // canvas carries, for the same failure. `width` starts at 0 and `model`
    // returns null until it is set, so the whole drawing hangs on the observer
    // firing. A ResizeObserver's first callback is delivered on an animation
    // frame, and landing straight on this tab (a reload, or a ?tab=regional
    // link) does not reliably produce one -- the host measured 1430x352 while
    // the canvas held zero children and no amount of resizing recovered it.
    // The card then showed its header, its totals and its circuit bars with an
    // empty well where the chart belongs, which reads as "the flow animation
    // is gone" because every other part of the card is present.
    const measure = () => {
      const box = el.getBoundingClientRect();
      if (box.width > 0) setWidth(box.width);
      if (box.height > 0) setHeight(box.height);
    };
    measure();
    const ro = new ResizeObserver(([e]) => {
      setWidth(e.contentRect.width);
      setHeight(e.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * The reveal waits for the chart to be looked at, and replays when the day
   * changes — the tab it lives in is usually mounted off-screen, and a wipe
   * nobody saw is a wipe that never happened.
   */
  const animKey = `${reportDate ?? ''}|${rows.length}|${corridors.join('|')}`;
  useEffect(() => {
    setPlay(false);
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setPlay(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlay(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    // Nothing may ever intersect — a zero-height parent, a browser that lies.
    // Show the chart regardless; the animation is the garnish, not the dish.
    const t = window.setTimeout(() => { setPlay(true); io.disconnect(); }, 1500);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, [animKey]);

  const pts = useMemo(
    () =>
      rows
        .map((r) => ({ time: r.time, mw: r.mw, mins: minutesOf(String(r.time)) }))
        .filter((r): r is { time: string; mw: (number | null)[]; mins: number } => r.mins != null),
    [rows],
  );

  const model = useMemo(() => {
    if (!width || pts.length < 2) return null;

    const plotTop = PAD.top;
    const plotH = Math.max(60, height - plotTop - PAD.bottom);
    const plotW = Math.max(10, width - PAD.left - PAD.right);

    const t0 = pts[0].mins;
    const t1 = pts[pts.length - 1].mins;
    const span = Math.max(1, t1 - t0);
    const x = (mins: number) => PAD.left + ((mins - t0) / span) * plotW;

    const totals = pts.map((p) =>
      p.mw.reduce((s: number, v) => s + (typeof v === 'number' ? v : 0), 0),
    );
    const yMax = Math.max(...totals.map(Math.abs), 1) * 1.08;
    const y = (v: number) => plotTop + plotH - (v / yMax) * plotH;

    const bands = corridors.map((name, ci) => {
      const seg = pts.map((p) => {
        let below = 0;
        for (let k = 0; k < ci; k++) below += (typeof p.mw[k] === 'number' ? (p.mw[k] as number) : 0);
        const own = typeof p.mw[ci] === 'number' ? (p.mw[ci] as number) : 0;
        return { x: x(p.mins), yLo: y(below), yHi: y(below + own), thickness: y(below) - y(below + own) };
      });
      // Fattest half hour carries the name, but never in the outer tenth where
      // the text would hang off the plot.
      const inset = Math.max(1, Math.floor(seg.length * 0.1));
      let fat = inset;
      for (let i = inset; i < seg.length - inset; i++) if (seg[i].thickness > seg[fat].thickness) fat = i;
      const top = `M ${seg.map((s) => `${s.x} ${s.yHi}`).join(' L ')}`;
      return {
        name,
        ci,
        // Fill and top edge are separate paths: the fill takes a gradient and
        // the edge takes the saturated colour, which is what stops three solid
        // slabs reading as blocks of poster paint.
        d: `${top} L ${[...seg].reverse().map((s) => `${s.x} ${s.yLo}`).join(' L ')} Z`,
        topD: top,
        // Ideal centre only — the label clamps itself once it knows its own
        // measured width, which this pass cannot know.
        labelX: seg[fat].x,
        labelY: (seg[fat].yLo + seg[fat].yHi) / 2,
        maxThickness: seg[fat].thickness,
      };
    });

    // The day's busiest hour, marked on the stack. This is P1's own printed
    // "Maximum Power Flow (W-E)", arrived at from the EWIC sheet instead.
    let peakI = 0;
    totals.forEach((t, i) => { if (Math.abs(t) > Math.abs(totals[peakI])) peakI = i; });

    return {
      plotTop, plotH, plotW, x, y, yMax, bands, totals,
      peak: { i: peakI, mw: totals[peakI], time: pts[peakI].time },
      ticks: niceTicks(yMax),
      // Six-hour step on a phone-width card; nine 3-hour labels collide below ~560px.
      hourTicks: Array.from({ length: 9 }, (_, i) => i * 3)
        .filter((h) => (width < 560 ? h % 6 === 0 : true))
        .filter((h) => h * 60 >= t0 - 1 && h * 60 <= t1 + 1),
    };
  }, [corridors, pts, width, height]);

  const activeRow = cursor != null ? pts[cursor] : null;
  const activeTotal =
    activeRow?.mw.reduce((s: number, v) => s + (typeof v === 'number' ? v : 0), 0) ?? 0;

  const pointAt = useCallback(
    (clientX: number) => {
      const el = hostRef.current;
      if (!el || !model) return null;
      const px = clientX - el.getBoundingClientRect().left;
      let best = 0;
      let bestD = Infinity;
      pts.forEach((p, i) => {
        const d = Math.abs(model.x(p.mins) - px);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    },
    [pts, model],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setCursor((c) => Math.max(0, Math.min(pts.length - 1, (c ?? -1) + (e.key === 'ArrowRight' ? 1 : -1))));
    } else if (e.key === 'Escape') { setCursor(null); setPinned(false); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPinned((p) => !p); }
  };

  return (
    <figure className="xgrid" aria-label={`East-West interconnector transfer${reportDate ? ` on ${reportDate}` : ''}`}>
      <div
        ref={hostRef}
        className="xgrid__canvas"
        tabIndex={0}
        role="application"
        aria-label="Interconnector transfer. Use left and right arrow keys to step through the hours."
        onPointerMove={(e) => { if (!pinned) { const i = pointAt(e.clientX); if (i != null) setCursor(i); } }}
        onPointerLeave={() => { if (!pinned) setCursor(null); }}
        onPointerDown={(e) => { const i = pointAt(e.clientX); if (i != null) { setCursor(i); setPinned(true); } }}
        onKeyDown={onKey}
      >
        {model && (
          <svg
            width={width}
            height={height}
            className={[
              'xgrid__svg',
              play ? 'is-playing' : 'is-idle',
              cursor != null ? 'is-still' : '',
            ].filter(Boolean).join(' ')}
            aria-hidden="true"
          >
            <defs>
              {corridors.map((name, i) => (
                <linearGradient key={name} id={`xg-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color(i)} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={color(i)} stopOpacity={0.55} />
                </linearGradient>
              ))}
              {/* The wipe. Scaled about the plot's left edge, so it opens the
                  day in the order the hours happened. */}
              <clipPath id={`xgw-${uid}`}>
                <rect
                  className="xgrid__wipe"
                  x={PAD.left - 2}
                  y={0}
                  width={model.plotW + 4}
                  height={Math.max(height, 1)}
                  style={{ transformOrigin: `${PAD.left - 2}px 0px` }}
                />
              </clipPath>
            </defs>

            {model.ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + model.plotW}
                  y1={model.y(t)}
                  y2={model.y(t)}
                  stroke={gridColor}
                  strokeOpacity={0.3}
                  strokeDasharray="3 6"
                />
                <text x={PAD.left - 8} y={model.y(t)} dy="0.32em" textAnchor="end" className="xgrid__tick" fill={axisColor}>
                  {formatK(t)}
                </text>
              </g>
            ))}
            <text x={PAD.left - 8} y={model.plotTop - 8} textAnchor="end" className="xgrid__unit" fill={axisColor}>
              MW
            </text>

            <g clipPath={`url(#xgw-${uid})`}>
              {model.bands.map((b) => (
                <path key={b.name} d={b.d} fill={`url(#xg-${uid}-${b.ci})`} />
              ))}
              {model.bands.map((b) => (
                <path
                  key={`${b.name}-edge`}
                  d={b.topD}
                  fill="none"
                  stroke={color(b.ci)}
                  strokeWidth={1.75}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {/* The crossing, moving. Dots ride each corridor's own top edge
                  from west to east; the phase is offset per corridor so the
                  three files do not march in lockstep. Nothing here is scaled
                  to a value — see the file header. */}
              {model.bands.map((b) => (
                <path
                  key={`${b.name}-flow`}
                  className="xgrid__flow"
                  d={b.topD}
                  fill="none"
                  stroke={inkOn(color(b.ci))}
                  strokeOpacity={0.7}
                  strokeWidth={1.7}
                  style={{ animationDelay: `${900 - b.ci * 620}ms` }}
                />
              ))}
            </g>

            {/* Names and the peak land after the wipe has passed them, in one
                group so they arrive together rather than in a queue. */}
            <g className="xgrid__late">
            {/* Each corridor named on its own band, with the mark that says the
                figure is PGCB's rather than ours. Every corridor column in the
                EWIC sheet is printed; only the stack's total is arithmetic. */}
            {model.bands.map((b) =>
              b.maxThickness >= 15 ? (
                <BandLabel
                  key={`${b.name}-l`}
                  x={b.labelX}
                  y={b.labelY}
                  text={b.name}
                  kind="P"
                  color={inkOn(color(b.ci))}
                  minX={PAD.left + 6}
                  maxX={PAD.left + model.plotW - 6}
                />
              ) : null,
            )}

            {/*
              The day's maximum crossing.

              Marked P, not D, and the distinction is the whole reason it is on
              the chart: the number is arrived at here by summing the EWIC
              sheet's corridors, but PGCB prints the same figure on P1 as
              "Maximum Power Flow (W-E)". Two sheets, parsed independently,
              agreeing — so what is drawn is the published figure, and the stack
              is the evidence for it.
            */}
            {(() => {
              const px = model.x(pts[model.peak.i].mins);
              const label = `peak ${formatNumber(Math.round(Math.abs(model.peak.mw)))} MW · ${model.peak.time}`;
              const cy = Math.max(model.y(model.peak.mw) - 20, PAD.top - 4);
              return (
                <g>
                  <line x1={px} y1={model.y(model.peak.mw)} x2={px} y2={cy + 9}
                    stroke={axisColor} strokeOpacity={0.35} strokeWidth={1} />
                  <g transform={`translate(${px} ${model.y(model.peak.mw)})`}>
                    {/* Three rings, then it settles — enough to say "here",
                        not enough to keep asking for attention. */}
                    <circle className="xgrid__peak-ring" cx={0} cy={0} r={3.4}
                      fill="none" stroke={axisColor} strokeWidth={1.4} />
                    <circle cx={0} cy={0} r={3.4} fill="hsl(var(--card))"
                      stroke={axisColor} strokeWidth={1.6} />
                  </g>
                  <PeakPill
                    x={px}
                    y={cy}
                    label={label}
                    color={axisColor}
                    plateColor={gridColor}
                    minX={PAD.left}
                    maxX={PAD.left + model.plotW}
                  />
                </g>
              );
            })()}
            </g>

            {model.hourTicks.map((h, i, arr) => (
              <text
                key={h}
                x={model.x(h * 60)}
                y={model.plotTop + model.plotH + 16}
                textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}
                className="xgrid__tick"
                fill={axisColor}
              >
                {String(h % 24).padStart(2, '0')}:00
              </text>
            ))}

            {activeRow && (
              <line
                x1={model.x(activeRow.mins)}
                x2={model.x(activeRow.mins)}
                y1={model.plotTop}
                y2={model.plotTop + model.plotH}
                stroke={axisColor}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
            )}
          </svg>
        )}

        {activeRow && model && (
          <div
            className="xgrid__readout"
            style={{
              top: `${model.plotTop + 4}px`,
              left: `${Math.min(Math.max(model.x(activeRow.mins), PAD.left), PAD.left + model.plotW)}px`,
              transform:
                model.x(activeRow.mins) > PAD.left + model.plotW * 0.6
                  ? 'translate(calc(-100% - 14px), 0)'
                  : 'translate(14px, 0)',
            }}
          >
            <div className="xgrid__readout-head">
              <span>{activeRow.time}</span>
              <span className="xgrid__readout-total">
                {formatNumber(Math.round(Math.abs(activeTotal)))} MW
                {/* The corridors are published; adding them is ours. */}
                <GridProvenanceTag kind="D" className="ml-1" />
              </span>
              {pinned && <span className="xgrid__pin">pinned</span>}
            </div>
            <ul className="xgrid__readout-list">
              {corridors.map((name, i) => {
                const v = typeof activeRow.mw[i] === 'number' ? (activeRow.mw[i] as number) : null;
                return (
                  <li key={name}>
                    <span className="xgrid__swatch" style={{ background: color(i) }} />
                    <span className="xgrid__readout-name">
                      <GridProvenanceTag kind="P" className="mr-1" />
                      {name}
                    </span>
                    <span className="xgrid__readout-mw">{v == null ? '—' : formatNumber(Math.round(v))}</span>
                    <span className="xgrid__readout-pct">
                      {v != null && activeTotal !== 0 ? `${((v / activeTotal) * 100).toFixed(0)}%` : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <figcaption className="xgrid__caption">
        Corridors stacked, so the top edge is the whole crossing. Each corridor is PGCB&rsquo;s
        own column <GridProvenanceTag kind="P" />; adding them is ours <GridProvenanceTag kind="D" />.
        The travelling dots mark the direction of the crossing, west to east — a
        cue, not a figure: their speed is the same on every corridor and every day.
        Hover or use arrow keys · click to pin.
      </figcaption>
    </figure>
  );
}

export default InterconnectorCanvas;
