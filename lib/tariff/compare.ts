/**
 * Historical comparison, and the honesty that has to travel with it.
 *
 * This compares the ENERGY CHARGE and says so in the type, in the field names
 * and in a note on every result. It is not a bill comparison and must never be
 * presented as one: VAT and any rebate are unresolved, so the change in what a
 * household actually pays is a different and currently uncomputable number.
 *
 * The percentage contract mirrors `changeOf` in `lib/data/grid/comparison.ts` —
 * a percentage against a base of zero is null, not 100 and not Infinity. The
 * archive has published a fabricated "-100%" from exactly that arithmetic.
 */
import { computeEnergyCharge, buildProvenance } from '@/lib/tariff/calculate';
import { percentChange } from '@/lib/tariff/money';
import type { EnergyChargeComparison, ResolvedSchedule } from '@/lib/tariff/types';

const TOTAL_BILL_NOTE =
  'Energy charge only. VAT and any rebate are UNKNOWN in this rule set — no instrument held ' +
  'states the VAT base for the energy or demand charge — so the change in the full bill is not ' +
  'this number and cannot yet be computed.';

export function compareEnergyCharge(
  kwh: number,
  from: ResolvedSchedule,
  to: ResolvedSchedule,
): EnergyChargeComparison {
  const a = computeEnergyCharge(kwh, from);
  const b = computeEnergyCharge(kwh, to);

  // Line the two breakdowns up by label. Slab labels are stable across the
  // versions encoded ("Second step (76–200 units)"), and a band that exists in
  // one version and not the other appears with a null on the missing side
  // rather than a zero — an absent band is not a band worth nothing.
  const labels: string[] = [];
  for (const c of [...a.components, ...b.components]) {
    if (!labels.includes(c.label)) labels.push(c.label);
  }

  const changedComponents = labels
    .map((label) => {
      const fromPaisa = a.components.find((c) => c.label === label)?.value ?? null;
      const toPaisa = b.components.find((c) => c.label === label)?.value ?? null;
      const deltaPaisa = fromPaisa !== null && toPaisa !== null ? toPaisa - fromPaisa : null;
      return { label, fromPaisa, toPaisa, deltaPaisa };
    })
    .filter((r) => r.deltaPaisa !== 0);

  return {
    kwh,
    scope: 'ENERGY_CHARGE_ONLY',
    from: {
      energyCharge: a.total,
      billingPeriod: from.query.billingPeriod,
      instrumentIds: from.instruments.map((i) => i.id),
    },
    to: {
      energyCharge: b.total,
      billingPeriod: to.query.billingPeriod,
      instrumentIds: to.instruments.map((i) => i.id),
    },
    deltaPaisa: b.total - a.total,
    percentChange: percentChange(a.total, b.total),
    changedComponents,
    provenance: { from: buildProvenance(from), to: buildProvenance(to) },
    totalBillComparable: false,
    totalBillNote: TOTAL_BILL_NOTE,
  };
}
