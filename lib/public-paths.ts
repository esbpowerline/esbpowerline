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
