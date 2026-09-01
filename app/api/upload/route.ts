import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { createMedia } from '@/lib/actions/media';
import { uploadMediaBuffer } from '@/lib/media-storage';
import { isBlockedUploadMime } from '@/lib/upload-policy';
import { checkRateLimitResponse } from '@/lib/security';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'media.upload')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 20 uploads per minute per user
  const rateLimitError = checkRateLimitResponse(request, `upload:${session.user.id}`, 20, 60_000);
  if (rateLimitError) return rateLimitError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderRaw = formData.get('folder');
    const folder = folderRaw === 'categories' ? 'categories' : 'library';

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File must be under 10 MB.' }, { status: 400 });
    }
    if (isBlockedUploadMime(file.type || '', file.name)) {
      return NextResponse.json({ error: 'This file type is not allowed.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadMediaBuffer({
      buffer,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      folder,
    });

    await createMedia({
      name: file.name,
      url: stored.url,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      // What the store holds, not what arrived: raster uploads are normalised
      // (capped, stripped, WebP), so the original file's mime and size would
      // describe an object that does not exist.
      mimeType: stored.mimeType,
      size: stored.size,
    });

    return NextResponse.json({ url: stored.url, storage: stored.storage });
  } catch (error) {
    console.error('[upload] Failed to process file:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}