import 'server-only';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import type { GridDailyData } from '@/lib/data/grid/types';
import type { Lang } from '@/lib/data/grid/comparison-i18n';

/**
 * Year-on-year comparison sheet for any energy day — a TypeScript port of
 * `scripts/build_yoy_comparison.py`, reproducing its output byte for byte
 * (Bengali numerals, column widths, arrows and footer all unchanged) so the
 * CMS can generate the same file the script does.
 *
 * Two rules the script encodes, kept here because both are easy to get wrong:
 *
 * 1. **Grid and gas must come from the same energy day.** Petrobangla files the
 *    08:00-to-08:00 window that OPENS on energy day D under D+1, so reading
 *    "the report filed that morning" pairs one day's gas with the next day's
 *    electricity. Both columns read the archive day `{day}.json`, whose gas
 *    sections were already resolved to that day's own window by the ingest.
 *
 * 2. **Cost is stored in taka.** A crore is 1e7; dividing by anything else puts
 *    the row out by an order of magnitude.
 */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

const EN_MONTHS_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type FigureKey =
  | 'evD' | 'evG' | 'shed' | 'gasPwr' | 'dom' | 'lng' | 'tot' | 'energy' | 'cost';

/**
 * The nine rows the desk publishes, in the order it publishes them.
 *
 * `id` is the comparison engine's metric id for the same figure. Nothing in the
 * sheet itself needs it — it is what lets the panel ask `verdictOf` whether a
 * move was an improvement, so the sheet is coloured by the same rule as every
 * other table here rather than by a second one that could disagree with it.
 */
type SheetRowDef = {
  id: string;
  bn: [label: string, unit: string];
  en: [label: string, unit: string];
  key: FigureKey;
};

const ROWS: SheetRowDef[] = [
  {
    id: 'system.eveningPeakDemand',
    bn: ['সন্ধ্যার সর্বোচ্চ চাহিদা', 'মেগাওয়াট'],
    en: ['Evening peak demand', 'MW'],
    key: 'evD',
  },
  {
    id: 'system.eveningPeakGen',
    bn: ['সন্ধ্যার সর্বোচ্চ উৎপাদন', 'মেগাওয়াট'],
    en: ['Evening peak generation', 'MW'],
    key: 'evG',
  },
  {
    id: 'shedding.total',
    bn: ['লোডশেডিং', 'মেগাওয়াট'],
    en: ['Load shedding', 'MW'],
    key: 'shed',
  },
  {
    id: 'gas.toPower',
    bn: ['বিদ্যুৎ খাতে গ্যাস সরবরাহ', 'মিলিয়ন ঘনফুট'],
    en: ['Gas supplied to power', 'MMCFD'],
    key: 'gasPwr',
  },
  {
    id: 'gas.domestic',
    bn: ['দেশীয় গ্যাস উৎপাদন', 'মিলিয়ন ঘনফুট'],
    en: ['Domestic gas production', 'MMCFD'],
    key: 'dom',
  },
  {
    id: 'gas.lng',
    bn: ['এলএনজি সরবরাহ', 'মিলিয়ন ঘনফুট'],
    en: ['LNG supply', 'MMCFD'],
    key: 'lng',
  },
  {
    id: 'gas.total',
    bn: ['মোট গ্যাস উৎপাদন', 'মিলিয়ন ঘনফুট'],
    en: ['Total gas production', 'MMCFD'],
    key: 'tot',
  },
  {
    id: 'system.totalEnergyGen',
    bn: ['দিনভর মোট উৎপাদন', 'মিলিয়ন ইউনিট'],
    en: ['Total energy generated', 'MKWh'],
    key: 'energy',
  },
  {
    id: 'system.totalDailyCost',
    bn: ['বিদ্যুৎ উৎপাদন খরচ', 'কোটি টাকা'],
    en: ['Generation cost', 'crore Tk'],
    key: 'cost',
  },
];

/** A calendar day, kept as plain parts so no timezone can shift it. */
type Day = { year: number; month: number; day: number };

/** One published row, with both years and the move between them. */
export type YoyRow = {
  /** The comparison engine's id for the same figure; drives the colour. */
  id: string;
  label: string;
  unit: string;
  a: number;
  b: number;
  /** Percent change. Null only when the earlier year was zero. */
  pct: number | null;
  /**
   * The three figures already formatted, exactly as the text block prints them
   * — same rounding, same grouping, same numerals, same sub-1% decimal rule.
   *
   * The table is a preview of that text, so it must not format them a second
   * time: doing so showed 15501.36 above a sheet that says 15,501, and the two
   * would drift again the moment either rounding changed.
   */
  aText: string;
  bText: string;
  /**
   * The change between the two years, and the same figure formatted.
   *
   * Computed from the ROUNDED figures, not the raw ones, so the row adds up on
   * screen. The sheet publishes whole numbers: 15,501 and 18,071. The raw
   * difference is 2,569.43, which rounds to 2,569 — and a reader checking that
   * against the two columns beside it gets 2,570 and concludes the table
   * cannot subtract. The gap is 0.57 of a megawatt, well under the precision
   * the sheet states, so the honest presentation is the one that agrees with
   * the figures it is printed next to.
   *
   * The percentage is deliberately still taken from the raw values: at nought
   * or one decimal place it cannot visibly disagree with either, and it is the
   * more accurate of the two.
   */
  delta: number;
  deltaText: string;
  /**
   * Never null, even when `pct` is.
   *
   * A zero base is not hypothetical — load shedding was 0 MW on 2025-08-15 and
   * 2025-12-31 — and the published sheet prints `▲ ০.০%` for it rather than a
   * dash. That is the format, byte for byte, so this reproduces it; `pct` stays
   * null so the table can say the percentage means nothing there.
   */
  pctText: string;
};

export type YoyResult =
  | {
      ok: true;
      date: string;
      text: string;
      filename: string;
      /** The same nine figures the text prints, for the panel to draw. */
      rows: YoyRow[];
      /** Column headings: the two years, in the output language. */
      aLabel: string;
      bLabel: string;
      /**
       * The sheet's own title, dateline and footnotes, as separate strings.
       *
       * The .docx and .pdf lay the sheet out as a table — the same table the
       * panel previews — so they need these pieces individually rather than
       * embedded in a column-padded text block. They are built from the same
       * values as `text` a few lines below, so the document and the published
       * file cannot end up saying different things.
       */
      heading: string;
      subheading: string;
      footer: string[];
      lang: Lang;
    }
  | { ok: false; date: string; reason: string };

/* ── Formatting ─────────────────────────────────────────────────────────── */

function toBnDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Add one to a plain digit string — the carry a rounded-up figure needs. */
function incrementDigits(digits: string): string {
  const out = digits.split('');
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] === '9') { out[i] = '0'; continue; }
    out[i] = String(Number(out[i]) + 1);
    return out.join('');
  }
  return `1${out.join('')}`;
}

/**
 * Round the exact decimal expansion of `value` half-to-even, the way Python's
 * `format(x, '.Nf')` does. `toFixed` breaks ties away from zero instead, so a
 * figure landing exactly on .5 would drift one unit from the script's output.
 */
function roundHalfEven(value: number, decimals: number): { int: string; frac: string } {
  // 60 fractional digits is exact for every magnitude this sheet carries.
  const exact = Math.abs(value).toFixed(60);
  const [intPart, fracPart] = exact.split('.');
  const keep = fracPart.slice(0, decimals).padEnd(decimals, '0');
  const rest = fracPart.slice(decimals);

  let roundUp = false;
  if (rest) {
    const first = rest[0];
    const tail = rest.slice(1);
    if (first > '5') roundUp = true;
    else if (first === '5') {
      if (/[1-9]/.test(tail)) roundUp = true;
      else {
        // Exact tie — round to the even last kept digit.
        const lastKept = decimals > 0 ? keep[decimals - 1] : intPart[intPart.length - 1];
        roundUp = Number(lastKept) % 2 === 1;
      }
    }
  }

  let digits = intPart + keep;
  if (roundUp) digits = incrementDigits(digits);

  const cut = digits.length - decimals;
  return { int: digits.slice(0, cut) || '0', frac: digits.slice(cut) };
}

/** Python's `f"{n:,.{decimals}f}"`, then Bengali digits. */
function bn(n: number, decimals = 0): string {
  const parts = roundHalfEven(n, decimals);
  const grouped = parts.int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = n < 0 ? '-' : '';
  const body = decimals > 0 ? `${grouped}.${parts.frac}` : grouped;
  return toBnDigits(sign + body);
}

/**
 * `bn` without the digit swap.
 *
 * Deliberately the same rounding path: the English sheet has to agree with the
 * Bengali one figure for figure, and `toFixed` breaks ties the other way, so a
 * separate formatter would have printed a different number every so often.
 */
function en(n: number, decimals = 0): string {
  const parts = roundHalfEven(n, decimals);
  const grouped = parts.int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = n < 0 ? '-' : '';
  return decimals > 0 ? `${sign}${grouped}.${parts.frac}` : sign + grouped;
}

function enDate(d: Day): string {
  return `${d.day} ${EN_MONTHS_ABBR[d.month - 1]} ${d.year}`;
}

/**
 * `roundHalfEven` as a number rather than its digits.
 *
 * The sheet rounds the way CPython's `format(x, '.Nf')` does, and the change
 * column has to round identically or it would disagree with the two columns it
 * sits between.
 */
function roundedNumber(value: number, decimals = 0): number {
  const { int, frac } = roundHalfEven(value, decimals);
  const magnitude = Number(decimals > 0 ? `${int}.${frac}` : int);
  return value < 0 ? -magnitude : magnitude;
}

function bnDate(d: Day): string {
  return `${toBnDigits(String(d.day))} ${BN_MONTHS[d.month - 1]} ${toBnDigits(String(d.year))}`;
}

/** Python pads by code point; do the same rather than by UTF-16 unit. */
function padEndCp(s: string, width: number): string {
  const len = [...s].length;
  return len >= width ? s : s + ' '.repeat(width - len);
}

function padStartCp(s: string, width: number): string {
  const len = [...s].length;
  return len >= width ? s : ' '.repeat(width - len) + s;
}

/**
 * CPython's `sum()` over floats, which since 3.12 compensates for rounding
 * (Neumaier summation). A naive left fold drifts by one ULP on the gas
 * columns — enough to move a total like 1640.4999999999998 to 1640.5 and print
 * a figure one higher than the script does.
 */
function pySum(values: number[]): number {
  let total = 0;
  let c = 0;
  for (const x of values) {
    const t = total + x;
    if (Math.abs(total) >= Math.abs(x)) c += (total - t) + x;
    else c += (x - t) + total;
    total = t;
  }
  return total + c;
}

/* ── Dates ──────────────────────────────────────────────────────────────── */

function parseDay(isoDate: string): Day | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const day = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  const probe = new Date(Date.UTC(day.year, day.month - 1, day.day));
  if (
    probe.getUTCFullYear() !== day.year
    || probe.getUTCMonth() + 1 !== day.month
    || probe.getUTCDate() !== day.day
  ) return null;
  return day;
}

function isoOf(d: Day): string {
  return `${String(d.year).padStart(4, '0')}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

function nextDayIso(d: Day): string {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + 1));
  return t.toISOString().slice(0, 10);
}

/**
 * Same calendar day one year earlier; 29 February falls back to the 28th.
 * A naive year swap would produce 29 February in a common year, crashing the
 * sheet once every four years rather than degrading.
 */
function priorYear(d: Day): Day {
  if (d.month === 2 && d.day === 29) return { year: d.year - 1, month: 2, day: 28 };
  return { year: d.year - 1, month: d.month, day: d.day };
}

/* ── Figures ────────────────────────────────────────────────────────────── */

type Figures = Record<FigureKey, number>;

/**
 * How many zones a day's regional table carries.
 *
 * The sheet's load-shedding row is a sum across that table, so the figure only
 * means "the country's load shedding" when the table is the whole country. Ten
 * days in the archive are short — 2016-09-01 lists six zones, 2014-12-02 lists
 * one — and 14 year-apart pairs put a short table against a full one.
 */
function zoneBasis(j: GridDailyData): number {
  return (j.regionalDemandData ?? []).filter((r) => typeof r.loadShed === 'number').length;
}

/**
 * A figure that cannot physically be zero, so a zero means it was never
 * captured. The same rule the comparison engine applies, for the same reason:
 * 2018-01-15 stores a zero average production cost beside a real total, and
 * 2014-07-28 stores both as zero on a day that generated 120 million kWh.
 *
 * Load shedding is deliberately not in this set — a day with none is a real
 * day, and the sheet should print it.
 */
const POSITIVE_ONLY: FigureKey[] = ['evD', 'evG', 'gasPwr', 'dom', 'lng', 'tot', 'energy', 'cost'];

const FIGURE_NAMES: Record<FigureKey, string> = {
  evD: 'evening peak demand',
  evG: 'evening peak generation',
  shed: 'load shedding',
  gasPwr: 'gas supplied to power',
  dom: 'domestic gas production',
  lng: 'LNG supply',
  tot: 'total gas production',
  energy: 'total energy generated',
  cost: 'generation cost',
};

async function figures(
  d: Day,
): Promise<{ ok: true; values: Figures; zones: number } | { ok: false; reason: string }> {
  const iso = isoOf(d);
  // The server loader, not a bare fs read: it also resolves days published at
  // runtime since the last deploy.
  const loaded = await loadDailyReportFromDisk(iso);
  if (!loaded.ok) {
    return { ok: false, reason: `no archive day for ${iso}` };
  }

  const j: GridDailyData = loaded.data;
  const s = j.systemStats;
  const gas = j.gasProductionData ?? [];
  let total = pySum(gas.map((r) => r.gas));
  let lng = pySum(gas.filter((r) => r.company.includes('RPGCL')).map((r) => r.gas));

  if (total === 0) {
    /**
     * The grid file's summary is blank — but the report may still be here.
     *
     * Six zero rows is how the archive says "Petrobangla had not filed this
     * window when the grid day was written", and 3,048 days say it. On 765 of
     * them the Petrobangla document for that exact window is in the archive,
     * reconciled and complete; the sheet was refusing days whose gas we hold.
     *
     * The resolver is the important part. Those files are keyed two ways — most
     * are named for the day the report was FILED, which is the day after the
     * window it covers — so reading `{iso}.json` would have taken the previous
     * day's production and published it under this date. That is the fabrication
     * this whole file exists to avoid, and it is why the lookup goes through
     * each document's own `report_date_start`.
     */
    const { loadPetrobanglaForEnergyDay, archiveGasTotal, archiveGasLng } = await import(
      '@/lib/data/grid/petrobangla-day.server'
    );
    const found = await loadPetrobanglaForEnergyDay(iso);
    const archiveTotal = found ? archiveGasTotal(found.doc) : null;
    const archiveLng = found ? archiveGasLng(found.doc) : null;

    if (archiveTotal === null || archiveLng === null) {
      return {
        ok: false,
        reason: `${iso} carries no gas figures (the grid file's summary is blank and no Petrobangla `
          + `report for that 08:00–08:00 window is archived; it would be filed under `
          + `${nextDayIso(d)}); the sheet would report a false collapse`,
      };
    }
    total = archiveTotal;
    lng = archiveLng;
  }

  if (s.totalEnergyGen === null || s.totalEnergyGen === undefined) {
    return { ok: false, reason: `${iso} publishes no daily energy total` };
  }

  const values: Figures = {
    evD: s.eveningPeakDemand,
    evG: s.eveningPeakGen,
    shed: pySum((j.regionalDemandData ?? []).map((r) => r.loadShed ?? 0)),
    gasPwr: s.totalGasSuppliedPower,
    dom: total - lng,
    lng,
    tot: total,
    energy: s.totalEnergyGen,
    cost: s.totalDailyCost / 1e7, // stored in taka; a crore is 1e7
  };

  // Refuse the day rather than publish a zero that is really a blank. Every
  // day this currently catches is already refused a line above for missing
  // gas, so the sheet's output does not change — but it is caught on purpose
  // now, instead of by luck, and it stays caught if that gas is ever
  // backfilled.
  const blank = POSITIVE_ONLY.filter((k) => !(values[k] > 0));
  if (blank.length) {
    return {
      ok: false,
      reason:
        `${iso} publishes no ${blank.map((k) => FIGURE_NAMES[k]).join(', ')} — the archive stores `
        + `${blank.length === 1 ? 'it' : 'them'} as zero, which is not a figure the report carried`,
    };
  }

  return { ok: true, values, zones: zoneBasis(j) };
}

/* ── Sheet ──────────────────────────────────────────────────────────────── */

/** `Grid_Explorer_2025_vs_2026_Aug_18.txt` — the archive's existing convention. */
export function yoyFilename(isoDate: string): string {
  const d = parseDay(isoDate);
  if (!d) return 'Grid_Explorer.txt';
  const prior = priorYear(d);
  return `Grid_Explorer_${prior.year}_vs_${d.year}_${EN_MONTHS_ABBR[d.month - 1]}_${d.day}.txt`;
}

/**
 * The published year-on-year sheet for one energy day.
 *
 * `lang` picks the language of the OUTPUT. Bengali is the format the desk
 * publishes and is reproduced byte for byte from `build_yoy_comparison.py` —
 * column widths, Bengali numerals, arrows and footer all unchanged. English is
 * the same sheet in the same shape, for a reader who does not read Bengali; it
 * is a rendition, not a second published format, and the figures are computed
 * once and formatted twice so the two can never disagree.
 *
 * Bengali stays the default, so every existing caller — the bulk range export,
 * `findLatestYoyDate` — keeps producing exactly what it produced before.
 */
export async function buildYoyComparison(isoDate: string, lang: Lang = 'bn'): Promise<YoyResult> {
  const day = parseDay(isoDate);
  if (!day) return { ok: false, date: isoDate, reason: `Invalid date: ${isoDate}` };

  const prior = priorYear(day);
  const [a, b] = await Promise.all([figures(prior), figures(day)]);
  if (!a.ok) return { ok: false, date: isoDate, reason: a.reason };
  if (!b.ok) return { ok: false, date: isoDate, reason: b.reason };

  // The load-shedding row is a sum across the regional table, so the two years
  // have to have counted the same thing. Publishing one zone against nine
  // would print a collapse that is nothing but the missing zones — and this
  // sheet has no column in which to explain itself, so the honest answer is
  // not to publish it. Every affected pair is already refused above for
  // missing gas; this makes that deliberate.
  if (a.zones !== b.zones) {
    return {
      ok: false,
      date: isoDate,
      reason:
        `${isoOf(prior)} reports load shedding for ${a.zones} zone${a.zones === 1 ? '' : 's'} and `
        + `${isoDate} for ${b.zones} — the two totals are not the same measurement, so the sheet `
        + 'would compare a part of the country with the whole of it',
    };
  }

  const bengali = lang === 'bn';
  const fmt = (n: number, decimals = 0) => (bengali ? bn(n, decimals) : en(n, decimals));

  const rows: YoyRow[] = ROWS.map((def) => {
    const x = a.values[def.key];
    const y = b.values[def.key];
    const [label, unit] = bengali ? def.bn : def.en;
    // Two different questions, and they have different answers when the
    // earlier year was zero. `change` is what the sheet prints — the published
    // format calls it 0.0% and always has. `pct` is whether a percentage means
    // anything at all, and against a base of zero it does not: shedding going
    // from 0 to 1,553 MW is not a 0% move, it is a move with no ratio.
    const change = x ? ((y - x) / x) * 100 : 0;
    const delta = roundedNumber(y) - roundedNumber(x);
    return {
      id: def.id,
      label,
      unit,
      a: x,
      b: y,
      pct: x ? change : null,
      aText: fmt(x),
      bText: fmt(y),
      delta,
      // The sign is explicit on a rise: "+2,570" reads as a change where
      // "2,570" reads as another quantity.
      deltaText: `${delta >= 0 ? '+' : ''}${fmt(delta)}`,
      // A sub-1% move rounds to "0%", which reads as "no change" when the
      // figure did move. One decimal only where the integer would be zero.
      pctText: fmt(Math.abs(change), Math.abs(change) < 1 ? 1 : 0),
    };
  });

  const heading = bengali
    ? 'ESB POWER LINE — এক বছরে কতটা বদলাল'
    : 'ESB POWER LINE — WHAT CHANGED IN A YEAR';
  const subheading = bengali
    ? `${bnDate(prior)} বনাম ${bnDate(day)}`
    : `${enDate(prior)} vs ${enDate(day)}`;

  const dayBn = `${toBnDigits(String(day.day))} ${BN_MONTHS[day.month - 1]}`;
  const footer = bengali
    ? [
        'সূত্র: পিজিসিবি দৈনিক প্রতিবেদন ও পেট্রোবাংলা দৈনিক গ্যাস প্রতিবেদন।',
        `গ্রিড ও গ্যাস — দুটিই একই এনার্জি ডে (${dayBn}) থেকে নেওয়া;`,
        'পেট্রোবাংলার ৮টা–৮টা গ্যাস-ডে ওই দিন সকাল ৮টায় শুরু হয়।',
      ]
    : [
        'Source: PGCB daily report and Petrobangla daily gas report.',
        `Grid and gas are both read from the same energy day (${enDate(day)});`,
        'Petrobangla’s 08:00–08:00 gas day opens at 08:00 that morning.',
      ];

  const lines: string[] = bengali
    ? [
        heading,
        subheading,
        '='.repeat(49),
        '',
        padEndCp('বিবরণ', 28) + padEndCp('একক', 17)
          + padStartCp(toBnDigits(String(prior.year)), 10)
          + padStartCp(toBnDigits(String(day.year)), 11)
          + padStartCp('পরিবর্তন', 12),
        '-'.repeat(77),
      ]
    : [
        heading,
        subheading,
        '='.repeat(49),
        '',
        padEndCp('Metric', 28) + padEndCp('Unit', 17)
          + padStartCp(String(prior.year), 10)
          + padStartCp(String(day.year), 11)
          + padStartCp('Change', 12),
        '-'.repeat(77),
      ];

  for (const row of rows) {
    const arrow = (row.pct ?? 0) >= 0 ? '▲' : '▼';
    lines.push(
      padEndCp(row.label, 28) + padEndCp(row.unit, 17)
      + padStartCp(row.aText, 10) + padStartCp(row.bText, 11)
      + padStartCp(`   ${arrow} ${row.pctText}%`, 12),
    );
  }

  lines.push('-'.repeat(77), '', ...footer);

  return {
    ok: true,
    date: isoDate,
    text: `${lines.join('\n')}\n`,
    filename: yoyFilename(isoDate),
    rows,
    aLabel: bengali ? toBnDigits(String(prior.year)) : String(prior.year),
    bLabel: bengali ? toBnDigits(String(day.year)) : String(day.year),
    heading,
    subheading,
    footer,
    lang,
  };
}

/**
 * The newest day that can actually produce a sheet. The latest archive day
 * usually cannot: its gas window is filed the following morning, so the sheet
 * only becomes available a day behind the grid figures.
 */
export async function findLatestYoyDate(candidates: string[], limit = 20): Promise<string | null> {
  const recent = candidates.slice(-limit).reverse();
  for (const iso of recent) {
    const built = await buildYoyComparison(iso);
    if (built.ok) return iso;
  }
  return null;
}
