import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { publishRelease } from '@/lib/actions/data-releases';

/**
 * Publish a full day: the two parsed files plus the three aggregates they feed.
 *
 * Order matters. The day files are written to public/data first because the
 * aggregate builders read that directory — and leaving them there also keeps the
 * local archive current for the next ingest, and lets a future commit fold the
 * day into the static archive so it stops costing a database read.
 *
 * Then each artifact is published. The grid day goes first: if a later step
 * fails the site is at worst a day behind on gas, which it already renders, and
 * never the reverse.
 */

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

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

const ISO_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;

/** Pages that render grid or gas figures and are cached independently of the data tags. */
function revalidateGridPages(): void {
  for (const p of ['/grid-explorer', '/', '/power-grid']) {
    try {
      revalidatePath(p);
    } catch {
      // A path that does not exist in this build is not worth failing a publish over.
    }
  }
}

type Step = { artifact: string; ok: boolean; detail?: string };

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (isServerless()) {
    return NextResponse.json(
      { ok: false, error: 'Publishing rebuilds aggregates with Python and must run on your machine.' },
      { status: 503 },
    );
  }

  const steps: Step[] = [];

  try {
    const body = (await request.json()) as {
      date?: string;
      grid?: unknown;
      gasArchive?: unknown;
      sourceGrid?: string;
      sourceGas?: string;
    };

    const date = String(body.date ?? '');
    if (!ISO_RE.test(date)) {
      return NextResponse.json({ ok: false, error: `Invalid date: ${date}` }, { status: 400 });
    }
    if (!body.grid) {
      return NextResponse.json({ ok: false, error: 'Missing grid payload' }, { status: 400 });
    }

    const root = process.cwd();

    // 1 — grid day to disk + released.
    //
    // The half-hourly fuel curve is split out first. It is ~5.7KB a day and the
    // daily directory is traced wholesale into every function that imports the
    // server loader, so leaving it inline puts it in bundles that never read it
    // — the same reason the station detail lives outside. It is fetched over
    // HTTP by the chart instead. See scripts/split_energy_curve.py.
    const { energyCurveData, ...gridPayload } = body.grid as Record<string, unknown>;
    if (energyCurveData) {
      const curveDir = path.join(root, 'public', 'data', 'curves');
      await mkdir(curveDir, { recursive: true });
      await writeFile(
        path.join(curveDir, `${date}.json`),
        JSON.stringify({ date, ...(energyCurveData as object) }),
        'utf8',
      );
    }
    await writeFile(
      path.join(root, 'public', 'data', 'daily', `${date}.json`),
      JSON.stringify(gridPayload, null, 2),
      'utf8',
    );
    const grid = await publishRelease({
      feed: 'GRID_DAILY',
      key: date,
      payload: gridPayload,
      sourceName: body.sourceGrid,
      parserVersion: 'ingest_bridge/1',
    });
    steps.push({ artifact: 'GRID_DAILY', ok: grid.ok, detail: grid.ok ? undefined : grid.error });
    if (!grid.ok) return NextResponse.json({ ok: false, error: grid.error, steps }, { status: 500 });

    // Without gas there is nothing to aggregate — the three derived files are
    // built purely from the archive.
    if (!body.gasArchive) {
      return NextResponse.json({
        ok: true,
        date,
        steps,
        note: 'Grid day published. No gas PDF supplied, so the gas archive and aggregates were not touched.',
      });
    }

    // 2 — gas day to disk + released
    await writeFile(
      path.join(root, 'public', 'data', 'petrobangla', 'daily', `${date}.json`),
      JSON.stringify(body.gasArchive, null, 2),
      'utf8',
    );
    const gas = await publishRelease({
      feed: 'GAS_DAILY',
      key: date,
      payload: body.gasArchive,
      sourceName: body.sourceGas,
      parserVersion: 'parse_petrobangla_archive/2.0.0',
    });
    steps.push({ artifact: 'GAS_DAILY', ok: gas.ok, detail: gas.ok ? undefined : gas.error });
    if (!gas.ok) return NextResponse.json({ ok: false, error: gas.error, steps }, { status: 500 });

    // 3 — rebuild the aggregates from the archive directory
    const python = resolvePython();
    if (!python) {
      return NextResponse.json(
        { ok: false, error: 'No Python interpreter found; aggregates not rebuilt.', steps },
        { status: 503 },
      );
    }

    const { stdout } = await execFileAsync(
      python,
      [path.join(root, 'scripts', 'build_aggregates.py'), '--date', date],
      { cwd: root, env: { ...process.env, PYTHONUTF8: '1' }, maxBuffer: 64 * 1024 * 1024, timeout: 540_000 },
    );
    const summary = JSON.parse(stdout.slice(stdout.indexOf('{')));
    if (!summary.ok) {
      return NextResponse.json({ ok: false, error: summary.error, steps }, { status: 500 });
    }
    steps.push({ artifact: 'aggregates rebuilt', ok: true, detail: `${summary.indexDays} index days` });

    // 4 — publish the three rebuilt aggregates
    const aggregates: Array<{ feed: 'GAS_INDEX' | 'GAS_LIVE_WEEK' | 'GAS_TIMELINE'; file: string[] }> = [
      { feed: 'GAS_INDEX', file: ['petrobangla', '_index.json'] },
      { feed: 'GAS_LIVE_WEEK', file: ['petrobangla', '_live_week.json'] },
      { feed: 'GAS_TIMELINE', file: ['petrobangla', 'timeline-summary.json'] },
    ];

    for (const agg of aggregates) {
      const raw = await readFile(path.join(root, 'public', 'data', ...agg.file), 'utf8');
      const res = await publishRelease({
        feed: agg.feed,
        key: 'singleton',
        payload: JSON.parse(raw),
        sourceName: agg.file.join('/'),
        parserVersion: 'build_aggregates/1',
      });
      steps.push({ artifact: agg.feed, ok: res.ok, detail: res.ok ? undefined : res.error });
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: `${agg.feed}: ${res.error}`, steps }, { status: 500 });
      }
    }

    // Expiring the release tags refreshes the data, but the pages that render it
    // are ISR-cached (grid-explorer holds for 300s). Without this a publish would
    // not be visible for minutes — the opposite of "updates like an article".
    revalidateGridPages();

    return NextResponse.json({ ok: true, date, steps, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `Publish failed: ${message}`, steps }, { status: 500 });
  }
}
