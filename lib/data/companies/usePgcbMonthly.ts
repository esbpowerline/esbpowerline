'use client';

import { useEffect, useState } from 'react';

import {
  fetchPgcbMonthlyEvents,
  fetchPgcbMonthlyRecord,
  fetchPgcbMonthlySeries,
  peekPgcbMonthlyEvents,
  peekPgcbMonthlyRecord,
  peekPgcbMonthlySeries,
  type PgcbMonthlyRecord,
  type PgcbMonthlySeriesRecord,
  type PgcbOutageEvent,
} from '@/lib/data/companies/pgcb';

/**
 * Loads the monthly series the first time `enabled` turns true — i.e. when the
 * Macro Trends tab is actually opened — and serves it from the module cache on
 * every later mount, so switching tabs doesn't refetch.
 */
export function usePgcbMonthlySeries(enabled: boolean): {
  series: PgcbMonthlySeriesRecord[];
  loading: boolean;
} {
  const [series, setSeries] = useState<PgcbMonthlySeriesRecord[]>(() => peekPgcbMonthlySeries() ?? []);
  const [loading, setLoading] = useState(() => enabled && peekPgcbMonthlySeries() === null);

  useEffect(() => {
    if (!enabled) return;

    const cached = peekPgcbMonthlySeries();
    if (cached) {
      setSeries(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchPgcbMonthlySeries()
      .then((rows) => {
        if (!cancelled) setSeries(rows);
      })
      .catch(() => {
        if (!cancelled) setSeries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { series, loading };
}

/** Full record for one month — the detail deliberately kept out of the series. */
export function usePgcbMonthlyRecord(
  dateKey: string,
  enabled: boolean,
): { record: PgcbMonthlyRecord | null; loading: boolean } {
  const [record, setRecord] = useState<PgcbMonthlyRecord | null>(() =>
    dateKey ? peekPgcbMonthlyRecord(dateKey) : null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !dateKey) return;

    const cached = peekPgcbMonthlyRecord(dateKey);
    if (cached) {
      setRecord(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    // Cleared so a stale month's figures never render under a new heading.
    setRecord(null);
    fetchPgcbMonthlyRecord(dateKey)
      .then((row) => {
        if (!cancelled) setRecord(row);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateKey, enabled]);

  return { record, loading };
}

/**
 * The month's outage event log. `enabled` should only turn true once the reader
 * opens the events table — the file is bigger than the rest of the month combined.
 */
export function usePgcbMonthlyEvents(
  dateKey: string,
  enabled: boolean,
): { events: PgcbOutageEvent[]; loading: boolean } {
  const [events, setEvents] = useState<PgcbOutageEvent[]>(() =>
    dateKey ? peekPgcbMonthlyEvents(dateKey) ?? [] : [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !dateKey) return;

    const cached = peekPgcbMonthlyEvents(dateKey);
    if (cached) {
      setEvents(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setEvents([]);
    fetchPgcbMonthlyEvents(dateKey)
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateKey, enabled]);

  return { events, loading };
}
