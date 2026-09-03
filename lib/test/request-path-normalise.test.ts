import { describe, it, expect } from 'vitest';
import { normalizeRequestPath, isProtectedDataJsonPath } from '@/lib/data/grid/daily-access';

/**
 * The percent-encoding bypass, as reproduced against production on 2026-08-08
 * and again on 2026-09-03: the plain path was refused with 403 and the encoded
 * twin answered 200 with the day's figures.
 */
describe('normalizeRequestPath', () => {
  it('decodes the path so the gate sees what the file system serves', () => {
    expect(normalizeRequestPath('/data/d%61ily/2013-12-31.json')).toBe('/data/daily/2013-12-31.json');
    expect(normalizeRequestPath('/api/data/d%61ily/2013-12-31.json')).toBe('/api/data/daily/2013-12-31.json');
  });

  it('keeps decoding until stable, so double encoding is no escape', () => {
    expect(normalizeRequestPath('/data/d%2561ily/2013-12-31.json')).toBe('/data/daily/2013-12-31.json');
  });

  it('collapses doubled separators', () => {
    expect(normalizeRequestPath('/data//daily/2013-12-31.json')).toBe('/data/daily/2013-12-31.json');
  });

  it('leaves an ordinary path alone', () => {
    expect(normalizeRequestPath('/data/daily/2013-12-31.json')).toBe('/data/daily/2013-12-31.json');
    expect(normalizeRequestPath('/grid-explorer')).toBe('/grid-explorer');
  });

  it('does not throw on a malformed sequence', () => {
    expect(normalizeRequestPath('/data/daily/%E0%A4%A')).toBe('/data/daily/%E0%A4%A');
  });

  it('the gate refuses every encoded spelling once normalised', () => {
    for (const p of [
      '/data/d%61ily/2013-12-31.json',
      '/data/daily/2013-12-31%2Ejson',
      '/data/%64aily/2013-12-31.json',
      '/api/data/pl%61nts/2013-12-31.json',
      '/data/petrobangla/timeline-summ%61ry.json',
    ]) {
      expect(isProtectedDataJsonPath(normalizeRequestPath(p)), p).toBe(true);
    }
  });
});
