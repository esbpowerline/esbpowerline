import Link from 'next/link';
import { safeJsonLd } from '@/lib/json-ld';
import {
  GAS_CRISIS_BASELINE,
  GAS_CRISIS_WINDOW,
  loadGasCrisisStudy,
  loadGasSupplyOutageQuotes,
} from '@/lib/data/analysis/event-study.server';
import {
  CHAIN_CARDS,
  type EventStudyResult,
  type EventStudySeries,
  type EventStudySeriesId,
} from '@/lib/data/analysis/event-study';
import { ALIGNMENT_LABEL } from '@/lib/data/grid/observation-window';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import EventStudyChart, {
  type EventChartColor,
} from '@/components/analysis/gas-crisis/EventStudyChart';
import HourlyShedPanel from '@/components/analysis/gas-crisis/HourlyShedPanel';
import EventTimeline from '@/components/analysis/EventTimeline';
import { GAS_CRISIS_2026 } from '@/lib/data/analysis/event-registry';
import { loadEventCoverage, loadExternalCoverage } from '@/lib/data/analysis/event-coverage.server';
import { buildNarrative, heroShape, keyFacts } from '@/lib/data/analysis/event-narrative';
import EventHero from '@/components/analysis/EventHero';

/**
 * The first Analysis page: an event study of the July–August 2026 R-LNG
 * shortfall, built entirely from figures this archive already holds.
 *
 * Named for what the documents show — an R-LNG supply collapse — and not for a
 * cause. No document in the archive names an FSRU outage: Petrobangla's daily
 * prints one aggregated "R-LNG Terminal" row (capacity 1,100 MMCFD, unchanged
 * all window) and never says why its output fell 993.5 → 621.6 MMCFD on the
 * gas day starting 2026-07-21. The chain on this page is a READING ORDER over
 * five publishers' series, not a causal claim; the archive's own June (62.3
 * GWh unserved on 06-28 with gas at full supply) is the standing proof that
 * shedding is not uniquely a gas story. PHASE1_EVENT_STUDY_FINDINGS.md records
 * the evidence behind every choice here.
 *
 * Everything daily is server-rendered from the same loaders the explorer uses
 * (release precedence and the Petrobangla window check included); the hourly
 * panel goes through /api/grid/history/series, which enforces the plan window
 * — this page must not become a second door to gated hours.
 */

// Historical days can still be corrected by a DataRelease, so revalidate
// rather than render fully static; an hour is plenty for a closed window.
export const revalidate = 3600;

export const metadata = {
  title: 'The R-LNG Shortfall, July–August 2026 — Bangladesh gas crisis event study',
  description:
    'How Bangladesh’s grid moved when R-LNG supply fell from ~1,040 to ~500, then ~300 MMCFD: gas supply, gas-fired generation, substitution, cost and load shedding, day by day and hour by hour — every figure from the official PGCB, Petrobangla and NLDC records.',
  alternates: { canonical: '/analysis/gas-crisis-2026' },
  keywords: [
    'Bangladesh gas crisis 2026',
    'R-LNG shortfall',
    'Bangladesh load shedding 2026',
    'RPGCL LNG supply',
    'Petrobangla gas production',
    'Bangladesh electricity shortage',
    'PGCB load shedding data',
  ],
  openGraph: {
    type: 'article',
    url: '/analysis/gas-crisis-2026',
    siteName: 'ESB PowerLine',
    title: 'The R-LNG Shortfall, July–August 2026',
    description:
      'An event study from the official record: what the grid lost when R-LNG supply halved, and what was shed.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

/* ── formatting helpers (presentation only — no figure is invented here) ── */

function fmt(v: number | null, digits = 1): string {
  // The dash is the honest print for an absent figure; a 0 here would assert a
  // measurement nobody made.
  if (v === null) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function fmtSigned(v: number | null, digits = 1): string {
  if (v === null) return '—';
  const s = v.toLocaleString('en-US', { maximumFractionDigits: digits });
  return v > 0 ? `+${s}` : s;
}

/**
 * First..last of the document list, with the count. The list arrives in DAY
 * order from `buildEventStudy` and is used as-is: the held names mix formats,
 * so a lexical sort would present two arbitrary names as the endpoints.
 */
function docSpan(files: string[]): string {
  if (files.length === 0) return 'no document cited';
  if (files.length === 1) return files[0];
  return `${files[0]} … ${files[files.length - 1]} (${files.length} documents)`;
}

/**
 * How each series draws. Rates get an area, accumulated amounts get bars.
 * `unserved` was a smoothed line, which read as a trend continuing between the
 * days; it is an amount that happened on one day and a bar says so.
 */
const CARD_CHART_KIND: Record<string, Record<string, 'area' | 'bar' | 'line'>> = {
  'gas-supply': { gasNational: 'line', gasRlng: 'area' },
  'gas-to-power': { gasToPower: 'area' },
  generation: { gasGen: 'area', hfoGen: 'line', coalGen: 'line' },
  shortfall: { totalGen: 'line', demand: 'line', unserved: 'bar' },
  cost: { dailyCost: 'area' },
};

/** Per-frame colour assignment — slots differ within each card, never across-checked. */
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
  shortfall: {
    totalGen: { kind: 'slot', index: 0 },
    demand: { kind: 'slot', index: 3 },
    unserved: { kind: 'slot', index: 7 },
  },
  cost: { dailyCost: { kind: 'slot', index: 1 } },
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
          <>not computable — {series.publisher} filed no figure in one of the ranges</>
        )}
      </p>
      {/*
        Coverage per tile, not the whole formula per tile.

        Each tile still states its OWN denominators — they differ by publisher,
        and a single shared line was wrong for half of them: Petrobangla has no
        document whose window starts on 2026-06-21 so its baseline is 29 of 30,
        while PGCB filed all 30. But the previous version printed the entire
        formula in each tile, which repeated the identical 45-day window four
        times in 10px grey and pushed the four tiles out of rhythm. The shared
        half now sits once, above the grid; what differs stays here.
      */}
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

export default async function GasCrisis2026Page() {
  const def = GAS_CRISIS_2026;
  const [study, quotes, coverage, external] = await Promise.all([
    loadGasCrisisStudy(),
    loadGasSupplyOutageQuotes(),
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
  /**
   * The chart markers are the timeline's own inflection days — the same 12%
   * rule, so the rules on the charts and the rules in the story cannot drift
   * apart. The incident day is emphasised; the rest are hairlines.
   */
  const chartMarkers = [
    { date: def.incidentDate, label: 'the break', strong: true },
    ...narrative.days
      .filter((d) => d.inflection && d.date !== def.incidentDate)
      .map((d) => ({ date: d.date, label: '', strong: false })),
  ];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AnalysisNewsArticle',
    headline: 'The R-LNG Shortfall, July–August 2026',
    description:
      'An event study of Bangladesh’s July–August 2026 gas shortfall, built from the official daily records of Petrobangla, PGCB and NLDC.',
    url: `${baseUrl}/analysis/gas-crisis-2026`,
    datePublished: '2026-09-05',
    author: { '@type': 'Organization', name: 'ESB PowerLine', url: baseUrl },
    publisher: { '@type': 'Organization', name: 'ESB PowerLine', url: baseUrl },
    // The originators, named — every figure on this page is theirs.
    isBasedOn: [
      { '@type': 'Organization', name: 'Petrobangla', url: 'https://petrobangla.org.bd/' },
      { '@type': 'Organization', name: 'Power Grid Company of Bangladesh (PGCB)', url: 'https://www.pgcb.gov.bd/' },
    ],
    temporalCoverage: `${GAS_CRISIS_WINDOW.start}/${GAS_CRISIS_WINDOW.end}`,
    spatialCoverage: { '@type': 'Place', name: 'Bangladesh' },
  };
  // Two levels, deliberately: /analysis has no index page yet, and a crumb the
  // nav does not honour would be a structured-data claim the site does not keep.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'The R-LNG Shortfall, July–August 2026',
        item: `${baseUrl}/analysis/gas-crisis-2026`,
      },
    ],
  };

  const s = study.series;
  // The masthead panel: derived from the same series the timeline renders, so
  // an "at a glance" box cannot quietly stop agreeing with its own page.
  const facts = keyFacts(def, study as EventStudyResult, narrative);
  const shape = heroShape(
    study as EventStudyResult,
    def.headlineSeries,
    def.incidentDate,
    'gasRlngCapacity',
  );
  const sourceLine =
    `${study.sourceFiles.petrobangla.length} Petrobangla gas reports and ` +
    `${study.sourceFiles.pgcb.length} PGCB workbooks, each named on the card it feeds · ` +
    // Never print "0 articles" for a read that failed — that is a claim about
    // the newsroom, and a connection timeout is not evidence of one.
    (narrative.coverageAvailable
      ? `${narrative.totals.coverageCount} ESB PowerLine articles · `
      : 'ESB PowerLine coverage unavailable · ') +
    `${narrative.totals.externalCount + narrative.undatedExternal.length} reports from ` +
    `${narrative.totals.externalOutlets.length} other outlets`;

  return (
    <main className="container container--shell py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      {/* ── hero ───────────────────────────────────────────────────────── */}
      <EventHero
        kicker="Analysis · event study"
        title="The R-LNG shortfall"
        dateline="Bangladesh · 18 Jul – 31 Aug 2026"
        seriesLabel={s.gasRlng.label}
        shape={shape}
        facts={facts}
        standfirst={
          <>
            For three ordinary days the imported-gas line sat where it had sat all month —{' '}
            <span className="tabular-nums">966, 976, 993</span> MMCFD. On the gas day starting{' '}
            <strong className="font-semibold text-foreground">21 July 2026</strong>, Petrobangla
            printed it at <strong className="font-semibold text-foreground">621.6</strong>. It
            settled near 500, fell again to{' '}
            <strong className="font-semibold text-foreground">300</strong> on 13–14 August, and had
            not recovered its July level by the time this window closes.
          </>
        }
        meta={[
          { label: 'Window', value: `${GAS_CRISIS_WINDOW.start} → ${GAS_CRISIS_WINDOW.end}` },
          { label: 'Baseline', value: `${GAS_CRISIS_BASELINE.start} → ${GAS_CRISIS_BASELINE.end}` },
          { label: 'Gas day', value: '08:00 → 08:00 the next morning' },
          { label: 'Energy day', value: '00:00 → 24:00, BST (UTC+06:00)' },
          { label: 'Sources', value: sourceLine },
        ]}
      />

      {/*
        The cause note was the hero's third paragraph, which buried the single
        most important thing about this page under two others. It is a standing
        caveat on everything below, so it reads as one.
      */}
      <aside className="mb-10 rounded-2xl border-l-4 border-l-primary border-y border-r border-border bg-card px-5 py-4 sm:px-6">
        <p className="text-[0.9375rem] leading-7 text-muted-foreground">
          <strong className="font-semibold text-foreground">Petrobangla never names a cause.</strong>{' '}
          Its daily report carries one aggregated &ldquo;R-LNG Terminal&rdquo; row — no terminal, no
          vessel, no fault, on any day of this window. So this page does not assert one either.
          Where the reporting names a cause it is quoted, linked, and left to stand on its own
          sourcing, in its own column beside the figures rather than inside them.
        </p>
      </aside>

      {/* ── the headline deltas (all DERIVED, formula on each series) ───── */}
      <section aria-labelledby="deltas-h" className="mb-10">
        <h2 id="deltas-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground mb-1">
          The window against its baseline
        </h2>
        <p className="mb-5 text-[13px] leading-6 text-muted-foreground">
          Signed differences of means, and nothing more — no scores, no percentages. Each mean is
          taken over the days a publisher actually filed in{' '}
          <span className="tabular-nums text-foreground/80">
            {GAS_CRISIS_WINDOW.start} – {GAS_CRISIS_WINDOW.end}
          </span>{' '}
          against the baseline{' '}
          <span className="tabular-nums text-foreground/80">
            {GAS_CRISIS_BASELINE.start} – {GAS_CRISIS_BASELINE.end}
          </span>
          ; a day nobody filed is excluded and counted, never zeroed. The counts under each tile
          are that tile&rsquo;s own — they differ by publisher.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DeltaTile series={s.gasRlng} />
          <DeltaTile series={s.gasNational} />
          <DeltaTile series={s.gasGen} digits={1} />
          <DeltaTile series={s.unserved} digits={1} />
        </div>
      </section>

      {/* ── the story, day by day ───────────────────────────────────────── */}
      <section aria-labelledby="timeline-h" className="mb-12">
        <h2 id="timeline-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">
          Day by day
        </h2>
        <p className="mt-1.5 mb-2 text-[13px] leading-6 text-muted-foreground">
          {narrative.totals.windowDays} days, in order. The left column is the national record for
          that day and the change on the day before; the right column is what ESB PowerLine
          published that day, plus what the wider press reported, linked. Days marked{' '}
          <span className="font-semibold text-primary">sharp move</span> are days the imported-gas
          line moved more than 12% against the previous published day — found in the data, not
          chosen. {narrative.coverageAvailable
            ? `${narrative.totals.coverageCount} of our articles are placed on their filing date, and `
            : 'Our own coverage could not be loaded for this render — the column is empty because the read failed, not because nothing was filed. '}
          {narrative.totals.externalCount} external reports on the day they describe —{' '}
          {narrative.totals.externalOutlets.join(', ')}.
        </p>
        {narrative.totals.intensityPeak && (
          <p className="mb-4 text-xs text-muted-foreground">
            The red bar on each day is energy unserved, scaled against the worst published day in
            the window: <strong>{narrative.totals.intensityPeak.value.toLocaleString('en-US', { maximumFractionDigits: 1 })}{' '}
            {narrative.totals.intensityUnit}</strong> on {narrative.totals.intensityPeak.date}. A
            day PGCB did not file gets no bar at all rather than an empty one.
          </p>
        )}
        <EventTimeline narrative={narrative} />
        {narrative.orphanCoverage.length > 0 && (
          <p className="mt-4 text-[12px] leading-6 text-muted-foreground">
            {narrative.orphanCoverage.length} related article(s) fall outside the window shown and
            are not placed above.
          </p>
        )}
        {narrative.undatedExternal.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-muted/15 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Also reported during the window · date not established
            </p>
            <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
              These sit outside the day-by-day list on purpose. Placing a report on a day we could
              not establish would put a date on the record that nothing supports — the same
              standard the archive applies to its own figures.
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

      {/* ── the chain, one card per question ────────────────────────────── */}
      {CHAIN_CARDS.map((card) => {
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
                  // Rates read as areas, accumulated amounts as bars. Energy
                  // unserved is an amount on a day, not a trend running through
                  // it, and a smoothed line said the wrong thing about it.
                  kind: CARD_CHART_KIND[card.key]?.[cs.id] ?? 'line',
                  points: isCost
                    ? // Axis scaling only — Taka to billion Taka. The quantity is
                      // unchanged; 2,387,798,687 is unreadable on a tick label.
                      cs.points.map((p) => ({
                        date: p.date,
                        value: p.value === null ? null : p.value / 1e9,
                      }))
                    : cs.points,
                }))}
                unit={isCost ? 'bn Tk' : unit}
                height={card.key === 'gas-supply' ? 340 : 300}
                // The publisher's own printed capacity, on the card about the
                // line that fell away from it.
                capacity={
                  card.key === 'gas-supply'
                    ? {
                        id: s.gasRlngCapacity.id,
                        label: s.gasRlngCapacity.label,
                        points: s.gasRlngCapacity.points,
                      }
                    : undefined
                }
                markers={card.key === 'cost' ? [] : chartMarkers}
                shade={{
                  from: GAS_CRISIS_WINDOW.start,
                  to: def.incidentDate,
                  label: 'before',
                }}
                baselineMean={
                  card.seriesIds.length === 1
                    ? isCost && cardSeries[0].baseline.baselineMean !== null
                      ? cardSeries[0].baseline.baselineMean / 1e9
                      : cardSeries[0].baseline.baselineMean
                    : null
                }
              />
              {/* Coverage: which days are gaps, said in words, not hidden in a break. */}
              {cardSeries.some((cs) => cs.windowCoverage.publishedDays < cs.windowCoverage.expectedDays) && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {cardSeries
                    .filter((cs) => cs.windowCoverage.publishedDays < cs.windowCoverage.expectedDays)
                    .map(
                      (cs) =>
                        `${cs.label}: ${cs.publisher} filed ${cs.windowCoverage.publishedDays} of ${cs.windowCoverage.expectedDays} days`,
                    )
                    .join(' · ')}
                  ; unfiled days render as breaks, never as zero.
                </p>
              )}
              <GridCardFooter className="mt-3">
                <span className="text-[11px] text-muted-foreground">
                  {cardSeries[0].publisher === 'Petrobangla' ? (
                    <>Source: {docSpan(study.sourceFiles.petrobangla)} — {cardSeries[0].sourceNote}.</>
                  ) : (
                    <>Source: {docSpan(study.sourceFiles.pgcb)} — {cardSeries.map((cs) => cs.sourceNote).join('; ')}.</>
                  )}
                  {cardSeries.some((cs) => cs.provenance === 'D') && (
                    <> Derived series formula: {cardSeries.find((cs) => cs.provenance === 'D')?.sourceNote}.</>
                  )}
                </span>
              </GridCardFooter>
            </div>
          </section>
        );
      })}

      {/* ── the outage log, verbatim ────────────────────────────────────── */}
      <section aria-labelledby="outages-h" className="mb-10">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 id="outages-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">
            What the outage log itself says
          </h2>
          <p className="mt-1.5 mb-4 text-[13px] leading-6 text-muted-foreground">
            Every generating-plant outage in the window whose printed reason names the gas supply,
            quoted verbatim from PGCB&rsquo;s daily log. This is a reading of the log, not a
            statistic — most &ldquo;gas&rdquo; entries in it are SF6 breaker gas at substations,
            so no count is published.
          </p>
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              The cited rows are no longer present in the archive — see the methodology note on
              republished days.
            </p>
          ) : (
            <ul className="space-y-3">
              {quotes.map((q) => (
                <li key={`${q.date}-${q.plant}`} className="rounded-xl border border-border/60 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {q.date} — {q.plant}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">&ldquo;{q.reason}&rdquo;</p>
                  {q.pgcbSourceFile && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {q.pgcbSourceFile} <GridProvenanceTag kind="P" />
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── hour by hour ────────────────────────────────────────────────── */}
      <section aria-labelledby="hourly-h" className="mb-10">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 id="hourly-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground">
            Hour by hour: load shedding
          </h2>
          <p className="mt-1.5 mb-4 text-[13px] leading-6 text-muted-foreground">
            NLDC&rsquo;s hourly record across the window — the series peaked at 3,757 MW on 10
            August. NLDC and PGCB&rsquo;s workbook print this quantity from different pages and
            they do not always agree; this panel is NLDC&rsquo;s account, the daily card above is
            PGCB&rsquo;s, and neither is corrected to the other.
          </p>
          <HourlyShedPanel from={GAS_CRISIS_WINDOW.start} to={GAS_CRISIS_WINDOW.end} />
        </div>
      </section>

      {/* ── methodology — what this page does not do ────────────────────── */}
      <section aria-labelledby="method-h" className="mb-8">
        <div className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-7 text-[13.5px] leading-7 text-muted-foreground">
          <h2 id="method-h" className="text-[1.0625rem] font-bold tracking-[-0.01em] text-foreground mb-3">
            Methodology, and its limits
          </h2>
          <ul className="list-disc space-y-3 pl-5 lg:columns-2 lg:gap-x-10 [&>li]:break-inside-avoid">
            <li>
              <strong className="text-foreground">The data column asserts no cause.</strong>{' '}
              Petrobangla&rsquo;s report carries one aggregated &ldquo;R-LNG Terminal&rdquo; row
              and names no terminal, vessel or fault anywhere in this window. Where a cause
              appears on this page it appears in the right-hand column, as ESB PowerLine
              reporting, linked and dated, resting on that reporting&rsquo;s own sourcing —
              never merged into a figure. Any correspondence between the two columns is the
              reader&rsquo;s to draw. The archive&rsquo;s own June is the caution: 62.3 GWh went
              unserved on 28 June with gas supply at its full ~2,690 MMCFD.
            </li>
            <li>
              <strong className="text-foreground">How the coverage column is selected.</strong>{' '}
              ESB PowerLine articles published inside the window whose title or standfirst
              matches this event&rsquo;s subject terms, which are declared in{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground/80">
                event-registry.ts
              </code>{' '}
              rather than hand-picked per day, so coverage filed later is picked up and the
              selection rule can be audited. {narrative.totals.coverageCount}{' '}
              of the newsroom&rsquo;s pieces in this window match; the rest are energy coverage
              that is not this story. Only published articles appear — a draft or archived piece
              would be a link a reader cannot open. This is a filtered selection, not a claim to
              be the complete record of what was reported.
            </li>
            <li>
              <strong className="text-foreground">The three days before are the point.</strong>{' '}
              18–20 July sat at 966.5, 976.3 and 993.5 MMCFD against the same printed 1,100
              capacity the line kept all the way down. Without them the fall has nothing to be
              measured against, and &ldquo;the day it broke&rdquo; would be an assertion rather
              than something a reader can see.
            </li>
            <li>
              <strong className="text-foreground">
                &ldquo;Sharp move&rdquo; is measured, not chosen.
              </strong>{' '}
              A day is marked when the imported-gas line moved 12% or more against the previous
              published day. Chapter-level phases are detected the same way, from level shifts in
              the published series. No day is emphasised because it made a better story.
            </li>
            <li>
              <strong className="text-foreground">No forecast, no projection, no estimate.</strong>{' '}
              Every point is a published figure or a stated formula over published figures.
              Baseline comparisons are signed differences of means over published days only; a
              day a publisher did not file is excluded and counted, never zeroed or interpolated.
            </li>
            <li>
              <strong className="text-foreground">
                Source inconsistencies are reported, not repaired.
              </strong>{' '}
              PGCB&rsquo;s hourly sheet breaks demand = generation + shedding on nearly every day
              in this window (worst: 169 MW on 10 August); Petrobangla&rsquo;s 20 June PDF prints
              a grand total 3.3 MMCFD away from the sum of its own rows; NLDC&rsquo;s hourly shed
              disagrees with PGCB&rsquo;s workbook on several days. All are published as filed.
            </li>
            <li>
              <strong className="text-foreground">Windows are not silently aligned.</strong> A
              Petrobangla &ldquo;gas day&rdquo; runs 08:00→08:00 and anchors to the day it
              opens; a PGCB &ldquo;energy day&rdquo; runs midnight to midnight. They overlap for
              16 of 24 hours, which is why gas supply and electricity figures are never drawn on
              one axis here. On 13 August the two pull visibly apart — Petrobangla&rsquo;s window
              printed its minimum while PGCB&rsquo;s energy day printed gas-to-power back at 931
              MMCFD — and both are shown as filed.
            </li>
            <li>
              <strong className="text-foreground">The baseline contains a crisis of its own.</strong>{' '}
              The 30 days before the break include the late-June shedding episode. It is not
              trimmed out: a baseline curated to look calm would be an editorial act the reader
              cannot see.
            </li>
            <li>
              <strong className="text-foreground">Hourly access follows your plan.</strong> The
              hourly panel reads the same tier-gated endpoint as the Time Machine; hours outside
              a plan window are shown as restricted, and this page does not route around that.
            </li>
            <li>
              Figures marked <GridProvenanceTag kind="P" /> are a publisher&rsquo;s own, reproduced
              unchanged; <GridProvenanceTag kind="D" /> are calculated by ESB PowerLine from
              published figures, with the formula stated where they appear. Explore any single
              day of this window in the{' '}
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
