import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/admin-client';
import {
  DEMO_ISSUE,
  MAGAZINE_BUCKET,
  MAGAZINE_FALLBACK_COVER,
  PAGE_OBJECTS,
  THUMB_OBJECTS,
} from '@/lib/magazine-demo-issue';

/**
 * Signs the magazine artwork out of its private Supabase Storage bucket.
 *
 * Why signed and not just public: the demo issue carries full-page mockup
 * adverts for JERA, Summit and Excelerate that were never sold, so the artwork
 * must not be fetchable by anyone who guesses a URL, and the PDF sits behind a
 * member sign-in that a public object path would reduce to decoration.
 *
 * What this replaced: every URL used to point at nginx on the Raspberry Pi
 * (`http://esb-pi:8090`), reachable only over Tailscale. On 2026-09-06 Tailscale
 * was down, `esb-pi` stopped resolving, and the magazine page rendered 97 broken
 * images and a dead download with no indication anything was wrong. The Pi still
 * runs the daily and hourly ingest; it serves nothing a reader loads.
 *
 * Fail-soft, like `releases.server.ts` and middleware: a Storage outage returns
 * nulls and empty arrays, the page falls back to its bundled cover and the
 * reader reports that it has no pages. It never throws a render.
 */

/**
 * One hour. Long enough for a 20 MB PDF on a slow connection, short enough that
 * a leaked link is worthless by the time it is shared. The page is server-
 * rendered per request, so every load mints fresh URLs.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface MagazineAssets {
  /** Always set: falls back to the bundled cover when Storage is unavailable. */
  coverUrl: string;
  /** Empty when Storage is unavailable — the reader shows its own empty state. */
  pageImages: string[];
  thumbImages: string[];
  /** Null when Storage is unavailable, which disables the download button. */
  pdfUrl: string | null;
  /** True when nothing could be signed, so the page can say so out loud. */
  unavailable: boolean;
}

const EMPTY: MagazineAssets = {
  coverUrl: MAGAZINE_FALLBACK_COVER,
  pageImages: [],
  thumbImages: [],
  pdfUrl: null,
  unavailable: true,
};

/**
 * Signs a batch and returns the URLs **in the order of `paths`**.
 *
 * createSignedUrls does not promise input order, and page images are positional
 * — page 7 arriving where page 12 belongs would silently reorder the issue — so
 * results are re-keyed by path rather than zipped. A path that failed to sign
 * yields null and is dropped by the caller.
 */
async function signBatch(paths: readonly string[]): Promise<(string | null)[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) return paths.map(() => null);

  const { data, error } = await supabase.storage
    .from(MAGAZINE_BUCKET)
    .createSignedUrls([...paths], SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error('[magazine] could not sign page artwork:', error?.message ?? 'no data');
    return paths.map(() => null);
  }

  const byPath = new Map(data.map((row) => [row.path ?? '', row.error ? null : row.signedUrl]));
  return paths.map((path) => byPath.get(path) ?? null);
}

/**
 * Just the cover, signed for a day.
 *
 * The homepage carries a magazine teaser and revalidates every 180 seconds, so
 * a one-hour signature would eventually be baked into a cached page that
 * outlives it and the cover would 403. A day is comfortably longer than any
 * window that page is cached for. The cover is also the one asset that is
 * already public in substance — it is the image the issue is sold by.
 */
export async function getMagazineCoverUrl(): Promise<string> {
  const supabase = createServiceRoleClient();
  if (!supabase) return MAGAZINE_FALLBACK_COVER;

  const { data, error } = await supabase.storage
    .from(MAGAZINE_BUCKET)
    .createSignedUrl(DEMO_ISSUE.coverPath, 24 * 60 * 60);

  if (error) console.error('[magazine] could not sign the cover:', error.message);
  return data?.signedUrl ?? MAGAZINE_FALLBACK_COVER;
}

export async function getMagazineAssets(): Promise<MagazineAssets> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error('[magazine] Supabase is not configured; serving the bundled cover only.');
    return EMPTY;
  }

  const [cover, pages, thumbs, pdf] = await Promise.all([
    signBatch([DEMO_ISSUE.coverPath]),
    signBatch(PAGE_OBJECTS),
    signBatch(THUMB_OBJECTS),
    supabase.storage
      .from(MAGAZINE_BUCKET)
      .createSignedUrl(DEMO_ISSUE.pdfPath, SIGNED_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        if (error) console.error('[magazine] could not sign the PDF:', error.message);
        return data?.signedUrl ?? null;
      }),
  ]);

  const pageImages = pages.filter((url): url is string => Boolean(url));
  const thumbImages = thumbs.filter((url): url is string => Boolean(url));

  // A partial batch means objects are missing from the bucket, not that the
  // reader should quietly show a shorter issue. Say so; the page still renders.
  if (pageImages.length !== PAGE_OBJECTS.length) {
    console.error(
      `[magazine] signed ${pageImages.length}/${PAGE_OBJECTS.length} page images — ` +
        're-run scripts/upload-magazine-assets.mjs',
    );
  }

  return {
    coverUrl: cover[0] ?? MAGAZINE_FALLBACK_COVER,
    pageImages,
    thumbImages,
    pdfUrl: pdf,
    unavailable: pageImages.length === 0 && !pdf,
  };
}
