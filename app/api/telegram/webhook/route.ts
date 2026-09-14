import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { readTelegramEnv } from '@/lib/notifications/config';
import { errorText, logNotification } from '@/lib/notifications/log';
import { handleTelegramUpdate } from '@/lib/notifications/telegram/commands';

/**
 * Telegram's webhook: bot commands.
 *
 * Order matters. The secret header is compared before the body is read, so an
 * unauthenticated request costs one hash. The comparison is constant-time over
 * fixed-length digests, so its timing reveals neither the secret nor its
 * length. An authenticated request is always answered 200, even when it
 * cannot be understood: a non-2xx makes Telegram retry the same update, and a
 * malformed one would then be retried forever.
 *
 * The middleware lets exactly this path and method past its bot user-agent
 * guard (TELEGRAM_WEBHOOK_PATH); nothing else is opened.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_BODY_BYTES = 64 * 1024;

function secretMatches(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const env = readTelegramEnv();
  // Not configured: indistinguishable from a route that does not exist.
  if (!env.botToken || !env.webhookSecret) return new NextResponse(null, { status: 404 });

  const given = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!secretMatches(given, env.webhookSecret)) {
    logNotification('telegram.unauthorized_command', { reason: 'webhook secret mismatch' }, 'warn');
    return new NextResponse(null, { status: 401 });
  }

  if (Number(request.headers.get('content-length') ?? '0') > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let update: unknown;
  try {
    update = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleTelegramUpdate(update, env);
  } catch (err) {
    logNotification('telegram.api_error', { stage: 'webhook', error: errorText(err) }, 'error');
  }
  return NextResponse.json({ ok: true });
}

export function GET() {
  return new NextResponse(null, { status: 405 });
}
