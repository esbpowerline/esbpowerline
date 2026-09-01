import { mediaStorageBucket } from '@/lib/media-storage-url';

/**
 * A width-bounded URL for a media thumbnail.
 *
 * The media library grids rendered `<img src={item.url}>` straight at the
 * stored object — a raw `/storage/v1/object/public/...` URL, which is the
 * **full original**. Uploads are never resized, so a phone photo went across
 * the wire at its native size to fill a 200px card, once per item, on every
 * render of /cms/media, /admin/media, the featured-image picker and the
 * article media picker. A library of a few hundred items is several hundred
 * megabytes per browse, and it was the largest single draw on the project's
 * Supabase egress.
 *
 * Supabase serves resized derivatives from `/storage/v1/render/image/public/`,
 * the same endpoint `normalizeArticleImageUrl` already uses for legacy
 * `/uploads/` paths. Pointing the grids at it costs a transformation and saves
 * the original's bytes on every card.
 *
 * Returns the input unchanged for anything that is not a Supabase object URL —
 * local `/uploads/` paths in development, external URLs, non-images.
 */
export function mediaThumbnailUrl(
  url: string | null | undefined,
  width: number,
  quality = 70,
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return trimmed;

  const marker = `/storage/v1/object/public/${mediaStorageBucket()}/`;
  const idx = trimmed.indexOf(marker);
  if (idx < 0) return trimmed;

  const objectPath = trimmed.slice(idx + marker.length);
  // Strip any query already on the stored URL before adding ours.
  const [cleanPath] = objectPath.split('?');

  return (
    `${supabaseUrl}/storage/v1/render/image/public/${mediaStorageBucket()}/${cleanPath}` +
    `?width=${width}&resize=contain&format=webp&quality=${quality}`
  );
}

/**
 * Widths the grids ask for. Kept here so the three copies of the media grid
 * cannot drift into requesting three different derivatives of the same object,
 * which would triple the transformations rather than share the cache.
 */
export const MEDIA_THUMB_WIDTH = 320;
export const MEDIA_PREVIEW_WIDTH = 1200;
