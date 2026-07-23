'use client';

import type { MouseEvent } from 'react';
import { Pencil } from 'lucide-react';
import { useEditorPresence } from '@/hooks/useEditorPresence';
import { cn } from '@/lib/utils';

type QuickEditVariant = 'card' | 'inline';

/**
 * Staff-only shortcut that opens a specific article directly in the CMS editor,
 * so a logged-in editor can jump straight from the live site into editing without
 * opening the CMS panel and searching for the story. Renders nothing for guests
 * and members. Opens in a new tab to preserve the reader's place on the site.
 *
 * `card` — a compact icon button, meant to overlay an ArticleCard (which is itself
 * wrapped in a <Link>, so the click is stopped from triggering card navigation).
 * `inline` — a labelled pill, meant to sit in an actions row (e.g. the article page).
 */
export function QuickEditButton({
  articleId,
  variant = 'card',
  className,
}: {
  articleId?: string | null;
  variant?: QuickEditVariant;
  className?: string;
}) {
  const { canQuickEdit, resolveEditHref } = useEditorPresence();

  if (!canQuickEdit || !articleId) return null;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // The card variant lives inside the card's <Link>; stop the click from both
    // navigating the card and nesting interactive elements semantically.
    event.preventDefault();
    event.stopPropagation();
    window.open(resolveEditHref(articleId), '_blank', 'noopener,noreferrer');
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Edit this article in the CMS (opens in a new tab)"
        title="Edit in CMS"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground',
          className,
        )}
      >
        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
        <span>Edit in CMS</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Edit this article in the CMS (opens in a new tab)"
      title="Edit in CMS"
      className={cn(
        'absolute right-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        className,
      )}
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}
