import Link from 'next/link';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import type {
  EventNarrative,
  ExternalCoverageItem,
  NarrativeDay,
  NarrativeFigure,
} from '@/lib/data/analysis/event-narrative';
import { positionLabel } from '@/lib/data/analysis/event-narrative';

/**
 * The story, one day per row.
 *
 * Server-rendered on purpose. This is the substance of the page — a crawler and
 * a reader with JS disabled should both get the whole account — and it holds no
 * state, so there is nothing a client component would buy.
 *
 * Two columns, and the split is the argument: on the left what the national
 * record printed that day, on the right what the newsroom published. They are
 * never merged into one sentence, because one is a measurement and the other is
 * reporting, and the page's whole value is that a reader can tell which is
 * which. Where they agree — 6 August, "Terminal comes back ONLINE", against an
 * R-LNG line that rose 515.5 → 733.6 MMCFD the same day — the agreement is the
 * reader's to notice, not ours to assert.
 */

function fmt(v: number | null, digits = 1): string {
  // A dash, never a zero. Zero is a measurement; this is its absence.
  if (v === null) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function fmtSigned(v: number | null, digits = 1): string {
  if (v === null) return '';
  const s = Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: digits });
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : '±0';
}

/**
 * Deltas are deliberately NOT coloured by direction.
 *
 * Green-for-up would be a value judgment that inverts between the series on
 * this very page: a rise in R-LNG supply is relief and a rise in energy
 * unserved is the opposite. One palette cannot mean both, and a reader who
 * learns "green is good" on the gas row would misread the load-shed row a
 * centimetre below it. The sign and the magnitude carry the direction; the
 * only colour in the timeline is the incident day and the load-shed bar, where
 * red is unambiguous.
 */
function DayFigure({ figure, big = false }: { figure: NarrativeFigure; big?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">
        {figure.label} <GridProvenanceTag kind={figure.provenance} />
      </p>
      <p className={big ? 'text-3xl font-bold text-foreground leading-tight' : 'text-base font-semibold text-foreground'}>
        {fmt(figure.value)}
        <span className={big ? 'ml-1 text-sm font-normal text-muted-foreground' : 'ml-1 text-xs font-normal text-muted-foreground'}>
          {figure.unit}
        </span>
      </p>
      {figure.dayOnDay !== null && figure.dayOnDay !== 0 && (
        <p className="text-xs font-medium text-muted-foreground">
          {fmtSigned(figure.dayOnDay)} {figure.unit} on the day before
        </p>
      )}
      {figure.value === null && (
        <p className="text-xs text-muted-foreground">{figure.publisher} filed no figure</p>
      )}
    </div>
  );
}

/**
 * The magnitude bar for the day's load shedding.
 *
 * Scaled against the worst published day in the window, which is stated under
 * the timeline so the bar is readable as a proportion of a named number rather
 * than as an unlabelled length. A day the publisher did not file gets no bar at
 * all — not a zero-width one, which would draw as "nothing was shed".
 */
function IntensityBar({ figure, max }: { figure: NarrativeFigure; max: number | null }) {
  if (figure.value === null || max === null || max <= 0) return null;
  const pct = Math.max(1.5, Math.min(100, (figure.value / max) * 100));
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {figure.label} <GridProvenanceTag kind={figure.provenance} />
        </span>
        <span className="text-xs font-semibold text-foreground">
          {fmt(figure.value)} {figure.unit}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-rose-500 dark:bg-rose-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DayRow({
  day,
  intensityMax,
  coverageAvailable,
}: {
  day: NarrativeDay;
  intensityMax: number | null;
  coverageAvailable: boolean;
}) {
  const isIncident = day.position.kind === 'incident';
  const isLeadIn = day.position.kind === 'lead-in';
  const label = positionLabel(day.position);

  return (
    <li
      id={`day-${day.date}`}
      className={
        'relative scroll-mt-24 rounded-2xl border p-4 sm:p-5 ' +
        (isIncident
          ? 'border-rose-500/40 bg-rose-500/[0.05]'
          : day.inflection
            ? 'border-primary/30 bg-card'
            : isLeadIn
              ? 'border-border/60 bg-muted/20'
              : 'border-border bg-card')
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={
            'text-xs font-bold uppercase tracking-wider ' +
            (isIncident ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')
          }
        >
          {label}
        </span>
        <time dateTime={day.date} className="text-sm font-semibold text-foreground">
          {new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
          })}
        </time>
        {day.inflection && !isIncident && (
          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            sharp move
          </span>
        )}
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {/* left: what the national record printed */}
        <div>
          <DayFigure figure={day.headline} big />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {day.supporting.map((f) => (
              <DayFigure key={f.seriesId} figure={f} />
            ))}
          </div>
          <IntensityBar figure={day.intensity} max={intensityMax} />
        </div>

        {/* right: what was published that day, ours and everyone else's */}
        <div className="md:border-l md:border-border/60 md:pl-5">
          {day.coverage.length === 0 && day.external.length === 0 ? (
            <p className="text-xs italic leading-5 text-muted-foreground">
              {coverageAvailable
                ? 'No coverage filed on this date.'
                : 'Newsroom coverage could not be loaded — this is not a statement that none was filed.'}
            </p>
          ) : (
            <div className="space-y-4">
              {day.coverage.length > 0 && (
                <ul className="space-y-3">
                  {day.coverage.map((c) => (
                    <li key={c.slug}>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
                        ESB PowerLine
                      </p>
                      <Link
                        href={`/articles/${c.slug}`}
                        className="text-[0.9375rem] font-semibold leading-snug text-foreground decoration-border underline-offset-4 hover:underline hover:decoration-primary"
                      >
                        {c.title}
                      </Link>
                      {/* Excerpts run to their natural end. They were clamped to
                          two lines, which cut most of them mid-sentence for no
                          gain — the column is wide enough to hold them and a
                          half-sentence is worse than none. */}
                      {c.excerpt && (
                        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                          {c.excerpt}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {day.external.length > 0 && <ExternalList items={day.external} />}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * External reporting for a day.
 *
 * Visually subordinate to the archive column and to our own reporting, and
 * labelled with the outlet first, because the outlet is the thing a reader
 * needs in order to weigh it. `reportsOn` is the date the item is about — the
 * evidence file records how each was established, and the methodology block
 * says so — which is why the heading reads "reporting on this day" rather than
 * claiming a publication date the search results did not always give.
 */
function ExternalList({ items }: { items: ExternalCoverageItem[] }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Elsewhere · reporting on this day
      </p>
      <ul className="space-y-2">
        {items.map((e) => (
          <li key={e.url} className="leading-snug">
            <a
              href={e.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-[13px] font-medium text-foreground decoration-border underline-offset-4 hover:underline hover:decoration-primary"
            >
              {e.headline}
            </a>
            <span className="ml-1.5 whitespace-nowrap text-[11px] text-muted-foreground">
              — {e.outlet}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EventTimeline({ narrative }: { narrative: EventNarrative }) {
  const max = narrative.totals.intensityPeak?.value ?? null;
  return (
    <ol className="space-y-3">
      {narrative.days.map((day) => (
        <DayRow
          key={day.date}
          day={day}
          intensityMax={max}
          coverageAvailable={narrative.coverageAvailable}
        />
      ))}
    </ol>
  );
}
