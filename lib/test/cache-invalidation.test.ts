import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * The public data caches are no longer self-healing.
 *
 * Every `unstable_cache` serving public content used to carry `revalidate: 60`,
 * so a mutation that forgot to expire its tag still corrected itself within a
 * minute and nobody noticed. Three of them had forgotten — trashing a published
 * article, platform undo, and replacing a hero image — and the timer was the
 * only thing covering it.
 *
 * Those timers are now a day. A missed tag is a day of wrong content, so the
 * wiring is asserted here rather than trusted:
 *
 *   mutation → revalidate helper → cache tag → the caches carrying that tag
 *
 * These read source text on purpose. A server action cannot be invoked from
 * vitest — `revalidateTag` throws outside a request scope — so what is checkable
 * without a browser and a live database is that the call exists on every path
 * that needs it. That is exactly the property that broke.
 */

const read = (rel: string) => readFileSync(path.join(process.cwd(), rel), 'utf8');

/** Mutations that can change what an anonymous reader sees, and the helper each owes. */
const PUBLIC_CONTENT_MUTATIONS: Array<{
  file: string;
  what: string;
  mustCall: RegExp;
}> = [
  { file: 'lib/actions/articles.ts', what: 'article create / update / publish / delete / placement', mustCall: /revalidateArticleContent\(\)/ },
  { file: 'lib/actions/categories.ts', what: 'category create / rename / reorder / delete', mustCall: /revalidateCategoryContent\(\)/ },
  { file: 'lib/actions/magazine.ts', what: 'magazine issue create / update / delete', mustCall: /revalidateMagazineContent\(\)/ },
  { file: 'lib/actions/platform.ts', what: 'platform bulk actions', mustCall: /revalidate(All|Article)Content\(\)/ },
  { file: 'lib/actions/review-workflow.ts', what: 'approve-and-publish after review', mustCall: /revalidateArticleContent\(\)/ },
  { file: 'lib/cron/publish-scheduled-articles.ts', what: 'scheduled publish (cron)', mustCall: /revalidateArticleContent\(\)/ },
  // The three that were missing it, and the reason this file exists.
  { file: 'lib/actions/editor-trash.ts', what: 'editor trashes their own published article', mustCall: /revalidateArticleContent\(\)/ },
  { file: 'lib/actions/logs.ts', what: 'platform undo restores status / publishedAt', mustCall: /revalidateArticleContent\(\)/ },
  { file: 'lib/actions/media.ts', what: 'hero image replaced on a live article', mustCall: /revalidateArticleContent\(\)/ },
  { file: 'lib/actions/settings.ts', what: 'site settings edit', mustCall: /revalidateTag\(SITE_SETTINGS_CACHE_TAG/ },
];

describe('every public-content mutation expires its cache tag', () => {
  for (const { file, what, mustCall } of PUBLIC_CONTENT_MUTATIONS) {
    it(`${file} — ${what}`, () => {
      expect(read(file)).toMatch(mustCall);
    });
  }
});

describe('the revalidate helpers expire the tags the caches are registered under', () => {
  const helpers = read('lib/revalidate-tags.ts');
  const paths = read('lib/public-paths.ts');

  it('exposes a helper per content domain', () => {
    for (const fn of [
      'revalidateArticleContent',
      'revalidateCategoryContent',
      'revalidateMagazineContent',
      'revalidateAllContent',
      'revalidateDataRelease',
    ]) {
      expect(helpers).toContain(`export function ${fn}`);
    }
  });

  it('expires immediately rather than scheduling', () => {
    // `revalidateTag(tag)` without a profile is deprecated in Next 16 and warns;
    // `{ expire: 0 }` is what makes publishing read-your-writes.
    expect(helpers).toMatch(/revalidateTag\(tag,\s*\{\s*expire:\s*0\s*\}\)/);
  });

  it('an article change also flushes categories, whose counts move with it', () => {
    const body = helpers.slice(helpers.indexOf('export function revalidateArticleContent'));
    expect(body).toContain('CONTENT_TAGS.articles');
    expect(body).toContain('CONTENT_TAGS.categories');
  });

  it('defines the three content tags the caches use', () => {
    for (const tag of ['articles', 'categories', 'magazine']) {
      expect(paths).toMatch(new RegExp(`${tag}\\s*:`));
    }
  });
});

describe('the 60-second clamp is gone and has not crept back', () => {
  const CACHE_MODULES = [
    'lib/category-content.ts',
    'lib/coverage-content.ts',
    'lib/homepage-content.ts',
  ];

  for (const file of CACHE_MODULES) {
    it(`${file} has no sub-minute revalidate`, () => {
      const src = read(file);
      // A literal `revalidate: 60` here pins every route that touches this
      // module — and, through the shared layout, most of the public site.
      expect(src).not.toMatch(/revalidate:\s*(60|30|15|10|5|1)\s*[,}]/);
    });
  }

  it('every public cache is tagged, so the timer is only ever a backstop', () => {
    for (const file of CACHE_MODULES) {
      const src = read(file);
      const revalidates = src.match(/revalidate:\s*[A-Z_]+/g) ?? [];
      const tagged = src.match(/tags:\s*\[/g) ?? [];
      expect(revalidates.length).toBeGreaterThan(0);
      // Each cached entry that names a TTL constant also names its tags.
      expect(tagged.length).toBeGreaterThanOrEqual(revalidates.length);
    }
  });

  it('the public layout does not re-impose a short window on the whole group', () => {
    // A layout's revalidate is the floor for every page beneath it. This was
    // 300, which capped all 26 public routes regardless of what they declared.
    const layout = read('app/(public)/layout.tsx');
    const m = layout.match(/export const revalidate = ([0-9_]+)/);
    expect(m).not.toBeNull();
    expect(Number(m![1].replace(/_/g, ''))).toBeGreaterThanOrEqual(3600);
  });
});
