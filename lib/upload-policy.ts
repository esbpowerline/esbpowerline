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
  const normalized = mimeType.trim().toLowerCase();
  if (BLOCKED_UPLOAD_MIME_TYPES.has(normalized)) return true;
  const name = fileName?.toLowerCase();
  if (name && BLOCKED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext))) return true;
  return false;
}

export function assertAllowedUploadMime(mimeType: string, fileName?: string): void {
  if (isBlockedUploadMime(mimeType, fileName)) {
    throw new Error(`${mimeType || 'This'} file type is not allowed (SVG/HTML/XML are blocked)`);
  }
}