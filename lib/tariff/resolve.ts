/**
 * Version resolution over the two temporal axes.
 *
 * The whole June 3 → June 4 problem lives here and is two `if`s long. Read the
 * axis explanation at the top of `types.ts` before changing anything in this
 * file; the sequence it describes is the reason the second axis exists.
 */
import {
  COMPONENT_VERSIONS,
  instrumentById,
  isDemandCharge,
  isEnergySlab,
  isUnknownComponent,
} from '@/lib/tariff/rules';
import type {
  ComponentVersion,
  DemandChargeVersion,
  EnergySlabVersion,
  Instrument,
  ResolvedSchedule,
  ResolveQuery,
  UnknownComponentVersion,
} from '@/lib/tariff/types';

const BILL_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Does this component govern that bill month? `to` is exclusive. */
function governsBillingPeriod(c: ComponentVersion, period: string): boolean {
  const { from, to } = c.billingValidity;
  return from <= period && (to === null || period < to);
}

/**
 * Was this component the answer on that day? `knownUntil` is exclusive.
 *
 * With no `asOf` the question is "what is the answer now", and the answer now is
 * whatever has not been superseded — `knownUntil === null`. Note that this is
 * NOT the same as comparing against today's date: a rule superseded in 2026 is
 * excluded from a query about 2024 billing too, which is correct, because the
 * governing question always wants the latest word.
 */
function isCurrentBelief(c: ComponentVersion): boolean {
  return c.knowledge.knownUntil === null;
}

function wasBelievedOn(c: ComponentVersion, asOf: string): boolean {
  const { knownFrom, knownUntil } = c.knowledge;
  return knownFrom <= asOf && (knownUntil === null || asOf < knownUntil);
}

function matchesDimensions(c: ComponentVersion, q: ResolveQuery): boolean {
  return (
    c.utility === q.utility &&
    c.category === q.category &&
    c.meterType === q.meterType &&
    c.phase === q.phase
  );
}

/** The key that must be unique after filtering. Two survivors here is ambiguity, and ambiguity throws. */
function uniquenessKey(c: ComponentVersion): string {
  return isEnergySlab(c) ? `ENERGY_SLAB:${c.slabIndex}` : c.kind;
}

export class AmbiguousTariffError extends Error {
  constructor(key: string, ids: readonly string[]) {
    super(
      `[tariff] ${ids.length} component versions resolve for "${key}": ${ids.join(', ')}. ` +
        'Overlapping rules are an error, never a preference — picking one silently is how a ' +
        'wrong answer becomes unfalsifiable.',
    );
    this.name = 'AmbiguousTariffError';
  }
}

/**
 * Resolve the schedule that applies to one billing period.
 *
 * Omit `asOf` for the governing rule: what ultimately applies to that bill
 * month. Supply `asOf` for the historical question: what a well-informed reader
 * would have said on that date. For June 2026 the first returns a lifeline rate
 * of Tk 4.63 and `asOf: '2026-06-03'` returns Tk 5.32 with `supersededView`
 * set — the 3 June instrument is not pretended out of existence.
 *
 * Returns `null` when no rule is held. The caller must render "no rule held";
 * a zero bill would assert that electricity was free.
 */
export function resolveApplicableTariff(query: ResolveQuery): ResolvedSchedule | null {
  if (!BILL_MONTH.test(query.billingPeriod)) {
    throw new RangeError(`[tariff] billingPeriod must be YYYY-MM, received "${query.billingPeriod}"`);
  }
  if (query.asOf !== undefined && !ISO_DATE.test(query.asOf)) {
    throw new RangeError(`[tariff] asOf must be YYYY-MM-DD, received "${query.asOf}"`);
  }

  const candidates = COMPONENT_VERSIONS.filter(
    (c) =>
      matchesDimensions(c, query) &&
      governsBillingPeriod(c, query.billingPeriod) &&
      (query.asOf === undefined ? isCurrentBelief(c) : wasBelievedOn(c, query.asOf)),
  );

  if (candidates.length === 0) return null;

  const grouped = new Map<string, ComponentVersion[]>();
  for (const c of candidates) {
    const k = uniquenessKey(c);
    const list = grouped.get(k);
    if (list) list.push(c);
    else grouped.set(k, [c]);
  }
  for (const [key, list] of grouped) {
    if (list.length > 1) throw new AmbiguousTariffError(key, list.map((c) => c.id));
  }

  const slabs: EnergySlabVersion[] = candidates.filter(isEnergySlab).sort((a, b) => a.slabIndex - b.slabIndex);
  const demand: DemandChargeVersion | null = candidates.find(isDemandCharge) ?? null;
  const unknowns: UnknownComponentVersion[] = candidates.filter(isUnknownComponent);

  const instruments: Instrument[] = [];
  for (const c of candidates) {
    if (instruments.some((i) => i.id === c.instrumentId)) continue;
    const inst = instrumentById(c.instrumentId);
    if (inst) instruments.push(inst);
  }

  const supersededView = candidates.some((c) => c.supersededBy !== undefined);

  const notes: string[] = [];
  if (supersededView) {
    for (const c of candidates) {
      if (!c.supersededBy) continue;
      notes.push(
        `"${c.label}" as it stood on ${query.asOf ?? '(governing)'} came from ${c.instrumentId} ` +
          `and was amended on ${c.supersededBy.on} by ${c.supersededBy.instrumentId}.`,
      );
    }
  }
  if (instruments.length > 1) {
    notes.push(
      `This schedule is assembled from ${instruments.length} instruments: ` +
        `${instruments.map((i) => i.id).join(', ')}. An amended instrument still governs every ` +
        'row it was not amended in.',
    );
  }

  return {
    query,
    slabs,
    demandCharge: demand,
    unknowns,
    instruments,
    supersededView,
    notes,
  };
}
