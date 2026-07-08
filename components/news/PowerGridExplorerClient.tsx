'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { PowerGridExplorerErrorBoundary } from '@/components/news/PowerGridExplorerErrorBoundary';
import { readGridExplorerUrlBoot } from '@/lib/grid-explorer-url';
import type { GridDailyData } from '@/lib/data/grid/types';
import type { GridExplorerUrlBoot } from '@/lib/grid-explorer-url';

const PowerGridExplorer = dynamic(
  () => import('@/components/news/PowerGridExplorer').then((mod) => mod.PowerGridExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[28rem] rounded-2xl border border-border/50 bg-muted/15 animate-pulse" />
    ),
  },
);

export function PowerGridExplorerClient(props: {
  initialLines?: Array<{ name: string; status: string; capacity: string; owner: string; load: number }>;
  prefetchedDailyReports?: Record<string, GridDailyData>;
  urlBoot?: GridExplorerUrlBoot;
  latestDate?: string;
}) {
  const urlBoot = useMemo(() => {
    if (typeof window === 'undefined') return props.urlBoot;
    return readGridExplorerUrlBoot(window.location.search) ?? props.urlBoot;
  }, [props.urlBoot]);

  return (
    <PowerGridExplorerErrorBoundary>
      <PowerGridExplorer
        initialLines={props.initialLines}
        prefetchedDailyReports={props.prefetchedDailyReports}
        urlBoot={urlBoot}
        serverLatestDate={props.latestDate}
      />
    </PowerGridExplorerErrorBoundary>
  );
}