'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Briefcase } from 'lucide-react';
import { MemberAccessCta } from '@/components/members/MemberAccessCta';
import { useLocale } from '@/components/shared/LocaleProvider';
import { localizeProfessionalsCta } from '@/lib/i18n/homepage-copy';

type HomeBottomRowProps = {
  layout?: 'split' | 'stack';
  magazine: {
    title: string;
    summary: string;
    coverUrl: string;
  };
  magazineLabel: string;
  professionalsCta: {
    label: string;
    title: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
};

export function HomeBottomRow({
  layout = 'split',
  magazine,
  magazineLabel,
  professionalsCta,
}: HomeBottomRowProps) {
  const { locale, t } = useLocale();
  const cta = localizeProfessionalsCta(professionalsCta, locale);
  const isStack = layout === 'stack';

  const magazineCard = (
    <div className="card home-bottom-row__card group bg-card relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true">
        <div className="absolute -top-[20%] -right-[20%] w-[14rem] h-[14rem] rounded-full bg-emerald-500/6 blur-[45px] animate-pulse duration-[7000ms]" />
        <div className="absolute -bottom-[20%] -left-[20%] w-[14rem] h-[14rem] rounded-full bg-primary/5 blur-[45px] animate-pulse duration-[9000ms]" />
      </div>
      <div>
        <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 mb-2.5">
          <BookOpen className="h-4 w-4" />
          <span className="section-kicker">{t('home.monthlyMagazine')}</span>
        </div>
        <div className={`flex gap-3.5 items-start ${isStack ? 'flex-col sm:flex-row' : ''}`}>
          <div className="w-16 sm:w-[4.5rem] shrink-0 relative">
            <div className="aspect-[3/4] rounded border border-border/40 overflow-hidden bg-muted shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04] group-hover:shadow-lg relative">
              <Image
                src={magazine.coverUrl}
                alt={magazine.title}
                fill
                unoptimized={true}
                className="object-cover"
                sizes="72px"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-base leading-tight tracking-tight mb-1.5 line-clamp-2">
              {magazine.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{magazine.summary}</p>
          </div>
        </div>
      </div>
      <Link
        href="/magazine"
        className="mt-4 inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        {t('home.readIssue', { label: magazineLabel })} <ArrowRight className="h-3.5 w-3.5 ml-1" />
      </Link>
    </div>
  );

  const memberCard = (
    <div className="card home-bottom-row__card bg-card relative overflow-hidden group">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true">
        <div className="absolute -top-[20%] -right-[20%] w-[14rem] h-[14rem] rounded-full bg-primary/6 blur-[45px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-[20%] -left-[20%] w-[14rem] h-[14rem] rounded-full bg-amber-500/5 blur-[45px] animate-pulse duration-[10000ms]" />
      </div>
      <div>
        <div className="section-kicker flex items-center gap-1.5 text-muted-foreground mb-2.5">
          <Briefcase className="h-4 w-4 text-primary" />
          {cta.label}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{cta.title}</p>
      </div>
      <div className="mt-4">
        <MemberAccessCta
          guestLabel={cta.primaryLabel}
          guestHref={cta.primaryHref}
          className="btn btn-primary w-full justify-center text-sm"
        />
      </div>
    </div>
  );

  if (isStack) {
    return (
      <section className="home-rail-panel home-block home-rail-stack" aria-label="Magazine and membership">
        {magazineCard}
        {memberCard}
      </section>
    );
  }

  return (
    <section className="home-bottom-row home-block" aria-label="Magazine and membership">
      <div className="home-bottom-row__grid">
        <div className="home-bottom-row__magazine">{magazineCard}</div>
        <div className="home-bottom-row__member">{memberCard}</div>
      </div>
    </section>
  );
}