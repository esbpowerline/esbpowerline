import { getGridSettingsMap } from '@/lib/homepage-content';
import { normalizeGridSettings } from '@/lib/grid-data';
import { PowerGridExportControls } from '@/components/members/PowerGridExportControls';
import { PowerGridExplorerClient } from '@/components/news/PowerGridExplorerClient';
import { RefreshGridDataButton } from '@/components/members/RefreshGridDataButton';
import { MemberToolsPanel } from '@/components/members/MemberToolsPanel';
import { prefetchGridExplorerDailyReports } from '@/lib/data/grid/grid-explorer-prefetch.server';
import { getLatestAvailableDate, availableDates } from '@/lib/data/grid/available-dates';
import { getRuntimeOnlyDates } from '@/lib/data/grid/available-dates.server';
import { Activity } from 'lucide-react';
import { Suspense } from 'react';
import { safeJsonLd } from '@/lib/json-ld';
import { GridExplorerServerSummary } from '@/components/news/power-grid/GridExplorerServerSummary';

// Dynamic grid data is client-fetched; settings mutations call revalidatePath('/grid-explorer'),
// so this time window is only a safety net. 300s keeps ISR churn low (new report dates ship via
// redeploy of the static catalog, not ISR).
export const revalidate = 300;

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
  title: 'Bangladesh Power Grid Explorer — daily generation, demand & gas data',
  description:
    'Daily generation, demand, load shedding, fuel mix, gas supply and cross-border imports for Bangladesh’s national grid — 4,500+ days from the official PGCB and Petrobangla daily reports, with every figure traced to its source.',
  // Broad but honest: every term below names something this page actually
  // publishes figures for. Nothing here is a query we cannot answer.
  keywords: [
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
    title: 'Bangladesh Power Grid Explorer — daily generation, demand & gas data',
    description:
      'Every day of Bangladesh’s grid since 2013, from the official PGCB and Petrobangla reports: generation, demand, load shedding, fuel mix, gas supply and imports.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bangladesh Power Grid Explorer',
    description:
      'Daily generation, demand, load shedding and gas supply for Bangladesh’s national grid, from the official daily reports.',
  },
};

export default async function PowerGridExplorerPage() {
  const [settings, prefetchedDailyReports, runtimeDates] = await Promise.all([
    getGridSettingsMap(),
    prefetchGridExplorerDailyReports(null),
    // Days published from the admin panel since the last deploy. The bundled
    // catalog is compiled into the client bundle and cannot see them, so the
    // server hands them down and the picker merges the two.
    getRuntimeOnlyDates(),
  ]);
  const grid = normalizeGridSettings(settings);
  const latestDate =
    runtimeDates.length > 0
      ? runtimeDates[runtimeDates.length - 1]
      : getLatestAvailableDate();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';
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
    <div id="power-grid-page-container" className="container container--shell py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      {/* Sleek, Compact Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/40 pb-5 mb-6 group">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 opacity-90 transition-opacity group-hover:opacity-100">
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <div className="uppercase tracking-[2.5px] text-[9px] text-primary font-bold">Interactive Data • Power Sector</div>
          </div>
          <h1 className="h1 font-display font-bold text-2xl md:text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            Power Grid Explorer
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm leading-relaxed max-w-2xl">
            Planning and indicative data for Bangladesh’s electricity system — generation, transmission, demand &amp; projects.
          </p>
        </div>
        
        <div className="flex flex-row items-center gap-2 shrink-0 self-start lg:self-center no-print w-full lg:w-auto">
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

      {/* Real HTML for crawlers and for anyone whose JavaScript never arrives.
          The interactive explorer is below it. */}
      <GridExplorerServerSummary
        data={latestDate ? prefetchedDailyReports[latestDate] : undefined}
        date={latestDate ?? undefined}
        archiveDays={availableDates.length}
        earliestDate={availableDates[0]}
      />

      <Suspense fallback={<div className="h-[28rem] rounded-2xl border border-border/50 bg-muted/15 animate-pulse" />}>
        <PowerGridExplorerClient
          initialLines={grid.gridLines}
          prefetchedDailyReports={prefetchedDailyReports}
          latestDate={latestDate ?? undefined}
          runtimeDates={runtimeDates}
        />
      </Suspense>

      <MemberToolsPanel latestDate={latestDate ?? undefined} earliestDate={availableDates[0]} />

    </div>
  );
}