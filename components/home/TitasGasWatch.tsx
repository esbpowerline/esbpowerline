import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import { TITAS_RECORD } from '@/lib/data/titas/titas-record';

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
            <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground/70">{lead.asOf}</span>
          </div>

          <dl className="mt-3 space-y-2">
            {[lead.allowed, lead.actual].map((row, i) => (
              <div key={row.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-[10.5px] text-muted-foreground">{row.label}</dt>
                  <dd
                    className={
                      i === 1
                        ? 'text-[15px] font-bold leading-none text-rose-600 dark:text-rose-400'
                        : 'text-[12px] font-semibold leading-none text-muted-foreground'
                    }
                  >
                    {row.value}
                  </dd>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className={`h-full rounded-full ${i === 1 ? 'bg-rose-600 dark:bg-rose-500' : 'bg-rose-500/30'}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>

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
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70">{p.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Supporting figures */}
        <dl className="mt-3.5 divide-y divide-border/50 border-y border-border/50">
          {stats.map((s) => (
            <div key={s.value} className="flex items-baseline gap-2.5 py-2.5">
              <dt className="w-[78px] shrink-0 text-[14px] font-bold leading-tight tabular-nums text-rose-600 dark:text-rose-400">
                {s.value}
              </dt>
              <dd className="min-w-0 flex-1 text-[11.5px] leading-snug text-muted-foreground">{s.sub}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 text-[10.5px] leading-snug text-muted-foreground/70">{footnote}</p>

        <Link
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
