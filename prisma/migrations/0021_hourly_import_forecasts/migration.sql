-- PGCB's two cross-border import pages, added to the hourly capture.
--
-- `imported_power_india_bn` and `imported_power_nepal_bn` print, for every
-- hour, each interconnector's actual (প্রকৃত) beside NLDC's forecast
-- (পূর্বাভাস). The actuals are already held: they were compared column by
-- column against `view_generations_bn` over 102 hours on 2026-09-07 and
-- disagreed on none, so they reuse "bheramaraMw"/"tripuraMw"/"adaniMw"/
-- "nepalMw" and give a free cross-check of a figure the site prints.
--
-- The forecast appears nowhere else in this archive and needs the four columns
-- below. Nullable like every other figure column, because an interconnector
-- NLDC is not forecasting this hour must read absent — 0 MW is a claim that the
-- line was expected up and carrying nothing, which is a different statement.
--
-- Depth measured 2026-09-07: India 2,036 pages back to 2015-04-17 (the same
-- depth as GENERATION); Nepal 325 pages back to 2024-11-14, which is when the
-- Bangladesh-Nepal trade began rather than a retention cliff.

ALTER TYPE "GridSeries" ADD VALUE IF NOT EXISTS 'INDIA_IMPORT';
ALTER TYPE "GridSeries" ADD VALUE IF NOT EXISTS 'NEPAL_IMPORT';

ALTER TABLE "GridHourlyObservation"
  ADD COLUMN IF NOT EXISTS "bheramaraForecastMw" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "tripuraForecastMw"   DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "adaniForecastMw"     DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "nepalForecastMw"     DECIMAL(12,3);
