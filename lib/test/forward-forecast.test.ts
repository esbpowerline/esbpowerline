import { describe, it, expect } from 'vitest';
import {
  compareForecastToLive,
  friendlyHour,
  minutesOfRow,
  type ForwardForecast,
  type LiveHourLike,
} from '@/lib/data/grid/forward-forecast';

const forecast: ForwardForecast = {
  targetDay: '2026-08-24',
  issuedOn: '2026-08-23',
  issuedIn: 'Daily Report 24-08-2026',
  issuedAt: '2026-08-24T08:56:00+06:00',
  hourly: [
    { time: '00:00', generationMw: 16200, demandMw: 17920, loadShedMw: 1642.6 },
    { time: '21:00', generationMw: 16800, demandMw: 17300, loadShedMw: 620 },
    { time: '22:00', generationMw: 16700, demandMw: 17200, loadShedMw: 610 },
    { time: '19:30', generationMw: 16970, demandMw: 17380, loadShedMw: 573 },
  ],
};

const hours: LiveHourLike[] = [
  // Yesterday's tail — present in every live window, must never be matched.
  { at: '2026-08-23T21:00:00', totalMw: 9999, demandMw: 9999, loadShedMw: 9999 },
  { at: '2026-08-24T00:00:00', totalMw: 16000, demandMw: 17800, loadShedMw: 1800 },
  { at: '2026-08-24T21:00:00', totalMw: 16520, demandMw: 16574, loadShedMw: 687 },
];

describe('compareForecastToLive', () => {
  it('matches only hours belonging to the forecast target day', () => {
    const out = compareForecastToLive(forecast, hours)!;
    expect(out.day).toBe('2026-08-24');
    const twentyOne = out.rows.find((r) => r.time === '21:00')!;
    expect(twentyOne.actualGenMw).toBe(16520);
    expect(twentyOne.genGapMw).toBe(16520 - 16800);
    expect(out.coverage.liveHours).toBe(2);
  });

  it('never folds the previous day tail into the curve', () => {
    const out = compareForecastToLive(forecast, hours)!;
    expect(out.rows.every((r) => r.actualGenMw !== 9999)).toBe(true);
  });

  it('leaves unposted and half-hour rows unmatched rather than zero-filled', () => {
    const out = compareForecastToLive(forecast, hours)!;
    const twentyTwo = out.rows.find((r) => r.time === '22:00')!;
    expect(twentyTwo.actualGenMw).toBeNull();
    expect(twentyTwo.genGapMw).toBeNull();
    const half = out.rows.find((r) => r.time === '19:30')!;
    expect(half.actualGenMw).toBeNull();
    expect(out.coverage.matched).toBe(2);
    expect(out.coverage.unmatched).toBe(2);
  });

  it('reports the gap signed, in both directions', () => {
    const out = compareForecastToLive(forecast, hours)!;
    const midnight = out.rows.find((r) => r.time === '00:00')!;
    expect(midnight.genGapMw).toBe(-200);
    expect(midnight.demandGapMw).toBe(-120);
  });

  it('keeps hours that had already happened out of every summary figure', () => {
    const out = compareForecastToLive(forecast, hours)!;
    // 00:00 precedes the 08:56 stamp: published, matched, but never a
    // prediction. Only 21:00 is fit to score.
    expect(out.rows.find((r) => r.time === '00:00')!.beforeIssue).toBe(true);
    expect(out.rows.find((r) => r.time === '21:00')!.beforeIssue).toBe(false);
    expect(out.coverage.matched).toBe(2);
    expect(out.coverage.scored).toBe(1);
    expect(out.meanGenGapMw).toBe(-280);
    expect(out.widestGenGap?.time).toBe('21:00');
    expect(out.issuedClock).toBe('08:56');
  });

  it('quotes the newest matched hour and the widest gap', () => {
    const out = compareForecastToLive(forecast, hours)!;
    expect(out.latestMatched?.time).toBe('21:00');
    expect(out.widestGenGap?.time).toBe('21:00');
  });

  it('returns null rather than an empty shell when either half is missing', () => {
    expect(compareForecastToLive(null, hours)).toBeNull();
    expect(compareForecastToLive({ targetDay: '2026-08-24', hourly: [] }, hours)).toBeNull();
    const noLive = compareForecastToLive(forecast, [])!;
    expect(noLive.coverage.matched).toBe(0);
    expect(noLive.latestMatched).toBeNull();
    expect(noLive.meanGenGapMw).toBeNull();
  });
});

describe('clock helpers', () => {
  it('reads an hour the way a reader holds it, midnight and noon included', () => {
    expect(friendlyHour('00:00')).toBe('12 AM');
    expect(friendlyHour('12:00')).toBe('12 PM');
    expect(friendlyHour('21:00')).toBe('9 PM');
    expect(friendlyHour('19:30')).toBe('7:30 PM');
  });

  it('orders half-hour rows against the clock, not against their string', () => {
    expect(minutesOfRow('00:00')).toBe(0);
    expect(minutesOfRow('19:30')).toBe(19 * 60 + 30);
    expect(minutesOfRow('19:30')).toBeGreaterThan(minutesOfRow('19:00'));
    expect(minutesOfRow('19:30')).toBeLessThan(minutesOfRow('20:00'));
  });
});
