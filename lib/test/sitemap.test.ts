import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The editorial sitemap's inclusion rules. Each case is a contradiction Search
 * Console has reported, or would: a URL submitted here that the page itself
 * refuses to index, a published page missing, a date stamped that nobody set.
 */

const db = vi.hoisted(() => ({
  article: { findMany: vi.fn() },
  category: { findMany: vi.fn() },
  magazineIssue: { findFirst: vi.fn() },
  user: { findMany: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ default: db, prisma: db }));

const demo = vi.hoisted(() => ({ IS_DEMO: true }));
vi.mock('@/lib/magazine-demo-issue', () => demo);

import sitemap from '@/app/sitemap';
import { EVENT_STUDIES } from '@/lib/data/analysis/event-registry';

const SITE = 'https://esbpowerline.com';

beforeEach(() => {
  vi.clearAllMocks();
  db.article.findMany.mockResolvedValue([
    { slug: 'english-story', title: 'An English story', publishedAt: new Date('2026-09-10T00:00:00Z'), authorId: 'u1', postAsNewsDesk: false, revisions: [] },
    // Edited after publication: lastmod is the revision, not publishedAt.
    { slug: 'revised-story', title: 'A revised story', publishedAt: new Date('2026-09-01T00:00:00Z'), authorId: 'u1', postAsNewsDesk: false, revisions: [{ createdAt: new Date('2026-09-05T12:00:00Z') }] },
    // Drafted (revision) before publication: the draft is not a modification.
    { slug: 'drafted-story', title: 'A drafted story', publishedAt: new Date('2026-09-08T00:00:00Z'), authorId: 'u1', postAsNewsDesk: false, revisions: [{ createdAt: new Date('2026-09-07T00:00:00Z') }] },
    // Rejected by getPublishedArticleBySlug while the server locale is 'en',
    // so it 404s — "Submitted URL not found" if it is listed.
    { slug: 'বাংলা-শিরোনাম', title: 'বাংলা শিরোনাম', publishedAt: new Date('2026-09-11T00:00:00Z'), authorId: 'u1', postAsNewsDesk: false, revisions: [] },
    { slug: 'undated', title: 'No published date', publishedAt: null, authorId: 'u2', postAsNewsDesk: true, revisions: [] },
  ]);
  db.category.findMany.mockResolvedValue([{ slug: 'power-generation', createdAt: new Date() }]);
  db.magazineIssue.findFirst.mockResolvedValue({ createdAt: new Date('2026-08-01T00:00:00Z') });
  db.user.findMany.mockResolvedValue([{ name: 'ESB News Desk' }, { name: 'Hamim Rahman' }]);
});

describe('sitemap', () => {
  it('omits Bengali-titled articles, which the article route 404s', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(`${SITE}/articles/english-story`);
    expect(urls.some((u) => u.includes(encodeURIComponent('বাংলা-শিরোনাম')))).toBe(false);
  });

  it('omits /magazine while the page declares noindex (IS_DEMO)', async () => {
    demo.IS_DEMO = true;
    expect((await sitemap()).map((e) => e.url)).not.toContain(`${SITE}/magazine`);
  });

  it('lists /magazine once a real issue replaces the demo', async () => {
    demo.IS_DEMO = false;
    const entry = (await sitemap()).find((e) => e.url === `${SITE}/magazine`);
    expect(entry).toBeDefined();
    expect(entry?.lastModified).toEqual(new Date('2026-08-01T00:00:00Z'));
    demo.IS_DEMO = true;
  });

  it('lists /analysis and every event study in the registry, undated', async () => {
    const entries = await sitemap();
    const byUrl = new Map(entries.map((e) => [e.url, e]));
    expect(byUrl.has(`${SITE}/analysis`)).toBe(true);
    expect(EVENT_STUDIES.length).toBeGreaterThan(0);
    for (const study of EVENT_STUDIES) {
      const entry = byUrl.get(`${SITE}/analysis/${study.slug}`);
      expect(entry, study.slug).toBeDefined();
      expect(entry?.lastModified).toBeUndefined();
    }
  });

  it('dates an article by its newest body revision after publication, else publishedAt', async () => {
    const byUrl = new Map((await sitemap()).map((e) => [e.url, e]));
    expect(byUrl.get(`${SITE}/articles/revised-story`)?.lastModified).toEqual(new Date('2026-09-05T12:00:00Z'));
    expect(byUrl.get(`${SITE}/articles/drafted-story`)?.lastModified).toEqual(new Date('2026-09-08T00:00:00Z'));
    expect(byUrl.get(`${SITE}/articles/english-story`)?.lastModified).toEqual(new Date('2026-09-10T00:00:00Z'));
  });

  it('states lastModified only where a real date exists', async () => {
    const entries = await sitemap();
    const dated = entries.filter((e) => e.lastModified !== undefined).map((e) => e.url);
    // The one article with publishedAt, and the grid explorer's newest day.
    expect(dated).toContain(`${SITE}/articles/english-story`);
    expect(dated).not.toContain(`${SITE}/articles/undated`);
    for (const u of [`${SITE}`, `${SITE}/about`, `${SITE}/analysis`, `${SITE}/categories/power-generation`]) {
      expect(dated, u).not.toContain(u);
    }
  });

  it('never lists a robots-blocked or noindex family', async () => {
    const urls = (await sitemap()).map((e) => new URL(e.url).pathname);
    for (const p of urls) {
      expect(p, p).not.toMatch(/^\/(admin|cms|members|api|login|auth|sign-in|sign-up|search|tags|data)(\/|$)/);
    }
  });

  it('de-duplicates the news desk author page', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.filter((u) => u === `${SITE}/authors/esb-news-desk`)).toHaveLength(1);
    expect(urls).toContain(`${SITE}/authors/hamim-rahman`);
  });

  it('lists /grid-explorer/archive and yearly archive hubs', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(`${SITE}/grid-explorer/archive`);
    expect(urls).toContain(`${SITE}/grid-explorer/archive/2026`);
    expect(urls).toContain(`${SITE}/grid-explorer/archive/2024`);
  });
});
