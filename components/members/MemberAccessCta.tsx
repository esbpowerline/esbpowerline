'use client';

import Link from 'next/link';
import { useMemberAccess } from '@/hooks/useMemberAccess';

export function MemberAccessCta({
  guestLabel,
  guestHref,
  className = 'btn btn-primary w-full justify-center text-sm opacity-90',
}: {
  guestLabel: string;
  guestHref: string;
  className?: string;
}) {
  const access = useMemberAccess();

  if (access.state === 'loading') {
    return (
      <span className={`${className} pointer-events-none opacity-60`}>Loading…</span>
    );
  }

  if (access.signedIn) {
    return (
      <Link prefetch={false} href={access.href} className={className}>
        {access.isMember ? 'Open my library' : access.label}
      </Link>
    );
  }

  return (
    <Link prefetch={false} href={guestHref} className={className}>
      {guestLabel}
    </Link>
  );
}