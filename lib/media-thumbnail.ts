import { mediaStorageBucket } from '@/lib/media-storage-url';

/**
 * The URL a CMS media grid should render for a stored object.
 *
 * ## Why this no longer resizes
 *
 * It used to point at Supabase's `/storage/v1/render/image/public/` endpoint.
 * Image Transformations have since been disabled on the project, and that
 * endpoint now answers:
 *
 *     403  {"error":"FeatureNotEnabled","message":"feature not enabled for this tenant"}
 *
 * Which meant every thumbnail in every media grid was a broken image: 168 of
 * the 212 `Media` rows are Supabase objects and went through here, and the
 * other 42 are legacy `/uploads/` paths that `normalizeArticleImageUrl` was
 * sending to the same dead endpoint. The whole library was blank for editors.
 *
 * ## Why serving the original is fine now, when it was not before
 *
 * The comment this replaces said a library of a few hundred items was "several
 * hundred megabytes per browse", and at the time it was right — uploads were
 * stored byte-for-byte as they arrived. They are not any more: `media-storage.ts`
 * caps the longest edge at 2560px, strips metadata and stores WebP q100 on the
 * way in. Measured against the live table, the 168 Supabase-hosted objects come
 * to **16 MB in total — 100 kB average, 342 kB largest**. A full browse of the
 * entire library is now smaller than a single unoptimised phone photo used to be.
 *
 * So the resize is not worth a transformation, and it is certainly not worth
 * routing staff traffic through Vercel's optimizer to replace one image bill
 * with another. Every call site constrains the rendered box in CSS
 * (`object-cover` inside a fixed aspect ratio), so the layout does not care how
 * large the source is.
 *
 * `width` and `quality` are kept in the signature deliberately. Six call sites
 * pass them, they document what each grid is asking for, and if transformations
 * are ever re-enabled this is the one place that has to change back.
 */
export function mediaThumbnailUrl(
  url: string | null | undefined,
  width: number,
  quality = 70,
): string | null {
  void width;
  void quality;

  const trimmed = url?.trim();
  if (!trimmed) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return trimmed;

  const marker = `/storage/v1/object/public/${mediaStorageBucket()}/`;
  const idx = trimmed.indexOf(marker);
  // Not a Supabase object URL — a local /uploads/ path, an external host, a
  // non-image. Hand it back untouched, as before.
  if (idx < 0) return trimmed;

  // Strip any query the stored URL carries (older rows were saved with the
  // transform parameters already baked in) and serve the object itself.
  const objectPath = trimmed.slice(idx + marker.length);
  const [cleanPath] = objectPath.split('?');

  return `${supabaseUrl}${marker}${cleanPath}`;
}

/**
 * Widths the grids ask for. No longer requested from a transformer, but still
 * the honest statement of how big each grid renders its cards, and the numbers
 * to restore if transformations ever come back.
 */
export const MEDIA_THUMB_WIDTH = 320;
export const MEDIA_PREVIEW_WIDTH = 1200;
