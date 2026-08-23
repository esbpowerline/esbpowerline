import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  banglaToLatinDigits,
  buildLiveGridSnapshot,
  parseNldcDemandSupplyHtml,
  parseNldcGenerationHtml,
} from '@/lib/data/grid/live-grid-parse';

/**
 * Fixtures are the REAL NLDC pages as served 2026-08-23 ~12:00 Dhaka —
 * including the trap that motivated the comment-stripping: the generation
 * page's deficit and load-shed columns are commented out, and a parser that
 * reads inside comments invents two extra cells per row.
 */
const fixture = (name: string) =>
  readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

describe('banglaToLatinDigits', () => {
  it('translates every Bangla digit and leaves the rest alone', () => {
    expect(banglaToLatinDigits('২৩-০৮-২০২৬ ১০:০০:০০ MW')).toBe('23-08-2026 10:00:00 MW');
  });
});

describe('parseNldcGenerationHtml', () => {
  const rows = parseNldcGenerationHtml(fixture('nldc-gen.html'));

  it('parses every posted hour and sorts oldest first', () => {
    expect(rows.length).toBeGreaterThan(40);
    expect(rows[0].at < rows[rows.length - 1].at).toBe(true);
  });

  it('reads the 10:00 row exactly as printed', () => {
    const r = rows.find((x) => x.at === '2026-08-23T10:00:00');
    expect(r).toBeDefined();
    expect(r).toMatchObject({
      totalMw: 14663,
      gasMw: 4846,
      liquidMw: 1961,
      coalMw: 5267,
      hydroMw: 220,
      solarMw: 464,
      windMw: 25,
      bheramaraMw: 902,
      tripuraMw: 112,
      adaniMw: 828,
      nepalMw: 38,
    });
    // The commented-out columns must NOT leak in: loadshed is unknown here.
    expect(r?.loadShedMw).toBeNull();
  });

  it('reconciles the printed total against the component sum', () => {
    const r = rows[rows.length - 1];
    const sum =
      r.gasMw + r.liquidMw + r.coalMw + r.hydroMw + r.solarMw + r.windMw +
      r.bheramaraMw + r.tripuraMw + r.adaniMw + r.nepalMw;
    expect(Math.abs(r.totalMw - sum)).toBeLessThanOrEqual(1);
  });

  it('still parses the 16-cell layout if PGCB re-enables the hidden columns', () => {
    const wide = `<table><tr>
      <td>২৩-০৮-২০২৬</td><td>১১:০০:০০</td><td>১০০০</td><td>-১০০০.০০</td><td>৫০</td>
      <td>৪০০</td><td>১০০</td><td>৩০০</td><td>৫০</td><td>২৫</td><td>৫</td>
      <td>৬০</td><td>১০</td><td>৪০</td><td>১০</td><td>remark</td>
    </tr></table>`;
    const [r] = parseNldcGenerationHtml(wide);
    expect(r).toMatchObject({ totalMw: 1000, loadShedMw: 50, gasMw: 400, nepalMw: 10, remark: 'remark' });
  });
});

describe('parseNldcDemandSupplyHtml', () => {
  const rows = parseNldcDemandSupplyHtml(fixture('nldc-dsl.html'));

  it('reads the 10:00 row exactly as printed', () => {
    const r = rows.find((x) => x.at === '2026-08-23T10:00:00');
    expect(r).toMatchObject({ demandMw: 14701, supplyMw: 14200, loadShedMw: 501 });
  });

  it('keeps the peak remarks', () => {
    const evening = rows.find((x) => x.remark === 'Evening Peak');
    expect(evening).toBeDefined();
  });
});

describe('buildLiveGridSnapshot', () => {
  const snapshot = buildLiveGridSnapshot(
    parseNldcGenerationHtml(fixture('nldc-gen.html')),
    parseNldcDemandSupplyHtml(fixture('nldc-dsl.html')),
    { fetchedAt: '2026-08-23T06:10:00.000Z', generationUrl: 'g', demandSupplyUrl: 'd' },
  );

  it('joins the two pages on the hour and marks the newest as latest', () => {
    expect(snapshot.asOf).toBe('2026-08-23T10:00:00');
    expect(snapshot.latest.demandMw).toBe(14701);
    expect(snapshot.latest.supplyMw).toBe(14200);
    expect(snapshot.latest.loadShedMw).toBe(501);
    expect(snapshot.latest.imports.indiaMw).toBe(902 + 112 + 828);
    expect(snapshot.reconciles).toBe(true);
  });

  it('caps the hour list at 24 and keeps it oldest-first', () => {
    expect(snapshot.hours.length).toBeLessThanOrEqual(24);
    expect(snapshot.hours[0].at < snapshot.asOf).toBe(true);
    expect(snapshot.hours[snapshot.hours.length - 1].at).toBe(snapshot.asOf);
  });

  it("today's extremes come from today's rows only", () => {
    expect(snapshot.today.date).toBe('2026-08-23');
    expect(snapshot.today.maxDemandAt.startsWith('2026-08-23')).toBe(true);
    expect(snapshot.today.maxDemandMw).toBeGreaterThanOrEqual(14701);
  });

  it('throws rather than returning an empty snapshot', () => {
    expect(() =>
      buildLiveGridSnapshot([], [], { fetchedAt: 'x', generationUrl: 'g', demandSupplyUrl: 'd' }),
    ).toThrow();
  });
});
