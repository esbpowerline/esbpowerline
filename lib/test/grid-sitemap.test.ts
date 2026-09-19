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
    expect(e.get('https://esbpowerline.com/grid-explorer/2019-06-15')).not.toContain('<lastmod>');
    expect(e.get('https://esbpowerline.com/grid-explorer/2026-09-16')).not.toContain('<lastmod>');
    expect(xml).not.toContain('<lastmod>2019-06-15</lastmod>');
  });

  it('lists the archive index, each year and every catalogue day', async () => {
    const e = entries(await (await GET()).text());
    expect([...e.keys()]).toEqual([
      'https://esbpowerline.com/grid-explorer/archive',
      'https://esbpowerline.com/grid-explorer/archive/2019',
      'https://esbpowerline.com/grid-explorer/archive/2026',
      'https://esbpowerline.com/grid-explorer/2019-06-15',
      'https://esbpowerline.com/grid-explorer/2026-09-16',
      'https://esbpowerline.com/grid-explorer/2026-09-17',
    ]);
  });

  it('still serves every day, undated, when the revision read fails', async () => {
    revisions.fail = true;
    const res = await GET();
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(entries(xml).size).toBe(6);
    expect(xml).not.toContain('<lastmod>');
  });
});
