import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import type { HeroShape, KeyFact } from '@/lib/data/analysis/event-narrative';

/**
 * The hero.
 *
 * What it replaced was three paragraphs of body copy in a 68ch column with a
 * bordered stat card parked beside them — the shape of a document, not of an
 * opening. This is composed instead: a rule-and-kicker line, the title, one
 * tight standfirst, then the event's own shape at full width with its figures
 * labelled directly on it, then the numbers as a band rather than a box.
 *
 * The drawing is server-rendered SVG with HTML labels positioned over it. That
 * combination is deliberate: `preserveAspectRatio="none"` lets the path fill any
 * width without a client-side measure, but it would stretch SVG text with it,
 * so every label is HTML at a percentage offset and stays crisp at 360px and
 * 1280px alike. No chart library, no client JS, nothing to hydrate.
 *
 * The capacity line is in the vertical domain (see `heroShape`), so the gap
 * between what was delivered and what the source went on claiming is the first
 * thing in the frame. Scaling to the delivered line's own range would have put
 * its best day at the top and quietly flattered the record.
 */

function fmt(v: number, digits = 0): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function shortDay(iso: string): string {
  const [, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(m) - 1]}`;
}

function HeroChart({ shape, seriesLabel }: { shape: HeroShape; seriesLabel: string }) {
  const W = 1000;
  const H = 260;
  const toX = (x: number) => x * W;
  const toY = (y: number) => H - y * H;

  // Break the path on nulls rather than joining across them.
  const segments: Array<Array<{ x: number; y: number }>> = [];
  let run: Array<{ x: number; y: number }> = [];
  for (const p of shape.points) {
    if (p.y === null) {
      if (run.length) segments.push(run);
      run = [];
      continue;
    }
    run.push({ x: toX(p.x), y: toY(p.y) });
  }
  if (run.length) segments.push(run);

  const linePath = (seg: Array<{ x: number; y: number }>) =>
    seg.map((pt, i) => `${i ? 'L' : 'M'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const areaPath = (seg: Array<{ x: number; y: number }>) =>
    `${linePath(seg)} L${seg[seg.length - 1].x.toFixed(1)},${H} L${seg[0].x.toFixed(1)},${H} Z`;

  const capY = shape.capacityY !== null ? toY(shape.capacityY) : null;

  return (
    <figure className="event-hero__figure relative m-0">
      <div className="event-hero__stage relative h-[180px] w-full sm:h-[220px] lg:h-[260px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`${seriesLabel} across the window: from ${fmt(shape.first?.value ?? 0)} ${shape.unit}, down to a low of ${fmt(shape.low?.value ?? 0)} ${shape.unit} on ${shape.low ? shortDay(shape.low.date) : ''}, against a printed capacity of ${fmt(shape.capacityValue ?? 0)} ${shape.unit}.`}
        >
          <defs>
            <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.30" />
              <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Printed capacity — the source's own claim, dashed so it never
              reads as a measured series. */}
          {capY !== null && (
            <line
              x1="0"
              x2={W}
              y1={capY}
              y2={capY}
              className="stroke-muted-foreground/45 event-hero__rule"
              strokeWidth="1.5"
              strokeDasharray="7 6"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {shape.incidentX !== null && (
            <line
              x1={toX(shape.incidentX)}
              x2={toX(shape.incidentX)}
              y1="0"
              y2={H}
              className="stroke-rose-500/70 event-hero__break"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* One group, one wipe.
              
              The first attempt drew the line with `pathLength={1}` and an
              animated `stroke-dashoffset`. It does not survive this SVG: the
              strokes carry `vector-effect: non-scaling-stroke` so the dash
              pattern is resolved in screen units rather than path units, and
              `pathLength` stops meaning anything — half the series rendered as
              a pale dashed ghost and stayed that way, at 8s and at 60s.
              
              A clip wipe reveals the same drawing left to right and touches no
              stroke geometry at all, so it is indifferent to both
              `non-scaling-stroke` and `preserveAspectRatio="none"`. */}
          <g className="event-hero__draw">
          {segments.map((seg) => (
            <path key={`a${seg[0].x}`} d={areaPath(seg)} fill="url(#hero-fill)" className="event-hero__area" />
          ))}
          {/* A halo under the line — a second, wider stroke at low opacity.
              Not a blur filter: this SVG is `preserveAspectRatio="none"`, so a
              Gaussian would be stretched with the geometry and smear
              horizontally. A plain wider stroke scales cleanly. */}
          {segments.map((seg) => (
            <path
              key={`g${seg[0].x}`}
              d={linePath(seg)}
              fill="none"
              className="stroke-primary/25 event-hero__glow"
              strokeWidth="6"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {segments.map((seg) => (
            <path
              key={`l${seg[0].x}`}
              d={linePath(seg)}
              fill="none"
              className="stroke-primary event-hero__line"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          </g>

          {shape.low && (
            <circle
              cx={toX(shape.low.x)}
              cy={toY(shape.low.y)}
              r="4"
              className="fill-rose-500"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* HTML labels over the stretched SVG, so type never distorts. */}
        {capY !== null && shape.capacityValue !== null && (
          <span
            // pr-0.5 keeps the glyphs off the frame edge; at 1280 the label
            // was sitting flush against it.
            className="pointer-events-none absolute right-0 -translate-y-full pb-1 pr-0.5 text-[11px] font-medium text-muted-foreground"
            style={{ top: `${(1 - (shape.capacityY as number)) * 100}%` }}
          >
            printed capacity {fmt(shape.capacityValue)} {shape.unit}
          </span>
        )}

        {shape.incidentX !== null && (
          <span
            className="pointer-events-none absolute top-0 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
            style={{
              left: `${shape.incidentX * 100}%`,
              transform: shape.incidentX > 0.8 ? 'translateX(-100%)' : 'translateX(4px)',
            }}
          >
            21 Jul · the break
          </span>
        )}

        {shape.low && (
          <span
            className="pointer-events-none absolute translate-y-1.5 text-[11px] font-semibold tabular-nums text-foreground"
            style={{
              left: `${shape.low.x * 100}%`,
              top: `${(1 - shape.low.y) * 100}%`,
              transform: 'translate(-50%, 8px)',
            }}
          >
            {fmt(shape.low.value, 1)}
          </span>
        )}
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
        <span>
          {seriesLabel} <GridProvenanceTag kind="P" /> · Petrobangla daily gas report, one point per
          gas day
        </span>
        <span className="tabular-nums">
          {shape.first ? shortDay(shape.first.date) : ''} –{' '}
          {shape.last ? shortDay(shape.last.date) : ''}
        </span>
      </figcaption>
    </figure>
  );
}

export default function EventHero({
  kicker,
  title,
  dateline,
  standfirst,
  shape,
  seriesLabel,
  facts,
  meta,
}: {
  kicker: string;
  title: string;
  dateline: string;
  standfirst: React.ReactNode;
  shape: HeroShape | null;
  seriesLabel: string;
  facts: KeyFact[];
  meta: Array<{ label: string; value: string }>;
}) {
  return (
    <header className="event-hero mb-10 border-b border-border/50 pb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border/40 pb-3">
        {/* The label as a mark, not as small print. "Analysis · event study"
            names the kind of page this is — the one thing a reader needs before
            the headline — and at 11px grey caps it was the least visible thing
            in the frame. A tinted pill gives it the weight of a masthead
            without adding a second typeface or a colour the page does not
            already use. */}
        <p className="event-hero__kicker">
          <span className="event-hero__kicker-dot" aria-hidden />
          {kicker}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {dateline}
        </p>
      </div>

      <h1 className="event-hero__title mt-5 text-[2.125rem] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-[3rem] lg:text-[3.75rem]">
        {title}
      </h1>

      <p className="event-hero__standfirst mt-4 text-[1.0625rem] leading-[1.65] text-foreground/85">
        {standfirst}
      </p>

      {shape && (
        <div className="mt-8">
          <HeroChart shape={shape} seriesLabel={seriesLabel} />
        </div>
      )}

      {/* The figures as a band, not a box. A bordered card in a sidebar read as
          an accessory to the story; these are the story's own headline numbers
          and they sit on the same axis as everything else. */}
      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border/50 pt-6 lg:grid-cols-4">
        {facts.map((f, i) => (
          <div
            key={f.label}
            className="event-hero__fact lg:border-l lg:border-border/50 lg:pl-5 lg:first:border-l-0 lg:first:pl-0"
            style={{ '--i': i } as React.CSSProperties}
          >
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {f.label} <GridProvenanceTag kind={f.provenance} />
            </dt>
            <dd>
              <span className="mt-1 block text-[1.5rem] font-bold leading-tight tabular-nums text-foreground">
                {f.value}
              </span>
              <span className="mt-1 block text-[12px] leading-5 text-muted-foreground">
                {f.note}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-2 border-t border-border/40 pt-4 text-[11px] leading-5">
        {meta.map((m) => (
          <div key={m.label} className="flex items-baseline gap-1.5">
            <dt className="font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {m.label}
            </dt>
            <dd className="tabular-nums text-foreground/80">{m.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
