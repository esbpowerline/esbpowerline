import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The scheduled-publish cron and its announcement hook. The update is now
 * conditional on the row still being SCHEDULED, so a second overlapping run —
 * or an editor unscheduling the article in between — neither publishes it
 * again nor announces it.
 */

const db = vi.hoisted(() => ({
  article: { findMany: vi.fn(), updateMany: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ default: db, prisma: db }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock('@/lib/author-stats', () => ({ syncAuthorArticleCounts: vi.fn().mockResolvedValue(undefined) }));
const hook = vi.hoisted(() => ({ announce: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/notifications/articles', () => ({ announceArticles: hook.announce }));

import { publishDueScheduledArticles } from '@/lib/cron/publish-scheduled-articles';

const due = {
  id: 'a1',
  title: 'A scheduled report on the gas supply',
  slug: 'scheduled-report',
  excerpt: 'A standfirst long enough to satisfy the publish checks for this article.',
  content: '<p>' + 'Body text for the scheduled report. '.repeat(20) + '</p>',
  category: 'Power Generation',
  imageUrl: 'https://esbpowerline.com/image.webp',
  tags: ['gas'],
  publishedAt: new Date('2026-09-14T06:00:00Z'),
  authorId: 'u1',
};

beforeEach(() => vi.clearAllMocks());

describe('publishDueScheduledArticles', () => {
  it('publishes with a conditional update and announces what it published', async () => {
    db.article.findMany.mockResolvedValue([due]);
    db.article.updateMany.mockResolvedValue({ count: 1 });
    const res = await publishDueScheduledArticles(new Date('2026-09-14T06:05:00Z'));
    expect(db.article.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'a1', status: 'SCHEDULED' } }));
    if (res.skipped.length) throw new Error(`publish checks rejected the fixture: ${res.skipped[0].reason}`);
    expect(res.published).toEqual(['scheduled-report']);
    expect(hook.announce).toHaveBeenCalledWith(['a1']);
  });

  it('a row another run already published is neither counted nor announced', async () => {
    db.article.findMany.mockResolvedValue([due]);
    db.article.updateMany.mockResolvedValue({ count: 0 });
    const res = await publishDueScheduledArticles(new Date('2026-09-14T06:05:00Z'));
    expect(res.published).toEqual([]);
    expect(hook.announce).not.toHaveBeenCalled();
  });
});
