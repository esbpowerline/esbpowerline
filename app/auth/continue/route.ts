import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  HANDOFF_COOKIE,
  buildHandoffUrl,
  createHandoffToken,
  needsAuthHandoff,
} from '@/lib/auth-handoff';
import { redirectUrlForRequest } from '@/lib/auth-routing';
import { safeAuthRedirectPath } from '@/lib/auth-redirect';

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to');
  const destination = to?.trim() ? safeAuthRedirectPath(to, '/') : null;
  if (!destination) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const host = request.headers.get('host') ?? 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';

  const session = await auth();
  if (!session?.user?.id || !session.user.email || !session.user.role) {
    const pathOnly = destination.split('?')[0];
    const isMemberDestination = pathOnly === '/members' || pathOnly.startsWith('/members/');
    const login = new URL(isMemberDestination ? '/members/login' : '/login', `${proto}://${host}`);
    login.searchParams.set('callbackUrl', destination);
    return NextResponse.redirect(login);
  }

  if (!needsAuthHandoff(destination, host)) {
    const resolved = redirectUrlForRequest(destination, `${proto}://${host}`);
    return NextResponse.redirect(
      typeof resolved === 'string' && /^https?:\/\//i.test(resolved)
        ? resolved
        : new URL(resolved as string, `${proto}://${host}`),
    );
  }

  const token = await createHandoffToken();
  if (!token) {
    const retry = new URL('/auth/continue', `${proto}://${host}`);
    retry.searchParams.set('to', destination);
    return NextResponse.redirect(retry);
  }

  const handoffUrl = buildHandoffUrl(destination);
  const handoffOrigin = new URL(handoffUrl).origin;
  const currentOrigin = `${proto}://${host}`;
  const response = NextResponse.redirect(
    handoffOrigin === currentOrigin
      ? handoffUrl
      : `${handoffUrl}${handoffUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`,
  );

  if (handoffOrigin === currentOrigin) {
    response.cookies.set(HANDOFF_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/handoff',
      maxAge: 60,
    });
  }
  return response;
}