import { describe, it, expect } from 'vitest';
import { FIXED_METRICS, countOf, type DayContext } from '@/lib/data/grid/comparison';

/**
 * The rules that stop the comparison inventing figures.
 *
 * Every case here is taken from a record that is really in the archive, because
 * each of these was a live defect found by reading 4,534 days rather than by
 * reading the code:
 *
 *   - 2018-01-15 stores `avgProductionCost: 0` beside `totalDailyCost:
 *     246033559`. The record contradicts itself, so the zero is a blank.
 *   - 2014-07-28 stores both cost fields as 0 on a day that generated 120.25
 *     million kWh. The grid does not run for free.
 *   - 2016-09-01 lists six zones and 2014-12-02 lists one, against 3,855 days
 *     that list nine. Their load-shedding totals are not the same measurement.
 *   - `dailyOutages: []` on four days, three of them visibly thin parses.
 *   - "HSD (Diesel)" on 2,495 days and "HSD" on 348, never both on one day.
 */

const metric = (id: string) => {
  const m = FIXED_METRICS.find((x) => x.id === id);
  if (!m) throw new Error(`no metric ${id}`);
  return m;
};

/** A day carrying only what a given test needs. */
function ctx(day: Record<string, unknown>): DayContext {
  return {
    iso: '2026-01-01',
    day: { systemStats: {}, ...day } as never,
    gasArchive: null,
    stations: null,
  };
}

describe('zeros that cannot be measurements', () => {
  it('reads a zero production cost as unpublished, not as free electricity', () => {
    // 2018-01-15, with its real total alongside.
    const day = ctx({ systemStats: { avgProductionCost: 0, totalDailyCost: 246_033_559 } });
    expect(metric('system.avgProductionCost').value(day)).toBeNull();
    // The total IS real on that day and must survive.
    expect(metric('system.totalDailyCost').value(day)).toBeCloseTo(24.6033559, 6);
  });

  it('reads a zero total cost as unpublished', () => {
    // 2014-07-28: 120.25 million kWh generated, both cost fields zero.
    const day = ctx({
      systemStats: { avgProductionCost: 0, totalDailyCost: 0, totalEnergyGen: 120.252566 },
    });
    expect(metric('system.totalDailyCost').value(day)).toBeNull();
    expect(metric('system.avgProductionCost').value(day)).toBeNull();
    expect(metric('system.totalEnergyGen').value(day)).toBe(120.252566);
  });

  it('applies the same rule to peaks, energy and gas to power', () => {
    const zeroed = ctx({
      systemStats: {
        eveningPeakDemand: 0,
        eveningPeakGen: 0,
        dayPeakGen: 0,
        maxGen: 0,
        minGen: 0,
        totalEnergyGen: 0,
        totalGasSuppliedPower: 0,
      },
    });
    for (const id of [
      'system.eveningPeakDemand',
      'system.eveningPeakGen',
      'system.dayPeakGen',
      'system.maxGen',
      'system.minGen',
      'system.totalEnergyGen',
      'gas.toPower',
    ]) {
      expect(metric(id).value(zeroed), id).toBeNull();
    }
  });

  it('keeps a genuine zero where zero is a real outcome', () => {
    // A day with nothing unserved is a good day, and the archive says so.
    expect(metric('system.totalEnergyUnserved').value(ctx({ systemStats: { totalEnergyUnserved: 0 } }))).toBe(0);
    // The monthly reports carry 206 true zeroes for wind and solar in years
    // when the country had neither; shedding behaves the same way.
    const noShedding = ctx({
      regionalDemandData: [
        { zone: 'Dhaka', loadShed: 0, demand: 6000 },
        { zone: 'Khulna', loadShed: 0, demand: 2000 },
      ],
    });
    expect(metric('shedding.total').value(noShedding)).toBe(0);
  });
});

describe('totals carry the set they were summed over', () => {
  const nine = ctx({
    regionalDemandData: Array.from({ length: 9 }, (_, i) => ({ zone: `Z${i}`, loadShed: 100 })),
  });
  const six = ctx({
    regionalDemandData: Array.from({ length: 6 }, (_, i) => ({ zone: `Z${i}`, loadShed: 100 })),
  });

  it('counts the zones behind a shedding total', () => {
    const m = metric('shedding.total');
    expect(m.basis, 'shedding.total must declare a basis').toBeTypeOf('function');
    expect(m.basis!(nine)).toBe(9);
    expect(m.basis!(six)).toBe(6);
    expect(m.basisNoun).toBe('zones');
  });

  it('publishes the zone count as a figure of its own', () => {
    expect(metric('shedding.zonesReporting').value(nine)).toBe(9);
    expect(metric('shedding.zonesReporting').value(six)).toBe(6);
    // No regional table at all is unknown, not "zero zones reporting".
    expect(metric('shedding.zonesReporting').value(ctx({ regionalDemandData: [] }))).toBeNull();
  });

  it('leaves a total null when nothing was published to sum', () => {
    expect(metric('shedding.total').value(ctx({ regionalDemandData: [] }))).toBeNull();
    expect(metric('shedding.total').value(ctx({}))).toBeNull();
  });

  it('declares a basis on every metric that sums or maxes over a row set', () => {
    // A guard against the next total added without one.
    for (const id of [
      'shedding.total',
      'shedding.peakHour',
      'shedding.hoursAffected',
      'gas.offtakePower',
      'gas.offtakeFertilizer',
      'gas.offtakeOthers',
    ]) {
      expect(metric(id).basis, `${id} sums or maxes over rows and needs a basis`).toBeTypeOf('function');
    }
  });

  it('does not claim a row basis for the gas figures that come from a printed total', () => {
    // gas.total / domestic / lng fall back to the Petrobangla report's own
    // grand total when the grid file's summary is blank. That is a published
    // figure, not a sum of the six summary rows, so counting those rows would
    // describe something the number is not.
    for (const id of ['gas.total', 'gas.domestic', 'gas.lng']) {
      expect(metric(id).basis, id).toBeUndefined();
    }
  });
});

describe('an empty list is not a count of zero', () => {
  it('withholds the outage count when no outage rows were parsed', () => {
    expect(metric('outages.count').value(ctx({ dailyOutages: [] }))).toBeNull();
    expect(metric('outages.count').value(ctx({}))).toBeNull();
  });

  it('reports a real count', () => {
    expect(metric('outages.count').value(ctx({ dailyOutages: [{}, {}, {}] }))).toBe(3);
  });
});

describe('gas totals', () => {
  it('reads the archive’s all-zero gas table as unpublished, not as a collapse', () => {
    const zeroed = ctx({
      gasProductionData: Array.from({ length: 6 }, (_, i) => ({ company: `C${i}`, gas: 0 })),
    });
    expect(metric('gas.total').value(zeroed)).toBeNull();
    expect(metric('gas.domestic').value(zeroed)).toBeNull();
    expect(metric('gas.lng').value(zeroed)).toBeNull();
  });

  it('splits LNG out of the total', () => {
    const day = ctx({
      gasProductionData: [
        { company: 'BAPEX', gas: 1000 },
        { company: 'RPGCL (LNG)', gas: 500 },
      ],
    });
    expect(metric('gas.total').value(day)).toBe(1500);
    expect(metric('gas.lng').value(day)).toBe(500);
    expect(metric('gas.domestic').value(day)).toBe(1000);
  });
});

describe('countOf', () => {
  it('agrees with itself about number', () => {
    expect(countOf(1, 'zones')).toBe('1 zone');
    expect(countOf(9, 'zones')).toBe('9 zones');
    expect(countOf(1, 'companies')).toBe('1 company');
    expect(countOf(6, 'companies')).toBe('6 companies');
    expect(countOf(0, 'hours')).toBe('0 hours');
  });
});
