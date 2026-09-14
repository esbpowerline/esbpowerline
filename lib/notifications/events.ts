import 'server-only';

/**
 * Creating an event and its deliveries — idempotently, always.
 *
 * The dedupe key is the whole of event idempotency: an event emitted twice
 * lands on the unique index and is one row. Deliveries are then ensured on
 * EVERY call, not only when the event was new, so a crash between the two
 * writes heals on the next emit of the same key (the reconciler and the grid
 * scheduler re-emit on every run). Both writes are `ON CONFLICT DO NOTHING`.
 */

import type { NotificationEventType, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { logNotification } from '@/lib/notifications/log';
import { parsePayload, PRIORITY, type Destination, type PayloadFor } from '@/lib/notifications/types';

export interface EmitInput<T extends NotificationEventType> {
  type: T;
  dedupeKey: string;
  entityId?: string | null;
  payload: PayloadFor<T>;
  destinations: readonly Destination[];
  priority?: number;
}

export interface EmitResult {
  eventId: string;
  /** False when the dedupe key already existed. */
  created: boolean;
  deliveriesCreated: number;
}

export async function emitEvent<T extends NotificationEventType>(input: EmitInput<T>): Promise<EmitResult> {
  const parsed = parsePayload(input.type, input.payload);
  if (!parsed.ok) throw new Error(parsed.reason);

  const inserted = await prisma.notificationEvent.createMany({
    data: [
      {
        type: input.type,
        dedupeKey: input.dedupeKey,
        entityId: input.entityId ?? null,
        payload: parsed.value as Prisma.InputJsonValue,
      },
    ],
    skipDuplicates: true,
  });
  const event = await prisma.notificationEvent.findUnique({
    where: { dedupeKey: input.dedupeKey },
    select: { id: true },
  });
  if (!event) throw new Error(`event ${input.dedupeKey} not found after insert`);

  const deliveries = input.destinations.length
    ? await prisma.notificationDelivery.createMany({
        data: input.destinations.map((destination) => ({
          eventId: event.id,
          channel: 'TELEGRAM' as const,
          destination,
          priority: input.priority ?? PRIORITY.routine,
        })),
        skipDuplicates: true,
      })
    : { count: 0 };

  const created = inserted.count === 1;
  logNotification(created ? 'notification.event_created' : 'notification.event_exists', {
    eventId: event.id,
    type: input.type,
    dedupeKey: input.dedupeKey,
    entityId: input.entityId ?? null,
    deliveriesCreated: deliveries.count,
  });
  return { eventId: event.id, created, deliveriesCreated: deliveries.count };
}
