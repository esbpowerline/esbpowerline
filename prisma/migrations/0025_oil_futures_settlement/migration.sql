-- Daily settlements of world oil futures, for the CMS fuel-price card.
--
-- One row per named contract per trading day, never the continuous
-- front-month symbol: that symbol jumps contracts on expiry day, and a
-- comparison across the jump is a fiction (Brent on 30 Oct 2026 read -2.8% on
-- the week on the continuous series; the contract itself moved +1.5%).
-- "front" records which contract the continuous series equalled that day, as
-- observed from the feed rather than computed from exchange expiry rules.
--
-- Additive: a new table, nothing existing is touched. Written by the Pi once a
-- day (scripts/ingest-oil-settlements.ts); read by the card's server action.

CREATE TABLE IF NOT EXISTS "OilFuturesSettlement" (
    "id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "tradeDate" DATE NOT NULL,
    "settle" DECIMAL(12,4) NOT NULL,
    "front" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'yahoo-chart',

    CONSTRAINT "OilFuturesSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OilFuturesSettlement_contract_tradeDate_source_key"
    ON "OilFuturesSettlement"("contract", "tradeDate", "source");

CREATE INDEX IF NOT EXISTS "OilFuturesSettlement_series_tradeDate_idx"
    ON "OilFuturesSettlement"("series", "tradeDate");
