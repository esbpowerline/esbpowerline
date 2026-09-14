import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Event creation against an in-memory table with the real unique rules:
 * dedupeKey is unique on events, (eventId, channel, destination) on deliveries,
 * and createMany({ skipDuplicates }) behaves like ON CONFLICT DO NOTHING.
 */

const store = vi.hoisted(() => {
  const events = new Map<string, { id: string; dedupeKey: string; type: string }>();
  const deliveries = new Map<string, { eventId: string; destination: string }>();
  let seq = 0;
  return {
    events,
    deliveries,
    db: {
      notificationEvent: {
        createMany: vi.fn(async ({ data }: { data: Array<{ dedupeKey: string; type: string }> }) => {
          let count = 0;
          for (const d of data) {
            if (![...events.values()].some((e) => e.dedupeKey === d.dedupeKey)) {
              seq += 1;
              events.set(`e${seq}`, { id: `e${seq}`, dedupeKey: d.dedupeKey, type: d.type });
              count += 1;
            }
          }
          return { count };
        }),
        findUnique: vi.fn(async ({ where }: { where: { dedupeKey: string } }) => {
          const e = [...events.values()].find((x) => x.dedupeKey === where.dedupeKey);
          return e ? { id: e.id } : null;
        }),
      },
      notificationDelivery: {
        createMany: vi.fn(async ({ data }: { data: Array<{ eventId: string; channel: string; destination: string }> }) => {
          let count = 0;
          for (const d of data) {
            const key = `${d.eventId}|${d.channel}|${d.destination}`;
            if (!deliveries.has(key)) {
              deliveries.set(key, { eventId: d.eventId, destination: d.destination });
              count += 1;
            }
          }
          return { count };
        }),
      },
    },
  };
});
vi.mock('@/lib/prisma', () => ({ default: store.db, prisma: store.db }));

import { emitEvent } from '@/lib/notifications/events';
import { backoffMs } from '@/lib/notifications/queue';

const input = {
  type: 'ARTICLE_PUBLISHED' as const,
  dedupeKey: 'article.published:a1',
  entityId: 'a1',
  payload: { articleId: 'a1', title: 'A' },
  destinations: ['public'] as const,
};

beforeEach(() => {
  store.events.clear();
  store.deliveries.clear();
});

describe('emitEvent', () => {
  it('an event emitted twice is one event and one delivery', async () => {
    const first = await emitEvent(input);
    const second = await emitEvent(input);
    expect(first).toMatchObject({ created: true, deliveriesCreated: 1 });
    expect(second).toMatchObject({ created: false, deliveriesCreated: 0, eventId: first.eventId });
    expect(store.events.size).toBe(1);
    expect(store.deliveries.size).toBe(1);
  });

  it('a double-clicked Publish, emitted concurrently, is still one post', async () => {
    await Promise.all([emitEvent(input), emitEvent(input), emitEvent(input)]);
    expect(store.events.size).toBe(1);
    expect(store.deliveries.size).toBe(1);
  });

  it('heals a crash between the two writes: the next emit creates the missing delivery', async () => {
    await emitEvent(input);
    store.deliveries.clear(); // as if the process died after the event insert
    const again = await emitEvent(input);
    expect(again).toMatchObject({ created: false, deliveriesCreated: 1 });
  });

  it('refuses a payload of the wrong shape and writes nothing', async () => {
    await expect(emitEvent({ ...input, payload: { articleId: '' } })).rejects.toThrow(/invalid ARTICLE_PUBLISHED payload/);
    expect(store.events.size).toBe(0);
  });
});

describe('backoff', () => {
  it('doubles from one minute, with bounded jitter', () => {
    expect(backoffMs(1, () => 0.5)).toBe(60_000);
    expect(backoffMs(2, () => 0.5)).toBe(120_000);
    expect(backoffMs(5, () => 0.5)).toBe(16 * 60_000);
    expect(backoffMs(1, () => 0)).toBe(48_000);
    expect(backoffMs(1, () => 1)).toBe(72_000);
  });

  it('never waits more than an hour and a fifth', () => {
    expect(backoffMs(20, () => 1)).toBe(72 * 60_000);
  });
});
