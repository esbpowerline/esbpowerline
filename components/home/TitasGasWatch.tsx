import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import { TITAS_RECORD } from '@/lib/data/titas/titas-record';

/**
 * Split "Tk 3,000cr" into its currency prefix, numeral and unit suffix so each
 * can be set separately: the numeral carries the weight, the currency and unit
 * recede. Setting "cr" at full weight makes "3,000cr" read as a single token
 * and stops the four numerals comparing cleanly down the column.
 *
 * Falls back to rendering the string whole if it isn't in this shape, so an
 * unusual future figure degrades to the old treatment rather than breaking.
 */
function splitFigure(value: string) {
  const m = /^(Tk\s*)?([\d,.]+)\s*(cr|crore|lakh|bn|m)?$/i.exec(value.trim());
  if (!m) return null;
  return { prefix: m[1]?.trim() ?? '', numeral: m[2], suffix: m[3] ?? '' };
}

/**
 * Titas Gas watch — a standalone rail panel, deliberately its own container
 * rather than a section of the Policy & Regulatory Framework card: this tracks
 * a licensee's own reported numbers, not a legal instrument.
 *
 * Led by one comparison (allowed vs actual, bars drawn to scale) rather than a
 * flat stat list, so the gap does the work at a glance. The full record and all
 * citations live at /titas-gas.
 */
export function TitasGasWatch() {
  const { tagline, lead, stats, footnote, cta } = TITAS_RECORD.snippet;

  return (
    <section
      className="mt-8 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
      aria-labelledby="titas-watch-title"
    >
      <div className="p-4 md:p-5">
        <header>
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-r from-transparent to-border" />
            <span
              id="titas-watch-title"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-500/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-rose-700 dark:text-rose-400"
            >
              <Flame className="h-3.5 w-3.5 stroke-[2]" />
              TITAS Gas
            </span>
            <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-l from-transparent to-border" />
          </div>
          <p className="mt-2.5 text-center text-[12px] leading-relaxed text-muted-foreground">{tagline}</p>
        </header>

        {/* Lead comparison — allowed vs actual, bars to scale */}
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold leading-snug text-foreground">{lead.caption}</p>
            <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground">{lead.asOf}</span>
          </div>

          {/* Not a <dl>: a definition list's grouping <div> may contain only <dt>
              and <dd>, and each row here also carries a progress bar. The list
              markup bought no semantics for a stat-plus-bar widget, so it only
              produced invalid HTML. */}
          <div className="mt-3 space-y-2">
            {[lead.allowed, lead.actual].map((row, i) => (
              <div key={row.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10.5px] text-muted-foreground">{row.label}</span>
                  <span
                    className={
                      i === 1
                        ? 'text-[15px] font-bold leading-none text-rose-600 dark:text-rose-400'
                        : 'text-[12px] font-semibold leading-none text-muted-foreground'
                    }
                  >
                    {row.value}
                  </span>
                </div>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border/60"
                  role="img"
                  aria-label={`${row.label}: ${row.value}`}
                >
                  <div
                    className={`h-full rounded-full ${i === 1 ? 'bg-rose-600 dark:bg-rose-500' : 'bg-rose-500/30'}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[12px] font-bold leading-snug text-rose-700 dark:text-rose-400">{lead.verdict}</p>

          {/* The climb, year by year */}
          <ol className="mt-2 flex items-baseline justify-between gap-1">
            {lead.trend.map((p, i) => {
              const current = i === lead.trend.length - 1;
              return (
                <li key={p.label} className="flex min-w-0 flex-col items-center gap-0.5">
                  <span
                    className={
                      current
                        ? 'text-[12px] font-bold leading-none tabular-nums text-rose-600 dark:text-rose-400'
                        : 'text-[11.5px] font-semibold leading-none tabular-nums text-muted-foreground'
                    }
                  >
                    {p.value}
                  </span>
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{p.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Supporting figures.

            The unit sits in a fixed slot to the right of the numeral, so the
            numerals themselves stack on one axis and "cr" hangs into the gutter
            — 468 lines up under 3,000 rather than under the "cr". Each figure
            carries its own period underneath, because these are not one series:
            a monthly household bill, two single years, and a three-year total. */}
        <dl className="mt-3.5 divide-y divide-border/50 border-y border-border/50">
          {stats.map((s) => {
            const f = splitFigure(s.value);
            return (
              <div key={s.value} className="flex items-baseline gap-3 py-2.5">
                <dt className="w-[5.5rem] shrink-0 text-right leading-tight text-rose-600 dark:text-rose-400">
                  <span className="flex items-baseline justify-end whitespace-nowrap">
                    {f ? (
                      <>
                        {/* The 10px unit labels were `opacity-70` over rose-600,
                            computing to 3.22:1 contrast — below WCAG's 4.5:1 for
                            small text. A darker rose at full opacity keeps them
                            visibly secondary to the numeral while reading
                            accessibly. */}
                        <span className="mr-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300">{f.prefix}</span>
                        <span className="text-[16px] font-bold tabular-nums">{f.numeral}</span>
                        {/* Fixed slot: keeps the numeral axis true whether or not there is a unit. */}
                        <span className="w-[15px] shrink-0 text-left text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                          {f.suffix}
                        </span>
                      </>
                    ) : (
                      <span className="text-[14px] font-bold tabular-nums">{s.value}</span>
                    )}
                  </span>
                  <span className="mt-1 block pr-[15px] text-[9px] font-medium uppercase tracking-wide tabular-nums text-muted-foreground">
                    {s.asOf}
                  </span>
                </dt>
                <dd className="min-w-0 flex-1 text-[11.5px] leading-snug text-muted-foreground">{s.sub}</dd>
              </div>
            );
          })}
        </dl>

        <p className="mt-3 text-[10.5px] leading-snug text-muted-foreground">{footnote}</p>

        <Link
          prefetch={false}
          href="/titas-gas"
          className="group mt-3.5 flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 py-2.5 text-[12px] font-semibold text-foreground/80 transition-colors hover:border-rose-500/30 hover:bg-rose-500/[0.06] hover:text-rose-700 dark:hover:text-rose-400"
        >
          {cta}
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
