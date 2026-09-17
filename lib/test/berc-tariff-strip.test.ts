import { describe, expect, it } from 'vitest';
import { getLiveTickerItems } from '@/lib/data/grid/live-ticker.server';
import { BULK_RATES, RESIDENTIAL_RATES } from '@/lib/data/tariff/berc-electricity-2026';

/**
 * The commodities strip's electricity tariffs, pinned to the figures read off
 * the archived BERC scans on 2026-09-17 (Reconsideration Order 2026/01,
 * Appendix-ka; amendment notification memo …26.2569, paragraph 3). A change to
 * any of these values must come with a new instrument, not an edit.
 */

const rate = (id: string) => [...RESIDENTIAL_RATES, ...BULK_RATES].find((r) => r.id === id)?.value;

describe('BERC electricity tariffs on the commodities strip', () => {
  it('carries the residential rates restored on 4 June 2026', () => {
    expect(rate('berc-lifeline')).toBe(4.63);
    expect(rate('berc-first-step')).toBe(5.26);
  });

  it('carries every Appendix-ka bulk rate as printed', () => {
    expect(rate('berc-bulk-230kv')).toBe(10.046);
    expect(rate('berc-bulk-132kv')).toBe(10.0715);
    expect(rate('berc-bulk-33kv-bpdb')).toBe(9.4115);
    expect(rate('berc-bulk-33kv-breb')).toBe(7.153);
    expect(rate('berc-bulk-33kv-dpdc')).toBe(10.095);
    expect(rate('berc-bulk-33kv-desco')).toBe(10.095);
    expect(rate('berc-bulk-33kv-wzpdcl')).toBe(8.5325);
    expect(rate('berc-bulk-33kv-nesco')).toBe(8.3225);
  });

  it('prints each rate to the digits the order uses, never rounded', () => {
    const fmt = (v: number, d: number, locale: string) =>
      v.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
    expect(fmt(9.4115, 4, 'en-US')).toBe('9.4115');
    expect(fmt(7.153, 4, 'en-US')).toBe('7.1530');
    expect(fmt(10.046, 4, 'en-US')).toBe('10.0460');
    // The default would have published a figure BERC never stated.
    expect((9.4115).toLocaleString('en-US')).toBe('9.412');
  });

  it('no longer quotes the one-day 8.39 national average', async () => {
    const items = (await getLiveTickerItems()) ?? [];
    expect(items.find((i) => i.id === 'tariff')).toBeUndefined();
    expect(items.some((i) => i.value === 8.39)).toBe(false);
  });

  it('names the instrument and bill month on every tariff it shows', async () => {
    const items = (await getLiveTickerItems()) ?? [];
    const tariffs = items.filter((i) => i.id.startsWith('berc-'));
    expect(tariffs).toHaveLength(RESIDENTIAL_RATES.length + BULK_RATES.length);
    for (const t of tariffs) {
      expect(t.source).toMatch(/^BERC .+ · from Jun 2026 bill$/);
      expect(t.change).toBeNull();
      expect(t.decimals).toBeDefined();
    }
    expect(tariffs.find((t) => t.id === 'berc-bulk-33kv-breb')?.source).toBe('BERC 2026/01 · from Jun 2026 bill');
  });
});
