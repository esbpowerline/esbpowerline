/**
 * Private LPG and autogas prices as BERC sets them — every figure carries the
 * notification it was read from.
 *
 * BERC fixes the consumer price of private (bottled) LPG once a month from Saudi
 * Aramco's contract price (Saudi CP) for propane and butane, averaged 35:65. The
 * monthly notification (বিজ্ঞপ্তি) states the per-kg price, the price of every
 * cylinder size, reticulated LPG and autogas, and the hour it takes effect; the
 * full adjustment order follows about a week later. Twice in this window BERC
 * changed the price between months: 23 Feb 2026, when the NBR moved LPG VAT to
 * the import stage, and 19 Apr 2026, when freight and the trader premium rose
 * from USD 120 to 250 a tonne during the Hormuz crisis. There was no ordinary
 * February 2026 notification: January's price stood until the VAT change.
 *
 * Why this file exists: Search Console, 2026-09-30 — the site's LPG article drew
 * 1,810 impressions and 5 clicks in 28 days, for queries asking the current BERC
 * price. The answer belongs on a page that states it and cites it.
 *
 * Transcribed 2026-09-30 by eye from the scans (no text layer), each read at 3x.
 * Two checks hold on every row and are pinned in lpg-prices.test.ts: the 12 kg
 * price is 12 x the per-kg price to within Tk 1 (BERC rounds from an unrounded
 * rate — May 2026 prints 1,940 where 12 x 161.71 is 1,940.52, and its 22 kg
 * figure confirms 161.71), and the CP average is 0.35 x propane + 0.65 x butane.
 * Figures are printed as BERC printed them and never recomputed. Documents,
 * hashes and archive names: evidence/lpg/manifest.json.
 *
 * A price is the price until the next notification. It is not a quote for today
 * and has no daily delta.
 */

export type LpgNoticeKind = 'monthly' | 'vat' | 'interim';

export interface LpgPriceNotice {
  /** As printed at the head of the notification. */
  memoNo: string;
  issuedOn: string;
  /** The instant the notification says the price applies from (BST). */
  effectiveFrom: string;
  kind: LpgNoticeKind;
  /** Why a notice fell between months, in the notice's own terms. */
  reason?: string;
  /** USD per metric tonne. Null where the notice restates no CP (the VAT change). */
  saudiCpUsdPerTonne: { propane: number; butane: number; average: number } | null;
  /** Retail, VAT included, Tk per kg. */
  perKgTk: number;
  /** Retail, VAT included, Tk per 12 kg cylinder — the household size. */
  cylinder12KgTk: number;
  /** Retail, VAT included, Tk per litre. */
  autogasPerLitreTk: number;
  /** Key into evidence/lpg/manifest.json. */
  evidenceId: string;
  sourceUrl: string;
}

/** Newest first. */
export const LPG_PRICE_HISTORY: readonly LpgPriceNotice[] = [
  {
    memoNo: '28.01.0000.012.17.002.26.3176',
    issuedOn: '2026-09-02',
    effectiveFrom: '2026-09-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 625, butane: 660, average: 647.75 },
    perKgTk: 132.12,
    cylinder12KgTk: 1585,
    autogasPerLitreTk: 73.09,
    evidenceId: 'berc-lpg-2026-09-02-3176',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/8/fa4449eb-6432-4fce-b075-73557f0d0de7.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.3096',
    issuedOn: '2026-08-02',
    effectiveFrom: '2026-08-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 620, butane: 640, average: 633.00 },
    perKgTk: 133.15,
    cylinder12KgTk: 1598,
    autogasPerLitreTk: 73.67,
    evidenceId: 'berc-lpg-2026-08-02-3096',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/7/4b74e218-b1d1-483f-b87a-90a4e01317f2.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.3011',
    issuedOn: '2026-07-02',
    effectiveFrom: '2026-07-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 580, butane: 600, average: 593.00 },
    perKgTk: 127.30,
    cylinder12KgTk: 1528,
    autogasPerLitreTk: 70.40,
    evidenceId: 'berc-lpg-2026-07-02-3011',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/6/68f0b8e7-f1ef-4b75-b575-e1e794f587c7.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.2500',
    issuedOn: '2026-06-02',
    effectiveFrom: '2026-06-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 760, butane: 820, average: 799.00 },
    perKgTk: 157.06,
    cylinder12KgTk: 1885,
    autogasPerLitreTk: 86.93,
    evidenceId: 'berc-lpg-2026-06-02-2500',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/5/590e2933-e59c-4da3-a662-4696dd65533e.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.2059',
    issuedOn: '2026-05-03',
    effectiveFrom: '2026-05-03T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 750, butane: 800, average: 782.50 },
    perKgTk: 161.71,
    cylinder12KgTk: 1940,
    autogasPerLitreTk: 89.52,
    evidenceId: 'berc-lpg-2026-05-03-2059',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/4/00dfebc1-6ab8-4eec-9944-7d60b818ce39.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.1830',
    issuedOn: '2026-04-19',
    effectiveFrom: '2026-04-19T18:00+06:00',
    kind: 'interim',
    reason: "Freight and trader premium raised from USD 120 to USD 250 per tonne (Hormuz strait crisis)",
    saudiCpUsdPerTonne: { propane: 750, butane: 800, average: 782.50 },
    perKgTk: 161.66,
    cylinder12KgTk: 1940,
    autogasPerLitreTk: 89.50,
    evidenceId: 'berc-lpg-2026-04-19-1830',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/3/94e00d24-06e7-4381-a9e9-7cca3b9488bd.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.1499',
    issuedOn: '2026-04-02',
    effectiveFrom: '2026-04-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 750, butane: 800, average: 782.50 },
    perKgTk: 144.04,
    cylinder12KgTk: 1728,
    autogasPerLitreTk: 79.77,
    evidenceId: 'berc-lpg-2026-04-02-1499',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/3/9c550b9f-0812-4b41-b408-d7982f4398cb.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.999',
    issuedOn: '2026-03-02',
    effectiveFrom: '2026-03-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 545, butane: 540, average: 541.75 },
    perKgTk: 111.74,
    cylinder12KgTk: 1341,
    autogasPerLitreTk: 61.83,
    evidenceId: 'berc-lpg-2026-03-02-999',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/2/390f681f-83f7-45da-9916-a859a54a2add.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.889',
    issuedOn: '2026-02-23',
    effectiveFrom: '2026-02-23T18:00+06:00',
    kind: 'vat',
    reason: "VAT moved from production to import stage at 7.5% (SRO 51 and 52-Ain/2026/Mushak, 16 Feb 2026)",
    saudiCpUsdPerTonne: null,
    perKgTk: 111.79,
    cylinder12KgTk: 1341,
    autogasPerLitreTk: 61.86,
    evidenceId: 'berc-lpg-2026-02-23-889',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2026/1/35b9bb18-28aa-40d8-b83e-8a85b8745727.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.26.036',
    issuedOn: '2026-01-04',
    effectiveFrom: '2026-01-04T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 525, butane: 520, average: 521.75 },
    perKgTk: 108.83,
    cylinder12KgTk: 1306,
    autogasPerLitreTk: 59.80,
    evidenceId: 'berc-lpg-2026-01-04-036',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2024/12/7ccf2034851d4fe7a9553045dfcaf134.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.25.6153',
    issuedOn: '2025-12-02',
    effectiveFrom: '2025-12-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 495, butane: 485, average: 488.50 },
    perKgTk: 104.41,
    cylinder12KgTk: 1253,
    autogasPerLitreTk: 57.32,
    evidenceId: 'berc-lpg-2025-12-02-6153',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2024/12/b53b33a0de9a4f7a9b09034bcec3c572.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.25.5508',
    issuedOn: '2025-11-02',
    effectiveFrom: '2025-11-02T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 475, butane: 460, average: 465.25 },
    perKgTk: 101.24,
    cylinder12KgTk: 1215,
    autogasPerLitreTk: 55.58,
    evidenceId: 'berc-lpg-2025-11-02-5508',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2024/12/28a6b62735b7475eb2acfd673113320a.pdf',
  },
  {
    memoNo: '28.01.0000.012.17.002.25.5058',
    issuedOn: '2025-10-07',
    effectiveFrom: '2025-10-07T18:00+06:00',
    kind: 'monthly',
    saudiCpUsdPerTonne: { propane: 495, butane: 475, average: 482.00 },
    perKgTk: 103.40,
    cylinder12KgTk: 1241,
    autogasPerLitreTk: 56.77,
    evidenceId: 'berc-lpg-2025-10-07-5058',
    sourceUrl: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-berc/2024/12/d3d1e6350bf54c61af121e30cf65f56a.pdf',
  },
];

/**
 * Every cylinder size in the newest notification, Tk, VAT included. Taken for
 * the current notice only; the history above carries the per-kg and 12 kg
 * figures, from which no other size is derived here.
 */
export const CURRENT_CYLINDER_PRICES: readonly { kg: number; tk: number }[] = [
  { kg: 5.5, tk: 727 },
  { kg: 12, tk: 1585 },
  { kg: 12.5, tk: 1652 },
  { kg: 15, tk: 1982 },
  { kg: 16, tk: 2114 },
  { kg: 18, tk: 2378 },
  { kg: 20, tk: 2642 },
  { kg: 22, tk: 2907 },
  { kg: 25, tk: 3303 },
  { kg: 30, tk: 3964 },
  { kg: 33, tk: 4360 },
  { kg: 35, tk: 4624 },
  { kg: 45, tk: 5945 },
];

/** Piped (reticulated) private LPG in the newest notification. */
export const CURRENT_RETICULATED = { liquidPerKgTk: 128.37, gasPerCubicMetreTk: 285.3 } as const;

/**
 * Government LPG (LP Gas Ltd), 12.5 kg at the dealer/retailer point. Not set
 * monthly: BERC Order 2026/06 of 23 Feb 2026, restated unchanged in every
 * notification since; Tk 825 under Order 2025/07 before it.
 */
export const GOVERNMENT_CYLINDER = { kg: 12.5, tk: 776.93, order: 'BERC Order 2026/06', since: '2026-02-23' } as const;

export const CURRENT_LPG_NOTICE: LpgPriceNotice = LPG_PRICE_HISTORY[0];
