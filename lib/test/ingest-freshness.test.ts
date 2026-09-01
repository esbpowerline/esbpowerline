import { describe, it, expect } from 'vitest';
import { assessFreshness, bstToday } from '@/lib/data/grid/ingest-freshness';

const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe('assessFreshness', () => {
  it('treats one day back as current, because that is what current looks like', () => {
    // PGCB publishes day D on the morning of D+1. On 1 September the newest
    // report that can exist is 31 August. Calling that "1 day behind" would
    // cry wolf on a perfectly up-to-date archive, every single day.
    const f = assessFreshness('2026-08-31', at('2026-09-01'));
    expect(f?.level).toBe('current');
    expect(f?.note).toBe('');
  });

  it('names the lag once the archive is genuinely trailing', () => {
    const f = assessFreshness('2026-08-30', at('2026-09-01'));
    expect(f?.daysBehind).toBe(1);
    expect(f?.level).toBe('current');

    const behind = assessFreshness('2026-08-28', at('2026-09-01'));
    expect(behind?.daysBehind).toBe(3);
    expect(behind?.level).toBe('lagging');
    expect(behind?.note).toMatch(/3 days behind/);
  });

  it('says the gap is ours, not the publisher’s', () => {
    // The distinction a reader needs: PGCB has published, we have not ingested.
    const f = assessFreshness('2026-08-20', at('2026-09-01'));
    expect(f?.level).toBe('stale');
    expect(f?.note).toMatch(/gap in our collection, not in PGCB/);
  });

  it('reads the calendar in Bangladesh time', () => {
    // 23:00 UTC on 31 August is already 1 September in Dhaka. Getting this
    // wrong would show the whole country a day-old lag notice each evening.
    expect(bstToday(new Date('2026-08-31T23:00:00Z'))).toBe('2026-09-01');
    expect(bstToday(new Date('2026-08-31T17:00:00Z'))).toBe('2026-08-31');
  });

  it('returns nothing when there is no archive at all', () => {
    expect(assessFreshness(null)).toBeNull();
  });

  it('never reports a negative lag for a day in the future', () => {
    const f = assessFreshness('2026-09-05', at('2026-09-01'));
    expect(f?.daysBehind).toBe(0);
    expect(f?.level).toBe('current');
  });
});
