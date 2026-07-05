import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { isCronAuthorized } from '@/lib/api/cron-auth';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (process.env.NODE_ENV === 'production' && !process.env.PETROBANGLA_SYNC_ENABLED) {
    return NextResponse.json({
      ok: true,
      message: 'Live week served from static cache in production',
    });
  }

  try {
    const script = path.join(process.cwd(), 'scripts', 'sync_petrobangla_live.py');
    const { stdout } = await execFileAsync('python', [script], { timeout: 120_000 });
    return NextResponse.json({ ok: true, message: stdout.trim() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Petrobangla refresh] Sync failed:', message);
    return NextResponse.json(
      {
        ok: false,
        error: 'Petrobangla sync failed',
        detail: message,
      },
      { status: 502 },
    );
  }
}