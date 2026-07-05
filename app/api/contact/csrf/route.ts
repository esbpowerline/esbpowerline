import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = randomBytes(32).toString('base64url');
  const response = NextResponse.json({ token });
  response.cookies.set('csrf_token', token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 3600,
  });
  return response;
}