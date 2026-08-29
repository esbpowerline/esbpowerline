import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  computeLiveWeekKpis,
  gasDayStart,
  liveWeekTimelinePoints,
} from '@/lib/data/petrobangla/computeLiveWeek';
import type { PetrobanglaDaily, PetrobanglaLiveWeekBundle } from '@/lib/data/petrobangla/types';

/**
 * The rolling week and the National Timeline must name the same day the same way.
 *
 * They did not: the rolling week keyed on `report_date_end` and the timeline on
 * the gas-day start, so the newest report read as 27 Aug on one card and 26 Aug
 * on the other. Both were showing the same document — a gas day is an
 * 08:00–08:00 window, and the two cards had picked opposite ends of it.
 *
 * These read the real archive rather than a fixture, for the reason
 * petrobangla-day.test.ts gives: a fixture would be written with whichever
 * convention the author had in mind, which is the thing under test.
 */

const PB = path.join(process.cwd(), 'public', 'data', 'petrobangla');

function readDay(iso: string): PetrobanglaDaily {
  return JSON.parse(fs.readFileSync(path.join(PB, 'daily', `${iso}.json`), 'utf-8'));
}

function bundleOf(days: PetrobanglaDaily[]): PetrobanglaLiveWeekBundle {
  return { days } as PetrobanglaLiveWeekBundle;
}

describe('rolling week gas-day keying', () => {
  it('names a day by the start of its window, as the timeline does', () => {
    const day = readDay('2026-08-26');
    // The document itself: window opens on the 26th, closes on the 27th.
    expect(day.report.gas_day_start).toBe('2026-08-26');
    expect(day.report.report_date_end).toBe('2026-08-27');

    expect(gasDayStart(day)).toBe('2026-08-26');
    expect(computeLiveWeekKpis(bundleOf([day])).latestDate).toBe('2026-08-26');
    expect(liveWeekTimelinePoints(bundleOf([day]))[0]!.date).toBe('2026-08-26');
  });

  it('agrees with timeline-summary.json on the newest day both hold', () => {
    const timeline = JSON.parse(
      fs.readFileSync(path.join(PB, 'timeline-summary.json'), 'utf-8'),
    ) as { days: { date: string }[] };
    const newest = timeline.days[timeline.days.length - 1]!.date;

    const point = liveWeekTimelinePoints(bundleOf([readDay(newest)]))[0]!;
    expect(point.date).toBe(newest);
  });

  it('prefers gas_day_start over the letterhead, which Petrobangla mistypes', () => {
    // report_date_start is transcribed from the line printed at the top of the
    // PDF; it is wrong on 89 of the archived files. gas_day_start comes from the
    // "08:00 hrs to 08:00 hrs" line that defines the window.
    const doc = {
      report: { gas_day_start: '2026-08-26', report_date_start: '2024-08-26' },
    } as unknown as PetrobanglaDaily;
    expect(gasDayStart(doc)).toBe('2026-08-26');
  });

  it('falls back to the header only when the window is absent', () => {
    const doc = { report: { report_date_start: '2019-03-04' } } as unknown as PetrobanglaDaily;
    expect(gasDayStart(doc)).toBe('2019-03-04');
  });
});
