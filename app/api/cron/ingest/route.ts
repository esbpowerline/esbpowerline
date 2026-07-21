import { NextResponse } from 'next/server';
import { runIngestionPipeline } from '@/lib/cron/energy-ingest';
import { isCronAuthorized } from '@/lib/api/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[API Cron] Triggering energy report ingestion pipeline...');
    
    // Guard against running Python ingestion on Vercel
    return NextResponse.json({
      ok: false,
      error: 'Grid ingestion disabled on serverless due to compute limits. Run the ingestion daemon locally (e.g. on the Pi) instead.'
    }, { status: 503 });

    // The below is unreachable but kept to avoid typescript complaints or if we run it in a container
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