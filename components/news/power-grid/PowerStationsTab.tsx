'use client';

import { useEffect, useMemo, useState } from 'react';
import { Factory, Search } from 'lucide-react';
import { fetchPlantDetail, plantTotals } from '@/lib/data/grid/plant-detail.client';
import type { DailyPlantDetail, GridSystemStats } from '@/lib/data/grid/types';

const formatMw = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: 1 });

type SortKey = 'name' | 'eveningPeakMw' | 'dayPeakMw' | 'installedMw';

/**
 * Per-station figures for the reported day: what each plant was built to make,
 * what it was capable of, and what it actually produced at both peaks.
 *
 * Everything here is read straight from the report — the Forecast sheet's
 * "Actual Generation on <reported day>" columns and the GenLog matrix. The
 * forecast-availability columns beside them describe the NEXT day and are not
 * shown, which is why there is no "reason offline" text: PGCB attaches that to
 * the forecast, not to the day being reported.
 */
export function PowerStationsTab({
  isoDate,
  systemStats,
}: {
  isoDate: string;
  systemStats: GridSystemStats;
}) {
  const [detail, setDetail] = useState<DailyPlantDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'absent'>('loading');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('eveningPeakMw');

  useEffect(() => {
    let live = true;
    setState('loading');
    fetchPlantDetail(isoDate).then((d) => {
      if (!live) return;
      setDetail(d);
      setState(d ? 'ready' : 'absent');
    });
    return () => {
      live = false;
    };
  }, [isoDate]);

  const rows = useMemo(() => {
    const plants = detail?.plants ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? plants.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.fuel.toLowerCase().includes(q) ||
            p.producer.toLowerCase().includes(q),
        )
      : plants;
    return [...filtered].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : (b[sort] ?? 0) - (a[sort] ?? 0),
    );
  }, [detail, query, sort]);

  const totals = plantTotals(detail);

  if (state === 'loading') {
    return <div className="grid-explorer-skeleton !h-64" />;
  }

  if (state === 'absent') {
    return (
      <div className="p-8 rounded-xl border border-border/40 bg-muted/5 text-center space-y-2">
        <Factory className="h-6 w-6 mx-auto text-muted-foreground" />
        <p className="text-sm font-semibold text-muted-foreground">
          No per-station detail published for {systemStats.date}
        </p>
        <p className="text-xs text-muted-foreground/80 max-w-xl mx-auto">
          PGCB began including the station-level generation log with its 2025 reports. Earlier days
          publish system and zone totals only, which are shown on the other tabs.
        </p>
      </div>
    );
  }

  const genlog = detail?.genlog;

  return (
    <div className="space-y-4">
      <div className="grid-explorer-chart-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="grid-explorer-chart-card__title">
              Power Station Output
              <span className="grid-explorer-chip ml-2 bg-primary/10 text-primary border-primary/20">
                {rows.length} stations
              </span>
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Capacity and actual output at both peaks, as published for {systemStats.date}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter station, fuel, producer"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/60 bg-background w-56"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-2 py-1.5 text-xs rounded-lg border border-border/60 bg-background"
            >
              <option value="eveningPeakMw">Sort: evening peak</option>
              <option value="dayPeakMw">Sort: day peak</option>
              <option value="installedMw">Sort: installed MW</option>
              <option value="name">Sort: name</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="grid-explorer-table w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">Station</th>
                <th className="text-left">Fuel</th>
                <th className="text-left">Producer</th>
                <th className="text-left">Installed (MW)</th>
                <th className="text-left">Present (MW)</th>
                <th className="text-left">Day Peak (MW)</th>
                <th className="text-left">Evening Peak (MW)</th>
                <th className="text-left">Day&apos;s Energy (MWh)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.name} className={p.eveningPeakMw === 0 && !p.dayPeakMw && !p.energyKwh ? 'opacity-50' : ''}>
                  <td className="font-semibold">{p.name}</td>
                  <td className="text-muted-foreground">{p.fuel || '—'}</td>
                  <td className="text-muted-foreground">{p.producer || '—'}</td>
                  <td className="text-left tabular-nums">{formatMw(p.installedMw)}</td>
                  <td className="text-left tabular-nums">{formatMw(p.presentCapacityMw)}</td>
                  {/* Null, not zero, on days sourced from P2 — that sheet
                      publishes the evening peak and no day peak at all. */}
                  <td className="text-left tabular-nums">{formatMw(p.dayPeakMw)}</td>
                  <td className="text-left tabular-nums font-semibold">{formatMw(p.eveningPeakMw)}</td>
                  <td className="text-left tabular-nums" title={p.remarks || undefined}>
                    {p.energyKwh == null ? '—' : formatMw(p.energyKwh / 1000)}
                  </td>
                </tr>
              ))}
              {totals && !query && (
                <tr className="border-t border-border/80 font-bold bg-muted/20">
                  <td colSpan={5}>All stations</td>
                  <td className="text-left tabular-nums">{totals.day == null ? '—' : formatMw(totals.day)}</td>
                  <td className="text-left tabular-nums">{formatMw(totals.evening)}</td>
                  <td className="text-left tabular-nums">{totals.energyKwh == null ? '—' : formatMw(totals.energyKwh / 1000)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totals && (
          // The station sums are what the headline peaks are made of, so showing
          // both is a check the reader can make rather than take on trust.
          <p className="mt-3 text-[11px] text-muted-foreground">
            Station totals reconcile with the system figures for this day:{' '}
            {totals.day != null && (
              <>
                <strong className="text-foreground">{formatMw(totals.day)} MW</strong> at day peak against a
                published {formatMw(systemStats.dayPeakGen)} MW, and{' '}
              </>
            )}
            <strong className="text-foreground">{formatMw(totals.evening)} MW</strong> at evening peak
            against {formatMw(systemStats.eveningPeakGen)} MW
            {totals.energyKwh != null && (
              <>
                , and <strong className="text-foreground">{formatMw(totals.energyKwh / 1e6)} MKWh</strong>{' '}
                of energy against a published {formatMw(systemStats.totalEnergyGen)} MKWh
              </>
            )}
            .
            {totals.day == null && (
              <> This day&apos;s figures come from the report&apos;s per-station table, which publishes the
              evening peak and the day&apos;s energy but no day peak.</>
            )}
          </p>
        )}

        <div className="grid-explorer-chart-card__footer">
          <span>
            Source: <span className="text-primary">PGCB NLDC Daily Report — Forecast sheet</span>
          </span>
          <span>Reporting Date: {systemStats.date}</span>
        </div>
      </div>

      {genlog && (
        <div className="grid-explorer-chart-card">
          <h3 className="grid-explorer-chart-card__title">Hourly Station Log</h3>
          <p className="grid-explorer-chart-card__sub">
            Output every hour for {genlog.stations.length} stations, from the NLDC generation log
          </p>
          <div className="mt-4 overflow-x-auto max-h-[28rem]">
            <table className="grid-explorer-table w-full text-[11px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th className="text-left sticky left-0 bg-card">Station</th>
                  {genlog.hours.map((h) => (
                    <th key={h} className="text-right whitespace-nowrap px-1.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {genlog.stations
                  .filter((s) =>
                    query.trim() ? s.name.toLowerCase().includes(query.trim().toLowerCase()) : true,
                  )
                  .map((s) => (
                    <tr key={s.name}>
                      <td className="font-medium whitespace-nowrap sticky left-0 bg-card">{s.name}</td>
                      {s.hourlyMw.map((v, i) => (
                        <td
                          key={i}
                          className={`text-right tabular-nums px-1.5 ${v === 0 ? 'text-muted-foreground/40' : ''}`}
                        >
                          {v === 0 ? '·' : Math.round(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                {genlog.totals.national && (
                  <tr className="border-t border-border/80 font-bold bg-muted/20">
                    <td className="sticky left-0 bg-muted/20">National Grid Total</td>
                    {genlog.totals.national.map((v, i) => (
                      <td key={i} className="text-right tabular-nums px-1.5">
                        {Math.round(v)}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid-explorer-chart-card__footer">
            <span>
              Source: <span className="text-primary">PGCB NLDC Daily Generation Log</span>
            </span>
            <span>Reporting Date: {systemStats.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}
