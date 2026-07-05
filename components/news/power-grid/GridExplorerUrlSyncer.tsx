'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  buildGridExplorerQuery,
  parseGridExplorerDate,
  parseGridExplorerTab,
  parseGridMacroSubTab,
  type GridExplorerTab,
  type GridMacroSubTab,
} from '@/lib/grid-explorer-url';

function canonicalFromLocation(search: string, latestDate: string): string {
  const params = new URLSearchParams(search);
  return buildGridExplorerQuery(
    parseGridExplorerTab(params.get('tab')) ?? 'overview',
    parseGridExplorerDate(params.get('date')) ?? latestDate,
    parseGridMacroSubTab(params.get('macro')) ?? 'overview',
    latestDate,
  );
}

/**
 * Writes explorer state to the URL without subscribing to searchParams.
 * Keeps the heavy PowerGridExplorer tree from re-rendering on every replace().
 */
export function GridExplorerUrlSyncer({
  activeTab,
  selectedDate,
  macroSubTab,
  latestDate,
}: {
  activeTab: GridExplorerTab;
  selectedDate: string;
  macroSubTab: GridMacroSubTab;
  latestDate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    const qs = buildGridExplorerQuery(activeTab, selectedDate, macroSubTab, latestDate);
    if (qs === lastWritten.current) return;

    if (typeof window !== 'undefined') {
      const onPage = canonicalFromLocation(window.location.search, latestDate);
      if (qs === onPage) {
        lastWritten.current = qs;
        return;
      }
    }

    lastWritten.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [activeTab, selectedDate, macroSubTab, latestDate, pathname, router]);

  return null;
}