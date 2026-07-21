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

export async function uploadMediaBuffer(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: MediaFolder;
}): Promise<MediaStorageUploadResult> {
  assertAllowedUploadMime(input.mimeType, input.fileName);

  // Never trust the caller-supplied folder as a path segment — pin it to the allowlist
  // so it can't be used to escape/rewrite the storage object path.
  const folder: MediaFolder = ALLOWED_MEDIA_FOLDERS.includes(input.folder as MediaFolder)
    ? (input.folder as MediaFolder)
    : 'library';
  const safeName = `${Date.now()}-${sanitizeFileName(input.fileName)}`;
  const storagePath = `${folder}/${safeName}`;



  if (canUseSupabaseStorage()) {
    const admin = createServiceRoleClient()!;
    const { error } = await admin.storage.from(mediaBucket()).upload(storagePath, input.buffer, {
      contentType: input.mimeType,
      upsert: false,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    return {
      url: supabasePublicUrl(storagePath),
      storage: 'supabase',
      storagePath,
    };
  }

  const localDir =
    folder === 'categories'
      ? path.join(process.cwd(), 'public', 'uploads', 'categories')
      : path.join(process.cwd(), 'public', 'uploads');
  await mkdir(localDir, { recursive: true });

  const filePath = path.join(localDir, safeName);
  await writeFile(filePath, input.buffer);

  const url =
    folder === 'categories' ? `/uploads/categories/${safeName}` : `/uploads/${safeName}`;

  return { url, storage: 'local', storagePath: null };
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