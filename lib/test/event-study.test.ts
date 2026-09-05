import { describe, it, expect } from 'vitest';
import {
  CHAIN_CARDS,
  EVENT_STUDY_SERIES,
  assertCardsComparable,
  buildEventStudy,
  enumerateDays,
  pointFigure,
  type ChainCard,
  type EventStudyDayInput,
} from '@/lib/data/analysis/event-study';
import {
  GAS_CRISIS_BASELINE,
  GAS_CRISIS_WINDOW,
  loadGasCrisisStudy,
  loadGasSupplyOutageQuotes,
} from '@/lib/data/analysis/event-study.server';

/**
 * These tests read the real archive on purpose, like petrobangla-day.test.ts:
 * the defect class this module guards against — a null reading averaged in as
 * zero, a gas day paired with the wrong energy day — is invisible to a fixture
 * written with the author's own convention in mind. The dates are pinned to
 * days whose printed values are quoted in PHASE1_EVENT_STUDY_FINDINGS.md.
 */

describe('the chain cards obey the alignment rules', () => {
  it('every shipped card passes comparable()', () => {
    expect(() => assertCardsComparable(CHAIN_CARDS)).not.toThrow();
  });

  it('a card pairing a rate with an accumulated total is refused', () => {
    // MMCFD (interval-mean) on one axis with GWh (interval-total) is the exact
    // L2 mistake the KPI strip once shipped. It must be a thrown error, not a
    // styling choice.
    const bad: ChainCard[] = [
      { key: 'bad', question: '?', seriesIds: ['gasNational', 'gasGen'] },
    ];
    expect(() => assertCardsComparable(bad)).toThrow(/different quantities|point reading|windows/i);
  });

  it('a card pairing the two publishers’ windows is refused', () => {
    // Petrobangla’s 08:00→08:00 overlaps PGCB’s 00:00→24:00 for only 16 of 24
    // hours; overlaying the two rates would compare different windows.
    const bad: ChainCard[] = [
      { key: 'bad', question: '?', seriesIds: ['gasNational', 'gasToPower'] },
    ];
    expect(() => assertCardsComparable(bad)).toThrow(/overlap/i);
  });
});

describe('null stays null through the whole pipeline', () => {
  // 2026-06-02 is real: its workbook carries no hourly sheet and PGCB printed
  // no unserved/demand figure. The archive holds null there, and so must every
  // derived object built from it.
  const nullDay: EventStudyDayInput = {
    date: '2026-06-02',
    gasNationalMmcfd: 2235.9,
    gasRlngMmcfd: 573.9,
    gasToPowerMmcfd: 1010.0,
    gasGenGwh: 130.8,
    hfoGenGwh: null,
    coalGenGwh: null,
    totalGenGwh: 347.3,
    demandGwh: null,
    unservedGwh: null,
    totalDailyCostTk: null,
    avgCostTkPerKwh: null,
    pgcbSourceFile: null,
    petrobanglaSourceFile: null,
  };
  const range = { start: '2026-06-02', end: '2026-06-02' };
  const study = buildEventStudy([nullDay], range, range);

  it('a null input yields a null point, never 0', () => {
    expect(study.series.unserved.points[0].value).toBeNull();
    expect(study.series.demand.points[0].value).toBeNull();
    // and the published figures pass through untouched
    expect(study.series.gasRlng.points[0].value).toBeCloseTo(573.9, 1);
  });

  it('a null input yields null means and a null delta, never 0', () => {
    const b = study.series.unserved.baseline;
    expect(b.windowMean).toBeNull();
    expect(b.baselineMean).toBeNull();
    expect(b.delta).toBeNull();
  });

  it('coverage counts the absence instead of papering over it', () => {
    expect(study.series.unserved.windowCoverage).toEqual({
      expectedDays: 1,
      publishedDays: 0,
      missingDates: ['2026-06-02'],
    });
  });

  it('the Figure boundary names the publisher who owes the number', () => {
    const fig = pointFigure(study.series.unserved, study.series.unserved.points[0]);
    expect(fig).toEqual({ known: false, awaiting: 'PGCB' });
  });

  it('a day entirely absent from the input behaves like an unpublished day', () => {
    const wider = buildEventStudy([nullDay], { start: '2026-06-02', end: '2026-06-03' }, range);
    const p = wider.series.gasNational.points.find((x) => x.date === '2026-06-03');
    expect(p?.value).toBeNull();
    expect(wider.series.gasNational.windowCoverage.missingDates).toContain('2026-06-03');
  });
});

describe('a mean is over published days only', () => {
  it('one null day among two does not drag the mean down', () => {
    const days: EventStudyDayInput[] = [
      { ...base('2026-07-21'), unservedGwh: 10 },
      { ...base('2026-07-22'), unservedGwh: null },
    ];
    const study = buildEventStudy(days, { start: '2026-07-21', end: '2026-07-22' }, { start: '2026-07-21', end: '2026-07-22' });
    // mean of {10} — not of {10, 0}, which would be 5 and a fabrication
    expect(study.series.unserved.baseline.windowMean).toBe(10);
    expect(study.series.unserved.baseline.formula).toContain('1 published day');
    expect(study.series.unserved.baseline.formula).toContain('never zeroed');
  });
});

describe('against the real archive (window days pinned in the Phase 1 findings)', () => {
  it('loads the break day with both publishers’ printed figures', async () => {
    const study = await loadGasCrisisStudy(
      { start: '2026-07-21', end: '2026-07-22' },
      { start: '2026-07-20', end: '2026-07-20' },
    );
    const rlng = study.series.gasRlng;
    // gas day starting 07-21: RPGCL printed 621.6 after 993.5 the day before
    expect(rlng.points[0].value).toBeCloseTo(621.6, 1);
    expect(rlng.baseline.baselineMean).toBeCloseTo(993.5, 1);
    // window mean is over BOTH window days (07-21: 621.6, 07-22: 561.8)
    expect(rlng.baseline.windowMean).toBeCloseTo((621.6 + 561.8) / 2, 1);
    expect(rlng.baseline.delta).toBeCloseTo((621.6 + 561.8) / 2 - 993.5, 1);
    // and the PGCB side of the same energy day
    expect(study.series.gasToPower.points[0].value).toBeCloseTo(858.41, 1);
    expect(study.series.gasGen.points[0].value).toBeCloseTo(121.2, 1);
    // every series still names its document
    expect(study.sourceFiles.pgcb.length).toBeGreaterThan(0);
    expect(study.sourceFiles.petrobangla.length).toBeGreaterThan(0);
  });

  it('marks avgCost D and everything printed P', async () => {
    const study = await loadGasCrisisStudy(
      { start: '2026-07-21', end: '2026-07-21' },
      { start: '2026-07-20', end: '2026-07-20' },
    );
    expect(study.series.avgCost.provenance).toBe('D');
    for (const id of ['gasNational', 'gasRlng', 'gasToPower', 'gasGen', 'unserved'] as const) {
      expect(study.series[id].provenance).toBe('P');
    }
  });

  it('carries the baseline’s two real gaps instead of dodging them', async () => {
    const study = await loadGasCrisisStudy(GAS_CRISIS_WINDOW, GAS_CRISIS_BASELINE);
    // PGCB filed no unserved figure on 2026-06-20 (no hourly sheet that day);
    // Petrobangla has no document whose window starts on 2026-06-21. Different
    // days, different publishers, both reported rather than smoothed.
    expect(study.series.unserved.baselineCoverage.missingDates).toEqual(['2026-06-20']);
    expect(study.series.gasNational.baselineCoverage.missingDates).toEqual(['2026-06-21']);
    expect(study.series.unserved.baselineCoverage.publishedDays).toBe(29);
    // The window itself, lead-in included, is complete for both publishers.
    expect(study.series.unserved.windowCoverage.missingDates).toEqual([]);
    expect(study.series.gasNational.windowCoverage.missingDates).toEqual([]);
  }, 30_000);

  it('opens three ordinary days before the break', async () => {
    const study = await loadGasCrisisStudy();
    const pts = study.series.gasRlng.points;
    expect(pts[0].date).toBe('2026-07-18');
    // 966.5, 976.3, 993.5 — flat, against the same printed 1,100 capacity the
    // line kept all the way down. Without them the cliff has nothing to fall from.
    expect(pts[0].value).toBeCloseTo(966.5, 1);
    expect(pts[2].value).toBeCloseTo(993.5, 1);
    expect(pts[3].date).toBe('2026-07-21');
    expect(pts[3].value).toBeCloseTo(621.6, 1);
  }, 30_000);

  it('quotes the gas-supply outage rows verbatim, or drops them — never paraphrases', async () => {
    const quotes = await loadGasSupplyOutageQuotes();
    // The three identified in Phase 1; Sirajganj has GT and ST rows.
    expect(quotes.length).toBeGreaterThanOrEqual(3);
    const jera = quotes.find((q) => q.plant.includes('JERA Meghnaghat'));
    expect(jera?.reason).toBe('due to gas shortage.');
    for (const q of quotes) expect(q.pgcbSourceFile).toBeTruthy();
  });
});

function base(date: string): EventStudyDayInput {
  return {
    date,
    gasNationalMmcfd: null,
    gasRlngMmcfd: null,
    gasToPowerMmcfd: null,
    gasGenGwh: null,
    hfoGenGwh: null,
    coalGenGwh: null,
    totalGenGwh: null,
    demandGwh: null,
    unservedGwh: null,
    totalDailyCostTk: null,
    avgCostTkPerKwh: null,
    pgcbSourceFile: null,
    petrobanglaSourceFile: null,
  };
}

// The registry itself is part of the contract: silently renaming a series id
// would orphan the page's cards.
describe('registry sanity', () => {
  it('every card series id exists in the registry', () => {
    for (const card of CHAIN_CARDS) {
      for (const id of card.seriesIds) {
        expect(EVENT_STUDY_SERIES[id]).toBeDefined();
      }
    }
  });
  it('enumerateDays is inclusive and ordered', () => {
    expect(enumerateDays({ start: '2026-07-30', end: '2026-08-02' })).toEqual([
      '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02',
    ]);
  });
});
