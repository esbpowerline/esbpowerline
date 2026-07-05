import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { getSupabaseEnv } from '@/utils/supabase/env';

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
    const allowedHosts = [
      ...(supabaseHost ? [supabaseHost] : []),
      'localhost',
      '127.0.0.1',
    ];
    const host = parsedUrl.hostname;
    const isAllowed = allowedHosts.some((allowed) => host === allowed || host.endsWith('.' + allowed));
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden domain' }, { status: 403 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch remote image' }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
  }
}
