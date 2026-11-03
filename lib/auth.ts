import { cache } from 'react';
import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { parseBearerHeader, verifyBearerUser } from '@/lib/supabase/bearer';
import prisma from '@/lib/prisma';
import type { Role } from '@/lib/constants';
import {
  EDITOR_EMAIL,
  EDITOR_NAME,
  LEGACY_EDITOR_EMAIL,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_NAME,
} from '@/lib/staff-accounts';
import { resolveRoleFromSupabaseUser } from '@/lib/supabase/resolve-role';

/** Canonical staff display names — overrides stale Supabase profile/metadata. */
function resolveStaffDisplayName(email: string, fallback: string): string {
  const normalized = email.toLowerCase();
  if (normalized === EDITOR_EMAIL || normalized === LEGACY_EDITOR_EMAIL) return EDITOR_NAME;
  if (normalized === MASTER_ADMIN_EMAIL) return MASTER_ADMIN_NAME;
  return fallback;
}

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    image?: string | null;
  };
} | null;

export async function resolveAppUser(
  supabase: SupabaseClient,
  supabaseUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  },
) {
  type ProfileRow = {
    role: string | null;
    status?: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };

  const profileResult = await supabase
    .from('profiles')
    .select('role, status, full_name, avatar_url')
    .eq('id', supabaseUser.id)
    .maybeSingle();

  let profile: ProfileRow | null = (profileResult.data as ProfileRow | null) ?? null;
  if (profileResult.error) {
    const roleOnly = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', supabaseUser.id)
      .maybeSingle();
    profile = (roleOnly.data as ProfileRow | null) ?? null;
  }

  const profileStatus =
    profile && 'status' in profile && typeof profile.status === 'string' ? profile.status : null;
  if (profileStatus === 'SUSPENDED' || profileStatus === 'PENDING') return null;

  const role = resolveRoleFromSupabaseUser(supabaseUser, profile?.role ?? null);

  const email = supabaseUser.email?.toLowerCase() ?? '';
  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        { supabaseUserId: supabaseUser.id },
      ],
    },
    select: {
      id: true,
      supabaseUserId: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      status: true,
    },
  });

  const resolvedRole = (role ?? (dbUser?.role as Role | undefined)) ?? null;
  if (!resolvedRole || dbUser?.status === 'SUSPENDED' || dbUser?.status === 'PENDING') return null;

  const metadataStatus = supabaseUser.user_metadata?.status;
  if (metadataStatus === 'SUSPENDED' || metadataStatus === 'PENDING') return null;

  if (dbUser && !dbUser.supabaseUserId) {
    await prisma.user
      .update({
        where: { id: dbUser.id },
        data: { supabaseUserId: supabaseUser.id },
      })
      .catch(() => undefined);
  }

  const metadataName =
    typeof supabaseUser.user_metadata?.name === 'string' ? supabaseUser.user_metadata.name : '';
  const rawName = dbUser?.name ?? profile?.full_name ?? metadataName ?? email;
  const loginEmail = dbUser?.email ?? email;

  return {
    id: dbUser?.id ?? supabaseUser.id,
    email: loginEmail,
    name: resolveStaffDisplayName(loginEmail, rawName),
    role: resolvedRole,
    image: profile?.avatar_url ?? dbUser?.avatar ?? null,
  };
}

/**
 * Server-side session from Supabase Auth (replaces NextAuth `auth()`).
 *
 * Memoised per request: layout, page and a server action in one render each
 * called this, and each call is a Supabase Auth round trip plus a profiles
 * read plus a Prisma lookup. `cache()` collapses them to one.
 *
 * A request with an `Authorization` header (the ESB Studio phone app, which signs in
 * against Supabase directly and holds no cookie for this site) is judged by that header
 * ALONE: the token is verified with Supabase and then goes through the same profile /
 * status / role checks as a cookie session. A malformed, expired or refused token is "not
 * signed in" — it never falls back to a cookie, so a stale header cannot borrow another
 * session. Requests without the header behave exactly as before.
 */
export const auth = cache(async function auth(): Promise<AuthSession> {
  const authorization = (await headers()).get('authorization');
  if (authorization !== null) {
    const token = parseBearerHeader(authorization);
    if (!token) return null;
    const verified = await verifyBearerUser(token);
    if (!verified) return null;
    const bearerUser = await resolveAppUser(verified.supabase, verified.user);
    return bearerUser ? { user: bearerUser } : null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appUser = await resolveAppUser(supabase, user);
  if (!appUser) return null;

  return { user: appUser };
});

export { roleHomePath as getRedirectForRole } from '@/lib/auth-routing';