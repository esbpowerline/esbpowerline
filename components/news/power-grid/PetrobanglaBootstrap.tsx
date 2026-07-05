'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { latestOkDate } from '@/lib/data/petrobangla/compute';
import { loadArchiveDay, loadArchiveIndex, loadArchiveTimeline } from '@/lib/data/petrobangla/loadArchive';
import {
  LIVE_WEEK_BOOTSTRAP,
  loadLiveWeekBundle,
} from '@/lib/data/petrobangla/getLiveWeek';
import type {
  PetrobanglaIndex,
  PetrobanglaLiveWeekBundle,
  PetrobanglaTimelineSummary,
} from '@/lib/data/petrobangla/types';

type PetrobanglaBootstrapValue = {
  index: PetrobanglaIndex | null;
  timeline: PetrobanglaTimelineSummary | null;
  liveWeek: PetrobanglaLiveWeekBundle | null;
  /** Lightweight archive index — date resolution */
  archiveLoading: boolean;
  /** Heavy 1.5MB timeline summary — lazy, chart-only */
  timelineLoading: boolean;
  liveWeekLoading: boolean;
  /** @deprecated Use archiveLoading */
  loading: boolean;
  error: string | null;
  ensureTimeline: () => Promise<void>;
  ensureLiveWeekDays: (count: number) => Promise<void>;
};

const PetrobanglaBootstrapContext = createContext<PetrobanglaBootstrapValue | null>(null);

export function PetrobanglaBootstrapProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<PetrobanglaIndex | null>(null);
  const [timeline, setTimeline] = useState<PetrobanglaTimelineSummary | null>(null);
  const [liveWeek, setLiveWeek] = useState<PetrobanglaLiveWeekBundle | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [liveWeekLoading, setLiveWeekLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timelinePromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadArchiveIndex()
      .then((idx) => {
        if (cancelled) return;
        setIndex(idx);
        // Warm day cache for the default archive date — ~46KB, not the 1.5MB timeline
        void loadArchiveDay(latestOkDate(idx), { allowPartial: true }).catch(() => {});
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load Petrobangla archive');
        }
      })
      .finally(() => {
        if (!cancelled) setArchiveLoading(false);
      });

    loadLiveWeekBundle(LIVE_WEEK_BOOTSTRAP)
      .then((lw) => {
        if (cancelled) return;
        setLiveWeek(lw);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((prev) => prev ?? (e instanceof Error ? e.message : 'Failed to load live gas-days'));
        }
      })
      .finally(() => {
        if (!cancelled) setLiveWeekLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ensureTimeline = useCallback(async () => {
    if (timeline) return;
    if (timelinePromise.current) {
      await timelinePromise.current;
      return;
    }
    setTimelineLoading(true);
    timelinePromise.current = loadArchiveTimeline()
      .then((tl) => {
        setTimeline(tl);
      })
      .catch((e) => {
        setError((prev) => prev ?? (e instanceof Error ? e.message : 'Failed to load national timeline'));
      })
      .finally(() => {
        setTimelineLoading(false);
        timelinePromise.current = null;
      });
    await timelinePromise.current;
  }, [timeline]);

  const ensureLiveWeekDays = useCallback(async (count: number) => {
    if (liveWeek && liveWeek.days.length >= count) return;
    setLiveWeekLoading(true);
    try {
      const expanded = await loadLiveWeekBundle(count);
      setLiveWeek(expanded);
    } catch (e) {
      setError((prev) => prev ?? (e instanceof Error ? e.message : 'Failed to load gas-day window'));
    } finally {
      setLiveWeekLoading(false);
    }
  }, [liveWeek]);

  const value = useMemo(
    () => ({
      index,
      timeline,
      liveWeek,
      archiveLoading,
      timelineLoading,
      liveWeekLoading,
      loading: archiveLoading,
      error,
      ensureTimeline,
      ensureLiveWeekDays,
    }),
    [
      index,
      timeline,
      liveWeek,
      archiveLoading,
      timelineLoading,
      liveWeekLoading,
      error,
      ensureTimeline,
      ensureLiveWeekDays,
    ],
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