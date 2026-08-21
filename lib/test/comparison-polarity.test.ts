import { describe, it, expect } from 'vitest';
import {
  metricLabel,
  polarityOf,
  sectionLabel,
  strings,
  toBnDigits,
  unitLabel,
  verdictOf,
  UI,
} from '@/lib/data/grid/comparison-i18n';

/**
 * The comparison table colours a change by whether the day got BETTER, not by
 * whether the number got bigger. That is the whole point of the polarity map,
 * and it is the kind of table that is easy to break silently — a new metric id,
 * a reordered rule — so the cases that matter are pinned here.
 *
 * The bug this replaced: `pct >= 0 ? green : red`, which painted load shedding
 * rising 4,343% bright green.
 */

describe('polarity', () => {
  it('treats shortfall, outages and cost as bad when they rise', () => {
    for (const id of [
      'shedding.total',
      'shedding.peakHour',
      'shedding.hoursAffected',
      'outages.count',
      'system.totalEnergyUnserved',
      'system.avgProductionCost',
      'system.totalDailyCost',
      'reliability.unserved.total',
      'interruptions.Aminbazar.count',
    ]) {
      expect(polarityOf(id), id).toBe('bad');
    }
  });

  it('treats supply as good when it rises', () => {
    for (const id of [
      'system.eveningPeakGen',
      'system.dayPeakGen',
      'system.totalEnergyGen',
      'system.totalNetGeneration',
      'generation.Coal',
      'fuel.gas',
      'gas.total',
      'gas.lng',
      'gasFields.Bibiyana',
      'stations.Ghorashal',
      'imports.Tripura',
      'substations.Madunaghat',
    ]) {
      expect(polarityOf(id), id).toBe('good');
    }
  });

  it('refuses to judge demand or temperature', () => {
    for (const id of [
      'system.eveningPeakDemand',
      'system.dayPeakDemand',
      'system.totalEnergyDemand',
      'system.maxEveningPeakDemand',
      'system.maxTemp',
      'regional.Dhaka.demand',
    ]) {
      expect(polarityOf(id), id).toBe('flat');
    }
  });

  it('gives an unknown metric no colour rather than a guessed one', () => {
    // A wrong colour is a wrong claim about the day, and worse than none.
    expect(polarityOf('something.pgcb.added.later')).toBe('flat');
    expect(verdictOf('something.pgcb.added.later', 500)).toBe('none');
  });
});

describe('verdict', () => {
  it('reads a fall in shedding as an improvement and a rise as a worsening', () => {
    expect(verdictOf('shedding.total', -300)).toBe('up');
    expect(verdictOf('shedding.total', 2215)).toBe('down');
  });

  it('reads a rise in generation as an improvement and a fall as a worsening', () => {
    expect(verdictOf('system.totalEnergyGen', 15.83)).toBe('up');
    expect(verdictOf('gas.total', -593.8)).toBe('down');
  });

  it('has no verdict without a change, or without a figure to compare', () => {
    expect(verdictOf('shedding.total', 0)).toBe('none');
    expect(verdictOf('shedding.total', null)).toBe('none');
  });

  it('never colours demand in either direction', () => {
    expect(verdictOf('system.eveningPeakDemand', 2569)).toBe('none');
    expect(verdictOf('system.eveningPeakDemand', -2569)).toBe('none');
  });
});

describe('language', () => {
  it('leaves everything alone in English', () => {
    expect(metricLabel('shedding.total', 'Total load shedding', 'en')).toBe('Total load shedding');
    expect(unitLabel('MW', 'en')).toBe('MW');
    expect(sectionLabel('gas', 'Gas', 'en')).toBe('Gas');
  });

  it('translates the fixed metrics, sections and units', () => {
    expect(metricLabel('shedding.total', 'Total load shedding', 'bn')).toBe('মোট লোডশেডিং');
    expect(sectionLabel('shedding', 'Load shedding', 'bn')).toBe('লোডশেডিং');
    expect(unitLabel('MW', 'bn')).toBe('মেগাওয়াট');
  });

  it('falls back to the archive spelling for names PGCB supplies', () => {
    // Stations, fields and substations come out of the source sheets in
    // English; an unmapped one is shown as printed rather than dropped.
    expect(metricLabel('stations.Ghorashal', 'Ghorashal', 'bn')).toBe('Ghorashal');
    expect(metricLabel('generation.Coal', 'Coal', 'bn')).toBe('Coal');
    expect(unitLabel('GWh', 'bn')).toBe('GWh');
  });

  it('converts digits without touching anything else', () => {
    expect(toBnDigits('2,266')).toBe('২,২৬৬');
    expect(toBnDigits('-15.83%')).toBe('-১৫.৮৩%');
    expect(toBnDigits('MW')).toBe('MW');
  });

  it('has every English key translated', () => {
    // A missing key would fall through as `undefined` and render blank, which
    // is harder to spot than an untranslated string.
    const en = Object.keys(UI.en).sort();
    const bn = Object.keys(UI.bn).sort();
    expect(bn).toEqual(en);
    for (const k of en) {
      expect(String((UI.bn as Record<string, string>)[k]).length, k).toBeGreaterThan(0);
    }
  });

  it('hands back a usable table for both languages', () => {
    expect(strings('en').metric).toBe('Metric');
    expect(strings('bn').metric).toBe('সূচক');
  });
});
