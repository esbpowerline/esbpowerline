-- One identity per email regardless of case.
--
-- "User".email is a plain-text UNIQUE column, so `admin@x` and `Admin@x` were
-- two rows to Postgres while Supabase Auth treats them as one user. The
-- application check in lib/actions/profile.ts is now case-insensitive too; this
-- index makes the rule hold for every write path, including ones that bypass
-- the action. Verified before adding: 6 users, 6 distinct lower(email), none
-- with an upper-case character (2026-09-03), so it cannot fail to build.
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_key" ON "User" (lower("email"));
