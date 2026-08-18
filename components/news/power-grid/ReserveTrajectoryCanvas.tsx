'use client';

/**
 * Gas reserve depletion, drawn the way the industry draws it.
 *
 * Below: the production profile — every field's output stacked, history and
 * forecast on one axis. It is the standard shape of a reserves report for a
 * reason. A national total falling from 2.5 to 1.6 BCFD is a line going down;
 * the same fall as a stack shows *which* wedge is collapsing, and here one
 * wedge is nearly half the country. Six fields are named and the remaining
 * fifteen are aggregated, because a stack nobody can read is decoration.
 *
 * Above: what is left underground, as a filled balance. The published reserve
 * statements are marked where they fall and deliberately not joined — between
 * statements the balance moves for two reasons, gas produced (this archive
 * measures it) and reserves re-estimated (nobody outside Petrobangla can), and
 * a smooth curve through them would assert the second never happened. It did,
 * by more than a year's production in FY2023-24.
 *
 * The forward view is a band. Its edges are not moods about the future: they
 * are the two ways of resolving a disagreement between the inputs — hold the
 * fields to their booked 2P and output must fall faster than it has been, or
 * hold them to their measured decline and the booked reserves cannot cover it.
 * The stack itself follows the 2P-binding edge, which is the conservative one
 * for a reader planning around supply.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { useSvgTextWidth } from '@/components/news/power-grid/useSvgTextWidth';
import {
  fractionalYear,
  type ReserveModel,
  type ReserveTrajectoryPoint,
} from '@/lib/data/macro/reserveModel';
import { SvgProvMark, inkOn, niceTicks } from '@/components/news/power-grid/svgChart';

const PAD = { top: 24, right: 16, bottom: 26, left: 48 };
const GAP = 34;
const STOCK_SHARE = 0.36;

export interface ReserveTrajectoryColors {
  axis: string;
  grid: string;
  measured: string;
  reserves: string;
  decline: string;
  flat: string;
  palette: (i: number) => string;
}




/** A caption on the plot, kept inside it by its own measured width. */
function PlotNote({
  x, y, text, color, anchorLeft = true, minX, maxX,
}: {
  x: number; y: number; text: string; color: string;
  anchorLeft?: boolean; minX: number; maxX: number;
}) {
  const { ref, width } = useSvgTextWidth(text, 5.2);
  const left = anchorLeft ? x : x - width;
  const clamped = Math.min(Math.max(left, minX), Math.max(minX, maxX - width));
  return (
    <text ref={ref} x={clamped} y={y} className="rtraj__note" fill={color} textAnchor="start">
      {text}
    </text>
  );
}

/** A field's name written across its own wedge. */
function WedgeLabel({
  x, y, text, color, minX, maxX,
}: {
  x: number; y: number; text: string; color: string; minX: number; maxX: number;
}) {
  const { ref, width } = useSvgTextWidth(text, 5.6);
  const left = Math.min(Math.max(x - width / 2, minX), Math.max(minX, maxX - width));
  return (
    <text ref={ref} x={left} y={y} dy="0.34em" textAnchor="start"
      className="rtraj__wedge" fill={color}>
      {text}
    </text>
  );
}

/** "2020-06" -> "Jun 2020". */
function formatIsoMonth(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
}

function formatMonth(year: number): string {
  const y = Math.floor(year);
  const m = Math.min(11, Math.max(0, Math.floor((year - y) * 12)));
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]} ${y}`;
}

export function ReserveTrajectoryCanvas({
  model,
  colors,
  horizonYears = 15,
}: {
  model: ReserveModel;
  colors: ReserveTrajectoryColors;
  horizonYears?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(460);
  const [cursorYear, setCursorYear] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const [play, setPlay] = useState(false);

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

  useEffect(() => {
    setPlay(false);
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setPlay(true); return; }
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setPlay(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    const t = window.setTimeout(() => { setPlay(true); io.disconnect(); }, 1500);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, [model.as_of]);

  const geom = useMemo(() => {
    if (!width || !model.profile) return null;

    const asOf = fractionalYear(model.as_of);
    const profile = model.profile;
    const names = profile.fields;
    const firstMonth = profile.history[0]?.month;
    const x0 = (firstMonth ? Number(firstMonth.slice(0, 4)) : asOf) - 0.3;
    const x1 = asOf + horizonYears;

    const plotW = Math.max(10, width - PAD.left - PAD.right);
    const totalH = Math.max(240, height - PAD.top - PAD.bottom - GAP);
    const stockH = Math.round(totalH * STOCK_SHARE);
    const rateH = totalH - stockH;
    const stockTop = PAD.top;
    const rateTop = stockTop + stockH + GAP;

    const x = (year: number) => PAD.left + ((year - x0) / (x1 - x0)) * plotW;

    // ── the stock plot ────────────────────────────────────────────────────
    const anchors = model.history.anchors;
    const stockMax = Math.ceil(
      (Math.max(...anchors.map((a) => a.producing_remaining_bcf),
        model.now.producing_remaining_bcf) / 1000) * 1.15 * 2,
    ) / 2;
    const inHorizon = (p: ReserveTrajectoryPoint) => asOf + p.m / 12 <= x1 + 0.01;
    const netDecline = model.trajectory.decline_binding.filter(inHorizon)
      .map((p) => (p.left - (p.over ?? 0)) / 1000);
    const stockFloor = Math.floor(Math.min(0, ...netDecline) * 2) / 2;
    const yStock = (tcf: number) =>
      stockTop + stockH - ((tcf - stockFloor) / (stockMax - stockFloor)) * stockH;

    const reservesPts = model.trajectory.reserves_binding.filter(inHorizon);
    const declinePts = model.trajectory.decline_binding.filter(inHorizon);
    const line = (pts: ReserveTrajectoryPoint[], v: (p: ReserveTrajectoryPoint) => number) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(asOf + p.m / 12)} ${yStock(v(p))}`).join(' ');

    const reservesLine = line(reservesPts, (p) => p.left / 1000);
    const declineLine = line(declinePts, (p) => (p.left - (p.over ?? 0)) / 1000);
    // The balance as a filled body rather than a hairline: a reserve draining is
    // a volume, and the eye reads area better than it reads slope.
    const lastRes = reservesPts[reservesPts.length - 1];
    const reservesArea = lastRes
      ? `${reservesLine} L ${x(asOf + lastRes.m / 12)} ${yStock(0)} L ${x(asOf)} ${yStock(0)} Z`
      : '';
    const bandArea = reservesPts.length && declinePts.length
      ? `M ${reservesPts.map((p) => `${x(asOf + p.m / 12)} ${yStock(p.left / 1000)}`).join(' L ')} L ${[...declinePts].reverse().map((p) => `${x(asOf + p.m / 12)} ${yStock((p.left - (p.over ?? 0)) / 1000)}`).join(' L ')} Z`
      : '';
    const flatLine = line(model.trajectory.flat.filter(inHorizon), (p) => p.left / 1000);

    const lastAnchor = anchors[anchors.length - 1];
    const measuredStock = lastAnchor
      ? `M ${x(fractionalYear(lastAnchor.as_of))} ${yStock(lastAnchor.producing_remaining_bcf / 1000)} L ${x(asOf)} ${yStock(model.now.producing_remaining_bcf / 1000)}`
      : '';
    const measuredStockArea = lastAnchor
      ? `${measuredStock} L ${x(asOf)} ${yStock(0)} L ${x(fractionalYear(lastAnchor.as_of))} ${yStock(0)} Z`
      : '';

    // ── the production profile ────────────────────────────────────────────
    const histCols = profile.history.map((h) => {
      const [yy, mm] = h.month.split('-').map(Number);
      return { year: yy + (mm - 0.5) / 12, v: h.v };
    }).filter((c) => c.year >= x0);
    const fcCols = profile.forecast
      .map((f) => ({ year: asOf + f.m / 12, v: f.v }))
      .filter((c) => c.year <= x1 + 0.01);

    const totalOf = (v: number[]) => v.reduce((s, n) => s + n, 0);
    const rateMax = Math.ceil(
      (Math.max(...histCols.map((c) => totalOf(c.v)), ...fcCols.map((c) => totalOf(c.v))) * 1.06) / 250,
    ) * 250;
    const yRate = (mmcfd: number) => rateTop + rateH - (mmcfd / rateMax) * rateH;

    /** One wedge as a closed path across a run of columns. */
    const wedge = (cols: { year: number; v: number[] }[], i: number) => {
      if (cols.length < 2) return '';
      const top = cols.map((c) => {
        const below = c.v.slice(0, i).reduce((s, n) => s + n, 0);
        return `${x(c.year)} ${yRate(below + c.v[i])}`;
      });
      const bottom = [...cols].reverse().map((c) => {
        const below = c.v.slice(0, i).reduce((s, n) => s + n, 0);
        return `${x(c.year)} ${yRate(below)}`;
      });
      return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
    };

    // Where to write each name.
    //
    // Not "the fattest column of its own wedge": several fields peak in the same
    // month, so every label landed on the same slice of the chart in a pile.
    // Each name gets its own column instead, spread across the measured span,
    // and is dropped if its wedge is too thin to hold text there. The eye reads
    // a stack left to right anyway, so a staggered set of labels is also the
    // easier one to follow.
    const labels = names.map((name, i) => {
      if (histCols.length < 2) return null;
      const slot = 0.12 + ((i + 0.5) / names.length) * 0.76;
      const ci = Math.min(histCols.length - 1, Math.max(0, Math.round(slot * (histCols.length - 1))));
      const c = histCols[ci];
      const below = c.v.slice(0, i).reduce((s, n) => s + n, 0);
      return {
        name,
        x: x(c.year),
        y: (yRate(below) + yRate(below + c.v[i])) / 2,
        thickness: yRate(below) - yRate(below + c.v[i]),
      };
    });

    return {
      x, yStock, yRate, x0, x1, asOf, plotW,
      stockTop, stockH, rateTop, rateH, stockFloor, stockMax, rateMax,
      names,
      stockTicks: (() => {
        const t = niceTicks(stockMax, 4);
        const step = t.length > 1 ? t[1] - t[0] : 2.5;
        const out: number[] = [];
        for (let v = Math.ceil(stockFloor / step) * step; v <= stockMax + 1e-9; v += step) {
          out.push(Number(v.toFixed(6)));
        }
        return out;
      })(),
      rateTicks: niceTicks(rateMax, 3),
      yearTicks: (() => {
        const span = x1 - x0;
        const step = span > 26 ? 5 : span > 13 ? 2 : 1;
        const out: number[] = [];
        for (let y = Math.ceil(x0 / step) * step; y <= x1; y += step) out.push(y);
        return out;
      })(),
      reservesLine, declineLine, reservesArea, bandArea, flatLine,
      measuredStock, measuredStockArea,
      anchors: anchors.map((a) => ({
        ...a,
        px: x(fractionalYear(a.as_of)),
        py: yStock(a.producing_remaining_bcf / 1000),
      })),
      histWedges: names.map((_, i) => wedge(histCols, i)),
      fcWedges: names.map((_, i) => wedge(fcCols, i)),
      labels,
      histCols,
      fcCols,
      halfRateYear: model.headline.years_until_rate_halves != null
        ? asOf + model.headline.years_until_rate_halves : null,
      // Today's domestic output, held flat across the forecast. The area
      // between it and the stack is the shortfall — the gas that imports or new
      // fields have to cover. It is arithmetic on our own projection, not a
      // forecast of imports, and it is the question every reader asks next.
      todayRate: model.now.national_rate_mmcfd,
      gapArea: (() => {
        if (!fcCols.length) return '';
        const top = fcCols.map((c) => `${x(c.year)} ${yRate(model.now.national_rate_mmcfd)}`);
        const bottom = [...fcCols].reverse().map((c) => `${x(c.year)} ${yRate(totalOf(c.v))}`);
        return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
      })(),
      gapLabelAt: (() => {
        const at10 = fcCols.find((c) => c.year >= asOf + 10) ?? fcCols[fcCols.length - 1];
        return at10
          ? { x: x(at10.year), y: (yRate(model.now.national_rate_mmcfd) + yRate(totalOf(at10.v))) / 2,
              gap: model.now.national_rate_mmcfd - totalOf(at10.v), year: Math.round(at10.year) }
          : null;
      })(),
      anomalies: (model.anomalies ?? []).map((a) => {
        const [yy, mm] = a.month.split('-').map(Number);
        const year = yy + (mm - 0.5) / 12;
        const col = histCols.reduce((b, cc) =>
          (Math.abs(cc.year - year) < Math.abs(b.year - year) ? cc : b), histCols[0]);
        return { ...a, px: x(year), py: yRate(totalOf(col.v)) };
      }).filter((a) => a.px >= PAD.left && a.px <= PAD.left + plotW),
      declineCrossesZeroYear: (() => {
        const hit = model.trajectory.decline_binding.find((p) => p.left - (p.over ?? 0) <= 0);
        return hit ? asOf + hit.m / 12 : null;
      })(),
    };
  }, [model, width, height, horizonYears]);

  const reading = useMemo(() => {
    if (!geom || cursorYear == null) return null;
    const past = cursorYear <= geom.asOf;
    const cols = past ? geom.histCols : geom.fcCols;
    if (!cols.length) return null;
    const col = cols.reduce((best, c) =>
      (Math.abs(c.year - cursorYear) < Math.abs(best.year - cursorYear) ? c : best), cols[0]);
    const pick = (pts: ReserveTrajectoryPoint[]) => {
      const months = Math.round((cursorYear - geom.asOf) * 12);
      return pts.reduce((b, p) => (Math.abs(p.m - months) < Math.abs(b.m - months) ? p : b), pts[0]);
    };
    return {
      past,
      col,
      total: col.v.reduce((s, n) => s + n, 0),
      reserves: past ? null : pick(model.trajectory.reserves_binding),
      decline: past ? null : pick(model.trajectory.decline_binding),
    };
  }, [geom, cursorYear, model]);

  const pointAt = useCallback(
    (clientX: number) => {
      const el = hostRef.current;
      if (!el || !geom) return null;
      const px = clientX - el.getBoundingClientRect().left;
      const year = geom.x0 + ((px - PAD.left) / geom.plotW) * (geom.x1 - geom.x0);
      return Math.min(Math.max(year, geom.x0), geom.x1);
    },
    [geom],
  );

  return (
    <figure className="rtraj" aria-label="Gas reserve depletion and field production profile">
      <div
        ref={hostRef}
        className="rtraj__canvas"
        tabIndex={0}
        role="application"
        aria-label="Reserve depletion. Use left and right arrow keys to move through the years."
        onPointerMove={(e) => { if (!pinned) { const y = pointAt(e.clientX); if (y != null) setCursorYear(y); } }}
        onPointerLeave={() => { if (!pinned) setCursorYear(null); }}
        onPointerDown={(e) => { const y = pointAt(e.clientX); if (y != null) { setCursorYear(y); setPinned(true); } }}
        onKeyDown={(e) => {
          if (!geom) return;
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            setCursorYear((c) => {
              const next = (c ?? geom.asOf) + (e.key === 'ArrowRight' ? 0.25 : -0.25);
              return Math.min(Math.max(next, geom.x0), geom.x1);
            });
          } else if (e.key === 'Escape') { setCursorYear(null); setPinned(false); }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPinned((p) => !p); }
        }}
      >
        {geom && (
          <svg
            width={width}
            height={height}
            className={['rtraj__svg', play ? 'is-playing' : 'is-idle'].join(' ')}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`rt-stock-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.reserves} stopOpacity={0.34} />
                <stop offset="100%" stopColor={colors.reserves} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id={`rt-meas-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.measured} stopOpacity={0.36} />
                <stop offset="100%" stopColor={colors.measured} stopOpacity={0.05} />
              </linearGradient>
              {/* Projected output is the same colour as measured output, under a
                  hatch. Nothing right of the divider was observed, and a reader
                  should be able to see that without consulting a legend. */}
              <pattern id={`rt-hatch-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)">
                <rect width="7" height="7" fill="hsl(var(--card))" fillOpacity={0.34} />
                <line x1="0" y1="0" x2="0" y2="7" stroke="hsl(var(--card))"
                  strokeWidth={3} strokeOpacity={0.55} />
              </pattern>
              <clipPath id={`rt-wipe-${uid}`}>
                <rect className="rtraj__wipe" x={PAD.left - 2} y={0}
                  width={geom.plotW + 4} height={Math.max(height, 1)}
                  style={{ transformOrigin: `${PAD.left - 2}px 0px` }} />
              </clipPath>
            </defs>

            {/* ── axes ── */}
            {geom.stockTicks.map((t) => (
              <g key={`s${t}`}>
                <line x1={PAD.left} x2={PAD.left + geom.plotW} y1={geom.yStock(t)} y2={geom.yStock(t)}
                  stroke={colors.grid} strokeOpacity={t === 0 ? 0.55 : 0.28}
                  strokeDasharray={t === 0 ? undefined : '3 6'} />
                <text x={PAD.left - 8} y={geom.yStock(t)} dy="0.32em" textAnchor="end"
                  className="rtraj__tick" fill={colors.axis}>{t}</text>
              </g>
            ))}
            <text x={PAD.left - 8} y={geom.stockTop - 8} textAnchor="end" className="rtraj__unit" fill={colors.axis}>
              Tcf left
            </text>

            {geom.rateTicks.map((t) => (
              <g key={`r${t}`}>
                <line x1={PAD.left} x2={PAD.left + geom.plotW} y1={geom.yRate(t)} y2={geom.yRate(t)}
                  stroke={colors.grid} strokeOpacity={0.28} strokeDasharray="3 6" />
                <text x={PAD.left - 8} y={geom.yRate(t)} dy="0.32em" textAnchor="end"
                  className="rtraj__tick" fill={colors.axis}>{t >= 1000 ? `${t / 1000}k` : t}</text>
              </g>
            ))}
            <text x={PAD.left - 8} y={geom.rateTop - 8} textAnchor="end" className="rtraj__unit" fill={colors.axis}>
              MMCFD
            </text>

            <g clipPath={`url(#rt-wipe-${uid})`}>
              {/* ── stock: measured body, then the projected band ── */}
              <path d={geom.reservesArea} fill={`url(#rt-stock-${uid})`} />
              <path d={geom.bandArea} fill={colors.decline} fillOpacity={0.12} />
              <path d={geom.flatLine} fill="none" stroke={colors.flat} strokeWidth={1.1}
                strokeDasharray="1 4" strokeOpacity={0.8} />
              <path d={geom.declineLine} fill="none" stroke={colors.decline} strokeWidth={1.6}
                strokeDasharray="6 4" />
              <path d={geom.reservesLine} fill="none" stroke={colors.reserves} strokeWidth={2.2} />
              <path d={geom.measuredStock} fill="none" stroke={colors.measured} strokeWidth={2.4} />

              {/* ── the production profile ── */}
              {geom.histWedges.map((d, i) => (
                <path key={`h${i}`} d={d} fill={colors.palette(i)} fillOpacity={0.92} />
              ))}
              {geom.fcWedges.map((d, i) => (
                <path key={`f${i}`} d={d} fill={colors.palette(i)} fillOpacity={0.92} />
              ))}
              <rect x={geom.x(geom.asOf)} y={geom.rateTop}
                width={Math.max(0, PAD.left + geom.plotW - geom.x(geom.asOf))} height={geom.rateH}
                fill={`url(#rt-hatch-${uid})`} />

              {/* the shortfall against today's output */}
              <path d={geom.gapArea} fill={colors.decline} fillOpacity={0.09} />
              <line x1={geom.x(geom.asOf)} x2={PAD.left + geom.plotW}
                y1={geom.yRate(geom.todayRate)} y2={geom.yRate(geom.todayRate)}
                stroke={colors.decline} strokeOpacity={0.7} strokeWidth={1.2}
                strokeDasharray="5 4" />
            </g>

            {/* ── today ── */}
            <line x1={geom.x(geom.asOf)} x2={geom.x(geom.asOf)} y1={geom.stockTop - 12}
              y2={geom.rateTop + geom.rateH} stroke={colors.axis} strokeOpacity={0.5}
              strokeWidth={1} strokeDasharray="2 3" />
            <text x={geom.x(geom.asOf) + 5} y={geom.stockTop - 4} className="rtraj__note" fill={colors.axis}>
              projected →
            </text>
            <text x={geom.x(geom.asOf) - 5} y={geom.stockTop - 4} textAnchor="end"
              className="rtraj__note" fill={colors.axis}>
              ← measured
            </text>

            <g className="rtraj__late">
              {/* field names, on their own wedges */}
              {geom.labels.map((l, i) =>
                l && l.thickness >= 14 ? (
                  <WedgeLabel key={l.name} x={l.x} y={l.y} text={l.name}
                    color={inkOn(colors.palette(i))}
                    minX={PAD.left + 4} maxX={geom.x(geom.asOf) - 4} />
                ) : null,
              )}

              {/* published reserve statements */}
              {geom.anchors.map((a) => (
                <g key={a.as_of}>
                  <circle cx={a.px} cy={a.py} r={4} fill="hsl(var(--card))"
                    stroke={colors.measured} strokeWidth={2} />
                  <text x={a.px} y={a.py - 9} textAnchor="middle" className="rtraj__anchor" fill={colors.axis}>
                    {(a.producing_remaining_bcf / 1000).toFixed(2)}
                  </text>
                  {/* The only figures on this chart nobody derived. */}
                  <SvgProvMark x={a.px + 12} y={a.py - 12} kind="P" />
                </g>
              ))}
              {/* Why this plot starts later than the one below it.
                  Petrobangla has published reserve statements for years; this
                  archive only holds them from 2022-23 on. Production below is
                  measured from 2020 because the daily reports go back that far.
                  The note names both, because "no statement before 2023" beside
                  a stack that plainly starts in 2020 reads as a contradiction. */}
              {/* One caption per plot, each sitting in its own. The pair used to
                  live together in the top plot, which made the second one look
                  like a footnote about the first. */}
              {geom.anchors.length > 0 && (
                <PlotNote x={PAD.left + 4} y={geom.stockTop + geom.stockH - 6}
                  text="Petrobangla states this once a year — the archive holds it from 2023"
                  color={colors.axis} minX={PAD.left + 4} maxX={geom.anchors[0].px - 6} />
              )}

              {geom.declineCrossesZeroYear != null && geom.declineCrossesZeroYear <= geom.x1 && (
                <g>
                  <circle cx={geom.x(geom.declineCrossesZeroYear)} cy={geom.yStock(0)} r={3.2}
                    fill="hsl(var(--card))" stroke={colors.decline} strokeWidth={1.6} />
                  <PlotNote x={geom.x(geom.declineCrossesZeroYear) - 6} y={geom.yStock(0) + 13}
                    text={`every booked BCF produced · ${Math.round(geom.declineCrossesZeroYear)}`}
                    color={colors.decline} anchorLeft={false}
                    minX={PAD.left + 2} maxX={PAD.left + geom.plotW - 2} />
                </g>
              )}

              {geom.gapLabelAt && (
                <PlotNote x={geom.gapLabelAt.x - 6} y={geom.gapLabelAt.y + 4}
                  text={`${Math.round(geom.gapLabelAt.gap).toLocaleString()} MMCFD to replace by ${geom.gapLabelAt.year}`}
                  color={colors.decline} anchorLeft={false}
                  minX={geom.x(geom.asOf) + 4} maxX={PAD.left + geom.plotW - 2} />
              )}

              {/* The label goes above the stack, not on it: the wedge names live
                  inside the bands and two pieces of small type in the same place
                  is how a chart stops being read. */}
              {geom.anomalies.map((a) => (
                <g key={a.month}>
                  <circle cx={a.px} cy={a.py} r={3} fill="hsl(var(--card))"
                    stroke={colors.axis} strokeWidth={1.4} />
                  <line x1={a.px} x2={a.px} y1={a.py} y2={geom.rateTop + 16}
                    stroke={colors.axis} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="2 3" />
                  <PlotNote x={a.px + 5} y={geom.rateTop + 12}
                    text={`${formatIsoMonth(a.month)}: −${Math.round(a.drop_pct)}% for one month, back by ${formatIsoMonth(a.recovered_by)}`}
                    color={colors.axis}
                    minX={PAD.left + 2} maxX={geom.x(geom.asOf) - 2} />
                </g>
              ))}

              {geom.halfRateYear != null && geom.halfRateYear <= geom.x1 && (
                <g>
                  <line x1={geom.x(geom.halfRateYear)} x2={geom.x(geom.halfRateYear)}
                    y1={geom.rateTop} y2={geom.rateTop + geom.rateH}
                    stroke={colors.axis} strokeOpacity={0.55} strokeWidth={1} strokeDasharray="3 3" />
                  <PlotNote x={geom.x(geom.halfRateYear) + 5} y={geom.rateTop + 12}
                    text={`output halved · ${Math.round(geom.halfRateYear)}`}
                    color={colors.axis} minX={PAD.left + 2} maxX={PAD.left + geom.plotW - 2} />
                </g>
              )}
            </g>

            {/* The lower caption belongs to the lower plot. */}
            <text x={PAD.left + 4} y={geom.rateTop - 8} className="rtraj__note" fill={colors.axis}>
              Metered every day since 2020
            </text>

            {geom.yearTicks.map((y) => (
              <text key={y} x={geom.x(y)} y={geom.rateTop + geom.rateH + 16} textAnchor="middle"
                className="rtraj__tick" fill={colors.axis}>{y}</text>
            ))}

            {cursorYear != null && (
              <line x1={geom.x(cursorYear)} x2={geom.x(cursorYear)} y1={geom.stockTop}
                y2={geom.rateTop + geom.rateH} stroke={colors.axis} strokeOpacity={0.55} strokeWidth={1} />
            )}
          </svg>
        )}

        {geom && reading && cursorYear != null && (
          <div
            className="rtraj__readout"
            style={{
              top: `${geom.rateTop - 6}px`,
              left: `${Math.min(Math.max(geom.x(cursorYear), PAD.left), PAD.left + geom.plotW)}px`,
              transform:
                geom.x(cursorYear) > PAD.left + geom.plotW * 0.55
                  ? 'translate(calc(-100% - 14px), 0)'
                  : 'translate(14px, 0)',
            }}
          >
            <div className="rtraj__readout-head">
              <span>{reading.past ? formatMonth(reading.col.year) : Math.round(reading.col.year)}</span>
              <span className="rtraj__readout-total">
                {formatNumber(Math.round(reading.total))} MMCFD
                {/* Left of today every figure is a meter reading Petrobangla
                    published; right of it every figure is this model's. The
                    readout is where a reader is actually looking, so it says
                    which — the same two letters used everywhere else. */}
                <GridProvenanceTag kind={reading.past ? 'P' : 'D'} className="ml-1" />
              </span>
              {pinned && <span className="rtraj__pin">pinned</span>}
            </div>
            <ul className="rtraj__readout-list">
              {geom.names.map((name, i) => (
                <li key={name}>
                  <span className="rtraj__swatch" style={{ background: colors.palette(i) }} />
                  <span className="rtraj__readout-name">{name}</span>
                  <strong>{Math.round(reading.col.v[i]).toLocaleString()}</strong>
                </li>
              ))}
              {reading.reserves && reading.decline ? (
                <li className="rtraj__readout-foot">
                  <GridProvenanceTag kind="D" className="mr-1" />
                  {(reading.reserves.left / 1000).toFixed(2)} Tcf left if the booked 2P holds ·{' '}
                  {((reading.decline.left - (reading.decline.over ?? 0)) / 1000).toFixed(2)} Tcf if
                  the measured decline does
                </li>
              ) : (
                <li className="rtraj__readout-foot">
                  <GridProvenanceTag kind="P" className="mr-1" />
                  Petrobangla daily gas report, field by field
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </figure>
  );
}

export default ReserveTrajectoryCanvas;
