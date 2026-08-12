'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Clock3, Factory, Gauge, Search } from 'lucide-react';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { CountChip } from '@/components/news/power-grid/renewables/shared';
import { fetchPlantDetail, plantTotals } from '@/lib/data/grid/plant-detail.client';
import { cn } from '@/lib/utils';
import type { DailyPlantDetail, GridSystemStats, PlantActual } from '@/lib/data/grid/types';

const PGCB = 'https://pgcb.gov.bd';

const formatMw = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: 1 });

const formatPct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`);

/**
 * Hover text in the page's own styling.
 *
 * A native `title` renders the operating system's tooltip — a different font,
 * its own delay, and a colour scheme that ignores the site's theme entirely.
 * The micro-badges elsewhere accept that trade for their one-word hints; the
 * cards below carry real sentences, so they get a panel that matches the rest
 * of the explorer. Shown on hover AND on keyboard focus, and mirrored into
 * `aria-label` so nothing is available to a mouse alone.
 */
function HoverTip({
  text,
  children,
  align = 'center',
}: {
  text: string;
  children: React.ReactNode;
  align?: 'center' | 'right';
}) {
  return (
    <span className="relative inline-flex group/tip focus-within:z-30 hover:z-30">
      <span tabIndex={0} aria-label={text} className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-primary/45 rounded">
        {children}
      </span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full mb-1.5 w-64 rounded-xl border border-border/60',
          'bg-card/98 backdrop-blur-sm px-3 py-2 text-[11px] font-normal leading-relaxed text-muted-foreground',
          'shadow-lg opacity-0 translate-y-1 transition-all duration-150',
          'group-hover/tip:opacity-100 group-hover/tip:translate-y-0',
          'group-focus-within/tip:opacity-100 group-focus-within/tip:translate-y-0',
          align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2 group-hover/tip:-translate-x-1/2 group-focus-within/tip:-translate-x-1/2',
        )}
      >
        {text}
      </span>
    </span>
  );
}

/**
 * The sort control.
 *
 * A native `<select>` can be styled shut but not open: the list itself is drawn
 * by the operating system, so on a dark theme it opens as a light system menu
 * in a system font. This is a button plus a panel, so the open state looks like
 * the rest of the explorer. Closes on outside click and on Escape, and the
 * options are reachable by keyboard.
 */
function SortMenu({
  value,
  onChange,
  options,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  options: { value: SortKey; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = useCallback(
    (v: SortKey) => {
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort stations"
        className={cn(
          'inline-flex items-center gap-2 pl-3 pr-2.5 py-1.5 text-xs font-semibold rounded-xl border',
          'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
          open
            ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
            : 'border-border/40 bg-transparent text-foreground hover:border-border/70 hover:bg-muted/20',
        )}
      >
        <span className="text-muted-foreground font-medium">Sort</span>
        {current?.label ?? ''}
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-40 mt-1.5 w-52 overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(o.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted/40',
                )}
              >
                {o.label}
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type SortKey = 'name' | 'eveningPeakMw' | 'dayPeakMw' | 'installedMw';

// The control prints its own "Sort" prefix, so the labels no longer repeat it.
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'eveningPeakMw', label: 'Evening peak' },
  { value: 'dayPeakMw', label: 'Day peak' },
  { value: 'installedMw', label: 'Installed MW' },
  { value: 'name', label: 'Station name' },
];

/**
 * A group of station rows summed together — by fuel or by producer. Every
 * number in it is our arithmetic over PGCB's published rows, so everything a
 * group displays is marked `D`; only the group's name (a value PGCB itself
 * prints on each row) is the source's.
 *
 * `installed` is null when no station in the group states an installed MW —
 * an absent figure stays absent rather than becoming a zero.
 */
interface FleetGroup {
  key: string;
  stations: number;
  installed: number | null;
  evening: number;
}

function aggregateBy(plants: PlantActual[], keyOf: (p: PlantActual) => string): FleetGroup[] {
  const groups = new Map<string, { stations: number; installed: number; hasInstalled: boolean; evening: number }>();
  for (const p of plants) {
    const key = keyOf(p) || 'Not stated';
    const g = groups.get(key) ?? { stations: 0, installed: 0, hasInstalled: false, evening: 0 };
    g.stations += 1;
    if (p.installedMw != null) {
      g.installed += p.installedMw;
      g.hasInstalled = true;
    }
    g.evening += p.eveningPeakMw ?? 0;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      stations: g.stations,
      installed: g.hasInstalled ? g.installed : null,
      evening: g.evening,
    }))
    .sort((a, b) => (b.installed ?? 0) - (a.installed ?? 0));
}

/** Share/utilisation mini bar — a visual restatement of a derived percentage. */
function MiniBar({ pct, className = 'bg-primary/70' }: { pct: number | null; className?: string }) {
  return (
    <div className="h-1.5 flex-1 rounded-full bg-muted/40 overflow-hidden">
      {pct != null && (
        <div
          className={`h-full rounded-full ${className}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      )}
    </div>
  );
}

function StationSourceFooter({ label, isoDate }: { label: string; isoDate: string }) {
  return (
    <GridCardFooter>
      <span>
        Source:{' '}
        <a
          href={PGCB}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold"
        >
          {label}
        </a>
      </span>
      <span className="font-medium">Reported day: {isoDate || '—'}</span>
    </GridCardFooter>
  );
}

/**
 * Per-station figures for the reported day: what each plant was built to make,
 * what it was capable of, and what it actually produced at both peaks.
 *
 * Everything here is read straight from the report — the Forecast sheet's
 * "Actual Generation on <reported day>" columns and the GenLog matrix. The
 * forecast-availability columns beside them describe the NEXT day and are not
 * shown, which is why there is no "reason offline" text: PGCB attaches that to
 * the forecast, not to the day being reported.
 *
 * The two summary cards under the table are sums and quotients of those same
 * rows — PGCB publishes each station's capacity and output but never a fuel or
 * producer roll-up, so every figure in them carries a `D` mark.
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

  /* ── Fleet roll-ups, always over the full station list, never the filtered view ── */

  const fuelStats = useMemo(() => {
    const plants = detail?.plants ?? [];
    if (!plants.length) return [];
    return aggregateBy(plants, (p) => p.fuel).map((g) => ({
      ...g,
      // Solar's evening peak is measured after sunset — a real zero, not idle
      // capacity — so an evening-peak utilisation would misread it as a fleet
      // standing still. The cell shows a dash and the note says why.
      utilisation:
        g.key === 'Solar' || g.installed == null || g.installed <= 0
          ? null
          : (g.evening / g.installed) * 100,
    }));
  }, [detail]);

  const PRODUCERS_SHOWN = 8;

  const producerStats = useMemo(() => {
    const plants = detail?.plants ?? [];
    if (!plants.length) return { top: [] as FleetGroup[], other: null as FleetGroup | null, evening: 0 };
    const all = aggregateBy(plants, (p) => p.producer);
    const evening = all.reduce((s, g) => s + g.evening, 0);
    if (all.length <= PRODUCERS_SHOWN + 1) return { top: all, other: null, evening };
    const top = all.slice(0, PRODUCERS_SHOWN);
    const rest = all.slice(PRODUCERS_SHOWN);
    const hasInstalled = rest.some((g) => g.installed != null);
    const other: FleetGroup = {
      key: `Other producers (${rest.length})`,
      stations: rest.reduce((s, g) => s + g.stations, 0),
      installed: hasInstalled ? rest.reduce((s, g) => s + (g.installed ?? 0), 0) : null,
      evening: rest.reduce((s, g) => s + g.evening, 0),
    };
    return { top, other, evening };
  }, [detail]);

  const fleet = useMemo(() => {
    const groups = fuelStats;
    if (!groups.length) return null;
    const hasInstalled = groups.some((g) => g.installed != null);
    return {
      stations: groups.reduce((s, g) => s + g.stations, 0),
      installed: hasInstalled ? groups.reduce((s, g) => s + (g.installed ?? 0), 0) : null,
      evening: groups.reduce((s, g) => s + g.evening, 0),
    };
  }, [fuelStats]);

  if (state === 'loading') {
    return <div className="grid-explorer-skeleton !h-64" />;
  }

  if (state === 'absent') {
    return (
      <div className="grid-explorer-panel">
        <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[220px] gap-2">
          <Factory className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground">
            No per-station detail published for {systemStats.date}
          </p>
          <p className="text-xs text-muted-foreground/80 max-w-xl leading-relaxed">
            PGCB began including the station-level generation log with its 2025 reports. Earlier days
            publish system and zone totals only, which are shown on the other tabs.
          </p>
        </div>
      </div>
    );
  }

  const genlog = detail?.genlog;

  return (
    <div className="grid-explorer-panel space-y-6">
      {/* ── Per-station table ── */}
      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border flex-wrap">
          <Factory className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="grid-explorer-chart-card__title">
              Power Station Output
              <CountChip>{rows.length} stations</CountChip>
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Capacity and actual output at both peaks, as published for {systemStats.date}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter station, fuel, producer"
                className="pl-8 pr-3 py-1.5 w-56 text-xs font-medium rounded-xl border border-border/40 bg-transparent text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent"
              />
            </div>
            <SortMenu value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
        </div>

        <div className="grid-explorer-table-wrap">
          <table className="grid-explorer-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>
                  Fuel
                  <GridProvenanceTag kind="P" className="ml-1" />
                </th>
                <th>
                  Producer
                  <GridProvenanceTag kind="P" className="ml-1" />
                </th>
                <th className="text-right">Installed (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                <th className="text-right">Present (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                <th className="text-right">Day peak (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                <th className="text-right">Evening peak (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                <th className="text-right">Day&apos;s energy (MWh)<GridProvenanceTag kind="P" className="ml-1" /></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.name}
                  className={p.eveningPeakMw === 0 && !p.dayPeakMw && !p.energyKwh ? 'opacity-50' : ''}
                >
                  <td className="font-semibold">{p.name}</td>
                  <td className="text-xs text-muted-foreground">{p.fuel || '—'}</td>
                  <td className="text-xs text-muted-foreground">{p.producer || '—'}</td>
                  <td className="text-right tabular-nums">{formatMw(p.installedMw)}</td>
                  <td className="text-right tabular-nums">{formatMw(p.presentCapacityMw)}</td>
                  {/* Null, not zero, on days sourced from P2 — that sheet
                      publishes the evening peak and no day peak at all. */}
                  <td className="text-right tabular-nums">{formatMw(p.dayPeakMw)}</td>
                  <td className="text-right tabular-nums font-semibold">{formatMw(p.eveningPeakMw)}</td>
                  <td className="text-right tabular-nums" title={p.remarks || undefined}>
                    {p.energyKwh == null ? '—' : formatMw(p.energyKwh / 1000)}
                  </td>
                </tr>
              ))}
              {totals && !query && (
                <tr className="border-t border-border/80 font-bold bg-muted/20">
                  <td colSpan={5}>
                    All stations
                    <GridProvenanceTag kind="D" className="ml-1" />
                  </td>
                  <td className="text-right tabular-nums">{totals.day == null ? '—' : formatMw(totals.day)}</td>
                  <td className="text-right tabular-nums text-primary">{formatMw(totals.evening)}</td>
                  <td className="text-right tabular-nums">
                    {totals.energyKwh == null ? '—' : formatMw(totals.energyKwh / 1000)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totals && (
          // The station sums are what the headline peaks are made of, so showing
          // both is a check the reader can make rather than take on trust.
          <div className="mt-1 p-3 rounded-lg border border-border/50 bg-muted/15 text-[11px] text-muted-foreground leading-relaxed">
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
          </div>
        )}

        <StationSourceFooter label="PGCB Daily Report — station table" isoDate={isoDate} />
      </div>

      {/* ── Fleet roll-ups derived from the same rows ── */}
      {fuelStats.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Fuel-wise utilisation */}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Gauge className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">
                  Fleet Utilisation by Fuel
                  <CountChip>{fuelStats.length} fuels</CountChip>
                </h3>
                <p className="grid-explorer-chart-card__sub">
                  Evening-peak output against installed capacity, summed from the station rows above
                </p>
              </div>
            </div>

            <div className="grid-explorer-table-wrap">
              <table className="grid-explorer-table">
                <thead>
                  <tr>
                    <th>
                      Fuel
                      <GridProvenanceTag kind="P" className="ml-1" />
                    </th>
                    <th className="text-right">Stations<GridProvenanceTag kind="D" className="ml-1" /></th>
                    <th className="text-right">Installed (MW)<GridProvenanceTag kind="D" className="ml-1" /></th>
                    <th className="text-right">Evening peak (MW)<GridProvenanceTag kind="D" className="ml-1" /></th>
                    <th className="text-right w-36">Utilisation<GridProvenanceTag kind="D" className="ml-1" /></th>
                  </tr>
                </thead>
                <tbody>
                  {fuelStats.map((g) => (
                    <tr key={g.key}>
                      <td className="font-semibold">{g.key}</td>
                      <td className="text-right tabular-nums text-muted-foreground">{g.stations}</td>
                      <td className="text-right tabular-nums">{formatMw(g.installed)}</td>
                      <td className="text-right tabular-nums">{formatMw(g.evening)}</td>
                      <td className="text-right">
                        {g.utilisation == null ? (
                          <span className="text-muted-foreground">
                            —
                            {g.key === 'Solar' && (
                              <HoverTip
                                align="right"
                                text="The evening peak is measured after sunset, so a solar station's zero is a real reading — not idle capacity. No evening-peak utilisation is shown for Solar."
                              >
                                <span className="ml-1.5 inline-block px-1.5 py-px rounded border text-[9px] font-bold align-middle bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 cursor-help">
                                  after sunset
                                </span>
                              </HoverTip>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 w-32">
                            <MiniBar pct={g.utilisation} className="bg-amber-500/70" />
                            <span className="tabular-nums font-medium shrink-0">{formatPct(g.utilisation)}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fleet && (
                    <tr className="border-t border-border/80 font-bold bg-muted/20">
                      <td>
                        All fuels
                        <GridProvenanceTag kind="D" className="ml-1" />
                      </td>
                      <td className="text-right tabular-nums">{fleet.stations}</td>
                      <td className="text-right tabular-nums">{formatMw(fleet.installed)}</td>
                      <td className="text-right tabular-nums text-primary">{formatMw(fleet.evening)}</td>
                      <td className="text-right text-muted-foreground">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed">
              PGCB publishes each station&rsquo;s capacity and output but no fuel-wise roll-up — every
              figure here is our sum or quotient of the rows above. Solar stations report a day peak
              and no evening peak, because the evening peak is measured after sunset. A zero there is
              a real reading, not a gap, so Solar carries no evening-peak utilisation.
            </div>

            <StationSourceFooter label="PGCB Daily Report — station table" isoDate={isoDate} />
          </div>

          {/* Producer split */}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Building2 className="h-5 w-5 text-sky-500 shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">
                  Producer Split
                  <CountChip>{producerStats.top.length + (producerStats.other ? 1 : 0)} groups</CountChip>
                </h3>
                <p className="grid-explorer-chart-card__sub">
                  PDB, IPPs and the generation companies — share of the fleet&rsquo;s evening-peak output
                </p>
              </div>
            </div>

            <div className="grid-explorer-table-wrap">
              <table className="grid-explorer-table">
                <thead>
                  <tr>
                    <th>
                      Producer
                      <GridProvenanceTag kind="P" className="ml-1" />
                    </th>
                    <th className="text-right">Stations<GridProvenanceTag kind="D" className="ml-1" /></th>
                    <th className="text-right">Installed (MW)<GridProvenanceTag kind="D" className="ml-1" /></th>
                    <th className="text-right">Evening peak (MW)<GridProvenanceTag kind="D" className="ml-1" /></th>
                    <th className="text-right w-36">Share of output<GridProvenanceTag kind="D" className="ml-1" /></th>
                  </tr>
                </thead>
                <tbody>
                  {[...producerStats.top, ...(producerStats.other ? [producerStats.other] : [])].map((g) => {
                    const isOther = g === producerStats.other;
                    const share =
                      producerStats.evening > 0 ? (g.evening / producerStats.evening) * 100 : null;
                    return (
                      <tr key={g.key}>
                        <td className={isOther ? 'text-muted-foreground' : 'font-semibold'}>
                          {g.key}
                          {/* The grouping into "other" is ours, not a label PGCB prints. */}
                          {isOther && <GridProvenanceTag kind="D" className="ml-1" />}
                        </td>
                        <td className="text-right tabular-nums text-muted-foreground">{g.stations}</td>
                        <td className="text-right tabular-nums">{formatMw(g.installed)}</td>
                        <td className="text-right tabular-nums">{formatMw(g.evening)}</td>
                        <td className="text-right">
                          {share == null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="inline-flex items-center gap-2 w-32">
                              <MiniBar pct={share} className="bg-sky-500/70" />
                              <span className="tabular-nums font-medium shrink-0">{formatPct(share)}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {fleet && (
                    <tr className="border-t border-border/80 font-bold bg-muted/20">
                      <td>
                        All producers
                        <GridProvenanceTag kind="D" className="ml-1" />
                      </td>
                      <td className="text-right tabular-nums">{fleet.stations}</td>
                      <td className="text-right tabular-nums">{formatMw(fleet.installed)}</td>
                      <td className="text-right tabular-nums text-primary">{formatMw(fleet.evening)}</td>
                      <td className="text-right tabular-nums">
                        {producerStats.evening > 0 ? '100.0%' : '—'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Producer labels are exactly as PGCB prints them on each station row; the sums and shares
              are ours, computed over the fleet&rsquo;s summed evening-peak output. PGCB publishes no
              producer-wise total.
            </div>

            <StationSourceFooter label="PGCB Daily Report — station table" isoDate={isoDate} />
          </div>
        </div>
      )}

      {/* ── Hourly generation log ── */}
      {genlog && (
        <div className="grid-explorer-chart-card card">
          <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
            <Clock3 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <h3 className="grid-explorer-chart-card__title">
                Hourly Station Log
                <CountChip>{genlog.stations.length} stations</CountChip>
              </h3>
              <p className="grid-explorer-chart-card__sub">
                Output every hour for each station, from the NLDC generation log
                {query.trim() ? ' — filtered by your search above' : ''}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[28rem] rounded-lg border border-border/40">
            <table className="grid-explorer-table w-full text-[11px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th className="text-left sticky left-0 bg-card pl-3">Station</th>
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
                      <td className="font-medium whitespace-nowrap sticky left-0 bg-card pl-3">{s.name}</td>
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
                    <td className="sticky left-0 bg-muted/20 pl-3">National Grid Total</td>
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
          <StationSourceFooter label="PGCB Daily Report — generation log" isoDate={isoDate} />
        </div>
      )}
    </div>
  );
}
