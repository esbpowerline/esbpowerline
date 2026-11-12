'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoricalSlot, isKnownFuel, resolveFuelColor } from '@/lib/data/grid/chart-palette';

/**
 * The Time Machine's state, fetches and counts, moved out of TimeMachineTab
 * verbatim (2026-11-12) so the phone app's own screen asks the archive the same
 * questions in the same way. One copy means the plan gate cannot behave
 * differently on a phone: both surfaces send the same request to
 * `/api/grid/history/series` and read the same `restriction` back.
 *
 * Nothing here draws. See TimeMachineTab's header for why the line must break
 * across a gap rather than join it.
 */

export type SeriesState = 'REPORTED' | 'DERIVED' | 'ESTIMATED' | 'MISSING' | 'RESTRICTED';

export type Point = {
  t: string;
  value: number | null;
  state: SeriesState;
  coverage: { observed: number; expected: number; sufficient: boolean };
  excluded?: Record<string, number>;
};

export type SeriesResponse = {
  metric: string;
  resolution: 'hour' | 'day' | 'month';
  aggregation: string;
  rulesVersion: string;
  restriction: {
    requested: { from: string; to: string };
    effective: { from: string; to: string };
    restricted: boolean;
    reason: 'tier' | null;
    tier: string;
  };
  points: Point[];
  sources: Array<{ publisher: string; documents: number; earliest: string; latest: string }>;
};

export const METRICS: Array<{ id: string; label: string; unit: string }> = [
  { id: 'totalMw', label: 'Total generation', unit: 'MW' },
  { id: 'gasMw', label: 'Gas', unit: 'MW' },
  { id: 'coalMw', label: 'Coal', unit: 'MW' },
  { id: 'liquidMw', label: 'Liquid fuel', unit: 'MW' },
  { id: 'hydroMw', label: 'Hydro', unit: 'MW' },
  { id: 'solarMw', label: 'Solar', unit: 'MW' },
  { id: 'windMw', label: 'Wind', unit: 'MW' },
  { id: 'adaniMw', label: 'Adani import', unit: 'MW' },
  { id: 'nepalMw', label: 'Nepal import', unit: 'MW' },
  { id: 'demandMw', label: 'Demand', unit: 'MW' },
  { id: 'loadShedMw', label: 'Load shedding', unit: 'MW' },
];

/**
 * The four states, and how each is drawn.
 *
 * REPORTED and DERIVED reuse the site's existing P/D vocabulary rather than
 * inventing a second one — the mark is already on ~160 figures in the explorer
 * and readers know it. MISSING and ESTIMATED are the two the existing tag has no
 * room for, and they are the two that matter most here.
 */
export const STATE_LEGEND: Array<{ state: SeriesState; title: string; detail: string }> = [
  { state: 'REPORTED', title: 'Reported', detail: 'NLDC printed this figure for this hour.' },
  { state: 'DERIVED', title: 'Derived', detail: 'Calculated here from reported hours. The aggregation is named on hover.' },
  { state: 'ESTIMATED', title: 'Estimated', detail: 'Modelled where no figure exists. Nothing in the Time Machine produces this — it is reserved so a future forecast can never be mistaken for a reading.' },
  { state: 'MISSING', title: 'Missing', detail: 'No figure was published for this period. ESB queried it and does not hold enough observations. The line breaks; nothing is interpolated.' },
  { state: 'RESTRICTED', title: 'Outside your plan', detail: 'ESB holds this period — your plan does not reach it, so it was not queried. This says nothing about whether the data exists.' },
];

/**
 * The line colour comes from chart-palette, never from this file.
 *
 * A fuel keeps the colour it has everywhere else in the explorer, so Gas is the
 * same Gas the Generation tab draws; anything that is not a fuel takes a
 * validated categorical slot. The palette-discipline test enforces this — it
 * caught a hard-coded hex here on the first run, which is exactly its job.
 */
const FUEL_FOR_METRIC: Record<string, string> = {
  gasMw: 'Gas', coalMw: 'Coal', liquidMw: 'Liquid Fuel', hydroMw: 'Hydro',
  solarMw: 'Solar', windMw: 'Wind',
};

export function strokeFor(metric: string): string {
  const fuel = FUEL_FOR_METRIC[metric];
  if (fuel && isKnownFuel(fuel)) return resolveFuelColor(fuel);
  return categoricalSlot(METRICS.findIndex((m) => m.id === metric));
}

export function useTimeMachine() {
  const [metric, setMetric] = useState('totalMw');
  const [resolution, setResolution] = useState<'day' | 'month'>('day');
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [bounds, setBounds] = useState<{ earliest: string; latest: string } | null>(null);
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The scrubber's extent is the archive's own, not a hard-coded decade.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/grid/history/bounds')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.series?.length) return;
        const gen = j.series.find((s: { series: string }) => s.series === 'GENERATION') ?? j.series[0];
        const earliest = gen.earliest.slice(0, 10);
        const latest = gen.latest.slice(0, 10);
        setBounds({ earliest, latest });
        const from = new Date(latest);
        from.setUTCDate(from.getUTCDate() - 30);
        setRange({ from: from.toISOString().slice(0, 10), to: latest });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    if (!range.from || !range.to) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        metric, resolution, agg: 'mean', from: range.from, to: range.to,
      });
      const res = await fetch(`/api/grid/history/series?${q}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [metric, resolution, range.from, range.to]);

  useEffect(() => { void load(); }, [load]);

  const unit = METRICS.find((m) => m.id === metric)?.unit ?? 'MW';
  const summary = useMemo(() => {
    if (!data) return null;
    const pts = data.points;
    const present = pts.filter((p) => p.value !== null);
    // Counted apart, because they mean opposite things about the archive.
    const missing = pts.filter((p) => p.state === 'MISSING').length;
    const restricted = pts.filter((p) => p.state === 'RESTRICTED').length;
    const excluded = pts.reduce((acc, p) => {
      for (const [k, v] of Object.entries(p.excluded ?? {})) acc[k] = (acc[k] ?? 0) + v;
      return acc;
    }, {} as Record<string, number>);
    return { total: pts.length, present: present.length, missing, restricted, excluded };
  }, [data]);

  return { metric, setMetric, resolution, setResolution, range, setRange, bounds, data, loading, error, unit, summary };
}
