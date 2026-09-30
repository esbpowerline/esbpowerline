import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The archive sitemap's `lastmod` rule: stated only for days whose payload has
 * a revision on this site, and as that revision's time — never the observation
 * date, which every entry carried until 2026-09-19 (SEO_FIX_LOG stage 10).
 */

const catalogue = vi.hoisted(() => ({ dates: ['2019-06-15', '2026-09-16', '2026-09-17'] }));
vi.mock('@/lib/data/grid/archive-day.server', () => ({
  getArchiveCatalogue: async () => catalogue.dates,
}));

const revisions = vi.hoisted(() => ({
  times: {} as Record<string, string>,
  fail: false,
}));
vi.mock('@/lib/data/releases.server', () => ({
  getReleaseRevisionTimes: async () => {
    if (revisions.fail) throw new Error('database unavailable');
    return revisions.times;
  },
}));

import { GET } from '@/app/grid-sitemap.xml/route';

function entries(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/g)) out.set(m[1], m[2]);
  return out;
}

beforeEach(() => {
  revisions.fail = false;
  revisions.times = { '2026-09-17': '2026-09-18T06:33:46.766Z' };
});

describe('grid-sitemap.xml', () => {
  it('dates only the days with a release revision, with the revision time', async () => {
    const xml = await (await GET()).text();
    const e = entries(xml);
    expect(e.get('https://esbpowerline.com/grid-explorer/2026-09-17')).toContain(
      '<lastmod>2026-09-18T06:33:46.766Z</lastmod>',
    );
    // A static-archive day: no revision, no lastmod — and never the day itself.
    expect(e.get('https://esbpowerline.com/grid-explorer/2026-09-16')).not.toContain('<lastmod>');
    expect(xml).not.toContain('<lastmod>2019-06-15</lastmod>');
  });

  it('lists the archive index, each year and the recent window of days', async () => {
    const e = entries(await (await GET()).text());
    expect([...e.keys()]).toEqual([
      'https://esbpowerline.com/grid-explorer/archive',
      'https://esbpowerline.com/grid-explorer/archive/2019',
      'https://esbpowerline.com/grid-explorer/archive/2026',
      // 2019-06-15 is outside the 90-day window: noindex, so not submitted.
      // Its year index still is, and still links it.
      'https://esbpowerline.com/grid-explorer/2026-09-16',
      'https://esbpowerline.com/grid-explorer/2026-09-17',
    ]);
  });

  it('still serves every day, undated, when the revision read fails', async () => {
    revisions.fail = true;
    const res = await GET();
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(entries(xml).size).toBe(5);
    expect(xml).not.toContain('<lastmod>');
  });
});

describe('isIndexedArchiveDay', () => {
  it('indexes the 90 days ending at the newest catalogue day, and nothing older', async () => {
    const { isIndexedArchiveDay } = await import('@/lib/data/grid/archive-indexing');
    expect(isIndexedArchiveDay('2026-09-28', '2026-09-28')).toBe(true);
    expect(isIndexedArchiveDay('2026-07-01', '2026-09-28')).toBe(true); // 89 days back
    expect(isIndexedArchiveDay('2026-06-30', '2026-09-28')).toBe(false); // 90 days back
    expect(isIndexedArchiveDay('2019-06-15', '2026-09-28')).toBe(false);
    // No catalogue to measure from: do not deindex anything on a guess.
    expect(isIndexedArchiveDay('2019-06-15', undefined)).toBe(true);
  });
});

describe('isSettledArchiveDay', () => {
  it('stops saying "awaiting" 14 days back, and never guesses without a catalogue', async () => {
    const { isSettledArchiveDay } = await import('@/lib/data/grid/archive-indexing');
    expect(isSettledArchiveDay('2026-09-16', '2026-09-29')).toBe(false); // 13 days: still awaited
    expect(isSettledArchiveDay('2026-09-15', '2026-09-29')).toBe(true); // 14 days
    expect(isSettledArchiveDay('2019-06-15', '2026-09-29')).toBe(true);
    expect(isSettledArchiveDay('2019-06-15', undefined)).toBe(false);
  });
});
