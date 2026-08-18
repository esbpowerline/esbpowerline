import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/** The witness file is data, so its shape and coverage are worth asserting. */
const file = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/grid-verification/unit-cost.json'), 'utf8'),
);

describe('unit-cost witness file', () => {
  it('declares its coverage cutoff and it matches the data', () => {
    const maxDay = Object.keys(file.days).reduce((a, b) => (a > b ? a : b), '');
    expect(file.witness_coverage_through).toBe(maxDay);
  });

  it('no longer claims Hydro is flat on all but one day of 2026', () => {
    expect(file.administered_note).not.toMatch(/all but one/);
    expect(file.administered_note).toMatch(/3\.8100/);
  });

  it('names Hydro and Wind as the administered fuels', () => {
    expect(file.administered_fuels.sort()).toEqual(['Hydro', 'Wind']);
  });
});
