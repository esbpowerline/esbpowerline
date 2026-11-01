/**
 * The government-set retail prices on the commodities strip — each with the
 * instrument that set it.
 *
 * Until 2026-09-30 the strip read these from the last row of
 * `macroEconomicData` (lib/data/macro/economics.ts), a hand-typed yearly table
 * that cites nothing, and CNG was a literal 43.00 in the ticker itself. The
 * figures turned out to be right; nothing on the site could show it. Read that
 * day from the documents:
 *
 * - Diesel, octane, petrol, kerosene: EMRD's gazette notification of 20 Sep
 *   2026 (No. …07.0017.26.215), effective 21 Sep 2026, which re-fixed all four;
 *   EMRD's memo of 30 Sep 2026 (…24.452) holds them unchanged for October,
 *   and its memo of 29 Oct 2026 (…24.499) holds them for November.
 *   These are no longer BERC's to set: since 2024 EMRD fixes them monthly under
 *   the automatic pricing formula, on BPC's proposal. Kerosene above diesel is
 *   what the gazette states, not a transposition.
 * - CNG: BERC's notification of 4 Jun 2022 (…22.2523), row 7 — 43.00 Tk/m³,
 *   "unchanged", of which 35.00 is feed gas and 8.00 the operator's margin.
 *   The latest BERC instrument found that states a CNG rate; the April 2025
 *   re-fixing covered the industrial and captive categories only.
 *
 * Hashes and archive names: evidence/fuel/manifest.json. A new price arrives
 * as a new instrument here, never as an edit to a number.
 */

export interface PriceInstrument {
  issuer: 'EMRD' | 'BERC';
  reference: string;
  memoNo: string;
  issuedOn: string;
  /** As the instrument states it: a date, or BERC's "bill month". */
  effectiveFrom: string;
  /** Key into evidence/fuel/manifest.json. */
  evidenceId: string;
  sourceUrl: string;
}

export interface AdministeredPrice {
  id: string;
  name: string;
  value: number;
  unit: string;
  instrument: PriceInstrument;
  /** A later instrument that restates the same figure, where one exists. */
  confirmedBy?: PriceInstrument;
}

const EMRD_GAZETTE_2026_09_20: PriceInstrument = {
  issuer: 'EMRD',
  reference: 'EMRD gazette notification, 20 September 2026',
  memoNo: '28.00.0000.000.026.07.0017.26.215',
  issuedOn: '2026-09-20',
  effectiveFrom: '2026-09-21',
  evidenceId: 'emrd-gazette-2026-09-20-215',
  sourceUrl:
    'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-emrd/2026/8/b7e030d8-c9ab-416b-8950-7843cfd0b1f2.pdf',
};

const EMRD_MEMO_2026_09_30: PriceInstrument = {
  issuer: 'EMRD',
  reference: 'EMRD memo on October 2026 fuel prices, 30 September 2026',
  memoNo: '28.00.0000.000.026.35.0116.24.452',
  issuedOn: '2026-09-30',
  effectiveFrom: '2026-10-01',
  evidenceId: 'emrd-memo-2026-09-30-452',
  sourceUrl:
    'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-emrd/2026/8/4e037165-6558-4be7-8939-acbe5fbb1187.pdf',
};

const EMRD_MEMO_2026_10_29: PriceInstrument = {
  issuer: 'EMRD',
  reference: 'EMRD memo on November 2026 fuel prices, 29 October 2026',
  memoNo: '28.00.0000.000.026.35.0116.24.499',
  issuedOn: '2026-10-29',
  effectiveFrom: '2026-11-01',
  evidenceId: 'emrd-memo-2026-10-29-499',
  sourceUrl:
    'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-emrd/2026/9/8505d5d8-cb35-4129-8bfb-a54aee407f53.pdf',
};

const BERC_GAS_2022_06_04: PriceInstrument = {
  issuer: 'BERC',
  reference: 'BERC notification on consumer gas tariffs, 4 June 2022',
  memoNo: '28.01.0000.012.14.001.22.2523',
  issuedOn: '2022-06-04',
  effectiveFrom: 'bill month June 2022',
  evidenceId: 'berc-gas-2022-06-04-2523',
  sourceUrl:
    'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2024/12/062f526e55424bfca8ddfebbc0425654.pdf',
};

const fuel = (id: string, name: string, value: number): AdministeredPrice => ({
  id,
  name,
  value,
  unit: 'Tk/L',
  instrument: EMRD_GAZETTE_2026_09_20,
  confirmedBy: EMRD_MEMO_2026_10_29,
});

/** Strip order. */
export const ADMINISTERED_PRICES: readonly AdministeredPrice[] = [
  fuel('octane-bpc', 'Octane', 165),
  fuel('petrol-bpc', 'Petrol', 160),
  fuel('diesel-bpc', 'Diesel', 135),
  fuel('kerosene-bpc', 'Kerosene', 155),
  { id: 'cng-berc', name: 'CNG', value: 43, unit: 'Tk/m³', instrument: BERC_GAS_2022_06_04 },
];

/**
 * EMRD's monthly decision on the four fuels, one instrument per month, as the
 * fuel-price card reads it. Since 2024 EMRD fixes these prices month by month
 * under the automatic formula, so "what is the rate for November" has a
 * document of its own even when the answer is "the same as October". A month
 * with no entry is a month EMRD has not yet ruled on: the card says it is
 * waiting, and never carries the previous month forward silently.
 *
 * `changed` is what the instrument says, not something worked out here: the
 * 20 Sep gazette re-fixed the prices mid-September; the October and November
 * memos hold them "unchanged".
 */
export interface FuelMonthRate {
  /** `YYYY-MM`. */
  month: string;
  instrument: PriceInstrument;
  changed: boolean;
}

export const EMRD_FUEL_MONTHS: readonly FuelMonthRate[] = [
  { month: '2026-09', instrument: EMRD_GAZETTE_2026_09_20, changed: true },
  { month: '2026-10', instrument: EMRD_MEMO_2026_09_30, changed: false },
  { month: '2026-11', instrument: EMRD_MEMO_2026_10_29, changed: false },
];

export type FuelId = 'diesel-bpc' | 'octane-bpc' | 'petrol-bpc' | 'kerosene-bpc';

/**
 * The instrument that last *changed* the four fuel prices, and the prices it
 * replaced where a document states them.
 *
 * The gazette of 20 Sep 2026 cites the memo it supersedes (EMRD's memo of
 * 31 Aug 2026, No. 28.00.0000.000.026.35.0116.24.414), but that memo has not
 * been found on EMRD's site, and the gazette does not restate the old figures.
 * The press reported them (diesel 115, octane 145, petrol 140, kerosene 135),
 * but a figure no instrument states is not printed here. Until the memo is
 * archived `previous` stays null, and the card says "unchanged since 21 Sep"
 * rather than "▲ ৳20 on 21 Sep".
 */
export const LAST_FUEL_CHANGE: {
  instrument: PriceInstrument;
  previous: Record<FuelId, number> | null;
} = { instrument: EMRD_GAZETTE_2026_09_20, previous: null };
