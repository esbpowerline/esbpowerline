import { NextResponse } from 'next/server';
import { runIngestionPipeline } from '@/lib/cron/energy-ingest';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[API Cron] Triggering energy report ingestion pipeline...');
    const result = await runIngestionPipeline();
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Ingestion pipeline produced no updates or is already running',
          result,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({
      ok: true,
      message: 'Ingestion pipeline executed successfully',
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API Cron] Ingestion failed:', error);
    return NextResponse.json({
      ok: false,
      error: message,
    }, { status: 500 });
  }
}