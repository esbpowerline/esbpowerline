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

  it('reconciles the printed total against the components it reported', () => {
    const r = rows[rows.length - 1];
    const sum = [
      r.gasMw, r.liquidMw, r.coalMw, r.hydroMw, r.solarMw, r.windMw,
      r.bheramaraMw, r.tripuraMw, r.adaniMw, r.nepalMw,
    ].reduce<number>((a, v) => a + (v ?? 0), 0);
    expect(Math.abs(r.totalMw - sum)).toBeLessThanOrEqual(1);
  });

  /**
   * The distinction the parser used to destroy.
   *
   * NLDC prints a literal `0` for a measured zero and an EMPTY cell for a
   * column it is not reporting, and it uses both on the same row: 2015-05-03
   * 23:00 carries `0` for Tripura and nothing at all for Adani — two different
   * cells on one row, so the distinction is the source's own.
   *
   * `adaniMw: adani ?? 0` collapsed the two. Measured across 3,381 preserved
   * documents it put a figure into 84,895 canonical observations for Adani,
   * 86,880 for Nepal, 73,572 for wind and 21,897 for solar where the source
   * printed none.
   */
  it('keeps a blank cell absent and a printed zero zero', () => {
    const era2015 = `<table><tr>
      <td>০৩-০৫-২০১৫</td><td>২৩:০০:০০</td><td>৬৮২৩</td>
      <td>৪৮২৬</td><td>১৩২৭</td><td>১৫৮</td><td>৪৬</td>
      <td></td><td></td>
      <td>৪৬৬</td><td>০</td><td></td><td></td><td></td>
    </tr></table>`;
    const [r] = parseNldcGenerationHtml(era2015);
    expect(r.totalMw).toBe(6823);
    expect(r.gasMw).toBe(4826);
    // Printed zero — a measurement.
    expect(r.tripuraMw).toBe(0);
    // Blank — not reported. Never 0.
    expect(r.solarMw).toBeNull();
    expect(r.windMw).toBeNull();
    expect(r.adaniMw).toBeNull();
    expect(r.nepalMw).toBeNull();
  });

  it('derives an import total from reported components only, or null', () => {
    const snap = buildLiveGridSnapshot(
      [{
        at: '2015-05-03T23:00:00', totalMw: 6823, gasMw: 4826, coalMw: 158,
        liquidMw: 1327, hydroMw: 46, solarMw: null, windMw: null,
        bheramaraMw: 466, tripuraMw: 0, adaniMw: null, nepalMw: null,
        loadShedMw: null, remark: '',
      }],
      [],
      { fetchedAt: 'x', generationUrl: 'g', demandSupplyUrl: 'd' },
    );
    // Bheramara + Tripura were reported; Adani was not and must not become 0.
    expect(snap.latest.imports.indiaMw).toBe(466);
    expect(snap.latest.imports.adaniMw).toBeNull();
    expect(snap.latest.imports.totalMw).toBe(466);
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

  /**
   * The layout that broke it. Between 2026-08-23 and 2026-09-04 NLDC made the
   * time cell responsive — the hour is printed once per breakpoint, and
   * `stripTags` flattens both spans into "13:00:00 13:00". The anchored
   * `^(\d{2}):(\d{2}):(\d{2})$` rejected that, so every row was dropped and the
   * demand/supply half of the live layer went dark. The generation page was not
   * changed, so nothing looked broken: the site simply said "Current Demand —
   * awaiting NLDC" while NLDC was publishing 13,847 MW for that hour.
   *
   * The old fixture kept passing throughout. Both layouts are pinned here now,
   * because a captured fixture only proves the parser handles the day it was
   * captured — refresh it when the publisher moves, and keep the old one.
   */
  describe('responsive time cell (as served 2026-09-04)', () => {
    const live = parseNldcDemandSupplyHtml(fixture('nldc-dsl-responsive.html'));

    it('parses the page that the anchored regex silently dropped', () => {
      expect(live.length).toBeGreaterThan(40);
    });

    it('reads the 13:00 row exactly as printed', () => {
      const r = live.find((x) => x.at === '2026-09-04T13:00:00');
      expect(r).toMatchObject({ demandMw: 13847, supplyMw: 13460, loadShedMw: 387 });
    });

    it('takes the desktop span, not the truncated mobile one', () => {
      // Both spans say the same hour; the seconds must survive either way.
      expect(live.every((r) => /T\d{2}:\d{2}:\d{2}$/.test(r.at))).toBe(true);
    });

    it('parses a cell whose mobile span is listed first', () => {
      const flipped = `<table><tr>
        <td>০৪-০৯-২০২৬</td>
        <td><span class="time-mobile">১৩:০০</span><span class="time-desktop">১৩:০০:০০</span></td>
        <td>১৩৮৪৭</td><td>১৩৪৬০</td><td>৩৮৭</td><td>—</td>
      </tr></table>`;
      const [r] = parseNldcDemandSupplyHtml(flipped);
      expect(r).toMatchObject({ at: '2026-09-04T13:00:00', demandMw: 13847 });
    });
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
    expect(snapshot.today.maxDemandAt?.startsWith('2026-08-23')).toBe(true);
    expect(snapshot.today.maxDemandMw).toBeGreaterThanOrEqual(14701);
  });

  it('throws rather than returning an empty snapshot', () => {
    expect(() =>
      buildLiveGridSnapshot([], [], { fetchedAt: 'x', generationUrl: 'g', demandSupplyUrl: 'd' }),
    ).toThrow();
  });

  /**
   * The second half of the 2026-09-04 failure, and the reason it was invisible.
   * With the demand page unparseable, `today` fell back to the generation
   * table: peak demand became the generation total, peak supply became the
   * generation total, and load shed became `Math.max(0, ...[])` — a printed
   * zero asserting that no load was shed on a day nobody measured.
   *
   * Generation is not demand and not supply. On 2026-09-04 at 13:00 NLDC
   * published 13,864 MW generated, 13,460 MW supplied and 13,847 MW demanded,
   * with the day's demand peak at 14,937 MW — so the fallback understated peak
   * demand by 1,073 MW under a label that named it demand.
   */
  it('never substitutes generation when the demand page yields nothing', () => {
    const genOnly = buildLiveGridSnapshot(
      parseNldcGenerationHtml(fixture('nldc-gen.html')),
      [],
      { fetchedAt: '2026-08-23T06:10:00.000Z', generationUrl: 'g', demandSupplyUrl: 'd' },
    );

    expect(genOnly.latest.totalMw).toBeGreaterThan(0); // generation still reported
    expect(genOnly.today.maxDemandMw).toBeNull();
    expect(genOnly.today.maxDemandAt).toBeNull();
    expect(genOnly.today.maxSupplyMw).toBeNull();
    expect(genOnly.today.maxSupplyAt).toBeNull();
    // Not 0 — nobody measured it.
    expect(genOnly.today.maxLoadShedMw).toBeNull();
    expect(genOnly.latest.demandMw).toBeNull();
    expect(genOnly.latest.supplyMw).toBeNull();
  });
});
