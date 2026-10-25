import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-paths';
import { revalidateArticleContent } from '@/lib/revalidate-tags';
import { checkRateLimitResponse } from '@/lib/security';
import { parseRevalidateSlugs } from '@/lib/studio-revalidate';

/**
 * Refresh the public pages for articles the ESB Studio saved straight into the database.
 *
 * The CMS refreshes after every save through its server actions. The Studio writes with the staff member's own
 * Supabase token instead, which bypasses them, so a story it published would sit behind the homepage's and article
 * pages' ISR windows. The Studio calls this right after it saves. It is the same refresh `revalidatePublicContent`
 * performs (the public paths, the article page and the content cache tags), and it renders nothing: a page is rebuilt
 * only when a reader next opens it.
 *
 * Staff only (the middleware's gate for /api/cms plus `article.create` here), rate limited, and slugs are validated.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'article.create')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = checkRateLimitResponse(request, `studio-revalidate:${session.user.id}`, 30, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send JSON: { "slugs": ["article-slug"] }.' }, { status: 400 });
  }
  const slugs = parseRevalidateSlugs(body);
  if (!slugs) {
    return NextResponse.json({ error: 'Send 1 to 5 article slugs.' }, { status: 400 });
  }

  for (const path of PUBLIC_REVALIDATE_PATHS) revalidatePath(path);
  for (const slug of slugs) revalidatePath(`/articles/${slug}`);
  revalidateArticleContent();

  return NextResponse.json({ ok: true, paths: PUBLIC_REVALIDATE_PATHS.length + slugs.length });
}
