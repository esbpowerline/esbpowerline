'use client';

/**
 * Generation Mix Through the Day — the dispatch stack.
 *
 * The same half-hourly fuel split as before, composed to answer the question a
 * mix chart is actually asked: *what is holding the grid up right now, and what
 * had to be called in to do it?*
 *
 * Two things make that legible, and the old chart had neither.
 *
 * **Merit order.** The bands were stacked in the order the groups happened to
 * be declared — coal, gas, oil, imports, wind, HSD, hydro, solar — which is
 * alphabet-adjacent and tells no story. They are now stacked the way a grid is
 * actually dispatched: the plant that never stops at the bottom, the plant that
 * only runs when nothing else can meet the load at the top. The result is a day
 * that reads itself. A flat coal and gas foundation. Hydro and contracted
 * imports above it, near-constant. A solar arc swelling out of nothing at six
 * and gone by six. And oil — the most expensive thing on the system — rising at
 * the top precisely when the evening peak bites, which is the single most
 * important fact about how Bangladesh runs its grid.
 *
 * **Bands named where they are.** A stacked area with eight series and a legend
 * underneath asks the reader to match colours against a key. Each band is
 * instead labelled in place, at its own widest point, whenever it is thick
 * enough to hold the text.
 *
 * Shortage is drawn, but never stacked. It is not generation — it is the load
 * that was disconnected — so it sits above the stack as an outlined ghost band,
 * which makes the top edge of the whole figure the demand the grid was facing.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { useSvgTextWidth } from '@/components/news/power-grid/useSvgTextWidth';
import type { EnergyCurvePoint, ENERGY_CURVE_GROUPS } from '@/lib/data/grid/energy-curve';
import { formatK, inkOn, minutesOf, niceTicks } from '@/components/news/power-grid/svgChart';

type Group = (typeof ENERGY_CURVE_GROUPS)[number];

export type MixBreakdown = Map<string, { time: string; parts: { label: string; mw: number }[] }[]>;

/**
 * Dispatch order, bottom of the stack first.
 *
 * Roughly ascending marginal cost, which is also roughly "how reluctantly the
 * system calls on it". Coal and gas carry the base; hydro and the contracted
 * interconnectors sit on top of that almost flat; wind and solar are must-run
 * and appear when the weather allows; oil-fired plant is the expensive
 * last resort and belongs at the top where its evening ramp is visible against
 * the sky rather than buried between two other bands.
 */
export const MERIT_ORDER = [
  'Coal',
  'Gas',
  'Hydro',
  'Imports',
  'Wind',
  'Solar',
  'HFO',
  'Oil (HFO+HSD)',
  'HSD',
];

const PAD = { top: 22, right: 38, bottom: 26, left: 38 };

/**
 * A band's name, centred on the thickest point of the band and kept inside the
 * plot by its own measured width — a band fattest at midnight used to push its
 * name half outside the frame, and the guess that replaced that clamp was only
 * right for a string of average letters.
 */
function BandName({
  x, y, text, color, minX, maxX,
}: {
  x: number; y: number; text: string; color: string; minX: number; maxX: number;
}) {
  const { ref, width } = useSvgTextWidth(text, 5.9);
  const left = Math.min(Math.max(x - width / 2, minX), Math.max(minX, maxX - width));
  return (
    <text ref={ref} x={left} y={y} dy="0.34em" textAnchor="start"
      className="genmix__band-label" fill={color}>
      {text}
    </text>
  );
}





export function GenerationMixCanvas({
  points,
  active,
  breakdown,
  shortage,
  fuelColor,
  axisColor,
  gridColor,
  shortageColor,
  reportDate,
}: {
  points: EnergyCurvePoint[];
  active: Group[];
  breakdown: MixBreakdown;
  /** Half-hourly shedding, from the same sheet. Not part of the stack. */
  shortage: { time: string; mw: number }[];
  fuelColor: (name: string) => string;
  axisColor: string;
  gridColor: string;
  shortageColor: string;
  reportDate?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(380);
  const [cursor, setCursor] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const [mode, setMode] = useState<'mw' | 'share'>('mw');
  const [showShortage, setShowShortage] = useState(true);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setWidth(e.contentRect.width);
      setHeight(e.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Groups in dispatch order, with anything unlisted kept at the top. */
  const ordered = useMemo(() => {
    const rank = (g: Group) => {
      const i = MERIT_ORDER.indexOf(g.name);
      return i === -1 ? MERIT_ORDER.length : i;
    };
    return [...active].sort((a, b) => rank(a) - rank(b));
  }, [active]);

  const rows = useMemo(
    () =>
      points
        .map((p) => ({ ...p, mins: minutesOf(String(p.time)) }))
        .filter((p): p is EnergyCurvePoint & { mins: number } => p.mins != null),
    [points],
  );

  const shortageAt = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of shortage) m.set(s.time, s.mw);
    return m;
  }, [shortage]);

  const model = useMemo(() => {
    if (!width || rows.length < 2) return null;

    const plotW = Math.max(10, width - PAD.left - PAD.right);
    const plotH = Math.max(40, height - PAD.top - PAD.bottom);
    const t0 = rows[0].mins;
    const t1 = rows[rows.length - 1].mins;
    const span = Math.max(1, t1 - t0);
    const x = (mins: number) => PAD.left + ((mins - t0) / span) * plotW;

    const totalAt = rows.map((r) => ordered.reduce((s, g) => s + ((r[g.name] as number) || 0), 0));
    const peakTotal = Math.max(...totalAt, 1);
    const peakWithShort = Math.max(
      ...rows.map((r, i) => totalAt[i] + (showShortage ? shortageAt.get(String(r.time)) ?? 0 : 0)),
      1,
    );

    // Share mode normalises generation to 100 at every instant — but the
    // unserved band sits *above* that, so a fixed ceiling of 100 pushed it out
    // through the top of the plot and over the mode toggle. The ceiling makes
    // room for the worst half hour's shortfall; the 100% line stays labelled
    // where it belongs, so the stack still reads as a full mix.
    const maxShortShare = Math.max(
      0,
      ...rows.map((r, i) =>
        totalAt[i] > 0 ? ((shortageAt.get(String(r.time)) ?? 0) * 100) / totalAt[i] : 0,
      ),
    );
    const yMax =
      mode === 'share'
        ? 100 + (showShortage ? maxShortShare * 1.06 : 0)
        : peakWithShort * 1.04;
    const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

    /** Cumulative boundaries, bottom band first. */
    const bands = ordered.map((g, gi) => {
      const pts = rows.map((r, i) => {
        let below = 0;
        for (let k = 0; k < gi; k++) below += (r[ordered[k].name] as number) || 0;
        const own = (r[g.name] as number) || 0;
        const scale = mode === 'share' ? (totalAt[i] > 0 ? 100 / totalAt[i] : 0) : 1;
        return {
          x: x(r.mins),
          yLo: y(below * scale),
          yHi: y((below + own) * scale),
          own,
          thickness: y(below * scale) - y((below + own) * scale),
        };
      });
      const top = pts.map((p) => `${p.x} ${p.yHi}`).join(' L ');
      const bottom = [...pts].reverse().map((p) => `${p.x} ${p.yLo}`).join(' L ');

      // The thickest half hour carries the label — but a band that is fattest
      // at midnight or at 23:00 put its name half outside the frame ("HFO" ran
      // to x=27 against a plot starting at 38, "Imports" to 1412 against 1392).
      // The search skips the outer tenth at each end so the label lands on the
      // band rather than on its edge, and what it finds is then clamped by the
      // text's own estimated width.
      const inset = Math.max(1, Math.floor(pts.length * 0.1));
      let fattest = inset;
      for (let i = inset; i < pts.length - inset; i++) {
        if (pts[i].thickness > pts[fattest].thickness) fattest = i;
      }
      // Ideal centre only. The clamp needs the label's real width, which this
      // pass cannot know — `BandName` measures its own text and clamps there.
      const labelX = pts[fattest].x;
      return {
        group: g,
        d: `M ${top} L ${bottom} Z`,
        labelX,
        labelY: (pts[fattest].yLo + pts[fattest].yHi) / 2,
        maxThickness: pts[fattest].thickness,
      };
    });

    // Shortage rides on top of the stack — never inside it.
    const shortPts = rows.map((r, i) => {
      const s = shortageAt.get(String(r.time)) ?? 0;
      const scale = mode === 'share' ? (totalAt[i] > 0 ? 100 / totalAt[i] : 0) : 1;
      const base = mode === 'share' ? 100 : totalAt[i];
      return { x: x(r.mins), yLo: y(base), yHi: y(base + s * scale), mw: s };
    });
    const shortD = shortPts.some((p) => p.mw > 0)
      ? `M ${shortPts.map((p) => `${p.x} ${p.yHi}`).join(' L ')} L ${[...shortPts]
          .reverse()
          .map((p) => `${p.x} ${p.yLo}`)
          .join(' L ')} Z`
      : '';

    const ticks = mode === 'share' ? [0, 25, 50, 75, 100] : niceTicks(yMax);

    const hourTicks = Array.from({ length: 9 }, (_, i) => i * 3).filter(
      (h) => h * 60 >= t0 - 1 && h * 60 <= t1 + 1,
    );

    return { plotW, plotH, x, y, yMax, bands, shortD, ticks, hourTicks, t0, t1, totalAt, peakTotal };
  }, [rows, ordered, width, height, mode, showShortage, shortageAt]);

  const activeRow = cursor != null ? rows[cursor] : null;

  const pointAt = useCallback(
    (clientX: number) => {
      const el = hostRef.current;
      if (!el || !model) return null;
      const px = clientX - el.getBoundingClientRect().left;
      let best = 0;
      let bestD = Infinity;
      rows.forEach((r, i) => {
        const d = Math.abs(model.x(r.mins) - px);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    },
    [rows, model],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setCursor((c) => Math.max(0, Math.min(rows.length - 1, (c ?? -1) + (e.key === 'ArrowRight' ? 1 : -1))));
    } else if (e.key === 'Escape') { setCursor(null); setPinned(false); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPinned((p) => !p); }
  };

  const readout = useMemo(() => {
    if (!activeRow) return null;
    const total = ordered.reduce((s, g) => s + ((activeRow[g.name] as number) || 0), 0);
    const short = shortageAt.get(String(activeRow.time)) ?? 0;
    const items = [...ordered]
      .reverse()
      .map((g) => {
        const parts = breakdown.get(g.name)?.find((b) => b.time === activeRow.time)?.parts ?? [];
        return {
          name: g.name,
          mw: (activeRow[g.name] as number) || 0,
          color: fuelColor(g.name),
          parts,
          // Whether this figure is PGCB's own column or our addition depends on
          // the fuel *and* the half hour. Coal, hydro, wind and solar are one
          // column each, so the number is published as it stands. Gas and HFO
          // fold public and private plant; imports folds four interconnectors —
          // those are sums, and are marked as ours. A group whose second column
          // happens to be idle reverts to P, because on that half hour the
          // figure really is the one published column.
          derived: parts.length > 1,
        };
      })
      .filter((i) => i.mw > 0);
    return { total, short, items };
  }, [activeRow, ordered, breakdown, fuelColor, shortageAt]);

  return (
    <figure className="genmix" aria-label={`Generation mix by fuel${reportDate ? ` on ${reportDate}` : ''}`}>
      <div className="genmix__controls">
        <div className="genmix__modes" role="group" aria-label="Chart scale">
          <button type="button" onClick={() => setMode('mw')} aria-pressed={mode === 'mw'}
            className={`genmix__mode${mode === 'mw' ? ' genmix__mode--on' : ''}`}>
            Megawatts
          </button>
          <button type="button" onClick={() => setMode('share')} aria-pressed={mode === 'share'}
            className={`genmix__mode${mode === 'share' ? ' genmix__mode--on' : ''}`}>
            Share of mix
          </button>
        </div>
        <label className="genmix__toggle">
          <input type="checkbox" checked={showShortage} onChange={(e) => setShowShortage(e.target.checked)} />
          Show unserved load above the stack
        </label>
      </div>

      <div
        ref={hostRef}
        className="genmix__canvas"
        tabIndex={0}
        role="application"
        aria-label="Generation mix. Use left and right arrow keys to step through the half hours."
        onPointerMove={(e) => { if (!pinned) { const i = pointAt(e.clientX); if (i != null) setCursor(i); } }}
        onPointerLeave={() => { if (!pinned) setCursor(null); }}
        onPointerDown={(e) => { const i = pointAt(e.clientX); if (i != null) { setCursor(i); setPinned(true); } }}
        onKeyDown={onKey}
      >
        {model && (
          <svg width={width} height={height} className="genmix__svg" aria-hidden="true">
            <defs>
              <pattern id={`short-${uid}`} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke={shortageColor} strokeWidth="2" strokeOpacity="0.5" />
              </pattern>
            </defs>

            {model.ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + model.plotW} y1={model.y(t)} y2={model.y(t)}
                  stroke={gridColor} strokeOpacity={0.3} strokeDasharray="3 6" />
                <text x={PAD.left - 8} y={model.y(t)} dy="0.32em" textAnchor="end"
                  className="genmix__tick" fill={axisColor}>
                  {mode === 'share' ? `${Math.round(t)}%` : formatK(t)}
                </text>
              </g>
            ))}
            <text x={PAD.left - 8} y={PAD.top - 8} textAnchor="end" className="genmix__unit" fill={axisColor}>
              {mode === 'share' ? '%' : 'MW'}
            </text>

            {/* The stack, bottom of the merit order first. */}
            {model.bands.map((b) => (
              <path key={b.group.name} d={b.d} fill={fuelColor(b.group.name)}
                fillOpacity={0.92} stroke="hsl(var(--card))" strokeWidth={0.6} />
            ))}

            {/* Unserved load: outlined and hatched, never filled like a fuel —
                it is the load that was cut, not a thing that generated. */}
            {showShortage && model.shortD && (
              <path d={model.shortD} fill={`url(#short-${uid})`} stroke={shortageColor}
                strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.8} />
            )}

            {/* Each band named where it is thickest, so the eye never has to
                travel to a key and back. */}
            {model.bands.map((b) =>
              b.maxThickness >= 16 ? (
                <BandName
                  key={`${b.group.name}-lbl`}
                  x={b.labelX}
                  y={b.labelY}
                  text={b.group.name}
                  color={inkOn(fuelColor(b.group.name))}
                  minX={PAD.left + 4}
                  maxX={PAD.left + model.plotW - 4}
                />
              ) : null,
            )}

            {model.hourTicks.map((h, i, arr) => (
              <text key={h} x={model.x(h * 60)} y={PAD.top + model.plotH + 16}
                textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}
                className="genmix__tick" fill={axisColor}>
                {String(h % 24).padStart(2, '0')}:00
              </text>
            ))}

            {activeRow && (
              <line x1={model.x(activeRow.mins)} x2={model.x(activeRow.mins)}
                y1={PAD.top} y2={PAD.top + model.plotH}
                stroke={axisColor} strokeOpacity={0.55} strokeWidth={1} />
            )}
          </svg>
        )}

        {readout && activeRow && model && (
          <div
            className="genmix__readout"
            style={{
              left: `${Math.min(Math.max(model.x(activeRow.mins), PAD.left), PAD.left + model.plotW)}px`,
              transform: model.x(activeRow.mins) > PAD.left + model.plotW * 0.6
                ? 'translate(calc(-100% - 14px), 0)' : 'translate(14px, 0)',
            }}
          >
            <div className="genmix__readout-head">
              <span>{String(activeRow.time)}</span>
              <span className="genmix__readout-total">
                {formatNumber(Math.round(readout.total))} MW
                <GridProvenanceTag kind="D" className="ml-1" />
              </span>
              {pinned && <span className="genmix__pin">pinned</span>}
            </div>
            <ul className="genmix__readout-list">
              {readout.items.map((it) => (
                <li key={it.name}>
                  <span className="genmix__swatch" style={{ background: it.color }} />
                  <span className="genmix__readout-name">
                    <GridProvenanceTag kind={it.derived ? 'D' : 'P'} className="mr-1" />
                    {it.name}
                  </span>
                  <span className="genmix__readout-mw">{formatNumber(Math.round(it.mw))}</span>
                  <span className="genmix__readout-pct">
                    {readout.total > 0 ? `${((it.mw / readout.total) * 100).toFixed(1)}%` : '—'}
                  </span>
                  {/* The sheet's own public/private and per-interconnector split,
                      which the eight-colour grouping folds away everywhere else. */}
                  {it.parts.length > 1 && (
                    <span className="genmix__readout-parts">
                      {it.parts.map((p) => `${p.label} ${formatNumber(Math.round(p.mw))}`).join(' · ')}
                    </span>
                  )}
                </li>
              ))}
              {readout.short > 0 && (
                <li className="genmix__readout-short">
                  <span className="genmix__swatch genmix__swatch--hatch" style={{ borderColor: shortageColor }} />
                  <span className="genmix__readout-name">
                    <GridProvenanceTag kind="P" className="mr-1" />
                    Unserved load
                  </span>
                  <span className="genmix__readout-mw">{formatNumber(Math.round(readout.short))}</span>
                  <span className="genmix__readout-pct">
                    {((readout.short / (readout.total + readout.short)) * 100).toFixed(1)}%
                  </span>
                </li>
              )}
            </ul>
            {/* Tagging all eight share figures would double the marks in a panel
                this size; the column is ours in every row, so it is said once. */}
            <p className="genmix__readout-foot">
              Shares are each fuel against the half-hour total
              <GridProvenanceTag kind="D" className="ml-1" />
            </p>
          </div>
        )}
      </div>

      <figcaption className="genmix__caption">
        <span className="genmix__note">
          Stacked in dispatch order <GridProvenanceTag kind="D" /> — always-on plant at the
          foot, last-resort plant at the top. Hover or use arrow keys · click to pin.
        </span>
      </figcaption>
    </figure>
  );
}

export default GenerationMixCanvas;
