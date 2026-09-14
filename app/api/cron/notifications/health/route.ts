import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/api/cron-auth';
import { getNotificationStatus } from '@/lib/notifications/status';

/**
 * Machine-readable health for the notification layer, for an uptime monitor.
 *
 * Under /api/cron on purpose: that prefix is outside the middleware matcher,
 * so a monitor's plain HTTP client is not refused by the bot user-agent guard,
 * and no new hole is cut in the matcher. The same CRON_SECRET bearer as the
 * crons. Responds 200 when ok or intentionally disabled, 503 otherwise, so a
 * monitor can alert on the status code alone.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const s = await getNotificationStatus();
  const healthy = s.status === 'ok' || s.status === 'disabled';
  return NextResponse.json(
    {
      status: s.status,
      reasons: s.reasons,
      configured: s.configured,
      paused: s.config.paused,
      features: {
        news: s.config.news,
        gridHourly: s.config.gridHourly,
        gridAlerts: s.config.gridAlerts,
        dailySummary: s.config.dailySummary,
        commands: s.config.commands,
      },
      heartbeat: s.heartbeat,
      queue: {
        ...s.queue.byStatus,
        oldestPendingAt: s.queue.oldestPendingAt,
        lastSentAt: s.queue.lastSentAt,
      },
    },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
