import { describe, expect, it } from 'vitest';
import { generationRowIntegrity, reportedPartsMw } from '@/lib/data/grid/live-row-integrity';

const row = (totalMw: number, parts: Partial<Record<'gas' | 'liquid' | 'coal' | 'hydro' | 'solar' | 'wind' | 'imports', number | null>>) => ({
  totalMw,
  byFuel: {
    gasMw: parts.gas ?? null,
    liquidMw: parts.liquid ?? null,
    coalMw: parts.coal ?? null,
    hydroMw: parts.hydro ?? null,
    solarMw: parts.solar ?? null,
    windMw: parts.wind ?? null,
  },
  imports: { totalMw: parts.imports ?? null },
});

// NLDC's 2026-09-13 11:00 row, exactly as its generation page printed it.
const elevenOClock = row(14854, { gas: 5028, liquid: 1924, coal: 5155, hydro: 212, solar: 443, wind: 0, imports: 1822 });

describe('generationRowIntegrity', () => {
  it('passes a row whose parts equal its total', () => {
    const noon = row(14469, { gas: 4891, liquid: 2054, coal: 4814, hydro: 212, solar: 685, wind: 0, imports: 1813 });
    expect(generationRowIntegrity({ latest: noon, reconciles: true })).toEqual({ state: 'consistent' });
  });

  it('shows NLDC\'s 11:00 row as filed and flags its 270 MW gap', () => {
    expect(reportedPartsMw(elevenOClock)).toBe(14584);
    expect(generationRowIntegrity({ latest: elevenOClock, reconciles: false })).toEqual({
      state: 'inconsistent',
      totalMw: 14854,
      partsMw: 14584,
      gapMw: 270,
    });
  });

  it('still shows the worst genuine slip on record (1,000 MW, 7.4%) as filed', () => {
    const slip = row(13592, { gas: 5000, coal: 4592, liquid: 1500, hydro: 200, imports: 1300 });
    expect(generationRowIntegrity({ latest: slip, reconciles: false }).state).toBe('inconsistent');
  });

  it('withholds a row too far from its own total to be read as published', () => {
    // A whole fuel read into the wrong slot: gas missing from the parts.
    const misread = row(14854, { liquid: 1924, coal: 5155, hydro: 212, solar: 443, wind: 0, imports: 1822 });
    expect(generationRowIntegrity({ latest: misread, reconciles: false }).state).toBe('unusable');
  });

  it('withholds a row that reported no parts at all', () => {
    expect(generationRowIntegrity({ latest: row(14854, {}), reconciles: false }).state).toBe('unusable');
  });

  it("prefers the server's component sum when it sent one", () => {
    expect(generationRowIntegrity({ latest: elevenOClock, reconciles: false, componentSumMw: 14584 })).toMatchObject({
      state: 'inconsistent',
      gapMw: 270,
    });
  });
});
