import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  CATEGORICAL_SLOTS,
  SERIES_GROUPS,
  seriesSlotIndex,
  resolveFuelColor,
  FUEL_DISPLAY_ORDER,
  type SeriesName,
} from '@/lib/data/grid/chart-palette';

const ROOT = path.join(process.cwd(), 'components', 'news', 'power-grid');

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/**
 * `chart-palette.ts` opens by calling itself "the one place a chart colour is
 * decided". Eleven components in this directory carried 155 raw hex literals
 * that had never been through its CVD or contrast validation — including
 * `#06b6d4` for Hydro, which is the exact value the palette file documents as
 * 6.4 ΔE from Gas: two cyans a colour-blind reader cannot separate, on the
 * first and fourth largest fuels.
 *
 * This test is the reason that cannot come back quietly.
 */
describe('chart colour discipline', () => {
  it('no Grid Explorer component decides a colour for itself', () => {
    const offenders: string[] = [];

    for (const file of tsxFiles(ROOT)) {
      const source = readFileSync(file, 'utf8');
      // Split on either ending: these files are CRLF, and a trailing \r is a
      // line terminator to the regex engine, so `.*$` would never reach it and
      // every comment line would read as code.
      source.split(/\r?\n/).forEach((line, i) => {
        // Prose may name a hex — the palette's own reasoning is quoted in
        // several of these files and should stay quoted.
        const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
        const found = code.match(/#[0-9a-fA-F]{6}\b/);
        if (found) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}  ${found[0]}`);
        }
      });
    }

    expect(offenders, `route these through chart-palette.ts:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('series drawn in the same frame never share a slot', () => {
    // Distinctness only has to hold within a chart, which is why slots repeat
    // across charts. This is the invariant that makes the reuse safe.
    for (const [group, names] of Object.entries(SERIES_GROUPS)) {
      const slots = names.map((n) => seriesSlotIndex(n as SeriesName));
      expect(new Set(slots).size, `${group} reuses a slot: ${slots.join(', ')}`).toBe(slots.length);
    }
  });

  it('every named series resolves to a validated slot', () => {
    for (const names of Object.values(SERIES_GROUPS)) {
      for (const name of names) {
        const idx = seriesSlotIndex(name as SeriesName);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(CATEGORICAL_SLOTS.length);
      }
    }
  });

  it('keeps Gas and Hydro apart — the pair the palette was written about', () => {
    expect(resolveFuelColor('Hydro')).not.toBe(resolveFuelColor('Gas'));
    // And the discarded value never reappears.
    expect(resolveFuelColor('Hydro')).not.toBe('#06b6d4');
  });

  it('gives every published fuel a colour, under either PGCB spelling', () => {
    for (const fuel of FUEL_DISPLAY_ORDER) {
      expect(resolveFuelColor(fuel), fuel).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(resolveFuelColor('HSD')).toBe(resolveFuelColor('HSD (Diesel)'));
    expect(resolveFuelColor('Furnace Oil')).toBe(resolveFuelColor('HFO'));
  });
});
