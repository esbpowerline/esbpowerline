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
import {
  ALIGNMENT_LABEL,
  formatWindow,
  petrobanglaGasDay,
} from '@/lib/data/grid/observation-window';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import EventStudyChart, {
  type EventChartColor,
} from '@/components/analysis/gas-crisis/EventStudyChart';
import HourlyShedPanel from '@/components/analysis/gas-crisis/HourlyShedPanel';

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
        Each tile states its OWN denominators, because they differ by publisher
        and a single shared line was wrong for half of them: Petrobangla has no
        document whose window starts on energy day 2026-06-21, so its baseline
        is 29 of 30 days, while PGCB filed all 30. Heading this grid with one
        series' formula printed "29 published day(s)" above two PGCB tiles
        computed over 30 — a methodology claim the page could not support, on
        the one page whose entire argument is that every figure is traceable.
      */}
      <p className="mt-2 text-[10px] leading-4 text-muted-foreground/80">{b.formula}</p>
    </div>
  );
}

export default async function GasCrisis2026Page() {
  const study: EventStudyResult = await loadGasCrisisStudy();
  const quotes = await loadGasSupplyOutageQuotes();
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
  // The L1 anchor rule, rendered rather than assumed, exactly as the explorer
  // header does: the strap states what a "gas day" is instead of letting the
  // reader guess from the numbers.
  const gasWindow = formatWindow(petrobanglaGasDay(GAS_CRISIS_WINDOW.start), { offset: false });

  return (
    <main className="container container--shell py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      {/* ── header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border/40 pb-6 mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Analysis · event study
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold text-foreground">
          The R-LNG shortfall, July–August 2026
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          On the gas day starting <strong>21 July 2026</strong>, Petrobangla&rsquo;s daily report
          printed RPGCL&rsquo;s R-LNG supply at 621.6 MMCFD — down from 993.5 the day before, on an
          unchanged printed capacity of 1,100. It settled near 500 MMCFD, fell again to 300 on
          13–14 August, and never returned to its July baseline inside this window. This page
          follows that shortfall through the official record: gas supply, gas delivered to power,
          what generated instead, what it cost, and what was shed — day by day and hour by hour.
          Every figure is a publisher&rsquo;s own, or is marked derived with its formula. The
          archive names no cause for the fall, so neither does this page.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Study window {GAS_CRISIS_WINDOW.start} → {GAS_CRISIS_WINDOW.end} · baseline{' '}
          {GAS_CRISIS_BASELINE.start} → {GAS_CRISIS_BASELINE.end}
          {gasWindow ? <> · a &ldquo;gas day&rdquo; runs {gasWindow}</> : null} · an
          &ldquo;energy day&rdquo; runs 00:00→24:00 · all times BST (UTC+06:00)
        </p>
      </header>

      {/* ── the headline deltas (all DERIVED, formula on each series) ───── */}
      <section aria-labelledby="deltas-h" className="mb-10">
        <h2 id="deltas-h" className="text-lg font-bold text-foreground mb-1">
          The window against its baseline
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Signed differences of means, and nothing more — no scores, no percentages. Each
          tile states its own formula: the denominators differ by publisher, because a day a
          publisher did not file is excluded and counted rather than zeroed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DeltaTile series={s.gasRlng} />
          <DeltaTile series={s.gasNational} />
          <DeltaTile series={s.gasGen} digits={1} />
          <DeltaTile series={s.unserved} digits={1} />
        </div>
      </section>

      {/* ── the chain, one card per question ────────────────────────────── */}
      {CHAIN_CARDS.map((card) => {
        const cardSeries = card.seriesIds.map((id: EventStudySeriesId) => s[id]);
        const unit = cardSeries[0].unit;
        const isCost = card.key === 'cost';
        return (
          <section key={card.key} aria-labelledby={`${card.key}-h`} className="mb-10">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <h2 id={`${card.key}-h`} className="text-lg font-bold text-foreground">
                {card.question}
              </h2>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">
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
          <h2 id="outages-h" className="text-lg font-bold text-foreground">
            What the outage log itself says
          </h2>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
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
          <h2 id="hourly-h" className="text-lg font-bold text-foreground">
            Hour by hour: load shedding
          </h2>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
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
        <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-6 text-sm leading-6 text-muted-foreground">
          <h2 id="method-h" className="text-lg font-bold text-foreground mb-3">
            Methodology, and its limits
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">No cause is asserted.</strong> The archive
              holds no document naming why R-LNG supply fell — no FSRU, terminal or shipment is
              identified anywhere in the window&rsquo;s reports. The chain on this page is a
              reading order, not an attribution. The archive&rsquo;s own June is the caution:
              62.3 GWh went unserved on 28 June with gas supply at its full ~2,690 MMCFD.
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
              <Link href="/grid-explorer" className="underline text-foreground">
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
