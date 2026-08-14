import { describe, expect, it } from 'vitest';

import {
  CATEGORICAL_SLOTS,
  FUEL_COLORS,
  FUEL_DISPLAY_ORDER,
  STATUS_COLORS,
  categoricalSlot,
  isKnownFuel,
  resolveFuelColor,
} from '@/lib/data/grid/chart-palette';
import {
  OPTIONAL_GENERATION_FUELS,
  REQUIRED_GENERATION_FUELS,
  GENERATION_FUEL_ALIASES,
} from '@/lib/data/grid/types';

/**
 * These guard the two things that actually broke before the palette was
 * centralised: a fuel quietly losing its colour when PGCB renamed it, and the
 * same fuel drawn in different colours in different places.
 */
describe('grid chart palette', () => {
  it('gives every fuel the completeness check requires a colour of its own', () => {
    for (const fuel of [...REQUIRED_GENERATION_FUELS, ...OPTIONAL_GENERATION_FUELS]) {
      expect(isKnownFuel(fuel), `${fuel} has no colour`).toBe(true);
    }
  });

  it('resolves every alias PGCB has published to the same colour as its canonical name', () => {
    for (const [canonical, aliases] of Object.entries(GENERATION_FUEL_ALIASES)) {
      for (const alias of aliases) {
        expect(resolveFuelColor(alias, 'light')).toBe(resolveFuelColor(canonical, 'light'));
        expect(resolveFuelColor(alias, 'dark')).toBe(resolveFuelColor(canonical, 'dark'));
      }
    }
  });

  it('covers the display order and the colour table with the same fuels', () => {
    expect([...FUEL_DISPLAY_ORDER].sort()).toEqual(Object.keys(FUEL_COLORS).sort());
  });

  it('gives each fuel a distinct colour in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const seen = new Map<string, string>();
      for (const fuel of FUEL_DISPLAY_ORDER) {
        const hex = resolveFuelColor(fuel, mode);
        expect(seen.has(hex), `${fuel} reuses ${seen.get(hex)}'s colour in ${mode}`).toBe(false);
        seen.set(hex, fuel);
      }
    }
  });

  it('never paints a data series in a reserved status colour', () => {
    const status = new Set(Object.values(STATUS_COLORS).map((c) => c.toLowerCase()));
    const series = [
      ...FUEL_DISPLAY_ORDER.flatMap((f) => [resolveFuelColor(f, 'light'), resolveFuelColor(f, 'dark')]),
      ...CATEGORICAL_SLOTS.flatMap((s) => [s.light, s.dark]),
    ];
    for (const hex of series) {
      expect(status.has(hex.toLowerCase()), `${hex} is a reserved status colour`).toBe(false);
    }
  });

  it('falls back to a neutral rather than an arbitrary hue for an unmet fuel', () => {
    // A new fuel in the archive should look obviously unstyled, not borrow the
    // identity of a fuel that is already on the chart.
    const fallback = resolveFuelColor('Nuclear', 'light');
    expect(isKnownFuel('Nuclear')).toBe(false);
    for (const fuel of FUEL_DISPLAY_ORDER) {
      expect(resolveFuelColor(fuel, 'light')).not.toBe(fallback);
    }
  });

  it('does not wrap categorical slots — a 9th series must fold, not reuse slot 1', () => {
    expect(categoricalSlot(0, 'light')).not.toBe(categoricalSlot(CATEGORICAL_SLOTS.length, 'light'));
  });
});
