export const PB_ARCHIVE_COLORS = {
  domestic: '#0ea5e9',
  lng: '#a855f7',
  shortage: '#ef4444',
  fertilizer: '#f59e0b',
  others: '#64748b',
  /** Near-white — stack fills only; use totalLine for chart strokes and legends */
  total: '#f8fafc',
  totalLine: '#94a3b8',
  ma: '#64748b',
  powerDemand: '#ef4444',
  /** Power supply area — matches grid explorer orange accent */
  powerSupply: '#f97316',
  national: '#0ea5e9',
} as const;

export const QUARANTINE_DATES = new Set([
  '2020-02-04',
  '2020-02-05',
  '2020-03-06',
  '2020-09-17',
  '2020-10-16',
  '2020-10-17',
  '2020-10-18',
  '2020-10-19',
  '2025-05-20',
  '2025-05-21',
  '2025-05-22',
  '2026-02-22',
]);

export const ARCHIVE_BASELINE_DATE = '2020-01-11';
export const ARCHIVE_BASELINE_GAS = 3167.9;
export const ARCHIVE_START_DATE = '2020-01-11';

export const MAJOR_FIELDS = [
  'Bibiyana',
  'Titas',
  'Jalalabad',
  'Habiganj',
  'Rashidpur',
  'Shahbazpur',
  'R-LNG Terminal',
  'Bangora',
] as const;

export type FieldLifelineMeta = {
  operator: string;
  basin: string;
  role: string;
  simple: string;
  analyst: string;
  investor: string;
  researcher: string;
};

/** Context for Field Lifelines cards — hover copy varies by audience mode */
export const FIELD_LIFELINE_META: Record<(typeof MAJOR_FIELDS)[number], FieldLifelineMeta> = {
  Bibiyana: {
    operator: 'Chevron · Sylhet-10 block',
    basin: 'Surma Basin, northeast Bangladesh',
    role: 'Largest domestic producer — anchors national supply and power-sector gas',
    simple: 'Bangladesh\'s biggest gas field. When Bibiyana output falls, the whole country feels it in electricity and fertilizer.',
    analyst: 'Peak ~1,300 MMCFD (2020) → ~750 MMCFD now on 26 wells. Decline rate ~4% /yr — watch well-head pressure and compression load.',
    investor: 'Single-field concentration risk: often >25% of domestic supply. Any trip or accelerated decline hits IPP dispatch and LNG import bills.',
    researcher: 'Sylhet-10 · Chevron-operated · 26 producing wells · capacity utilisation tracked daily in Petrobangla filings.',
  },
  Titas: {
    operator: 'BAPEX / Sylhet Gas fields',
    basin: 'Brahmanbaria · legacy onshore',
    role: 'Historic workhorse field — still material for Dhaka–Chittagong corridor demand',
    simple: 'One of the oldest big fields. Production is steady but far below its glory years.',
    analyst: 'Mature depletion curve; output sensitive to workover campaigns and compression. Correlates with Titas–Dhaka pipeline flows.',
    investor: 'Low growth asset — decline is gradual, but replacement cost for equivalent volume is imported LNG at 3–4× cost.',
    researcher: 'Onshore BAPEX-operated · long producing history since 1960s · daily well count in archive JSON.',
  },
  Jalalabad: {
    operator: 'SGFL (Sylhet Gas Fields Ltd.)',
    basin: 'Sylhet · northeast',
    role: 'Regional supply for Sylhet division and adjacent industrial clusters',
    simple: 'Feeds gas to factories and towns in the Sylhet region.',
    analyst: 'Moderate decline; seasonal swing visible in winter demand peaks. Pair with Habiganj for northeast basin view.',
    investor: 'Small relative to Bibiyana — limited upside, but northeast industrial parks depend on its reliability.',
    researcher: 'SGFL-operated onshore · Surma flank · archive tracks producing wells and capacity MMCFD daily.',
  },
  Habiganj: {
    operator: 'SGFL',
    basin: 'Sylhet · Habiganj district',
    role: 'Northeast domestic supply — pairs with Jalalabad for regional balance',
    simple: 'Another Sylhet-area field helping keep the northeast supplied.',
    analyst: 'Decline trajectory similar to peer northeast fields. Useful early indicator for Surma basin stress.',
    investor: 'Marginal volume but geographically critical — pipeline outages here strand local industry before LNG can compensate.',
    researcher: 'SGFL · onshore · daily gas_mmcfd and producing_wells in Petrobangla production table.',
  },
  Rashidpur: {
    operator: 'SGFL / BAPEX consortium',
    basin: 'Brahmanbaria · central-east',
    role: 'Mid-size domestic contributor — buffer between Sylhet giants and western fields',
    simple: 'A mid-sized field that helps balance supply between regions.',
    analyst: 'Lower peak than Titas/Bibiyana; watch for step-changes after workovers. Good comparator for basin-wide decline rates.',
    investor: 'Non-core for growth investors — stabilising volume with limited reserve upside.',
    researcher: 'Central-east onshore · tracked in major_fields timeline series since Jan 2020.',
  },
  Shahbazpur: {
    operator: 'Bapex · Bhola district',
    basin: 'Bhola North · offshore-adjacent southern delta',
    role: 'Southern Bangladesh supply — supports Barisal division and south-grid gas',
    simple: 'The main gas source for southern Bangladesh (Barisal area).',
    analyst: 'Bhola cluster output influences south-grid allocation. Decline here raises south-to-north transfer dependency.',
    investor: 'Geographic diversification value — reduces sole reliance on northeast Bibiyana–Titas axis.',
    researcher: 'Bhola North structure · BAPEX · southern delta archive series · compare with Bangora cluster.',
  },
  'R-LNG Terminal': {
    operator: 'RPGCL (Rupantarita Prakritic Gas Company)',
    basin: 'Moheshkhali FSRU · offshore LNG import',
    role: 'Imported LNG regasification — fills the gap as domestic fields deplete',
    simple: 'Imported liquefied gas from ships — not from underground wells. Expensive but keeps the lights on.',
    analyst: 'LNG share of national gas rose from ~19% (2020) to ~38% (2026). Terminal utilisation swings with spot cargo arrivals.',
    investor: 'Structural cost shift: every 100 MMCFD of LNG adds ~$350–450M/yr import bill at current JKM-linked pricing.',
    researcher: 'RPGCL company_code in JSON · regasified MMCFD reported as field row · cross-check with national LNG share KPI.',
  },
  Bangora: {
    operator: 'BAPEX · Bhola',
    basin: 'Bhola · southern delta cluster',
    role: 'Southern delta production — complements Shahbazpur for south-grid reliability',
    simple: 'Part of the southern gas cluster keeping Barisal and nearby areas supplied.',
    analyst: 'Smaller producer but rising share of southern supply as northeast fields decline. Monitor with Shahbazpur combined.',
    investor: 'Incremental domestic volume in a growth region — modest but offsets LNG import in south grid.',
    researcher: 'Bhola cluster · BAPEX-operated · daily archive since 2020 in major_fields timeline.',
  },
};

export const ARCHIVE_INSIGHTS = {
  jan2020Baseline: { gas: 3167.9, date: '2020-01-11', powerFulfillment: 55.2 },
  jun2026Latest: { gas: 2643.0, date: '2026-06-30', powerFulfillment: 39.6 },
  nationalDecline: { mmcfd: -524.9, pct: -16.6 },
  bibiyanaDecline: { from: 1301, to: 753, pct: -42, wells: 26 },
  lngRamp: { from: 592, to: 1003, pct: 69 },
  powerFulfillmentCollapse: { from: 55.2, to: 39.6 },
  totalFieldRecords: 51948,
  coverageDays: 2246,
  coverageEnd: '2026-06-30', // latest ok gas-day in archive index
} as const;

export function isQuarantined(date: string): boolean {
  return QUARANTINE_DATES.has(date);
}

/** Official site where daily gas intake/offtake reports are published */
export const PETROBANGLA_OFFICIAL_SITE = 'https://www.petrobangla.org.bd/';

export const PETROBANGLA_OFFICIAL_LABEL = 'Petrobangla P&D Division';