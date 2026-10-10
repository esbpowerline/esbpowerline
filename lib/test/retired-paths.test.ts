import { describe, expect, it } from 'vitest';
import { isRetiredPath } from '@/lib/retired-paths';
import { normalizeRequestPath } from '@/lib/data/grid/daily-access';

describe('isRetiredPath', () => {
  it('retires Bengali-era URLs in either spelling', () => {
    expect(isRetiredPath('/articles/বিদ্যুতের-রেকর্ড-মূল্যবৃ')).toBe(true);
    expect(isRetiredPath(normalizeRequestPath('/articles/%E0%A6%AC%E0%A6%BF%E0%A6%A6'))).toBe(true);
    expect(isRetiredPath('/tag/বিদ্যুৎ')).toBe(true);
    expect(isRetiredPath('/tags/তেল')).toBe(true);
  });

  it('leaves every English route alone', () => {
    for (const p of [
      '/',
      '/articles',
      '/articles/bpdb-seeks-over-2-lakh-tonnes-of-furnace-oil-to-counter-gas-shortage',
      '/grid-explorer/2019-06-15',
      '/categories/power-generation',
      '/lpg-price',
      '/cms/articles',
      '/api/data/live-grid',
    ]) {
      expect(isRetiredPath(p)).toBe(false);
    }
  });
});
