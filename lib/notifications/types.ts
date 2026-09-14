/**
 * The notification layer's domain vocabulary.
 *
 * Payloads are validated with zod when an event is written and again when it is
 * rendered. The grid payloads carry the figures themselves, captured at the
 * moment the event was decided, so a message says exactly what was evaluated —
 * re-reading the database at send time could pair an alert with a figure that
 * arrived afterwards. Article payloads carry only the id: an article is re-read
 * at send time precisely so that one unpublished in the meantime is not posted.
 */

import { z } from 'zod';
import type { NotificationEventType } from '@prisma/client';

/** Logical destinations, resolved to chat ids from the environment at send time. */
export const DESTINATIONS = ['public', 'test'] as const;
export type Destination = (typeof DESTINATIONS)[number];

const mw = z.number().finite().nullable();
const isoInstant = z.string().datetime();
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const articleRefPayload = z.object({
  articleId: z.string().min(1),
  /** The headline when the event was made — names a withdrawn article even after a hard delete. */
  title: z.string().min(1).max(500).optional(),
});

export const articleUpdatedPayload = articleRefPayload.extend({
  /** Hash of the fields the message shows; one event per distinct version. */
  contentHash: z.string().min(8),
});

export const articleWithdrawnPayload = z.object({
  articleId: z.string().min(1),
  title: z.string().min(1).max(500),
});

/** How NLDC's generation row stands against its own printed total. */
export const generationStates = ['consistent', 'inconsistent', 'unusable', 'absent'] as const;
export type GenerationState = (typeof generationStates)[number];

export const gridHourlyPayload = z.object({
  observedAt: isoInstant,
  demandMw: mw,
  supplyMw: mw,
  loadShedMw: mw,
  generationMw: mw,
  generationState: z.enum(generationStates),
  /** What the reported parts sum to, shown beside an inconsistent total. */
  componentSumMw: mw,
  /** Sum of the reported interconnectors — ESB's arithmetic, marked as such. */
  importsMw: mw,
  /** The hour exactly one hour earlier, when stored; never another hour. */
  previous: z
    .object({ observedAt: isoInstant, demandMw: mw, generationMw: mw })
    .nullable(),
});

export const alertRules = ['HIGH_LOAD_SHED', 'GENERATION_DROP'] as const;
export type AlertRule = (typeof alertRules)[number];
export const alertTransitions = ['ENTER', 'ESCALATE', 'RECOVER'] as const;
export type AlertTransition = (typeof alertTransitions)[number];

export const gridAlertPayload = z.object({
  rule: z.enum(alertRules),
  transition: z.enum(alertTransitions),
  observedAt: isoInstant,
  valueMw: z.number().finite(),
  thresholdMw: z.number().finite(),
  /** GENERATION_DROP: the total one hour earlier. */
  previousMw: mw.optional(),
});

export const dailySummaryPayload = z.object({
  energyDay: isoDay,
  eveningPeakDemandMw: mw,
  eveningPeakGenMw: mw,
  eveningPeakTime: z.string().nullable(),
  dayPeakGenMw: mw,
  maxGenMw: mw,
  energyGenGwh: mw,
  /** Printed by PGCB from 2025 only; null before, and printed as absent. */
  energyUnservedGwh: mw,
  fuelMix: z.array(z.object({ name: z.string().min(1), gwh: z.number().finite() })),
  sourceFile: z.string().nullable(),
});

export const testPayload = z.object({
  requestedBy: z.string().min(1).max(120),
  note: z.string().max(200),
});

export const PAYLOAD_SCHEMAS = {
  ARTICLE_PUBLISHED: articleRefPayload,
  ARTICLE_UPDATED: articleUpdatedPayload,
  ARTICLE_WITHDRAWN: articleWithdrawnPayload,
  GRID_HOURLY_SNAPSHOT: gridHourlyPayload,
  GRID_ALERT: gridAlertPayload,
  DAILY_GRID_SUMMARY: dailySummaryPayload,
  TEST_MESSAGE: testPayload,
} satisfies Record<NotificationEventType, z.ZodTypeAny>;

export type PayloadFor<T extends NotificationEventType> = z.infer<(typeof PAYLOAD_SCHEMAS)[T]>;

/** A payload of the right shape for its type, or a readable reason it is not. */
export function parsePayload<T extends NotificationEventType>(
  type: T,
  payload: unknown,
): { ok: true; value: PayloadFor<T> } | { ok: false; reason: string } {
  const result = PAYLOAD_SCHEMAS[type].safeParse(payload);
  if (result.success) return { ok: true, value: result.data as PayloadFor<T> };
  return { ok: false, reason: `invalid ${type} payload: ${result.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}` };
}

/** Delivery priority. Breaking news may jump routine posts; nothing else is ranked. */
export const PRIORITY = { routine: 0, breaking: 10 } as const;
