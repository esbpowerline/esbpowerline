import { describe, expect, it } from 'vitest';
import manifest from '@/evidence/fuel/manifest.json';
import { getLiveTickerItems } from '@/lib/data/grid/live-ticker.server';
import { ADMINISTERED_PRICES } from '@/lib/data/tariff/administered-prices';

/**
 * The commodities strip's prices, pinned to the instruments read on 2026-09-30:
 * EMRD's gazette of 20 Sep 2026 (…07.0017.26.215, effective 21 Sep) for the four
 * fuels, held for October by EMRD's memo …24.452, and BERC's 4 Jun 2022
 * notification (…22.2523) for CNG. A change to any value must come with a new
 * instrument, not an edit.
 */

const price = (id: string) => ADMINISTERED_PRICES.find((p) => p.id === id);

describe('administered prices on the commodities strip', () => {
  it('carries the fuel prices EMRD gazetted on 20 September 2026', () => {
    expect(price('diesel-bpc')?.value).toBe(135);
    expect(price('octane-bpc')?.value).toBe(165);
    expect(price('petrol-bpc')?.value).toBe(160);
    // Above diesel, as the gazette states — not a transposition.
    expect(price('kerosene-bpc')?.value).toBe(155);
    for (const id of ['diesel-bpc', 'octane-bpc', 'petrol-bpc', 'kerosene-bpc']) {
      expect(price(id)?.instrument.memoNo).toBe('28.00.0000.000.026.07.0017.26.215');
      expect(price(id)?.instrument.effectiveFrom).toBe('2026-09-21');
    }
  });

  it('carries CNG at the rate BERC stated in June 2022', () => {
    expect(price('cng-berc')?.value).toBe(43);
    expect(price('cng-berc')?.instrument.memoNo).toBe('28.01.0000.012.14.001.22.2523');
  });

  it('cites only documents the evidence manifest holds, under the same memo and URL', () => {
    const docs = new Map(manifest.documents.map((d) => [d.id, d]));
    for (const p of ADMINISTERED_PRICES) {
      for (const inst of [p.instrument, p.confirmedBy].filter(Boolean)) {
        const doc = docs.get(inst!.evidenceId);
        expect(doc, `${p.id} → ${inst!.evidenceId}`).toBeDefined();
        expect(doc?.memoNo).toBe(inst!.memoNo);
        expect(doc?.sourceUrl).toBe(inst!.sourceUrl);
      }
    }
  });

  it('puts exactly these figures on the strip, with no daily delta', async () => {
    const items = (await getLiveTickerItems()) ?? [];
    expect(items.map((i) => [i.id, i.value])).toEqual(ADMINISTERED_PRICES.map((p) => [p.id, p.value]));
    expect(items.every((i) => i.change === null)).toBe(true);
  });
});
