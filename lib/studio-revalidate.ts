/**
 * What the ESB Studio (the desktop newsroom app) may ask the site to refresh after it saves an article straight into
 * the database. The Studio does not go through the CMS server actions, so nothing revalidates the cached public pages
 * and they would wait out their ISR window (10 to 15 minutes). This is the validation half of that request; the route
 * does the authentication and the revalidation.
 */
export const MAX_REVALIDATE_SLUGS = 5;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The slugs to refresh, or null when the body is not a request the route should act on. */
export function parseRevalidateSlugs(body: unknown): string[] | null {
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { slugs?: unknown }).slugs;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_REVALIDATE_SLUGS) return null;
  const out: string[] = [];
  for (const s of raw) {
    if (typeof s !== 'string' || s.length === 0 || s.length > 120 || !SLUG.test(s)) return null;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}
