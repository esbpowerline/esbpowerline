-- The ministry (MPEMR) is neither owner, operator, regulator nor utility.
-- Additive enum value; nothing references it until the backfill runs.
ALTER TYPE "OrganizationKind" ADD VALUE 'GOVERNMENT';
