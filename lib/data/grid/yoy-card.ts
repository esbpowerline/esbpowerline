/**
 * The "What changed in a year" social card, as data.
 *
 * The card is the published year-on-year sheet drawn as a 1080×1350 (4:5) image for
 * the desk's Facebook post. It is a picture of the sheet, not a second
 * calculation of it: every figure, change and percentage below is the string
 * `buildYoyComparison` already formatted for the .txt the desk publishes, so the
 * image, the .docx and the .txt cannot disagree about a number. Nothing here
 * rounds, re-derives or fills anything in — the sheet only exists for a day on
 * which all nine figures were filed (it answers `ok: false` otherwise), so the
 * card never has a gap to paper over.
 *
 * Colour follows `verdictOf`, the same rule as every table in the panel — load
 * shedding rising is red, generation rising is green, demand is neither — and
 * the arrow follows the sign of the move. They are separate on purpose: a red
 * up-arrow is the honest picture of shedding going up.
 *
 * Client-safe on purpose (no `server-only` import): the panel builds the model
 * in the browser and the browser draws the PNG.
 */
import type { YoyResult, YoyRow } from '@/lib/data/grid/yoy-comparison';
import { verdictOf } from '@/lib/data/grid/comparison-i18n';
import { downloadStamp } from '@/lib/data/grid/export-datestamp';

export type CardTone = 'good' | 'bad' | 'neutral';

export type CardRow = {
  id: string;
  label: string;
  unit: string;
  then: string;
  now: string;
  change: string;
  /** Whole-number percentage exactly as the sheet prints it, without the sign. */
  pct: string;
  /** Which way the figure moved; drives the triangle, not the colour. */
  dir: 'up' | 'down' | 'flat';
  tone: CardTone;
};

export type CardGroup = { key: 'power' | 'gas' | 'cost'; label: string; rows: CardRow[] };

export type YoyCardModel = {
  /** ISO energy day being compared (the "NOW" day). */
  date: string;
  thenLabel: string;
  nowLabel: string;
  thenYear: string;
  nowYear: string;
  /**
   * The day the card was made, Dhaka's civil day: `Tuesday` and
   * `20 October 2026`. The 4:5 design (Figma "YoY Card - 4:5 V2") prints the
   * Gregorian date alone; the Bangla and Hijri lines of the 1:1 card are gone.
   */
  published: { weekday: string; date: string };
  groups: CardGroup[];
  filename: string;
};

/**
 * The sheet labels this row "Total gas production", but the figure is domestic
 * production plus imported LNG (1,599 + 764 = 2,363 on 14 Oct 2026) — national
 * supply, not production. Quoted as production it would overstate what the
 * country's own fields delivered by the whole LNG volume. The card uses the
 * accurate name; the published sheet's own wording is left to the desk.
 */
const LABEL_OVERRIDE: Record<string, string> = {
  'gas.total': 'Total gas supply',
};

const GROUP_OF: Record<string, CardGroup['key']> = {
  'system.eveningPeakDemand': 'power',
  'system.eveningPeakGen': 'power',
  'shedding.total': 'power',
  'gas.toPower': 'gas',
  'gas.domestic': 'gas',
  'gas.lng': 'gas',
  'gas.total': 'gas',
  // Energy is electricity: the 4:5 design moved it out of the old
  // "Energy & cost" group and left cost standing on its own.
  'system.totalEnergyGen': 'power',
  'system.totalDailyCost': 'cost',
};

const GROUP_LABEL: Record<CardGroup['key'], string> = {
  power: 'Electricity',
  gas: 'Gas',
  cost: 'Cost',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-10-14` → `14 Oct 2026`, read as plain parts so no timezone can move it. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** The sheet prints an ASCII hyphen; the card sets a true minus, same figure. */
function typographicMinus(s: string): string {
  return s.replace(/^-/, '−');
}

function toneOf(r: YoyRow): CardTone {
  const v = verdictOf(r.id, r.b - r.a);
  return v === 'up' ? 'good' : v === 'down' ? 'bad' : 'neutral';
}

function dirOf(r: YoyRow): CardRow['dir'] {
  // The rounded change the row prints, so the arrow can never point against
  // the figure beside it (the same reason the sheet derives `delta` from the
  // rounded columns).
  return r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : 'flat';
}

export function buildYoyCardModel(
  sheet: Extract<YoyResult, { ok: true }>,
  now: Date = new Date(),
): YoyCardModel {
  if (sheet.lang !== 'en') {
    throw new Error('The social card is drawn from the English sheet.');
  }
  const groups: CardGroup[] = (['power', 'gas', 'cost'] as const).map((key) => ({
    key,
    label: GROUP_LABEL[key],
    rows: [],
  }));
  for (const r of sheet.rows) {
    const key = GROUP_OF[r.id];
    if (!key) throw new Error(`The card has no slot for sheet row ${r.id}.`);
    groups.find((g) => g.key === key)!.rows.push({
      id: r.id,
      label: LABEL_OVERRIDE[r.id] ?? r.label,
      unit: r.unit,
      then: r.aText,
      now: r.bText,
      change: typographicMinus(r.deltaText),
      pct: r.pctText.replace(/^[+-]/, ''),
      dir: dirOf(r),
      tone: toneOf(r),
    });
  }

  const [y] = sheet.date.split('-');
  const thenIso = `${Number(y) - 1}${sheet.date.slice(4)}`;

  // Dhaka's civil day, the same instant `downloadStamp` reads, so the card's
  // "Published" line and the .docx/.pdf "Downloaded" stamp name the same day.
  // Its Gregorian line is `20 October 2026, Tuesday`; the card sets the
  // weekday beside "Published" and the date on its own.
  const stamp = downloadStamp(now);
  const [date, weekday = ''] = stamp.gregorian.split(', ');

  return {
    date: sheet.date,
    thenLabel: shortDate(thenIso),
    nowLabel: shortDate(sheet.date),
    thenYear: sheet.aLabel,
    nowYear: sheet.bLabel,
    published: { weekday, date },
    groups,
    filename: `ESB_YoY_Card_${sheet.date}.png`,
  };
}
