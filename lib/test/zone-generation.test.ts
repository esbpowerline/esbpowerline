import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { isKnownFuel, canonicalFuelName, FUEL_DISPLAY_ORDER } from '@/lib/data/grid/chart-palette';
import type { GridDailyData } from '@/lib/data/grid/types';

/**
 * Guards the two P1 elements the parser used to read past: the zone x fuel
 * generation matrix and the Power Supply Scenario timestamps.
 *
 * These assert against the published archive rather than a fixture, because the
 * failure they exist to catch is a parser change that writes plausible-looking
 * numbers — a unit misread, a column shift, a fuel folded into its neighbour.
 * A fixture would keep passing through all of those.
 *
 * Only the most recent slice is read. The archive is ~4,500 files and parsing
 * all of them would cost more than the check is worth; the newest days are the
 * ones a parser change lands on first.
 */
const DAILY_DIR = path.resolve(__dirname, '../../public/data/daily');
const WINDOW = 60;

const ZONES = [
  'Dhaka', 'Chattogram', 'Cumilla', 'Mymensingh', 'Sylhet',
  'Khulna', 'Barishal', 'Rajshahi', 'Rangpur',
];

type Day = { date: string; data: GridDailyData };

function recentDays(): Day[] {
  const files = readdirSync(DAILY_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .slice(-WINDOW);
  return files.map((f) => ({
    date: f.replace('.json', ''),
    data: JSON.parse(readFileSync(path.join(DAILY_DIR, f), 'utf8')) as GridDailyData,
  }));
}

const days = recentDays();
const withZoneGen = days.filter((d) => (d.data.zoneGenerationData?.length ?? 0) > 0);
const withPeakTimes = days.filter((d) => d.data.systemStats.peakTimes !== undefined);

describe('zone-wise generation (P1)', () => {
  it('is present on recent days', () => {
    // Absence here means the parser stopped emitting it, not that PGCB stopped
    // printing it — every modern layout carries this table.
    expect(withZoneGen.length).toBeGreaterThan(0);
  });

  it('carries all nine zones, named as the demand table names them', () => {
    for (const { date, data } of withZoneGen) {
      const names = data.zoneGenerationData!.map((z) => z.zone);
      expect(names, date).toEqual(ZONES);
    }
  });

  it('reconciles each zone row against its own published total', () => {
    for (const { date, data } of withZoneGen) {
      for (const zone of data.zoneGenerationData!) {
        const summed = Object.values(zone.fuels).reduce((a, b) => a + b, 0);
        // Tolerance is rounding-scale, not a fudge: the parser stores six
        // decimals, so anything above this is a real disagreement.
        expect(Math.abs(summed - zone.total), `${date} ${zone.zone}`).toBeLessThan(0.01);
      }
    }
  });

  it('reconciles the nine zones against national generation', () => {
    for (const { date, data } of withZoneGen) {
      const national = data.systemStats.totalEnergyGen;
      if (national === null) continue;
      const summed = data.zoneGenerationData!.reduce((a, z) => a + z.total, 0);
      expect(Math.abs(summed - national), date).toBeLessThan(0.01);
    }
  });

  it('names only fuels the palette can colour and order', () => {
    const order = FUEL_DISPLAY_ORDER as readonly string[];
    for (const { date, data } of withZoneGen) {
      for (const zone of data.zoneGenerationData!) {
        for (const fuel of Object.keys(zone.fuels)) {
          // An unknown fuel would render grey and sort to the end of the row —
          // visible, but only if someone looks. Fail instead.
          expect(isKnownFuel(fuel), `${date} ${zone.zone} ${fuel}`).toBe(true);
          expect(order, `${date} ${fuel}`).toContain(canonicalFuelName(fuel));
        }
      }
    }
  });

  it('is stated in MKWh, not the raw kWh the header can imply', () => {
    // The 2024-12-31..2025-01-22 regression published a Total row a thousand
    // times too large by taking the caption's unit for granted. A zone total
    // above this could only be that mistake: national generation is ~360 MKWh.
    for (const { date, data } of withZoneGen) {
      for (const zone of data.zoneGenerationData!) {
        expect(zone.total, `${date} ${zone.zone}`).toBeLessThan(1000);
      }
    }
  });
});

describe('power supply scenario timestamps (P1)', () => {
  it('is present on recent days', () => {
    expect(withPeakTimes.length).toBeGreaterThan(0);
  });

  it('stamps every time as a real 24-hour clock reading', () => {
    for (const { date, data } of withPeakTimes) {
      for (const [key, stamp] of Object.entries(data.systemStats.peakTimes!)) {
        expect(stamp, `${date} ${key}`).toMatch(/^\d{2}:\d{2}$/);
        const [hour, minute] = stamp.split(':').map(Number);
        // PGCB writes the end of day as 24:00, so the hour is inclusive there.
        expect(hour, `${date} ${key}`).toBeLessThanOrEqual(24);
        expect(minute, `${date} ${key}`).toBeLessThan(60);
      }
    }
  });

  it('never invents a stamp for a figure the sheet leaves unstamped', () => {
    // The stamp is read from cells to the right of the value, so a scan that
    // ran too far would pick up the neighbouring block's time. Only these six
    // figures carry one.
    const allowed = new Set([
      'dayPeakGen', 'dayPeakDemand', 'eveningPeakGen',
      'eveningPeakDemand', 'minGen', 'maxGen',
    ]);
    for (const { date, data } of withPeakTimes) {
      for (const key of Object.keys(data.systemStats.peakTimes!)) {
        expect(allowed.has(key), `${date} ${key}`).toBe(true);
      }
    }
  });
});
