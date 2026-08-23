import path from 'node:path';

/**
 * Where the operator files the year-on-year comparison sheets, and the rules a
 * browser-supplied filename has to satisfy before we go anywhere near it.
 *
 * Kept out of the route file because a Next.js `route.ts` may only export the
 * HTTP handlers and the route config — the guard has to live somewhere it can
 * also be imported by a test/scratch script.
 */

/** Default matches the folder the operator already keeps these sheets in. */
export const DEFAULT_YOY_ARCHIVE_DIR = 'W:\\Grid-Explorer\\Grid Explorer YoY';

/** A text sheet that needs megabytes is not a text sheet; it is a mistake or an attack. */
export const MAX_SHEET_BYTES = 5 * 1024 * 1024;

/** Only the two formats the panel generates. Anything executable stays out. */
const ALLOWED_EXTENSIONS = ['.txt', '.csv'];

export function yoyArchiveDir(): string {
  const configured = process.env.ESB_YOY_ARCHIVE_DIR?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_YOY_ARCHIVE_DIR;
}

export type FilenameCheck = { ok: true; name: string } | { ok: false; error: string };

/**
 * Accept only a bare filename.
 *
 * This matters more here than in most upload paths: the destination is a mapped
 * network drive, so a traversal (`..\..\`, an absolute path, or a `C:` drive
 * letter) would not merely escape a public folder — it would let a CMS request
 * write anywhere the operator's Windows account can reach on the share. So the
 * name is checked structurally first, and the caller then re-checks the resolved
 * path against the archive directory before writing.
 */
export function validateSheetFilename(raw: unknown): FilenameCheck {
  if (typeof raw !== 'string') return { ok: false, error: 'filename must be a string.' };

  const name = raw.trim();
  if (!name) return { ok: false, error: 'filename is required.' };
  if (name.length > 200) return { ok: false, error: 'filename is too long (max 200 characters).' };

  // Control characters and the characters Windows forbids in a filename. `:`
  // also covers drive letters and NTFS alternate data streams (`sheet.txt:evil`).
  // eslint-disable-next-line no-control-regex
  if (/[<>:"|?*\u0000-\u001f]/.test(name)) {
    return { ok: false, error: 'filename contains characters that are not allowed.' };
  }

  // Separators in either slash direction — Windows accepts both.
  if (name.includes('/') || name.includes('\\')) {
    return { ok: false, error: 'filename must be a bare filename, not a path.' };
  }

  // Belt and braces: after the separator check `..` can only be a literal name,
  // but rejecting it outright keeps the rule readable and survives edits above.
  if (name === '.' || name === '..' || name.startsWith('..')) {
    return { ok: false, error: 'filename must not reference a parent directory.' };
  }

  // path.basename() collapses anything the checks above somehow let through; if
  // it changes the string, the string was not a bare filename.
  if (path.win32.basename(name) !== name || path.posix.basename(name) !== name) {
    return { ok: false, error: 'filename must be a bare filename, not a path.' };
  }

  if (path.win32.isAbsolute(name) || path.posix.isAbsolute(name)) {
    return { ok: false, error: 'filename must not be an absolute path.' };
  }

  const ext = path.extname(name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `filename must end in ${ALLOWED_EXTENSIONS.join(' or ')}.` };
  }
  if (name.length === ext.length) {
    return { ok: false, error: 'filename needs a name before the extension.' };
  }

  return { ok: true, name };
}

/**
 * Resolve the write target and prove it is still inside the archive folder.
 *
 * The structural check above should make this impossible to fail, which is
 * exactly why it is here: it is the check that holds if the parsing rules ever
 * disagree with what the filesystem actually does with the string.
 */
export function resolveSheetPath(dir: string, name: string): { ok: true; full: string } | { ok: false; error: string } {
  const root = path.resolve(dir);
  const full = path.resolve(root, name);
  const withSep = root.endsWith(path.sep) ? root : root + path.sep;

  if (!full.startsWith(withSep) || path.dirname(full) !== path.resolve(root)) {
    return { ok: false, error: 'Refusing to write outside the archive folder.' };
  }
  return { ok: true, full };
}
