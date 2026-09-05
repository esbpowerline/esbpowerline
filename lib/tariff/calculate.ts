/**
 * The pure calculation core.
 *
 * Takes numbers and a resolved schedule, returns numbers. No Prisma, no React,
 * no Next, no Supabase, no network, no model. `lib/test/tariff-purity.test.ts`
 * reads this file and asserts it.
 *
 * The rule that shapes the output: **a partial sum is never called a total.**
 * VAT is UNKNOWN in V1 — no instrument held states VAT on the energy or demand
 * charge — so `total` is `null` on every result this version can produce, and
 * the components that *are* known are returned under `knownSubtotal`. Naming
 * that "total" would be the tariff-engine form of the Gas Supply incident: a
 * plausible number under a label claiming more than the source supports.
 */
import { formatTaka, paisaTimesQuantity, paisaTimesUnits, sumPaisa } from '@/lib/tariff/money';
import type {
  BillComponent,
  BillInput,
  BillResult,
  BillWarning,
  EnergySlabVersion,
  Provenance,
  ResolvedSchedule,
} from '@/lib/tariff/types';

export const ENGINE_VERSION = 'tariff-engine/1.0.0';

export class InvalidBillInputError extends RangeError {
  constructor(message: string) {
    super(`[tariff] ${message}`);
    this.name = 'InvalidBillInputError';
  }
}

function assertInput(input: BillInput): void {
  if (typeof input.kwh !== 'number' || !Number.isFinite(input.kwh)) {
    throw new InvalidBillInputError(`kwh must be a finite number, received ${String(input.kwh)}`);
  }
  if (input.kwh < 0) {
    throw new InvalidBillInputError(`kwh must not be negative, received ${input.kwh}`);
  }
  if (!Number.isInteger(input.kwh)) {
    // BERC's slabs are expressed in whole units and meters read in whole units.
    // Accepting 50.5 would invite a rounding question no instrument answers.
    throw new InvalidBillInputError(`kwh must be a whole number of units, received ${input.kwh}`);
  }
  if (input.sanctionedLoadKw !== undefined && !(input.sanctionedLoadKw > 0)) {
    throw new InvalidBillInputError(
      `sanctionedLoadKw must be positive when supplied, received ${input.sanctionedLoadKw}`,
    );
  }
}

/** Units of consumption that fall inside a telescopic band. */
function unitsInBand(kwh: number, slab: EnergySlabVersion): number {
  const lower = slab.fromUnit - 1;
  const upper = slab.toUnit ?? Number.POSITIVE_INFINITY;
  return Math.max(0, Math.min(kwh, upper) - lower);
}

/**
 * Does a CATEGORICAL slab apply to this bill?
 *
 * The lifeline is a consumer class, not a band. Footnote 3 of the June 2026
 * BERC notification and footnote 3 of gazette S.R.O. 43-Law/2024 both say the
 * 0–50 rate is unavailable to any other residential consumer, so at 51 units
 * none of the consumption gets it — billing starts at the 0–75 first step.
 */
function categoricalApplies(kwh: number, slab: EnergySlabVersion): boolean {
  const upper = slab.toUnit ?? Number.POSITIVE_INFINITY;
  return kwh > 0 && kwh <= upper;
}

interface EnergyChargeBreakdown {
  components: BillComponent[];
  total: number;
}

/**
 * The energy charge, and the per-band working.
 *
 * Exported because `compare.ts` and `attribute.ts` need exactly this and
 * nothing else — they must never reach for a bill total, which does not exist.
 */
export function computeEnergyCharge(kwh: number, schedule: ResolvedSchedule): EnergyChargeBreakdown {
  const components: BillComponent[] = [];

  const categorical = schedule.slabs.find(
    (s) => s.applicability === 'CATEGORICAL' && categoricalApplies(kwh, s),
  );

  if (categorical) {
    const amount = paisaTimesUnits(categorical.ratePaisa, kwh);
    components.push({
      kind: 'ENERGY_SLAB',
      label: categorical.label,
      status: 'CALCULATED',
      value: amount,
      working: `${kwh} × ${formatTaka(categorical.ratePaisa)} = ${formatTaka(amount)}`,
      instrumentId: categorical.instrumentId,
    });
    return { components, total: amount };
  }

  for (const slab of schedule.slabs) {
    if (slab.applicability === 'CATEGORICAL') continue;
    const units = unitsInBand(kwh, slab);
    if (units === 0) continue;
    const amount = paisaTimesUnits(slab.ratePaisa, units);
    components.push({
      kind: 'ENERGY_SLAB',
      label: slab.label,
      status: 'CALCULATED',
      value: amount,
      working: `${units} × ${formatTaka(slab.ratePaisa)} = ${formatTaka(amount)}`,
      instrumentId: slab.instrumentId,
    });
  }

  return { components, total: sumPaisa(components.map((c) => c.value ?? 0)) };
}

export function buildProvenance(schedule: ResolvedSchedule): Provenance {
  return {
    billingPeriod: schedule.query.billingPeriod,
    asOf: schedule.query.asOf ?? null,
    supersededView: schedule.supersededView,
    instruments: schedule.instruments.map((i) => ({
      id: i.id,
      authority: i.authority,
      instrumentType: i.instrumentType,
      identifier: i.identifier,
      issuedOn: i.issuedOn,
      publishedOn: i.publishedOn,
      lifecycle: i.lifecycle,
      amendedBy: i.amendedBy,
      verificationStatus: i.verificationStatus,
      evidence: i.evidence,
    })),
    engineVersion: ENGINE_VERSION,
  };
}

/**
 * Compute what can be computed for one billing period.
 *
 * Every unresolved component is returned with its reason, and `total` is `null`
 * whenever any of them is present. Nothing is estimated, defaulted or omitted
 * to make the arithmetic close.
 */
export function calculateBill(input: BillInput, schedule: ResolvedSchedule): BillResult {
  assertInput(input);

  const warnings: BillWarning[] = [];
  const components: BillComponent[] = [];

  const energy = computeEnergyCharge(input.kwh, schedule);
  components.push(...energy.components);

  if (input.kwh === 0) {
    // Zero consumption is a real case, not an error, and it must not silently
    // produce a zero bill: a fixed demand charge is still owed.
    components.push({
      kind: 'ENERGY_SLAB',
      label: 'Energy charge',
      status: 'CALCULATED',
      value: 0,
      working: '0 units consumed',
    });
  }

  const demand = schedule.demandCharge;
  if (demand) {
    if (demand.basis === 'SANCTIONED_LOAD_KW') {
      if (input.sanctionedLoadKw === undefined) {
        components.push({
          kind: 'DEMAND_CHARGE',
          label: demand.label,
          status: 'INPUT_MISSING',
          value: null,
          reason:
            'Sanctioned load (kW) was not supplied. Footnote 2 of the instrument bases the ' +
            'demand charge on sanctioned load for every LT and MT consumer, so this cannot be ' +
            'defaulted to nil — a household with a connection owes it even at zero consumption.',
          instrumentId: demand.instrumentId,
        });
        warnings.push({
          code: 'INPUT_MISSING',
          message: 'Demand charge requires sanctionedLoadKw; the bill cannot be completed without it.',
        });
      } else {
        const amount = paisaTimesQuantity(demand.ratePaisa, input.sanctionedLoadKw);
        components.push({
          kind: 'DEMAND_CHARGE',
          label: demand.label,
          status: 'CALCULATED',
          value: amount,
          working:
            `${input.sanctionedLoadKw} kW sanctioned load × ${formatTaka(demand.ratePaisa)}/kW/month ` +
            `= ${formatTaka(amount)}`,
          instrumentId: demand.instrumentId,
        });
      }
    } else {
      // MAX_OF_RECORDED_DEMAND_OR_80PC_SANCTIONED_KW is HT/EHT only and V1
      // encodes no such schedule. Refusing rather than approximating.
      components.push({
        kind: 'DEMAND_CHARGE',
        label: demand.label,
        status: 'UNKNOWN',
        value: null,
        reason: `Demand basis "${demand.basis}" is not implemented in V1.`,
        instrumentId: demand.instrumentId,
      });
      warnings.push({ code: 'UNKNOWN_COMPONENT', message: `Demand basis ${demand.basis} unimplemented.` });
    }
  }

  for (const u of schedule.unknowns) {
    components.push({
      kind: u.kind,
      label: u.label,
      status: 'UNKNOWN',
      value: null,
      reason: u.reason,
      instrumentId: u.instrumentId,
    });
    warnings.push({ code: 'UNKNOWN_COMPONENT', message: `${u.label}: ${u.reason}` });
  }

  if (schedule.supersededView) {
    warnings.push({
      code: 'SUPERSEDED_VIEW',
      message:
        'This is a historical view. At least one rule used here was amended after the as-of date ' +
        'and is not what ultimately governs the billing period. ' +
        schedule.notes.join(' '),
    });
  }

  const resolved = components.filter((c) => c.status === 'CALCULATED');
  const unresolved = components.filter((c) => c.status !== 'CALCULATED');
  const knownSubtotal = sumPaisa(resolved.map((c) => c.value ?? 0));

  return {
    input,
    components,
    knownSubtotal,
    total: unresolved.length === 0 ? knownSubtotal : null,
    warnings,
    provenance: buildProvenance(schedule),
  };
}
