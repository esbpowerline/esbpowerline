-- Additive only: nothing reads or writes this table until writeRelease is
-- switched over, so applying this migration is a no-op for the running site
-- and rolling back is DROP TABLE / DROP TYPE.

-- CreateEnum
CREATE TYPE "RevisionKind" AS ENUM ('PUBLISH', 'CORRECT', 'REVOKE', 'RESTORE');

-- CreateTable
CREATE TABLE "DataReleaseRevision" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "previousChecksum" TEXT,
    "reason" TEXT NOT NULL,
    "kind" "RevisionKind" NOT NULL,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "DataReleaseRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataReleaseRevision_releaseId_revision_key" ON "DataReleaseRevision"("releaseId", "revision");

-- CreateIndex
CREATE INDEX "DataReleaseRevision_releaseId_publishedAt_idx" ON "DataReleaseRevision"("releaseId", "publishedAt");

-- AddForeignKey
ALTER TABLE "DataReleaseRevision" ADD CONSTRAINT "DataReleaseRevision_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "DataRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
