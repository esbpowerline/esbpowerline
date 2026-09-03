import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { getSupabaseEnv } from '@/utils/supabase/env';

/** Bitmap formats the editor preview can show. No SVG — see the type check below. */
const PROXIED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || !can(session.user.role, 'media.upload')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    const { url: supabaseUrl } = getSupabaseEnv();
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '';
    // Only proxy trusted media origins. Loopback is permitted in dev (local Supabase)
    // but never in production, to avoid SSRF against internal services.
    const allowedHosts = [
      ...(supabaseHost ? [supabaseHost] : []),
      ...(process.env.NODE_ENV !== 'production' ? ['localhost', '127.0.0.1'] : []),
    ];
    const isHostAllowed = (host: string) =>
      allowedHosts.some((allowed) => host === allowed || host.endsWith('.' + allowed));
    if (!isHostAllowed(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Forbidden domain' }, { status: 403 });
    }

    // Do not follow redirects: an allowed host could 3xx to an internal address.
    const res = await fetch(url, { redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json({ error: 'Redirects are not permitted' }, { status: 403 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch remote image' }, { status: res.status });
    }

    // Raster formats only, by allowlist. `startsWith('image/')` let
    // `image/svg+xml` through, and an SVG re-served from this origin runs its
    // inline script under our own CSP (`script-src 'self' 'unsafe-inline'`) —
    // a stored XSS any editor could plant by pointing a preview at a hostile
    // URL (audit finding, 2026-08-08). SVG never belonged here: the proxy
    // exists to sidestep CORS on bitmap previews.
    const rawType = res.headers.get('content-type') || 'application/octet-stream';
    const contentType = rawType.split(';')[0].trim().toLowerCase();
    if (!PROXIED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'Resource is not a supported image type' }, { status: 415 });
    }
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
  }
}
