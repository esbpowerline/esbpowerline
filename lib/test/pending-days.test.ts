import { describe, it, expect } from 'vitest';
import { pendingDays, pendingDayFor, isBeyondToday } from '@/lib/data/grid/pending-days';

// 10:00 BST on 4 Sep 2026 == 04:00 UTC. Chosen so the BST date and the UTC date
// agree; the boundary cases below test where they do not.
const morningOf4th = new Date('2026-09-04T04:00:00Z');

describe('pendingDays', () => {
  it('offers today alone when yesterday is already filed', () => {
    const days = pendingDays('2026-09-03', morningOf4th);
    expect(days.map((d) => d.date)).toEqual(['2026-09-04']);
    expect(days[0].status).toBe('in-progress');
    expect(days[0].dueDate).toBe('2026-09-05');
  });

  it('offers yesterday and today while PGCB has not filed yesterday yet', () => {
    const days = pendingDays('2026-09-02', morningOf4th);
    expect(days.map((d) => d.date)).toEqual(['2026-09-03', '2026-09-04']);
    expect(days[0].status).toBe('awaiting');
    expect(days[0].dueDate).toBe('2026-09-04');
    expect(days[1].status).toBe('in-progress');
  });

  it('says nothing once the archive is behind — that gap is ours, not the publisher’s', () => {
    // Two days behind the newest day that can exist: assessFreshness calls this
    // 'lagging' and prints its own note. Listing "awaiting PGCB" days here would
    // blame PGCB for reports it filed on time.
    expect(pendingDays('2026-09-01', morningOf4th)).toEqual([]);
    expect(pendingDays('2026-08-20', morningOf4th)).toEqual([]);
  });

  it('says nothing when the archive somehow holds today or later', () => {
    expect(pendingDays('2026-09-04', morningOf4th)).toEqual([]);
    expect(pendingDays('2026-09-09', morningOf4th)).toEqual([]);
  });

  it('never returns more than two days', () => {
    for (const latest of ['2026-09-02', '2026-09-03']) {
      expect(pendingDays(latest, morningOf4th).length).toBeLessThanOrEqual(2);
    }
  });

  it('rolls over at midnight BST, not at midnight UTC', () => {
    // 23:30 UTC on the 3rd is 05:30 BST on the 4th — already the 4th in Dhaka.
    const justAfterDhakaMidnight = new Date('2026-09-03T23:30:00Z');
    expect(pendingDays('2026-09-03', justAfterDhakaMidnight).map((d) => d.date)).toEqual(['2026-09-04']);

    // 17:00 UTC on the 3rd is 23:00 BST on the 3rd — still the 3rd in Dhaka, so
    // the 3rd is the running day and the 4th must not appear yet.
    const beforeDhakaMidnight = new Date('2026-09-03T17:00:00Z');
    expect(pendingDays('2026-09-02', beforeDhakaMidnight).map((d) => d.date)).toEqual(['2026-09-03']);
  });

  it('handles a missing latest date', () => {
    expect(pendingDays(null, morningOf4th)).toEqual([]);
    expect(pendingDays(undefined, morningOf4th)).toEqual([]);
    expect(pendingDays('', morningOf4th)).toEqual([]);
  });

  it('never names a figure — only the publisher and the due date', () => {
    for (const day of pendingDays('2026-09-02', morningOf4th)) {
      expect(day.publisher).toBe('PGCB');
      expect(day.note).not.toMatch(/\d+(\.\d+)?\s*(MW|MWh|MKWh|MMCFD)/i);
      // "no data" reads to a reader as a measurement of zero. The note must say
      // what the source has and has not published instead.
      expect(day.note.toLowerCase()).not.toContain('no data');
    }
  });
});

describe('isBeyondToday', () => {
  it('separates today from tomorrow on the Dhaka clock', () => {
    expect(isBeyondToday('2026-09-04', morningOf4th)).toBe(false);
    expect(isBeyondToday('2026-09-05', morningOf4th)).toBe(true);
    expect(isBeyondToday('2026-09-03', morningOf4th)).toBe(false);
  });

  it('uses the Dhaka date, not the UTC one', () => {
    // 23:30 UTC on the 3rd is already the 4th in Dhaka, so the 4th is today.
    const justAfterDhakaMidnight = new Date('2026-09-03T23:30:00Z');
    expect(isBeyondToday('2026-09-04', justAfterDhakaMidnight)).toBe(false);
    expect(isBeyondToday('2026-09-05', justAfterDhakaMidnight)).toBe(true);
  });

  it('agrees with pendingDays: nothing pending is ever beyond today', () => {
    for (const latest of ['2026-09-02', '2026-09-03']) {
      for (const day of pendingDays(latest, morningOf4th)) {
        expect(isBeyondToday(day.date, morningOf4th)).toBe(false);
      }
    }
  });
});

describe('pendingDayFor', () => {
  it('finds the entry for a pending date and nothing for a held one', () => {
    expect(pendingDayFor('2026-09-04', '2026-09-03', morningOf4th)?.status).toBe('in-progress');
    expect(pendingDayFor('2026-09-03', '2026-09-03', morningOf4th)).toBeNull();
    expect(pendingDayFor('2026-08-30', '2026-09-03', morningOf4th)).toBeNull();
  });
});
