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

export function isRetiredPath(pathname: string): boolean {
  return BENGALI_SCRIPT.test(pathname);
}
