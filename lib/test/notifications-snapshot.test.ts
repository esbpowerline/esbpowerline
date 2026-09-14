import { describe, expect, it, vi } from 'vitest';
import type { GridHourlyObservation } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({ default: {} }));

import { readGeneration } from '@/lib/notifications/grid/snapshot';

const d = (n: number | null) => (n === null ? null : { toNumber: () => n });

function row(fields: Record<string, number | string | null>): GridHourlyObservation {
  const { excluded = null, ...nums } = fields;
  const base: Record<string, unknown> = {
    totalMw: null, gasMw: null, liquidMw: null, coalMw: null, hydroMw: null, solarMw: null, windMw: null,
    bheramaraMw: null, tripuraMw: null, adaniMw: null, nepalMw: null, excluded,
  };
  for (const [k, v] of Object.entries(nums)) base[k] = typeof v === 'number' ? d(v) : null;
  return base as unknown as GridHourlyObservation;
}

describe('reading one generation hour', () => {
  it('a total that equals its parts is consistent, and imports are their sum', () => {
    const g = readGeneration(row({ totalMw: 1000, gasMw: 500, coalMw: 300, bheramaraMw: 150, adaniMw: 50 }));
    expect(g).toEqual({ generationMw: 1000, generationState: 'consistent', componentSumMw: 1000, importsMw: 200 });
  });

  it('a total off by a slip’s margin is inconsistent — shown as filed', () => {
    expect(readGeneration(row({ totalMw: 1050, gasMw: 1000 })).generationState).toBe('inconsistent');
  });

  it('a total more than 10% from its parts is unusable', () => {
    expect(readGeneration(row({ totalMw: 1500, gasMw: 1000 })).generationState).toBe('unusable');
  });

  it('a row the archive already set aside is unusable whatever its parts say', () => {
    expect(readGeneration(row({ totalMw: 1000, gasMw: 1000, excluded: 'TOTAL_DISAGREES_WITH_COMPONENTS' })).generationState).toBe('unusable');
  });

  it('no total is absent — null, never zero', () => {
    expect(readGeneration(row({ gasMw: 500 }))).toMatchObject({ generationMw: null, generationState: 'absent' });
    expect(readGeneration(null).generationMw).toBeNull();
  });

  it('no interconnector reported means imports are unknown, not zero', () => {
    expect(readGeneration(row({ totalMw: 500, gasMw: 500 })).importsMw).toBeNull();
  });
});
