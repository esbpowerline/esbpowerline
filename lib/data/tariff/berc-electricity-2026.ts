/**
 * Electricity tariffs in force, as BERC gazetted them — every figure carries the
 * instrument it was read from.
 *
 * Replaces the commodities strip's "Bulk Electricity 8.39 Tk/kWh · BERC Jun 2026",
 * which `lib/data/companies/berc.ts` had already flagged: 8.39 is the national
 * weighted-average bulk tariff BERC announced on 3 June 2026 and it governed for
 * one day. On 4 June, Reconsideration Order 2026/01 restored the residential
 * lifeline and first-step rates and CUT the bulk rates to cover the distributors'
 * shortfall, fixing bulk per utility and per voltage level (Appendix-ka). There is
 * no single national bulk figure to quote after that, so none is.
 *
 * Transcribed 2026-09-17 from the archived scans and read against them at 220 dpi
 * — the documents have no text layer, and ১ / ৯ are easy to confuse at screen
 * size. Each file's SHA-256 matches `evidence/tariff/manifest.json`. BERC's notices
 * page on 2026-09-17 listed no electricity tariff instrument newer than this order
 * (its most recent, posted 24 Aug 2026, is this order itself).
 *
 * Effective dates are bill months, as the instruments state them. A tariff is the
 * tariff until the next order; it is not a quote for today and has no daily delta.
 */

export interface TariffInstrument {
  issuer: 'BERC';
  /** As printed on the instrument. */
  reference: string;
  memoNo: string | null;
  issuedOn: string;
  /** The instrument's own wording: "bill month June 2026". */
  effectiveFrom: string;
  /** Where on the instrument the figures sit. */
  location: string;
  contentSha256: string;
  sourceUrl: string;
}

export interface TariffRate {
  id: string;
  label: string;
  labelBn: string;
  /** Tk/kWh, exactly as printed. */
  value: number;
  /** Decimal places the instrument prints, so 9.4115 is never shown as 9.412. */
  decimals: number;
  instrument: TariffInstrument;
}

/** BERC Reconsideration Order No. 2026/01, dated 4 June 2026 (10 pp.). */
const RECONSIDERATION_2026_01: TariffInstrument = {
  issuer: 'BERC',
  reference: 'BERC Reconsideration Order 2026/01',
  memoNo: null,
  issuedOn: '2026-06-04',
  effectiveFrom: 'bill month June 2026',
  location: 'Appendix-ka (page 7), per paragraphs 5.4 and 5.6',
  contentSha256: 'f5a7c4538585f849' /* prefix; full hash in evidence/tariff/manifest.json */,
  sourceUrl: 'https://berc.org.bd/pages/notices',
};

/** BERC amendment notification (সংশোধন বিজ্ঞপ্তি), memo …26.2569, 4 June 2026. */
const AMENDMENT_2569: TariffInstrument = {
  issuer: 'BERC',
  reference: 'BERC amendment notification, 4 June 2026',
  memoNo: '28.01.0000.012.04.003.26.2569',
  issuedOn: '2026-06-04',
  effectiveFrom: 'bill month June 2026',
  location: 'paragraph 3',
  contentSha256: '8f0bc9b8322e897c' /* DPDC's republication, p. 5 — BERC's own copy not held */,
  sourceUrl: 'https://dpdc.gov.bd/pages/static-pages/6922de6f933eb65569e1a9c4',
};

/** Residential (LT-A) rates restored by the 4 June instruments, for every distributor. */
export const RESIDENTIAL_RATES: TariffRate[] = [
  { id: 'berc-lifeline', label: 'Lifeline tariff (0–50 kWh)', labelBn: 'লাইফ লাইন (০–৫০ ইউনিট)', value: 4.63, decimals: 2, instrument: AMENDMENT_2569 },
  { id: 'berc-first-step', label: 'Residential first step (0–75 kWh)', labelBn: 'আবাসিক প্রথম ধাপ (০–৭৫ ইউনিট)', value: 5.26, decimals: 2, instrument: AMENDMENT_2569 },
];

/**
 * Appendix-ka bulk rates. 230 kV and 132 kV are the same for all six
 * distributors, so each is one entry; 33 kV — where distribution actually takes
 * supply — differs per distributor and is listed per distributor, including
 * DPDC and DESCO separately even though the order prints the same figure for
 * both.
 */
export const BULK_RATES: TariffRate[] = [
  { id: 'berc-bulk-230kv', label: 'Bulk 230 kV (all distributors)', labelBn: 'বাল্ক ২৩০ কেভি (সকল বিতরণ সংস্থা)', value: 10.046, decimals: 4, instrument: RECONSIDERATION_2026_01 },
  { id: 'berc-bulk-132kv', label: 'Bulk 132 kV (all distributors)', labelBn: 'বাল্ক ১৩২ কেভি (সকল বিতরণ সংস্থা)', value: 10.0715, decimals: 4, instrument: RECONSIDERATION_2026_01 },
  { id: 'berc-bulk-33kv-bpdb', label: 'Bulk 33 kV · BPDB', labelBn: 'বাল্ক ৩৩ কেভি · বাবিউবো', value: 9.4115, decimals: 4, instrument: RECONSIDERATION_2026_01 },
  { id: 'berc-bulk-33kv-breb', label: 'Bulk 33 kV · BREB', labelBn: 'বাল্ক ৩৩ কেভি · বাপবিবো', value: 7.153, decimals: 4, instrument: RECONSIDERATION_2026_01 },
  { id: 'berc-bulk-33kv-dpdc', label: 'Bulk 33 kV · DPDC', labelBn: 'বাল্ক ৩৩ কেভি · ডিপিডিসি', value: 10.095, decimals: 4, instrument: RECONSIDERATION_2026_01 },
  { id: 'berc-bulk-33kv-desco', label: 'Bulk 33 kV · DESCO', labelBn: 'বাল্ক ৩৩ কেভি · ডেসকো', value: 10.095, decimals: 4, instrument: RECONSIDERATION_2026_01 },
  { id: 'berc-bulk-33kv-wzpdcl', label: 'Bulk 33 kV · WZPDCL', labelBn: 'বাল্ক ৩৩ কেভি · ওজোপাডিকো', value: 8.5325, decimals: 4, instrument: RECONSIDERATION_2026_01 },
  { id: 'berc-bulk-33kv-nesco', label: 'Bulk 33 kV · NESCO', labelBn: 'বাল্ক ৩৩ কেভি · নেসকো', value: 8.3225, decimals: 4, instrument: RECONSIDERATION_2026_01 },
];
