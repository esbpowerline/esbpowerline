import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  article: { findMany: vi.fn().mockResolvedValue([]) },
  gridHourlyObservation: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
  gridForecastBoard: { findUnique: vi.fn().mockResolvedValue(null) },
  notificationDelivery: { findMany: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/prisma', () => ({ default: db, prisma: db }));
vi.mock('@/lib/seo', () => ({ SITE_URL: 'https://esbpowerline.com' }));

const cfg = vi.hoisted(() => ({ value: {} as Record<string, unknown>, update: vi.fn() }));
vi.mock('@/lib/notifications/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/notifications/config')>();
  return {
    ...actual,
    getRuntimeConfig: async () => ({ ...actual.DEFAULT_RUNTIME_CONFIG, ...cfg.value }),
    updateRuntimeConfig: cfg.update,
  };
});

const snap = vi.hoisted(() => ({ newest: vi.fn() }));
vi.mock('@/lib/notifications/grid/snapshot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/notifications/grid/snapshot')>()),
  readNewestHour: snap.newest,
}));
vi.mock('@/lib/notifications/status', () => ({ getNotificationStatus: vi.fn() }));
vi.mock('@/lib/notifications/events', () => ({ emitEvent: vi.fn() }));
vi.mock('@/lib/notifications/queue', () => ({ requeueDelivery: vi.fn() }));

import { handleCommand, isAdmin, parseCommand } from '@/lib/notifications/telegram/commands';
import { parseAdminIds, type TelegramEnv } from '@/lib/notifications/config';

const env: TelegramEnv = {
  enabled: true,
  dryRun: false,
  botToken: 'x',
  channelId: '@esbpowerline',
  testChatId: null,
  adminUserIds: new Set(['1001']),
  webhookSecret: null,
  processingAllowed: true,
};

const privateMsg = (userId: string, text: string) => ({ chatId: userId, chatType: 'private', userId, text });

beforeEach(() => {
  vi.clearAllMocks();
  cfg.value = {};
  cfg.update.mockResolvedValue({ ok: true, config: {} });
});

describe('parsing', () => {
  it('reads the command, a bot-name suffix and arguments', () => {
    expect(parseCommand('/grid')).toEqual({ name: 'grid', args: [] });
    expect(parseCommand('/RETRY@ESBPowerLineBot abc 12')).toEqual({ name: 'retry', args: ['abc', '12'] });
    expect(parseCommand('hello')).toBeNull();
  });
});

describe('administrator identity', () => {
  it('accepts numeric ids only — usernames grant nothing', () => {
    expect([...parseAdminIds('1001, @hamim 2002 abc 3003x')]).toEqual(['1001', '2002']);
  });

  it('matches the immutable user id', () => {
    expect(isAdmin(env, '1001')).toBe(true);
    expect(isAdmin(env, '9999')).toBe(false);
    expect(isAdmin(env, null)).toBe(false);
  });
});

describe('handling', () => {
  it('stays silent in groups', async () => {
    expect(await handleCommand({ chatId: '-5', chatType: 'group', userId: '1001', text: '/help' }, env)).toBeNull();
  });

  it('a non-admin’s admin command is answered like an unknown one, logged, and does nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reply = await handleCommand(privateMsg('9999', '/pause'), env);
    expect(reply?.html).toMatch(/Unknown command/);
    expect(cfg.update).not.toHaveBeenCalled();
    expect(warn.mock.calls.some(([line]) => String(line).includes('telegram.unauthorized_command'))).toBe(true);
    warn.mockRestore();
  });

  it('an admin can pause', async () => {
    const reply = await handleCommand(privateMsg('1001', '/pause'), env);
    expect(cfg.update).toHaveBeenCalledWith({ paused: true });
    expect(reply?.html).toMatch(/^Paused/);
  });

  it('shows the administration section to admins only', async () => {
    expect((await handleCommand(privateMsg('1001', '/help'), env))?.html).toContain('Administration');
    expect((await handleCommand(privateMsg('2222', '/help'), env))?.html).not.toContain('Administration');
  });

  it('with commands switched off, the public ones say so and /resume still works', async () => {
    cfg.value = { commands: false };
    expect((await handleCommand(privateMsg('3333', '/grid'), env))?.html).toMatch(/temporarily unavailable/);
    await handleCommand(privateMsg('1001', '/resume'), env);
    expect(cfg.update).toHaveBeenCalledWith({ paused: false });
  });

  it('/grid names the hour and says when NLDC is behind', async () => {
    snap.newest.mockResolvedValue({
      observedAt: new Date(Date.now() - 12 * 3_600_000).toISOString(),
      demandMw: 14000,
      supplyMw: 13900,
      loadShedMw: 100,
      generationMw: 13900,
      generationState: 'consistent',
      componentSumMw: 13900,
      importsMw: 2400,
      previous: null,
    });
    const reply = await handleCommand(privateMsg('4444', '/grid'), env);
    expect(reply?.html).toContain('GRID UPDATE');
    expect(reply?.html).toMatch(/later than its usual/);
  });

  it('/grid with nothing stored says so instead of printing zeros', async () => {
    snap.newest.mockResolvedValue(null);
    expect((await handleCommand(privateMsg('5555', '/grid'), env))?.html).toBe('No NLDC hour is stored yet.');
  });
});
