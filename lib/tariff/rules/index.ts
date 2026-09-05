/**
 * The rule set: JSON files in, validated instruments and component versions out.
 *
 * JSON rather than a database, deliberately. The set is small, it must be
 * diffable in review, and a rate change should arrive as a pull request with a
 * document hash attached — which is a stronger editorial control than a CMS
 * form. `lib/test/tariff-rules-integrity.test.ts` asserts that every component
 * names an instrument and every instrument names a hashed source document, so a
 * rule that cites nothing cannot be merged.
 *
 * Validation runs at import. A malformed rule file fails the process rather
 * than resolving to `undefined` somewhere downstream, because the failure mode
 * of a silently-absent slab is a bill that is quietly too cheap.
 */
import type {
  ComponentVersion,
  DemandChargeVersion,
  EnergySlabVersion,
  Instrument,
  UnknownComponentVersion,
} from '@/lib/tariff/types';

import sro43 from './sro-43-law-2024.json';
import berc2026_22 from './berc-order-2026-22.json';
import berc2026_01 from './berc-reconsideration-order-2026-01.json';

interface RuleFile {
  instrument: unknown;
  components: unknown[];
}

const FILES: readonly RuleFile[] = [
  sro43 as unknown as RuleFile,
  berc2026_22 as unknown as RuleFile,
  berc2026_01 as unknown as RuleFile,
];

const BILL_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function fail(what: string): never {
  throw new Error(`[tariff rules] ${what}`);
}

function validateInstrument(raw: unknown): Instrument {
  const i = raw as Instrument;
  if (!i?.id) fail('an instrument has no id');
  if (!ISO_DATE.test(i.issuedOn)) fail(`${i.id}: issuedOn must be YYYY-MM-DD`);
  if (!ISO_DATE.test(i.publishedOn)) fail(`${i.id}: publishedOn must be YYYY-MM-DD`);
  if (!ISO_DATE.test(i.retrievedAt)) fail(`${i.id}: retrievedAt must be YYYY-MM-DD`);
  // The whole provenance model rests on this: a rate with no hashed document is
  // an assertion, not a transcription.
  if (!i.evidence?.contentSha256 || !/^[0-9a-f]{64}$/.test(i.evidence.contentSha256)) {
    fail(`${i.id}: evidence.contentSha256 must be a 64-character sha256`);
  }
  if (!i.evidence.sourceUrl) fail(`${i.id}: evidence.sourceUrl is required`);
  if (i.lifecycle === 'AMENDED' && !i.amendedBy?.length) {
    fail(`${i.id}: lifecycle AMENDED must name what amended it`);
  }
  if (i.lifecycle === 'SUPERSEDED' && !i.supersededBy?.length) {
    fail(`${i.id}: lifecycle SUPERSEDED must name what superseded it`);
  }
  return i;
}

function validateComponent(raw: unknown, instrumentIds: ReadonlySet<string>): ComponentVersion {
  const c = raw as ComponentVersion;
  if (!c?.id) fail('a component has no id');
  if (!instrumentIds.has(c.instrumentId)) {
    fail(`${c.id}: instrumentId "${c.instrumentId}" is not an instrument in the rule set`);
  }
  const { from, to } = c.billingValidity ?? ({} as never);
  if (!BILL_MONTH.test(from)) fail(`${c.id}: billingValidity.from must be YYYY-MM`);
  if (to !== null && !BILL_MONTH.test(to)) fail(`${c.id}: billingValidity.to must be YYYY-MM or null`);
  if (to !== null && to <= from) fail(`${c.id}: billingValidity.to must be after from`);

  const k = c.knowledge ?? ({} as never);
  if (!ISO_DATE.test(k.knownFrom)) fail(`${c.id}: knowledge.knownFrom must be YYYY-MM-DD`);
  if (k.knownUntil !== null && !ISO_DATE.test(k.knownUntil)) {
    fail(`${c.id}: knowledge.knownUntil must be YYYY-MM-DD or null`);
  }
  if (k.knownUntil !== null && k.knownUntil <= k.knownFrom) {
    fail(`${c.id}: knowledge.knownUntil must be after knownFrom`);
  }
  if (!k.basis) fail(`${c.id}: knowledge.basis must say what made this knowable`);

  if (c.kind === 'ENERGY_SLAB') {
    if (!Number.isSafeInteger(c.ratePaisa) || c.ratePaisa <= 0) fail(`${c.id}: ratePaisa must be a positive integer`);
    if (c.toUnit !== null && c.toUnit < c.fromUnit) fail(`${c.id}: toUnit precedes fromUnit`);
  } else if (c.kind === 'DEMAND_CHARGE') {
    if (!Number.isSafeInteger(c.ratePaisa) || c.ratePaisa < 0) fail(`${c.id}: ratePaisa must be a non-negative integer`);
  } else {
    if (c.status !== 'UNKNOWN') fail(`${c.id}: a ${c.kind} component must carry status UNKNOWN`);
    // An unknown with no reason is indistinguishable from a forgotten field.
    if (!c.reason) fail(`${c.id}: an UNKNOWN component must state its reason`);
  }
  return c;
}

const instrumentList: Instrument[] = FILES.map((f) => validateInstrument(f.instrument));
const instrumentIds = new Set(instrumentList.map((i) => i.id));

const componentList: ComponentVersion[] = FILES.flatMap((f) =>
  f.components.map((c) => validateComponent(c, instrumentIds)),
);

const seen = new Set<string>();
for (const c of componentList) {
  if (seen.has(c.id)) fail(`duplicate component id "${c.id}"`);
  seen.add(c.id);
}

/** Every instrument in the rule set, in file order. */
export const INSTRUMENTS: readonly Instrument[] = Object.freeze(instrumentList);

/** Every component version in the rule set. */
export const COMPONENT_VERSIONS: readonly ComponentVersion[] = Object.freeze(componentList);

const byId = new Map(instrumentList.map((i) => [i.id, i]));

export function instrumentById(id: string): Instrument | null {
  return byId.get(id) ?? null;
}

export function isEnergySlab(c: ComponentVersion): c is EnergySlabVersion {
  return c.kind === 'ENERGY_SLAB';
}
export function isDemandCharge(c: ComponentVersion): c is DemandChargeVersion {
  return c.kind === 'DEMAND_CHARGE';
}
export function isUnknownComponent(c: ComponentVersion): c is UnknownComponentVersion {
  return c.kind !== 'ENERGY_SLAB' && c.kind !== 'DEMAND_CHARGE';
}
