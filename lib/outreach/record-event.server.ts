import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/admin-client';
import { checkRateLimit, clientIpFromForwarded } from '@/lib/rate-limit';
import {
  hashIp,
  recordBestEffort,
  truncateUserAgent,
  type OutreachEventRow,
} from '@/lib/outreach/tracking';

/**
 * Writes one row to `outreach_events` with the service role — the only writer
 * that table has (migration 0024 gives `authenticated` SELECT only and `anon`
 * nothing). Throws on failure; callers go through recordBestEffort, which
 * swallows it, so the pixel and the redirect never depend on the database.
 */
async function insertEvent(row: OutreachEventRow): Promise<void> {
  const client = createServiceRoleClient();
  if (!client) return; // not configured (local dev without the key): drop silently
  const { error } = await client.from('outreach_events').insert(row);
  if (error) throw new Error(error.message);
}

/**
 * Per-IP ceiling on *recorded* events, not on responses: a client over it
 * still gets its GIF or its redirect, the event just is not stored. In-process
 * buckets (lib/rate-limit.ts), so it is per serverless instance — enough to
 * stop one script filling the table, not a WAF. These routes are outside the
 * middleware matcher, so the Upstash limiter there never sees them.
 */
const EVENTS_PER_IP_PER_MINUTE = 60;

export async function recordOutreachEvent(
  request: Request,
  event: Pick<OutreachEventRow, 'message_key' | 'campaign_id' | 'type' | 'link'>,
): Promise<void> {
  const ip = clientIpFromForwarded(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-vercel-forwarded-for'),
  );
  if (!checkRateLimit(`outreach:${ip}`, EVENTS_PER_IP_PER_MINUTE, 60_000).allowed) return;

  await recordBestEffort(insertEvent, {
    ...event,
    ua: truncateUserAgent(request.headers.get('user-agent')),
    ip_hash: hashIp(ip),
  });
}
