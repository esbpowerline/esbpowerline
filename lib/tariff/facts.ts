/**
 * Display facts resolved from the canonical rule set.
 *
 * This is the join between the engine and the site, and it exists so that a
 * page never restates a rate. `lib/data/policy/policies.ts` used to carry
 * "lifeline rate Tk 4.63 → Tk 5.32" as a hand-typed string cited to a
 * newspaper; both halves were 3 June values, superseded on 4 June, and the site
 * told readers for three months that the lifeline rate had risen when it had
 * not. Nothing here is typed by hand — every figure is resolved, and the
 * citation is the instrument's own hashed document rather than the coverage of
 * it.
 *
 * Still pure: no network, no database, no clock. Callers that want "as of
 * today" pass the date in.
 */
import { computeEnergyCharge } from '@/lib/tariff/calculate';
import { formatTaka } from '@/lib/tariff/money';
import { resolveApplicableTariff } from '@/lib/tariff/resolve';
import type { BillMonth, IsoDate } from '@/lib/tariff/types';

const BPDB_RESIDENTIAL = {
  utility: 'BPDB',
  category: 'LT_A_RESIDENTIAL',
  meterType: 'POSTPAID',
  phase: 'SINGLE',
} as const;

export interface TariffFact {
  label: string;
  value: string;
  asOf: string;
  source: { label: string; url: string };
  /** So a caller can show the evidence grade beside the figure rather than implying certainty. */
  verificationStatus: string;
  instrumentIds: readonly string[];
}

/**
 * The current residential ladder, stated as the instruments state it, with the
 * lifeline's condition spelled out rather than left to the reader to infer from
 * two overlapping bands.
 */
export function residentialLadderFact(billingPeriod: BillMonth, asOf?: IsoDate): TariffFact | null {
  const s = resolveApplicableTariff({ ...BPDB_RESIDENTIAL, billingPeriod, asOf });
  if (!s) return null;

  const rates = s.slabs.map((slab) => {
    const band =
      slab.toUnit === null ? `above ${slab.fromUnit - 1}` : `${slab.fromUnit - 1 === 0 ? 0 : slab.fromUnit}–${slab.toUnit}`;
    return `${band}: Tk ${formatTaka(slab.ratePaisa)}`;
  });

  const lifeline = s.slabs.find((x) => x.applicability === 'CATEGORICAL');
  const condition = lifeline
    ? ` The lifeline rate applies only if the whole month stays within ${lifeline.toUnit} units — at ${
        (lifeline.toUnit ?? 0) + 1
      } units none of the consumption receives it.`
    : '';

  const primary = s.instruments[0];
  return {
    label: 'Residential retail tariff (LT-A, BPDB)',
    value: `${rates.join('; ')} per kWh.${condition}`,
    asOf: billingPeriod,
    source: { label: primary.identifier, url: primary.evidence.sourceUrl },
    verificationStatus: primary.verificationStatus,
    instrumentIds: s.instruments.map((i) => i.id),
  };
}

/**
 * What one month's consumption costs in energy charge under the governing rule,
 * with the working, for a page that wants a single concrete number.
 */
export function residentialEnergyChargeFact(
  kwh: number,
  billingPeriod: BillMonth,
  asOf?: IsoDate,
): TariffFact | null {
  const s = resolveApplicableTariff({ ...BPDB_RESIDENTIAL, billingPeriod, asOf });
  if (!s) return null;
  const { total } = computeEnergyCharge(kwh, s);
  const primary = s.instruments[0];
  return {
    label: `Energy charge for ${kwh} units`,
    value:
      `Tk ${formatTaka(total)} — energy charge only. VAT and any rebate are not established by ` +
      'any instrument held, so this is not a bill total.',
    asOf: billingPeriod,
    source: { label: primary.identifier, url: primary.evidence.sourceUrl },
    verificationStatus: primary.verificationStatus,
    instrumentIds: s.instruments.map((i) => i.id),
  };
}

/**
 * The lifeline rate and how it got there, for the BERC policy page.
 *
 * Deliberately states both instruments. "Tk 4.63" alone is true and uninformative;
 * the fact worth publishing is that it was raised and restored within a day, and
 * that is exactly what a version-less rate table cannot say.
 */
export function lifelineHistoryFact(billingPeriod: BillMonth = '2026-06'): TariffFact | null {
  const governing = resolveApplicableTariff({ ...BPDB_RESIDENTIAL, billingPeriod });
  const asIssued = resolveApplicableTariff({ ...BPDB_RESIDENTIAL, billingPeriod, asOf: '2026-06-03' });
  if (!governing || !asIssued) return null;

  const now = governing.slabs.find((x) => x.slabIndex === 1)!;
  const then = asIssued.slabs.find((x) => x.slabIndex === 1)!;
  const firstNow = governing.slabs.find((x) => x.slabIndex === 2)!;
  const firstThen = asIssued.slabs.find((x) => x.slabIndex === 2)!;

  const restored = now.ratePaisa !== then.ratePaisa;
  const amendingInstrument = governing.instruments.find((i) => i.id === now.instrumentId)!;

  return {
    label: 'Residential lifeline rate',
    value: restored
      ? `Tk ${formatTaka(now.ratePaisa)}/kWh for 0–50 units, and Tk ${formatTaka(firstNow.ratePaisa)} for the ` +
        `0–75 first step. BERC raised them to Tk ${formatTaka(then.ratePaisa)} and Tk ${formatTaka(
          firstThen.ratePaisa,
        )} on 3 June 2026 and restored the previous rates on 4 June, both effective from the same ` +
        'bill month, so the increase never governed a bill.'
      : `Tk ${formatTaka(now.ratePaisa)}/kWh for 0–50 units.`,
    asOf: billingPeriod,
    source: { label: amendingInstrument.identifier, url: amendingInstrument.evidence.sourceUrl },
    verificationStatus: amendingInstrument.verificationStatus,
    instrumentIds: governing.instruments.map((i) => i.id),
  };
}
