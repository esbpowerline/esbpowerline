import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  banglaToLatinDigits,
  buildLiveGridSnapshot,
  parseNldcDemandSupplyHtml,
  parseNldcGenerationHtml,
  parseNldcIndiaImportHtml,
  parseNldcNepalImportHtml,
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

/**
 * The two cross-border import pages, as served 2026-09-07 ~14:00 Dhaka.
 *
 * These pages are the only place NLDC publishes an hourly forecast per
 * interconnector. The actuals beside them duplicate the generation table, and
 * the last test here is the one that matters most: it pins that redundancy as a
 * CHECK rather than trusting it. If PGCB ever changes what one page means
 * without changing the other, this is what says so.
 */
describe('parseNldcIndiaImportHtml', () => {
  const rows = parseNldcIndiaImportHtml(fixture('nldc-india-import.html'));

  it('reads every data row and neither of the two header rows', () => {
    // The header is two <tr>s deep — the interconnector names carry colspan=2
    // over a প্রকৃত/পূর্বাভাস pair — and both must fall to the date check.
    expect(rows).toHaveLength(51);
    expect(rows.every((r) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(r.at))).toBe(true);
  });

  it('keeps the actual and the forecast apart, per interconnector', () => {
    const r = rows[rows.length - 1];
    expect(r.at).toBe('2026-09-07T08:00:00');
    expect(r.bheramaraMw).toBe(738);
    expect(r.bheramaraForecastMw).toBe(1000);
    expect(r.tripuraMw).toBe(138);
    expect(r.tripuraForecastMw).toBe(60);
    expect(r.adaniMw).toBe(1020);
    expect(r.adaniForecastMw).toBe(1436);
  });

  it('sorts oldest first, like every other NLDC parser here', () => {
    expect([...rows].sort((a, b) => a.at.localeCompare(b.at))).toEqual(rows);
  });
});

describe('parseNldcNepalImportHtml', () => {
  const rows = parseNldcNepalImportHtml(fixture('nldc-nepal-import.html'));

  it('reads every data row', () => {
    expect(rows).toHaveLength(51);
  });

  it('keeps a printed zero as a measured zero, not an absence', () => {
    // Nepal prints a literal ০ rather than blanking the cell for most hours.
    // That is a statement that the line carried nothing, and it must survive as
    // 0 — collapsing it to null would lose a measurement, exactly as reading a
    // blank cell as 0 would invent one.
    const r = rows[rows.length - 1];
    expect(r.at).toBe('2026-09-07T08:00:00');
    expect(r.nepalMw).toBe(0);
    expect(r.nepalForecastMw).toBe(0);
    expect(rows.every((x) => x.nepalMw !== null)).toBe(true);
  });
});

describe('the import pages against the generation page', () => {
  /*
    Every actual on the two import pages also appears on view_generations_bn,
    and on 2026-09-07 all three fixtures were captured within the same minute,
    so they describe the same hours. 102 comparisons, 0 disagreements.

    This is why the import pages are ingested for the FORECAST and not for the
    actuals — and pinning it here turns the redundancy into the kind of check
    that has caught every real defect in this repo: a figure held against
    something else that should agree with it, rather than against the parser
    that produced it.
  */
  it('agrees on every interconnector, for every hour both pages carry', () => {
    // The 2026-09-07 generation capture, not `nldc-gen.html` (2026-08-23):
    // all three of these were fetched in one pass so they describe the same
    // hours. The older fixture is kept and still pins the 2026-08 layout.
    const gen = new Map(
      parseNldcGenerationHtml(fixture('nldc-gen-2026-09-07.html')).map((r) => [r.at, r]),
    );
    const india = parseNldcIndiaImportHtml(fixture('nldc-india-import.html'));
    const nepal = parseNldcNepalImportHtml(fixture('nldc-nepal-import.html'));

    const disagreements: string[] = [];
    let compared = 0;
    for (const r of india) {
      const g = gen.get(r.at);
      if (!g) continue;
      compared += 1;
      for (const k of ['bheramaraMw', 'tripuraMw', 'adaniMw'] as const) {
        if (g[k] !== r[k]) disagreements.push(`${r.at} ${k}: gen ${g[k]} vs india ${r[k]}`);
      }
    }
    for (const r of nepal) {
      const g = gen.get(r.at);
      if (!g) continue;
      compared += 1;
      if (g.nepalMw !== r.nepalMw) {
        disagreements.push(`${r.at} nepalMw: gen ${g.nepalMw} vs nepal ${r.nepalMw}`);
      }
    }

    expect(disagreements).toEqual([]);
    // A guard on the guard: if the fixtures ever stop overlapping, the loop
    // above compares nothing and passes vacuously. That is the failure mode
    // gas-vs-archive had, which passed 4,529 days by reading two keys that
    // existed in none of them.
    expect(compared).toBeGreaterThan(0);
  });
});
