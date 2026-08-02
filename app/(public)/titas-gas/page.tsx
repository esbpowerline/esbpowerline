import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck, AlertTriangle, Dot, Flame } from 'lucide-react';
import { TITAS_RECORD } from '@/lib/data/titas/titas-record';

export const revalidate = 3600;

export function generateMetadata() {
  return {
    title: `${TITAS_RECORD.short} — the accountability record | ESB PowerLine`,
    description: TITAS_RECORD.overview,
    alternates: {
      canonical: '/titas-gas',
    },
  };
}

export default function TitasGasRecordPage() {
  return (
    <div className="container container--shell py-8 md:py-10">
      <div className="w-full">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        {/* Header */}
        <header className="mt-4 border-b border-border/50 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              <Flame className="w-3.5 h-3.5" />
              {TITAS_RECORD.kicker}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {TITAS_RECORD.title}
          </h1>

          {/* Fact strip */}
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/50 sm:grid-cols-4">
            {[
              ['Entity', TITAS_RECORD.entity],
              ['Ownership', TITAS_RECORD.ownership],
              ['Established', TITAS_RECORD.established],
              ['Official source', TITAS_RECORD.source.label],
            ].map(([label, value]) => (
              <div key={label} className="bg-card px-4 py-3">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-[13px] font-semibold leading-snug text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            {/* Sourcing caveat */}
            <div className="mt-6 flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">{TITAS_RECORD.note}</p>
            </div>

            {/* Overview */}
            <section className="mt-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Overview</h2>
                <span aria-hidden className="h-px flex-1 bg-border/60" />
              </div>
              <p className="mt-3 text-[16px] md:text-[17px] leading-relaxed text-foreground/90">{TITAS_RECORD.overview}</p>
            </section>

            {/* The scale of it — hero figure, rate row, allowance meter */}
            <section className="mt-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">The scale of it</h2>
                <span aria-hidden className="h-px flex-1 bg-border/60" />
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.04]">
                {/* Hero figure */}
                <div className="px-5 py-6 text-center">
                  <p className="text-[38px] sm:text-[52px] md:text-[64px] font-bold leading-[0.95] tracking-tight text-rose-600 dark:text-rose-400">
                    {TITAS_RECORD.scale.hero.value}
                  </p>
                  <p className="mx-auto mt-2.5 max-w-md text-[14px] font-semibold leading-snug text-foreground">
                    {TITAS_RECORD.scale.hero.label}
                  </p>
                  <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                    {TITAS_RECORD.scale.hero.sub}
                  </p>
                </div>

                {/* The same number as a rate */}
                <dl className="grid grid-cols-1 gap-px border-t border-rose-500/15 bg-border/40 sm:grid-cols-3">
                  {TITAS_RECORD.scale.rates.map((r) => (
                    <div key={r.unit} className="bg-card/70 px-4 py-3.5 text-center">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{r.unit}</dt>
                      <dd className="mt-1 text-[22px] font-bold leading-none text-rose-600 dark:text-rose-400">{r.value}</dd>
                      <dd className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{r.sub}</dd>
                    </div>
                  ))}
                </dl>

                {/* What that volume would have run */}
                <p className="border-t border-rose-500/15 px-5 py-4 text-center text-[14.5px] leading-relaxed text-foreground/90">
                  {TITAS_RECORD.scale.equivalence}
                </p>
              </div>

              {/* Meter — the loss against the regulator's limit */}
              <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4 md:p-5">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{TITAS_RECORD.scale.meter.caption}</p>
                <div
                  className="mt-3 flex h-7 w-full gap-[2px] overflow-hidden rounded-lg"
                  role="img"
                  aria-label={`${TITAS_RECORD.scale.meter.allowedValue} of the loss was within the 2% allowance; ${TITAS_RECORD.scale.meter.excessValue} was beyond it.`}
                >
                  <div className="bg-rose-500/25" style={{ width: `${TITAS_RECORD.scale.meter.allowedPct}%` }} />
                  <div className="bg-rose-600 dark:bg-rose-500" style={{ width: `${TITAS_RECORD.scale.meter.excessPct}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-rose-500/25" />
                    {TITAS_RECORD.scale.meter.allowedLabel} · <span className="font-semibold text-foreground">{TITAS_RECORD.scale.meter.allowedValue}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-rose-600 dark:bg-rose-500" />
                    {TITAS_RECORD.scale.meter.excessLabel} · <span className="font-semibold text-foreground">{TITAS_RECORD.scale.meter.excessValue}</span>
                  </span>
                </div>
                <p className="mt-3 border-t border-border/50 pt-3 text-[13.5px] font-semibold leading-snug text-foreground">
                  {TITAS_RECORD.scale.meter.note}
                </p>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
                {TITAS_RECORD.scale.working}{' '}
                <a
                  href={TITAS_RECORD.scale.hero.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                >
                  {TITAS_RECORD.scale.hero.source.label}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </p>
            </section>

            {/* What it costs a household */}
            <section className="mt-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">What it costs your home</h2>
                <span aria-hidden className="h-px flex-1 bg-border/60" />
              </div>

              <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{TITAS_RECORD.household.caption}</p>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
                {[TITAS_RECORD.household.billed, TITAS_RECORD.household.actual].map((row, i) => (
                  <div
                    key={row.label}
                    className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5 md:px-5 ${i === 1 ? 'border-t border-border/60' : ''}`}
                  >
                    <span className="text-[13px] leading-snug text-muted-foreground">{row.label}</span>
                    <span className="flex items-baseline gap-2.5">
                      <span className="text-[13px] text-muted-foreground">{row.volume}</span>
                      <span className="text-[20px] font-bold leading-none text-foreground">{row.amount}</span>
                    </span>
                  </div>
                ))}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-rose-500/20 bg-rose-500/[0.06] px-4 py-4 md:px-5">
                  <span className="text-[13.5px] font-semibold leading-snug text-foreground">
                    {TITAS_RECORD.household.gap.label}
                  </span>
                  <span className="flex items-baseline gap-2.5">
                    <span className="text-[13px] text-muted-foreground">{TITAS_RECORD.household.gap.year}</span>
                    <span className="text-[26px] font-bold leading-none text-rose-600 dark:text-rose-400">
                      {TITAS_RECORD.household.gap.month}
                    </span>
                  </span>
                </div>
              </div>

              <p className="mt-3.5 text-[14.5px] leading-relaxed text-foreground/90">{TITAS_RECORD.household.range}</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/90">{TITAS_RECORD.household.aggregate}</p>
              <p className="mt-3 border-l border-border pl-4 text-[13.5px] leading-relaxed text-muted-foreground">
                {TITAS_RECORD.household.rebuttal}
              </p>

              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
                {TITAS_RECORD.household.working}{' '}
                {TITAS_RECORD.household.sources.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && ' · '}
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                    >
                      {s.label}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </span>
                ))}
              </p>
            </section>

            {/* The record */}
            <section className="mt-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">The record</h2>
                <span aria-hidden className="h-px flex-1 bg-border/60" />
              </div>
              <ol className="mt-3 space-y-3">
                {TITAS_RECORD.record.map((point, i) => (
                  <li key={i} className="flex gap-3.5 text-[15px] leading-relaxed text-foreground/90">
                    <span className="mt-px select-none font-mono text-[13px] font-bold tabular-nums text-rose-600 dark:text-rose-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="mt-8 lg:mt-0 space-y-6">
            <section className="mt-8 rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Official source</h2>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                This record is compiled by ESB PowerLine from Titas Gas&apos;s own published reporting. Its annual reports
                and disclosures are published here:
              </p>
              <a
                href={TITAS_RECORD.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Titas Gas annual reports
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <p className="mt-2.5 flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70">
                <Dot className="h-3 w-3" />
                {TITAS_RECORD.source.label}
              </p>
            </section>
          </aside>
        </div>

        {/* Official figures */}
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Official figures</h2>
            <span aria-hidden className="h-px flex-1 bg-border/60" />
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/50 sm:grid-cols-2 xl:grid-cols-3">
            {TITAS_RECORD.figures.map((f) => (
              <div key={f.label} className="flex flex-col bg-card px-4 py-4">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{f.label}</dt>
                <dd className="mt-2 text-[30px] font-bold leading-none text-rose-600 dark:text-rose-400">{f.value}</dd>
                <dd className="mt-2 flex-1 text-[13.5px] leading-snug text-foreground/90">{f.meaning}</dd>
                {f.against && (
                  <dd className="mt-2">
                    <span className="inline-block rounded-full bg-muted/70 px-2 py-[3px] text-[11px] font-medium leading-none text-muted-foreground">
                      {f.against}
                    </span>
                  </dd>
                )}
                <dd className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground/90">
                  <span>{f.asOf ? `As of ${f.asOf}` : ' '}</span>
                  <a
                    href={f.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 hover:text-primary hover:underline"
                  >
                    <span className="truncate">{f.source.label}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
            Figures verified against the linked official or authoritative source shown on each row.
          </p>
        </section>

        {/* Timeline */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Timeline</h2>
            <span aria-hidden className="h-px flex-1 bg-border/60" />
          </div>
          <ul className="mt-4 space-y-3 border-l border-border/60 pl-5">
            {TITAS_RECORD.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] top-[5px] h-2 w-2 rounded-full bg-rose-600 dark:bg-rose-400" />
                <span className="font-mono text-[12.5px] font-bold tabular-nums text-foreground">{t.date}</span>
                <span className="text-[14px] text-muted-foreground"> — {t.event}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
