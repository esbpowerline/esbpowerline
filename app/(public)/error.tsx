'use client';

import { useEffect } from 'react';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public page error:', error);
  }, [error]);

  return (
    <div className="container container--shell py-16 md:py-24">
      <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-display font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The page hit a server error while loading. On production this is usually a missing or
          invalid <code className="text-xs">DATABASE_URL</code>, failed migrations, or an empty
          database that was never bootstrapped. Sign-in also requires Supabase Auth users — Prisma
          seed data alone is not enough.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/90">
          Diagnostics:{' '}
          {/* Route handlers, not pages: `next/link` would client-navigate to a
              JSON endpoint. Also an error boundary — the router may be the thing
              that failed, so a real navigation is the reliable one. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/db/health" className="underline underline-offset-2 hover:text-foreground">
            /api/db/health
          </a>
          {' · '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/supabase/health" className="underline underline-offset-2 hover:text-foreground">
            /api/supabase/health
          </a>
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[10px] text-muted-foreground/80">Ref: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="btn btn-primary mt-6 px-6"
        >
          Try again
        </button>
      </div>
    </div>
  );
}