import { describe, expect, it } from 'vitest';
import { peakDemandEqualsGeneration } from '@/lib/data/grid/peak-served';

describe('peakDemandEqualsGeneration', () => {
  it('is true for PGCB 14 Nov 2026: 13,564.41 both, at 18:30', () => {
    expect(peakDemandEqualsGeneration({ eveningPeakDemand: 13564.41, eveningPeakGen: 13564.41, peakTimes: { eveningPeakDemand: '18:30', eveningPeakGen: '18:30' } })).toBe(true);
  });
  it('is false when they differ (8 Nov: 15,184.14 vs 15,047.14)', () => {
    expect(peakDemandEqualsGeneration({ eveningPeakDemand: 15184.14, eveningPeakGen: 15047.14, peakTimes: { eveningPeakDemand: '18:00', eveningPeakGen: '18:00' } })).toBe(false);
  });
  it('is false when the instants differ or demand is unpublished', () => {
    expect(peakDemandEqualsGeneration({ eveningPeakDemand: 14000, eveningPeakGen: 14000, peakTimes: { eveningPeakDemand: '19:30', eveningPeakGen: '21:00' } })).toBe(false);
    expect(peakDemandEqualsGeneration({ eveningPeakDemand: null, eveningPeakGen: 14000, peakTimes: {} })).toBe(false);
  });
});
