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

const DHAKA_DATE = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
});
const DHAKA_TIME = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' });

/** "Thu, 12 Nov 2026 · 3:49 PM", Dhaka time. Rendered only after mount (the
    server's clock and timezone are not the reader's), into a fixed-width slot
    so nothing shifts when it fills; re-rendered on each minute boundary. */
function PhoneClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined;
    setNow(new Date());
    const first = setTimeout(() => {
      setNow(new Date());
      iv = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000) + 50);
    return () => { clearTimeout(first); if (iv) clearInterval(iv); };
  }, []);
  return (
    <span className="hp-appbar__clock" aria-live="off">
      {now ? `${DHAKA_DATE.format(now).replace(/^(\w+) /, '$1, ')} · ${DHAKA_TIME.format(now)}` : ' '}
    </span>
  );
}

export function PhoneAppBarLogo() {
  return (
    <div className="hp-appbar__brand">
      <Link href="/" prefetch={false} className="hp-appbar__logo" aria-label="ESB Power Line home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/esb-logo.png" alt="" width={563} height={162} />
      </Link>
      <PhoneClock />
    </div>
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
