/**
 * Bengali for the grid comparison, and the one thing a number alone cannot say:
 * whether going up was good news.
 *
 * Deliberately not `server-only`. The panel renders these labels and the
 * exporters write them into a .docx and a .pdf, so the table has to live where
 * both can reach it.
 *
 * ## What is translated, and what is not
 *
 * The fixed metrics are — system, shedding, gas, reliability and the section
 * headings. The data-derived ones are not: fuels, zones, interconnectors, gas
 * fields, power stations and the 200-odd substations arrive as PGCB and
 * Petrobangla spell them, in their own sheets, in English. A Bengali rendering
 * of those would be a mapping we invented, and every name PGCB added later
 * would silently fall back to English anyway — so the well-known ones are
 * mapped by hand below and the rest are left as the archive prints them.
 * `metricLabel` falls back to the English label for anything unmapped, which is
 * the same thing the published year-on-year sheet does.
 */

export type Lang = 'en' | 'bn';

/* ── polarity ────────────────────────────────────────────────────────────── */

/**
 * Which way is up.
 *
 * `good` — more is better: generation, gas produced, energy served.
 * `bad`  — more is worse: shedding, unserved energy, outages, cost.
 * `flat` — a change that is neither: demand, temperature, a count of hours.
 *
 * Demand is the one worth explaining. A hotter day pushing demand up is not
 * good news or bad news on its own — it is the *gap* between demand and
 * generation that is the story, and that gap has its own rows. Colouring demand
 * green for rising would read as "demand grew, well done"; colouring it red
 * would read as "demand grew, this is a failure". Both are editorial claims the
 * sheet has no business making, so demand is left uncoloured.
 */
export type Polarity = 'good' | 'bad' | 'flat';

/** Matched in order; the first hit wins. */
const POLARITY_RULES: Array<[RegExp, Polarity]> = [
  // Shortfall, in every form either engine names it.
  [/^shedding\./, 'bad'],
  [/^outages\./, 'bad'],
  [/^reliability\./, 'bad'],
  [/^interruptions\./, 'bad'],
  [/shed/i, 'bad'],
  [/unserved/i, 'bad'],
  [/interrupt/i, 'bad'],
  [/outage/i, 'bad'],
  // Cost. Cheaper power is better news for the consumer, which is the reader
  // this sheet is written for.
  [/cost$/i, 'bad'],
  [/^system\.(avgProductionCost|totalDailyCost)$/, 'bad'],
  // Demand and the weather: real, but not a scoreline. See above.
  [/demand/i, 'flat'],
  [/^system\.maxTemp$/, 'flat'],
  [/temp/i, 'flat'],
  [/^shedding\.hoursAffected$/, 'bad'],
  // Supply.
  [/^system\.(eveningPeakGen|dayPeakGen|maxGen|minGen|totalEnergyGen|totalNetGeneration)$/, 'good'],
  [/^generation\./, 'good'],
  [/^fuel\./, 'good'],
  [/^gas\./, 'good'],
  [/^gasFields\./, 'good'],
  [/^stations\./, 'good'],
  [/^imports\./, 'good'],
  [/^substations\./, 'good'],
  [/^regional\..*\.demand$/, 'flat'],
  [/^regional\./, 'good'],
  [/^zones\./, 'good'],
];

/**
 * The polarity of one metric id. Anything unmatched is `flat` — an unknown
 * metric gets no colour rather than a guessed one, because a wrong colour is a
 * wrong claim about the day and is worse than no colour at all.
 */
export function polarityOf(id: string): Polarity {
  for (const [re, p] of POLARITY_RULES) if (re.test(id)) return p;
  return 'flat';
}

/** Whether a change is an improvement, a worsening, or neither. */
export type Verdict = 'up' | 'down' | 'none';

export function verdictOf(id: string, delta: number | null): Verdict {
  if (delta === null || delta === 0) return 'none';
  const p = polarityOf(id);
  if (p === 'flat') return 'none';
  const rose = delta > 0;
  return (p === 'good') === rose ? 'up' : 'down';
}

/* ── section headings ────────────────────────────────────────────────────── */

const SECTION_BN: Record<string, string> = {
  system: 'সিস্টেম',
  shedding: 'লোডশেডিং',
  gas: 'গ্যাস',
  gasFields: 'গ্যাসক্ষেত্র',
  stations: 'বিদ্যুৎকেন্দ্র',
  generation: 'জ্বালানিভিত্তিক উৎপাদন',
  imports: 'আন্তঃসীমান্ত আমদানি',
  regional: 'অঞ্চলভিত্তিক চাহিদা',
  outages: 'বিভ্রাট',
  fuel: 'জ্বালানিভিত্তিক উৎপাদন',
  reliability: 'নির্ভরযোগ্যতা',
  zones: 'পূর্ব / পশ্চিম',
  substations: 'উপকেন্দ্রের সর্বোচ্চ লোড',
  interruptions: 'সরবরাহ বিঘ্ন',
};

export function sectionLabel(id: string, english: string, lang: Lang): string {
  if (lang === 'en') return english;
  return SECTION_BN[id] ?? english;
}

/* ── metric labels ───────────────────────────────────────────────────────── */

/**
 * Keyed by metric id, not by English label: two engines can print the same
 * words for different things, and an id is stable while a label is prose the
 * desk may reword.
 */
const METRIC_BN: Record<string, string> = {
  /* daily — system */
  'system.eveningPeakDemand': 'সন্ধ্যার সর্বোচ্চ চাহিদা',
  'system.eveningPeakGen': 'সন্ধ্যার সর্বোচ্চ উৎপাদন',
  'system.dayPeakDemand': 'দিনের সর্বোচ্চ চাহিদা',
  'system.dayPeakGen': 'দিনের সর্বোচ্চ উৎপাদন',
  'system.maxGen': 'সর্বোচ্চ উৎপাদন',
  'system.minGen': 'সর্বনিম্ন উৎপাদন (৮টা)',
  'system.totalEnergyGen': 'দিনভর মোট উৎপাদন',
  'system.totalEnergyDemand': 'দিনভর মোট চাহিদা',
  'system.totalEnergyUnserved': 'অসরবরাহকৃত বিদ্যুৎ',
  'system.maxTemp': 'সর্বোচ্চ তাপমাত্রা',
  'system.avgProductionCost': 'গড় উৎপাদন খরচ',
  'system.totalDailyCost': 'মোট উৎপাদন খরচ',

  /* daily — shedding */
  'shedding.total': 'মোট লোডশেডিং',
  'shedding.peakHour': 'সর্বোচ্চ লোডশেডিংয়ের ঘণ্টা',
  'shedding.hoursAffected': 'লোডশেডিং হওয়া ঘণ্টা',

  /* daily — gas */
  'gas.total': 'মোট গ্যাস উৎপাদন',
  'gas.domestic': 'দেশীয় গ্যাস উৎপাদন',
  'gas.lng': 'এলএনজি (আর-এলএনজি) সরবরাহ',
  'gas.toPower': 'বিদ্যুৎ খাতে গ্যাস সরবরাহ',
  'gas.offtakePower': 'ব্যবহার — বিদ্যুৎ',
  'gas.offtakeFertilizer': 'ব্যবহার — সার',
  'gas.offtakeOthers': 'ব্যবহার — অন্যান্য',

  /* daily — outages */
  'outages.count': 'রিপোর্ট করা বিভ্রাট',

  /* monthly */
  'system.maxEveningPeakGen': 'সর্বোচ্চ সন্ধ্যাকালীন উৎপাদন',
  'system.maxEveningPeakDemand': 'সর্বোচ্চ সন্ধ্যাকালীন চাহিদা',
  'system.totalNetGeneration': 'মোট নিট উৎপাদন',
  'fuel.total': 'জ্বালানিভিত্তিক উৎপাদনের যোগফল',
};

/** Units are short and appear in every row; they are worth translating. */
const UNIT_BN: Record<string, string> = {
  MW: 'মেগাওয়াট',
  MWh: 'মেগাওয়াট-ঘণ্টা',
  MKWh: 'মিলিয়ন ইউনিট',
  MMCFD: 'মিলিয়ন ঘনফুট',
  'crore Tk': 'কোটি টাকা',
  'Tk/kWh': 'টাকা/কিলোওয়াট-ঘণ্টা',
  '°C': 'ডিগ্রি সে.',
  hours: 'ঘণ্টা',
  count: 'সংখ্যা',
  days: 'দিন',
  '%': '%',
};

export function metricLabel(id: string, english: string, lang: Lang): string {
  if (lang === 'en') return english;
  return METRIC_BN[id] ?? english;
}

export function unitLabel(unit: string, lang: Lang): string {
  if (lang === 'en') return unit;
  return UNIT_BN[unit] ?? unit;
}

/* ── Bengali numerals ────────────────────────────────────────────────────── */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Digits only. Grouping, sign and decimal point are already in the string. */
export function toBnDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/* ── panel and document chrome ───────────────────────────────────────────── */

/**
 * One flat table rather than nested namespaces: the panel is a single screen,
 * the keys are read once each, and a flat list is what makes a missing
 * translation obvious at a glance.
 */
export const UI = {
  en: {
    modeSheet: 'Year-on-year sheet',
    modeCompare: 'Compare two days',
    modeRange: 'Range export',
    modeMonths: 'Compare months',

    metric: 'Metric',
    unit: 'Unit',
    change: 'Change',
    changePct: 'Change %',
    note: 'Note',
    sections: 'Sections',
    metrics: 'Metrics',
    showAll: 'Show all',
    energyDay: 'Energy day',
    firstDay: 'First day',
    secondDay: 'Second day',
    firstMonth: 'First month',
    secondMonth: 'Second month',
    start: 'Start',
    end: 'End',
    startMonth: 'Start month',
    endMonth: 'End month',

    copy: 'Copy',
    copied: 'Copied',
    download: 'Download',
    saveToArchive: 'Save to archive folder',
    buildRange: 'Build range',
    building: 'Building…',
    comparing: 'Comparing…',
    reading: 'Reading the archive…',
    preparing: 'Preparing…',

    language: 'Language',
    english: 'English',
    bengali: 'বাংলা',

    improved: 'improved',
    worsened: 'worsened',
    unchanged: 'no change',
    unpublishedShort: 'not published',

    blurbSheet:
      'The same day one year apart, in the fixed format the desk publishes. Grid and gas are both read from the chosen energy day — Petrobangla files the 08:00–08:00 window under the following date, so a day is only ready once that report has landed.',
    blurbCompare:
      'Any two archived days, side by side — no year-apart constraint. A figure a day did not publish shows as — with the reason beside it, and gets no percentage; it is never read as zero.',
    blurbMonths:
      'PGCB’s monthly reports, side by side — a different document from the daily one, with substation max loads, interruption counts and unserved energy the daily report never carries. A figure a month did not publish shows as — with the reason beside it; it is never read as zero.',

    legendGreen: 'Green',
    legendRed: 'red',
    legendBody:
      'is an improvement for that metric and {red} a worsening — so shedding falling is green and shedding rising is red. Demand and temperature are never coloured: a change in either is neither good nor bad on its own.',

    docTitle: 'ESB POWER LINE — GRID COMPARISON',
    docSource: 'Source: PGCB daily report and Petrobangla daily gas report.',
    docDashRule:
      '— means the figure was not published for that day; it is never treated as zero.',
    docGenerated: 'Generated',
  },
  bn: {
    modeSheet: 'বার্ষিক তুলনামূলক শিট',
    modeCompare: 'দুই দিনের তুলনা',
    modeRange: 'সময়সীমা রপ্তানি',
    modeMonths: 'দুই মাসের তুলনা',

    metric: 'সূচক',
    unit: 'একক',
    change: 'পরিবর্তন',
    changePct: 'পরিবর্তন %',
    note: 'মন্তব্য',
    sections: 'বিভাগ',
    metrics: 'সূচকসমূহ',
    showAll: 'সব দেখান',
    energyDay: 'জ্বালানি দিবস',
    firstDay: 'প্রথম দিন',
    secondDay: 'দ্বিতীয় দিন',
    firstMonth: 'প্রথম মাস',
    secondMonth: 'দ্বিতীয় মাস',
    start: 'শুরু',
    end: 'শেষ',
    startMonth: 'শুরুর মাস',
    endMonth: 'শেষের মাস',

    copy: 'কপি',
    copied: 'কপি হয়েছে',
    download: 'ডাউনলোড',
    saveToArchive: 'আর্কাইভ ফোল্ডারে সংরক্ষণ',
    buildRange: 'সময়সীমা তৈরি করুন',
    building: 'তৈরি হচ্ছে…',
    comparing: 'তুলনা করা হচ্ছে…',
    reading: 'আর্কাইভ পড়া হচ্ছে…',
    preparing: 'প্রস্তুত হচ্ছে…',

    language: 'ভাষা',
    english: 'English',
    bengali: 'বাংলা',

    improved: 'উন্নতি',
    worsened: 'অবনতি',
    unchanged: 'অপরিবর্তিত',
    unpublishedShort: 'প্রকাশিত হয়নি',

    blurbSheet:
      'এক বছরের ব্যবধানে একই দিন, দপ্তর যে নির্দিষ্ট বিন্যাসে প্রকাশ করে সেই বিন্যাসে। গ্রিড ও গ্যাস — দুটিই নির্বাচিত জ্বালানি দিবস থেকে নেওয়া; পেট্রোবাংলা ৮টা–৮টা সময়সীমাটি পরের দিনের নামে দাখিল করে, তাই ওই প্রতিবেদন না আসা পর্যন্ত দিনটি প্রস্তুত হয় না।',
    blurbCompare:
      'আর্কাইভের যেকোনো দুই দিন, পাশাপাশি — এক বছরের ব্যবধান থাকা বাধ্যতামূলক নয়। যেদিনের সংখ্যা প্রকাশিত হয়নি তা — হিসেবে দেখানো হয়, পাশে কারণসহ, এবং তার কোনো শতাংশ দেওয়া হয় না; এটি কখনো শূন্য ধরা হয় না।',
    blurbMonths:
      'পিজিসিবির মাসিক প্রতিবেদন, পাশাপাশি — দৈনিক প্রতিবেদন থেকে আলাদা একটি নথি, যাতে উপকেন্দ্রের সর্বোচ্চ লোড, সরবরাহ বিঘ্নের সংখ্যা ও অসরবরাহকৃত বিদ্যুতের হিসাব থাকে, যা দৈনিক প্রতিবেদনে কখনো থাকে না। যে মাসের সংখ্যা প্রকাশিত হয়নি তা — হিসেবে দেখানো হয়, পাশে কারণসহ; এটি কখনো শূন্য ধরা হয় না।',

    legendGreen: 'সবুজ',
    legendRed: 'লাল',
    legendBody:
      'মানে ওই সূচকের উন্নতি এবং {red} মানে অবনতি — তাই লোডশেডিং কমলে সবুজ, বাড়লে লাল। চাহিদা ও তাপমাত্রায় কখনো রং দেওয়া হয় না: এ দুটির পরিবর্তন নিজে থেকে ভালোও নয়, খারাপও নয়।',

    docTitle: 'ইএসবি পাওয়ারলাইন — গ্রিড তুলনা',
    docSource: 'সূত্র: পিজিসিবি দৈনিক প্রতিবেদন ও পেট্রোবাংলা দৈনিক গ্যাস প্রতিবেদন।',
    docDashRule: '— অর্থ ওই দিনের জন্য সংখ্যাটি প্রকাশিত হয়নি; এটি কখনো শূন্য ধরা হয় না।',
    docGenerated: 'তৈরি',
  },
} as const;

export type UiStrings = (typeof UI)['en'];

export function strings(lang: Lang): UiStrings {
  return UI[lang] as UiStrings;
}
