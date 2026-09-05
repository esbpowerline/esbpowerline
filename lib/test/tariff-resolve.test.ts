import { describe, expect, it } from 'vitest';
import { AmbiguousTariffError, resolveApplicableTariff } from '@/lib/tariff/resolve';
import type { ResolveQuery } from '@/lib/tariff/types';

/**
 * The June 3 → June 4 2026 sequence, which is the specification for the whole
 * temporal model.
 *
 * BERC Order 2026/22 (3 June) raised the residential lifeline rate from Tk 4.63
 * to 5.32. BERC Reconsideration Order 2026/01 (4 June) set that aside and
 * restored 4.63. Both carry the SAME billing validity — bill month June 2026 —
 * so a single effective interval cannot order them, and the earlier design's
 * zero-length-interval trick was wrong: it made a validly issued instrument
 * unrepresentable instead of merely superseded.
 *
 * Two axes, two questions. Without `asOf`: what governs. With `asOf`: what was
 * knowable.
 */

const BASE: Omit<ResolveQuery, 'billingPeriod' | 'asOf'> = {
  utility: 'BPDB',
  category: 'LT_A_RESIDENTIAL',
  meterType: 'POSTPAID',
  phase: 'SINGLE',
};

const q = (billingPeriod: string, asOf?: string): ResolveQuery => ({ ...BASE, billingPeriod, asOf });

const lifelineRate = (billingPeriod: string, asOf?: string) => {
  const s = resolveApplicableTariff(q(billingPeriod, asOf));
  return s?.slabs.find((x) => x.slabIndex === 1)?.ratePaisa ?? null;
};

describe('governing resolution — no asOf', () => {
  it('June 2026 lifeline is Tk 4.63, from the reconsideration order', () => {
    const s = resolveApplicableTariff(q('2026-06'))!;
    const lifeline = s.slabs.find((x) => x.slabIndex === 1)!;
    expect(lifeline.ratePaisa).toBe(463);
    expect(lifeline.instrumentId).toBe('berc-reconsideration-order-2026-01');
  });

  it('May 2026 lifeline is Tk 4.63, from the 2024 gazette', () => {
    const s = resolveApplicableTariff(q('2026-05'))!;
    const lifeline = s.slabs.find((x) => x.slabIndex === 1)!;
    expect(lifeline.ratePaisa).toBe(463);
    expect(lifeline.instrumentId).toBe('sro-43-law-2024');
  });

  it('the amended instrument still governs the rows it was NOT amended in', () => {
    // This is the reason components are versioned rather than schedules. The
    // 4 June order touched two rows; the second step still comes from the
    // 3 June order it amended.
    const s = resolveApplicableTariff(q('2026-06'))!;
    const second = s.slabs.find((x) => x.slabIndex === 3)!;
    expect(second.ratePaisa).toBe(850);
    expect(second.instrumentId).toBe('berc-order-2026-22');
    expect(s.instruments.map((i) => i.id).sort()).toEqual([
      'berc-order-2026-22',
      'berc-reconsideration-order-2026-01',
    ]);
  });

  it('the demand charge survives the amendment at 42.00 Tk/kW/month', () => {
    const s = resolveApplicableTariff(q('2026-06'))!;
    expect(s.demandCharge?.ratePaisa).toBe(4200);
    expect(s.demandCharge?.basis).toBe('SANCTIONED_LOAD_KW');
  });

  it('never returns a superseded view when asked the governing question', () => {
    expect(resolveApplicableTariff(q('2026-06'))!.supersededView).toBe(false);
  });
});

describe('as-of resolution — the historical question', () => {
  it('as of 3 June 2026 the lifeline was Tk 5.32', () => {
    expect(lifelineRate('2026-06', '2026-06-03')).toBe(532);
  });

  it('as of 4 June 2026 it is Tk 4.63 again', () => {
    expect(lifelineRate('2026-06', '2026-06-04')).toBe(463);
  });

  it('as of today it is Tk 4.63', () => {
    expect(lifelineRate('2026-06', '2026-09-05')).toBe(463);
  });

  it('the 3 June view says it was later amended rather than pretending it never existed', () => {
    const s = resolveApplicableTariff(q('2026-06', '2026-06-03'))!;
    expect(s.supersededView).toBe(true);
    const lifeline = s.slabs.find((x) => x.slabIndex === 1)!;
    expect(lifeline.instrumentId).toBe('berc-order-2026-22');
    expect(lifeline.supersededBy).toMatchObject({
      instrumentId: 'berc-reconsideration-order-2026-01',
      on: '2026-06-04',
    });
    expect(s.notes.join(' ')).toContain('amended on 2026-06-04');
  });

  it('the first step follows the same path: 6.18 on the 3rd, 5.26 from the 4th', () => {
    const on3 = resolveApplicableTariff(q('2026-06', '2026-06-03'))!;
    const on5 = resolveApplicableTariff(q('2026-06', '2026-06-05'))!;
    expect(on3.slabs.find((x) => x.slabIndex === 2)!.ratePaisa).toBe(618);
    expect(on5.slabs.find((x) => x.slabIndex === 2)!.ratePaisa).toBe(526);
  });

  it('the untouched rows are identical in both views', () => {
    const on3 = resolveApplicableTariff(q('2026-06', '2026-06-03'))!;
    const gov = resolveApplicableTariff(q('2026-06'))!;
    for (const i of [3, 4, 5, 6, 7]) {
      expect(on3.slabs.find((x) => x.slabIndex === i)!.ratePaisa).toBe(
        gov.slabs.find((x) => x.slabIndex === i)!.ratePaisa,
      );
    }
  });

  it('a June 2026 bill was not knowable in May 2026 — null, never a zero rate', () => {
    // The instruments did not exist yet. "No rule held" is the honest answer and
    // the caller must render it; a zero would assert electricity was free.
    expect(resolveApplicableTariff(q('2026-06', '2026-05-01'))).toBeNull();
  });

  it('as-of before the 2024 gazette returns null too', () => {
    expect(resolveApplicableTariff(q('2024-02', '2024-01-01'))).toBeNull();
  });
});

describe('boundaries and refusals', () => {
  it('the bill month before the 2024 gazette has no rule', () => {
    expect(resolveApplicableTariff(q('2024-01'))).toBeNull();
  });

  it('the 2024 gazette governs from its first bill month', () => {
    expect(lifelineRate('2024-02')).toBe(463);
  });

  it('the 2024 schedule stops exactly at the June 2026 handover', () => {
    const may = resolveApplicableTariff(q('2026-05'))!;
    const jun = resolveApplicableTariff(q('2026-06'))!;
    expect(may.slabs.find((x) => x.slabIndex === 3)!.ratePaisa).toBe(720);
    expect(jun.slabs.find((x) => x.slabIndex === 3)!.ratePaisa).toBe(850);
  });

  it('an unknown category resolves to null rather than falling back to residential', () => {
    expect(resolveApplicableTariff({ ...q('2026-06'), category: 'LT_E_COMMERCIAL' })).toBeNull();
  });

  it('an unencoded utility resolves to null', () => {
    // BREB is a real licensee with real carve-outs and no encoded rules. It must
    // not silently inherit BPDB's table.
    expect(resolveApplicableTariff({ ...q('2026-06'), utility: 'BREB' })).toBeNull();
  });

  it('prepaid resolves to null — a different product, not postpaid with a flag', () => {
    expect(resolveApplicableTariff({ ...q('2026-06'), meterType: 'PREPAID' })).toBeNull();
  });

  it('rejects a malformed billing period', () => {
    expect(() => resolveApplicableTariff(q('2026-6'))).toThrow(RangeError);
    expect(() => resolveApplicableTariff(q('2026-06-01'))).toThrow(RangeError);
  });

  it('rejects a malformed asOf', () => {
    expect(() => resolveApplicableTariff(q('2026-06', '2026-06'))).toThrow(RangeError);
  });

  it('AmbiguousTariffError exists and refuses to pick a winner', () => {
    // Not reachable from the shipped rule set — the integrity test proves the
    // set has no overlaps — so the guard is exercised directly. Silently
    // choosing one of two overlapping rules is how a wrong answer becomes
    // unfalsifiable.
    const err = new AmbiguousTariffError('ENERGY_SLAB:1', ['a', 'b']);
    expect(err.message).toContain('never a preference');
  });
});
