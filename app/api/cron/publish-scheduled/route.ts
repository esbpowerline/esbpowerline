import { NextResponse } from 'next/server';
import { publishDueScheduledArticles } from '@/lib/cron/publish-scheduled-articles';
import { isCronAuthorized } from '@/lib/api/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await publishDueScheduledArticles();
  return NextResponse.json({
    ok: true,
    publishedCount: result.published.length,
    skippedCount: result.skipped.length,
    ...result,
  });
}