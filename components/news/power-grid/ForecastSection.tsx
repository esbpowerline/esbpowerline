'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { GridForecast, GridSystemStats, HourlyLoadItem } from '@/lib/data/grid/types';
import { ForecastVsActualPanel } from '@/components/news/power-grid/ForecastVsActualPanel';
import { LiveForecastPanel } from '@/components/news/power-grid/LiveForecastPanel';
import {
  compareForecastToLive,
  type ForecastVsLive,
  type ForwardForecast,
  type LiveHourLike,
} from '@/lib/data/grid/forward-forecast';

/**
 * One forecast card, two vintages of the same comparison.
 *
 * These began as two stacked cards and read as a bug: the same canvas drawn
 * twice, the only difference a date buried in the sub-line. They are not the
 * same chart — one is the day still running, checked against NLDC's hourly
 * page; the other is the day before, settled and checked against the audited
 * workbook — but a reader should not have to find that out by reading two
 * headers. So the difference becomes the control instead, and only one card is
 * ever on the page.
 *
 * The toggle appears only when there is a live half to toggle to. On a day
 * PGCB has not filed yet, on an archive day being browsed out of history, or
 * with the NLDC pages down, this renders exactly what it rendered before: the
 * settled card, alone, with no dead switch on it.
 */

const POLL_MS = 15 * 60 * 1000;

type LiveGridResponse = {
  asOf?: string;
  today?: { date?: string };
  hours?: LiveHourLike[];
};

type Mode = 'today' | 'settled';

/** "2026-08-23" + 1 → "2026-08-24", by parts so no timezone can shift it. */
function nextDay(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** "2026-08-24" → "24 Aug", the form the rest of this card uses. */
function dayLabel(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function ModeToggle({
  mode,
  onMode,
  liveDay,
  settledDay,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  liveDay: string;
  settledDay: string | null | undefined;
}) {
  const options: Array<{ id: Mode; label: string; sub: string }> = [
    { id: 'today', label: dayLabel(liveDay), sub: 'live' },
    { id: 'settled', label: dayLabel(settledDay), sub: 'audited' },
  ];
  // A sliding thumb behind two equal halves, not two loose buttons. The first
  // version was a pair of chips that read as labels rather than as a control,
  // and nobody clicks a label -- the track, the thumb and the fact that the
  // inactive half stays legible are what say "this switches".
  const index = options.findIndex((o) => o.id === mode);
  return (
    <div
      className="forecast-switch shrink-0"
      role="group"
      aria-label="Which day's forecast comparison to show"
    >
      <span
        className="forecast-switch__thumb"
        style={{ transform: `translateX(${index * 100}%)` }}
        aria-hidden
      />
      {options.map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onMode(o.id)}
            aria-pressed={active}
            className={cn('forecast-switch__opt', active && 'is-active')}
          >
            <span className="forecast-switch__day tabular-nums">{o.label}</span>
            <span className="forecast-switch__kind">
              {o.sub === 'live' ? (
                <>
                  <span className="forecast-switch__dot" aria-hidden />
                  live
                </>
              ) : (
                'audited'
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ForecastSection({
  forecast,
  systemStats,
  hourlyLoadData,
  actualsFrom,
  chartTheme,
  className,
}: {
  forecast?: GridForecast | null;
  systemStats: GridSystemStats;
  hourlyLoadData?: HourlyLoadItem[];
  actualsFrom?: string | null;
  chartTheme: {
    primary: string;
    accent: string;
    destructive: string;
    axisTick: string;
    gridStroke: string;
  };
  className?: string;
}) {
  const [forward, setForward] = useState<ForwardForecast | null>(null);
  const [live, setLive] = useState<LiveGridResponse | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  /**
   * Hold the card still across a switch.
   *
   * The two vintages are not the same height -- the live card carries a
   * headline strip and all 26 rows of the day, the settled one carries the
   * measures table and the two-workbook diagram -- so swapping them changed
   * the document height under the reader and the whole page slid. The switch
   * is the one control on the card guaranteed to be under the cursor when it
   * happens, which makes the jump feel like a misclick.
   *
   * So: note where the card's top edge sits before the swap, and after the
   * browser has laid out the replacement, scroll by whatever it moved. The
   * edge the reader was looking at stays where they were looking.
   */
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pinnedTop = useRef<number | null>(null);

  const switchMode = useCallback((next: Mode) => {
    pinnedTop.current = hostRef.current?.getBoundingClientRect().top ?? null;
    setMode(next);
  }, []);

  useLayoutEffect(() => {
    const before = pinnedTop.current;
    if (before == null) return;
    pinnedTop.current = null;
    const after = hostRef.current?.getBoundingClientRect().top;
    if (after == null) return;
    const drift = after - before;
    // Sub-pixel drift is not worth a scroll call; anything larger is the jump.
    if (Math.abs(drift) > 0.5) window.scrollBy({ top: drift, behavior: 'instant' as ScrollBehavior });
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let liveJson: LiveGridResponse | null = null;
      try {
        const res = await fetch('/api/data/live-grid');
        if (!res.ok) return;
        liveJson = (await res.json()) as LiveGridResponse;
      } catch {
        return; // Source down; the settled card carries on alone.
      }
      // The forecast to fetch is decided by the day NLDC is posting, not by
      // the browser's clock: a machine in the wrong timezone would otherwise
      // ask for a day that has no forecast, or the wrong one.
      const day = liveJson?.today?.date;
      if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;

      let forwardJson: ForwardForecast | null = null;
      try {
        const res = await fetch(`/data/forecast/${day}.json`);
        // 404 is the ordinary case before the day's workbook is published.
        if (!res.ok) return;
        forwardJson = (await res.json()) as ForwardForecast;
      } catch {
        return;
      }
      if (forwardJson?.targetDay !== day || cancelled) return;
      setLive(liveJson);
      setForward(forwardJson);
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const comparison: ForecastVsLive | null = useMemo(
    () => compareForecastToLive(forward, live?.hours),
    [forward, live],
  );

  const settledDay = forecast?.targetDay ?? systemStats?.date ?? null;
  const hasLive = Boolean(forward && comparison && comparison.coverage.matched > 0);

  // Default to the running day only when the archive is caught up to it. Browse
  // back to June and the live half is still reachable, but the card opens on
  // the day you actually asked for rather than jumping to today behind you.
  const caughtUp = hasLive && comparison!.day === nextDay(settledDay);
  const active: Mode = !hasLive ? 'settled' : (mode ?? (caughtUp ? 'today' : 'settled'));

  const toggle = hasLive ? (
    <ModeToggle
      mode={active}
      onMode={switchMode}
      liveDay={comparison!.day}
      settledDay={settledDay}
    />
  ) : null;

  // One wrapper for both branches, so the element being measured across the
  // swap is the same node rather than two different cards.
  return (
    <div ref={hostRef}>
      {active === 'today' && forward && comparison ? (
        <LiveForecastPanel
          forecast={forward}
          comparison={comparison}
          chartTheme={chartTheme}
          toggle={toggle}
          className={className}
        />
      ) : (
        <ForecastVsActualPanel
          forecast={forecast}
          systemStats={systemStats}
          hourlyLoadData={hourlyLoadData}
          actualsFrom={actualsFrom}
          chartTheme={chartTheme}
          toggle={toggle}
          className={className}
        />
      )}
    </div>
  );
}
