'use client';

import Link from 'next/link';
import { ArrowUpRight, BookOpenCheck } from 'lucide-react';
import { useMemberAccess } from '@/hooks/useMemberAccess';
import { useLocale } from '@/components/shared/LocaleProvider';

export function MemberFooterCard() {
  const { t } = useLocale();
  const access = useMemberAccess();

  if (access.state === 'loading') {
    return (
      <div className="card flex flex-col gap-4 p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">{t('member.loading')}</p>
      </div>
    );
  }

  if (access.state === 'guest') {
    return (
      <div className="card flex flex-col gap-4 p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-foreground/85">{t('member.guestPitch')}</p>
        <Link
          prefetch={false}
          href="/members/login"
          className="btn btn-primary inline-flex w-fit items-center gap-1.5 text-sm"
        >
          {t('member.login')}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <p className="text-xs leading-relaxed text-foreground/60">{t('member.staffNote')}</p>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-4 p-5 sm:p-6">
      <p className="text-sm leading-relaxed text-foreground/85">
        {access.isMember
          ? t('member.signedInMember', { name: access.userName ?? '' })
          : t('member.signedInStaff', { name: access.userName ?? '' })}
      </p>
      <Link
        prefetch={false}
        href={access.href}
        className="btn btn-primary inline-flex w-fit items-center gap-1.5 text-sm"
      >
        <BookOpenCheck className="h-4 w-4" />
        {access.label}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
      {access.isMember ? (
        <p className="text-xs leading-relaxed text-foreground/60">{t('member.manageAccount')}</p>
      ) : (
        <p className="text-xs leading-relaxed text-foreground/60">
          <Link prefetch={false} href="/login" className="text-primary hover:underline">
            {t('member.staffSignIn')}
          </Link>
        </p>
      )}
    </div>
  );
}