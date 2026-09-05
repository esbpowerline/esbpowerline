import { describe, expect, it } from 'vitest';
import { calculateBill, computeEnergyCharge, InvalidBillInputError } from '@/lib/tariff/calculate';
import { compareEnergyCharge } from '@/lib/tariff/compare';
import { attributeEnergyChargeChange } from '@/lib/tariff/attribute';
import { formatTaka, paisaTimesQuantity, paisaTimesUnits, percentChange, takaToPaisa } from '@/lib/tariff/money';
import { resolveApplicableTariff } from '@/lib/tariff/resolve';
import type { ResolvedSchedule } from '@/lib/tariff/types';

const BASE = {
  utility: 'BPDB',
  category: 'LT_A_RESIDENTIAL',
  meterType: 'POSTPAID',
  phase: 'SINGLE',
} as const;

const schedule = (billingPeriod: string, asOf?: string): ResolvedSchedule =>
  resolveApplicableTariff({ ...BASE, billingPeriod, asOf })!;

const JUN_2026 = schedule('2026-06');
const MAY_2026 = schedule('2026-05');
const JUN_2026_ON_3RD = schedule('2026-06', '2026-06-03');

const energy = (kwh: number, s: ResolvedSchedule) => computeEnergyCharge(kwh, s).total;

describe('money is integer paisa, never a float', () => {
  it('parses two-decimal rates without representation error', () => {
    expect(takaToPaisa(15.01)).toBe(1501);
    expect(takaToPaisa(9.62)).toBe(962);
    expect(takaToPaisa(4.63)).toBe(463);
  });

  it('formats to exactly two decimals', () => {
    expect(formatTaka(23150)).toBe('231.50');
    expect(formatTaka(5)).toBe('0.05');
    expect(formatTaka(-3676)).toBe('-36.76');
  });

  it('multiplies whole units exactly — the float trap does not exist here', () => {
    // 0.1 + 0.2 !== 0.3 is a curiosity elsewhere and a defect in a bill.
    expect(paisaTimesUnits(463, 51)).toBe(23613);
    expect(paisaTimesUnits(1501, 12)).toBe(18012);
  });

  it('rejects fractional units in exact multiplication', () => {
    expect(() => paisaTimesUnits(463, 1.5)).toThrow(RangeError);
  });

  it('rounds the fractional demand quantity half away from zero', () => {
    expect(paisaTimesQuantity(4200, 7.5)).toBe(31500);
    expect(paisaTimesQuantity(4200, 1)).toBe(4200);
    expect(paisaTimesQuantity(1, 0.5)).toBe(1);
    expect(paisaTimesQuantity(1, 0.4)).toBe(0);
  });

  it('refuses a percentage against a base of zero', () => {
    // The archive has published a fabricated "-100%" from exactly this.
    expect(percentChange(0, 500)).toBeNull();
    expect(percentChange(100, 150)).toBe(50);
  });
});

describe('the lifeline cliff — conditional, from footnote 3 of two instruments', () => {
  it('0 kWh charges no energy', () => {
    expect(energy(0, JUN_2026)).toBe(0);
  });

  it('1 kWh gets the lifeline rate', () => {
    expect(energy(1, JUN_2026)).toBe(463);
  });

  it('50 kWh — all consumption at the lifeline rate, Tk 231.50', () => {
    expect(energy(50, JUN_2026)).toBe(23150);
    expect(formatTaka(energy(50, JUN_2026))).toBe('231.50');
  });

  it('51 kWh — the lifeline is LOST ENTIRELY, Tk 268.26', () => {
    // Not 50 × 4.63 + 1 × 5.26 = 236.76, which is the telescopic misreading and
    // is 13.3% low. Footnote 3: no residential consumer other than a lifeline
    // consumer receives the benefit of the 0-50 rate.
    expect(energy(51, JUN_2026)).toBe(26826);
    expect(formatTaka(energy(51, JUN_2026))).toBe('268.26');
  });

  it('one extra unit past fifty costs Tk 36.76', () => {
    expect(energy(51, JUN_2026) - energy(50, JUN_2026)).toBe(3676);
  });

  it('the telescopic misreading is explicitly NOT what the engine does', () => {
    const wrong = 50 * 463 + 1 * 526;
    expect(energy(51, JUN_2026)).not.toBe(wrong);
    expect(energy(51, JUN_2026)).toBeGreaterThan(wrong);
  });

  it('75 kWh — the whole first step, Tk 394.50', () => {
    expect(energy(75, JUN_2026)).toBe(39450);
  });

  it('76 kWh — the second step begins telescopically, Tk 403.00', () => {
    expect(energy(76, JUN_2026)).toBe(40300);
    expect(energy(76, JUN_2026) - energy(75, JUN_2026)).toBe(850);
  });

  it('the cliff is in the previous tariff too — it is not a 2026 invention', () => {
    expect(energy(50, MAY_2026)).toBe(23150);
    expect(energy(51, MAY_2026)).toBe(26826);
  });
});

describe('every remaining slab boundary', () => {
  const cases: Array<[number, number]> = [
    [200, 39450 + 125 * 850],
    [201, 39450 + 125 * 850 + 910],
    [300, 39450 + 125 * 850 + 100 * 910],
    [301, 39450 + 125 * 850 + 100 * 910 + 962],
    [400, 39450 + 125 * 850 + 100 * 910 + 100 * 962],
    [401, 39450 + 125 * 850 + 100 * 910 + 100 * 962 + 1501],
    [600, 39450 + 125 * 850 + 100 * 910 + 100 * 962 + 200 * 1501],
    [601, 39450 + 125 * 850 + 100 * 910 + 100 * 962 + 200 * 1501 + 1735],
  ];

  for (const [kwh, expected] of cases) {
    it(`${kwh} kWh under June 2026 = Tk ${formatTaka(expected)}`, () => {
      expect(energy(kwh, JUN_2026)).toBe(expected);
    });
  }

  it('the top band is open — 5,000 kWh does not overflow or clamp', () => {
    const at600 = energy(600, JUN_2026);
    expect(energy(5000, JUN_2026)).toBe(at600 + 4400 * 1735);
  });

  it('each boundary step charges exactly the next band rate', () => {
    expect(energy(201, JUN_2026) - energy(200, JUN_2026)).toBe(910);
    expect(energy(301, JUN_2026) - energy(300, JUN_2026)).toBe(962);
    expect(energy(401, JUN_2026) - energy(400, JUN_2026)).toBe(1501);
    expect(energy(601, JUN_2026) - energy(600, JUN_2026)).toBe(1735);
  });
});

describe('412 kWh — the brief’s own example, both versions', () => {
  it('under the previous tariff the energy charge is Tk 3,007.54', () => {
    expect(energy(412, MAY_2026)).toBe(300754);
  });

  it('under June 2026 it is Tk 3,509.12', () => {
    expect(energy(412, JUN_2026)).toBe(350912);
  });

  it('the 4 June order cut a 412-unit ENERGY CHARGE by exactly Tk 69.00', () => {
    /**
     * The 412-unit case was first claimed to be IDENTICAL across the amendment,
     * on the reasoning that only the two lowest steps moved. Wrong: only the
     * LIFELINE row is CATEGORICAL and therefore confined to bills of 50 units or
     * less. The first step (0–75) is TELESCOPIC, so it prices the first 75 units
     * of every residential bill however large.
     *
     * The correction then overstated itself in turn, and the schedule below is
     * why a single headline number should not have been trusted either time. The
     * defensible statement is exactly this:
     *
     *   For residential consumption above 75 kWh, the June 4 reconsideration
     *   reduced the ENERGY-CHARGE COMPONENT by exactly Tk 69 compared with the
     *   June 3 order, before any VAT, rebate or other applicable billing effects.
     *
     * Not "reduced every bill by Tk 69", and not "by more below 75 units" —
     * below 75 the reduction is SMALLER, and it is not a bill reduction at all
     * while `total` is null.
     */
    expect(energy(412, JUN_2026_ON_3RD)).toBe(357812);
    expect(energy(412, JUN_2026)).toBe(350912);
    expect(energy(412, JUN_2026_ON_3RD) - energy(412, JUN_2026)).toBe(75 * (618 - 526));
    expect(energy(412, JUN_2026_ON_3RD) - energy(412, JUN_2026)).toBe(6900);
  });

  it('above 75 units the energy-charge reduction is a flat Tk 69.00', () => {
    // Scoped to the energy charge. The first step is capped at 75 units, so the
    // saving stops growing there and every larger bill sees the same figure.
    for (const kwh of [76, 200, 412, 601, 5000]) {
      expect(energy(kwh, JUN_2026_ON_3RD) - energy(kwh, JUN_2026)).toBe(6900);
    }
  });

  it('below 75 units the reduction is SMALLER, and it is a schedule not a number', () => {
    /**
     * 1–50 kWh:  Tk 0.69 × units  — lifeline is categorical, 5.32 → 4.63
     * 51–75 kWh: Tk 0.92 × units  — lifeline lost, the first step reprices all units
     * above 75:  Tk 69.00 flat
     *
     * The 51-unit consumer is the counter-intuitive case: they save MORE than the
     * 50-unit consumer (46.92 against 34.50) despite the lifeline being withdrawn
     * from them, because the first step reprices all 51 units at a bigger
     * per-unit reduction.
     */
    const cut = (kwh: number) => energy(kwh, JUN_2026_ON_3RD) - energy(kwh, JUN_2026);

    expect(cut(1)).toBe(69);
    expect(cut(50)).toBe(3450);
    expect(cut(51)).toBe(4692);
    expect(cut(75)).toBe(6900);

    for (const kwh of [1, 10, 25, 50]) expect(cut(kwh)).toBe(69 * kwh);
    for (const kwh of [51, 60, 75]) expect(cut(kwh)).toBe(92 * kwh);

    // Smaller below 75, never larger — the claim this test was written to kill.
    for (const kwh of [1, 25, 50, 51, 74]) expect(cut(kwh)).toBeLessThan(6900);
  });

  it('but a 40-unit bill is not identical — 5.32 on the 3rd, 4.63 after', () => {
    expect(energy(40, JUN_2026_ON_3RD)).toBe(40 * 532);
    expect(energy(40, JUN_2026)).toBe(40 * 463);
  });

  it('at 75 units or less the June 2026 revision changed nothing at all', () => {
    for (const kwh of [1, 25, 50, 51, 75]) {
      expect(energy(kwh, JUN_2026)).toBe(energy(kwh, MAY_2026));
    }
  });
});

describe('the total is null while any component is unresolved', () => {
  const bill = calculateBill({ kwh: 412, sanctionedLoadKw: 2 }, JUN_2026);

  it('the energy slabs are CALCULATED', () => {
    const slabs = bill.components.filter((c) => c.kind === 'ENERGY_SLAB');
    expect(slabs).toHaveLength(5);
    expect(slabs.every((c) => c.status === 'CALCULATED')).toBe(true);
  });

  it('the demand charge is CALCULATED on sanctioned load in kW', () => {
    const d = bill.components.find((c) => c.kind === 'DEMAND_CHARGE')!;
    expect(d.status).toBe('CALCULATED');
    expect(d.value).toBe(8400);
    expect(d.working).toContain('2 kW sanctioned load');
  });

  it('VAT is UNKNOWN with a reason, not zero and not assumed at 5%', () => {
    const vat = bill.components.find((c) => c.kind === 'VAT')!;
    expect(vat.status).toBe('UNKNOWN');
    expect(vat.value).toBeNull();
    expect(vat.reason).toContain('not yet verified');
  });

  it('the prompt-payment rebate is UNKNOWN', () => {
    const r = bill.components.find((c) => c.kind === 'REBATE')!;
    expect(r.status).toBe('UNKNOWN');
    expect(r.value).toBeNull();
  });

  it('total is null', () => {
    expect(bill.total).toBeNull();
  });

  it('knownSubtotal carries what IS known and is not called a total', () => {
    expect(bill.knownSubtotal).toBe(350912 + 8400);
    expect(Object.keys(bill)).toContain('knownSubtotal');
    // A partial sum under a confident label is how a calculator starts
    // inventing bills. `total` stays null; the honest sum has its own name.
    expect(bill.total).not.toBe(bill.knownSubtotal);
  });

  it('warns once per unresolved component', () => {
    const codes = bill.warnings.map((w) => w.code);
    expect(codes.filter((c) => c === 'UNKNOWN_COMPONENT')).toHaveLength(2);
  });
});

describe('inputs the engine refuses or flags', () => {
  it('negative usage throws', () => {
    expect(() => calculateBill({ kwh: -1 }, JUN_2026)).toThrow(InvalidBillInputError);
  });

  it('fractional usage throws — no instrument answers the rounding question', () => {
    expect(() => calculateBill({ kwh: 50.5 }, JUN_2026)).toThrow(InvalidBillInputError);
  });

  it('a non-finite usage throws', () => {
    expect(() => calculateBill({ kwh: Number.NaN }, JUN_2026)).toThrow(InvalidBillInputError);
  });

  it('missing sanctioned load is INPUT_MISSING, never a demand charge of nil', () => {
    const bill = calculateBill({ kwh: 100 }, JUN_2026);
    const d = bill.components.find((c) => c.kind === 'DEMAND_CHARGE')!;
    expect(d.status).toBe('INPUT_MISSING');
    expect(d.value).toBeNull();
    expect(bill.total).toBeNull();
    expect(bill.warnings.map((w) => w.code)).toContain('INPUT_MISSING');
  });

  it('zero consumption is valid and still owes the demand charge', () => {
    const bill = calculateBill({ kwh: 0, sanctionedLoadKw: 2 }, JUN_2026);
    expect(bill.knownSubtotal).toBe(8400);
    expect(bill.components.find((c) => c.kind === 'DEMAND_CHARGE')!.value).toBe(8400);
  });

  it('a zero sanctioned load is rejected rather than billed as nothing', () => {
    expect(() => calculateBill({ kwh: 10, sanctionedLoadKw: 0 }, JUN_2026)).toThrow(InvalidBillInputError);
  });
});

describe('a historical view says so', () => {
  const bill = calculateBill({ kwh: 40, sanctionedLoadKw: 1 }, JUN_2026_ON_3RD);

  it('warns that the rule was later amended', () => {
    expect(bill.warnings.map((w) => w.code)).toContain('SUPERSEDED_VIEW');
    expect(bill.provenance.supersededView).toBe(true);
    expect(bill.provenance.asOf).toBe('2026-06-03');
  });

  it('the governing view carries no such warning', () => {
    const gov = calculateBill({ kwh: 40, sanctionedLoadKw: 1 }, JUN_2026);
    expect(gov.warnings.map((w) => w.code)).not.toContain('SUPERSEDED_VIEW');
    expect(gov.provenance.asOf).toBeNull();
  });
});

describe('provenance travels with every result', () => {
  const bill = calculateBill({ kwh: 412, sanctionedLoadKw: 2 }, JUN_2026);

  it('names both instruments that built the schedule', () => {
    expect(bill.provenance.instruments.map((i) => i.id).sort()).toEqual([
      'berc-order-2026-22',
      'berc-reconsideration-order-2026-01',
    ]);
  });

  it('every instrument carries a hashed source document', () => {
    for (const i of bill.provenance.instruments) {
      expect(i.evidence.contentSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(i.evidence.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('records issue and publication separately — 81 days apart for the June 4 order', () => {
    const recon = bill.provenance.instruments.find((i) => i.id === 'berc-reconsideration-order-2026-01')!;
    expect(recon.issuedOn).toBe('2026-06-04');
    expect(recon.publishedOn).toBe('2026-08-24');
    // A website upload date must never be mistaken for the legal effective date.
    expect(recon.issuedOn).not.toBe(recon.publishedOn);
  });

  it('records the lineage of the amended instrument', () => {
    const order22 = bill.provenance.instruments.find((i) => i.id === 'berc-order-2026-22')!;
    expect(order22.lifecycle).toBe('AMENDED');
    expect(order22.amendedBy).toContain('berc-reconsideration-order-2026-01');
  });

  it('pins the engine version so a stored estimate stays reproducible', () => {
    expect(bill.provenance.engineVersion).toMatch(/^tariff-engine\//);
  });
});

describe('historical comparison', () => {
  const cmp = compareEnergyCharge(412, MAY_2026, JUN_2026);

  it('gives both energy charges, the delta and the percentage', () => {
    expect(cmp.from.energyCharge).toBe(300754);
    expect(cmp.to.energyCharge).toBe(350912);
    expect(cmp.deltaPaisa).toBe(50158);
    expect(cmp.percentChange).toBe(16.68);
  });

  it('is scoped to the energy charge and refuses to be read as a bill comparison', () => {
    expect(cmp.scope).toBe('ENERGY_CHARGE_ONLY');
    expect(cmp.totalBillComparable).toBe(false);
    expect(cmp.totalBillNote).toContain('VAT');
  });

  it('lists the changed components band by band', () => {
    const labels = cmp.changedComponents.map((c) => c.label);
    expect(labels).toContain('Second step (76–200 units)');
    expect(labels).not.toContain('First step (0–75 units)'); // unchanged at 5.26
    const second = cmp.changedComponents.find((c) => c.label === 'Second step (76–200 units)')!;
    expect(second.deltaPaisa).toBe(125 * 850 - 125 * 720);
  });

  it('carries provenance for both versions', () => {
    expect(cmp.provenance.from.instruments[0].id).toBe('sro-43-law-2024');
    expect(cmp.provenance.to.instruments.map((i) => i.id)).toContain('berc-reconsideration-order-2026-01');
  });

  it('comparing a version with itself is all zeros and 0%', () => {
    const same = compareEnergyCharge(412, JUN_2026, JUN_2026);
    expect(same.deltaPaisa).toBe(0);
    expect(same.percentChange).toBe(0);
    expect(same.changedComponents).toHaveLength(0);
  });

  it('at 50 units the two versions are identical', () => {
    expect(compareEnergyCharge(50, MAY_2026, JUN_2026).deltaPaisa).toBe(0);
  });
});

describe('attribution — usage effect versus tariff effect', () => {
  // 380 units in May at the old tariff, 412 in June at the new one.
  const a = attributeEnergyChargeChange({
    fromKwh: 380,
    toKwh: 412,
    fromSchedule: MAY_2026,
    toSchedule: JUN_2026,
  });

  it('reports the convention on the result', () => {
    expect(a.convention).toBe('USAGE_AT_OLD_TARIFF');
    expect(a.conventionNote).toContain('old tariff');
  });

  it('splits the change into usage and tariff effects', () => {
    expect(a.usageEffectPaisa).toBe(energy(412, MAY_2026) - energy(380, MAY_2026));
    expect(a.tariffEffectPaisa).toBe(energy(412, JUN_2026) - energy(412, MAY_2026));
  });

  it('the two effects reconstruct the difference exactly, with nothing unexplained', () => {
    expect(a.usageEffectPaisa + a.tariffEffectPaisa).toBe(a.totalDeltaPaisa);
    expect(a.unexplainedPaisa).toBe(0);
  });

  it('identical usage attributes everything to the tariff', () => {
    const t = attributeEnergyChargeChange({
      fromKwh: 412,
      toKwh: 412,
      fromSchedule: MAY_2026,
      toSchedule: JUN_2026,
    });
    expect(t.usageEffectPaisa).toBe(0);
    expect(t.tariffEffectPaisa).toBe(50158);
  });

  it('an unchanged tariff attributes everything to usage', () => {
    const u = attributeEnergyChargeChange({
      fromKwh: 380,
      toKwh: 412,
      fromSchedule: JUN_2026,
      toSchedule: JUN_2026,
    });
    expect(u.tariffEffectPaisa).toBe(0);
    expect(u.usageEffectPaisa).toBe(u.totalDeltaPaisa);
  });

  it('is scoped to the energy charge, like the comparison', () => {
    expect(a.scope).toBe('ENERGY_CHARGE_ONLY');
  });
});
