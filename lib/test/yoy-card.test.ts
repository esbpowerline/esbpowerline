import { describe, expect, it } from 'vitest';
import { buildYoyCardModel, shortDate } from '@/lib/data/grid/yoy-card';
import type { YoyResult, YoyRow } from '@/lib/data/grid/yoy-comparison';

/**
 * The card is a picture of the sheet. These pin that it reproduces the sheet's
 * own strings rather than formatting anything a second time, and that colour
 * and arrow follow their two different rules.
 */

const row = (id: string, label: string, unit: string, a: number, b: number, pctText: string): YoyRow => {
  const delta = b - a;
  const fmt = (n: number) => n.toLocaleString('en-US');
  return {
    id,
    label,
    unit,
    a,
    b,
    pct: a === 0 ? null : (delta / a) * 100,
    aText: fmt(a),
    bText: fmt(b),
    delta,
    deltaText: `${delta >= 0 ? '+' : '-'}${fmt(Math.abs(delta))}`,
    pctText,
  };
};

// 14 Oct 2026 against 14 Oct 2025, as the English sheet published it.
const SHEET: Extract<YoyResult, { ok: true }> = {
  ok: true,
  date: '2026-10-14',
  text: '',
  filename: 'x.txt',
  aLabel: '2025',
  bLabel: '2026',
  heading: '',
  subheading: '',
  footer: [],
  lang: 'en',
  rows: [
    row('system.eveningPeakDemand', 'Evening peak demand', 'MW', 14272, 18316, '28'),
    row('system.eveningPeakGen', 'Evening peak generation', 'MW', 13924, 15132, '9'),
    row('shedding.total', 'Load shedding', 'MW', 333, 3047, '815'),
    row('gas.toPower', 'Gas supplied to power', 'MMCFD', 865, 792, '9'),
    row('gas.domestic', 'Domestic gas production', 'MMCFD', 1787, 1599, '11'),
    row('gas.lng', 'LNG supply', 'MMCFD', 941, 764, '19'),
    row('gas.total', 'Total gas production', 'MMCFD', 2728, 2363, '13'),
    row('system.totalEnergyGen', 'Total energy generated', 'MKWh', 312, 346, '11'),
    row('system.totalDailyCost', 'Generation cost', 'crore BDT', 222, 318, '43'),
  ],
};

describe('the year-on-year social card', () => {
  const m = buildYoyCardModel(SHEET, new Date('2026-10-20T06:00:00Z'));
  const all = m.groups.flatMap((g) => g.rows);
  const byId = Object.fromEntries(all.map((r) => [r.id, r]));

  it('groups the nine rows the way the card draws them', () => {
    expect(m.groups.map((g) => [g.key, g.rows.length])).toEqual([
      ['power', 4],
      ['gas', 4],
      ['cost', 1],
    ]);
    expect(m.groups.map((g) => g.label)).toEqual(['Electricity', 'Gas', 'Cost']);
    expect(m.groups[0].rows.map((r) => r.id)).toEqual([
      'system.eveningPeakDemand',
      'system.eveningPeakGen',
      'shedding.total',
      'system.totalEnergyGen',
    ]);
  });

  it('prints the sheet’s own strings, with a true minus sign', () => {
    expect(byId['shedding.total']).toMatchObject({ then: '333', now: '3,047', change: '+2,714', pct: '815' });
    expect(byId['gas.lng'].change).toBe('−177');
  });

  it('colours by verdict and points by sign, which are different things', () => {
    // Shedding rose: red, pointing up.
    expect(byId['shedding.total']).toMatchObject({ tone: 'bad', dir: 'up' });
    // Generation rose: green, pointing up.
    expect(byId['system.eveningPeakGen']).toMatchObject({ tone: 'good', dir: 'up' });
    // Demand is neither good nor bad news on its own.
    expect(byId['system.eveningPeakDemand']).toMatchObject({ tone: 'neutral', dir: 'up' });
    expect(byId['gas.domestic']).toMatchObject({ tone: 'bad', dir: 'down' });
  });

  it('calls domestic plus LNG what it is: supply, not production', () => {
    expect(byId['gas.total'].label).toBe('Total gas supply');
  });

  it('names both compared days and the day it was published', () => {
    expect(m).toMatchObject({ thenLabel: '14 Oct 2025', nowLabel: '14 Oct 2026', thenYear: '2025', nowYear: '2026' });
    expect(m.published).toEqual({ weekday: 'Tuesday', date: '20 October 2026' });
    expect(m.filename).toBe('ESB_YoY_Card_2026-10-14.png');
  });

  it('refuses the Bengali sheet rather than drawing it into an English design', () => {
    expect(() => buildYoyCardModel({ ...SHEET, lang: 'bn' })).toThrow();
  });

  it('reads an ISO day as plain parts', () => {
    expect(shortDate('2026-01-01')).toBe('1 Jan 2026');
  });
});
