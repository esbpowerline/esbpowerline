'use client';

/*
 * Phone app bar pieces (below 768px only; app/phone-appbar.css hides them from
 * 768px up, so desktop renders exactly as before). On a phone the header was
 * a row of eight coloured icons plus a three-swatch theme menu; with the dock
 * carrying Home / Grid / News / Magazine / Menu, the bar keeps the logo,
 * search and one theme button that cycles white -> dark -> midnight.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, MoonStar, Sun } from 'lucide-react';
import { applySiteTheme, getSavedSiteTheme, type SiteTheme } from '@/lib/site-theme';
import '@/app/phone-appbar.css';

const ORDER: SiteTheme[] = ['white', 'dark', 'midnight'];
const LABEL: Record<SiteTheme, string> = { white: 'White', dark: 'Dark', midnight: 'Midnight' };

export function PhoneAppBarLogo() {
  return (
    <Link href="/" prefetch={false} className="hp-appbar__logo" aria-label="ESB Power Line home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/esb-logo.png" alt="" width={563} height={162} />
    </Link>
  );
}

export function PhoneThemeCycle() {
  const [theme, setTheme] = useState<SiteTheme>('white');
  useEffect(() => {
    setTheme(getSavedSiteTheme());
    // The desktop swatches can change the theme too; follow the root class.
    const root = document.documentElement;
    const read = () => {
      const t = ORDER.find((x) => root.classList.contains('theme-' + x));
      if (t) setTheme(t);
    };
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = theme === 'white' ? Sun : theme === 'dark' ? Moon : MoonStar;
  return (
    <button
      type="button"
      className="hp-appbar__theme"
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}`}
      onClick={() => {
        applySiteTheme(next);
        setTheme(next);
      }}
    >
      <Icon aria-hidden width={20} height={20} strokeWidth={2} />
    </button>
  );
}
