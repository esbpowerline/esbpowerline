/**
 * Shared metadata helpers for the public site (SEO_FIX_LOG stage 5).
 *
 * Everything here is derived from real values — a title, a slug, a stored
 * image URL. Nothing invents a field that has no source.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';
export const SITE_NAME = 'ESB PowerLine';
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Google truncates descriptions around here; anything longer is wasted. */
export const DESCRIPTION_MAX = 160;

/**
 * A meta description from editorial text.
 *
 * 90 of 161 published excerpts still end in WordPress's literal `[&hellip;]`
 * and 112 run past 160 characters (database, 2026-09-02). This strips markup
 * and entities, and cuts at the last sentence or word boundary before the
 * limit — never mid-word, never with a trailing ellipsis entity.
 */
export function cleanDescription(text: string | null | undefined, max = DESCRIPTION_MAX): string | undefined {
  if (!text) return undefined;
  let s = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[&hellip;\]|&hellip;|…/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return undefined;
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentence >= max * 0.5) return cut.slice(0, sentence + 1);
  const word = cut.lastIndexOf(' ');
  return (word > 0 ? cut.slice(0, word) : cut).replace(/[,;:\-–—]$/, '') + '…';
}

/**
 * The absolute URL social scrapers and Google's image pipeline should fetch.
 *
 * Article images live in Supabase Storage. Pointing `og:image` straight at the
 * bucket handed every scraper the origin URL — and on 2026-09-02, with the
 * project's egress quota exceeded, every one of them answered 402. Through the
 * site's own optimizer the image is served from Vercel's cache and sized for
 * the card. Non-absolute or missing inputs fall back to the site image.
 */
export function shareImageUrl(url: string | null | undefined, width = 1200): string {
  if (!url) return `${SITE_URL}/og-image.png`;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  if (!/^https?:\/\//.test(url)) return `${SITE_URL}/og-image.png`;
  return `${SITE_URL}/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=80`;
}

export type Crumb = { name: string; path?: string };

/**
 * BreadcrumbList for the trail a page actually sits on. The last crumb is the
 * page itself and carries no `item`, as Google's documentation shows.
 * Search Console counted 0 valid breadcrumb items site-wide (2026-09-02).
 */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path && i < crumbs.length - 1 ? { item: `${SITE_URL}${c.path}` } : {}),
    })),
  };
}

/** ItemList of article URLs, for a category or index page. */
export function articleListJsonLd(name: string, slugs: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: slugs.map((slug, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/articles/${encodeURIComponent(slug)}`,
    })),
  };
}
