import Link from 'next/link';
import { safeJsonLd } from '@/lib/json-ld';
import { loadEventStudy, loadOutageQuotes } from '@/lib/data/analysis/event-study.server';
import {
  CHAIN_CARD_SETS,
  type EventStudyResult,
  type EventStudySeries,
  type EventStudySeriesId,
} from '@/lib/data/analysis/event-study';
import { ALIGNMENT_LABEL } from '@/lib/data/grid/observation-window';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import EventStudyChart, {
  type EventChartColor,
} from '@/components/analysis/gas-crisis/EventStudyChart';
import EventTimeline from '@/components/analysis/EventTimeline';
import EventHero from '@/components/analysis/EventHero';
import { REMAL_2024, eventWindow } from '@/lib/data/analysis/event-registry';
import { loadEventCoverage, loadExternalCoverage } from '@/lib/data/analysis/event-coverage.server';
import { buildNarrative, heroShape, keyFacts } from '@/lib/data/analysis/event-narrative';

/**
 * The second Analysis page: the R-LNG line across Cyclone Remal, May–October
 * 2024, built from the same engine and components as /analysis/gas-crisis-2026.
 *
 * Framed on what the documents show. PGCB's outage log names "Cyclone Remal"
 * for three Barishal 132 kV trips (26 and 28 May); no document in the archive
 * ties the cyclone to gas. Petrobangla prints one aggregated "R-LNG Terminal"
 * row and a remark, "* RPGCL Shutdown.", that it carried on nearly every day
 * from April to 14 July 2024 whatever the line delivered — a standing note,
 * not a report of this event, and never quoted here as one. Which terminal was
 * damaged, and when, is the reporting's claim, and it lives in the timeline's
 * right-hand column with its outlet and the basis for its date.
 *
 * Three differences from the 2026 page, each forced by the era rather than
 * chosen (EVENT_STUDY_REMAL_2024.md):
 *   - PGCB printed no daily energy unserved before 2025, so the shortfall is
 *     read at the evening peak and the intensity bar is the sum of P1's nine
 *     zone load-shed rows (D).
 *   - NLDC's hourly load-shed page was first captured in April 2026, so there
 *     is no hourly panel; the section says why instead of rendering an empty
 *     chart.
 *   - The newsroom's first article is November 2024, so the only reporting is
 *     external, and the empty days say that rather than "no coverage filed".
 */

export const revalidate = 3600;

const def = REMAL_2024;
const WINDOW = eventWindow(def);
const BASELINE = def.baseline;
const PATH = `/analysis/${def.slug}`;

export const metadata = {
  title: 'The R-LNG Line After Cyclone Remal, May–October 2024 — Bangladesh event study',
  description:
    'How Bangladesh’s imported gas fell over Cyclone Remal and held near 600 MMCFD for four months in 2024 — generation, cost and the evening-peak shortfall.',
  alternates: { canonical: PATH },
  keywords: [
    'Cyclone Remal LNG',
    'Bangladesh gas supply 2024',
    'R-LNG shortfall 2024',
    'RPGCL LNG supply',
    'Petrobangla gas production',
    'PGCB load shedding 2024',
  ],
  openGraph: {
    type: 'article',
    url: PATH,
    siteName: 'ESB PowerLine',
    title: 'The R-LNG Line After Cyclone Remal, 2024',
    description:
      'An event study from the official record: the imported-gas line over Cyclone Remal and the four months after it.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

/* ── formatting helpers (presentation only — no figure is invented here) ── */

function fmt(v: number | null, digits = 1): string {
  if (v === null) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function fmtSigned(v: number | null, digits = 1): string {
  if (v === null) return '—';
  const s = v.toLocaleString('en-US', { maximumFractionDigits: digits });
  return v > 0 ? `+${s}` : s;
}

function docSpan(files: string[]): string {
  if (files.length === 0) return 'no document cited';
  if (files.length === 1) return files[0];
  return `${files[0]} … ${files[files.length - 1]} (${files.length} documents)`;
}

const CARD_CHART_KIND: Record<string, Record<string, 'area' | 'bar' | 'line'>> = {
  'gas-supply': { gasNational: 'line', gasRlng: 'area' },
  'gas-to-power': { gasToPower: 'area' },
  generation: { gasGen: 'area', hfoGen: 'line', coalGen: 'line' },
  // Shed at the peak is a reading at one hour on one day, so it is a bar;
  // demand and generation at that hour are the two lines it sits between.
  'peak-shortfall': { eveningPeakDemand: 'line', eveningPeakGen: 'line', eveningShed: 'bar' },
  cost: { dailyCost: 'area' },
};

const CARD_COLORS: Record<string, Record<string, EventChartColor>> = {
  'gas-supply': {
    gasNational: { kind: 'slot', index: 0 },
    gasRlng: { kind: 'slot', index: 6 },
  },
  'gas-to-power': { gasToPower: { kind: 'slot', index: 2 } },
  generation: {
    gasGen: { kind: 'fuel', name: 'Gas' },
    hfoGen: { kind: 'fuel', name: 'HFO' },
    coalGen: { kind: 'fuel', name: 'Coal' },
  },
  'peak-shortfall': {
    eveningPeakDemand: { kind: 'slot', index: 3 },
    eveningPeakGen: { kind: 'slot', index: 0 },
    eveningShed: { kind: 'slot', index: 7 },
  },
  cost: { dailyCost: { kind: 'slot', index: 1 } },
};

const SUBJECT_HEADING: Record<string, string> = {
  'the cyclone': 'Rows that name the cyclone',
  'gas supply': 'Rows that name the gas supply',
  'coal supply': 'Rows that name the coal supply',
};

function DeltaTile({ series, digits = 0 }: { series: EventStudySeries; digits?: number }) {
  const b = series.baseline;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">
        {series.label} <GridProvenanceTag kind={series.provenance} />
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">
        {fmtSigned(b.delta, digits)} <span className="text-sm font-normal">{series.unit}</span>
      </p>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
        {b.windowMean !== null && b.baselineMean !== null ? (
          <>
            window mean {fmt(b.windowMean, digits)} vs baseline {fmt(b.baselineMean, digits)}{' '}
            {series.unit} <GridProvenanceTag kind="D" />
          </>
        ) : (
          <>not computable — no {series.publisher} figure is held in one of the ranges</>
        )}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-3 text-[10.5px] leading-4 text-muted-foreground/90">
        <span className="tabular-nums">
          window {series.windowCoverage.publishedDays}/{series.windowCoverage.expectedDays} days
        </span>
        <span className="tabular-nums">
          baseline {series.baselineCoverage.publishedDays}/{series.baselineCoverage.expectedDays} days
        </span>
      </p>
    </div>
  );
}

export default async function Remal2024Page() {
  const [study, quotes, coverage, external] = await Promise.all([
    loadEventStudy(def),
    loadOutageQuotes(def),
    loadEventCoverage(def),
    loadExternalCoverage(def),
  ]);
  const narrative = buildNarrative(
    def,
    study as EventStudyResult,
    coverage.ok ? coverage.items : [],
    ['gasNational', 'gasGen'],
    external,
    coverage.ok,
  );
  // The break, the day PGCB's own log first names the cyclone, and the
  // detected inflections. The second marker is the archive's, not the press's:
  // its label points at the outage log, which is where the name appears.
  const chartMarkers = [
    { date: def.incidentDate, label: 'the break', strong: true },
    { date: '2024-05-26', label: 'Remal in PGCB log', strong: false },
    ...narrative.days
      .filter((d) => d.inflection && d.date !== def.incidentDate && d.date !== '2024-05-26')
      .map((d) => ({ date: d.date, label: '', strong: false })),
  ];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';
  const cards = CHAIN_CARD_SETS[def.chainCards];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AnalysisNewsArticle',
    headline: 'The R-LNG Line After Cyclone Remal, May–October 2024',
    description:
      'An event study of Bangladesh’s 2024 R-LNG shortfall around Cyclone Remal, built from the official daily records of Petrobangla and PGCB.',
    url: `${baseUrl}${PATH}`,
    datePublished: '2026-09-13',
    author: { '@type': 'Organization', name: 'ESB PowerLine', url: baseUrl },
    publisher: { '@type': 'Organization', name: 'ESB PowerLine', url: baseUrl },
    isBasedOn: [
      { '@type': 'Organization', name: 'Petrobangla', url: 'https://petrobangla.org.bd/' },
      { '@type': 'Organization', name: 'Power Grid Company of Bangladesh (PGCB)', url: 'https://www.pgcb.gov.bd/' },
    ],
    temporalCoverage: `${WINDOW.start}/${WINDOW.end}`,
    spatialCoverage: { '@type': 'Place', name: 'Bangladesh' },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Event studies', item: `${baseUrl}/analysis` },
      { '@type': 'ListItem', position: 3, name: 'The R-LNG Line After Cyclone Remal, 2024', item: `${baseUrl}${PATH}` },
    ],
  };

  const s = study.series;
  const facts = keyFacts(def, study as EventStudyResult, narrative);
  const shape = heroShape(study as EventStudyResult, def.headlineSeries, def.incidentDate, 'gasRlngCapacity');
  // The newsroom did not exist yet. Printing "0 ESB PowerLine articles" would
  // read as a newsroom that looked away; saying when it began is the fact.
  const newsroomPart = !coverage.ok
    ? 'ESB PowerLine coverage unavailable · '
    : narrative.totals.coverageCount > 0
      ? `${narrative.totals.coverageCount} ESB PowerLine articles · `
      : 'no ESB PowerLine coverage (the newsroom began in November 2024) · ';
  const sourceLine =
    `${study.sourceFiles.petrobangla.length} Petrobangla gas reports and ` +
    `${study.sourceFiles.pgcb.length} PGCB workbooks, each named on the card it feeds · ` +
    newsroomPart +
    `${narrative.totals.externalCount + narrative.undatedExternal.length} reports from ` +
    `${narrative.totals.externalOutlets.length} other outlets`;
  const peakShed = narrative.totals.intensityPeak;

  const quoteGroups = ['the cyclone', 'gas supply', 'coal supply']
    .map((subject) => ({ subject, rows: quotes.filter((q) => q.subject === subject) }))
    .filter((g) => g.rows.length > 0);

  return (
    <main className="container container--shell py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 text-[12px] text-muted-foreground">
        <Link prefetch={false} href="/analysis" className="underline-offset-4 hover:text-foreground hover:underline">
          All event studies
        </Link>
      </nav>

      <EventHero
        kicker="Analysis · event study"
        title="The R-LNG line after Remal"
        dateline="Bangladesh · 21 May – 5 Oct 2024"
        seriesLabel={s.gasRlng.label}
        shape={shape}
        facts={facts}
        standfirst={
          <>
            For three days the imported-gas line ran where it had run all spring —{' '}
            <span className="tabular-nums">1,089, 1,077, 1,039</span> MMCFD. On the gas day
            starting <strong className="font-semibold text-foreground">24 May 2024</strong>,
            Petrobangla printed it at <strong className="font-semibold text-foreground">646.7</strong>,
            and at <strong className="font-semibold text-foreground">325.5</strong> the next. It
            came back to 906.6 on the 27th, settled near{' '}
            <strong className="font-semibold text-foreground">600</strong> on 30 May, and stayed
            there for four months, until 2 October.
          </>
        }
        meta={[
          { label: 'Window', value: `${WINDOW.start} → ${WINDOW.end}` },
          { label: 'Baseline', value: `${BASELINE.start} → ${BASELINE.end}` },
          { label: 'Gas day', value: '08:00 → 08:00 the next morning' },
          { label: 'Energy day', value: '00:00 → 24:00, BST (UTC+06:00)' },
          { label: 'Sources', value: sourceLine },
        ]}
      />

      <aside className="mb-10 rounded-2xl border-l-4 border-l-primary border-y border-r border-border bg-card px-5 py-4 sm:px-6">
        <p className="text-[0.9375rem] leading-7 text-muted-foreground">
          <strong className="font-semibold text-foreground">The record names the storm, not the terminal.</strong>{' '}
          PGCB&rsquo;s outage log cites &ldquo;Cyclone Remal&rdquo; for three transmission trips at
          Barishal. Petrobangla names nothing: one aggregated &ldquo;R-LNG Terminal&rdquo; row, and
          a remark, &ldquo;RPGCL Shutdown&rdquo;, that it printed on nearly every day from April to
          mid-July whether the line delivered 1,098 MMCFD or 243. That remark is a standing note,
          not a report of this event. Which terminal was damaged, and when, is the press&rsquo;s
          account, shown in its own column with the basis for each date.
        </p>
      </aside>

      <section aria-labelledby="deltas-h" className="mb-10">
        <h2 id="deltas-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground mb-1">
          The window against its baseline
        </h2>
        <p className="mb-5 text-[13px] leading-6 text-muted-foreground">
          Signed differences of means, and nothing more — no scores, no percentages. Each mean is
          taken over the days this archive holds in{' '}
          <span className="tabular-nums text-foreground/80">
            {WINDOW.start} – {WINDOW.end}
          </span>{' '}
          against the baseline{' '}
          <span className="tabular-nums text-foreground/80">
            {BASELINE.start} – {BASELINE.end}
          </span>
          ; a day with no figure is excluded and counted, never zeroed. The counts under each tile
          are that tile&rsquo;s own.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DeltaTile series={s.gasRlng} />
          <DeltaTile series={s.gasNational} />
          <DeltaTile series={s.gasGen} digits={1} />
          <DeltaTile series={s.eveningShed} />
        </div>
      </section>

      <section aria-labelledby="timeline-h" className="mb-12">
        <h2 id="timeline-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">
          Day by day
        </h2>
        <p className="mt-1.5 mb-2 text-[13px] leading-6 text-muted-foreground">
          {narrative.totals.windowDays} days, in order. The left column is the national record for
          that day and the change on the day before; the right column is what the press reported,
          placed on the day each report describes. Days marked{' '}
          <span className="font-semibold text-primary">sharp move</span> are days the imported-gas
          line moved more than 12% against the previous published day — found in the data, not
          chosen. {narrative.totals.externalCount} reports are placed, from{' '}
          {narrative.totals.externalOutlets.join(', ')}.
        </p>
        {peakShed && (
          <p className="mb-4 text-xs text-muted-foreground">
            The red bar on each day is load shed at the evening peak — the sum of PGCB&rsquo;s nine
            zone rows at that hour, calculated here <GridProvenanceTag kind="D" /> — scaled against
            the largest in the window:{' '}
            <strong>{peakShed.value.toLocaleString('en-US', { maximumFractionDigits: 0 })} MW</strong>{' '}
            on {peakShed.date}. A day whose zone table is not held gets no bar at all.
          </p>
        )}
        <EventTimeline
          narrative={narrative}
          emptyDayNote="No report in this page’s press selection is dated to this day."
        />
        {narrative.undatedExternal.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-muted/15 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Also reported · date not established
            </p>
            <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
              These pages refused automated retrieval, so their dates and text were not read. They
              are listed rather than placed, because a date nothing supports would be a claim.
            </p>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {narrative.undatedExternal.map((e) => (
                <li key={e.url} className="text-[13px] leading-6">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-medium text-foreground decoration-border underline-offset-4 hover:underline hover:decoration-primary"
                  >
                    {e.headline}
                  </a>
                  <span className="ml-1.5 text-[11px] text-muted-foreground">— {e.outlet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {cards.map((card) => {
        const cardSeries = card.seriesIds.map((id: EventStudySeriesId) => s[id]);
        const unit = cardSeries[0].unit;
        const isCost = card.key === 'cost';
        return (
          <section key={card.key} aria-labelledby={`${card.key}-h`} className="mb-10">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <h2 id={`${card.key}-h`} className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">
                {card.question}
              </h2>
              <p className="mt-1.5 mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] leading-5 text-muted-foreground">
                {cardSeries.map((cs, i) => (
                  <span key={cs.id}>
                    {i > 0 && ' · '}
                    {cs.label} <GridProvenanceTag kind={cs.provenance} /> ({cs.publisher},{' '}
                    {ALIGNMENT_LABEL[cs.alignment].toLowerCase()})
                  </span>
                ))}
              </p>
              <EventStudyChart
                series={cardSeries.map((cs) => ({
                  id: cs.id,
                  label: cs.label,
                  color: CARD_COLORS[card.key]?.[cs.id] ?? { kind: 'slot', index: 0 },
                  kind: CARD_CHART_KIND[card.key]?.[cs.id] ?? 'line',
                  points: isCost
                    ? cs.points.map((p) => ({ date: p.date, value: p.value === null ? null : p.value / 1e9 }))
                    : cs.points,
                }))}
                unit={isCost ? 'bn Tk' : unit}
                height={card.key === 'gas-supply' ? 340 : 300}
                capacity={
                  card.key === 'gas-supply'
                    ? { id: s.gasRlngCapacity.id, label: s.gasRlngCapacity.label, points: s.gasRlngCapacity.points }
                    : undefined
                }
                markers={card.key === 'cost' ? [] : chartMarkers}
                shade={{ from: WINDOW.start, to: def.incidentDate, label: 'before' }}
                baselineMean={
                  card.seriesIds.length === 1
                    ? isCost && cardSeries[0].baseline.baselineMean !== null
                      ? cardSeries[0].baseline.baselineMean / 1e9
                      : cardSeries[0].baseline.baselineMean
                    : null
                }
              />
              {cardSeries.some((cs) => cs.windowCoverage.publishedDays < cs.windowCoverage.expectedDays) && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {cardSeries
                    .filter((cs) => cs.windowCoverage.publishedDays < cs.windowCoverage.expectedDays)
                    .map(
                      (cs) =>
                        `${cs.label}: this archive holds ${cs.windowCoverage.publishedDays} of ${cs.windowCoverage.expectedDays} days`,
                    )
                    .join(' · ')}
                  ; days not held render as breaks, never as zero.
                </p>
              )}
              <GridCardFooter className="mt-3">
                <span className="text-[11px] text-muted-foreground">
                  {/* Every series' note is listed once. The derived sum's note
                      already states its formula, so it is not repeated. */}
                  {cardSeries[0].publisher === 'Petrobangla' ? (
                    <>Source: {docSpan(study.sourceFiles.petrobangla)} — {cardSeries[0].sourceNote}.</>
                  ) : (
                    <>Source: {docSpan(study.sourceFiles.pgcb)} — {cardSeries.map((cs) => cs.sourceNote).join('; ')}.</>
                  )}
                </span>
              </GridCardFooter>
            </div>
          </section>
        );
      })}

      <section aria-labelledby="outages-h" className="mb-10">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 id="outages-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">
            What the outage log itself says
          </h2>
          <p className="mt-1.5 mb-4 text-[13px] leading-6 text-muted-foreground">
            Every row in the window whose printed reason names the cyclone or a fuel supply, quoted
            verbatim from PGCB&rsquo;s daily log. This is a reading of the log, not a statistic:
            most &ldquo;gas&rdquo; entries in it are SF6 breaker gas and most &ldquo;storm&rdquo;
            entries are ordinary thunderstorms, so no count is published. The cyclone rows are all
            transmission trips; no row ties Remal to a gas or LNG outage.
          </p>
          {quoteGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              The cited rows are no longer present in the archive — see the methodology note on
              republished days.
            </p>
          ) : (
            <div className="space-y-6">
              {quoteGroups.map((g) => (
                <div key={g.subject}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {SUBJECT_HEADING[g.subject]}
                  </p>
                  <ul className="space-y-3">
                    {g.rows.map((q) => (
                      <li key={`${q.date}-${q.plant}`} className="rounded-xl border border-border/60 p-3">
                        <p className="text-sm font-medium text-foreground">
                          {q.date} — {q.plant}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">&ldquo;{q.reason}&rdquo;</p>
                        {/Summit/.test(q.plant) && (
                          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                            Meghnaghat Summit CCPP is a power station owned by the same group as the
                            Summit LNG terminal. It is a different asset.
                          </p>
                        )}
                        {q.pgcbSourceFile && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {q.pgcbSourceFile} <GridProvenanceTag kind="P" />
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="hourly-h" className="mb-10">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 id="hourly-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">
            Hour by hour
          </h2>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
            Not available for this window. NLDC&rsquo;s hourly load-shed page keeps roughly the
            last 145 days, and this archive began capturing it in April 2026, so no hourly shedding
            record for 2024 is held here. The evening-peak card above is the finest-grained
            shortfall PGCB printed for these days.
          </p>
        </div>
      </section>

      <section aria-labelledby="method-h" className="mb-8">
        <div className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-7 text-[13.5px] leading-7 text-muted-foreground">
          <h2 id="method-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground mb-3">
            Methodology, and its limits
          </h2>
          <ul className="list-disc space-y-3 pl-5 lg:columns-2 lg:gap-x-10 [&>li]:break-inside-avoid">
            <li>
              <strong className="text-foreground">The data column asserts no cause.</strong> The
              one cause any document here names is the cyclone, in PGCB&rsquo;s log, for
              transmission trips. The terminal, the vessel and the damage are the press&rsquo;s
              account, dated and linked in the right-hand column and never merged into a figure.
            </li>
            <li>
              <strong className="text-foreground">The break comes before the storm.</strong> The
              line fell on the gas day starting 24 May; PGCB&rsquo;s log first names the cyclone on
              26 May. The page marks both and explains neither by the other.
            </li>
            <li>
              <strong className="text-foreground">Why the shortfall is read at the evening peak.</strong>{' '}
              PGCB&rsquo;s workbook printed no daily energy demand or energy unserved before 2025.
              Evening-peak demand and generation are printed in every era. The shed bar sums the
              nine zone rows PGCB prints at that hour, and is left empty unless all nine carry a
              number — a partial sum would understate the hour.
            </li>
            <li>
              <strong className="text-foreground">The shortfall is not larger than the record.</strong>{' '}
              Load shed at the evening peak shows no spike at Remal. The window&rsquo;s largest
              readings come in late June and September, and the baseline has its own heatwave peak
              of 1,533 MW on 29 April. The page reports that as found.
            </li>
            <li>
              <strong className="text-foreground">Eight gas days are not held.</strong> No
              Petrobangla report for the gas days 17–22 and 25–26 July 2024 is in this archive.
              Whether Petrobangla published them was not established, so the page says
              &ldquo;not held&rdquo; rather than &ldquo;not filed&rdquo;, and the chart breaks.
            </li>
            <li>
              <strong className="text-foreground">&ldquo;Sharp move&rdquo; is measured, not chosen.</strong>{' '}
              A day is marked when the imported-gas line moved 12% or more against the previous
              published day. Chapter-level phases are detected from level shifts in the same
              series.
            </li>
            <li>
              <strong className="text-foreground">No forecast, no projection, no estimate.</strong>{' '}
              Every point is a published figure or a stated formula over published figures.
              Baseline comparisons are signed differences of means over days held; a day with no
              figure is excluded and counted, never zeroed or interpolated.
            </li>
            <li>
              <strong className="text-foreground">The baseline is not calm.</strong> It holds two
              one-day R-LNG dips of its own, 828.4 on 1 May and 818.9 on 19 May, and Petrobangla
              printed the terminal capacity as 1,000 until 26 April and 1,100 after. Neither is
              trimmed out.
            </li>
            <li>
              <strong className="text-foreground">Windows are not silently aligned.</strong> A
              Petrobangla gas day runs 08:00→08:00 and anchors to the day it opens; a PGCB energy
              day runs midnight to midnight. That is why gas supply and electricity are never drawn
              on one axis here.
            </li>
            <li>
              <strong className="text-foreground">The press column is a selection.</strong> It
              holds the reports gathered for this page on 13 September 2026, each placed on the day
              its own text states. Three pages refused retrieval and are listed undated. ESB
              PowerLine began publishing in November 2024, so none of its own reporting falls in
              this window.
            </li>
            <li>
              Figures marked <GridProvenanceTag kind="P" /> are a publisher&rsquo;s own, reproduced
              unchanged; <GridProvenanceTag kind="D" /> are calculated by ESB PowerLine from
              published figures, with the formula stated where they appear. Explore any single day
              of this window in the{' '}
              <Link prefetch={false} href="/grid-explorer" className="underline text-foreground">
                Grid Explorer
              </Link>
              .
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
