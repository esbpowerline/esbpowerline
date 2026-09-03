-- profiles: a signed-in member may read their own row, nobody else's.
--
-- supabase/setup-profiles.sql has said this since it was written, but that
-- file is applied by hand and never was: the live policy on 2026-09-03 was
-- still "Profiles readable by authenticated users" USING (true), which let any
-- member list every staff account's name, role and avatar through the REST
-- API. Every read the application makes is `.eq('id', auth user id)` (see
-- lib/auth.ts), so nothing depends on the wider grant. Carried as a migration
-- so it is applied by `prisma migrate deploy` on the next release rather than
-- by someone remembering to run a script.
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles readable by owner" ON public.profiles;
CREATE POLICY "Profiles readable by owner"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
