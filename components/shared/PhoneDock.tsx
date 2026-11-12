'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Home, Menu, Newspaper, X } from 'lucide-react';
import { usePublicHref } from '@/lib/public-href-client';
import { useLocale } from '@/components/shared/LocaleProvider';
import '@/app/phone-dock.css';

/**
 * The phone's floating tab bar for the public site (below 768px only; the
 * stylesheet hides it from 768px up, so the desktop page is untouched).
 *
 * It is the Grid Explorer phone app's dock (`.gp-nav` in the cards look),
 * carried out to the newsroom so the two read as one app. Every destination is
 * one the navbar above already has: Home, Grid Explorer, Articles, Magazine,
 * and the navbar's own menu sheet. No route is introduced here.
 *
 * Not rendered inside /grid-explorer: the phone app there is full-screen and
 * has its own dock, and two docks would stack.
 */
function DockLink({
  href,
  on,
  label,
  children,
  onClick,
}: {
  href: string;
  on: boolean;
  label: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const resolved = usePublicHref(href);
  return (
    <Link
      href={resolved}
      prefetch={false}
      className={on ? 'is-on' : undefined}
      aria-current={on ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="hp-dock__ind" aria-hidden>
        {children}
      </span>
      {label}
    </Link>
  );
}

export function PhoneDock({
  menuOpen,
  onMenuToggle,
  onHomeClick,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onHomeClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  if (pathname.startsWith('/grid-explorer')) return null;

  const bn = locale === 'bn';
  const within = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // While the menu sheet is open it is the place the reader is, so it holds the
  // highlight alone rather than sharing it with the page underneath.
  const at = (hit: boolean) => hit && !menuOpen;

  return (
    <nav className="hp-dock" aria-label="Quick navigation">
      <DockLink href="/" on={at(pathname === '/')} label={t('nav.home')} onClick={onHomeClick}>
        <Home />
      </DockLink>
      <DockLink href="/grid-explorer" on={false} label={bn ? t('nav.gridExplorer') : 'Grid'}>
        <BarChart3 />
      </DockLink>
      <DockLink
        href="/articles"
        on={at(within('/articles') || within('/categories'))}
        label={bn ? t('nav.latest') : 'News'}
      >
        <Newspaper />
      </DockLink>
      <DockLink href="/magazine" on={at(within('/magazine'))} label={t('nav.magazine')}>
        <BookOpen />
      </DockLink>
      <button
        type="button"
        className={menuOpen ? 'is-on' : undefined}
        aria-expanded={menuOpen}
        aria-controls="mobile-categories-panel"
        onClick={onMenuToggle}
      >
        <span className="hp-dock__ind" aria-hidden>
          {menuOpen ? <X /> : <Menu />}
        </span>
        {bn ? 'মেনু' : 'Menu'}
      </button>
    </nav>
  );
}
