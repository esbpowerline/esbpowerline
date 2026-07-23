import 'server-only';

import prisma from '@/lib/prisma';

/**
 * Per-user throttle for the grid export endpoint. Exports are the most expensive
 * thing a member can trigger (disk reads + xlsx/pdf render), so a burst cap keeps
 * a spammer from burning serverless compute, and a daily cap bounds total cost.
 *
 * Backed by the MemberDownload log we already write on every successful export
 * (fileUrl = the export route) — no extra infra, and it reflects real completed
 * work rather than mere attempts. The check runs BEFORE any file reading so a
 * blocked request costs almost nothing.
 */
export const GRID_EXPORT_LIMITS = { perMinute: 6, perDay: 40 } as const;

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const EXPORT_FILE_URL = '/api/members/grid-export';

export type GridExportRateLimit = {
  allowed: boolean;
  retryAfterSeconds: number;
  scope: 'minute' | 'day' | null;
  remainingToday: number;
};

export async function checkGridExportRateLimit(userId: string): Promise<GridExportRateLimit> {
  const now = Date.now();
  const minuteAgo = new Date(now - MINUTE_MS);
  const dayAgo = new Date(now - DAY_MS);
  const base = { userId, fileUrl: EXPORT_FILE_URL };

  const [minuteCount, dayCount] = await Promise.all([
    prisma.memberDownload.count({ where: { ...base, createdAt: { gte: minuteAgo } } }),
    prisma.memberDownload.count({ where: { ...base, createdAt: { gte: dayAgo } } }),
  ]);

  const remainingToday = Math.max(0, GRID_EXPORT_LIMITS.perDay - dayCount);

  if (dayCount >= GRID_EXPORT_LIMITS.perDay) {
    const oldest = await prisma.memberDownload.findFirst({
      where: { ...base, createdAt: { gte: dayAgo } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const resetAt = (oldest?.createdAt.getTime() ?? now) + DAY_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      scope: 'day',
      remainingToday: 0,
    };
  }

  if (minuteCount >= GRID_EXPORT_LIMITS.perMinute) {
    const oldest = await prisma.memberDownload.findFirst({
      where: { ...base, createdAt: { gte: minuteAgo } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const resetAt = (oldest?.createdAt.getTime() ?? now) + MINUTE_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      scope: 'minute',
      remainingToday,
    };
  }

  return { allowed: true, retryAfterSeconds: 0, scope: null, remainingToday };
}
