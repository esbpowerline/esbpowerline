'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronUp, Mail, MapPin, Phone, Share2, UserRound } from 'lucide-react';
import { BrandDeck } from '@/components/shared/BrandDeck';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { OfficialSocialLinks } from '@/components/shared/OfficialSocialLinks';
import { MemberFooterCard } from '@/components/members/MemberFooterCard';
import { useLocale } from '@/components/shared/LocaleProvider';
import type { PublicCategory } from '@/lib/category-types';
import { CATEGORIES } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import { localizeCategoryFields } from '@/lib/i18n/categories';

function FooterHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`mb-5 w-fit font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground ${className}`}>
      {children}
      <span className="mt-2.5 block h-0.5 w-full min-w-[2rem] rounded-full bg-primary" aria-hidden />
    </h3>
  );
}

/**
 * Footer links are never prefetched. They sit below every page, so they enter
 * the viewport on any scroll to the bottom, and the footer repeats
 * destinations the navbar already offers — it contributed 15 of the homepage's
 * 45 speculative page loads. Nobody reaches the footer by accident and then
 * needs the next page instantly.
 */
function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="text-sm font-medium text-foreground/85 transition-colors hover:text-primary"
    >
      {children}
    </Link>
  );
}

function FooterLinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.href}>
          <FooterLink href={link.href}>{link.label}</FooterLink>
        </li>
      ))}
    </ul>
  );
}

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof UserRound;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">{label}</p>
        <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

export function PublicFooter({ categories = [] }: { categories?: PublicCategory[] }) {
  const { locale, t } = useLocale();
  const year = new Date().getFullYear();

  const sectorLinks = useMemo(() => {
    const source = categories.length
      ? categories.map((c) => ({ name: c.name, slug: c.slug }))
      : CATEGORIES.map((c) => ({ name: c, slug: slugify(c) }));
    return source.map((cat) => {
      const localized = localizeCategoryFields(locale, cat);
      return { name: localized.name, slug: cat.slug };
    });
  }, [categories, locale]);

  const exploreLinks = [
    { label: t('footer.latestNews'), href: '/articles' },
    { label: t('footer.allCategories'), href: '/categories' },
    { label: t('footer.monthlyMagazine'), href: '/magazine' },
    { label: t('footer.gridExplorer'), href: '/grid-explorer' },
    // The policy library ranks on page one for several queries and had no
    // site-wide link at all (stage 6).
    { label: t('footer.energyPolicy'), href: '/energy-policy' },
    { label: t('footer.search'), href: '/search' },
  ];

  const sectorNavLinks = sectorLinks.slice(0, 5).map((cat) => ({
    label: cat.name,
    href: `/categories/${cat.slug}`,
  }));

  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="container container--shell py-10 md:py-12">
        <div className="flex flex-col items-start gap-4 border-b border-border/40 pb-8 sm:flex-row sm:items-center sm:gap-6">
          <BrandLogo
            className="public-footer-logo"
            frameClassName="shrink-0 rounded-md border-0 bg-transparent px-0 py-0 shadow-none"
            imageClassName="h-11 w-auto max-w-[240px]"
          />
          <BrandDeck className="min-w-0 flex-1" />
        </div>

        <div className="grid grid-cols-1 gap-10 pt-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
          <section className="md:col-span-2 lg:col-span-4">
            <FooterHeading>{t('footer.editorialOffice')}</FooterHeading>
            <div className="space-y-4">
              <ContactItem icon={UserRound} label={t('footer.editorPublisher')}>
                <p className="font-display font-semibold tracking-tight text-foreground">Farid Uddin Ahmed</p>
              </ContactItem>

              <ContactItem icon={Mail} label={t('footer.email')}>
                <a href="mailto:esbplbd@gmail.com" className="block break-words transition-colors hover:text-primary">
                  esbplbd@gmail.com
                </a>
              </ContactItem>

              <ContactItem icon={MapPin} label={t('footer.officeAddress')}>
                <p className="font-medium text-foreground">ESB Media Limited</p>
                <p className="text-foreground/70">
                  House #36/1, Avenue #01, Block-A, Section-10, Mirpur, Pallabi, Dhaka-1216, Bangladesh.
                </p>
              </ContactItem>

              <ContactItem icon={Phone} label={t('footer.advertising')}>
                <a href="tel:+8801711378733" className="block transition-colors hover:text-primary">
                  +8801711-378733
                </a>
              </ContactItem>

              <ContactItem icon={Share2} label={t('footer.officialChannels')}>
                <OfficialSocialLinks variant="footer" />
              </ContactItem>
            </div>
          </section>

          <section className="md:col-span-1 lg:col-span-2">
            <FooterHeading>{t('footer.explore')}</FooterHeading>
            <FooterLinkList links={exploreLinks} />
          </section>

          <section className="md:col-span-1 lg:col-span-2">
            <FooterHeading>{t('footer.sectors')}</FooterHeading>
            <FooterLinkList links={sectorNavLinks} />
          </section>

          <section className="md:col-span-4 lg:col-span-4">
            <FooterHeading className="lg:ml-auto lg:text-right">{t('footer.members')}</FooterHeading>
            <MemberFooterCard />
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-border/40 pt-6 text-xs text-foreground/55">
          {/* Top Row: Tagline and Navigation links */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-center leading-relaxed text-foreground/60 md:text-left">
              {t('footer.tagline')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
              <Link
                prefetch={false}
                href="/about"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-muted-foreground hover:text-primary bg-secondary/30 hover:bg-secondary/75 border border-border/40 hover:border-primary/30 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {t('footer.about')}
              </Link>
              <Link
                prefetch={false}
                href="/contact"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-muted-foreground hover:text-primary bg-secondary/30 hover:bg-secondary/75 border border-border/40 hover:border-primary/30 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {t('footer.contact')}
              </Link>
              <a
                href="#top"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-primary bg-secondary/30 hover:bg-secondary/75 border border-border/40 hover:border-primary/30 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {t('footer.backToTop')}
                <ChevronUp className="h-3.5 w-3.5 opacity-80" aria-hidden />
              </a>
            </div>
          </div>

          {/* Bottom Row: Stacked Copyright */}
          <div className="border-t border-border/20 pt-4 text-center md:text-left space-y-1.5">
            <p className="text-xs font-semibold text-foreground/60 leading-normal">
              {t('footer.copyright', { year })}
            </p>
            <p className="text-[10px] text-foreground/70 font-normal leading-normal">
              Developed in-house by{' '}
              <a
                href="https://facebook.com/chiefhamim"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-primary transition-colors duration-150 font-medium"
              >
                chiefhamim
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
