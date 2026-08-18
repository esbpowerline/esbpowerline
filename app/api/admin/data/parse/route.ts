import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';

/**
 * Parse an uploaded PGCB workbook (+ optional Petrobangla PDF) by shelling out
 * to the existing Python parsers.
 *
 * This only works where Python and the scripts live — i.e. the operator's own
 * machine running `next dev`. That is the whole point: the heavy, quirk-laden
 * parsing stays on hardware we control, and the deployed site never needs a
 * Python runtime. On Vercel this route refuses rather than half-working.
 *
 * Nothing is written to public/data. The payload comes back for review and is
 * only persisted if the operator presses Publish.
 */

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Serverless has no Python and no scripts directory. */
function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/**
 * `python` is a Microsoft Store stub on this machine and not on PATH, so the
 * real interpreter is looked up explicitly. ESB_PYTHON overrides.
 */
function resolvePython(): string | null {
  const candidates = [
    process.env.ESB_PYTHON,
    path.join(process.env.LOCALAPPDATA ?? '', 'Python', 'bin', 'python.exe'),
    'python3',
    'python',
  ].filter((c): c is string => Boolean(c));

  for (const c of candidates) {
    if (c === 'python3' || c === 'python') return c; // resolved via PATH
    if (existsSync(c)) return c;
  }
  return null;
}

const ISO_DATE_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (isServerless()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Parsing runs on your own machine, not on the deployed site — the Python parsers and their dependencies are not available here. Run `npm run dev` locally and use the admin panel from localhost.',
      },
      { status: 503 },
    );
  }

  const python = resolvePython();
  if (!python) {
    return NextResponse.json(
      { ok: false, error: 'No Python interpreter found. Set ESB_PYTHON to its full path.' },
      { status: 503 },
    );
  }

  let workdir: string | null = null;
  try {
    const form = await request.formData();
    const pgcb = form.get('pgcb');
    const pb = form.get('pb');
    const dateOverride = String(form.get('date') ?? '').trim();
    // Collect mode: the bridge downloads the day from PGCB and Petrobangla itself
    // rather than the operator hunting the two files down. Same parser either way,
    // so the review step below still sees exactly what an upload would produce.
    const collect = String(form.get('collect') ?? '') === '1';

    if (collect) {
      if (!ISO_DATE_RE.test(dateOverride)) {
        return NextResponse.json(
          { ok: false, error: 'Collecting from source needs the energy day (YYYY-MM-DD).' },
          { status: 400 },
        );
      }
      const { stdout } = await execFileAsync(
        python,
        [path.join(process.cwd(), 'scripts', 'ingest_bridge.py'), '--fetch', '--date', dateOverride],
        {
          cwd: process.cwd(),
          env: { ...process.env, PYTHONUTF8: '1' },
          maxBuffer: 64 * 1024 * 1024,
          // Downloads add a network leg on top of parsing; the ERP scan can walk
          // a stretch of ids when the map is behind.
          timeout: 480_000,
        },
      );
      const at = stdout.indexOf('{');
      if (at === -1) {
        return NextResponse.json(
          { ok: false, error: `Collector produced no JSON: ${stdout.slice(0, 400)}` },
          { status: 500 },
        );
      }
      return NextResponse.json(JSON.parse(stdout.slice(at)));
    }

    if (!(pgcb instanceof File)) {
      return NextResponse.json({ ok: false, error: 'A PGCB Excel file is required.' }, { status: 400 });
    }
    if (pgcb.size > MAX_UPLOAD_BYTES || (pb instanceof File && pb.size > MAX_UPLOAD_BYTES)) {
      return NextResponse.json({ ok: false, error: 'Files must be under 25 MB.' }, { status: 400 });
    }

    workdir = await mkdtemp(path.join(tmpdir(), 'esb-upload-'));

    // Keep the original extension so pandas picks the right Excel engine — but
    // only from a fixed allowlist. Left unconstrained, `path.extname` echoed
    // whatever the uploader named the file (`.exe`, `.py`, an NTFS `:stream`
    // suffix) into the temp filename. It is never executed — only passed as an
    // argv to the Python parser — but a workbook has exactly these extensions,
    // so anything else is a malformed upload and is rejected outright.
    const ALLOWED_PGCB_EXT = new Set(['.xlsx', '.xls', '.xlsm']);
    const rawExt = path.extname(pgcb.name).toLowerCase();
    if (rawExt && !ALLOWED_PGCB_EXT.has(rawExt)) {
      return NextResponse.json(
        { ok: false, error: 'PGCB workbook must be .xlsx, .xls, or .xlsm.' },
        { status: 400 },
      );
    }
    const pgcbExt = ALLOWED_PGCB_EXT.has(rawExt) ? rawExt : '.xlsx';
    const pgcbPath = path.join(workdir, `pgcb${pgcbExt}`);
    await writeFile(pgcbPath, Buffer.from(await pgcb.arrayBuffer()));

    let pbPath: string | null = null;
    if (pb instanceof File && pb.size > 0) {
      pbPath = path.join(workdir, 'pb.pdf');
      await writeFile(pbPath, Buffer.from(await pb.arrayBuffer()));
    }

    const args = [
      path.join(process.cwd(), 'scripts', 'ingest_bridge.py'),
      '--pgcb',
      pgcbPath,
      // The temp file is renamed, so the date has to be derived from the name
      // the operator actually uploaded.
      '--pgcb-name',
      pgcb.name,
    ];
    if (pbPath) args.push('--pb', pbPath);
    if (dateOverride) args.push('--date', dateOverride);

    const { stdout } = await execFileAsync(python, args, {
      cwd: process.cwd(),
      // cp1252 consoles die on the arrows these scripts print.
      env: { ...process.env, PYTHONUTF8: '1' },
      maxBuffer: 64 * 1024 * 1024,
      timeout: 240_000,
    });

    // The bridge prints one JSON object; anything before it is parser chatter.
    const start = stdout.indexOf('{');
    if (start === -1) {
      return NextResponse.json(
        { ok: false, error: `Parser produced no JSON. Output: ${stdout.slice(0, 500)}` },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(stdout.slice(start));
    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `Parse failed: ${message}` }, { status: 500 });
  } finally {
    if (workdir) await rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}
