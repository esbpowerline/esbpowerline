-- Preserve NLDC's hourly series, because NLDC does not.
--
-- PGCB's demand/supply/load-shed endpoint retains roughly 145 days (measured
-- 2026-09-05: page 69 of ~51 rows is the last with data). Its generation
-- endpoint goes back to 2015-04-17 but is served by the same application and
-- can be truncated the same way. Until now ESB fetched both every ten minutes
-- and threw the result away, so the only long-run hourly record of Bangladesh's
-- grid was being discarded by the one party archiving it.
--
-- Written by hand rather than by `prisma migrate diff`: the diff cannot
-- introspect this database because migration 0018 created a cross-schema
-- foreign key (public.profiles -> auth.users) and the datasource does not list
-- `auth` in its schemas. Widening that would change what Prisma manages, which
-- is a much larger decision than an additive table.

-- CreateEnum
CREATE TYPE "IngestStatus" AS ENUM ('FETCHED', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('UNVALIDATED', 'PASSED', 'WARNED', 'FAILED');

-- CreateEnum
CREATE TYPE "GridSeries" AS ENUM ('GENERATION', 'DEMAND_SUPPLY');

-- AlterTable: SourceDocument gains the evidence and the ingestion state.
-- Every column is nullable or defaulted, so the 327 existing rows are untouched
-- and keep their meaning.
ALTER TABLE "SourceDocument"
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "rawGzip" BYTEA,
  ADD COLUMN "rawByteLength" INTEGER,
  ADD COLUMN "ingestStatus" "IngestStatus" NOT NULL DEFAULT 'PARSED',
  ADD COLUMN "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'UNVALIDATED',
  ADD COLUMN "note" TEXT;

-- CreateIndex
CREATE INDEX "SourceDocument_sourceUrl_idx" ON "SourceDocument"("sourceUrl");

-- CreateTable
CREATE TABLE "GridHourlyObservation" (
    "id" TEXT NOT NULL,
    "series" "GridSeries" NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,

    -- Generation. Nullable throughout: a cell NLDC left blank is absent, and
    -- absent is never zero.
    "totalMw" DECIMAL(12,3),
    "gasMw" DECIMAL(12,3),
    "liquidMw" DECIMAL(12,3),
    "coalMw" DECIMAL(12,3),
    "hydroMw" DECIMAL(12,3),
    "solarMw" DECIMAL(12,3),
    "windMw" DECIMAL(12,3),
    "bheramaraMw" DECIMAL(12,3),
    "tripuraMw" DECIMAL(12,3),
    "adaniMw" DECIMAL(12,3),
    "nepalMw" DECIMAL(12,3),

    -- Demand / supply / load shed.
    "demandMw" DECIMAL(12,3),
    "supplyMw" DECIMAL(12,3),
    "loadShedMw" DECIMAL(12,3),

    "remark" TEXT,
    "basis" "ObservationBasis" NOT NULL DEFAULT 'REPORTED',
    "parserVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridHourlyObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: the idempotency key. A re-run of the backfill, or a poll
-- overlapping the previous one, must update the hour rather than duplicate it.
CREATE UNIQUE INDEX "GridHourlyObservation_series_observedAt_key"
  ON "GridHourlyObservation"("series", "observedAt");

-- CreateIndex
CREATE INDEX "GridHourlyObservation_observedAt_idx" ON "GridHourlyObservation"("observedAt");

-- CreateIndex
CREATE INDEX "GridHourlyObservation_sourceDocumentId_idx" ON "GridHourlyObservation"("sourceDocumentId");

-- AddForeignKey
ALTER TABLE "GridHourlyObservation"
  ADD CONSTRAINT "GridHourlyObservation_sourceDocumentId_fkey"
  FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
