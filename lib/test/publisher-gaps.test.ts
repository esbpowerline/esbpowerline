import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import monthly from '@/lib/pgcb-monthly-data.json';
import {
  PGCB_DAYS_WITHOUT_SOURCE,
  PGCB_MONTHS_NEVER_PUBLISHED,
  splitGaps,
} from '@/lib/data/grid/publisher-gaps';

describe('splitGaps', () => {
  it('separates the holes we lack from the ones nobody published', () => {
    const never = new Set(['2016-01-22']);
    expect(splitGaps(['2016-01-06', '2016-01-22', '2023-09-21'], (k) => never.has(k))).toEqual({
      missing: ['2016-01-06', '2023-09-21'],
      neverPublished: ['2016-01-22'],
    });
  });
});

describe('publisher gaps are gaps, not holdings', () => {
  it('declares no month the archive actually holds', () => {
    const held = new Set((monthly as Array<{ date_key: string }>).map((m) => m.date_key));
    for (const key of Object.keys(PGCB_MONTHS_NEVER_PUBLISHED)) expect(held.has(key)).toBe(false);
  });

  it('keeps the declaration internally consistent', () => {
    const file = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public/data/grid-verification/no-source-days.json'), 'utf8'),
    );
    const byReason = [...file.reasons['indexed-404'], ...file.reasons['not-indexed']].sort();
    expect(byReason).toEqual(file.days);
    expect(file.count).toBe(file.days.length);
    expect(PGCB_DAYS_WITHOUT_SOURCE.size).toBe(file.days.length);
  });

  it('carries the eleven consecutive days PGCB indexes but cannot serve', () => {
    for (let d = 22; d <= 31; d += 1) expect(PGCB_DAYS_WITHOUT_SOURCE.has(`2016-01-${d}`)).toBe(true);
    expect(PGCB_DAYS_WITHOUT_SOURCE.has('2016-02-01')).toBe(true);
  });

  it('does not declare a day whose workbook PGCB still serves', () => {
    // Fetched with a workbook signature on 2026-09-13: these are ours to ingest.
    for (const day of ['2016-01-06', '2020-05-04', '2022-04-24', '2022-12-30', '2023-02-18', '2023-09-21']) {
      expect(PGCB_DAYS_WITHOUT_SOURCE.has(day)).toBe(false);
    }
  });
});
