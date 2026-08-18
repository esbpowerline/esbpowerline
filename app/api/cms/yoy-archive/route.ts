import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import {
  MAX_SHEET_BYTES,
  resolveSheetPath,
  validateSheetFilename,
  yoyArchiveDir,
} from '@/lib/data/yoy-archive';

/**
 * File a generated year-on-year comparison sheet straight into the operator's
 * own archive folder, and list what is already in it.
 *
 * The panel could only ever hand the browser a download, which meant the sheet
 * landed in Downloads and had to be dragged across by hand. The archive lives on
 * a mapped network drive on the operator's machine, so this route only works
 * where that drive is mounted — i.e. `next dev` locally, the same arrangement as
 * the local data publish route. On Vercel it refuses in plain words rather than
 * failing with an unreadable ENOENT.
 */

export const dynamic = 'force-dynamic';

/** Serverless has no W: drive and never will. */
function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

const SERVERLESS_MESSAGE =
  'Saving to the comparison archive writes to a folder on your own machine (a mapped network drive), which the deployed site cannot reach. Run `npm run dev` locally and use the panel from there — or use the download button instead.';

/** Missing drive vs. missing folder read very differently to whoever has to fix it. */
function describeMissingDir(dir: string): string {
  return `The archive folder ${dir} is not available. Check the network drive is mapped and connected, or set ESB_YOY_ARCHIVE_DIR to another folder.`;
}

export async function POST(request: NextRequest) {
  // article.create is the CMS/editor permission: writing a comparison sheet is
  // editorial work, so it must not be gated behind admin access.
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'article.create')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (isServerless()) {
    return NextResponse.json({ ok: false, error: SERVERLESS_MESSAGE }, { status: 503 });
  }

  let body: { filename?: unknown; text?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected a JSON body' }, { status: 400 });
  }

  const check = validateSheetFilename(body.filename);
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  }

  if (typeof body.text !== 'string') {
    return NextResponse.json({ ok: false, error: 'text must be a string.' }, { status: 400 });
  }
  // Measured in bytes, not characters: the cap exists to stop an unbounded body
  // being streamed onto a network share, and it is bytes that cross the wire.
  const bytes = Buffer.byteLength(body.text, 'utf8');
  if (bytes > MAX_SHEET_BYTES) {
    return NextResponse.json(
      { ok: false, error: `That sheet is ${(bytes / 1024 / 1024).toFixed(1)} MB; the limit is 5 MB.` },
      { status: 413 },
    );
  }

  const dir = yoyArchiveDir();
  const target = resolveSheetPath(dir, check.name);
  if (!target.ok) {
    return NextResponse.json({ ok: false, error: target.error }, { status: 400 });
  }

  try {
    if (!existsSync(dir)) {
      // Only ever create the archive folder itself, never a path the request
      // supplied — by this point the filename is known to contain no directories.
      await mkdir(dir, { recursive: true });
    }
  } catch {
    return NextResponse.json({ ok: false, error: describeMissingDir(dir) }, { status: 503 });
  }

  try {
    const overwrote = existsSync(target.full);
    await writeFile(target.full, body.text, 'utf8');
    // The operator is told when they replaced yesterday's sheet: these files are
    // named per day and a wrong date silently clobbers a day already filed.
    return NextResponse.json({ ok: true, path: target.full, bytes, overwrote });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `Could not save the sheet: ${message}` }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'article.create')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (isServerless()) {
    return NextResponse.json({ ok: false, error: SERVERLESS_MESSAGE }, { status: 503 });
  }

  const dir = yoyArchiveDir();
  if (!existsSync(dir)) {
    return NextResponse.json({ ok: false, error: describeMissingDir(dir) }, { status: 503 });
  }

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: Array<{ name: string; bytes: number; modified: string }> = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      // Same extension rule as the write path, so the listing shows the sheets
      // and not whatever else the operator keeps in that folder.
      if (!validateSheetFilename(entry.name).ok) continue;
      const resolved = resolveSheetPath(dir, entry.name);
      if (!resolved.ok) continue;
      try {
        const info = await stat(resolved.full);
        files.push({ name: entry.name, bytes: info.size, modified: info.mtime.toISOString() });
      } catch {
        // A file that vanished between readdir and stat is not worth failing on.
      }
    }

    // Newest first: the panel's job is to show what was filed most recently.
    files.sort((a, b) => b.modified.localeCompare(a.modified));

    return NextResponse.json({ ok: true, dir, files });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `Could not read the archive folder: ${message}` }, { status: 500 });
  }
}
