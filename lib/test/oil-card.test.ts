import { describe, expect, it } from 'vitest';
import {
  buildWorldRows,
  candidateContracts,
  contractSymbol,
  currentContract,
  isSettled,
  matchFront,
  minusMonth,
  nyDay,
  parseChart,
  type Settlement,
} from '@/lib/data/oil/futures';
import { buildOilCardModel } from '@/lib/data/oil/oil-card';
import { EMRD_FUEL_MONTHS, LAST_FUEL_CHANGE } from '@/lib/data/tariff/administered-prices';

/**
 * The fuel-price card. Pinned against the first live card, 1 Nov 2026:
 * settlements of Fri 30 Oct, compared with 23 Oct and 30 Sep on the same
 * contract, and EMRD's 29 Oct memo holding the pump prices for November.
 */

const S = (series: Settlement['series'], contract: string, day: string, settle: number, front = false): Settlement => ({
  series,
  contract,
  day,
  settle,
  front,
});

// The figures Yahoo served on 2026-11-01 for each series' front contract.
const ROWS: Settlement[] = [
  S('brent', 'BZF27.NYM', '2026-10-30', 113.43, true),
  S('brent', 'BZF27.NYM', '2026-10-23', 111.7),
  S('brent', 'BZF27.NYM', '2026-09-30', 95.09),
  // The expiring December contract, front a week earlier. Comparing against it
  // is the roll error the card must not make (−2.8% instead of +1.5%).
  S('brent', 'BZZ26.NYM', '2026-10-23', 116.72, true),
  S('wti', 'CLZ26.NYM', '2026-10-30', 104.12, true),
  S('wti', 'CLZ26.NYM', '2026-10-23', 103.27),
  S('wti', 'CLZ26.NYM', '2026-09-30', 88.42),
  S('rbob', 'RBZ26.NYM', '2026-10-30', 3.1565, true),
  S('rbob', 'RBZ26.NYM', '2026-10-23', 3.1284),
  S('rbob', 'RBZ26.NYM', '2026-09-30', 3.0466),
  S('ulsd', 'HOZ26.NYM', '2026-10-30', 4.6761, true),
  S('ulsd', 'HOZ26.NYM', '2026-10-23', 4.787),
  S('ulsd', 'HOZ26.NYM', '2026-09-30', 4.5052),
];

describe('world oil futures', () => {
  it('names single contracts the way Yahoo lists them', () => {
    expect(contractSymbol('CL', 2026, 12)).toBe('CLZ26.NYM');
    expect(candidateContracts('BZ', '2026-11-01', 3)).toEqual(['BZX26.NYM', 'BZZ26.NYM', 'BZF27.NYM']);
  });

  it('reads a bar on its New York trading day, not a day early', () => {
    // Yahoo stamps the 30 Oct session at 00:00 New York = 04:00Z.
    const { bars } = parseChart({
      chart: { result: [{ meta: { symbol: 'CL=F' }, timestamp: [1793332800], indicators: { quote: [{ close: [104.12] }] } }] },
    });
    expect(bars).toEqual([{ day: '2026-10-30', close: 104.12 }]);
  });

  it('counts a session only once New York has settled it', () => {
    const fri = '2026-10-30';
    expect(isSettled(fri, Date.parse('2026-10-30T18:00:00Z'))).toBe(false); // 14:00 New York
    expect(isSettled(fri, Date.parse('2026-10-30T21:00:00Z'))).toBe(true); // 17:00 New York
    expect(isSettled(fri, Date.parse('2026-11-01T02:00:00Z'))).toBe(true);
    expect(nyDay(Date.parse('2026-11-01T02:00:00Z'))).toBe('2026-10-31');
  });

  it('never counts a weekend bar as a settlement', () => {
    // Yahoo files the session that opens Sunday evening under Sunday's date.
    expect(isSettled('2026-11-01', Date.parse('2026-11-01T21:30:00Z'))).toBe(false);
    expect(isSettled('2026-10-31', Date.parse('2026-11-02T12:00:00Z'))).toBe(false);
  });

  it('takes the contract still quoted, not an expiry-day bar', () => {
    // 1 Nov 2026: BZ=F's daily bar for 30 Oct had been revised to December's
    // final settlement (117.64), but its live quote was January's.
    const live = { symbol: 'BZ=F', regularMarketPrice: 113.43, regularMarketVolume: 37539 };
    expect(
      currentContract(live, {
        'BZZ26.NYM': { symbol: 'BZZ26.NYM', regularMarketPrice: 117.64, regularMarketVolume: 2223 },
        'BZF27.NYM': { symbol: 'BZF27.NYM', regularMarketPrice: 113.43, regularMarketVolume: 37539 },
      }),
    ).toBe('BZF27.NYM');
  });

  it('finds the front contract by matching the continuous series, never by guessing', () => {
    const front = matchFront(
      [{ day: '2026-10-30', close: 113.43 }, { day: '2026-10-29', close: 114.88 }],
      {
        'BZF27.NYM': [{ day: '2026-10-30', close: 113.43 }, { day: '2026-10-29', close: 113.9 }],
        'BZZ26.NYM': [{ day: '2026-10-29', close: 114.88 }],
      },
    );
    expect(front).toEqual({ '2026-10-30': 'BZF27.NYM', '2026-10-29': 'BZZ26.NYM' });
  });

  it('compares each price with the same contract a week and a month back', () => {
    const w = buildWorldRows(ROWS, '2026-11-01')!;
    expect(w.day).toBe('2026-10-30');
    const by = Object.fromEntries(w.rows.map((r) => [r.series, r]));
    expect(by.brent).toMatchObject({ contract: 'BZF27.NYM', settle: 113.43, week: 1.5, month: 19.3 });
    expect(by.wti).toMatchObject({ week: 0.8, month: 17.8 });
    expect(by.ulsd).toMatchObject({ week: -2.3, month: 3.8 });
  });

  it('clamps "a month back" to the end of a shorter month', () => {
    expect(minusMonth('2026-10-31')).toBe('2026-09-30');
    expect(minusMonth('2027-03-31')).toBe('2027-02-28');
    expect(minusMonth('2026-01-15')).toBe('2025-12-15');
  });

  it('prints nothing for a day not every series settled', () => {
    expect(buildWorldRows(ROWS.filter((r) => r.series !== 'ulsd'), '2026-11-01')).toBeNull();
  });
});

describe('the fuel-price card', () => {
  const m = buildOilCardModel(ROWS, new Date('2026-11-01T08:00:00Z'));

  it('dates itself by Dhaka and the settlement by New York', () => {
    expect(m.published).toEqual({ weekday: 'Sunday', date: '1 November 2026' });
    expect(m.world?.settlement).toBe('30 Oct 2026');
    expect(m.filename).toBe('ESB_Fuel_Prices_2026-11-01.png');
  });

  it("names the month's instrument and calls an unmoved price unchanged", () => {
    expect(m.pump.chip).toBe('EMRD · November rate');
    expect(m.pump.tiles.map((t) => [t.name, t.value, t.state])).toEqual([
      ['Diesel', 135, 'unchanged'],
      ['Kerosene', 155, 'unchanged'],
      ['Petrol', 160, 'unchanged'],
      ['Octane', 165, 'unchanged'],
    ]);
    expect(m.pump.tiles.every((t) => t.since === '21 Sep')).toBe(true);
  });

  it('prints no "▲ ৳20" until a document states the price it replaced', () => {
    expect(LAST_FUEL_CHANGE.previous).toBeNull();
    expect(m.pump.tiles.every((t) => t.lastChange === null)).toBe(true);
  });

  it('says a month EMRD has not ruled on is awaited, never carried forward silently', () => {
    const last = EMRD_FUEL_MONTHS.at(-1)!.month; // 2026-11
    const [y, mo] = last.split('-').map(Number);
    const next = new Date(Date.UTC(mo === 12 ? y + 1 : y, mo === 12 ? 0 : mo, 2, 6));
    expect(buildOilCardModel(ROWS, next).pump.chip).toBe('EMRD · November rate · awaiting December notice');
  });

  it('carries the triangle by sign and keeps the figure unsigned', () => {
    const ulsd = m.world!.rows.find((r) => r.id === 'ulsd')!;
    expect(ulsd).toMatchObject({ price: '4.68', week: { dir: 'down', pct: '2.3' }, month: { dir: 'up', pct: '3.8' } });
  });
});
