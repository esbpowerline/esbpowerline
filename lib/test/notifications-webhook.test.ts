import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const handler = vi.hoisted(() => ({ handle: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/notifications/telegram/commands', () => ({ handleTelegramUpdate: handler.handle }));

import { POST } from '@/app/api/telegram/webhook/route';

const SECRET = 'a-webhook-secret-of-proper-length_123';

function req(body: string, secret?: string) {
  return new Request('https://esbpowerline.com/api/telegram/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'X-Telegram-Bot-Api-Secret-Token': secret } : {}) },
    body,
  });
}

beforeEach(() => {
  vi.stubEnv('TELEGRAM_BOT_TOKEN', '123456789:AAHfake-token-for-tests_abcdefghijklmnopqrs');
  vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', SECRET);
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllEnvs());

describe('the webhook', () => {
  it('looks like a missing route when not configured', async () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', '');
    expect((await POST(req('{}', SECRET))).status).toBe(404);
  });

  it('refuses a request without the secret, before reading it', async () => {
    const res = await POST(req('{"update_id":1}'));
    expect(res.status).toBe(401);
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('refuses a wrong secret', async () => {
    expect((await POST(req('{"update_id":1}', `${SECRET}x`))).status).toBe(401);
  });

  it('acknowledges an unreadable body so Telegram does not retry it forever', async () => {
    const res = await POST(req('not json', SECRET));
    expect(res.status).toBe(200);
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('hands a valid update to the command handler', async () => {
    const res = await POST(req('{"update_id":1,"message":{"message_id":1,"chat":{"id":5,"type":"private"},"text":"/help"}}', SECRET));
    expect(res.status).toBe(200);
    expect(handler.handle).toHaveBeenCalledOnce();
  });

  it('refuses an oversized body', async () => {
    expect((await POST(req(`{"x":"${'a'.repeat(70_000)}"}`, SECRET))).status).toBe(413);
  });
});
