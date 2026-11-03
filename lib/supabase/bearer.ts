import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@/utils/supabase/env';

/**
 * `Authorization: Bearer <Supabase access token>` for the ESB Studio phone app.
 *
 * The phone has no browser cookie jar for this site: it signs in against Supabase Auth directly and holds the staff
 * member's own access token. A request that carries that token is authenticated here exactly like a cookie session
 * (the token is verified with Supabase, then the same profile / status / role checks run), and nothing more.
 *
 * Rules that must not be loosened:
 *  - the header must be exactly `Bearer <jwt>`: one space, a three-part token of URL-safe characters, bounded length;
 *  - a request that sends an Authorization header is judged by it ALONE. A bad or expired token is "not signed in";
 *    it never falls back to a cookie, so a stale header cannot borrow some other session;
 *  - the token is verified by Supabase (`auth.getUser(token)`), never trusted from its own payload;
 *  - the client that reads `profiles` sends the token, so row-level security runs as that user.
 */

/** A JWT is three base64url parts. Supabase access tokens are about 1 KB; 4 KB is a generous ceiling. */
const MAX_TOKEN_LENGTH = 4096;
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const BEARER_HEADER = /^Bearer ([^\s]+)$/i;

/** The token from an Authorization header, or null when the header is not exactly `Bearer <jwt>`. */
export function parseBearerHeader(header: string | null | undefined): string | null {
  if (typeof header !== 'string') return null;
  const match = BEARER_HEADER.exec(header);
  if (!match) return null;
  const token = match[1];
  if (token.length > MAX_TOKEN_LENGTH || !JWT_SHAPE.test(token)) return null;
  return token;
}

export type BearerUser = { supabase: SupabaseClient; user: User };

/** Verify a token with Supabase. Returns the user and a client that acts as that user, or null. */
export async function verifyBearerUser(token: string): Promise<BearerUser | null> {
  const { url, anonKey, isConfigured } = getSupabaseEnv();
  if (!isConfigured) return null;

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { supabase, user };
}
