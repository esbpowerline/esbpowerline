'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PowerGridExplorerErrorBoundary } from '@/components/news/PowerGridExplorerErrorBoundary';
import { readGridExplorerUrlBoot } from '@/lib/grid-explorer-url';
import type { GridDailyData } from '@/lib/data/grid/types';

const PowerGridExplorer = dynamic(
  () => import('@/components/news/PowerGridExplorer').then((mod) => mod.PowerGridExplorer),
  {
    ssr: true,
    loading: () => (
      <div className="h-[28rem] rounded-2xl border border-border/50 bg-muted/15 animate-pulse" />
    ),
  },
);

export function PowerGridExplorerClient(props: {
  initialLines?: Array<{ name: string; status: string; capacity: string; owner: string; load: number }>;
  prefetchedDailyReports?: Record<string, GridDailyData>;
  latestDate?: string;
  /** Days published without a deploy; absent from the compiled catalog. */
  runtimeDates?: string[];
}) {
  const searchParams = useSearchParams();

  const urlBoot = useMemo(() => {
    return readGridExplorerUrlBoot(searchParams.toString() ? `?${searchParams.toString()}` : '');
  }, [searchParams]);

  return (
    <PowerGridExplorerErrorBoundary>
      <PowerGridExplorer
        initialLines={props.initialLines}
        prefetchedDailyReports={props.prefetchedDailyReports}
        urlBoot={urlBoot}
        serverLatestDate={props.latestDate}
        runtimeDates={props.runtimeDates}
      />
    </PowerGridExplorerErrorBoundary>
  );
}