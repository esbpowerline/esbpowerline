import { describe, expect, it } from 'vitest';
import { BPDB_ANNUAL_ACCOUNTS } from '@/lib/data/bpdb-annual-accounts';
import { BERC_BULK_RANGE, LATEST_BPDB_AUDIT, macroTariffData } from '@/lib/data/macro/tariff';
import { macroEconomicData } from '@/lib/data/macro/economics';

/**
 * Macro Trends' tariff-vs-cost series, rebuilt 2026-09-30 from BPDB's audited
 * annual reports. It replaced a hand-typed 2010-2026 series that cited nothing,
 * disagreed with the audits, and ended on BERC's one-day 8.39.
 */
describe('Macro Trends tariff series', () => {
  it('is exactly what BPDB printed, year by year', () => {
    expect(macroTariffData.map((d) => d.year)).toEqual(BPDB_ANNUAL_ACCOUNTS.map((y) => `FY ${y.fy}`));
    for (const [i, y] of BPDB_ANNUAL_ACCOUNTS.entries()) {
      expect(macroTariffData[i].cost).toBe(y.published.bulkSupplyCostPerUnit?.value ?? null);
      expect(macroTariffData[i].tariff).toBe(y.published.bulkTariffPerUnit?.value ?? null);
    }
  });

  it('leaves the tariff blank where BPDB printed none, rather than deriving it', () => {
    // Sales over units gives 6.02 for FY 2022-23; BPDB prints 5.94.
    expect(macroTariffData.find((d) => d.year === 'FY 2022-23')?.tariff).toBe(5.94);
    expect(macroTariffData.filter((d) => d.tariff != null)).toHaveLength(1);
  });

  it('no longer carries the superseded 3 June 2026 figures', () => {
    const all = macroTariffData.flatMap((d) => [d.cost, d.tariff]);
    expect(all).not.toContain(8.39);
    expect(all).not.toContain(12.91);
  });

  it('quotes the latest audited year and the Appendix-ka range to the order\'s digits', () => {
    expect(LATEST_BPDB_AUDIT).toMatchObject({ fy: '2022-23', cost: 11.52, tariff: 5.94, subsidyCrore: 39534.95 });
    expect(BERC_BULK_RANGE).toBe('7.1530–10.0950');
  });

  it('drops the Kerosene and Petrol history, which was filled in rather than read', () => {
    for (const row of macroEconomicData) {
      expect(row).not.toHaveProperty('retailKerosene');
      expect(row).not.toHaveProperty('retailPetrol');
    }
  });
});
