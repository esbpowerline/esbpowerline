-- Outreach sync: shared state for the ESB Banner Studio's email outreach, and
-- the open/click events the site's tracking endpoints record.
--
-- The Studio (a desktop app) sends outreach letters from whichever office PC
-- it runs on, and kept everything — campaigns, imported lists, designs, the
-- per-address send ledger — in that PC's IndexedDB. Two PCs could not see each
-- other's work, and nothing stopped both sending the same campaign at once, so
-- one address could be mailed twice. These six tables give the Studio one
-- shared copy, read and written through PostgREST with the signed-in staff
-- user's JWT; the contract both sides build against is
-- OUTREACH_SYNC_CONTRACT.md (kept with the Studio).
--
-- Who can touch what is decided here, by RLS, not by any application code:
--   * staff (the same six roles as supabase/setup-profiles.sql "Profiles
--     readable by staff") read and write campaigns, lists, designs, sends and
--     locks;
--   * outreach_events is written ONLY by the site's /api/o and /r endpoints
--     with the service role, and staff may only read it — there is no insert
--     policy for anyone, so a JWT cannot forge an open or a click;
--   * anon gets nothing at all. The lists hold contact rows, so this is the
--     boundary that keeps them private. Supabase's default privileges grant
--     every new public table to anon and authenticated; those grants are
--     revoked explicitly below rather than trusted to RLS alone.
--
-- Additive only. No existing table is altered or referenced, so rolling this
-- back is dropping these six tables and three functions.
--
-- Every statement is safe to re-run (see 0022/0023: a migration re-run by
-- `prisma migrate deploy` must not die on its first non-idempotent statement).
-- Tables use IF NOT EXISTS, functions CREATE OR REPLACE, policies are dropped
-- and recreated, and grants are idempotent by nature.

-- ---------------------------------------------------------------------------
-- Staff check. Security invoker, so it reads the caller's own JWT; stable, so
-- the planner evaluates it once per statement rather than once per row.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.outreach_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN (
    'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'COPY_EDITOR', 'PHOTO_EDITOR', 'REPORTER'
  );
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- The whole Campaign object as the Studio stores it (src/outreach/types.ts).
-- Last writer wins per campaign, by updated_at, which the Studio sets.
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
    id          text PRIMARY KEY,
    data        jsonb NOT NULL,
    updated_at  timestamptz NOT NULL DEFAULT now(),
    updated_by  uuid
);

-- Imported workbook rows, the same shape the Studio keeps under IndexedDB
-- `list:{id}`. Contact data: staff-only, never anon.
CREATE TABLE IF NOT EXISTS public.outreach_lists (
    id          text PRIMARY KEY,
    file_name   text,
    meta        jsonb,
    rows        jsonb NOT NULL,
    updated_at  timestamptz DEFAULT now(),
    updated_by  uuid
);

-- DesignLetter {name, html, images[{cid,dataUrl}], importedAt}, one per campaign.
CREATE TABLE IF NOT EXISTS public.outreach_designs (
    campaign_id text PRIMARY KEY,
    data        jsonb NOT NULL,
    updated_at  timestamptz DEFAULT now(),
    updated_by  uuid
);

-- One row per address per kind — a per-address fact, upserted by id and never
-- deleted by the Studio. id = `${campaignId}:${kind}:${email}` lower-case;
-- tests use `test:${t}:${email}`. Before a PC starts sending it merges these
-- into its local ledger, which is what makes a second send impossible.
CREATE TABLE IF NOT EXISTS public.outreach_sends (
    id          text PRIMARY KEY,
    campaign_id text,
    email       text NOT NULL,
    kind        text CHECK (kind IN ('campaign', 'followup', 'test')),
    status      text CHECK (status IN ('sent', 'failed', 'bounced', 'skipped', 'replied', 'opted_out')),
    detail      text,
    message_key text,
    message_id  text,
    at          timestamptz NOT NULL,
    pc          text,
    updated_at  timestamptz DEFAULT now()
);

-- Opens and clicks. message_key is not secret and not registered in advance;
-- an event whose key matches no outreach_sends.message_key is simply never
-- shown. `link` is the click target's host + path, never its query; `ua` is
-- truncated to 200; `ip_hash` is a keyed SHA-256 of the client IP — the IP
-- itself is never stored.
CREATE TABLE IF NOT EXISTS public.outreach_events (
    id          bigserial PRIMARY KEY,
    message_key text NOT NULL,
    campaign_id text,
    type        text CHECK (type IN ('open', 'click')),
    link        text,
    at          timestamptz DEFAULT now(),
    ua          text,
    ip_hash     text
);

-- Who is sending a campaign right now. Taken and released only through the
-- two functions below, so a takeover is one atomic statement.
CREATE TABLE IF NOT EXISTS public.outreach_locks (
    campaign_id  text PRIMARY KEY,
    pc           text NOT NULL,
    pc_label     text,
    user_id      uuid,
    heartbeat_at timestamptz NOT NULL,
    job          jsonb
);

CREATE INDEX IF NOT EXISTS outreach_sends_campaign_id_idx ON public.outreach_sends (campaign_id);
CREATE INDEX IF NOT EXISTS outreach_sends_message_key_idx ON public.outreach_sends (message_key);
CREATE INDEX IF NOT EXISTS outreach_events_message_key_idx ON public.outreach_events (message_key);
CREATE INDEX IF NOT EXISTS outreach_events_campaign_id_at_idx ON public.outreach_events (campaign_id, at);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_lists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_designs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sends     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_locks     ENABLE ROW LEVEL SECURITY;

-- Staff: full read/write on the five Studio-owned tables. One policy per
-- command, recreated each run so the definition here is always the live one.
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'outreach_campaigns', 'outreach_lists', 'outreach_designs', 'outreach_sends', 'outreach_locks'
    ] LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Outreach staff select" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Outreach staff insert" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Outreach staff update" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Outreach staff delete" ON public.%I', t);
        EXECUTE format(
            'CREATE POLICY "Outreach staff select" ON public.%I FOR SELECT TO authenticated '
            'USING (public.outreach_is_staff())', t);
        EXECUTE format(
            'CREATE POLICY "Outreach staff insert" ON public.%I FOR INSERT TO authenticated '
            'WITH CHECK (public.outreach_is_staff())', t);
        EXECUTE format(
            'CREATE POLICY "Outreach staff update" ON public.%I FOR UPDATE TO authenticated '
            'USING (public.outreach_is_staff()) WITH CHECK (public.outreach_is_staff())', t);
        EXECUTE format(
            'CREATE POLICY "Outreach staff delete" ON public.%I FOR DELETE TO authenticated '
            'USING (public.outreach_is_staff())', t);
    END LOOP;
END $$;

-- Events: staff may read. Deliberately no INSERT/UPDATE/DELETE policy for any
-- role — the service role bypasses RLS and is the only writer.
DROP POLICY IF EXISTS "Outreach staff select" ON public.outreach_events;
CREATE POLICY "Outreach staff select" ON public.outreach_events
    FOR SELECT TO authenticated
    USING (public.outreach_is_staff());

-- ---------------------------------------------------------------------------
-- Send lock
-- ---------------------------------------------------------------------------

-- Take (or keep) the lock on a campaign. The row is written only if nobody
-- holds it, this PC already holds it (a heartbeat), or the holder's heartbeat
-- is older than p_stale_seconds (a takeover from a PC that died mid-send).
-- INSERT ... ON CONFLICT DO UPDATE ... WHERE is a single atomic statement, so
-- two PCs racing for a free or stale lock cannot both win.
--
-- Returns the row as it stands afterwards. The caller compares its `pc` with
-- its own: equal means the lock is held, different means another PC has it
-- and the row says which. `job` survives a heartbeat and is cleared on a
-- takeover, since the previous holder's job is not this PC's.
--
-- Security invoker: it runs under the caller's RLS, and refuses non-staff
-- outright so the error is explicit rather than an empty result.
CREATE OR REPLACE FUNCTION public.outreach_acquire_lock(
    p_campaign text,
    p_pc text,
    p_label text,
    p_stale_seconds int
)
RETURNS public.outreach_locks
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    result public.outreach_locks;
BEGIN
    IF NOT public.outreach_is_staff() THEN
        RAISE EXCEPTION 'outreach_acquire_lock: staff only' USING ERRCODE = '42501';
    END IF;
    IF p_campaign IS NULL OR p_campaign = '' OR p_pc IS NULL OR p_pc = '' THEN
        RAISE EXCEPTION 'outreach_acquire_lock: campaign and pc are required' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.outreach_locks AS l (campaign_id, pc, pc_label, user_id, heartbeat_at, job)
    VALUES (p_campaign, p_pc, p_label, auth.uid(), now(), NULL)
    ON CONFLICT (campaign_id) DO UPDATE
        SET pc           = EXCLUDED.pc,
            pc_label     = EXCLUDED.pc_label,
            user_id      = EXCLUDED.user_id,
            heartbeat_at = EXCLUDED.heartbeat_at,
            job          = CASE WHEN l.pc = EXCLUDED.pc THEN l.job ELSE NULL END
        WHERE l.pc = EXCLUDED.pc
           OR l.heartbeat_at < now() - make_interval(secs => greatest(coalesce(p_stale_seconds, 0), 0))
    RETURNING l.* INTO result;

    IF result.campaign_id IS NULL THEN
        -- Held by another PC with a fresh heartbeat: report the holder.
        SELECT * INTO result FROM public.outreach_locks WHERE campaign_id = p_campaign;
    END IF;

    RETURN result;
END;
$$;

-- Release only this PC's own lock. Returns whether a row was deleted.
CREATE OR REPLACE FUNCTION public.outreach_release_lock(p_campaign text, p_pc text)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.outreach_is_staff() THEN
        RAISE EXCEPTION 'outreach_release_lock: staff only' USING ERRCODE = '42501';
    END IF;
    DELETE FROM public.outreach_locks WHERE campaign_id = p_campaign AND pc = p_pc;
    RETURN FOUND;
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants. PostgREST needs table privileges for `authenticated` before RLS is
-- even consulted; anon gets none. Everything is revoked first so Supabase's
-- default "grant all to anon, authenticated" on new public tables is undone,
-- then exactly what the policies above allow is granted back.
-- ---------------------------------------------------------------------------
REVOKE ALL ON TABLE
    public.outreach_campaigns, public.outreach_lists, public.outreach_designs,
    public.outreach_sends, public.outreach_events, public.outreach_locks
FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.outreach_events_id_seq FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.outreach_campaigns, public.outreach_lists, public.outreach_designs,
    public.outreach_sends, public.outreach_locks
TO authenticated;
GRANT SELECT ON TABLE public.outreach_events TO authenticated;

GRANT ALL ON TABLE
    public.outreach_campaigns, public.outreach_lists, public.outreach_designs,
    public.outreach_sends, public.outreach_events, public.outreach_locks
TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.outreach_events_id_seq TO service_role;

-- Functions are executable by PUBLIC by default; narrow that to signed-in
-- callers. outreach_is_staff must stay executable by authenticated, because
-- every policy above calls it as the requesting role.
REVOKE ALL ON FUNCTION public.outreach_is_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.outreach_acquire_lock(text, text, text, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.outreach_release_lock(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.outreach_is_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.outreach_acquire_lock(text, text, text, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.outreach_release_lock(text, text) TO authenticated, service_role;
