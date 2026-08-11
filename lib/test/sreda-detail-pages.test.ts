/**
 * The SREDA detail pages added 2026-08-11.
 *
 * Each test below pins a specific way the parse can be silently wrong. They use
 * the real markup shapes from ndre.sreda.gov.bd, because every one of these
 * traps was found in the live pages rather than imagined.
 */
import { describe, it, expect } from 'vitest';
import {
  buildSredaReconciliation,
  parseSredaCarbonHtml,
  buildSredaProjectRegister,
  parseSredaOrganisationHtml,
  parseSredaRegisterHeadline,
  parseSredaTechnologyHtml,
  parseSredaYearWiseHtml,
  sredaRegisterHasNextPage,
} from '@/lib/data/sreda/parse-sreda-html';
import type { SredaDailyData, SredaProjectRegister } from '@/lib/data/sreda/types';

/**
 * SREDA prints the RE Source cell only on the row that opens a group, so a
 * group-opening row has 7 cells and every row beneath it has 5.
 */
const TECH_HTML = `
<table>
<tr><th>SL.</th><th>RE Source</th><th>Technology</th><th>Quantity</th><th>Off-grid MWp</th><th>On-grid MWp</th><th>Total MWp</th></tr>
<tr><td>1.</td><td>Solar</td><td>Solar Park</td><td>14</td><td>0</td><td>745.25</td><td>745.25</td></tr>
<tr><td>Net Metering Rooftop Solar</td><td>4922</td><td>0</td><td>337.775</td><td>337.775</td></tr>
<tr><td>Solar Home System</td><td>6037583</td><td>263.657</td><td>0</td><td>263.657</td></tr>
<tr><td>2.</td><td>Wind</td><td>All Wind Projects</td><td>2</td><td>0</td><td>62</td><td>62</td></tr>
<tr><td>3.</td><td>Hydro</td><td>All Hydro Projects</td><td>1</td><td>0</td><td>230</td><td>230</td></tr>
<tr><td><strong>Total</strong></td><td>6042522</td><td>263.657</td><td>1375.025</td><td>1638.682</td></tr>
</table>`;

/** The solar-irrigation table switches unit mid-column: MWp for IDCOL, kWp for BARI. */
const ORG_HTML = `
<table>
<tr><th>Organization</th><th>Quantity</th><th>Installed Capacity</th><th>In Map</th></tr>
<tr><td>IDCOL</td><td>1555</td><td>43.47 MWp</td><td>GO-L</td></tr>
<tr><td>BADC</td><td>692</td><td>7.73 MWp</td><td>GO-L</td></tr>
<tr><td>BARI</td><td>38</td><td>55.65 kWp</td><td>GO-L</td></tr>
<tr><td><strong>Total</strong></td><td>2285</td><td>51.256 MWp</td><td>GO-L</td></tr>
</table>`;

const CARBON_HTML = `
<table>
<tr><th>Technology Name</th><th>Installed Capacity</th><th>System Life</th><th>Till Today</th></tr>
<tr><th>Expected Energy Generation</th><th>CO 2 Emission Reduction</th><th>Expected Energy Generation</th><th>CO 2 Emission Reduction</th></tr>
<tr><td>Solar Park</td><td>745.25 MWp</td><td>17 TWh</td><td>11 M tCO 2</td><td>3 TWh</td><td>2 M tCO 2</td></tr>
<tr><td>Wind (On-Grid)</td><td>62 MWp</td><td>3 TWh</td><td>2 M tCO 2</td><td>339 GWh</td><td>227 k tCO 2</td></tr>
</table>`;

describe('SREDA technology-wise page', () => {
  const { technologyBreakdown, technologyTotals } = parseSredaTechnologyHtml(TECH_HTML);

  it('carries the RE Source down to continuation rows instead of shifting columns', () => {
    // If the source were read positionally, these rows would land two columns
    // over and report a technology name as a capacity.
    const byTech = Object.fromEntries(technologyBreakdown.map((r) => [r.technology, r]));
    expect(byTech['Solar Park'].source).toBe('Solar');
    expect(byTech['Net Metering Rooftop Solar'].source).toBe('Solar');
    expect(byTech['Solar Home System'].source).toBe('Solar');
    expect(byTech['All Wind Projects'].source).toBe('Wind');
    expect(byTech['All Hydro Projects'].source).toBe('Hydro');
  });

  it('reads capacities from continuation rows without offset', () => {
    const shs = technologyBreakdown.find((r) => r.technology === 'Solar Home System')!;
    expect(shs.quantity).toBe(6_037_583);
    expect(shs.offGridMwp).toBe(263.657);
    expect(shs.onGridMwp).toBe(0);
    expect(shs.totalMwp).toBe(263.657);
  });

  it('keeps installation counts separate from capacity', () => {
    // 6,037,583 solar home systems against 14 solar parks: a count, not MWp.
    const parks = technologyBreakdown.find((r) => r.technology === 'Solar Park')!;
    expect(parks.quantity).toBe(14);
    expect(parks.totalMwp).toBe(745.25);
  });

  it('reads SREDA’s own Total row separately from the rows above it', () => {
    expect(technologyTotals).toEqual({
      quantity: 6_042_522,
      offGridMwp: 263.657,
      onGridMwp: 1375.025,
      totalMwp: 1638.682,
    });
  });
});

describe('SREDA organisation pages', () => {
  const table = parseSredaOrganisationHtml(ORG_HTML, 'Solar Irrigation Pumps', 'https://example.test')!;

  it('converts kWp to MWp instead of treating the number as MWp', () => {
    const bari = table.rows.find((r) => r.organisation === 'BARI')!;
    // Stripping the unit would record 55.65 MWp — a thousandfold overstatement
    // that would make BARI the second-largest operator in the table.
    expect(bari.capacityMwp).toBeCloseTo(0.05565, 6);
    expect(bari.capacityPublished).toBe('55.65 kWp');
  });

  it('keeps SREDA’s printed string alongside the converted value', () => {
    expect(table.rows.map((r) => r.capacityPublished)).toEqual(['43.47 MWp', '7.73 MWp', '55.65 kWp']);
  });

  it('excludes the Total row from the organisation rows', () => {
    expect(table.rows.map((r) => r.organisation)).toEqual(['IDCOL', 'BADC', 'BARI']);
    expect(table.publishedTotalMwp).toBe(51.256);
    expect(table.publishedTotalQuantity).toBe(2285);
  });

  it('keeps the Total exactly as printed, so a kWp total is not shown as MWp', () => {
    // Solar Charging Stations totals 290.9 kWp. Rendering the converted number
    // displayed "0.29 MWp" — the same quantity, but not the published figure,
    // and rounded past the precision SREDA gave.
    const kwp = parseSredaOrganisationHtml(
      `<table>
       <tr><th>Organization</th><th>Quantity</th><th>Installed Capacity</th></tr>
       <tr><td>BREB</td><td>7</td><td>156 kWp</td></tr>
       <tr><td>BPDB</td><td>8</td><td>134.9 kWp</td></tr>
       <tr><td><strong>Total</strong></td><td>15</td><td>290.9 kWp</td></tr>
       </table>`,
      'Solar Charging Stations',
      'https://example.test',
    )!;
    expect(kwp.publishedTotalCapacity).toBe('290.9 kWp');
    expect(kwp.publishedTotalMwp).toBeCloseTo(0.2909, 6);
  });
});

/** SREDA's own large-project table carries "0021" and "0000" in its year column. */
const YEAR_LARGE_HTML = `
<table>
<tr><td>2024</td><td>380.48 MWp</td></tr>
<tr><td>2013</td><td>85.14 kWp</td></tr>
<tr><td>1988</td><td>230 MWp</td></tr>
<tr><td>0021</td><td>16.4 kWp</td></tr>
<tr><td>0000</td><td>370 kWp</td></tr>
<tr><td><strong>Total</strong></td><td>610.951 MW</td></tr>
</table>`;

const YEAR_SMALL_HTML = `
<table>
<tr><td>2020</td><td>331921</td><td>21.48 MWp</td></tr>
<tr><td>2021</td><td>4105</td><td>0 kWp</td></tr>
<tr><td><strong>Total</strong></td><td>336026</td><td>21.48 MW</td></tr>
</table>`;

describe('SREDA year-wise pages', () => {
  const large = parseSredaYearWiseHtml(YEAR_LARGE_HTML, 'Large Projects', 'https://example.test')!;
  const small = parseSredaYearWiseHtml(YEAR_SMALL_HTML, 'Small Projects', 'https://example.test')!;

  it('keeps malformed years rather than dropping their capacity', () => {
    // Their capacity is inside SREDA's own total, so discarding the rows would
    // break the reconciliation and hide capacity the agency counts.
    expect(large.rows.map((r) => r.year)).toEqual(['2024', '2013', '1988', '0021', '0000']);
    expect(large.rows.filter((r) => r.yearMalformed).map((r) => r.year)).toEqual(['0021', '0000']);
  });

  it('does not mark a real historic year as malformed', () => {
    expect(large.rows.find((r) => r.year === '1988')!.yearMalformed).toBe(false);
  });

  it('converts kWp rows in the year column too', () => {
    expect(large.rows.find((r) => r.year === '2013')!.capacityMwp).toBeCloseTo(0.08514, 6);
    expect(large.rows.find((r) => r.year === '2024')!.capacityMwp).toBe(380.48);
  });

  it('reads quantity only where SREDA prints a third column', () => {
    expect(large.rows[0].quantity).toBeNull();
    expect(small.rows.find((r) => r.year === '2020')!.quantity).toBe(331921);
  });

  it('records the Total row and the unit SREDA labelled it with', () => {
    // SREDA prints rows as MWp and the Total as MW; both are kept as stated.
    expect(large.publishedTotalMwp).toBe(610.951);
    expect(large.publishedTotalUnit).toBe('MW');
    expect(small.publishedTotalQuantity).toBe(336026);
  });

  it('reconciles the year rows against that Total', () => {
    const checks = buildSredaReconciliation({
      date: '2026-08-09',
      lastUpdate: '2026-08-09 13:57:56',
      sourceUrl: 'https://ndre.sreda.gov.bd/',
      totalRenewableMw: 0,
      renewableTech: [],
      reGridSharePct: 0,
      totalInstalledMw: 0,
      generationMix: [],
      scrapedAt: '2026-08-11T00:00:00.000Z',
      yearWiseTables: [large],
    });
    const check = checks.find((c) => c.check.includes('Large Projects by year'))!;
    // 380.48 + 0.08514 + 230 + 0.0164 + 0.37 = 610.95154
    expect(check.computed).toBeCloseTo(610.952, 3);
    expect(check.ok).toBe(true);
  });
});

/**
 * The register's real markup: an `abbr title` carrying the full agency and
 * financier names, a headline stating the view's own count and capacity, and a
 * "Next Page" link. All three were missed on the first pass — the headline was
 * never read, and the pagination was mistaken for a 30-row cap, which published
 * 30 of Solar Park's 76 projects.
 */
const REGISTER_PAGE_1 = `
<h3>All Wind Projects | System: 4, Capacity: 162.9 MWp</h3>
<table>
<tr><th>SL.</th><th>Project Name</th><th>SID</th><th>Capacity</th><th>Location</th><th>RE Technology</th><th>Agency</th><th>Finance LMFD</th><th>Completion Date</th><th>Present Status</th><th>Details</th></tr>
<tr><td>1</td><td>2 MW Wind Power Plant at Sirajgonj</td><td>370</td><td>2 MWp</td><td>Sirajganj Sadar, Sirajganj</td><td>Wind (On-Grid)</td><td><abbr title='North-West Power Generation Company Limited'>NWPGCL</abbr></td><td><abbr title='Own Investment (Own Investment)'>Own Investment</abbr></td><td>2025-04-26</td><td>Completed &amp; Running</td><td>Details</td></tr>
<tr><td>2</td><td>60 MW Wind Power Project at Coxs Bazar</td><td>158</td><td>60 MWp</td><td>Chakaria Upazila, Bazar</td><td>Wind (On-Grid)</td><td><abbr title='Bangladesh Power Development Board'>BPDB</abbr></td><td><abbr title='European Investment Bank (EIB)'>EIB</abbr></td><td>2024-03-08</td><td>Completed &amp; Running</td><td>Details</td></tr>
</table>
<p>(Page # 1)<a href="index.php?id=1&i=11&pg=2">Next Page</a></p>`;

const REGISTER_PAGE_2 = `
<table>
<tr><th>SL.</th><th>Project Name</th><th>SID</th><th>Capacity</th><th>Location</th><th>RE Technology</th><th>Agency</th><th>Finance LMFD</th><th>Completion Date</th><th>Present Status</th><th>Details</th></tr>
<tr><td>3</td><td>Matarbari 100 MW Wind Power Plant Project</td><td>4252</td><td>100 MWp</td><td>Maheshkhali, Bazar</td><td>Wind (On-Grid)</td><td>CPGCBL</td><td>N/A</td><td>2029-06-30</td><td>Under Planning</td><td>Details</td></tr>
<tr><td>4</td><td>0.9 MW Grid Connected Wind Turbine</td><td>173</td><td>900 kWp</td><td>Sonagazi, Feni</td><td>Wind (On-Grid)</td><td>BPDB</td><td>Own Investment</td><td>2006-09-27</td><td>Obsolete System/Plant</td><td>Details</td></tr>
</table>
<p>(Page # 2)</p>`;

const WIND_TECH_ROW = {
  source: 'Wind',
  technology: 'All Wind Projects',
  quantity: 2,
  offGridMwp: 0,
  onGridMwp: 62,
  totalMwp: 62,
};

function reconcileRegister(register: SredaProjectRegister, withTechRow = true) {
  return buildSredaReconciliation({
    date: '2026-08-09',
    lastUpdate: '2026-08-09 13:57:56',
    sourceUrl: 'https://ndre.sreda.gov.bd/',
    totalRenewableMw: 0,
    renewableTech: [],
    reGridSharePct: 0,
    totalInstalledMw: 0,
    generationMix: [],
    scrapedAt: '2026-08-11T00:00:00.000Z',
    ...(withTechRow ? { technologyBreakdown: [WIND_TECH_ROW] } : {}),
    projectRegisters: [register],
  });
}

describe('SREDA project register', () => {
  const register = buildSredaProjectRegister('All Wind Projects', 'https://example.test', [
    REGISTER_PAGE_1,
    REGISTER_PAGE_2,
  ])!;

  it('reads every published column, including agency and financing', () => {
    const first = register.rows[0];
    expect(first.projectName).toBe('2 MW Wind Power Plant at Sirajgonj');
    expect(first.sid).toBe('370');
    expect(first.capacityPublished).toBe('2 MWp');
    expect(first.location).toBe('Sirajganj Sadar, Sirajganj');
    expect(first.agency).toBe('NWPGCL');
    expect(first.finance).toBe('Own Investment');
    expect(first.completionDate).toBe('2025-04-26');
    expect(first.status).toBe('Completed & Running');
  });

  it('keeps the full names SREDA hides in an abbr title', () => {
    expect(register.rows[0].agencyFullName).toBe('North-West Power Generation Company Limited');
    expect(register.rows[1].financeFullName).toBe('European Investment Bank (EIB)');
  });

  it('reads the view headline that counts and sums every project', () => {
    expect(register.publishedSystemCount).toBe(4);
    expect(register.publishedCapacityMwp).toBe(162.9);
    expect(register.publishedCapacity).toBe('162.9 MWp');
  });

  it('detects the Next Page link rather than treating a full page as a cap', () => {
    expect(sredaRegisterHasNextPage(REGISTER_PAGE_1, 2)).toBe(true);
    expect(sredaRegisterHasNextPage(REGISTER_PAGE_2, 3)).toBe(false);
  });

  it('concatenates every page it was given', () => {
    expect(register.pagesFetched).toBe(2);
    expect(register.rows.map((r) => r.status)).toEqual([
      'Completed & Running',
      'Completed & Running',
      'Under Planning',
      'Obsolete System/Plant',
    ]);
  });

  it('counts only running projects as installed capacity', () => {
    // 2 + 60 = 62 MWp running, against 162.9 MWp if every row were summed —
    // which would present a planning pipeline as an installed fleet.
    const running = register.rows.filter((r) => r.status === 'Completed & Running');
    expect(running.reduce((s, r) => s + r.capacityMwp, 0)).toBe(62);
    expect(register.rows.reduce((s, r) => s + r.capacityMwp, 0)).toBeCloseTo(162.9, 3);
  });

  it('reconciles the row set and both capacities against SREDA', () => {
    const checks = reconcileRegister(register);
    const count = checks.find((c) => c.check.includes('projects read'))!;
    const headline = checks.find((c) => c.check.includes('all projects sum'))!;
    const running = checks.find((c) => c.check.includes('running projects'))!;
    expect([count.ok, headline.ok, running.ok]).toEqual([true, true, true]);
    expect(count.computed).toBe(4);
    expect(headline.computed).toBeCloseTo(162.9, 3);
    expect(running.computed).toBe(62);
  });

  it('fails the count check when a page was missed', () => {
    // This is what the headline is for. Reading only page one still sums to a
    // plausible number and its running total is unchanged, so only SREDA's own
    // published count exposes the gap.
    const partial = buildSredaProjectRegister('All Wind Projects', 'https://example.test', [
      REGISTER_PAGE_1,
    ])!;
    const checks = reconcileRegister(partial);
    expect(checks.find((c) => c.check.includes('projects read'))!.ok).toBe(false);
    expect(checks.find((c) => c.check.includes('all projects sum'))!.ok).toBe(false);
    // …while the running-capacity check still passes, which is exactly why it
    // cannot be relied on alone.
    expect(checks.find((c) => c.check.includes('running projects'))!.ok).toBe(true);
  });
});

describe('SREDA register headline', () => {
  it('reads a comma-grouped count and a kWp capacity', () => {
    const h = parseSredaRegisterHeadline('Solar Home System | System: 6,037,583, Capacity: 950 kWp')!;
    expect(h.systemCount).toBe(6037583);
    expect(h.capacityMwp).toBeCloseTo(0.95, 6);
  });

  it('returns null when no headline is present', () => {
    expect(parseSredaRegisterHeadline('<p>no headline here</p>')).toBeNull();
  });
});

describe('SREDA carbon page', () => {
  const rows = parseSredaCarbonHtml(CARBON_HTML);

  it('keeps the published strings rather than inventing numeric precision', () => {
    expect(rows).toHaveLength(2);
    expect(rows[0].technology).toBe('Solar Park');
    expect(rows[0].lifetimeEnergyExpected).toBe('17 TWh');
    // "3 TWh" carries one significant figure; parsing it to 3_000 GWh would
    // assert a precision SREDA never published.
    expect(rows[0].tillTodayEnergyExpected).toBe('3 TWh');
  });

  it('skips the second header row rather than reading it as a technology', () => {
    expect(rows.map((r) => r.technology)).not.toContain('Expected Energy Generation');
  });
});

describe('SREDA reconciliation', () => {
  function snapshotWith(overrides: Partial<SredaDailyData>): SredaDailyData {
    return {
      date: '2026-08-09',
      lastUpdate: '2026-08-09 13:57:56',
      sourceUrl: 'https://ndre.sreda.gov.bd/',
      totalRenewableMw: 0,
      renewableTech: [],
      reGridSharePct: 0,
      totalInstalledMw: 0,
      generationMix: [],
      scrapedAt: '2026-08-11T00:00:00.000Z',
      ...overrides,
    };
  }

  it('accepts a total that matches the rows within the printed precision', () => {
    const { technologyBreakdown, technologyTotals } = parseSredaTechnologyHtml(TECH_HTML);
    const checks = buildSredaReconciliation(snapshotWith({ technologyBreakdown, technologyTotals }));
    expect(checks.length).toBeGreaterThan(0);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it('reports a total that does not match, rather than adjusting either side', () => {
    const { technologyBreakdown, technologyTotals } = parseSredaTechnologyHtml(TECH_HTML);
    const wrong = { ...technologyTotals!, totalMwp: technologyTotals!.totalMwp + 5 };
    const checks = buildSredaReconciliation(
      snapshotWith({ technologyBreakdown, technologyTotals: wrong }),
    );
    const total = checks.find((c) => c.check.includes('total capacity'))!;
    expect(total.ok).toBe(false);
    expect(total.published).toBe(wrong.totalMwp); // published value left as-is
    expect(total.delta).toBeCloseTo(-5, 3);
  });

  it('derives the band from each figure’s own printed precision', () => {
    const { technologyBreakdown, technologyTotals } = parseSredaTechnologyHtml(TECH_HTML);
    const checks = buildSredaReconciliation(snapshotWith({ technologyBreakdown, technologyTotals }));
    const total = checks.find((c) => c.check.includes('total capacity'))!;
    // 745.25 (2dp) + 337.775, 263.657 and the 1638.682 total (3dp) + Wind 62 and
    // Hydro 230, printed as whole MWp and so worth +/-0.5 each.
    expect(total.tolerance).toBeCloseTo(0.005 + 0.0005 * 3 + 0.5 * 2, 6);
  });

  it('does not let integer-printed rows inherit a neighbouring column’s decimals', () => {
    // The national mix prints "6273 MW" beside "1823.65 MW". Pricing those
    // integers at two decimals gave a 0.04 band against a 0.35 rounding gap and
    // reported ordinary rounding as a source defect.
    const checks = buildSredaReconciliation(
      snapshotWith({
        totalInstalledMw: 32474,
        generationMix: [
          { fuel: 'Coal', capacityMw: 6273, sharePct: 19.32 },
          { fuel: 'Gas', capacityMw: 12472, sharePct: 38.41 },
          { fuel: 'Renewable', capacityMw: 1823.65, sharePct: 5.62 },
        ],
      }),
    );
    const mix = checks.find((c) => c.check.includes('National mix'))!;
    expect(mix.tolerance).toBeCloseTo(0.5 * 3 + 0.005, 6);
  });

  it('treats a printed zero as a structural absence, not a rounded figure', () => {
    // Reading SREDA's "0" as integer precision contributed +/-0.5 per empty row
    // and inflated the off-grid band to 3.06 MWp.
    const { technologyBreakdown, technologyTotals } = parseSredaTechnologyHtml(TECH_HTML);
    const checks = buildSredaReconciliation(snapshotWith({ technologyBreakdown, technologyTotals }));
    const offGrid = checks.find((c) => c.check.includes('off-grid'))!;
    // Only 263.657 and the 263.657 total are non-zero in that column.
    expect(offGrid.tolerance).toBeCloseTo(0.0005 * 2, 6);
  });

  it('measures a mixed-unit column in the unit each figure was printed in', () => {
    const table = parseSredaOrganisationHtml(ORG_HTML, 'Solar Irrigation Pumps', 'https://example.test')!;
    const checks = buildSredaReconciliation(snapshotWith({ organisationTables: [table] }));
    const sum = checks.find((c) => c.check.includes('organisations sum'))!;
    // 43.47 + 7.73 + 0.05565 = 51.25565 against a published 51.256.
    expect(sum.computed).toBeCloseTo(51.256, 3);
    expect(sum.ok).toBe(true);
  });

  it('compares the same quantity across two SREDA pages and flags disagreement', () => {
    const { technologyBreakdown, technologyTotals } = parseSredaTechnologyHtml(TECH_HTML);
    // The statistics page states 338.95 where the technology page states 337.775
    // — the real 2026-08-09 discrepancy.
    const table = parseSredaOrganisationHtml(
      `<table>
       <tr><th>Organization</th><th>Quantity</th><th>Installed Capacity</th></tr>
       <tr><td>BREB</td><td>2218</td><td>251.84 MWp</td></tr>
       <tr><td>BPDB</td><td>2733</td><td>87.11 MWp</td></tr>
       <tr><td><strong>Total</strong></td><td>4951</td><td>338.95 MWp</td></tr>
       </table>`,
      'Net Metered Rooftop Solar',
      'https://example.test',
    )!;
    const checks = buildSredaReconciliation(
      snapshotWith({ technologyBreakdown, technologyTotals, organisationTables: [table] }),
    );
    const cross = checks.find((c) => c.check.includes('technology-wise page == statistics page'))!;
    expect(cross.ok).toBe(false);
    expect(cross.delta).toBeCloseTo(-1.175, 3);
  });
});
