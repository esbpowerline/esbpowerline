import 'server-only';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * Record a file the upload route has just stored.
 *
 * Deliberately NOT a server action. It lived in lib/actions/media.ts ('use server'), which
 * made it a public endpoint any media.upload user could call with an arbitrary `url` — and
 * deleteMedia removes the storage object a row's url names, so an author could register a
 * category icon or another user's image as "theirs" and then delete it (2026-11-23 audit).
 * Only app/api/upload calls this, with the URL the storage layer returned.
 */
export async function recordUploadedMedia(data: {
  name: string;
  url: string;
  type: string;
  mimeType?: string;
  size?: number;
  altText?: string;
  uploadedById: string;
}) {
  const media = await prisma.media.create({ data });
  revalidatePath('/cms/media');
  revalidatePath('/admin/media');
  return media;
}
