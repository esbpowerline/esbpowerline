'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { getArticleSavedState, toggleSaveArticle } from '@/lib/actions/members';
import { useSession } from '@/utils/supabase/auth-context';
import { cn } from '@/lib/utils';

/**
 * Resolves its own state in the browser.
 *
 * It used to take `signedIn` and `initialSaved` from the article page, which
 * meant the page had to read the session on the server — and a page that reads
 * cookies is rendered on every request. The article page is cached now, so the
 * button asks the session provider whether anyone is signed in and, only then,
 * asks the server whether this article is saved (SEO_FIX_LOG stage 1,
 * 2026-09-02). Anonymous readers, the overwhelming majority, cost nothing.
 */
export function SaveArticleButton({
  articleId,
  articleSlug,
}: {
  articleId: string;
  articleSlug: string;
}) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    getArticleSavedState(articleId)
      .then((value) => {
        if (live) setSaved(value);
      })
      .catch(() => {
        /* the button simply starts unsaved */
      });
    return () => {
      live = false;
    };
  }, [signedIn, articleId]);

  if (!signedIn) {
    // The href carries no callback: with one per article, the site's HTML
    // offered crawlers 128 distinct /members/login?callbackUrl=… URLs (and
    // the comment section another 128 of /login?…), all robots-blocked and
    // canonical-less — the "duplicate without user-selected canonical" and
    // "blocked by robots.txt" rows in Search Console (SEO_FIX_LOG stage 2).
    // The reader still comes back to this article: the callback is attached
    // on click, which a crawler never performs.
    return (
      <Link
        href="/members/login"
        rel="nofollow"
        onClick={(e) => {
          e.preventDefault();
          window.location.assign(`/members/login?callbackUrl=${encodeURIComponent(`/articles/${articleSlug}`)}`);
        }}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 gap-2 bg-primary/10 text-primary hover:bg-primary/20"
      >
        <Bookmark className="h-4 w-4" />
        <span className="article-save-btn-text">Save article</span>
      </Link>
    );
  }

  function handleToggle() {
    startTransition(async () => {
      try {
        const result = await toggleSaveArticle(articleId);
        setSaved(result.saved);
        toast.success(result.saved ? 'Saved to your library' : 'Removed from saved');
      } catch {
        toast.error('Could not update saved article');
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 gap-2',
        saved ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary/10 text-primary hover:bg-primary/20',
      )}
    >
      <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
      <span className="article-save-btn-text">{saved ? 'Saved' : 'Save article'}</span>
    </button>
  );
}
