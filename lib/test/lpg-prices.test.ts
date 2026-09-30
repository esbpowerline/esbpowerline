import { describe, expect, it } from 'vitest';
import manifest from '@/evidence/lpg/manifest.json';
import {
  CURRENT_CYLINDER_PRICES,
  CURRENT_LPG_NOTICE,
  LPG_PRICE_HISTORY,
} from '@/lib/data/tariff/berc-lpg';

/**
 * The figures are transcribed by eye from scans. These are the checks that
 * would catch a misread digit without trusting the reading: two identities the
 * notices themselves obey, and agreement with the evidence manifest.
 */

describe('BERC LPG price history', () => {
  it('prices every 12 kg cylinder at 12 x the per-kg rate, to within Tk 1', () => {
    // BERC rounds from an unrounded rate; May 2026 prints 1,940 for 12 x 161.71.
    for (const n of LPG_PRICE_HISTORY) {
      expect(Math.abs(n.cylinder12KgTk - 12 * n.perKgTk), n.memoNo).toBeLessThanOrEqual(1);
    }
  });

  it('averages Saudi CP 35:65 propane to butane, as every notice states', () => {
    for (const n of LPG_PRICE_HISTORY) {
      if (!n.saudiCpUsdPerTonne) continue;
      const { propane, butane, average } = n.saudiCpUsdPerTonne;
      expect(0.35 * propane + 0.65 * butane, n.memoNo).toBeCloseTo(average, 2);
    }
  });

  it('keeps every size in the current table on its own per-kg rate', () => {
    for (const { kg, tk } of CURRENT_CYLINDER_PRICES) {
      expect(Math.abs(tk - kg * CURRENT_LPG_NOTICE.perKgTk), `${kg} kg`).toBeLessThanOrEqual(1);
    }
    expect(CURRENT_CYLINDER_PRICES.find((c) => c.kg === 12)?.tk).toBe(CURRENT_LPG_NOTICE.cylinder12KgTk);
  });

  it('runs newest first, one notice per effective instant', () => {
    const at = LPG_PRICE_HISTORY.map((n) => Date.parse(n.effectiveFrom));
    expect(at.every((t, i) => i === 0 || t < at[i - 1])).toBe(true);
  });

  it('cites a document the evidence manifest holds, under the same memo and URL', () => {
    const docs = new Map(manifest.documents.map((d) => [d.id, d]));
    for (const n of LPG_PRICE_HISTORY) {
      const doc = docs.get(n.evidenceId);
      expect(doc, n.evidenceId).toBeDefined();
      expect(doc?.memoNo).toBe(n.memoNo);
      expect(doc?.sourceUrl).toBe(n.sourceUrl);
      expect(doc?.effectiveFrom).toBe(n.effectiveFrom);
    }
  });
});
