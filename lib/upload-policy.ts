// Active-content types that execute in the browser when served inline (stored-XSS
// vectors from a public storage bucket). SVG can carry <script>; HTML/XHTML/XML render
// as markup.
const BLOCKED_UPLOAD_MIME_TYPES = new Set([
  'image/svg+xml',
  'image/svg',
  'text/svg',
  'text/xml',
  'application/xml',
  'text/html',
  'application/xhtml+xml',
]);

const BLOCKED_UPLOAD_EXTENSIONS = ['.svg', '.html', '.htm', '.xhtml', '.xml'];

export function isBlockedUploadMime(mimeType: string, fileName?: string): boolean {
  // Strip MIME parameters before matching. `image/svg+xml; charset=utf-8` is
  // not in the Set as written, so the exact-string form let a crafted
  // Content-Type with a bare `.png` filename slip an SVG into a public bucket
  // where it renders inline — stored XSS. The essence is `type/subtype`.
  const base = mimeType.trim().toLowerCase().split(';')[0].trim();
  if (BLOCKED_UPLOAD_MIME_TYPES.has(base)) return true;
  // Any `+xml` structured syntax renders as markup regardless of the subtype,
  // so treat the whole family as active content rather than enumerating it.
  if (base.endsWith('+xml') || base === 'text/xml' || base === 'application/xml') return true;
  const name = fileName?.toLowerCase();
  if (name && BLOCKED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext))) return true;
  return false;
}

// The production `media` bucket accepts exactly these five types. The route used to check
// only the client-declared Content-Type against the blocklist above, so any bytes labelled
// `application/pdf` or `image/gif` were stored as-is in the public bucket (raster types are
// re-encoded by sharp, which validates them; GIF and PDF are not). Check the bytes.
const UPLOAD_SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/gif': (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1')),
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  'application/pdf': (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
};

/** True when the declared type is one the media bucket takes AND the bytes are that type. */
export function uploadMatchesDeclaredType(buffer: Buffer, mimeType: string): boolean {
  let base = mimeType.trim().toLowerCase().split(';')[0].trim();
  if (base === 'image/jpg' || base === 'image/pjpeg') base = 'image/jpeg';
  const check = UPLOAD_SIGNATURES[base];
  return Boolean(check && check(buffer));
}

export function assertAllowedUploadMime(mimeType: string, fileName?: string): void {
  if (isBlockedUploadMime(mimeType, fileName)) {
    throw new Error(`${mimeType || 'This'} file type is not allowed (SVG/HTML/XML are blocked)`);
  }
}