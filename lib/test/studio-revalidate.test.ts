import { describe, expect, it } from 'vitest';
import { MAX_REVALIDATE_SLUGS, parseRevalidateSlugs } from '@/lib/studio-revalidate';

/** What the Studio may ask the site to refresh: a short list of well-formed article slugs, nothing else. */
describe('parseRevalidateSlugs', () => {
  it('accepts a list of slugs and drops duplicates', () => {
    expect(parseRevalidateSlugs({ slugs: ['rooppur-unit-1', 'rooppur-unit-1', 'lng-cargo-deal'] })).toEqual(['rooppur-unit-1', 'lng-cargo-deal']);
  });

  it('refuses anything that is not a request for 1 to 5 slugs', () => {
    expect(parseRevalidateSlugs(null)).toBeNull();
    expect(parseRevalidateSlugs({})).toBeNull();
    expect(parseRevalidateSlugs({ slugs: [] })).toBeNull();
    expect(parseRevalidateSlugs({ slugs: 'one' })).toBeNull();
    expect(parseRevalidateSlugs({ slugs: Array.from({ length: MAX_REVALIDATE_SLUGS + 1 }, (_, i) => `s-${i}`) })).toBeNull();
  });

  it('refuses a slug that could be a path or an injection', () => {
    for (const bad of ['../admin', '/articles/x', 'Upper-Case', 'a b', 'x'.repeat(121), '', 'trailing-', '-leading', 'a--b', 'x?y=1']) {
      expect(parseRevalidateSlugs({ slugs: [bad] })).toBeNull();
    }
    expect(parseRevalidateSlugs({ slugs: [42 as unknown as string] })).toBeNull();
  });
});
