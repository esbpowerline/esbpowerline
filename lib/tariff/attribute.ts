/**
 * "Why did my bill change?" — the deterministic half of it.
 *
 * Two effects, no model, no scoring:
 *
 *   usage effect  = E(k₂, A) − E(k₁, A)   how much more you used, at OLD prices
 *   tariff effect = E(k₂, B) − E(k₂, A)   how much prices moved, at NEW usage
 *
 * They sum exactly to E(k₂,B) − E(k₁,A) by construction, so `unexplainedPaisa`
 * is always 0 here. The field exists anyway, because the moment this is run
 * against a *real bill* rather than two computed charges it will not be — and a
 * residual that has nowhere to go is a residual that gets absorbed into a
 * component to make the arithmetic close. That is how a calculator starts
 * inventing charges.
 *
 * THE CONVENTION IS ARBITRARY AND MUST NEVER CHANGE. Measuring usage at the new
 * tariff instead is equally defensible and gives a different split — the
 * standard index-number problem. `USAGE_AT_OLD_TARIFF` is reported on every
 * result so a reader can see which decomposition they are looking at, and so
 * that changing it later would be visible rather than a silent rewrite of every
 * explanation the product has ever given.
 */
import { buildProvenance, computeEnergyCharge } from '@/lib/tariff/calculate';
import type { EnergyChargeAttribution, ResolvedSchedule } from '@/lib/tariff/types';

const CONVENTION_NOTE =
  'Usage effect is measured at the old tariff and tariff effect at the new usage ' +
  '(USAGE_AT_OLD_TARIFF). The opposite ordering is equally valid and gives different figures; ' +
  'this one is fixed so that past explanations stay reproducible.';

export function attributeEnergyChargeChange(args: {
  fromKwh: number;
  toKwh: number;
  fromSchedule: ResolvedSchedule;
  toSchedule: ResolvedSchedule;
}): EnergyChargeAttribution {
  const { fromKwh, toKwh, fromSchedule, toSchedule } = args;

  const baseline = computeEnergyCharge(fromKwh, fromSchedule).total;
  const usageAtOld = computeEnergyCharge(toKwh, fromSchedule).total;
  const final = computeEnergyCharge(toKwh, toSchedule).total;

  const usageEffectPaisa = usageAtOld - baseline;
  const tariffEffectPaisa = final - usageAtOld;
  const totalDeltaPaisa = final - baseline;

  return {
    scope: 'ENERGY_CHARGE_ONLY',
    convention: 'USAGE_AT_OLD_TARIFF',
    conventionNote: CONVENTION_NOTE,
    from: { kwh: fromKwh, energyCharge: baseline, billingPeriod: fromSchedule.query.billingPeriod },
    to: { kwh: toKwh, energyCharge: final, billingPeriod: toSchedule.query.billingPeriod },
    usageEffectPaisa,
    tariffEffectPaisa,
    totalDeltaPaisa,
    unexplainedPaisa: totalDeltaPaisa - (usageEffectPaisa + tariffEffectPaisa),
    provenance: { from: buildProvenance(fromSchedule), to: buildProvenance(toSchedule) },
  };
}
