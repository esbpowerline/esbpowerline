import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Fallback for legacy `/uploads/...` image URLs.
 *
 * Next serves `public/uploads/**` statically, and an exact path never reaches
 * this handler — verified against a running server: the exact filename comes
 * back from the static handler, and only a URL whose timestamp prefix does not
 * match the file on disk gets here. Those exist because stored URLs and stored
 * files were renamed at different times, so the prefix drifted while the rest
 * of the name stayed put. Matching is therefore on the suffix after the first
 * `1782489863056-` style prefix.
 *
 * It used to `readdir` the whole uploads directory on every request and
 * linear-scan the listing. The directory is immutable at runtime — Vercel's
 * filesystem is read-only and its contents are fixed for the life of a
 * deployment — so that work was identical every time and is now done once per
 * instance, behind a promise so concurrent requests share the one scan.
 *
 * Order is deliberate: exact filename first (one `stat`, no listing at all),
 * then the memoized suffix index, then 404. A cold instance costs one readdir
 * of 42 files; every request after that is a map lookup.
 */

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/** suffix -> real filename on disk. Built once per instance. */
let indexPromise: Promise<Map<string, string>> | null = null;

/** Everything after the leading `<digits>-`, which is the part that survived renaming. */
function suffixOf(filename: string): string {
  const m = filename.match(/^\d+-(.+)$/);
  return m ? m[1] : filename;
}

function loadIndex(): Promise<Map<string, string>> {
  if (indexPromise) return indexPromise;
  indexPromise = fs
    .readdir(UPLOADS_DIR)
    .then((files) => {
      const map = new Map<string, string>();
      for (const f of files) {
        // First writer wins, matching the old `files.find(...)` which returned
        // the first match in directory order.
        const key = suffixOf(f);
        if (!map.has(key)) map.set(key, f);
      }
      return map;
    })
    .catch((error) => {
      // A missing directory is not fatal — every request simply 404s, which is
      // what the scan did too. Do not memoize the failure.
      console.error('Error indexing uploads directory:', error);
      indexPromise = null;
      return new Map<string, string>();
    });
  return indexPromise;
}

/**
 * Serve only known raster image types inline. An SVG here would render as
 * markup on this origin — stored XSS from an unauthenticated route — so it is
 * never given image/svg+xml; anything unrecognised is forced to download as an
 * opaque octet-stream rather than being sniffed and run. nosniff stops the
 * browser second-guessing the type we set.
 */
function contentTypeFor(filename: string): string | null {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.webp')) return 'image/webp';
  if (filename.endsWith('.gif')) return 'image/gif';
  if (filename.endsWith('.avif')) return 'image/avif';
  return null;
}

function serve(fileBuffer: Buffer, filename: string): NextResponse {
  const contentType = contentTypeFor(filename);
  const headers: Record<string, string> = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  };
  if (contentType) {
    headers['Content-Type'] = contentType;
  } else {
    headers['Content-Type'] = 'application/octet-stream';
    headers['Content-Disposition'] = 'attachment';
  }
  return new NextResponse(new Uint8Array(fileBuffer), { headers });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.path;
  if (!pathParts || pathParts.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Only ever the basename. Taking the last segment is what keeps `..` and any
  // nested path out of the join below; keep it that way.
  const filename = pathParts[pathParts.length - 1];
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    // 1. Deterministic lookup. Costs one stat and no directory listing.
    const direct = path.join(UPLOADS_DIR, filename);
    if (path.dirname(direct) === UPLOADS_DIR) {
      try {
        const buf = await fs.readFile(direct);
        return serve(buf, filename);
      } catch {
        // Not there under this exact name; fall through to the index.
      }
    }

    // 2. Indexed lookup for a drifted timestamp prefix.
    const index = await loadIndex();
    const matchingFile = index.get(suffixOf(filename));
    if (matchingFile) {
      const buf = await fs.readFile(path.join(UPLOADS_DIR, matchingFile));
      return serve(buf, matchingFile);
    }
  } catch (error) {
    console.error('Error in uploads fallback route:', error);
  }

  return new NextResponse('Not Found', { status: 404 });
}
