import { describe, it, expect } from 'vitest';
import { compareForecastToLive, type ForwardForecast } from '@/lib/data/grid/forward-forecast';

/**
 * Which hours of a forward forecast were actually forecast.
 *
 * PGCB publishes a full 24 hours in the forecast block of a report it generates
 * mid-morning, so the early rows are a record of hours that had already
 * happened. Scoring those would credit the forecast with knowing what it had
 * already been told. The card marks them `beforeIssue` and keeps them out of
 * every summary figure — and the boundary has to be the stamp itself, not the
 * hour the stamp falls in.
 */

const HOURS = [
  { time: '07:00', generationMw: 13640, demandMw: 13500 },
  { time: '08:00', generationMw: 13645, demandMw: 13600 },
  { time: '09:00', generationMw: 13340, demandMw: 13400 },
  { time: '10:00', generationMw: 13770, demandMw: 13900 },
  { time: '11:00', generationMw: 13900, demandMw: 14000 },
];

function forecastIssuedAt(issuedAt: string | null): ForwardForecast {
  return { targetDay: '2026-08-29', issuedAt, hourly: HOURS };
}

const LIVE = [
  { at: '2026-08-28T09:00:00', totalMw: 99999 }, // yesterday — must never be matched
  { at: '2026-08-29T07:00:00', totalMw: 13491, demandMw: 13491 },
  { at: '2026-08-29T08:00:00', totalMw: 13593, demandMw: 13593 },
  { at: '2026-08-29T09:00:00', totalMw: 13603, demandMw: 13603 },
  { at: '2026-08-29T10:00:00', totalMw: 13979, demandMw: 13979 },
  { at: '2026-08-29T11:00:00', totalMw: 13924, demandMw: 13924 },
];

describe('forward forecast against the live hours', () => {
  it('does not score the hour the report was stamped in', () => {
    // Real figures from 2026-08-29, stamped 09:13. The 09:00 reading was taken
    // thirteen minutes before the stamp, so it was a record. Counting it made
    // it both the widest "gap" on the card (+263 MW) and a third of the mean.
    const r = compareForecastToLive(forecastIssuedAt('2026-08-29T09:13:00+06:00'), LIVE)!;
    expect(r.issuedClock).toBe('09:13');

    const scored = r.rows.filter((x) => !x.beforeIssue).map((x) => x.time);
    expect(scored).toEqual(['10:00', '11:00']);
    expect(r.coverage.scored).toBe(2);
    expect(r.meanGenGapMw).toBe(116.5);
    expect(r.widestGenGap?.time).toBe('10:00');
    // The headline is demand: (13979-13900 + 13924-14000) / 2.
    expect(r.meanGapMw).toBe(1.5);
    expect(r.widestGap?.time).toBe('10:00');
  });

  /**
   * 23 Nov 2026, 10:00: PGCB's Generation column said 13,995 (availability,
   * flat all day) and its Demand column 10,940; the grid carried 10,979. Set
   * against generation, the card called a −3,016 MW "miss"; against demand it
   * is +39 MW.
   */
  it('headlines demand, not the availability figure in the Generation column', () => {
    const r = compareForecastToLive(
      { targetDay: '2026-11-23', issuedAt: '2026-11-23T09:21:00+06:00',
        hourly: [{ time: '10:00', generationMw: 13994.74, demandMw: 10940 }] },
      [{ at: '2026-11-23T10:00:00', totalMw: 10979.54, demandMw: 10979.54 }],
    )!;
    expect(Math.round(r.rows[0].gapMw!)).toBe(40);
    expect(Math.round(r.rows[0].genGapMw!)).toBe(-3015);
    expect(r.meanGapMw).toBe(39.5);
  });

  it('scores an hour that falls after the stamp', () => {
    const r = compareForecastToLive(forecastIssuedAt('2026-08-29T08:59:00+06:00'), LIVE)!;
    expect(r.rows.filter((x) => !x.beforeIssue).map((x) => x.time)).toEqual([
      '09:00',
      '10:00',
      '11:00',
    ]);
  });

  it('scores every hour when the report carries no stamp', () => {
    const r = compareForecastToLive(forecastIssuedAt(null), LIVE)!;
    expect(r.rows.every((x) => !x.beforeIssue)).toBe(true);
    expect(r.coverage.scored).toBe(5);
  });

  it('matches only hours belonging to the forecast day', () => {
    // The live window is the last 24 posted rows and routinely spans midnight.
    const r = compareForecastToLive(forecastIssuedAt(null), LIVE)!;
    expect(r.coverage.liveHours).toBe(5);
    expect(r.rows.find((x) => x.time === '09:00')?.actualGenMw).toBe(13603);
  });
});
