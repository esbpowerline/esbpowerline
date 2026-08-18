'use client';

/**
 * Shared primitives for the hand-drawn SVG charts.
 *
 * Four canvases in this folder — the load curve, the generation mix, the
 * interconnector and the reserve trajectory — had each grown their own copy of
 * the same four helpers. The copies were not identical, but every difference
 * was cosmetic: a guard clause against a ternary, a destructured `[r, g, b]`
 * against three `parseInt` calls, a required `count` against a defaulted one.
 * Same behaviour, four places to fix a bug in.
 *
 * They live here now. `useSvgTextWidth` stays in its own file because it is a
 * hook and the canvases import it directly.
 */

/** "19:30" → 1170. Null for anything that is not a clock time. */
export function minutesOf(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Axis ticks a reader already thinks in — 0, 250, 500 — rather than peak/4.
 *
 * `count` is a target, not a promise: the step is rounded up to the next
 * 1/2/2.5/5/10 of the right magnitude, so the tick count lands near it.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((n) => n * mag).find((n) => n >= raw) ?? mag * 10;
  const out: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

/** 1200 → "1.2k". Axis labels only; never for a figure a reader might quote. */
export function formatK(v: number): string {
  if (v < 1000) return String(Math.round(v));
  const k = v / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

/**
 * Readable ink for a label sitting on a filled band.
 *
 * Rec. 709 luminance against a mid threshold: dark ink on a light fill, white
 * on a dark one. The alternative — one ink colour for every band — is how a
 * chart ends up with a white label on a yellow wedge.
 */
export function inkOn(hex: string): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? '#0b1220' : '#ffffff';
}

/**
 * A provenance mark drawn in SVG.
 *
 * Same two letters, same box and same meaning as the HTML `GridProvenanceTag`:
 * a reader should not have to learn a second notation for the same claim just
 * because it moved inside a chart.
 *
 * "Same box" has to be built here rather than borrowed. The first version set
 * `className="svg-prov"` and no such rule was ever written, so the letter
 * rendered at the SVG default of 16px inside an 11px box — overflowing it on
 * every canvas that draws one. SVG text does not inherit the surrounding type
 * scale, so the treatment is set as attributes, proportionally to `size`, and
 * scales with the mark instead of fighting a viewBox.
 *
 * The ratios are lifted from `.grid-provenance-tag` so the two render as one
 * notation: a 0.625rem glyph in a 0.95rem box (0.66), a 1px border (0.066), a
 * 3px radius (0.2), weight 800, and the same 8% background tint. D keeps its
 * dashed border — the one visual cue that separates a derived figure from a
 * published one at a glance.
 *
 * `color` is an override, not a requirement. Left off, the mark takes the
 * system colour for its kind, which is what the convention asks for. The
 * interconnector passes its series colour deliberately: there the mark sits
 * inline at the end of a coloured label and reads as part of it.
 */
export function SvgProvMark({
  x,
  y,
  kind,
  color,
  size = 11,
}: {
  x: number;
  y: number;
  kind: 'P' | 'D';
  color?: string;
  size?: number;
}) {
  const ink = color ?? (kind === 'P' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))');
  const half = size / 2;
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <rect
        x={0}
        y={-half}
        width={size}
        height={size}
        rx={size * 0.2}
        fill={ink}
        fillOpacity={0.08}
        stroke={ink}
        strokeWidth={size * 0.066}
        strokeDasharray={kind === 'D' ? `${size * 0.18} ${size * 0.14}` : undefined}
      />
      <text
        x={half}
        y={0}
        dy="0.33em"
        textAnchor="middle"
        fontSize={size * 0.66}
        fontWeight={800}
        letterSpacing={0}
        fill={ink}
      >
        {kind}
      </text>
    </g>
  );
}

/** A point on a canvas, in SVG user units. */
export type Pt = { x: number; y: number };

/**
 * Monotone cubic path — a smooth curve that never overshoots its own points.
 *
 * A plain Catmull-Rom or Recharts' "monotone" on this data invents dips below a
 * trough and bumps above a peak, which on a load curve reads as generation the
 * grid never produced. This keeps the eye's smooth line without drawing a
 * megawatt that was not published.
 */
export function monotonePath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  const n = pts.length;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    slope.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x || 1));
  }

  const m: number[] = new Array(n).fill(0);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0; // a turning point stays a turning point
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    d += ` C ${pts[i].x + h / 3} ${pts[i].y + (m[i] * h) / 3}`;
    d += ` ${pts[i + 1].x - h / 3} ${pts[i + 1].y - (m[i + 1] * h) / 3}`;
    d += ` ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}
