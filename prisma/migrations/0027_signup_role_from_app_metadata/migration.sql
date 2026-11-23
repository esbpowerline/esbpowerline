-- esbpowerline migration 0027_signup_role_from_app_metadata (2026-11-23 security audit)
--
-- The live public.handle_new_user() trigger had drifted from supabase/setup-profiles.sql: it
-- filled profiles.role from NEW.raw_user_meta_data->>'role'. raw_user_meta_data is whatever the
-- person signing up sends (supabase.auth.signUp({ options: { data: { role } } })), public
-- sign-up is enabled on the project, and resolveRoleFromSupabaseUser trusted profiles.role. So
-- anyone could sign up as SUPER_ADMIN with the publishable key, confirm their own email, and be
-- treated as one by middleware and auth(). Checked on 2026-11-23: no profile row carried a role
-- that disagreed with its service-role app_metadata, so it had not been used.
--
-- Role now comes only from raw_app_meta_data, which only the service role can write
-- (lib/supabase/auth-user-sync.ts sets it on every staff/member create), defaulting to
-- SUBSCRIBER. ON CONFLICT does nothing: the service-role sync upserts the real row right after.
--
-- Idempotent (CREATE OR REPLACE), so it is safe if it was already applied by hand.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_app_meta_data->>'role', 'SUBSCRIBER')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- Belt and braces for the column-level revoke already in place on production.
REVOKE UPDATE (role) ON public.profiles FROM anon, authenticated;
