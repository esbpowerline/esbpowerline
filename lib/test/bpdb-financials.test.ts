import { describe, expect, it } from 'vitest';
import { BPDB_ANNUAL_ACCOUNTS } from '@/lib/data/bpdb-annual-accounts';
import { bpdbAuditedFinancials } from '@/lib/data/companies/bpdb';
import { petrobanglaAuditedFinancials } from '@/lib/data/macro/economics';
import { PETROBANGLA_STATEMENTS } from '@/lib/data/companies/petrobangla-financials';

/**
 * Macro Trends' BPDB revenue/cost/subsidy series, rebuilt 2026-10-04.
 *
 * It replaced an eleven-row hand-typed constant labelled "(indicative)" that
 * cited nothing, disagreed with the audits, and carried FY 24 and FY 26 --
 * two years BPDB has not published at all. Because `MacroTrendsTab` truncates
 * to the LAST n rows for an untiered reader, those two invented years were
 * precisely the ones every free visitor saw, under an "Audited Ledger" badge.
 *
 * The first test is the guard: a row that cannot name the report it came out
 * of must not exist, whatever else changes here.
 */
describe('BPDB annual financial series', () => {
  it('every row names the report it was read out of', () => {
    expect(bpdbAuditedFinancials.length).toBeGreaterThan(0);
    for (const row of bpdbAuditedFinancials) {
      expect(row.sourceFile, `${row.year} has no source file`).toBeTruthy();
      expect(row.sourceFile).toMatch(/BPDB Annual Report/);
    }
  });

  it('carries exactly the fiscal years BPDB filed, and no others', () => {
    expect(bpdbAuditedFinancials.map((d) => d.year)).toEqual(
      BPDB_ANNUAL_ACCOUNTS.map((a) => `FY ${a.fy}`),
    );
  });

  it('is exactly what BPDB printed, year by year', () => {
    for (const [i, a] of BPDB_ANNUAL_ACCOUNTS.entries()) {
      expect(bpdbAuditedFinancials[i].revenue).toBe(a.energySalesCrore ?? null);
      expect(bpdbAuditedFinancials[i].cost).toBe(a.totalOperatingExpensesCrore);
      expect(bpdbAuditedFinancials[i].subsidy).toBe(a.subsidyCrore ?? null);
    }
  });

  it('leaves the loss blank rather than treating an unfiled subsidy as zero', () => {
    // FY 2016-17 printed no subsidy. A loss computed without it would be wrong
    // by the whole transfer, so the row reaches across to nothing instead.
    const first = bpdbAuditedFinancials.find((d) => d.year === 'FY 2016-17');
    expect(first?.subsidy).toBeNull();
    expect(first?.loss).toBeNull();

    for (const row of bpdbAuditedFinancials) {
      if (row.revenue == null || row.subsidy == null) expect(row.loss).toBeNull();
      else expect(row.loss).toBeCloseTo(row.revenue + row.subsidy - row.cost, 2);
    }
  });

  it('does not carry the invented FY 24 / FY 26 rows, or their figures', () => {
    const years = bpdbAuditedFinancials.map((d) => d.year);
    expect(years).not.toContain('FY 24');
    expect(years).not.toContain('FY 26');
    const all = bpdbAuditedFinancials.flatMap((d) => [d.revenue, d.cost, d.subsidy, d.loss]);
    // the old hand-typed FY 23 row, which disagreed with the audited report
    expect(all).not.toContain(50900);
    expect(all).not.toContain(98600);
    expect(all).not.toContain(39500);
    // the two unpublished years
    expect(all).not.toContain(110800);
    expect(all).not.toContain(121500);
  });

  it('comes out positive in three years, which no label may contradict', () => {
    // The old hand-typed series showed a deficit in every year, and that was an
    // artefact of invented numbers. On BPDB's own figures the operating balance
    // after subsidy is POSITIVE in FY 2018-19, 2019-20 and 2020-21. Anything
    // that renders this as a loss, by wording or by colour, is wrong.
    const positive = bpdbAuditedFinancials.filter((d) => d.loss != null && d.loss > 0);
    expect(positive.map((d) => d.year)).toEqual(['FY 2018-19', 'FY 2019-20', 'FY 2020-21']);
    expect(bpdbAuditedFinancials.find((d) => d.year === 'FY 2022-23')?.loss).toBeCloseTo(-4993.08, 2);
  });

  it('does not silently close the hole BPDB left at FY 2021-22', () => {
    expect(bpdbAuditedFinancials.map((d) => d.year)).not.toContain('FY 2021-22');
    const fy2021 = bpdbAuditedFinancials.find((d) => d.year === 'FY 2020-21');
    const fy2023 = bpdbAuditedFinancials.find((d) => d.year === 'FY 2022-23');
    expect(fy2021?.cost).toBe(50434.96);
    expect(fy2023?.cost).toBe(95386.28);
  });
});

/**
 * Petrobangla's series, cut from twelve rows to two on 2026-10-04. Same defect
 * as BPDB's and found the same day: hand-typed, citing nothing, and running to
 * fiscal years Petrobangla has never published.
 */
describe('Petrobangla annual financial series', () => {
  it('holds only the two years that are corroborated across both modules', () => {
    expect(petrobanglaAuditedFinancials.map((d) => d.year)).toEqual(['FY 17', 'FY 18']);
    expect(petrobanglaAuditedFinancials.map((d) => d.revenue)).toEqual(
      PETROBANGLA_STATEMENTS.map((s) => s.revenueCrore),
    );
  });

  it('no longer carries the unpublished years or the placeholder rows', () => {
    const years = petrobanglaAuditedFinancials.map((d) => d.year);
    for (const gone of ['FY 10', 'FY 12', 'FY 14', 'FY 16', 'FY 20', 'FY 21', 'FY 22', 'FY 23', 'FY 24', 'FY 26']) {
      expect(years).not.toContain(gone);
    }
    // every pre-FY 17 row carried lngCost: 0 as a placeholder, not a measurement
    expect(petrobanglaAuditedFinancials.every((d) => d.lngCost > 0)).toBe(true);
  });

  it('keeps netProfit as filed rather than reconciling it to the other columns', () => {
    // revenue - lngCost is -2009 for FY 17; Petrobangla states -1874. The two are
    // different quantities and the gap is disclosed, never closed.
    for (const d of petrobanglaAuditedFinancials) {
      expect(d.netProfit).not.toBe(d.revenue - d.lngCost);
    }
  });
});
