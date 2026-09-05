/**
 * Types for the versioned tariff engine.
 *
 * Nothing in `lib/tariff/` may import Prisma, React, Next, Supabase, the
 * network or a model. `lib/test/tariff-purity.test.ts` asserts it by reading
 * the source, because a convention that is only written down is one import away
 * from being untrue.
 *
 * ---------------------------------------------------------------------------
 * THE TWO TEMPORAL AXES, AND WHY ONE IS NOT ENOUGH
 * ---------------------------------------------------------------------------
 *
 * BERC issued Order 2026/22 on 3 June 2026 raising the residential lifeline
 * rate from Tk 4.63 to 5.32, and Reconsideration Order 2026/01 on 4 June 2026
 * setting that increase aside and restoring 4.63. Both carry the *same* legal
 * effective period — bill month June 2026. A single effective interval cannot
 * order them, and the earlier design's trick of collapsing the 3 June rule to a
 * zero-length interval was wrong: it made a validly issued instrument
 * unrepresentable rather than merely superseded, and it destroyed the ability
 * to answer what was in force *as known on* 3 June.
 *
 * So there are two intervals, and they answer two different questions:
 *
 *   BILLING VALIDITY   `billingValidity: { from, to }`, in bill months.
 *                      Which billing periods does this rule govern?
 *
 *   KNOWLEDGE          `knowledge: { knownFrom, knownUntil }`, in calendar days.
 *                      Between which dates was this rule the answer a
 *                      well-informed reader would have given?
 *
 * The 3 June lifeline rule and the 4 June lifeline rule have identical billing
 * validity (June 2026 onward) and disjoint knowledge intervals (3–4 June, and
 * 4 June onward). `resolveApplicableTariff` without `asOf` asks the first
 * question and returns 4.63; with `asOf: '2026-06-03'` it asks the second and
 * returns 5.32, flagged `supersededBy`.
 *
 * This is deliberately not a general bitemporal framework. It is two intervals
 * and one optional query parameter.
 *
 * ---------------------------------------------------------------------------
 * FIVE DATES, AND THE ONE THAT MUST NEVER BE MISTAKEN FOR ANOTHER
 * ---------------------------------------------------------------------------
 *
 *   issuedOn      the instrument's own date, on its face
 *   effectiveFrom the bill month it governs from — a legal fact
 *   publishedOn   when the publisher put the file on the web
 *   retrievedAt   when ESB fetched and hashed it
 *   knownFrom     when the rule became knowable at all — which may be a
 *                 different document's publication (see below)
 *
 * Reconsideration Order 2026/01 is dated 4 June 2026 and was uploaded to
 * berc.org.bd on 24 August 2026 — eighty-one days later. Treating the upload
 * date as the effective date would say June and July bills were computed under
 * a rule that did not yet exist. Treating it as `knownFrom` would be equally
 * wrong in the other direction, because BERC's notification memo 2569 published
 * the same decision on 4 June and DPDC carried it. `knownFrom` therefore
 * carries its own `basis` string naming which publication made it knowable.
 */

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

/** A distribution licensee. V1 encodes BPDB only; the rest are dimension values, not data. */
export type Utility = 'BPDB' | 'BREB' | 'DPDC' | 'DESCO' | 'WZPDCL' | 'NESCO';

/**
 * Consumer category. V1 encodes LT-A residential only — the single path the
 * evidence sprint verified. The union is deliberately wider than the data so
 * that adding LT-B or MT-1 is a rule file, not a schema change.
 */
export type ConsumerCategory =
  | 'LT_A_RESIDENTIAL'
  | 'LT_B_IRRIGATION'
  | 'LT_C1_SMALL_INDUSTRY'
  | 'LT_C2_CONSTRUCTION'
  | 'LT_D1_INSTITUTIONAL'
  | 'LT_D2_STREETLIGHT'
  | 'LT_D3_EV_CHARGING'
  | 'LT_E_COMMERCIAL'
  | 'LT_T_TEMPORARY'
  | 'MT_1_RESIDENTIAL'
  | 'MT_5_GENERAL';

export type MeterType = 'POSTPAID' | 'PREPAID';
export type Phase = 'SINGLE' | 'THREE';

/** A bill month, `YYYY-MM`. Every instrument says "effective from bill month X", never a date. */
export type BillMonth = string;
/** A calendar day, `YYYY-MM-DD`. */
export type IsoDate = string;

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export type Authority =
  | 'BERC'
  | 'POWER_DIVISION'
  | 'UTILITY';

export type InstrumentType =
  | 'BERC_ORDER'
  | 'BERC_NOTIFICATION'
  | 'GAZETTE_NOTIFICATION'
  | 'UTILITY_CIRCULAR';

/**
 * How far the evidence chain has been walked for this instrument. Ordered.
 * V1 ships everything at DOCUMENT_HELD: the scan is archived and hashed, and
 * the figures were read off it once. DUAL_TRANSCRIBED requires a second,
 * independent read — the bar `lib/data/bpdb-annual-accounts.ts` sets.
 */
export type VerificationStatus =
  | 'UNVALIDATED'
  | 'SOURCE_LINKED'
  | 'DOCUMENT_HELD'
  | 'FIGURES_TRANSCRIBED'
  | 'DUAL_TRANSCRIBED';

/**
 * Where an instrument sits in the lineage.
 *
 * There is no `CURRENT`. It is a function of today's date, it goes stale in
 * silence, and two rows both claiming it is a corruption with no symptom.
 * Currency is derived by `resolveApplicableTariff`, never stored.
 */
export type Lifecycle =
  | 'ISSUED'
  | 'IN_FORCE'
  | 'AMENDED'
  | 'SUPERSEDED'
  | 'WITHDRAWN'
  | 'REPEALED';

/** A pointer into `evidence/tariff/manifest.json`. The pure core carries the id and the hash and looks nothing up. */
export interface EvidenceRef {
  documentId: string;
  contentSha256: string;
  sourceUrl: string;
  archivePath: string;
  pages?: number;
  /** Where in the document the figures were read from. */
  locator?: string;
}

export interface Instrument {
  id: string;
  authority: Authority;
  instrumentType: InstrumentType;
  /** As the document identifies itself, in full. */
  identifier: string;
  titleEn: string;
  issuedOn: IsoDate;
  publishedOn: IsoDate;
  retrievedAt: IsoDate;
  language: 'bn' | 'en';
  legalBasis: string;
  lifecycle: Lifecycle;
  amends?: readonly string[];
  amendedBy?: readonly string[];
  supersedes?: readonly string[];
  supersededBy?: readonly string[];
  repeals?: readonly string[];
  verificationStatus: VerificationStatus;
  evidence: EvidenceRef;
  note?: string;
}

// ---------------------------------------------------------------------------
// Component versions — the resolvable unit
// ---------------------------------------------------------------------------

export type ComponentKind =
  | 'ENERGY_SLAB'
  | 'DEMAND_CHARGE'
  | 'VAT'
  | 'REBATE'
  | 'METER_RENT'
  | 'SERVICE_CHARGE'
  | 'MINIMUM_CHARGE'
  | 'SURCHARGE';

/**
 * How a slab prices the units that fall in it.
 *
 * TELESCOPIC — only the units inside this band are priced at this rate. Every
 * residential step from 76 units upward.
 *
 * CATEGORICAL — this rate applies to *all* consumption, but only if total
 * consumption stays inside the band. The residential lifeline, and the reason
 * the published table lists an apparently impossible "0–50" beside "0–75".
 * Footnote 3 of the 3 June 2026 BERC notification: "লাইফ লাইন (০-৫০ ইউনিট)
 * মূল্যহারের সুবিধা লাইফ লাইন গ্রাহক ব্যতীত আবাসিক গ্রাহকশ্রেণির অন্য কোনো
 * গ্রাহক পাবেন না" — no residential consumer other than a lifeline consumer
 * receives the benefit of the 0–50 rate. The same rule, in near-identical
 * words, is footnote 3 of gazette S.R.O. 43-Law/2024.
 *
 * At 50 units the categorical rate applies and the bill is Tk 231.50. At 51 it
 * does not apply at all and the bill is Tk 268.26 — Tk 36.76 for one unit.
 * Reading the lifeline as telescopic gives 236.76 and is 13.3% low.
 */
export type SlabApplicability = 'TELESCOPIC' | 'CATEGORICAL';

/**
 * What the demand quantity is, per footnote 2 of the 3 June 2026 notification
 * and footnote 2 of S.R.O. 43-Law/2024, which state it identically:
 *
 *   (ka) for all LT and MT consumers, the sanctioned load (kW) applies;
 *   (kha) for all HT and EHT consumers, whichever is greater of the recorded
 *         maximum demand (kW) and 80% of the sanctioned load (kW).
 *
 * The unit is kilowatts throughout — কি.ও. — never kVA, whatever the secondary
 * calculators say.
 */
export type DemandBasis = 'SANCTIONED_LOAD_KW' | 'MAX_OF_RECORDED_DEMAND_OR_80PC_SANCTIONED_KW';

export interface BillingValidity {
  /** Inclusive, in bill months. */
  from: BillMonth;
  /** Exclusive. `null` means still in force. */
  to: BillMonth | null;
}

export interface Knowledge {
  /** Inclusive: the first day this rule was the answer. */
  knownFrom: IsoDate;
  /** Exclusive. `null` means it is still the answer. */
  knownUntil: IsoDate | null;
  /** Which publication made it knowable on `knownFrom`. Not always the instrument's own upload. */
  basis: string;
}

interface ComponentVersionBase {
  id: string;
  instrumentId: string;
  utility: Utility;
  category: ConsumerCategory;
  meterType: MeterType;
  phase: Phase;
  billingValidity: BillingValidity;
  knowledge: Knowledge;
  /** Set when a later instrument replaced this component version. */
  supersededBy?: { componentVersionId: string; instrumentId: string; on: IsoDate };
  label: string;
}

export interface EnergySlabVersion extends ComponentVersionBase {
  kind: 'ENERGY_SLAB';
  /** 1-based, in the order the instrument prints them. */
  slabIndex: number;
  fromUnit: number;
  /** `null` for the open top band. */
  toUnit: number | null;
  ratePaisa: number;
  applicability: SlabApplicability;
}

export interface DemandChargeVersion extends ComponentVersionBase {
  kind: 'DEMAND_CHARGE';
  ratePaisa: number;
  basis: DemandBasis;
}

/**
 * A component the instruments do not settle. It is *data*, not a gap in the
 * code: the reason travels with the rule set and is reviewable in the same
 * pull request as a rate.
 */
export interface UnknownComponentVersion extends ComponentVersionBase {
  kind: 'VAT' | 'REBATE' | 'METER_RENT' | 'SERVICE_CHARGE' | 'MINIMUM_CHARGE' | 'SURCHARGE';
  status: 'UNKNOWN';
  reason: string;
  /** What would settle it. */
  wouldBeSettledBy?: string;
}

export type ComponentVersion = EnergySlabVersion | DemandChargeVersion | UnknownComponentVersion;

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export interface ResolveQuery {
  utility: Utility;
  category: ConsumerCategory;
  meterType: MeterType;
  phase: Phase;
  /** The bill month being computed. */
  billingPeriod: BillMonth;
  /**
   * Omit for the governing rule — what ultimately applies to that bill month.
   * Supply a date for the historical question: what a well-informed reader
   * would have said on that date.
   */
  asOf?: IsoDate;
}

export interface ResolvedSchedule {
  query: ResolveQuery;
  slabs: readonly EnergySlabVersion[];
  demandCharge: DemandChargeVersion | null;
  unknowns: readonly UnknownComponentVersion[];
  /** Every instrument that contributed a component, in the order first used. */
  instruments: readonly Instrument[];
  /** True when any resolved component was later replaced — only reachable via `asOf`. */
  supersededView: boolean;
  notes: readonly string[];
}

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

export interface BillInput {
  /** Whole units. Fractional consumption is rejected; see money.ts. */
  kwh: number;
  /** Required when the schedule carries a demand charge on SANCTIONED_LOAD_KW. */
  sanctionedLoadKw?: number;
  recordedMaxDemandKw?: number;
}

export type ComponentStatus = 'CALCULATED' | 'UNKNOWN' | 'NOT_APPLICABLE' | 'INPUT_MISSING';

export interface BillComponent {
  kind: ComponentKind;
  label: string;
  status: ComponentStatus;
  /** Paisa. `null` for every status other than CALCULATED. */
  value: number | null;
  /** The arithmetic, printed, so a reader can check it by hand. */
  working?: string;
  reason?: string;
  instrumentId?: string;
}

export interface BillWarning {
  code:
    | 'UNKNOWN_COMPONENT'
    | 'INPUT_MISSING'
    | 'SUPERSEDED_VIEW'
    | 'NO_RULE';
  message: string;
}

export interface BillResult {
  input: BillInput;
  components: readonly BillComponent[];
  /**
   * The sum of the components that ARE known. Never call this a total.
   * It is deliberately not named `total`, `subtotal` or `amount`: a partial sum
   * with a confident label is how a calculator starts inventing bills.
   */
  knownSubtotal: number;
  /** `null` whenever any component is unresolved. In V1 that is always, because VAT is UNKNOWN. */
  total: number | null;
  warnings: readonly BillWarning[];
  provenance: Provenance;
}

export interface Provenance {
  billingPeriod: BillMonth;
  asOf: IsoDate | null;
  /** True when this is a historical view of a rule that has since been amended. */
  supersededView: boolean;
  instruments: readonly {
    id: string;
    authority: Authority;
    instrumentType: InstrumentType;
    identifier: string;
    issuedOn: IsoDate;
    publishedOn: IsoDate;
    lifecycle: Lifecycle;
    amendedBy?: readonly string[];
    verificationStatus: VerificationStatus;
    evidence: EvidenceRef;
  }[];
  engineVersion: string;
}

// ---------------------------------------------------------------------------
// Comparison and attribution
// ---------------------------------------------------------------------------

export interface EnergyChargeComparison {
  kwh: number;
  /**
   * Named for what it is. This is NOT a bill comparison: VAT and any rebate are
   * unresolved, so the change in what a household actually pays is not this
   * number and must not be presented as though it were.
   */
  scope: 'ENERGY_CHARGE_ONLY';
  from: { energyCharge: number; billingPeriod: BillMonth; instrumentIds: readonly string[] };
  to: { energyCharge: number; billingPeriod: BillMonth; instrumentIds: readonly string[] };
  deltaPaisa: number;
  percentChange: number | null;
  changedComponents: readonly {
    label: string;
    fromPaisa: number | null;
    toPaisa: number | null;
    deltaPaisa: number | null;
  }[];
  provenance: { from: Provenance; to: Provenance };
  totalBillComparable: false;
  totalBillNote: string;
}

/**
 * The index-number convention, fixed forever and reported on every result.
 *
 * Usage effect is measured at the OLD tariff and tariff effect at the NEW
 * usage. The other ordering is equally defensible and gives different numbers,
 * so the choice is arbitrary but must never change: a changed convention
 * silently rewrites every explanation the product has ever given.
 *
 * The two effects sum exactly to the difference, by construction:
 *   (E(k₂,A) − E(k₁,A)) + (E(k₂,B) − E(k₂,A)) = E(k₂,B) − E(k₁,A)
 */
export type AttributionConvention = 'USAGE_AT_OLD_TARIFF';

export interface EnergyChargeAttribution {
  scope: 'ENERGY_CHARGE_ONLY';
  convention: AttributionConvention;
  conventionNote: string;
  from: { kwh: number; energyCharge: number; billingPeriod: BillMonth };
  to: { kwh: number; energyCharge: number; billingPeriod: BillMonth };
  usageEffectPaisa: number;
  tariffEffectPaisa: number;
  totalDeltaPaisa: number;
  /** Always 0 for the energy charge, which decomposes exactly. Present because a bill will not. */
  unexplainedPaisa: number;
  provenance: { from: Provenance; to: Provenance };
}
