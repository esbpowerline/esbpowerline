import { describe, expect, it } from 'vitest';
import { calculateBill } from '@/lib/tariff/calculate';
import { resolveApplicableTariff } from '@/lib/tariff/resolve';
import { COMPONENT_VERSIONS } from '@/lib/tariff/rules';
import type { ResolvedSchedule } from '@/lib/tariff/types';

/**
 * The outcome of the bounded Appendix-খ search, pinned.
 *
 * BERC Order 2026/22 Appendix-খ was NOT recovered from any authoritative route
 * — BERC, the Power Division, Powercell, BEPRC, DPDC, DESCO, NESCO, REB or a
 * BREB PBS. No blog, calculator or customer bill was consulted for the missing
 * semantics.
 *
 * What the search did establish is better than the appendix would have been:
 * **the tariff instruments delegate VAT away from themselves.** The 2020
 * instrument of the same class — "Terms, applicability and miscellaneous
 * charges/fees of the Retail Electricity Tariff, 2020", BERC memo …20.653,
 * declared an inseparable part of that tariff exactly as clause 3 of the 2026
 * notification declares Appendix-খ — says at clause 2 only that VAT applies "at
 * the rate determined from time to time by the government". Recovering
 * Appendix-খ would at best restate that delegation.
 *
 * These tests exist so that a future contributor who finds the appendix does
 * not quietly assume it settles VAT, and so nobody "fixes" an UNKNOWN by
 * defaulting it to 5% or to zero.
 */
const JUN_2026: ResolvedSchedule = resolveApplicableTariff({
  utility: 'BPDB',
  category: 'LT_A_RESIDENTIAL',
  meterType: 'POSTPAID',
  phase: 'SINGLE',
  billingPeriod: '2026-06',
})!;

describe('VAT stays UNKNOWN, and the rule set says why', () => {
  const bill = calculateBill({ kwh: 412, sanctionedLoadKw: 2 }, JUN_2026);
  const vat = bill.components.find((c) => c.kind === 'VAT')!;

  it('is UNKNOWN with no value — not 5%, not zero', () => {
    expect(vat.status).toBe('UNKNOWN');
    expect(vat.value).toBeNull();
  });

  it('names the delegation rather than merely saying "unverified"', () => {
    expect(vat.reason).toContain('DELEGATED');
    expect(vat.reason).toContain('determined from time to time by the government');
  });

  it('records that no tariff order can settle it', () => {
    const v = COMPONENT_VERSIONS.find((c) => c.id === 'berc2026-22-lta-vat')!;
    if (v.kind === 'ENERGY_SLAB' || v.kind === 'DEMAND_CHARGE') throw new Error('wrong kind');
    expect(v.wouldBeSettledBy).toContain('NBR');
    // The point of the whole search: chasing Appendix-kha further would not help.
    expect(v.wouldBeSettledBy).toContain('NOT BERC Order 2026/22 Appendix-kha');
  });
});

describe('the prompt-payment rebate stays UNKNOWN, and is probably a misread surcharge', () => {
  const bill = calculateBill({ kwh: 412, sanctionedLoadKw: 2 }, JUN_2026);
  const rebate = bill.components.find((c) => c.kind === 'REBATE')!;

  it('is UNKNOWN with no value', () => {
    expect(rebate.status).toBe('UNKNOWN');
    expect(rebate.value).toBeNull();
  });

  it('records the 5% LATE-PAYMENT surcharge that points the other way', () => {
    expect(rebate.reason).toContain('LATE-PAYMENT surcharge');
  });

  it('does not resolve absence-of-evidence into NOT_APPLICABLE', () => {
    // Absence from the 2020 instrument is a hint, not proof of absence from the
    // 2026 appendix that is not held. UNKNOWN is the honest state; a zero would
    // be a claim.
    expect(rebate.status).not.toBe('NOT_APPLICABLE');
    expect(rebate.reason).toContain('not a finding');
  });

  it('does not confuse it with the prepaid rebate, which IS documented', () => {
    // Clause 4 of the 3 June notification: 0.5% on the net bill excluding VAT,
    // for PREPAID meters. V1 encodes postpaid only, so it never applies here.
    expect(rebate.reason).toContain('0.5%');
    expect(rebate.reason).toContain('postpaid only');
  });
});

describe('meter rent is absent from the rule set, not declared inapplicable', () => {
  it('has no METER_RENT or SERVICE_CHARGE component at all', () => {
    // The 2024 gazette's Table-2 lists no recurring meter rent and forbids
    // charges outside itself; the 2020 terms instrument keeps one alive by
    // chaining to a 2017 order. Unresolved, and neither the 2017 order nor
    // Appendix-kha is held — so the component is absent rather than asserted
    // to be nil.
    expect(COMPONENT_VERSIONS.some((c) => c.kind === 'METER_RENT')).toBe(false);
    expect(COMPONENT_VERSIONS.some((c) => c.kind === 'SERVICE_CHARGE')).toBe(false);
  });
});

describe('the total remains null after the search', () => {
  it('is null for a fully specified residential input', () => {
    const bill = calculateBill({ kwh: 412, sanctionedLoadKw: 2 }, JUN_2026);
    expect(bill.total).toBeNull();
  });

  it('knownSubtotal still carries the verified components only', () => {
    const bill = calculateBill({ kwh: 412, sanctionedLoadKw: 2 }, JUN_2026);
    const calculated = bill.components.filter((c) => c.status === 'CALCULATED');
    expect(calculated.every((c) => c.kind === 'ENERGY_SLAB' || c.kind === 'DEMAND_CHARGE')).toBe(true);
    expect(bill.knownSubtotal).toBe(350912 + 8400);
  });

  it('would become a number the moment every component resolves, and not before', () => {
    // Guards the mechanism rather than the current answer: `total` is derived
    // from "nothing unresolved", so a future VAT instrument makes it a number
    // with no change to calculate.ts.
    const bill = calculateBill({ kwh: 412, sanctionedLoadKw: 2 }, JUN_2026);
    const unresolved = bill.components.filter((c) => c.status !== 'CALCULATED');
    expect(unresolved.map((c) => c.kind).sort()).toEqual(['REBATE', 'VAT']);
    expect(bill.total).toBeNull();
  });
});
