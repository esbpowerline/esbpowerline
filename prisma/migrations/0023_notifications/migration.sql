-- The outbound notification layer: events, deliveries, runtime settings.
--
-- ESB had no way to tell anyone anything. The only Telegram in the system was
-- the Pi's ops alert (`scripts/pi-notify.sh`), fire-and-forget, with no record
-- of what was sent. A public channel needs the opposite: every notification
-- durable, every delivery attempt recorded, and a duplicate post impossible by
-- construction rather than by care. docs/telegram-bot/ARCHITECTURE.md.
--
-- Additive only. No existing table is altered or referenced, so rolling this
-- back is dropping these three tables and three types; content and grid data
-- are untouched either way.
--
-- Every statement is safe to re-run. 0022 taught why: a table created by hand
-- ahead of its deploy made `prisma migrate deploy` re-run the migration, die on
-- the one non-idempotent statement, and leave a failed row that blocked every
-- later deploy until someone resolved it. Types are created inside guarded
-- blocks because CREATE TYPE has no IF NOT EXISTS.

DO $$
BEGIN
    CREATE TYPE "NotificationEventType" AS ENUM (
        'ARTICLE_PUBLISHED',
        'ARTICLE_UPDATED',
        'ARTICLE_WITHDRAWN',
        'GRID_HOURLY_SNAPSHOT',
        'GRID_ALERT',
        'DAILY_GRID_SUMMARY',
        'TEST_MESSAGE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UNCERTAIN is the state for an attempt whose outcome nobody can know: a
-- timeout after the request left, a worker that died holding the lease.
-- Telegram has no idempotency key, so such a row is parked for a person to
-- check against the channel, never re-sent automatically.
DO $$
BEGIN
    CREATE TYPE "NotificationDeliveryStatus" AS ENUM (
        'PENDING',
        'SENDING',
        'SENT',
        'UNCERTAIN',
        'DEAD',
        'CANCELLED',
        'SKIPPED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    "id" TEXT NOT NULL,
    "type" "NotificationEventType" NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- The idempotency key. An event emitted twice — a double-clicked Publish, two
-- overlapping cron runs, a retried request — lands on this index and is one row.
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationEvent_dedupeKey_key"
    ON "NotificationEvent"("dedupeKey");
CREATE INDEX IF NOT EXISTS "NotificationEvent_type_createdAt_idx"
    ON "NotificationEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationEvent_entityId_idx"
    ON "NotificationEvent"("entityId");

CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "destination" TEXT NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "lastErrorCode" TEXT,
    "externalChatId" TEXT,
    "externalMessageId" TEXT,
    "messageKind" TEXT,
    "contentHash" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- One delivery per event, channel and destination, however often it is queued.
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationDelivery_eventId_channel_destination_key"
    ON "NotificationDelivery"("eventId", "channel", "destination");
-- The claim query reads due rows by status and time.
CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_nextAttemptAt_idx"
    ON "NotificationDelivery"("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_sentAt_idx"
    ON "NotificationDelivery"("sentAt");

-- Guarded: ADD CONSTRAINT has no IF NOT EXISTS, and this is the statement that
-- killed 0022's re-run.
DO $$
BEGIN
    ALTER TABLE "NotificationDelivery"
        ADD CONSTRAINT "NotificationDelivery_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "NotificationEvent"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Runtime state: the dashboard's switches and thresholds, alert state machines,
-- the heartbeat, scheduler leases. Never a secret — secrets stay in the
-- environment. Kept apart from SiteSetting, whose rows are all handed to the
-- site settings form and whose save flushes every public page.
CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("key")
);
