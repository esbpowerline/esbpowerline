import path from 'path';

/** Resolve a public /uploads URL to a safe absolute path, or null if traversal is detected. */
export function resolveSafeLocalUploadPath(url: string): string | null {
  if (!url.startsWith('/uploads/')) return null;

  const relative = url.replace(/^\//, '');
  if (relative.includes('..') || relative.includes('\\')) return null;

  const publicDir = path.resolve(process.cwd(), 'public');
  const uploadsRoot = path.resolve(publicDir, 'uploads');
  const filePath = path.resolve(publicDir, relative);
  if (filePath !== uploadsRoot && !filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}