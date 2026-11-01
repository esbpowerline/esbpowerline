/**
 * The fuel-price social card ("Fuel prices at home and abroad"), as data.
 *
 * Design: Figma mLhk4EeYSfg2w9KJll0bu2, frame "Fuel Oil Price Report - 4:5 -
 * Minimal V1.1 — 1 Nov 2026 (live values)", node 2519:448.
 *
 * Two halves, two clocks:
 *
 * - **Bangladesh pump prices** are EMRD's monthly decision. Each tile says
 *   whether this month's instrument changed the price, and when the price
 *   last moved. The month's chip names the instrument; a month EMRD has not
 *   ruled on yet is said to be awaited, never filled from the month before.
 * - **World prices** are futures *settlements* (lib/data/oil/futures.ts): the
 *   last day all four series settled, compared with the same contract a week
 *   and a month earlier.
 *
 * Colour follows Bangladesh's position as an importer: a world price rising
 * is "higher import bill" (red ▲), falling is "lower import bill" (green ▼).
 * The pump tiles carry no red or green unless EMRD actually moved the price
 * this month.
 *
 * Client-safe: the CMS builds the model on the server and the editor's
 * browser draws the PNG, as the year-on-year card does.
 */
import { downloadStamp } from '@/lib/data/grid/export-datestamp';
import {
  ADMINISTERED_PRICES,
  EMRD_FUEL_MONTHS,
  LAST_FUEL_CHANGE,
  type FuelId,
} from '@/lib/data/tariff/administered-prices';
import { buildWorldRows, type Settlement } from '@/lib/data/oil/futures';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));

/** `2026-09-21` → `21 Sep`. */
export function dayMonth(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${SHORT[m - 1]}`;
}

/** `2026-10-30` → `30 Oct 2026`. */
export function dayMonthYear(iso: string): string {
  const [y] = iso.split('-');
  return `${dayMonth(iso)} ${y}`;
}

export type Dir = 'up' | 'down' | 'flat';

export interface PumpTile {
  id: FuelId;
  name: string;
  value: number;
  /** Did this month's instrument move the price? */
  state: 'unchanged' | 'changed';
  /** The last move, where a document states the price it replaced. */
  lastChange: { dir: Dir; amount: number; on: string } | null;
  /** When the price was last re-fixed, `21 Sep` — always known. */
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
}

export interface OilCardModel {
  published: { weekday: string; date: string };
  pump: { chip: string; tiles: PumpTile[] };
  world: { settlement: string; rows: OilWorldRow[] } | null;
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

export function buildOilCardModel(settlements: Settlement[], now: Date = new Date()): OilCardModel {
  // Dhaka's civil day — the same stamp the YoY card and every export prints.
  const stamp = downloadStamp(now);
  const [date, weekday = ''] = stamp.gregorian.split(', ');
  const today = stamp.iso;
  const month = today.slice(0, 7);

  // The instrument in force today, and whether EMRD has ruled on this month.
  const inForce = [...EMRD_FUEL_MONTHS].reverse().find((r) => r.instrument.effectiveFrom <= today);
  const ruled = EMRD_FUEL_MONTHS.find((r) => r.month === month);
  const monthName = MONTHS[Number(month.slice(5)) - 1];
  const chip = ruled
    ? `EMRD · ${monthName} rate`
    : inForce
      ? `EMRD · ${MONTHS[Number(inForce.month.slice(5)) - 1]} rate · awaiting ${monthName} notice`
      : `EMRD · awaiting ${monthName} notice`;

  const changedThisMonth = Boolean(ruled?.changed && ruled.instrument.effectiveFrom.slice(0, 7) === month);
  const since = dayMonth(LAST_FUEL_CHANGE.instrument.effectiveFrom);
  const tiles: PumpTile[] = TILE_ORDER.map(({ id, name }) => {
    const value = ADMINISTERED_PRICES.find((p) => p.id === id)!.value;
    const prev = LAST_FUEL_CHANGE.previous?.[id];
    const amount = prev == null ? null : value - prev;
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

  const w = buildWorldRows(settlements, today);
  const world = w && {
    settlement: dayMonthYear(w.day),
    rows: w.rows.map((r) => ({
      id: r.series,
      label: r.label,
      unit: r.unit,
      price: r.settle.toFixed(2),
      week: cell(r.week),
      month: cell(r.month),
    })),
  };

  return {
    published: { weekday, date },
    pump: { chip, tiles },
    world,
    filename: `ESB_Fuel_Prices_${today}.png`,
  };
}

