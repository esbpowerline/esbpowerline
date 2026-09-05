/**
 * `lib/tariff` — the versioned Bangladesh electricity tariff engine.
 *
 * Pure by construction: no Prisma, React, Next, Supabase, network or model.
 * Not a package and not a workspace — the repo has neither, and one consumer
 * does not justify a monorepo. Extracting it later is a directory move.
 *
 * V1 scope, and it is narrow on purpose: BPDB LT-A residential, postpaid,
 * single phase, three instruments. Energy charge and demand charge are
 * source-backed; VAT and the prompt-payment rebate are UNKNOWN, so `total` is
 * always `null` and `knownSubtotal` carries what is actually known.
 */
export * from '@/lib/tariff/types';
export { resolveApplicableTariff, AmbiguousTariffError } from '@/lib/tariff/resolve';
export {
  calculateBill,
  computeEnergyCharge,
  buildProvenance,
  ENGINE_VERSION,
  InvalidBillInputError,
} from '@/lib/tariff/calculate';
export { compareEnergyCharge } from '@/lib/tariff/compare';
export { attributeEnergyChargeChange } from '@/lib/tariff/attribute';
export { formatTaka, takaToPaisa, percentChange } from '@/lib/tariff/money';
export { INSTRUMENTS, COMPONENT_VERSIONS, instrumentById } from '@/lib/tariff/rules';
