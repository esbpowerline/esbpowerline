'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { categoricalSlot } from '@/lib/data/grid/chart-palette';

/**
 * Hour-by-hour load shedding across the study window, from the NLDC canonical
 * layer via /api/grid/history/series — the endpoint whose aggregation rules
 * are versioned (`rulesVersion` is echoed in the footer for that reason).
 * Nothing here re-aggregates; this component only draws the answer, exactly as
 * TimeMachineTab does.
 *
 * The endpoint clamps the range to the viewer's plan window and says so. That
 * restriction is rendered, not worked around: a visitor sees which part of the
 * window their plan reaches and which is RESTRICTED, in the API's own words.
 * Fetching the locked hours some other way would be precisely the
 * split-data-must-not-unlock-it failure recorded in daily-access.ts.
 */

type Point = {
  t: string;
  value: number | null;
  state: 'REPORTED' | 'DERIVED' | 'ESTIMATED' | 'MISSING' | 'RESTRICTED';
};

type SeriesResponse = {
  rulesVersion: string;
  restriction: {
    requested: { from: string; to: string };
    effective: { from: string; to: string };
    restricted: boolean;
  };
  points: Point[];
};

export default function HourlyShedPanel({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({
      metric: 'loadShedMw',
      resolution: 'hour',
      agg: 'mean',
      from,
      to,
    });
    fetch(`/api/grid/history/series?${q}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (SeriesResponse & { error?: string })
          | null;
        if (cancelled) return;
        if (!res.ok) {
          // 403 = the whole range is outside the plan window. The body says
          // so; repeat it rather than a generic failure.
          setError(body?.error ?? `Request failed (${res.status})`);
          setData(body && Array.isArray(body.points) ? body : null);
        } else {
          setData(body);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  if (loading) {
    return <div className="h-52 animate-pulse rounded-xl bg-muted/40" aria-hidden />;
  }

  const points = data?.points ?? [];
  const restricted = points.filter((p) => p.state === 'RESTRICTED').length;
  const chartData = points.map((p) => ({
    t: p.t,
    // RESTRICTED and MISSING both render as a break; the caption separates
    // them, because they mean opposite things about the archive.
    value: p.state === 'REPORTED' || p.state === 'DERIVED' ? p.value : null,
  }));
  const hasAnything = chartData.some((p) => p.value !== null);

  return (
    <div>
      {data?.restriction?.restricted && (
        <p className="mb-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-sky-700 dark:text-sky-400">
          Your plan window reaches back to <strong>{data.restriction.effective.from}</strong>;
          this study begins {data.restriction.requested.from}. Hours before your window are
          marked restricted, not missing — the archive holds them.
        </p>
      )}
      {error && !hasAnything && (
        <p className="mb-3 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          {error}
        </p>
      )}
      {hasAnything && (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(t: string) => t.slice(5, 10)}
                tick={{ fontSize: 11 }}
                minTickGap={40}
              />
              <YAxis tick={{ fontSize: 11 }} width={52} />
              <Tooltip
                labelFormatter={(t) => String(t).replace('T', ' ').slice(0, 16)}
                formatter={(value) => [`${Number(value).toLocaleString()} MW`, 'Load shed']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={categoricalSlot(7)}
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        NLDC hourly demand-supply page, canonical layer
        {data?.rulesVersion ? <> · aggregation rules {data.rulesVersion}</> : null}
        {restricted > 0 ? <> · {restricted.toLocaleString()} hour(s) restricted by plan window</> : null}
      </p>
    </div>
  );
}
