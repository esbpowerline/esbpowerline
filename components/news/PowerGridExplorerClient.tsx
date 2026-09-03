'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { PowerGridExplorerErrorBoundary } from '@/components/news/PowerGridExplorerErrorBoundary';
import { readGridExplorerUrlBoot, type GridExplorerUrlBoot } from '@/lib/grid-explorer-url';
import type { GridDailyData } from '@/lib/data/grid/types';
import type { LedgerDay } from '@/lib/data/grid/verification-ledger';

const PowerGridExplorer = dynamic(
  () => import('@/components/news/PowerGridExplorer').then((mod) => mod.PowerGridExplorer),
  {
    ssr: true,
    loading: () => (
      <div className="h-[28rem] rounded-2xl border border-border/50 bg-muted/15 animate-pulse" />
    ),
  },
);

/**
 * Boots the explorer from the URL WITHOUT `useSearchParams`.
 *
 * On a statically rendered route, `useSearchParams` bails the whole subtree
 * out of prerendering, so the served HTML of /grid-explorer was the loading
 * skeleton: 132 words inside <main>, none of them a figure. That is what
 * Googlebot indexed for the site's flagship page (116 impressions, 1 click)
 * (SEO_FIX_LOG stage 4).
 *
 * The server and the first client render both mount the default view (latest
 * day, overview tab), so the KPI strip, the load curve and every table are in
 * the HTML. The query string is read from `window.location` once, during the
 * hydration render — into a ref, so the rendered output stays identical to
 * the server's — and applied in an effect. A deep link (`?tab=gas&date=…`)
 * then remounts the explorer with that boot; a plain visit never remounts.
 */
export function PowerGridExplorerClient(props: {
  initialLines?: Array<{ name: string; status: string; capacity: string; owner: string; load: number }>;
  prefetchedDailyReports?: Record<string, GridDailyData>;
  latestDate?: string;
  /** Days published without a deploy; absent from the compiled catalog. */
  runtimeDates?: string[];
  verificationLedger?: Record<string, LedgerDay>;
}) {
  // Captured before any child effect runs: GridExplorerUrlSyncer rewrites
  // the URL to the default state on mount, which would erase the deep link
  // before an effect here could read it.
  const initialSearch = useRef<string | null>(null);
  if (initialSearch.current === null && typeof window !== 'undefined') {
    initialSearch.current = window.location.search;
  }

  const [urlBoot, setUrlBoot] = useState<GridExplorerUrlBoot | undefined>(undefined);

  useEffect(() => {
    const boot = readGridExplorerUrlBoot(initialSearch.current ?? '');
    if (boot) setUrlBoot(boot);
  }, []);

  return (
    <PowerGridExplorerErrorBoundary>
      <PowerGridExplorer
        key={urlBoot ? 'deep-link' : 'default'}
        initialLines={props.initialLines}
        prefetchedDailyReports={props.prefetchedDailyReports}
        urlBoot={urlBoot}
        serverLatestDate={props.latestDate}
        runtimeDates={props.runtimeDates}
        verificationLedger={props.verificationLedger}
      />
    </PowerGridExplorerErrorBoundary>
  );
}
