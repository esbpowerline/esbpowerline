/** Public routes invalidated when content or settings change */
export const PUBLIC_REVALIDATE_PATHS = [
  '/',
  '/articles',
  '/magazine',
  '/categories',
  '/search',
  '/tags',
  '/grid-explorer',
] as const;

/**
 * Cache tags for the `unstable_cache` data layer. Mutations call `revalidateTag`
 * with these so published/edited content reflects immediately instead of waiting out
 * the per-entry time TTL (up to 60s for lists, 1h for related articles).
 */
export const CONTENT_TAGS = {
  articles: 'content:articles',
  categories: 'content:categories',
  magazine: 'content:magazine',
} as const;
