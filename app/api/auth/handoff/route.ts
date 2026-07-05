import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { HANDOFF_COOKIE, verifyHandoffToken } from '@/lib/auth-handoff';
import { getSupabaseEnv } from '@/utils/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeCallbackUrl(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\') || raw.includes('\\')) {
    return '/';
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const token =
    request.cookies.get(HANDOFF_COOKIE)?.value ?? request.nextUrl.searchParams.get('token');
  const callbackUrl = safeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'));

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