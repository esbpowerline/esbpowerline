import { NextRequest, NextResponse } from 'next/server';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { isIsoDate } from '@/lib/data/feed-paths';
import { runPythonJson } from '@/lib/data/ingest-runner.server';

/**
 * Parse an uploaded PGCB daily report (+ optional Petrobangla PDF) by shelling
 * out to the existing Python parsers.
 *
 * The grid report may be the workbook PGCB files or a Word or PDF copy of the
 * same document; `daily_extractor.report_convert` renders all three into the
 * text the parser reads. The two that carry no sheet names come back with
 * warnings saying which sections were inferred and how many rows each yielded,
 * and those warnings surface in the review step.
 *
 * This only works where Python and the scripts live — i.e. the operator's own
 * machine running `next dev`. That is the whole point: the heavy, quirk-laden
 * parsing stays on hardware we control, and the deployed site never needs a
 * Python runtime. On Vercel this route refuses rather than half-working.
 *
 * Nothing is written to public/data. The payload comes back for review and is
 * only persisted if the operator presses Publish.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Serverless has no Python and no scripts directory. */
function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

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
      if (!isIsoDate(dateOverride)) {
        return NextResponse.json(
          { ok: false, error: 'Collecting from source needs the energy day (YYYY-MM-DD).' },
          { status: 400 },
        );
      }
      // Downloads add a network leg on top of parsing; the ERP scan can walk a
      // stretch of ids when the map is behind.
      const run = await runPythonJson(
        [path.join(process.cwd(), 'scripts', 'ingest_bridge.py'), '--fetch', '--date', dateOverride],
        { timeout: 480_000, label: 'Collector' },
      );
      if (!run.ok) {
        return NextResponse.json({ ok: false, error: run.error }, { status: run.status });
      }
      return NextResponse.json(run.data);
    }

    // Either file can arrive alone. A grid workbook without the gas PDF has
    // always been accepted; a gas PDF without the workbook is just the other
    // half of the same day — its printed 8am-8am window names the energy day,
    // so the parser needs nothing from the workbook to file it.
    const hasPgcb = pgcb instanceof File && pgcb.size > 0;
    const hasPb = pb instanceof File && pb.size > 0;
    if (!hasPgcb && !hasPb) {
      return NextResponse.json(
        { ok: false, error: 'Upload the PGCB daily report, the Petrobangla gas PDF, or both.' },
        { status: 400 },
      );
    }
    if ((hasPgcb && pgcb.size > MAX_UPLOAD_BYTES) || (hasPb && pb.size > MAX_UPLOAD_BYTES)) {
      return NextResponse.json({ ok: false, error: 'Files must be under 25 MB.' }, { status: 400 });
    }

    workdir = await mkdtemp(path.join(tmpdir(), 'esb-upload-'));
    const args = [path.join(process.cwd(), 'scripts', 'ingest_bridge.py')];

    if (hasPgcb) {
      // Keep the original extension: it is what the converter dispatches on, and
      // for a workbook it is also what lets pandas pick the right Excel engine.
      // Only from a fixed allowlist, though. Left unconstrained, `path.extname`
      // echoed whatever the uploader named the file (`.exe`, `.py`, an NTFS
      // `:stream` suffix) into the temp filename. It is never executed — only
      // passed as an argv to the Python parser — but a daily report has exactly
      // these extensions, so anything else is a malformed upload and is rejected
      // outright.
      const ALLOWED_PGCB_EXT = new Set(['.xlsx', '.xls', '.xlsm', '.docx', '.pdf']);
      const rawExt = path.extname(pgcb.name).toLowerCase();
      if (rawExt && !ALLOWED_PGCB_EXT.has(rawExt)) {
        return NextResponse.json(
          { ok: false, error: 'The daily report must be .xlsx, .xls, .xlsm, .docx, or .pdf.' },
          { status: 400 },
        );
      }
      // An unnamed upload is treated as a workbook, which is what it has always
      // been; the converter reads the extension off `--pgcb-name` anyway.
      const pgcbExt = ALLOWED_PGCB_EXT.has(rawExt) ? rawExt : '.xlsx';
      const pgcbPath = path.join(workdir, `pgcb${pgcbExt}`);
      await writeFile(pgcbPath, Buffer.from(await pgcb.arrayBuffer()));
      // The temp file is renamed, so the date has to be derived from the name
      // the operator actually uploaded.
      args.push('--pgcb', pgcbPath, '--pgcb-name', pgcb.name);
    }

    // The PDF is written to the temp dir as `pb.pdf`, so the name the operator
    // chose has to be passed alongside it — otherwise the day's gas provenance,
    // in both the archive and the grid day, records the temp name.
    if (hasPb) {
      const pbPath = path.join(workdir, 'pb.pdf');
      await writeFile(pbPath, Buffer.from(await pb.arrayBuffer()));
      args.push('--pb', pbPath, '--pb-name', pb.name);
    }
    if (dateOverride) args.push('--date', dateOverride);

    const run = await runPythonJson(args, { timeout: 240_000, label: 'Parser' });
    if (!run.ok) {
      return NextResponse.json({ ok: false, error: run.error }, { status: run.status });
    }
    return NextResponse.json(run.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `Parse failed: ${message}` }, { status: 500 });
  } finally {
    if (workdir) await rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}
