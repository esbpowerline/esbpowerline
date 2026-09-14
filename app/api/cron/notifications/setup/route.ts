import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/api/cron-auth';
import { logNotification } from '@/lib/notifications/log';
import { diagnoseSetup, registerWebhook, sendSetupTest } from '@/lib/notifications/setup';

/**
 * Assisted setup (docs/telegram-bot/SETUP.md). CRON_SECRET bearer, like the
 * other routes under /api/cron — outside the middleware matcher, so no new
 * hole is cut in it.
 *
 *   GET                      diagnose: bot, webhook, each destination's
 *                            permissions, and — before the webhook is set —
 *                            the chats and people the bot has seen
 *   POST {"action":"register"}  set this site's webhook and the command list
 *   POST {"action":"test","note":"…"}  send a test to the test destination
 *
 * Nothing here returns a secret. The webhook URL is fixed to this site.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function guard(request: Request): NextResponse | null {
  if (!process.env.CRON_SECRET?.trim()) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

const noStore = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json(await diagnoseSetup(), { headers: noStore });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  let body: { action?: unknown; note?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });
  }
  logNotification('config.changed', { by: 'assisted-setup', action: String(body.action) });
  if (body.action === 'register') return NextResponse.json(await registerWebhook(), { headers: noStore });
  if (body.action === 'test') {
    return NextResponse.json(await sendSetupTest(typeof body.note === 'string' ? body.note : ''), { headers: noStore });
  }
  return NextResponse.json({ error: 'Unknown action; use "register" or "test"' }, { status: 400 });
}
