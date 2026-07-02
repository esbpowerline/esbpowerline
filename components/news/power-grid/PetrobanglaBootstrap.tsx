'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadArchiveIndex, loadArchiveTimeline } from '@/lib/data/petrobangla/loadArchive';
import { loadLiveWeekBundle } from '@/lib/data/petrobangla/getLiveWeek';
import type {
  PetrobanglaIndex,
  PetrobanglaLiveWeekBundle,
  PetrobanglaTimelineSummary,
} from '@/lib/data/petrobangla/types';

type PetrobanglaBootstrapValue = {
  index: PetrobanglaIndex | null;
  timeline: PetrobanglaTimelineSummary | null;
  liveWeek: PetrobanglaLiveWeekBundle | null;
  loading: boolean;
  error: string | null;
};

const PetrobanglaBootstrapContext = createContext<PetrobanglaBootstrapValue | null>(null);

export function PetrobanglaBootstrapProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<PetrobanglaIndex | null>(null);
  const [timeline, setTimeline] = useState<PetrobanglaTimelineSummary | null>(null);
  const [liveWeek, setLiveWeek] = useState<PetrobanglaLiveWeekBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [idx, tl, lw] = await Promise.all([
          loadArchiveIndex(),
          loadArchiveTimeline(),
          loadLiveWeekBundle(),
        ]);
        if (cancelled) return;
        setIndex(idx);
        setTimeline(tl);
        setLiveWeek(lw);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load Petrobangla data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ index, timeline, liveWeek, loading, error }),
    [index, timeline, liveWeek, loading, error],
  );

  return (
    <PetrobanglaBootstrapContext.Provider value={value}>
      {children}
    </PetrobanglaBootstrapContext.Provider>
  );
}

export function usePetrobanglaBootstrap(): PetrobanglaBootstrapValue {
  const ctx = useContext(PetrobanglaBootstrapContext);
  if (!ctx) {
    throw new Error('usePetrobanglaBootstrap must be used within PetrobanglaBootstrapProvider');
  }
  return ctx;
}

export function useOptionalPetrobanglaBootstrap(): PetrobanglaBootstrapValue | null {
  return useContext(PetrobanglaBootstrapContext);
}