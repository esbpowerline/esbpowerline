import { getGridSettingsMap } from '@/lib/homepage-content';
import { normalizeGridSettings } from '@/lib/grid-data';
import { PowerGridExportControls } from '@/components/members/PowerGridExportControls';
import { PowerGridExplorerClient } from '@/components/news/PowerGridExplorerClient';
import { RefreshGridDataButton } from '@/components/members/RefreshGridDataButton';
import { MemberToolsPanel } from '@/components/members/MemberToolsPanel';
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/40 pb-5 mb-6">
        <div>
          <div className="uppercase tracking-[2.5px] text-[9px] text-primary font-bold mb-1">INTERACTIVE DATA • POWER SECTOR</div>
          <h1 className="h1 font-display font-bold text-2xl md:text-3xl tracking-tight">Power Grid Explorer</h1>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">Planning and indicative data for Bangladesh’s electricity system — generation, transmission, demand &amp; projects.</p>
        </div>
        <div className="flex flex-row items-center gap-2 shrink-0 self-start lg:self-center no-print w-full lg:w-auto">
          <div className="w-1/2 lg:w-auto">
            <RefreshGridDataButton />
          </div>
          <div className="w-1/2 lg:w-auto">
            <PowerGridExportControls />
          </div>
        </div>
      </div>

      <PowerGridExplorerClient initialLines={grid.gridLines} />

      <MemberToolsPanel />

    </div>
  );
}