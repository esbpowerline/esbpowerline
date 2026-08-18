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

export function assertAllowedUploadMime(mimeType: string, fileName?: string): void {
  if (isBlockedUploadMime(mimeType, fileName)) {
    throw new Error(`${mimeType || 'This'} file type is not allowed (SVG/HTML/XML are blocked)`);
  }
}