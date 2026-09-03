import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { HANDOFF_COOKIE, verifyHandoffToken } from '@/lib/auth-handoff';
import { safeAuthRedirectPath } from '@/lib/auth-redirect';
import { getSupabaseEnv } from '@/utils/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Cookie only. The `?token=` fallback let a session be minted from a link —
  // anyone who could get a victim to open a URL carrying a token logged them
  // into the attacker's account (login CSRF / fixation, audit 2026-08-08).
  // The cookie is set by our own login handler and never appears in a URL.
  const token = request.cookies.get(HANDOFF_COOKIE)?.value ?? null;
  // The shared helper, not a local copy: the local one lacked the control-
  // character check, so `?callbackUrl=/%09/evil.com` resolved off-site.
  const callbackUrl = safeAuthRedirectPath(request.nextUrl.searchParams.get('callbackUrl'), '/');

  const isMemberCallback = callbackUrl === '/members' || callbackUrl.startsWith('/members/');

  if (!token) {
    const loginPath = isMemberCallback ? '/members/login' : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const payload = verifyHandoffToken(token);
  if (!payload) {
    const loginPath = isMemberCallback ? '/members/login' : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.redirect(new URL(callbackUrl, request.url));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(new URL(callbackUrl, request.url));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });

  if (error) {
    const loginPath = isMemberCallback ? '/members/login' : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  response.cookies.delete(HANDOFF_COOKIE);
  return response;
}