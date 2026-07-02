'use client';

import dynamic from 'next/dynamic';
import { PowerGridExplorerErrorBoundary } from '@/components/news/PowerGridExplorerErrorBoundary';

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
  return (
    <PowerGridExplorerErrorBoundary>
      <PowerGridExplorer initialLines={props.initialLines} />
    </PowerGridExplorerErrorBoundary>
  );
}