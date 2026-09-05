import { describe, expect, it } from 'vitest';
import { lifelineHistoryFact, residentialLadderFact, residentialEnergyChargeFact } from '@/lib/tariff/facts';
import { POLICIES } from '@/lib/data/policy/policies';

/**
 * The first surface converted from a hand-typed constant to a resolved fact.
 *
 * The entry this replaces told readers the residential lifeline rate had risen
 * from Tk 4.63 to Tk 5.32 in June 2026. It had not — BERC restored 4.63 on
 * 4 June — and the page said otherwise for three months because the figure was
 * typed from day-one press coverage and nothing ever checked it against a rule.
 * These tests exist so that cannot recur silently.
 */
describe('the BERC policy page reads the canonical rule set', () => {
  const berc = POLICIES.find((p) => p.slug === 'berc-tariff-orders' || p.title.includes('Tariff Orders'));

  it('finds the policy entry that carries tariff figures', () => {
    expect(berc).toBeTruthy();
    expect(berc!.dataPoints?.length).toBeGreaterThan(0);
  });

  it('no longer claims the lifeline rate rose to 5.32', () => {
    const rendered = berc!.dataPoints!.map((d) => `${d.label} ${d.value}`).join(' | ');
    expect(rendered).not.toMatch(/lifeline rate Tk 4\.63 → Tk 5\.32/);
  });

  it('states the current lifeline rate, resolved rather than typed', () => {
    const point = berc!.dataPoints!.find((d) => d.label === 'Residential lifeline rate')!;
    expect(point).toBeTruthy();
    expect(point.value).toContain('Tk 4.63');
    expect(point.value).toContain('0–50 units');
  });

  it('tells the reader the increase never governed a bill', () => {
    const point = berc!.dataPoints!.find((d) => d.label === 'Residential lifeline rate')!;
    expect(point.value).toContain('3 June 2026');
    expect(point.value).toContain('4 June');
    expect(point.value).toContain('never governed a bill');
  });

  it('cites the instrument, not a newspaper', () => {
    const point = berc!.dataPoints!.find((d) => d.label === 'Residential lifeline rate')!;
    expect(point.source.label).toContain('পুনর্বিবেচনা');
    expect(point.source.url).toContain('objectstorage');
    expect(point.source.url).not.toContain('dhakatribune');
  });

  it('agrees with the engine — the page cannot drift from the rule set', () => {
    const point = berc!.dataPoints!.find((d) => d.label === 'Residential lifeline rate')!;
    expect(point.value).toBe(lifelineHistoryFact('2026-06')!.value);
  });
});

describe('display facts', () => {
  it('renders the whole ladder with the lifeline condition spelled out', () => {
    const f = residentialLadderFact('2026-06')!;
    expect(f.value).toContain('Tk 4.63');
    expect(f.value).toContain('Tk 17.35');
    expect(f.value).toContain('at 51 units none of the consumption receives it');
  });

  it('labels an energy charge as an energy charge, never a bill total', () => {
    const f = residentialEnergyChargeFact(412, '2026-06')!;
    expect(f.value).toContain('Tk 3509.12');
    expect(f.value).toContain('not a bill total');
  });

  it('returns null rather than a figure when no rule is held', () => {
    expect(residentialLadderFact('2020-01')).toBeNull();
    expect(residentialEnergyChargeFact(100, '2020-01')).toBeNull();
  });

  it('carries the verification grade so certainty is not implied', () => {
    expect(residentialLadderFact('2026-06')!.verificationStatus).toBe('DOCUMENT_HELD');
  });
});
