import { afterEach, describe, expect, it, vi } from 'vitest';
import { callTelegram, classifyApiError, classifyTransportError, sendMessage } from '@/lib/notifications/telegram/client';
import { redact } from '@/lib/notifications/log';

const TOKEN = '123456789:AAHfake-token-for-tests_abcdefghijklmnopqrs';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('classifying Telegram’s answers', () => {
  it('429 is retryable after exactly what Telegram asked for', () => {
    const c = classifyApiError(429, { error_code: 429, description: 'Too Many Requests: retry after 7', parameters: { retry_after: 7 } });
    expect(c).toMatchObject({ kind: 'retryable', code: 'rate_limited', retryAfterMs: 7000 });
  });

  it('5xx is retryable', () => {
    expect(classifyApiError(502, { error_code: 502, description: 'Bad Gateway' }).kind).toBe('retryable');
  });

  it('401 is an integration failure, never retried', () => {
    expect(classifyApiError(401, { error_code: 401, description: 'Unauthorized' }).kind).toBe('fatal_integration');
  });

  it('a bot removed from the channel is a destination failure', () => {
    expect(classifyApiError(403, { error_code: 403, description: 'Forbidden: bot was kicked from the channel chat' }).kind).toBe('fatal_destination');
  });

  it('an unknown chat is a destination failure', () => {
    expect(classifyApiError(400, { error_code: 400, description: 'Bad Request: chat not found' }).kind).toBe('fatal_destination');
  });

  it('a refused photo is bad media, so the caller falls back to text', () => {
    expect(classifyApiError(400, { error_code: 400, description: 'Bad Request: wrong file identifier/HTTP URL specified' }).kind).toBe('bad_media');
    expect(classifyApiError(400, { error_code: 400, description: 'Bad Request: IMAGE_PROCESS_FAILED' }).kind).toBe('bad_media');
  });

  it('malformed HTML is permanent', () => {
    expect(classifyApiError(400, { error_code: 400, description: "Bad Request: can't parse entities" }).kind).toBe('permanent');
  });

  it('an edit that changed nothing is not an error', () => {
    expect(classifyApiError(400, { error_code: 400, description: 'Bad Request: message is not modified' }).kind).toBe('not_modified');
  });
});

describe('classifying transport failures', () => {
  it('a timeout is ambiguous — the post may exist', () => {
    const err = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    expect(classifyTransportError(err).kind).toBe('ambiguous');
  });

  it('DNS failure is retryable — nothing was sent', () => {
    const err = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
    expect(classifyTransportError(err).kind).toBe('retryable');
  });

  it('a reset connection is ambiguous', () => {
    const err = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });
    expect(classifyTransportError(err).kind).toBe('ambiguous');
  });
});

describe('callTelegram', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns the result of a successful call', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, result: { message_id: 42, chat: { id: -100, type: 'channel' } } }));
    const res = await sendMessage(TOKEN, '@esb', '<b>x</b>', [{ text: 'Read', url: 'https://esbpowerline.com' }], { fetchImpl });
    expect(res).toEqual({ ok: true, result: { message_id: 42, chat: { id: -100, type: 'channel' } } });
    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ chat_id: '@esb', parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: 'Read', url: 'https://esbpowerline.com' }]] } });
  });

  it('an unreadable 502 is still a clean retry', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 }));
    expect(await callTelegram(TOKEN, 'sendMessage', {}, { fetchImpl })).toMatchObject({ ok: false, kind: 'retryable' });
  });

  it('never returns the token, even when an error echoes it', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(400, { ok: false, error_code: 400, description: `Bad Request: something about bot${TOKEN}` }));
    const res = await callTelegram(TOKEN, 'sendMessage', {}, { fetchImpl });
    expect(JSON.stringify(res)).not.toContain(TOKEN);
  });
});

describe('redaction', () => {
  it('removes anything shaped like a bot token', () => {
    expect(redact(`https://api.telegram.org/bot${TOKEN}/sendMessage`)).not.toContain('AAHfake');
  });

  it('removes configured secret values wherever they appear', () => {
    vi.stubEnv('CRON_SECRET', 'super-secret-cron-value');
    expect(redact('header was super-secret-cron-value')).toBe('header was [redacted]');
    vi.unstubAllEnvs();
  });
});
