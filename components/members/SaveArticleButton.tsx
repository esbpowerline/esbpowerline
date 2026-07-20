'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { toggleSaveArticle } from '@/lib/actions/members';
import { cn } from '@/lib/utils';

export function SaveArticleButton({
  articleId,
  articleSlug,
  initialSaved,
  signedIn,
}: {
  articleId: string;
  articleSlug: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href={`/members/login?callbackUrl=${encodeURIComponent(`/articles/${articleSlug}`)}`}
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