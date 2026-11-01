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
import { buildOilCardModel, cardableDays, oilCaption, oilCardCsv } from '@/lib/data/oil/oil-card';
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
  const m = buildOilCardModel(ROWS, { now: new Date('2026-11-01T08:00:00Z') });

  it('dates itself by Dhaka and the settlement by New York', () => {
    expect(m.published).toEqual({ weekday: 'Sunday', date: '1 November 2026' });
    expect(m.world?.settlement).toBe('30 Oct 2026');
    expect(m.filename).toBe('ESB_Fuel_Prices_2026-11-01');
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
    expect(buildOilCardModel(ROWS, { now: next }).pump.chip).toBe('EMRD · November rate · awaiting December notice');
  });

  it('carries the triangle by sign and keeps the figure unsigned', () => {
    const ulsd = m.world!.rows.find((r) => r.id === 'ulsd')!;
    expect(ulsd).toMatchObject({ price: '4.68', week: { dir: 'down', pct: '2.3' }, month: { dir: 'up', pct: '3.8' } });
  });
});

describe('cards for a missed day', () => {
  // A full trading week for each series' front contract, 26–30 Oct 2026, plus
  // Brent's expiring December on its last day (30 Oct) and the baselines.
  const week = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'];
  const rows: Settlement[] = [...ROWS];
  for (const [series, contract, base] of [
    ['wti', 'CLZ26.NYM', 100],
    ['rbob', 'RBZ26.NYM', 3],
    ['ulsd', 'HOZ26.NYM', 4.5],
  ] as const) {
    week.slice(0, 4).forEach((d, i) => rows.push(S(series, contract, d, base + i, true)));
  }
  week.slice(0, 4).forEach((d, i) => {
    rows.push(S('brent', 'BZZ26.NYM', d, 115 + i, true));
    rows.push(S('brent', 'BZF27.NYM', d, 110 + i));
  });
  // On its expiry day the bar matched the expiring contract.
  rows.push(S('brent', 'BZZ26.NYM', '2026-10-30', 117.64, false));

  it('reads the last session settled before the day began', () => {
    // A card for Thu 29 Oct reads Wed 28 Oct, not the Thursday session.
    const m = buildOilCardModel(rows, { day: '2026-10-29' });
    expect(m.world?.settlement).toBe('28 Oct 2026');
    expect(m.published).toEqual({ weekday: 'Thursday', date: '29 October 2026' });
    expect(m.filename).toBe('ESB_Fuel_Prices_2026-10-29');
  });

  it('quotes the contract still trading after an expiry day', () => {
    // 30 Oct was Brent December's last day; a card for 31 Oct must not
    // print the expired contract's 117.64.
    const m = buildOilCardModel(
      rows.map((r) => (r.series === 'brent' && r.day === '2026-10-30' && r.contract === 'BZZ26.NYM' ? { ...r, front: true } : r.series === 'brent' && r.day === '2026-10-30' ? { ...r, front: false } : r)).concat([S('brent', 'BZF27.NYM', '2026-11-02', 114, true), S('wti', 'CLZ26.NYM', '2026-11-02', 105, true), S('rbob', 'RBZ26.NYM', '2026-11-02', 3.2, true), S('ulsd', 'HOZ26.NYM', '2026-11-02', 4.7, true)]),
      { day: '2026-10-31' },
    );
    expect(m.world?.rows.find((r) => r.id === 'brent')).toMatchObject({ price: '113.43', contract: 'BZF27.NYM' });
  });

  it('keeps a contract that settled again the next day, even if the front then moved', () => {
    // The card for 30 Oct reads 29 Oct. December Brent still settled on the
    // 30th, so it is 29 Oct's contract, though January was front by the 30th.
    const live = rows
      .filter((r) => !(r.series === 'brent' && r.day === '2026-10-30'))
      .concat([S('brent', 'BZF27.NYM', '2026-10-30', 113.43, true), S('brent', 'BZZ26.NYM', '2026-10-30', 117.64, false)]);
    const m = buildOilCardModel(live, { day: '2026-10-30' });
    expect(m.world?.rows.find((r) => r.id === 'brent')).toMatchObject({ price: '118.00', contract: 'BZZ26.NYM' });
  });

  it('refuses a world settlement more than five days old', () => {
    // Friday's settlement is good through Wednesday — the Tuesday after a
    // Monday holiday with a day to spare — and refused from Thursday.
    expect(buildOilCardModel(rows, { day: '2026-11-04' }).world?.settlement).toBe('30 Oct 2026');
    expect(buildOilCardModel(rows, { day: '2026-11-05' }).world).toBeNull();
  });

  it('offers only days the archive can answer', () => {
    const days = cardableDays(rows, '2026-11-01');
    expect(days[0]).toBe('2026-10-27');
    expect(days.at(-1)).toBe('2026-11-01');
    expect(days).not.toContain('2026-10-26'); // nothing settled on or before the 25th
  });

  it('reads the EMRD instrument in force on the day, not today', () => {
    const oct = buildOilCardModel(rows, { day: '2026-10-29' });
    expect(oct.pump.chip).toBe('EMRD · October rate');
    expect(oct.pump.instrument?.memoNo).toBe('28.00.0000.000.026.35.0116.24.452');
    const sep = buildOilCardModel([], { day: '2026-09-25' });
    expect(sep.pump.chip).toBe('EMRD · September rate');
    expect(sep.pump.tiles.every((t) => t.state === 'changed' && t.value != null)).toBe(true);
    const before = buildOilCardModel([], { day: '2026-09-10' });
    expect(before.pump.tiles.every((t) => t.value === null)).toBe(true);
  });

  it('writes the caption and the data file from the same figures', () => {
    const m = buildOilCardModel(ROWS, { day: '2026-11-01' });
    const cap = oilCaption(m);
    expect(cap).toContain('Sunday, 1 November 2026');
    expect(cap).toContain('Diesel: Tk 135 (unchanged since 21 Sep)');
    expect(cap).toContain('Brent Crude: $113.43 per barrel (▲1.5% / ▲19.3%)');
    expect(cap).toContain('memo 28.00.0000.000.026.35.0116.24.499');
    const csv = oilCardCsv(m).trim().split(/\n/);
    expect(csv).toHaveLength(1 + 4 + 4);
    expect(csv).toContain('2026-11-01,world,Heating Oil (ULSD),4.68,USD/gallon,-2.3,3.8,HOZ26.NYM,2026-10-30,2026-10-23,2026-09-30,Yahoo Finance chart API');
  });
});
