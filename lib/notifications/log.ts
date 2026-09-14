/**
 * Structured, redacted logging for the notification layer.
 *
 * One JSON object per line, so a Vercel log search for `"scope":"notifications"`
 * returns this layer and nothing else, and every line carries the identifiers
 * (eventId, deliveryId, articleId) needed to follow one post end to end.
 *
 * The bot token is part of every Bot API URL
 * (`https://api.telegram.org/bot<token>/sendMessage`), so an error that echoes
 * its request URL would print it. Every string that reaches a log line or the
 * database passes through `redact` first: known secret values are replaced
 * wherever they appear, and anything shaped like a bot token is replaced even
 * if it is not the configured one.
 */

const SECRET_ENV_NAMES = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'CRON_SECRET',
  'AUTH_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
] as const;

// "123456789:AA…" — Telegram's token shape, with or without the "bot" prefix.
const BOT_TOKEN_SHAPE = /\b(bot)?\d{6,12}:[A-Za-z0-9_-]{30,}\b/g;

export function redact(text: string): string {
  let out = text;
  for (const name of SECRET_ENV_NAMES) {
    const value = process.env[name];
    if (value && value.length >= 8) out = out.split(value).join('[redacted]');
  }
  return out.replace(BOT_TOKEN_SHAPE, '[redacted-token]');
}

export type NotificationLogEvent =
  | 'notification.event_created'
  | 'notification.event_exists'
  | 'notification.emit_failed'
  | 'delivery.queued'
  | 'delivery.attempt'
  | 'delivery.sent'
  | 'delivery.failed'
  | 'delivery.retry_scheduled'
  | 'delivery.dead'
  | 'delivery.uncertain'
  | 'delivery.cancelled'
  | 'delivery.skipped'
  | 'delivery.image_fallback'
  | 'telegram.api_error'
  | 'telegram.unauthorized_command'
  | 'telegram.command'
  | 'scheduler.run'
  | 'scheduler.skipped'
  | 'grid.hourly_skipped'
  | 'grid.alert_transition'
  | 'config.changed';

type Field = string | number | boolean | null | undefined;

export function logNotification(
  event: NotificationLogEvent,
  fields: Record<string, Field> = {},
  level: 'info' | 'warn' | 'error' = 'info',
): void {
  const line: Record<string, Field> = { ts: new Date().toISOString(), scope: 'notifications', event };
  for (const [k, v] of Object.entries(fields)) {
    line[k] = typeof v === 'string' ? redact(v) : v;
  }
  const text = JSON.stringify(line);
  if (level === 'error') console.error(text);
  else if (level === 'warn') console.warn(text);
  else console.log(text);
}

/** A message for storage or logs from anything thrown, redacted and bounded. */
export function errorText(err: unknown, max = 500): string {
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const text = redact(raw);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
