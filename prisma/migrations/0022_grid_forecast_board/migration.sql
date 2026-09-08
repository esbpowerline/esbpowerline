-- PGCB's daily forecast board, given a table of its own.
--
-- `/w/forecasts/show_forecasts_bn` is a 4 KB page carrying four figures: the
-- demand forecast for today's day peak and evening peak, and yesterday's
-- ACTUAL generation at both. Two homepage tiles have read it live since the
-- board replaced Daily Generation and Energy Unserved in the snapshot.
--
-- It is replaced every morning. The forecast PGCB published for a day stops
-- being served the moment the next board is posted, and nothing else in
-- Bangladesh keeps it — so reading it live and storing nothing meant the site
-- was discarding an unrecoverable figure every twenty-four hours. Same failure
-- as the hourly demand series, same fix.
--
-- Two days, one row. The forecast belongs to "boardDate"; the actual peaks
-- beside it belong to the day before, so "previousDate" is stored rather than
-- computed at read time — a board posted late would otherwise be reported
-- against the wrong day. Both dates come from the document's own header, never
-- from the clock (doctrine rule 5).
--
-- Every figure column is nullable: a cell the board left blank is absent, and
-- absent is never zero.

CREATE TABLE IF NOT EXISTS "GridForecastBoard" (
    "id" TEXT NOT NULL,
    "boardDate" DATE NOT NULL,
    "previousDate" DATE NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "forecastDayPeakMw" DECIMAL(12,3),
    "forecastEveningPeakMw" DECIMAL(12,3),
    "previousDayPeakMw" DECIMAL(12,3),
    "previousEveningPeakMw" DECIMAL(12,3),
    "parserVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridForecastBoard_pkey" PRIMARY KEY ("id")
);

-- One board per day: re-reading the same page updates the row instead of
-- filing a second copy, so capturing a daily page hourly is a no-op after the
-- first tick that sees it.
CREATE UNIQUE INDEX IF NOT EXISTS "GridForecastBoard_boardDate_key"
    ON "GridForecastBoard"("boardDate");
CREATE INDEX IF NOT EXISTS "GridForecastBoard_previousDate_idx"
    ON "GridForecastBoard"("previousDate");
CREATE INDEX IF NOT EXISTS "GridForecastBoard_sourceDocumentId_idx"
    ON "GridForecastBoard"("sourceDocumentId");

ALTER TABLE "GridForecastBoard"
    ADD CONSTRAINT "GridForecastBoard_sourceDocumentId_fkey"
    FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
