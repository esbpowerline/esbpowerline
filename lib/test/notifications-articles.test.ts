import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  article: { findMany: vi.fn() },
  notificationEvent: { findMany: vi.fn() },
  notificationDelivery: { findMany: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ default: db, prisma: db }));

const cfg = vi.hoisted(() => ({ value: {} as Record<string, unknown>, fail: false }));
vi.mock('@/lib/notifications/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/notifications/config')>();
  return {
    ...actual,
    getRuntimeConfig: async () => {
      if (cfg.fail) throw new Error('database unavailable');
      return { ...actual.DEFAULT_RUNTIME_CONFIG, ...cfg.value };
    },
  };
});

const events = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock('@/lib/notifications/events', () => ({ emitEvent: events.emit }));

import { announceArticles, announcementGate, queueArticleAnnouncements, reconcileArticles } from '@/lib/notifications/articles';
import { DEFAULT_RUNTIME_CONFIG } from '@/lib/notifications/config';
import { articleContentHash } from '@/lib/notifications/telegram/format';

const NOW = new Date('2026-09-14T12:00:00Z');
const SINCE = new Date('2026-09-14T00:00:00Z');
const opts = { now: NOW, maxAgeHours: 24, since: SINCE };

const live = {
  id: 'a1',
  slug: 'story',
  title: 'Power demand rises',
  excerpt: 'Standfirst.',
  category: 'Power Generation',
  imageUrl: null,
  isBreaking: false,
  publishedAt: new Date('2026-09-14T11:50:00Z'),
  status: 'PUBLISHED' as const,
  editorTrash: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  cfg.value = { newsSince: SINCE.toISOString() };
  cfg.fail = false;
  events.emit.mockResolvedValue({ eventId: 'e1', created: true, deliveriesCreated: 1 });
});

describe('the editorial gate', () => {
  it('passes a freshly published English article', () => {
    expect(announcementGate(live, opts)).toEqual({ ok: true });
  });

  it.each([
    ['DRAFT'],
    ['IN_REVIEW'],
    ['SCHEDULED'],
    ['ARCHIVED'],
    ['TRASH'],
  ] as const)('never announces a %s article', (status) => {
    expect(announcementGate({ ...live, status }, opts).ok).toBe(false);
  });

  it('never announces an article in the editor trash', () => {
    expect(announcementGate({ ...live, editorTrash: true }, opts).ok).toBe(false);
  });

  it('never announces a Bengali-script title, whose public URL 404s', () => {
    expect(announcementGate({ ...live, title: 'বিদ্যুতের চাহিদা' }, opts)).toMatchObject({ ok: false, reason: expect.stringMatching(/Bengali/) });
  });

  it('waits for a future publication time, then announces', () => {
    const future = { ...live, publishedAt: new Date('2026-09-14T15:00:00Z') };
    expect(announcementGate(future, opts)).toMatchObject({ ok: false, reason: 'dated in the future' });
    expect(announcementGate(future, { ...opts, now: new Date('2026-09-14T15:01:00Z') })).toEqual({ ok: true });
  });

  it('never announces a backdated or imported story', () => {
    expect(announcementGate({ ...live, publishedAt: new Date('2026-09-12T11:00:00Z') }, { ...opts, since: null }).ok).toBe(false);
  });

  it('never announces anything published before the feature was switched on', () => {
    expect(announcementGate({ ...live, publishedAt: new Date('2026-09-13T23:00:00Z') }, opts)).toMatchObject({ ok: false, reason: expect.stringMatching(/switched on/) });
  });
});

describe('announcing', () => {
  it('emits one keyed event per article', async () => {
    db.article.findMany.mockResolvedValue([live]);
    await queueArticleAnnouncements(['a1'], NOW);
    expect(events.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'ARTICLE_PUBLISHED', dedupeKey: 'article.published:a1', destinations: ['public'], priority: 0 }));
  });

  it('breaking articles jump the queue', async () => {
    db.article.findMany.mockResolvedValue([{ ...live, isBreaking: true }]);
    await queueArticleAnnouncements(['a1'], NOW);
    expect(events.emit).toHaveBeenCalledWith(expect.objectContaining({ priority: 10 }));
  });

  it('a draft published by a hook is filtered out, not announced', async () => {
    db.article.findMany.mockResolvedValue([{ ...live, status: 'DRAFT' }]);
    expect(await queueArticleAnnouncements(['a1'], NOW)).toBe(0);
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('does nothing while news is switched off', async () => {
    cfg.value = { ...cfg.value, news: false };
    expect(await queueArticleAnnouncements(['a1'], NOW)).toBe(0);
    expect(db.article.findMany).not.toHaveBeenCalled();
  });

  it('does nothing before the first scheduler run sets the floor', async () => {
    cfg.value = { newsSince: null };
    expect(await queueArticleAnnouncements(['a1'], NOW)).toBe(0);
  });

  it('never throws into a publish path, even with the database down', async () => {
    cfg.fail = true;
    await expect(announceArticles(['a1'])).resolves.toBeUndefined();
  });
});

describe('reconciliation', () => {
  const config = { ...DEFAULT_RUNTIME_CONFIG, newsSince: SINCE.toISOString() };

  it('announces a published article that no hook announced', async () => {
    db.article.findMany.mockResolvedValueOnce([{ id: 'a1' }]).mockResolvedValueOnce([live]);
    db.notificationEvent.findMany.mockResolvedValue([]);
    db.notificationDelivery.findMany.mockResolvedValue([]);
    const s = await reconcileArticles(config, NOW);
    expect(s.announced).toBe(1);
  });

  it('turns an announced article that was unpublished into a withdrawal', async () => {
    db.article.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ ...live, status: 'DRAFT' }]);
    db.notificationDelivery.findMany.mockResolvedValue([{ id: 'd1', contentHash: articleContentHash(live), event: { entityId: 'a1', payload: { articleId: 'a1', title: live.title } } }]);
    const s = await reconcileArticles(config, NOW);
    expect(s.withdrawn).toBe(1);
    expect(events.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'ARTICLE_WITHDRAWN', dedupeKey: 'article.withdrawn:a1', payload: { articleId: 'a1', title: live.title } }));
  });

  it('names a hard-deleted article from the snapshot taken when it was announced', async () => {
    db.article.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    db.notificationDelivery.findMany.mockResolvedValue([{ id: 'd1', contentHash: 'x'.repeat(32), event: { entityId: 'a1', payload: { articleId: 'a1', title: 'Old headline' } } }]);
    await reconcileArticles(config, NOW);
    expect(events.emit).toHaveBeenCalledWith(expect.objectContaining({ payload: { articleId: 'a1', title: 'Old headline' } }));
  });

  it('turns a changed headline into an edit, keyed by the new version', async () => {
    const edited = { ...live, title: 'Power demand rises to a record' };
    db.article.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([edited]);
    db.notificationDelivery.findMany.mockResolvedValue([{ id: 'd1', contentHash: articleContentHash(live), event: { entityId: 'a1', payload: { articleId: 'a1' } } }]);
    const s = await reconcileArticles(config, NOW);
    expect(s.updated).toBe(1);
    expect(events.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'ARTICLE_UPDATED', dedupeKey: `article.updated:a1:${articleContentHash(edited)}` }));
  });

  it('leaves an unchanged announcement alone', async () => {
    db.article.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([live]);
    db.notificationDelivery.findMany.mockResolvedValue([{ id: 'd1', contentHash: articleContentHash(live), event: { entityId: 'a1', payload: { articleId: 'a1' } } }]);
    expect(await reconcileArticles(config, NOW)).toEqual({ announced: 0, updated: 0, withdrawn: 0 });
    expect(events.emit).not.toHaveBeenCalled();
  });
});
