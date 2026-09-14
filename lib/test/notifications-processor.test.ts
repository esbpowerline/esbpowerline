import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The processor against an in-memory queue that behaves like the real one:
 * claims are exclusive, outcomes are recorded only by the run holding the row,
 * and an expired lease turns SENDING into UNCERTAIN. Telegram is a fetch mock.
 * The idempotency cases the architecture promises are exercised end to end.
 */

const q = vi.hoisted(() => {
  type Row = {
    id: string;
    status: string;
    attemptCount: number;
    lockedBy: string | null;
    lockedAt: number | null;
    nextAttemptAt: number;
    destination: string;
    priority: number;
    lastErrorCode: string | null;
    retryDelay: number | null;
    externalMessageId: string | null;
    messageKind: string | null;
    event: { id: string; type: string; entityId: string | null; payload: unknown; createdAt: Date };
  };
  const rows = new Map<string, Row>();
  const state = { failSentWrites: false };
  return {
    rows,
    state,
    add(id: string, type: string, payload: unknown, extra: Partial<Row> = {}) {
      rows.set(id, {
        id,
        status: 'PENDING',
        attemptCount: 0,
        lockedBy: null,
        lockedAt: null,
        nextAttemptAt: 0,
        destination: 'test',
        priority: 0,
        lastErrorCode: null,
        retryDelay: null,
        externalMessageId: null,
        messageKind: null,
        event: { id: `ev-${id}`, type, entityId: (payload as { articleId?: string }).articleId ?? null, payload, createdAt: new Date() },
        ...extra,
      });
    },
    expireLeases() {
      for (const r of rows.values()) if (r.status === 'SENDING') r.lockedAt = 0;
    },
  };
});

vi.mock('@/lib/notifications/queue', () => {
  const own = (id: string, runId: string) => {
    const r = q.rows.get(id);
    return r && r.status === 'SENDING' && r.lockedBy === runId ? r : null;
  };
  const terminal = (status: string) => async (id: string, runId: string, f: { code: string }) => {
    const r = own(id, runId);
    if (r) Object.assign(r, { status, lockedBy: null, lastErrorCode: f.code });
  };
  return {
    MAX_ATTEMPTS: 6,
    LEASE_MS: 300_000,
    claimDueDeliveries: async (runId: string, limit: number) => {
      const due = [...q.rows.values()].filter((r) => r.status === 'PENDING' && r.nextAttemptAt <= Date.now()).slice(0, limit);
      for (const r of due) Object.assign(r, { status: 'SENDING', lockedBy: runId, lockedAt: Date.now(), attemptCount: r.attemptCount + 1 });
      return due.map((r) => ({ id: r.id, destination: r.destination, attemptCount: r.attemptCount, priority: r.priority, event: r.event }));
    },
    markSent: async (id: string, runId: string, s: { externalMessageId: string; messageKind: string }) => {
      if (q.state.failSentWrites) return false; // the database write fails; the row keeps its lease
      const r = own(id, runId);
      if (!r) return false;
      Object.assign(r, { status: 'SENT', lockedBy: null, externalMessageId: s.externalMessageId, messageKind: s.messageKind });
      return true;
    },
    markRetry: async (id: string, runId: string, attemptCount: number, f: { code: string; delayMs?: number }) => {
      const r = own(id, runId);
      if (!r) return;
      if (attemptCount >= 6) return Object.assign(r, { status: 'DEAD', lockedBy: null, lastErrorCode: f.code });
      Object.assign(r, { status: 'PENDING', lockedBy: null, lastErrorCode: f.code, retryDelay: f.delayMs ?? 60_000, nextAttemptAt: Date.now() + (f.delayMs ?? 60_000) });
    },
    markDead: terminal('DEAD'),
    markUncertain: terminal('UNCERTAIN'),
    markCancelled: terminal('CANCELLED'),
    markSkipped: terminal('SKIPPED'),
    recoverExpiredLeases: async () => {
      let n = 0;
      for (const r of q.rows.values()) {
        if (r.status === 'SENDING' && (r.lockedAt ?? 0) < Date.now() - 300_000) {
          Object.assign(r, { status: 'UNCERTAIN', lockedBy: null, lastErrorCode: 'lease_expired' });
          n += 1;
        }
      }
      return n;
    },
  };
});

const db = vi.hoisted(() => ({
  article: { findUnique: vi.fn() },
  notificationDelivery: {
    findFirst: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn(async ({ where, data }: { where: { id: string; lockedBy: string }; data: Record<string, unknown> }) => {
      const r = q.rows.get(where.id);
      if (!r || r.status !== 'SENDING' || r.lockedBy !== where.lockedBy) return { count: 0 };
      Object.assign(r, { status: data.status, lockedBy: null, attemptCount: r.attemptCount - 1 });
      return { count: 1 };
    }),
  },
}));
vi.mock('@/lib/prisma', () => ({ default: db, prisma: db }));
vi.mock('@/lib/seo', () => ({ SITE_URL: 'https://esbpowerline.com' }));

const env = vi.hoisted(() => ({
  current: {
    enabled: true,
    dryRun: false,
    botToken: '123456789:AAHfake-token-for-tests_abcdefghijklmnopqrs',
    channelId: '@esbpowerline',
    testChatId: '-1001',
    adminUserIds: new Set<string>(),
    webhookSecret: null,
    processingAllowed: true,
  },
  config: {} as Record<string, unknown>,
}));
vi.mock('@/lib/notifications/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/notifications/config')>();
  return {
    ...actual,
    readTelegramEnv: () => env.current,
    getRuntimeConfig: async () => ({ ...actual.DEFAULT_RUNTIME_CONFIG, gridHourly: true, ...env.config }),
  };
});

const health = vi.hoisted(() => ({ recordFatal: vi.fn(), clearHealthFor: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/notifications/health', () => ({
  getHealth: async () => ({ integration: null, destinations: {} }),
  integrationBlocked: () => false,
  recordFatal: health.recordFatal,
  clearHealthFor: health.clearHealthFor,
}));

const photo = vi.hoisted(() => ({ prepare: vi.fn() }));
vi.mock('@/lib/notifications/telegram/image', () => ({ prepareArticlePhoto: photo.prepare }));

import { processDueDeliveries } from '@/lib/notifications/processor';

const ok = (messageId: number) =>
  new Response(JSON.stringify({ ok: true, result: { message_id: messageId, chat: { id: -1001, type: 'channel' } } }), { status: 200 });
const fail = (code: number, description: string, retryAfter?: number) =>
  new Response(JSON.stringify({ ok: false, error_code: code, description, parameters: retryAfter ? { retry_after: retryAfter } : undefined }), { status: code });

const testPayload = { requestedBy: 'tester', note: '' };
const publishedArticle = {
  id: 'a1',
  slug: 'grid-story',
  title: 'Grid story',
  excerpt: 'What happened.',
  category: 'Power Generation',
  imageUrl: 'https://esbpowerline.com/x.webp',
  isBreaking: false,
  publishedAt: new Date(Date.now() - 60_000),
  status: 'PUBLISHED',
  editorTrash: false,
};

beforeEach(() => {
  q.rows.clear();
  q.state.failSentWrites = false;
  env.current = { ...env.current, enabled: true, dryRun: false, processingAllowed: true };
  env.config = {};
  vi.clearAllMocks();
});

describe('delivery outcomes', () => {
  it('records Telegram’s message id on success', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn().mockResolvedValue(ok(77));
    const s = await processDueDeliveries({ fetchImpl });
    expect(s.sent).toBe(1);
    expect(q.rows.get('d1')).toMatchObject({ status: 'SENT', externalMessageId: '77' });
  });

  it('429 waits exactly as long as Telegram asked', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    await processDueDeliveries({ fetchImpl: vi.fn().mockResolvedValue(fail(429, 'Too Many Requests', 7)) });
    expect(q.rows.get('d1')).toMatchObject({ status: 'PENDING', retryDelay: 7000, lastErrorCode: 'rate_limited' });
  });

  it('5xx is retried with backoff', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    await processDueDeliveries({ fetchImpl: vi.fn().mockResolvedValue(fail(502, 'Bad Gateway')) });
    expect(q.rows.get('d1')?.status).toBe('PENDING');
  });

  it('gives up after the attempt limit', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload, { attemptCount: 5 });
    await processDueDeliveries({ fetchImpl: vi.fn().mockResolvedValue(fail(500, 'Internal')) });
    expect(q.rows.get('d1')?.status).toBe('DEAD');
  });

  it('a timeout is UNCERTAIN and is never re-sent automatically', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn().mockRejectedValue(Object.assign(new Error('timeout'), { name: 'TimeoutError' }));
    await processDueDeliveries({ fetchImpl });
    await processDueDeliveries({ fetchImpl });
    expect(q.rows.get('d1')?.status).toBe('UNCERTAIN');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('an invalid token is fatal: recorded, and the rest of the run is handed back unspent', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    q.add('d2', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn().mockResolvedValue(fail(401, 'Unauthorized'));
    const s = await processDueDeliveries({ fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(q.rows.get('d1')?.status).toBe('DEAD');
    expect(q.rows.get('d2')).toMatchObject({ status: 'PENDING', attemptCount: 0 });
    expect(health.recordFatal).toHaveBeenCalledWith('fatal_integration', expect.objectContaining({ code: 'unauthorized' }));
    expect(s.dead).toBe(1);
  });

  it('a bot removed from the channel is surfaced as a destination failure', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    await processDueDeliveries({ fetchImpl: vi.fn().mockResolvedValue(fail(403, 'Forbidden: bot was kicked from the channel chat')) });
    expect(q.rows.get('d1')?.status).toBe('DEAD');
    expect(health.recordFatal).toHaveBeenCalledWith('fatal_destination', expect.objectContaining({ destination: 'test' }));
  });
});

describe('idempotency', () => {
  it('Telegram accepted it but our write failed: the post is not sent again', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn().mockResolvedValue(ok(77));
    q.state.failSentWrites = true;
    await processDueDeliveries({ fetchImpl });
    expect(q.rows.get('d1')?.status).toBe('SENDING'); // lease still held
    q.state.failSentWrites = false;
    q.expireLeases();
    await processDueDeliveries({ fetchImpl });
    expect(q.rows.get('d1')?.status).toBe('UNCERTAIN');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('two processors running at once send each delivery once', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn().mockResolvedValue(ok(77));
    await Promise.all([processDueDeliveries({ fetchImpl }), processDueDeliveries({ fetchImpl })]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('a delivery that has been sent is never claimed again', async () => {
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn().mockResolvedValue(ok(77));
    await processDueDeliveries({ fetchImpl });
    await processDueDeliveries({ fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('articles', () => {
  it('falls back to a text post when the image is unavailable', async () => {
    q.add('d1', 'ARTICLE_PUBLISHED', { articleId: 'a1' }, { destination: 'public' });
    db.article.findUnique.mockResolvedValue(publishedArticle);
    photo.prepare.mockResolvedValue({ ok: false, reason: 'image HTTP 404' });
    const fetchImpl = vi.fn().mockResolvedValue(ok(10));
    await processDueDeliveries({ fetchImpl });
    expect(String(fetchImpl.mock.calls[0][0])).toMatch(/\/sendMessage$/);
    expect(q.rows.get('d1')).toMatchObject({ status: 'SENT', messageKind: 'text' });
  });

  it('falls back to text in the same attempt when Telegram refuses the photo', async () => {
    q.add('d1', 'ARTICLE_PUBLISHED', { articleId: 'a1' }, { destination: 'public' });
    db.article.findUnique.mockResolvedValue(publishedArticle);
    photo.prepare.mockResolvedValue({ ok: true, bytes: new Uint8Array([1, 2, 3]), filename: 'x.jpg' });
    const fetchImpl = vi.fn().mockResolvedValueOnce(fail(400, 'Bad Request: IMAGE_PROCESS_FAILED')).mockResolvedValueOnce(ok(11));
    await processDueDeliveries({ fetchImpl });
    expect(String(fetchImpl.mock.calls[0][0])).toMatch(/\/sendPhoto$/);
    expect(String(fetchImpl.mock.calls[1][0])).toMatch(/\/sendMessage$/);
    expect(q.rows.get('d1')).toMatchObject({ status: 'SENT', messageKind: 'text', attemptCount: 1 });
  });

  it('an article unpublished before sending is cancelled, not posted', async () => {
    q.add('d1', 'ARTICLE_PUBLISHED', { articleId: 'a1' }, { destination: 'public' });
    db.article.findUnique.mockResolvedValue({ ...publishedArticle, status: 'DRAFT' });
    const fetchImpl = vi.fn();
    await processDueDeliveries({ fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(q.rows.get('d1')?.status).toBe('CANCELLED');
  });
});

describe('switches', () => {
  it('dry run renders and records, never sends', async () => {
    env.current = { ...env.current, dryRun: true };
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn();
    await processDueDeliveries({ fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(q.rows.get('d1')).toMatchObject({ status: 'SKIPPED', lastErrorCode: 'dry_run' });
  });

  it('paused claims nothing — queued posts wait', async () => {
    env.config = { paused: true };
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const s = await processDueDeliveries({ fetchImpl: vi.fn() });
    expect(s.blockedReason).toBe('paused');
    expect(q.rows.get('d1')?.status).toBe('PENDING');
  });

  it('TELEGRAM_ENABLED unset sends nothing', async () => {
    env.current = { ...env.current, enabled: false };
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const s = await processDueDeliveries({ fetchImpl: vi.fn() });
    expect(s.blockedReason).toMatch(/TELEGRAM_ENABLED/);
    expect(q.rows.get('d1')?.status).toBe('PENDING');
  });

  it('a grid hour that went stale in the queue is skipped, not posted late', async () => {
    const old = new Date(Date.now() - 10 * 3_600_000).toISOString();
    q.add('d1', 'GRID_HOURLY_SNAPSHOT', {
      observedAt: old,
      demandMw: 1,
      supplyMw: 1,
      loadShedMw: 0,
      generationMw: 1,
      generationState: 'consistent',
      componentSumMw: 1,
      importsMw: null,
      previous: null,
    }, { destination: 'public' });
    const fetchImpl = vi.fn();
    await processDueDeliveries({ fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(q.rows.get('d1')).toMatchObject({ status: 'SKIPPED', lastErrorCode: 'stale' });
  });

  it('a payload that no longer parses is dead, and does not stop the rest', async () => {
    env.config = { gridAlerts: true };
    q.add('d1', 'GRID_ALERT', { rule: 'NOPE' });
    q.add('d2', 'TEST_MESSAGE', testPayload);
    await processDueDeliveries({ fetchImpl: vi.fn().mockResolvedValue(ok(5)) });
    expect(q.rows.get('d1')).toMatchObject({ status: 'DEAD', lastErrorCode: 'invalid_payload' });
    expect(q.rows.get('d2')?.status).toBe('SENT');
  });
});

describe('the production-only rule', () => {
  it('a deployment that is not production never touches the shared queue, even in dry run', async () => {
    env.current = { ...env.current, processingAllowed: false, dryRun: true };
    q.add('d1', 'TEST_MESSAGE', testPayload);
    const fetchImpl = vi.fn();
    const s = await processDueDeliveries({ fetchImpl });
    expect(s.blockedReason).toMatch(/production/);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(q.rows.get('d1')?.status).toBe('PENDING');
  });
});
