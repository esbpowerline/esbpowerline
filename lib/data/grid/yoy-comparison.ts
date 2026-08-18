import 'server-only';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import type { GridDailyData } from '@/lib/data/grid/types';

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

const ROWS: Array<[label: string, unit: string, key: FigureKey]> = [
  ['সন্ধ্যার সর্বোচ্চ চাহিদা', 'মেগাওয়াট', 'evD'],
  ['সন্ধ্যার সর্বোচ্চ উৎপাদন', 'মেগাওয়াট', 'evG'],
  ['লোডশেডিং', 'মেগাওয়াট', 'shed'],
  ['বিদ্যুৎ খাতে গ্যাস সরবরাহ', 'মিলিয়ন ঘনফুট', 'gasPwr'],
  ['দেশীয় গ্যাস উৎপাদন', 'মিলিয়ন ঘনফুট', 'dom'],
  ['এলএনজি সরবরাহ', 'মিলিয়ন ঘনফুট', 'lng'],
  ['মোট গ্যাস উৎপাদন', 'মিলিয়ন ঘনফুট', 'tot'],
  ['দিনভর মোট উৎপাদন', 'মিলিয়ন ইউনিট', 'energy'],
  ['বিদ্যুৎ উৎপাদন খরচ', 'কোটি টাকা', 'cost'],
];

/** A calendar day, kept as plain parts so no timezone can shift it. */
type Day = { year: number; month: number; day: number };

export type YoyResult =
  | { ok: true; date: string; text: string; filename: string }
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

async function figures(d: Day): Promise<{ ok: true; values: Figures } | { ok: false; reason: string }> {
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
  const total = pySum(gas.map((r) => r.gas));
  const lng = pySum(gas.filter((r) => r.company.includes('RPGCL')).map((r) => r.gas));

  if (total === 0) {
    // Every gas row zero is how the archive says "Petrobangla has not
    // published this window yet" — publishing that as a real 100% fall
    // would be a fabricated headline.
    return {
      ok: false,
      reason: `${iso} carries no gas figures yet (Petrobangla files this window under `
        + `${nextDayIso(d)}); the sheet would report a false collapse`,
    };
  }

  if (s.totalEnergyGen === null || s.totalEnergyGen === undefined) {
    return { ok: false, reason: `${iso} publishes no daily energy total` };
  }

  return {
    ok: true,
    values: {
      evD: s.eveningPeakDemand,
      evG: s.eveningPeakGen,
      shed: pySum((j.regionalDemandData ?? []).map((r) => r.loadShed ?? 0)),
      gasPwr: s.totalGasSuppliedPower,
      dom: total - lng,
      lng,
      tot: total,
      energy: s.totalEnergyGen,
      cost: s.totalDailyCost / 1e7, // stored in taka; a crore is 1e7
    },
  };
}

/* ── Sheet ──────────────────────────────────────────────────────────────── */

/** `Grid_Explorer_2025_vs_2026_Aug_18.txt` — the archive's existing convention. */
export function yoyFilename(isoDate: string): string {
  const d = parseDay(isoDate);
  if (!d) return 'Grid_Explorer.txt';
  const prior = priorYear(d);
  return `Grid_Explorer_${prior.year}_vs_${d.year}_${EN_MONTHS_ABBR[d.month - 1]}_${d.day}.txt`;
}

export async function buildYoyComparison(isoDate: string): Promise<YoyResult> {
  const day = parseDay(isoDate);
  if (!day) return { ok: false, date: isoDate, reason: `Invalid date: ${isoDate}` };

  const prior = priorYear(day);
  const [a, b] = await Promise.all([figures(prior), figures(day)]);
  if (!a.ok) return { ok: false, date: isoDate, reason: a.reason };
  if (!b.ok) return { ok: false, date: isoDate, reason: b.reason };

  const lines: string[] = [
    'ESB POWER LINE — এক বছরে কতটা বদলাল',
    `${bnDate(prior)} বনাম ${bnDate(day)}`,
    '='.repeat(49),
    '',
    padEndCp('বিবরণ', 28) + padEndCp('একক', 17)
      + padStartCp(toBnDigits(String(prior.year)), 10)
      + padStartCp(toBnDigits(String(day.year)), 11)
      + padStartCp('পরিবর্তন', 12),
    '-'.repeat(77),
  ];

  for (const [label, unit, key] of ROWS) {
    const x = a.values[key];
    const y = b.values[key];
    const change = x ? (y - x) / x * 100 : 0;
    const arrow = change >= 0 ? '▲' : '▼';
    // A sub-1% move rounds to "0%", which reads as "no change" when the
    // figure did move. One decimal only where the integer would be zero.
    const pct = bn(Math.abs(change), Math.abs(change) < 1 ? 1 : 0);
    lines.push(
      padEndCp(label, 28) + padEndCp(unit, 17)
      + padStartCp(bn(x), 10) + padStartCp(bn(y), 11)
      + padStartCp(`   ${arrow} ${pct}%`, 12),
    );
  }

  const dayBn = `${toBnDigits(String(day.day))} ${BN_MONTHS[day.month - 1]}`;
  lines.push(
    '-'.repeat(77),
    '',
    'সূত্র: পিজিসিবি দৈনিক প্রতিবেদন ও পেট্রোবাংলা দৈনিক গ্যাস প্রতিবেদন।',
    `গ্রিড ও গ্যাস — দুটিই একই এনার্জি ডে (${dayBn}) থেকে নেওয়া;`,
    'পেট্রোবাংলার ৮টা–৮টা গ্যাস-ডে ওই দিন সকাল ৮টায় শুরু হয়।',
  );

  return {
    ok: true,
    date: isoDate,
    text: `${lines.join('\n')}\n`,
    filename: yoyFilename(isoDate),
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
