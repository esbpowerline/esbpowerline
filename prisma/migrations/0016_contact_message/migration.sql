-- ContactMessage has been in schema.prisma since the contact form shipped, but
-- no migration ever created it: 0001–0015 never mention the table, and
-- production logs show every submission failing with P2021 "The table
-- public.ContactMessage does not exist" (2026-07-11 → 2026-08-27, audit
-- 2026-09-01 §5). `migrate-deploy-prod.mjs` applies this on the next build.
-- IF NOT EXISTS so a database that gained the table by `prisma db push`
-- (the early local build command) is not broken by re-creation.

CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
