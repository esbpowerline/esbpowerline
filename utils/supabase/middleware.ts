import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/utils/supabase/env';

export interface UpdateSessionOptions {
  /**
   * `true` (default) verifies the token with Supabase Auth and returns the
   * user — required wherever a role or tier decision follows.
   *
   * `false` only keeps the session cookie fresh. It reads the session from the
   * cookie and calls out to Supabase solely when the access token has expired
   * and needs a refresh. Before this every request from a signed-in reader —
   * the document, every RSC prefetch for a link that scrolled into view, every
   * `/data/*.json` the explorer fetched — was a round trip to `/auth/v1/user`,
   * roughly 15–35 per page view (cost audit, 2026-09-03). None of those paths
   * made a decision on the result; the gate that does asks for `verify: true`.
   */
  verify?: boolean;
}

export async function updateSession(request: NextRequest, options: UpdateSessionOptions = {}) {
  const { verify = true } = options;
  const fallback = NextResponse.next({ request });

  try {
    const { url, anonKey, isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      return { response: fallback, supabase: null, user: null };
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    if (!verify) {
      // Cookie-backed; refreshes over the network only once the token has
      // expired. The returned user is deliberately null: it was not verified,
      // and nothing on this path may treat it as if it were.
      await supabase.auth.getSession();
      return { response: supabaseResponse, supabase, user: null };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { response: supabaseResponse, supabase, user };
  } catch {
    return { response: fallback, supabase: null, user: null };
  }
}
