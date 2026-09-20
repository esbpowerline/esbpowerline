import { describe, expect, it } from 'vitest';
import {
  SCHEDULE_PAST_TOLERANCE_MS,
  defaultScheduleTime,
  parseScheduleTime,
  toDatetimeLocal,
} from '@/lib/bulk-schedule';

/**
 * Bulk scheduling is the one bulk action that carries a value, so it is the
 * one that can be wrong in a way a verb cannot.
 *
 * A time in the past does not schedule anything — the publish cron picks it up
 * on its next run and the story goes live immediately. That is a publish
 * nobody asked for, across a whole selection, and much harder to take back
 * than a draft nobody asked for. Both the dialog and the server action read
 * this module, so the button an editor sees enabled is the one the server
 * will accept.
 */

const NOW = new Date('2026-09-20T12:00:00');

describe('parseScheduleTime', () => {
  it('accepts a future time and hands back the instant', () => {
    const result = parseScheduleTime('2026-09-20T18:30', NOW);
    expect(result.ok).toBe(true);
    // The parsed instant is returned rather than a boolean, so a caller
    // cannot validate one value and then write a different one.
    if (result.ok) expect(result.at.getHours()).toBe(18);
  });

  it('refuses a time in the past, and says what to do instead', () => {
    const result = parseScheduleTime('2026-09-19T09:00', NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/publish/i);
  });

  it('forgives the seconds between typing a time and confirming it', () => {
    // Picking 12:00 at 11:59:58 must not fail by the time the click lands.
    const justPast = new Date(NOW.getTime() - SCHEDULE_PAST_TOLERANCE_MS + 5_000);
    expect(parseScheduleTime(toDatetimeLocal(NOW), justPast).ok).toBe(true);
    expect(parseScheduleTime(toDatetimeLocal(NOW), NOW).ok).toBe(true);
  });

  it('does not forgive more than the tolerance', () => {
    const wellPast = new Date(NOW.getTime() + SCHEDULE_PAST_TOLERANCE_MS + 60_000);
    expect(parseScheduleTime(toDatetimeLocal(NOW), wellPast).ok).toBe(false);
  });

  it('refuses an empty or missing value rather than defaulting to now', () => {
    for (const bad of ['', '   ', null, undefined]) {
      const result = parseScheduleTime(bad, NOW);
      expect(result.ok).toBe(false);
    }
  });

  it('refuses something that is not a date', () => {
    for (const bad of ['tomorrow', 'not-a-date', '2026-13-45T99:99']) {
      expect(parseScheduleTime(bad, NOW).ok).toBe(false);
    }
  });
});

describe('the time the picker opens on', () => {
  it('is the next round half hour, never now', () => {
    // Opening on "now" offers a time already in the past by the time it is
    // confirmed, and one nobody would choose deliberately.
    expect(defaultScheduleTime(new Date('2026-09-20T12:00:00'))).toBe('2026-09-20T12:30');
    expect(defaultScheduleTime(new Date('2026-09-20T12:01:00'))).toBe('2026-09-20T12:30');
    expect(defaultScheduleTime(new Date('2026-09-20T12:29:59'))).toBe('2026-09-20T12:30');
    expect(defaultScheduleTime(new Date('2026-09-20T12:31:00'))).toBe('2026-09-20T13:00');
  });

  it('rolls over midnight without landing in the past', () => {
    const late = new Date('2026-09-20T23:45:00');
    const value = defaultScheduleTime(late);
    expect(value).toBe('2026-09-21T00:00');
    expect(parseScheduleTime(value, late).ok).toBe(true);
  });

  it('is always a time the validator accepts', () => {
    // The two halves must agree, or the dialog opens on a value it then
    // refuses — which reads as the control being broken.
    for (const minute of [0, 1, 14, 29, 30, 31, 44, 59]) {
      const now = new Date(2026, 8, 20, 9, minute, 30);
      expect(parseScheduleTime(defaultScheduleTime(now), now).ok).toBe(true);
    }
  });
});

describe('toDatetimeLocal', () => {
  it('pads every field so the input accepts it', () => {
    expect(toDatetimeLocal(new Date(2026, 0, 5, 7, 4))).toBe('2026-01-05T07:04');
  });

  it('stays local rather than shifting to UTC', () => {
    // toISOString() here would move the printed time by the offset, which on
    // a +06:00 machine files an evening slot as the following afternoon.
    const d = new Date(2026, 8, 20, 23, 30);
    expect(toDatetimeLocal(d)).toBe('2026-09-20T23:30');
  });
});
