import Link from 'next/link';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import type { HeroShape, KeyFact } from '@/lib/data/analysis/event-narrative';

/**
 * One study in the /analysis grid.
 *
 * The drawing is the study's own headline series, normalised by `heroShape`
 * exactly as the study's hero draws it, so the card and the page it opens
 * cannot show two different shapes of the same record. Plain SVG, no chart
 * library and no client JS: a grid of these is a server render and nothing to
 * hydrate. Gaps in the series break the line rather than joining across them,
 * and the printed capacity is dashed so it never reads as a measured series.
 *
 * The whole card is the link. Nothing inside it is a second link, so a reader
 * cannot land somewhere other than the study by clicking a figure.
 */

function sparkSegments(shape: HeroShape, W: number, H: number): string[] {
  const out: string[] = [];
  let run: string[] = [];
  for (const p of shape.points) {
    if (p.y === null) {
      if (run.length) out.push(run.join(' '));
      run = [];
      continue;
    }
    run.push(`${run.length ? 'L' : 'M'}${(p.x * W).toFixed(1)},${(H - p.y * H).toFixed(1)}`);
  }
  if (run.length) out.push(run.join(' '));
  return out;
}

function shortDay(iso: string): string {
  const [, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(m) - 1]}`;
}

export default function EventStudyCard({
  href,
  title,
  dateline,
  standfirst,
  seriesLabel,
  shape,
  facts,
}: {
  href: string;
  title: string;
  dateline: string;
  standfirst: string;
  seriesLabel: string;
  shape: HeroShape | null;
  facts: KeyFact[];
}) {
  const W = 400;
  const H = 96;
  const capY = shape?.capacityY !== null && shape?.capacityY !== undefined ? H - shape.capacityY * H : null;

  return (
    <Link
      prefetch={false}
      href={href}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Bangladesh · {dateline}
      </p>
      <h2 className="mt-2 text-[1.25rem] font-bold leading-snug tracking-[-0.01em] text-foreground group-hover:text-primary">
        {title}
      </h2>
      <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">{standfirst}</p>

      {shape && (
        <figure className="m-0 mt-5">
          <div className="relative h-[96px] w-full">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={`${seriesLabel}: from ${shape.first?.value.toLocaleString('en-US')} to a low of ${shape.low?.value.toLocaleString('en-US')} ${shape.unit}${shape.low ? ` on ${shortDay(shape.low.date)}` : ''}.`}
            >
              {capY !== null && (
                <line
                  x1="0"
                  x2={W}
                  y1={capY}
                  y2={capY}
                  className="stroke-muted-foreground/45"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {shape.incidentX !== null && (
                <line
                  x1={shape.incidentX * W}
                  x2={shape.incidentX * W}
                  y1="0"
                  y2={H}
                  className="stroke-rose-500/70"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {sparkSegments(shape, W, H).map((d) => (
                <path
                  key={d.slice(0, 24)}
                  d={d}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
          <figcaption className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
            {seriesLabel}, {shape.unit}
            {shape.incidentDate ? ` · the break on ${shortDay(shape.incidentDate)}` : ''}
            {shape.capacityValue !== null ? ' · dashed: printed capacity' : ''}
          </figcaption>
        </figure>
      )}

      {facts.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/70 pt-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[11px] text-muted-foreground">
                {f.label} <GridProvenanceTag kind={f.provenance} />
              </dt>
              <dd className="m-0 mt-0.5 text-[1.0625rem] font-bold tabular-nums text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <span className="mt-auto pt-5 text-[13px] font-semibold text-primary">Open the study</span>
    </Link>
  );
}
