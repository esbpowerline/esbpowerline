-- DashboardStat retired: a parallel database of national figures (value
-- DEFAULT 0, an isManualOverride flag, verification as a free string) feeding
-- the admin Sector Snapshot. That card now renders getLatestHomeSnapshot() —
-- the same loaders and absence semantics as the public homepage. No code has
-- read or written this table since the 2026-09-01 tree; apply after deploying
-- that code. Rollback is the CREATE TABLE in git history plus the retired
-- seed rows — but the rows were hand-typed constants, not data.

-- DropTable
DROP TABLE "DashboardStat";
