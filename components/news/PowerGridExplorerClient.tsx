'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { PowerGridExplorerErrorBoundary } from '@/components/news/PowerGridExplorerErrorBoundary';
import { readGridExplorerUrlBoot } from '@/lib/grid-explorer-url';

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
}) {
  const urlBoot = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return readGridExplorerUrlBoot(window.location.search);
  }, []);

  return (
    <PowerGridExplorerErrorBoundary>
      <PowerGridExplorer initialLines={props.initialLines} urlBoot={urlBoot} />
    </PowerGridExplorerErrorBoundary>
  );
}