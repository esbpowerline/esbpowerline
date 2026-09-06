'use client';

import Link from 'next/link';
import { BookOpenCheck, ChevronRight, LogOut, Shield } from 'lucide-react';
import { useMemberAccess } from '@/hooks/useMemberAccess';
import { signOutToPublicSite } from '@/lib/staff-sign-out';
import { cn } from '@/lib/utils';

export function MemberNavMenuLinks() {
  const access = useMemberAccess();

  if (access.state === 'loading') {
    return <span className="block py-1.5 text-muted-foreground text-xs">Loading account…</span>;
  }

  if (access.state === 'guest') {
    return (
      <div className="space-y-2 border-t border-border/50 pt-3">
        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          Sign in
        </p>
        <Link prefetch={false} href="/members/login" className="mobile-account-option">
          <span className="mobile-account-option__icon mobile-account-option__icon--member">
            <BookOpenCheck className="h-4 w-4" />
          </span>
          <span className="mobile-account-option__copy">
            <span className="mobile-account-option__label">Member</span>
            <span className="mobile-account-option__hint">Library &amp; saved content</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        </Link>
        <Link prefetch={false} href="/login" className="mobile-account-option">
          <span className="mobile-account-option__icon mobile-account-option__icon--staff">
            <Shield className="h-4 w-4" />
          </span>
          <span className="mobile-account-option__copy">
            <span className="mobile-account-option__label">Staff</span>
            <span className="mobile-account-option__hint">Editorial &amp; admin tools</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1 border-t border-border/50 pt-3">
      <Link
        prefetch={false}
        href={access.href}
        className={cn(
          'workspace-open-control flex items-center gap-2 rounded-md px-0.5 py-1.5 font-medium',
          access.accountKind && `workspace-open-control--${access.accountKind}`,
        )}
      >
        {access.isMember ? <BookOpenCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
        {access.isMember ? 'My library' : 'Staff workspace'}
        <span className="text-muted-foreground font-normal">({access.userName})</span>
      </Link>
      <button
        type="button"
        onClick={() => void signOutToPublicSite()}
        className="sign-out-control flex w-full items-center gap-2 rounded-md py-1.5 px-0.5 text-left text-muted-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}