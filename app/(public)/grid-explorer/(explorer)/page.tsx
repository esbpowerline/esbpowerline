import { getGridSettingsMap } from '@/lib/homepage-content';
import { normalizeGridSettings } from '@/lib/grid-data';
import { PowerGridExportControls } from '@/components/members/PowerGridExportControls';
import { PowerGridExplorerClient } from '@/components/news/PowerGridExplorerClient';
import { GridPhoneGate } from '@/components/news/grid-phone/GridPhoneGate';
import { RefreshGridDataButton } from '@/components/members/RefreshGridDataButton';
import { MemberToolsPanel } from '@/components/members/MemberToolsPanel';
import { prefetchGridExplorerDailyReports } from '@/lib/data/grid/grid-explorer-prefetch.server';
import { getLatestAvailableDate, availableDates } from '@/lib/data/grid/available-dates';
import { getRuntimeOnlyDates } from '@/lib/data/grid/available-dates.server';
import { getLedgerSummaries } from '@/lib/data/grid/verification-ledger.server';
import { Activity } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { safeJsonLd } from '@/lib/json-ld';
import { HeaderIntro } from '@/components/news/power-grid/HeaderIntro';
import { GRID_EXPLORER_VIEWS } from '@/lib/grid-explorer-views';

// Dynamic grid data is client-fetched; settings mutations call revalidatePath('/grid-explorer'),
// so this time window is only a safety net. Data publishes (publish-local, publish, refresh-all)
// revalidate this path too. 900s: each regeneration stores ~312 KB (216 KB HTML + 96 KB RSC).
export const revalidate = 900;

/**
 * One canonical URL, deliberately.
 *
 * The tabs are `?tab=` values on this same page, and the explorer inside them
 * loads client-side. Submitting a URL per tab would hand a crawler eight
 * near-identical documents whose distinguishing content is not in the HTML —
 * the same thin-duplicate trap the sitemap already avoids for tag pages. The
 * tabs are linked as crawlable anchors from the summary below so they can be
 * discovered and followed; they are not advertised as separate pages.
 */
export const metadata = {
  // "Power sector" is the phrase readers actually search; it was absent from
  // the title, the H1 strap and the first paragraph of this page (2026-09-02).
  title: 'Bangladesh Power Sector Data — Grid Explorer: daily generation, demand & gas',
  description:
    'Bangladesh’s national grid day by day: generation, demand, load shedding, fuel mix, gas and imports — 4,500+ days from official PGCB and Petrobangla reports.',
  // Broad but honest: every term below names something this page actually
  // publishes figures for. Nothing here is a query we cannot answer.
  keywords: [
    'Bangladesh power sector',
    'power sector data Bangladesh',
    'Bangladesh power grid',
    'PGCB daily report',
    'Bangladesh electricity generation',
    'Bangladesh electricity demand',
    'Bangladesh load shedding',
    'Bangladesh power generation by fuel',
    'Petrobangla gas production',
    'Bangladesh LNG supply',
    'Bangladesh electricity imports',
    'Adani Godda import',
    'HVDC Bheramara',
    'Bangladesh power stations',
    'Bangladesh grid zone demand',
    'Bangladesh renewable energy generation',
    'Bangladesh energy data',
    'NLDC load shedding',
  ],
  alternates: {
    canonical: '/grid-explorer',
  },
  openGraph: {
    type: 'website',
    url: '/grid-explorer',
    siteName: 'ESB PowerLine',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    title: 'Bangladesh Power Sector Data — Grid Explorer',
    description:
      'Every day of Bangladesh’s power sector since 2013, from the official PGCB and Petrobangla reports: generation, demand, load shedding, fuel mix, gas supply and imports.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bangladesh Power Grid Explorer',
    description:
      'Daily generation, demand, load shedding and gas supply for Bangladesh’s national grid, from the official daily reports.',
  },
};

/**
 * Static, on purpose — this page does NOT read `searchParams`.
 *
 * It used to, so that a deep link (?date=2026-08-12) could be prefetched
 * alongside the latest day; without that the client booted from the latest
 * report and showed it under the deep-linked heading. Reading searchParams
 * opts the whole route into dynamic rendering, which threw away the ISR
 * window above: every Grid Explorer view — the site's most expensive page —
 * ran on a function, with the settings queries, the runtime date catalog and
 * the disk prefetch executed per visitor (cost pass, 2026-09-02).
 *
 * The wrong-day boot is now fixed where it lived: `resolveInitialDailyReport`
 * no longer substitutes the latest day for a different selection, so a deep
 * link boots to a skeleton and fetches its own day. The server prefetches the
 * latest day only, and the page is served from the CDN for five minutes at a
 * time. `?tab=` and `?macro=` were always client-side (`useSearchParams` in
 * the client shell, inside the Suspense boundary below).
 */
export default async function PowerGridExplorerPage() {
  const [settings, prefetchedDailyReports, runtimeDates] = await Promise.all([
    getGridSettingsMap(),
    prefetchGridExplorerDailyReports(null),
    // Days published from the admin panel since the last deploy. The bundled
    // catalog is compiled into the client bundle and cannot see them, so the
    // server hands them down and the picker merges the two.
    getRuntimeOnlyDates(),
  ]);
  // What verify:source found, per day. Small (three scalars x 55 days) and
  // read once per process; the reader is told which side of the verified
  // line the day in front of them falls on.
  const verificationLedger = getLedgerSummaries();
  const grid = normalizeGridSettings(settings);
  const latestDate =
    runtimeDates.length > 0
      ? runtimeDates[runtimeDates.length - 1]
      : getLatestAvailableDate();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';
  const recentDates = availableDates.slice(-7).reverse();
  // Filled from the catalogue rather than hardcoded, so the coverage a crawler
  // is told about is the coverage that actually shipped.
  const earliest = availableDates[0];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Bangladesh Power Grid Daily Data',
    description:
      'Daily generation, demand, load shedding, fuel mix, gas production and cross-border electricity imports for Bangladesh’s national grid, compiled from the daily reports of the Power Grid Company of Bangladesh (PGCB) and Petrobangla.',
    url: `${baseUrl}/grid-explorer`,
    ...(earliest && latestDate ? { temporalCoverage: `${earliest}/${latestDate}` } : {}),
    ...(latestDate ? { dateModified: latestDate } : {}),
    spatialCoverage: {
      '@type': 'Place',
      name: 'Bangladesh',
      geo: { '@type': 'GeoShape', addressCountry: 'BD' },
    },
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    keywords: [
      'electricity generation',
      'peak demand',
      'load shedding',
      'natural gas production',
      'cross-border electricity trade',
      'Bangladesh',
    ],
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Evening peak generation', unitText: 'MW' },
      { '@type': 'PropertyValue', name: 'Evening peak demand', unitText: 'MW' },
      { '@type': 'PropertyValue', name: 'Load shedding', unitText: 'MW' },
      { '@type': 'PropertyValue', name: 'Energy generated', unitText: 'million kWh' },
      { '@type': 'PropertyValue', name: 'Gas production', unitText: 'MMCFD' },
      { '@type': 'PropertyValue', name: 'Cross-border import', unitText: 'MW' },
      { '@type': 'PropertyValue', name: 'Zone-wise evening peak demand', unitText: 'MW' },
      { '@type': 'PropertyValue', name: 'Zone-wise load shedding', unitText: 'MW' },
      { '@type': 'PropertyValue', name: 'Energy unserved', unitText: 'million kWh' },
      { '@type': 'PropertyValue', name: 'Power station output at peak', unitText: 'MW' },
    ],
    // Daily, and stated as such — a crawler otherwise has to guess how often
    // this is worth revisiting.
    accrualPeriodicity: 'P1D',
    measurementTechnique:
      'Transcribed from the published daily reports of PGCB and Petrobangla; derived figures are calculated from those published values and marked as derived.',
    creator: {
      '@type': 'Organization',
      name: 'ESB PowerLine',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ESB PowerLine',
      url: baseUrl,
    },
    // The originators, named. Every figure in this dataset is theirs; the
    // compilation is ours.
    isBasedOn: [
      { '@type': 'Organization', name: 'Power Grid Company of Bangladesh (PGCB)', url: 'https://www.pgcb.gov.bd/' },
      { '@type': 'Organization', name: 'Petrobangla', url: 'https://petrobangla.org.bd/' },
    ],
  };

  // Two levels, because that is the whole trail: the explorer hangs directly
  // off the site root. Inventing a middle crumb that no nav actually offers
  // would be a structured-data claim the site does not honour.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Power Grid Explorer', item: `${baseUrl}/grid-explorer` },
    ],
  };

  return (
    // <main>, not <div>: the page had no main landmark at all, which assistive
    // tech uses to skip the chrome — and Lighthouse fails without one.
    <main id="power-grid-page-container" className="container container--shell py-4 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      {/* Sleek, Compact Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4 border-b border-border/40 pb-3 mb-3 lg:pb-5 lg:mb-6 group ge-page-head">
        <div>
          <div className="ge-page-head__eyebrow flex items-center gap-1.5 mb-1.5 opacity-90 transition-opacity group-hover:opacity-100">
            {/* No animate-pulse: a perpetual heartbeat beside the kicker reads
                as a live-system indicator on a daily-ingest page (audit 2026-09-01). */}
            <Activity className="w-3 h-3 text-primary" />
            <div className="uppercase tracking-[2.5px] text-[9px] text-primary font-bold">Interactive Data • Power Sector</div>
          </div>

          <HeaderIntro heading={
            <h1 className="h1 font-display font-bold text-2xl md:text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            Power Grid Explorer
          </h1>
          } className="text-muted-foreground mt-1 text-xs md:text-sm leading-snug lg:leading-relaxed max-w-2xl">
            {/* Not "planning and indicative": every daily figure below is an
                operational number PGCB or Petrobangla filed for that day, and
                the strap-line is the first sentence a reader (and a crawler)
                sees. It says what the page is — and names the sector. */}
            Bangladesh’s power sector, one day at a time — generation, demand, load shedding, gas supply
            and cross-border imports as filed by PGCB and Petrobangla, back to 2013.
          </HeaderIntro>
        </div>
        
        <div className="ge-page-head__actions flex flex-row items-center gap-2 shrink-0 self-start lg:self-center no-print w-full lg:w-auto">
          <div className="flex-1 lg:flex-none transition-transform duration-200 hover:-translate-y-0.5">
            <RefreshGridDataButton />
          </div>
          <div className="flex-1 lg:flex-none transition-transform duration-200 hover:-translate-y-0.5">
            <PowerGridExportControls
              latestDate={latestDate ?? undefined}
              earliestDate={availableDates[0]}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-[28rem] rounded-2xl border border-border/50 bg-muted/15 animate-pulse" />}>
        <PowerGridExplorerClient
          initialLines={grid.gridLines}
          prefetchedDailyReports={prefetchedDailyReports}
          latestDate={latestDate ?? undefined}
          runtimeDates={runtimeDates}
          verificationLedger={verificationLedger}
        />
      </Suspense>

      {/* Below 768px the explorer opens as a full-screen phone app over this
          page; the page itself is unchanged and stays what crawlers read. */}
      <GridPhoneGate latestDate={latestDate ?? undefined} runtimeDates={runtimeDates} verificationLedger={verificationLedger} />

      <MemberToolsPanel latestDate={latestDate ?? undefined} earliestDate={availableDates[0]} />

      {/* The explorer's tabs are state-driven buttons, so without these the eight
          views have no crawlable anchor and no path for a reader whose JavaScript
          never arrives — measured at zero `href="?tab="` in the served HTML once
          the old summary block went. This is the navigation itself, not a summary
          of it, which is why it sits below the explorer rather than on top of it. */}
      <nav aria-labelledby="grid-views-heading" className="grid-explorer-views no-print">
        <h2 id="grid-views-heading">Every view in the explorer</h2>
        <ul>
          {GRID_EXPLORER_VIEWS.map((v) => (
            <li key={v.tab}>
              <Link prefetch={false} href={`/grid-explorer?tab=${v.tab}`}>{v.label}</Link>
              <span> — {v.blurb}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* The entry point to the per-day archive. The explorer holds the date in
          client state, so until this link existed every one of the ~4,500 day
          pages was an orphan: submitted in a sitemap but linked from nothing,
          which Google treats as a much weaker signal than a crawl path. */}
      <nav aria-labelledby="grid-archive-heading" className="grid-explorer-views no-print">
        <h2 id="grid-archive-heading">Browse the archive by date</h2>
        <ul>
          <li>
            <Link prefetch={false} href="/grid-explorer/archive">Full daily archive</Link>
            <span>
              {' '}
              — every day PGCB and Petrobangla published
              {availableDates[0] ? `, from ${availableDates[0]}` : ''} to today, one page each.
            </span>
          </li>
          {latestDate && (
            <li>
              <Link prefetch={false} href={`/grid-explorer/${latestDate}`}>Latest day ({latestDate})</Link>
              <span> — the headline figures for the newest report.</span>
            </li>
          )}
          {recentDates.length > 0 && (
            <li>
              <span>Recent daily reports: </span>
              {recentDates.map((date, idx) => (
                <span key={date}>
                  {idx > 0 && ' · '}
                  <Link prefetch={false} href={`/grid-explorer/${date}`} className="font-mono text-xs underline hover:text-foreground">
                    {date}
                  </Link>
                </span>
              ))}
            </li>
          )}
        </ul>
      </nav>
    </main>
  );
}