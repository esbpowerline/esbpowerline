import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';

/**
 * Run the complete daily ingest for one day.
 *
 * The collect-and-parse route produces a grid day and a gas day and nothing
 * else, so a day ingested through the panel was missing its fuel curve, its
 * Nepal interconnector, its per-station detail and — when the gas archive
 * moved — an up-to-date timeline. Each of those is a separate step, and each
 * has been forgotten at some point.
 *
 * `scripts/run_daily_ingest.py` owns the order and reports every step; this is
 * just the way to trigger it from the panel and see the same report.
 *
 * Local-only: the chain shells out to Python and writes public/data.
 */

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';
export const maxDuration = 800;

const ISO_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;

function resolvePython(): string | null {
  const candidates = [
    process.env.ESB_PYTHON,
    path.join(process.env.LOCALAPPDATA ?? '', 'Python', 'bin', 'python.exe'),
    'python3',
    'python',
  ].filter((c): c is string => Boolean(c));
  for (const c of candidates) {
    if (c === 'python3' || c === 'python') return c;
    if (existsSync(c)) return c;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'The ingest chain runs Python against the source workbooks, so it runs on your machine (npm run dev). Publish afterwards to put the result on the live site.',
      },
      { status: 503 },
    );
  }

  let body: { date?: string; skipExtractor?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected a JSON body' }, { status: 400 });
  }

  const date = String(body.date ?? '');
  if (!ISO_RE.test(date)) {
    return NextResponse.json({ ok: false, error: `Invalid date: ${date}` }, { status: 400 });
  }

  const python = resolvePython();
  if (!python) {
    return NextResponse.json({ ok: false, error: 'No Python interpreter found.' }, { status: 503 });
  }

  const args = [
    path.join(process.cwd(), 'scripts', 'run_daily_ingest.py'),
    '--date',
    date,
    '--json',
  ];
  if (body.skipExtractor) args.push('--skip-extractor');

  try {
    const { stdout } = await execFileAsync(python, args, {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUTF8: '1' },
      maxBuffer: 64 * 1024 * 1024,
      timeout: 780_000,
    });
    // The chain's steps print progress before the JSON; take the last line that
    // parses rather than assuming the whole of stdout is the payload.
    const start = stdout.lastIndexOf('{');
    return NextResponse.json(JSON.parse(stdout.slice(start)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A non-zero exit means one or more steps failed; the script still printed
    // its report, so surface that rather than only the exit code.
    const stdout = (error as { stdout?: string })?.stdout ?? '';
    const start = stdout.lastIndexOf('{');
    if (start >= 0) {
      try {
        return NextResponse.json(JSON.parse(stdout.slice(start)));
      } catch {
        /* fall through to the generic error */
      }
    }
    return NextResponse.json({ ok: false, error: `Ingest failed: ${message}` }, { status: 500 });
  }
}
