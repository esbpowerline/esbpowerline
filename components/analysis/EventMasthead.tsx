import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import type { KeyFact } from '@/lib/data/analysis/event-narrative';

/**
 * The right half of the masthead.
 *
 * The header used to be one 68ch column on a 1280px page, so the whole right
 * side was empty above the fold — the most valuable space on the page carrying
 * nothing. It now holds the shape of the event and the four figures a reader
 * would otherwise have to scroll 45 rows to assemble.
 *
 * Every figure comes from `keyFacts`, which reads the same series the timeline
 * below renders. That is the point: an "at a glance" panel typed by hand is the
 * one component guaranteed to stop matching its own page, and this one cannot,
 * because it has no numbers of its own.
 */

/** Inline SVG, no library, no client JS — it is a static shape. */
function Sparkline({
  points,
  min,
  max,
  unit,
  incidentIndex,
}: {
  points: Array<{ x: number; y: number | null }>;
  min: number;
  max: number;
  unit: string;
  incidentIndex: number | null;
}) {
  const W = 100;
  const H = 30;
  // Nulls break the path rather than joining across, exactly as the charts do.
  const segments: string[] = [];
  let current: string[] = [];
  for (const p of points) {
    if (p.y === null) {
      if (current.length) segments.push(current.join(' '));
      current = [];
      continue;
    }
    const x = (p.x * W).toFixed(2);
    const y = (H - p.y * H).toFixed(2);
    current.push(`${current.length ? 'L' : 'M'}${x},${y}`);
  }
  if (current.length) segments.push(current.join(' '));

  const incidentX =
    incidentIndex !== null && points.length > 1
      ? ((incidentIndex / (points.length - 1)) * W).toFixed(2)
      : null;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[64px] w-full"
        role="img"
        aria-label={`The imported-gas line across the window, from ${max.toLocaleString('en-US', { maximumFractionDigits: 0 })} down to ${min.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${unit}.`}
      >
        {incidentX !== null && (
          <line
            x1={incidentX}
            x2={incidentX}
            y1="0"
            y2={H}
            className="stroke-rose-500/50"
            strokeWidth="0.6"
          />
        )}
        {segments.map((d) => (
          <path
            key={d.slice(0, 24)}
            d={d}
            fill="none"
            className="stroke-primary"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {/* High and low anchor the shape. The break is not named here because
          the caption is centred and the rule is not — the two did not line up,
          which read as though the break happened mid-window. The rule gets its
          own line instead. */}
      <figcaption className="mt-1 space-y-0.5">
        <span className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
          <span>high {max.toLocaleString('en-US', { maximumFractionDigits: 0 })} {unit}</span>
          <span>low {min.toLocaleString('en-US', { maximumFractionDigits: 0 })} {unit}</span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span aria-hidden className="inline-block h-2.5 w-px bg-rose-500" />
          the break, 21 July
        </span>
      </figcaption>
    </figure>
  );
}

export default function EventMasthead({
  facts,
  spark,
  sparkUnit,
  incidentIndex,
  sourceLine,
}: {
  facts: KeyFact[];
  spark: { points: Array<{ x: number; y: number | null }>; min: number; max: number } | null;
  sparkUnit: string;
  incidentIndex: number | null;
  sourceLine: string;
}) {
  return (
    <aside
      aria-label="At a glance"
      className="rounded-2xl border border-border bg-card p-5 lg:p-6"
    >
      {spark && (
        <div className="mb-5 border-b border-border/60 pb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            RPGCL R-LNG supply · the whole window
          </p>
          <Sparkline
            points={spark.points}
            min={spark.min}
            max={spark.max}
            unit={sparkUnit}
            incidentIndex={incidentIndex}
          />
        </div>
      )}

      <dl className="space-y-4">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {f.label} <GridProvenanceTag kind={f.provenance} />
            </dt>
            <dd className="mt-0.5">
              <span className="text-xl font-bold tabular-nums text-foreground">{f.value}</span>
              <span className="mt-0.5 block text-[12px] leading-5 text-muted-foreground">
                {f.note}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 border-t border-border/60 pt-3 text-[11px] leading-5 text-muted-foreground">
        {sourceLine}
      </p>
    </aside>
  );
}
