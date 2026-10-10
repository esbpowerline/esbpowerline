/**
 * A dynamic route segment as the reader typed it.
 *
 * Next hands `/tags/Natural%20gas` to the page as `Natural%20gas`, still
 * encoded. The tag page looked that up verbatim, found no article tagged
 * "Natural%20gas", and answered 404 — for every tag with a space or any other
 * character outside [A-Za-z0-9_.~-]: 192 of the 818 published tags, 208 links
 * from 59 articles (Search Console "Not found", 2026-10-10). A malformed escape
 * is returned as-is rather than thrown, so it still reaches notFound().
 */
export function decodeRouteParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
