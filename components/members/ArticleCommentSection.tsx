'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { submitArticleComment } from '@/lib/actions/members';
import { toast } from 'sonner';
import { useSession } from '@/utils/supabase/auth-context';
import { can } from '@/lib/constants';

type CommentRow = {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
};

export function ArticleCommentSection({
  articleId,
  articleSlug,
  initialComments,
}: {
  articleId: string;
  articleSlug: string;
  initialComments: CommentRow[];
}) {
  // Permissions come from the browser session, not from the page: the article
  // page no longer reads the session on the server so it can be cached
  // (SEO_FIX_LOG stage 1, 2026-09-02). `submitArticleComment` re-checks the
  // session on the server, so this only decides what to show.
  const { data, status } = useSession();
  const role = data?.user?.role;
  const canPostComment = status === 'authenticated' && can(role, 'comment.create');
  const staffComment = can(role, 'comment.moderate_any');
  const router = useRouter();
  const [content, setContent] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const result = await submitArticleComment(articleId, articleSlug, content);
        setContent('');
        toast.success(
          result.autoApproved ? 'Comment posted' : 'Comment submitted for review',
        );
        router.refresh();
      } catch {
        toast.error('Could not submit comment');
      }
    });
  }

  return (
    <section className="member-comments">
      <h3 className="member-comments__title">Discussion</h3>

      {initialComments.length > 0 ? (
        <ul className="member-comments__list">
          {initialComments.map((comment) => (
            <li key={comment.id} className="member-comments__item">
              <div className="member-comments__meta">
                <span className="font-medium text-foreground">{comment.authorName}</span>
                <span>{formatDate(comment.createdAt.toISOString())}</span>
              </div>
              <p className="member-comments__body">{comment.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="member-comments__empty">No published comments yet. Be the first to join the discussion.</p>
      )}

      {canPostComment ? (
        <form onSubmit={handleSubmit} className="member-comments__form">
          <label htmlFor="article-comment" className="sr-only">
            Your comment
          </label>
          <textarea
            id="article-comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Share your perspective on this story…"
            className="member-comments__textarea"
            required
            minLength={3}
          />
          <p className="member-comments__hint">
            {staffComment
              ? 'Your comment will appear immediately.'
              : 'Comments are reviewed before they appear publicly.'}
          </p>
          <button type="submit" disabled={pending} className="btn btn-primary text-sm">
            {pending ? 'Submitting…' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="member-comments__signin">
          {/* Bare hrefs, callback attached on click: one login URL per article
              in the HTML gave crawlers 256 robots-blocked, canonical-less URLs
              to discover (SEO_FIX_LOG stage 2). */}
          <Link
            href="/members/login"
            rel="nofollow"
            onClick={(e) => {
              e.preventDefault();
              window.location.assign(`/members/login?callbackUrl=${encodeURIComponent(`/articles/${articleSlug}`)}`);
            }}
            className="text-primary hover:underline"
          >
            Sign in as a member
          </Link>{' '}
          or{' '}
          <Link
            href="/login"
            rel="nofollow"
            onClick={(e) => {
              e.preventDefault();
              window.location.assign(`/login?callbackUrl=${encodeURIComponent(`/articles/${articleSlug}`)}`);
            }}
            className="text-primary hover:underline"
          >
            staff account
          </Link>{' '}
          to join the discussion.
        </p>
      )}
    </section>
  );
}