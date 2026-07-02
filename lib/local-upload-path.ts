import path from 'path';

/** Resolve a public /uploads URL to a safe absolute path, or null if traversal is detected. */
export function resolveSafeLocalUploadPath(url: string): string | null {
  if (!url.startsWith('/uploads/')) return null;

  const relative = url.replace(/^\//, '');
  if (relative.includes('..') || relative.includes('\\')) return null;

  const cwd = process.cwd();
  // Using variables to prevent Next.js from statically tracing the entire public directory
  const pDir = 'pub' + 'lic';
  
  const uploadsRoot = path.resolve(cwd, pDir, 'uploads');
  const filePath = path.resolve(cwd, pDir, relative);
  if (filePath !== uploadsRoot && !filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}