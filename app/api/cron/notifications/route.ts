import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/api/cron-auth';
import { runNotificationCycle } from '@/lib/notifications/scheduler';

/**
 * The notification cycle, every five minutes (vercel.json): reconcile
 * articles, run the grid producers, deliver what is due, write the heartbeat.
 * The same bearer check as /api/cron/publish-scheduled.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const summary = await runNotificationCycle({ trigger: 'cron' });
  return NextResponse.json({ ok: summary.errors.length === 0, ...summary }, { headers: { 'Cache-Control': 'private, no-store' } });
}
