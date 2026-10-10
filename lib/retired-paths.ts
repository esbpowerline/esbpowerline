/**
 * URLs this site has retired for good, answered 410 Gone by the middleware.
 *
 * The old WordPress site published Bengali news under Bengali slugs. Search
 * Console (read 2026-09-19) still held 154 date URLs with Bengali slugs and 85
 * other Bengali-era paths as "crawled, currently not indexed", plus 94 more as
 * "Not found". The 33 Bengali articles that came across in the migration were
 * unpublished on 2026-09-19 and deleted on 2026-10-10 (backup kept off-repo) —
 * the site publishes English only, and no current page, slug, category or tag
 * carries Bengali script. A 404 says "not here now" and Google keeps
 * re-checking it; 410 says "removed on purpose", which is what this is.
 *
 * Takes a pathname already percent-decoded by normalizeRequestPath, so both
 * `/articles/বিদ্যুৎ…` and its `%E0%A6…` spelling match.
 */
const BENGALI_SCRIPT = /[ঀ-৿]/;

/**
 * WordPress internals and its numeric post forms, from the same Search Console
 * lists (2026-10-10): /wp-content/*, /p=63212, /53773.html. None maps to a page
 * here — WordPress post ids were not carried over — so they are gone, not moved.
 */
const WORDPRESS_LEFTOVER = /^\/(wp-(content|admin|includes|json)(\/|$)|p=\d+$|\d+\.html$)/;

export function isRetiredPath(pathname: string): boolean {
  return BENGALI_SCRIPT.test(pathname) || WORDPRESS_LEFTOVER.test(pathname);
}

/**
 * `/?459430.html`, `/index.php?1183480.html`: spam query strings someone
 * pointed at the homepage. Search Console listed 20+ as "Duplicate without
 * user-selected canonical"; they are all the homepage. Next normalises a bare
 * key to `?459430.html=` before middleware sees it (logged in dev, 2026-10-10),
 * so the trailing `=` is optional.
 */
export function isSpamHomepageQuery(pathname: string, search: string): boolean {
  return pathname === '/' && /^\?\d+\.html=?$/.test(search);
}
