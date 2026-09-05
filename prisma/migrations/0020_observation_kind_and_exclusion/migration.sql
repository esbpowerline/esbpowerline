-- Classify each NLDC hour, and record why one is not eligible for aggregation.
--
-- Two facts made this necessary, both measured against the 103,331 observations
-- already held rather than assumed:
--
--   1. The :30 minute offset is NOT a classifier. 6,535 peak stamps are stamped
--      at :00 and 3,899 :30 rows carry no remark, so classifying on the offset
--      misreads about a tenth of the series. Averaging peak stamps in with
--      regular hours biases every historical mean +35 to +71 MW, in one
--      direction, growing with demand.
--
--   2. Two different source defects need two different answers. 370 rows print
--      a total that disagrees with their own components by more than 20% (the
--      worst, 2023-01-15 05:00, published 64526500 against components summing
--      to 6,464). 24 rows, all in 2015, print every component as a literal zero
--      beside a real total. In the first the total is unusable; in the second
--      the breakdown is. A single boolean could not have said which.
--
-- Source values are never altered by this migration. Both columns record only
-- how ESB reads what the source published.

-- CreateEnum
CREATE TYPE "ObservationKind" AS ENUM ('REGULAR', 'DAY_PEAK', 'EVENING_PEAK', 'UNCLASSIFIED');

-- CreateEnum
CREATE TYPE "AggregationExclusion" AS ENUM ('TOTAL_DISAGREES_WITH_COMPONENTS', 'BREAKDOWN_ALL_ZERO');

-- AlterTable
ALTER TABLE "GridHourlyObservation"
  ADD COLUMN "kind" "ObservationKind" NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN "excluded" "AggregationExclusion";

-- Backfill kind from the remark the ingest already preserved. Generation labels
-- peaks in Bangla, demand/supply in English; both vocabularies map here. A
-- remark that is present but unrecognised becomes UNCLASSIFIED rather than
-- silently counting as a regular hour.
UPDATE "GridHourlyObservation" SET "kind" = CASE
  WHEN COALESCE(TRIM("remark"), '') IN ('', '—', '-', 'n/a', 'N/A') THEN 'REGULAR'::"ObservationKind"
  WHEN TRIM("remark") IN ('ডে পিক', 'Day Peak')                     THEN 'DAY_PEAK'::"ObservationKind"
  WHEN TRIM("remark") IN ('সন্ধ্যা পিক', 'Evening Peak')             THEN 'EVENING_PEAK'::"ObservationKind"
  ELSE 'UNCLASSIFIED'::"ObservationKind"
END;

-- Backfill the exclusion reason. Order matters: an all-zero breakdown is tested
-- first, because such a row would otherwise also trip the disagreement rule and
-- be blamed on the wrong side.
UPDATE "GridHourlyObservation" g SET "excluded" = 'BREAKDOWN_ALL_ZERO'
WHERE g."series" = 'GENERATION' AND g."totalMw" > 0
  AND (CASE WHEN g."gasMw" IS NULL THEN 0 ELSE 1 END + CASE WHEN g."liquidMw" IS NULL THEN 0 ELSE 1 END
     + CASE WHEN g."coalMw" IS NULL THEN 0 ELSE 1 END + CASE WHEN g."hydroMw" IS NULL THEN 0 ELSE 1 END
     + CASE WHEN g."solarMw" IS NULL THEN 0 ELSE 1 END + CASE WHEN g."windMw" IS NULL THEN 0 ELSE 1 END
     + CASE WHEN g."bheramaraMw" IS NULL THEN 0 ELSE 1 END + CASE WHEN g."tripuraMw" IS NULL THEN 0 ELSE 1 END
     + CASE WHEN g."adaniMw" IS NULL THEN 0 ELSE 1 END + CASE WHEN g."nepalMw" IS NULL THEN 0 ELSE 1 END) > 0
  AND (COALESCE(g."gasMw",0)+COALESCE(g."liquidMw",0)+COALESCE(g."coalMw",0)+COALESCE(g."hydroMw",0)
     + COALESCE(g."solarMw",0)+COALESCE(g."windMw",0)+COALESCE(g."bheramaraMw",0)
     + COALESCE(g."tripuraMw",0)+COALESCE(g."adaniMw",0)+COALESCE(g."nepalMw",0)) = 0;

UPDATE "GridHourlyObservation" g SET "excluded" = 'TOTAL_DISAGREES_WITH_COMPONENTS'
WHERE g."series" = 'GENERATION' AND g."excluded" IS NULL
  AND (COALESCE(g."gasMw",0)+COALESCE(g."liquidMw",0)+COALESCE(g."coalMw",0)+COALESCE(g."hydroMw",0)
     + COALESCE(g."solarMw",0)+COALESCE(g."windMw",0)+COALESCE(g."bheramaraMw",0)
     + COALESCE(g."tripuraMw",0)+COALESCE(g."adaniMw",0)+COALESCE(g."nepalMw",0)) > 0
  AND ABS(g."totalMw" - (COALESCE(g."gasMw",0)+COALESCE(g."liquidMw",0)+COALESCE(g."coalMw",0)
     + COALESCE(g."hydroMw",0)+COALESCE(g."solarMw",0)+COALESCE(g."windMw",0)
     + COALESCE(g."bheramaraMw",0)+COALESCE(g."tripuraMw",0)+COALESCE(g."adaniMw",0)
     + COALESCE(g."nepalMw",0))) > 0.20 * GREATEST(g."totalMw", 1);

-- CreateIndex: the aggregation read path.
CREATE INDEX "GridHourlyObservation_series_kind_excluded_observedAt_idx"
  ON "GridHourlyObservation"("series", "kind", "excluded", "observedAt");
