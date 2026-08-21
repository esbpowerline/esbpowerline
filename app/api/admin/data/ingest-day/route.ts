import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { isIsoDate } from '@/lib/data/feed-paths';
import { runPythonJson } from '@/lib/data/ingest-runner.server';

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

export const dynamic = 'force-dynamic';
export const maxDuration = 800;

type IngestReport = {
  ok: boolean;
  date: string;
  steps: Array<{ step: string; ok: boolean; seconds: number; detail?: string }>;
  artifacts: { grid: boolean; curve: boolean; plants: boolean; gas: boolean };
  note?: string | null;
};

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
  if (!isIsoDate(date)) {
    return NextResponse.json({ ok: false, error: `Invalid date: ${date}` }, { status: 400 });
  }

  const args = [
    path.join(process.cwd(), 'scripts', 'run_daily_ingest.py'),
    '--date',
    date,
    '--json',
  ];
  if (body.skipExtractor) args.push('--skip-extractor');

  // A non-zero exit means one or more steps failed; the script still prints its
  // report, and the runner returns it, so the panel shows which step went wrong
  // rather than only an exit code.
  const run = await runPythonJson<IngestReport>(args, { timeout: 780_000, label: 'Ingest' });
  if (!run.ok) {
    return NextResponse.json({ ok: false, error: run.error }, { status: run.status });
  }
  return NextResponse.json(run.data);
}
