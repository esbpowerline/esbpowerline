import { getGridSettingsMap } from '@/lib/homepage-content';
import { normalizeGridSettings } from '@/lib/grid-data';
import { PowerGridExportControls } from '@/components/members/PowerGridExportControls';
import { PowerGridExplorerClient } from '@/components/news/PowerGridExplorerClient';
import { RefreshGridDataButton } from '@/components/members/RefreshGridDataButton';
import { MemberToolsPanel } from '@/components/members/MemberToolsPanel';
import { Activity } from 'lucide-react';

export const revalidate = 60;

export const metadata = {
  title: 'Power Grid Explorer — ESB PowerLine',
  description: 'Real-time and planning data for Bangladesh’s electricity system — generation, transmission, demand & projects.',
};

export default async function PowerGridExplorerPage() {
  const settings = await getGridSettingsMap();
  const grid = normalizeGridSettings(settings);

  return (
    <div id="power-grid-page-container" className="container container--shell py-8 md:py-10">
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
            <PowerGridExportControls />
          </div>
        </div>
      </div>

      <PowerGridExplorerClient initialLines={grid.gridLines} />

      <MemberToolsPanel />

    </div>
  );
}