import { describe, expect, it } from 'vitest';
import nextConfig from '@/next.config';

/**
 * The WordPress-era redirects in next.config.ts. Each destination must be the
 * page the old URL was about, or no redirect at all — a redirect to the news
 * index for an author archive is a soft 404 with extra steps (stage 10).
 */

type Redirect = { source: string; destination: string; permanent: boolean };

async function redirects(): Promise<Redirect[]> {
  const list = await nextConfig.redirects!();
  return list as Redirect[];
}

function find(list: Redirect[], source: string): Redirect | undefined {
  return list.find((r) => r.source === source);
}

describe('legacy redirects', () => {
  it('sends each known WordPress author login to that author’s own page', async () => {
    const list = await redirects();
    expect(find(list, '/author/hamim')?.destination).toBe('/authors/mehedi-hasan-hamim');
    expect(find(list, '/author/rasel')?.destination).toBe('/authors/sheikh-rasel');
    expect(find(list, '/author/admin')?.destination).toBe('/authors/esb-news-desk');
    for (const r of list.filter((r) => r.source.startsWith('/author/'))) {
      expect(r.permanent, r.source).toBe(true);
      expect(r.destination, r.source).toMatch(/^\/authors\/[a-z0-9-]+$/);
    }
  });

  it('does not guess a destination for unknown author slugs', async () => {
    const list = await redirects();
    expect(list.some((r) => r.source === '/author/:name' || r.source.startsWith('/author/:'))).toBe(false);
  });

  it('keeps the content-equivalent mappings', async () => {
    const list = await redirects();
    expect(find(list, '/category/:slug')?.destination).toBe('/categories/:slug');
    expect(find(list, '/category/:parent/:slug')?.destination).toBe('/categories/:slug');
    expect(find(list, '/tag/:tag')?.destination).toBe('/tags/:tag');
    expect(find(list, '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug')?.destination).toBe('/articles/:slug');
    expect(find(list, '/power-grid')?.destination).toBe('/grid-explorer');
  });

  it('sends slugless WordPress date archives and the duplicate category slug home', async () => {
    const list = await redirects();
    expect(find(list, '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})')?.destination).toBe('/articles');
    expect(find(list, '/:year(\\d{4})/:month(\\d{2})')?.destination).toBe('/articles');
    expect(find(list, '/categories/grid-transmission-2')?.destination).toBe('/categories/grid-transmission');
  });

  it('maps legacy WordPress category slugs and index.php to valid canonical destinations', async () => {
    const list = await redirects();
    expect(find(list, '/category/:parent/distribution')?.destination).toBe('/categories/distribution-utilities');
    expect(find(list, '/category/distribution')?.destination).toBe('/categories/distribution-utilities');
    expect(find(list, '/category/:parent/policy')?.destination).toBe('/categories/energy-policy-regulators');
    expect(find(list, '/category/policy')?.destination).toBe('/categories/energy-policy-regulators');
    expect(find(list, '/category/:parent/renewable-energy')?.destination).toBe('/categories/renewables-nuclear');
    expect(find(list, '/index.php')?.destination).toBe('/');
  });
});
