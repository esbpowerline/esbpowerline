import { getGridSettingsMap } from '@/lib/homepage-content';
import { normalizeGridSettings } from '@/lib/grid-data';
import { PowerGridExportControls } from '@/components/members/PowerGridExportControls';
import { PowerGridExplorerClient } from '@/components/news/PowerGridExplorerClient';
import { RefreshGridDataButton } from '@/components/members/RefreshGridDataButton';
import { MemberToolsPanel } from '@/components/members/MemberToolsPanel';
import { prefetchGridExplorerDailyReports } from '@/lib/data/grid/grid-explorer-prefetch.server';
import { getLatestAvailableDate, availableDates } from '@/lib/data/grid/available-dates';
import { Activity } from 'lucide-react';
import { Suspense } from 'react';
import { safeJsonLd } from '@/lib/json-ld';

// Dynamic grid data is client-fetched; settings mutations call revalidatePath('/grid-explorer'),
// so this time window is only a safety net. 300s keeps ISR churn low (new report dates ship via
// redeploy of the static catalog, not ISR).
export const revalidate = 300;

export const metadata = {
  title: 'Power Grid Explorer — ESB PowerLine',
  description: 'Real-time and planning data for Bangladesh’s electricity system — generation, transmission, demand & projects.',
  alternates: {
    canonical: '/grid-explorer',
  },
};

export default async function PowerGridExplorerPage() {
  const [settings, prefetchedDailyReports] = await Promise.all([
    getGridSettingsMap(),
    prefetchGridExplorerDailyReports(null),
  ]);
  const grid = normalizeGridSettings(settings);
  const latestDate = getLatestAvailableDate();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Bangladesh Power Grid Data Explorer',
    description: 'Real-time and planning data for Bangladesh’s electricity system — generation, transmission, demand & projects.',
    url: `${baseUrl}/grid-explorer`,
    creator: {
      '@type': 'Organization',
      name: 'ESB PowerLine'
    }
  };

  return (
    <div id="power-grid-page-container" className="container container--shell py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
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

      <Suspense fallback={<div className="h-[28rem] rounded-2xl border border-border/50 bg-muted/15 animate-pulse" />}>
        <PowerGridExplorerClient
          initialLines={grid.gridLines}
          prefetchedDailyReports={prefetchedDailyReports}
          latestDate={latestDate ?? undefined}
        />
      </Suspense>

      <MemberToolsPanel latestDate={latestDate ?? undefined} earliestDate={availableDates[0]} />

    </div>
  );
}