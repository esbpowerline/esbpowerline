import { describe, it, expect } from 'vitest';
import {
  DUPLICATE_SUSPECT_DAYS,
  describeDayProvenance,
  provenanceNeedsDisclosure,
} from '@/lib/data/grid/verification-ledger';

// Six day-pairs are byte-identical to their neighbour across four independent stats —
// the signature of the confirmed June-2026 filing shift — and the workbooks that could
// rule on them are no longer served. The one unacceptable outcome is silence: every one
// of these days must disclose, whatever else the ledger says about it.

describe('duplicate-suspect days', () => {
  it('marks every member of every pair, symmetrically', () => {
    const days = Object.keys(DUPLICATE_SUSPECT_DAYS);
    expect(days).toHaveLength(12);
    for (const day of days) {
      const partner = DUPLICATE_SUSPECT_DAYS[day];
      expect(DUPLICATE_SUSPECT_DAYS[partner]).toBe(day);
      expect(partner).not.toBe(day);
    }
  });

  it('discloses on an unledgered suspect day and names the partner', () => {
    const p = describeDayProvenance('2022-07-09', undefined);
    expect(p.duplicateSuspect).toBe('2022-07-10');
    expect(p.summary).toContain('2022-07-10');
    expect(provenanceNeedsDisclosure(p)).toBe(true);
  });

  it('still discloses even when the ledger says MATCH — the suspicion is about which day, not which figures', () => {
    const p = describeDayProvenance('2014-04-09', {
      day: '2014-04-09',
      verdict: 'MATCH',
      parserVersion: '2.0.0',
      gasVerified: true,
      hash: 'abc',
    });
    expect(p.duplicateSuspect).toBe('2014-04-10');
    expect(p.summary).toContain('2014-04-10');
    expect(provenanceNeedsDisclosure(p)).toBe(true);
  });

  it('leaves ordinary days unmarked', () => {
    const p = describeDayProvenance('2022-07-11', undefined);
    expect(p.duplicateSuspect).toBeNull();
    expect(p.summary).not.toContain('identical');
  });
});
