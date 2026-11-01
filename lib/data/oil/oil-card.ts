/**
 * The fuel-price social card ("Fuel prices at home and abroad"), as data —
 * for today or for any earlier day the archive can answer honestly.
 *
 * Design: Figma mLhk4EeYSfg2w9KJll0bu2, frame "Fuel Oil Price Report - 4:5 -
 * Minimal V1.1 — 1 Nov 2026 (live values)", node 2519:448.
 *
 * Two halves, two clocks:
 *
 * - **Bangladesh pump prices** are EMRD's monthly decision. A card for day P
 *   reads the instrument in force on P, never today's price. Each tile says
 *   whether that month's instrument moved the price, and when it last moved.
 *   A month EMRD had not ruled on is said to be awaited, never filled from the
 *   month before.
 * - **World prices** are futures settlements (lib/data/oil/futures.ts). A card
 *   for P is what an editor in Dhaka could have published that day: the last
 *   session New York had settled before P began, i.e. on or before P − 1, and
 *   never more than five days stale.
 *
 * Colour follows Bangladesh's position as an importer: a world price rising is
 * "higher import bill" (red ▲), falling is "lower import bill" (green ▼). The
 * pump tiles carry no red or green unless EMRD moved the price that month.
 *
 * Client-safe: the CMS builds the model on the server; the editor's browser
 * draws the PNG/JPG and assembles the caption and CSV from it.
 */
import { downloadStamp } from '@/lib/data/grid/export-datestamp';
import {
  EMRD_FUEL_MONTHS,
  FIRST_FUEL_CARD_DAY,
  LAST_FUEL_CHANGE,
  type FuelId,
  type FuelMonthRate,
} from '@/lib/data/tariff/administered-prices';
import { buildWorldRows, minusDays, type Settlement } from '@/lib/data/oil/futures';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));

/** `2026-09-21` → `21 Sep`. */
export function dayMonth(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${SHORT[m - 1]}`;
}

/** `2026-10-30` → `30 Oct 2026`. */
export function dayMonthYear(iso: string): string {
  return `${dayMonth(iso)} ${iso.slice(0, 4)}`;
}

/** `2026-11-01` → `{ weekday: 'Sunday', date: '1 November 2026' }`, read as plain parts. */
export function publishedOf(iso: string): { weekday: string; date: string } {
  const [y, m, d] = iso.split('-').map(Number);
  return { weekday: WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()], date: `${d} ${MONTHS[m - 1]} ${y}` };
}

/**
 * A world settlement older than this, counted back from the card's day, is
 * not printed: the longest honest gap is a Friday settlement on a Tuesday
 * after a Monday holiday.
 */
const MAX_STALE_DAYS = 5;

export type Dir = 'up' | 'down' | 'flat';

export interface PumpTile {
  id: FuelId;
  name: string;
  /** Null when no archived instrument states the price for the card's day. */
  value: number | null;
  /** Did that month's instrument move the price? */
  state: 'unchanged' | 'changed';
  /** The last move, where a document states the price it replaced. */
  lastChange: { dir: Dir; amount: number; on: string } | null;
  /** When the price was last re-fixed, `21 Sep`. */
  since: string;
}

export interface WorldCell {
  dir: Dir;
  /** Absolute percentage, one decimal, as printed: `19.3`. */
  pct: string;
}

export interface OilWorldRow {
  id: string;
  label: string;
  unit: string;
  price: string;
  week: WorldCell | null;
  month: WorldCell | null;
  /** For the data export: which contract, and the days the baselines came from. */
  contract?: string;
  weekDay?: string | null;
  monthDay?: string | null;
}

export interface OilCardModel {
  /** The card's own day, `YYYY-MM-DD` (Dhaka). */
  day: string;
  published: { weekday: string; date: string };
  pump: {
    chip: string;
    tiles: PumpTile[];
    /** The instrument the tiles read, for the caption and the export. */
    instrument: { reference: string; memoNo: string; effectiveFrom: string } | null;
  };
  world: { settlement: string; settlementDay: string; rows: OilWorldRow[] } | null;
  filename: string;
}

const TILE_ORDER: { id: FuelId; name: string }[] = [
  { id: 'diesel-bpc', name: 'Diesel' },
  { id: 'kerosene-bpc', name: 'Kerosene' },
  { id: 'petrol-bpc', name: 'Petrol' },
  { id: 'octane-bpc', name: 'Octane' },
];

function cell(v: number | null): WorldCell | null {
  if (v == null) return null;
  return { dir: v > 0 ? 'up' : v < 0 ? 'down' : 'flat', pct: Math.abs(v).toFixed(1) };
}

const monthName = (ym: string) => MONTHS[Number(ym.slice(5)) - 1];

/** Today in Dhaka, the same stamp every export prints. */
export function dhakaToday(now: Date = new Date()): string {
  return downloadStamp(now).iso;
}

/** The world half for a card day, or null when the archive cannot answer it honestly. */
export function worldFor(settlements: Settlement[], day: string) {
  const w = buildWorldRows(settlements, minusDays(day, 1));
  if (!w || w.day < minusDays(day, MAX_STALE_DAYS)) return null;
  return w;
}

/** Every day from the first sourced instrument to `today` for which a complete card can be made. */
export function cardableDays(settlements: Settlement[], today: string): string[] {
  const out: string[] = [];
  for (let d = FIRST_FUEL_CARD_DAY; d <= today; d = minusDays(d, -1)) {
    if (worldFor(settlements, d)) out.push(d);
  }
  return out;
}

function rateFor(day: string): { inForce: FuelMonthRate | undefined; ruled: FuelMonthRate | undefined } {
  const inForce = [...EMRD_FUEL_MONTHS].reverse().find((r) => r.instrument.effectiveFrom <= day);
  const ruled = EMRD_FUEL_MONTHS.find((r) => r.month === day.slice(0, 7));
  return { inForce, ruled };
}

export function buildOilCardModel(
  settlements: Settlement[],
  opts: { day?: string; now?: Date } = {},
): OilCardModel {
  const day = opts.day ?? dhakaToday(opts.now);
  const month = day.slice(0, 7);

  const { inForce, ruled } = rateFor(day);
  const chip = ruled
    ? `EMRD · ${monthName(month)} rate`
    : inForce
      ? `EMRD · ${monthName(inForce.month)} rate · awaiting ${monthName(month)} notice`
      : `EMRD · awaiting ${monthName(month)} notice`;

  const changedThisMonth = Boolean(ruled?.changed && ruled.instrument.effectiveFrom.slice(0, 7) === month);
  // The change a tile reports is the last one in force on the card's day.
  const lastChange = LAST_FUEL_CHANGE.instrument.effectiveFrom <= day ? LAST_FUEL_CHANGE : null;
  const since = dayMonth((lastChange ?? LAST_FUEL_CHANGE).instrument.effectiveFrom);
  const tiles: PumpTile[] = TILE_ORDER.map(({ id, name }) => {
    const value = inForce ? inForce.prices[id] : null;
    const prev = lastChange?.previous?.[id];
    const amount = prev == null || value == null ? null : value - prev;
    return {
      id,
      name,
      value,
      state: changedThisMonth ? 'changed' : 'unchanged',
      lastChange:
        amount == null ? null : { dir: amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat', amount: Math.abs(amount), on: since },
      since,
    };
  });

  const w = worldFor(settlements, day);
  const world = w && {
    settlement: dayMonthYear(w.day),
    settlementDay: w.day,
    rows: w.rows.map((r) => ({
      id: r.series,
      label: r.label,
      unit: r.unit,
      price: r.settle.toFixed(2),
      week: cell(r.week),
      month: cell(r.month),
      contract: r.contract,
      weekDay: r.weekDay,
      monthDay: r.monthDay,
    })),
  };

  return {
    day,
    published: publishedOf(day),
    pump: {
      chip,
      tiles,
      instrument: inForce
        ? {
            reference: inForce.instrument.reference,
            memoNo: inForce.instrument.memoNo,
            effectiveFrom: inForce.instrument.effectiveFrom,
          }
        : null,
    },
    world,
    filename: `ESB_Fuel_Prices_${day}`,
  };
}

const ARROW = { up: '▲', down: '▼', flat: '' } as const;

/**
 * The Facebook post text for the card: the same figures, in the same order,
 * with the instruments named. English, like the card.
 */
export function oilCaption(m: OilCardModel): string {
  const lines: string[] = [];
  lines.push(`Fuel prices at home and abroad — ${m.published.weekday}, ${m.published.date}`);
  lines.push('');
  lines.push(`Bangladesh pump prices (Tk per litre, ${m.pump.chip.replace(/^EMRD · /, 'EMRD ')}):`);
  for (const t of m.pump.tiles) {
    const state =
      t.value == null
        ? 'not stated by an archived instrument'
        : t.state === 'changed'
          ? `re-fixed ${t.since}`
          : t.lastChange
            ? `unchanged; ${ARROW[t.lastChange.dir]} Tk ${t.lastChange.amount} on ${t.lastChange.on}`
            : `unchanged since ${t.since}`;
    lines.push(`• ${t.name}: ${t.value == null ? '—' : `Tk ${t.value}`} (${state})`);
  }
  lines.push('');
  if (m.world) {
    lines.push(`World oil prices, futures settlement of ${m.world.settlement} (vs a week / a month earlier):`);
    for (const r of m.world.rows) {
      const c = (x: WorldCell | null) => (x ? `${ARROW[x.dir]}${x.pct}%`.trim() : '—');
      lines.push(`• ${r.label}: $${r.price} ${r.unit.replace('USD/', 'per ')} (${c(r.week)} / ${c(r.month)})`);
    }
    lines.push('');
  }
  lines.push(
    'Sources: EMRD' +
      (m.pump.instrument ? ` memo ${m.pump.instrument.memoNo}` : '') +
      '; NYMEX and ICE front-month futures settlements via Yahoo Finance.',
  );
  lines.push('More: esbpowerline.com/grid-explorer');
  return lines.join('\n');
}

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Every figure on the card, with what it was read from, as one CSV. */
export function oilCardCsv(m: OilCardModel): string {
  const rows: (string | number | null | undefined)[][] = [
    ['card_day', 'section', 'item', 'value', 'unit', 'state_or_week_pct', 'month_pct', 'contract', 'settlement_day', 'week_base_day', 'month_base_day', 'instrument'],
  ];
  for (const t of m.pump.tiles) {
    rows.push([m.day, 'pump', t.name, t.value, 'Tk/L', t.state, null, null, null, null, null, m.pump.instrument?.memoNo]);
  }
  for (const r of m.world?.rows ?? []) {
    const sp = (c: WorldCell | null) => (c ? (c.dir === 'down' ? '-' : '') + c.pct : null);
    rows.push([m.day, 'world', r.label, r.price, r.unit, sp(r.week), sp(r.month), r.contract, m.world!.settlementDay, r.weekDay, r.monthDay, 'Yahoo Finance chart API']);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

/** Front-month settlements between two days, one row per series per trading day. */
export function settlementHistoryCsv(settlements: Settlement[], from: string, to: string): string {
  const rows = settlements
    .filter((r) => r.front && r.day >= from && r.day <= to)
    .sort((a, b) => (a.day === b.day ? a.series.localeCompare(b.series) : a.day < b.day ? -1 : 1));
  return (
    ['trade_day,series,contract,settle'].concat(rows.map((r) => [r.day, r.series, r.contract, r.settle].join(','))).join('\n') +
    '\n'
  );
}
