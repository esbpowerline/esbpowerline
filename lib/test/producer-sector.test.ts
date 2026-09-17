import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { countBySector, producerSector } from '@/lib/data/grid/producer-sector';

/**
 * The Stations Listed briefing splits the fleet by ownership, read off the
 * producer code PGCB prints on each row. The split is only honest if every code
 * PGCB actually uses lands somewhere deliberate, so the test reads the codes out
 * of the published archive rather than from a list someone typed.
 */

const PLANTS = path.join(process.cwd(), 'public', 'data', 'plants');

describe('producer sector', () => {
  it('reads the spellings PGCB has used for the same producer', () => {
    expect(producerSector('SIPP, REB')).toBe('private');
    expect(producerSector('SIPP,REB')).toBe('private');
    expect(producerSector('SBU, PDB')).toBe('government');
    expect(producerSector('(IPP)')).toBe('private');
    expect(producerSector('Imported power')).toBe('import');
    expect(producerSector('Imported Power')).toBe('import');
  });

  it('keeps joint ventures out of both sides', () => {
    for (const code of ['BCPCL', 'RNPL', 'SNWPGCL', 'NTPC&BPDB']) {
      expect(producerSector(code)).toBe('joint-venture');
    }
  });

  it('never guesses: a blank or stray producer cell is unclassified', () => {
    expect(producerSector('')).toBe('unclassified');
    expect(producerSector('100')).toBe('unclassified');
    expect(producerSector(undefined)).toBe('unclassified');
  });

  it('counts every station exactly once', () => {
    const counts = countBySector(['PDB', 'IPP', 'IPP', 'BCPCL', 'Import', '']);
    expect(counts.reduce((s, c) => s + c.count, 0)).toBe(6);
    expect(Object.fromEntries(counts.map((c) => [c.sector, c.count]))).toEqual({
      government: 1,
      private: 2,
      'joint-venture': 1,
      import: 1,
      unclassified: 1,
    });
  });

  it('classifies every producer code on the published 2025-26 days', () => {
    // The tab's current era. Pre-2025 sheets carry blank and stray producer
    // cells, which are unclassified on purpose; these must all be placed.
    const unknown = new Set<string>();
    for (const file of readdirSync(PLANTS).filter((f) => /^202[56]-\d{2}-\d{2}\.json$/.test(f))) {
      const day = JSON.parse(readFileSync(path.join(PLANTS, file), 'utf8')) as { plants?: { producer: string }[] };
      for (const p of day.plants ?? []) {
        if (producerSector(p.producer) === 'unclassified') unknown.add(p.producer);
      }
    }
    expect([...unknown]).toEqual([]);
  });
});
