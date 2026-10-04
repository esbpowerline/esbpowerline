import 'server-only';

import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { createServiceRoleClient } from '@/lib/supabase/admin-client';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { mediaStorageBucket, storagePathFromUrl as storagePathFromUrlFor } from '@/lib/media-storage-url';
import { assertAllowedUploadMime } from '@/lib/upload-policy';
import { resolveSafeLocalUploadPath } from '@/lib/local-upload-path';

export type MediaStorageUploadResult = {
  url: string;
  storage: 'supabase' | 'local' | 'cpanel';
  storagePath: string | null;
  /** What was actually stored — normalisation may change both, and the Media
   *  row must describe the object being served, not the file that arrived. */
  mimeType: string;
  size: number;
};

export { isSupabaseStorageUrl, storagePathFromUrl } from '@/lib/media-storage-url';

function mediaBucket() {
  return mediaStorageBucket();
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function supabasePublicUrl(storagePath: string) {
  const { url } = getSupabaseEnv();
  const bucket = mediaBucket();
  return `${url}/storage/v1/object/public/${bucket}/${storagePath}`;
}

function canUseSupabaseStorage() {
  const { isConfigured, serviceRoleKey } = getSupabaseEnv();
  return isConfigured && !!serviceRoleKey && !!createServiceRoleClient();
}



const ALLOWED_MEDIA_FOLDERS = ['library', 'categories'] as const;
type MediaFolder = (typeof ALLOWED_MEDIA_FOLDERS)[number];

/**
 * Raster formats that get normalised before storage. GIF stays out (conversion
 * drops animation), SVG stays out (vector; rasterising it is a downgrade), and
 * non-images pass through untouched.
 */
const NORMALIZED_RASTER_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/avif']);

/** Longest edge stored. Nothing on the site renders wider than ~1280 CSS px. */
const MAX_IMAGE_DIMENSION = 2560;

/**
 * Cap dimensions, strip metadata, store WebP q100 (q80 before 2026-10-04).
 *
 * Uploads used to be stored byte-for-byte as they arrived — a 12 MP phone photo
 * became a 5-8 MB original served to every reader, which is the root cause of
 * the Supabase egress blowout the thumbnail work only mitigated. `.rotate()`
 * comes first and is load-bearing: it bakes the EXIF orientation into the
 * pixels BEFORE the metadata (and the orientation tag with it) is dropped —
 * without it every portrait phone photo comes out sideways.
 *
 * A file that claims to be a raster image but cannot be decoded is refused
 * rather than stored as-is: it would break every consumer that trusts the mime
 * type, starting with the thumbnailer.
 */
export async function normalizeRasterImage(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  if (!NORMALIZED_RASTER_MIMES.has(input.mimeType)) return input;

  // Lazy on purpose: sharp is a native module, and this file is reachable from
  // client-component import chains (MediaUpload → lib/actions/media →
  // deleteStoredMedia here). A top-level import dragged sharp into the app-ssr
  // bundle, where the build reported lib/actions/media as having no exports at
  // all. Only the upload path ever runs this branch.
  const { default: sharp } = await import('sharp');

  let out: Buffer;
  try {
    out = await sharp(input.buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      // q100 since 2026-10-04, by Hamim's call. Stored originals are the master
      // copy and are never re-encoded from, so a lossy master cannot be undone;
      // the figure that reaches a reader is set by `images.qualities` in
      // next.config.ts, not here. Measured on this repo's own images, q100 is
      // about 2.5x the bytes of q80 — that cost lands on storage, not on egress,
      // because nothing serves this file directly.
      .webp({ quality: 100 })
      .toBuffer();
  } catch (error) {
    throw new Error(
      `Upload claims ${input.mimeType} but could not be decoded as an image: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return {
    buffer: out,
    fileName: input.fileName.replace(/\.[a-zA-Z0-9]+$/, '') + '.webp',
    mimeType: 'image/webp',
  };
}

export async function uploadMediaBuffer(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: MediaFolder;
}): Promise<MediaStorageUploadResult> {
  assertAllowedUploadMime(input.mimeType, input.fileName);

  const stored = await normalizeRasterImage(input);

  // Never trust the caller-supplied folder as a path segment — pin it to the allowlist
  // so it can't be used to escape/rewrite the storage object path.
  const folder: MediaFolder = ALLOWED_MEDIA_FOLDERS.includes(input.folder as MediaFolder)
    ? (input.folder as MediaFolder)
    : 'library';
  const safeName = `${Date.now()}-${sanitizeFileName(stored.fileName)}`;
  const storagePath = `${folder}/${safeName}`;



  if (canUseSupabaseStorage()) {
    const admin = createServiceRoleClient()!;
    const { error } = await admin.storage.from(mediaBucket()).upload(storagePath, stored.buffer, {
      contentType: stored.mimeType,
      upsert: false,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    return {
      url: supabasePublicUrl(storagePath),
      storage: 'supabase',
      storagePath,
      mimeType: stored.mimeType,
      size: stored.buffer.byteLength,
    };
  }

  const localDir =
    folder === 'categories'
      ? path.join(process.cwd(), 'public', 'uploads', 'categories')
      : path.join(process.cwd(), 'public', 'uploads');
  await mkdir(localDir, { recursive: true });

  const filePath = path.join(localDir, safeName);
  await writeFile(filePath, stored.buffer);

  const url =
    folder === 'categories' ? `/uploads/categories/${safeName}` : `/uploads/${safeName}`;

  return {
    url,
    storage: 'local',
    storagePath: null,
    mimeType: stored.mimeType,
    size: stored.buffer.byteLength,
  };
}

export async function deleteStoredMedia(url: string): Promise<void> {


  const { url: base } = getSupabaseEnv();
  const storagePath = storagePathFromUrlFor(url, base, mediaBucket());
  if (storagePath && canUseSupabaseStorage()) {
    const admin = createServiceRoleClient()!;
    const { error } = await admin.storage.from(mediaBucket()).remove([storagePath]);
    if (error) {
      console.warn('[deleteStoredMedia] Supabase remove failed:', error.message);
    }
    return;
  }

  const filePath = resolveSafeLocalUploadPath(url);
  if (filePath) {
    await unlink(filePath).catch(() => undefined);
  }
}