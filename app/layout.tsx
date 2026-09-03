import type { Metadata } from 'next';
import { safeJsonLd } from '@/lib/json-ld';
import Script from 'next/script';

import { Inter, Noto_Sans_Bengali, Space_Grotesk, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ProvidersShell } from './ProvidersShell';
import { OFFICIAL_SOCIAL_LINKS } from '@/components/shared/OfficialSocialLinks';
import { SITE_THEME_CRITICAL_CSS, SITE_THEME_INIT_SCRIPT } from '@/lib/site-theme';
import { SITE_LOCALE_INIT_SCRIPT } from '@/lib/locale';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
// Not preloaded: the mono face carries figures in the ticker and data tables,
// none of which is the largest paint on any page. Four preloaded families
// (164 KB) sat on the critical path ahead of the text that is (stage 7).
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap', preload: false });
// preload: false — every page, English included, was preloading the Bengali
// face for every visitor (the server always renders English; the toggle is
// client-side). Without the preload hint the browser fetches it only when a
// Bengali glyph is actually laid out (SEO_FIX_LOG stage 7).
const notoSansBengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bengali', display: 'swap', preload: false });
// Masthead only. The design directive (Phase B §B8) retires the illustrated
// banner for a typographic nameplate — serious publications are typography —
// and none of the loaded faces is a serif. One face, two weights, latin subset.
const sourceSerif = Source_Serif_4({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-masthead', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com'),
  title: {
    // The site-wide title carries the phrase the site is about. "Energy &
    // Power News" never said "power sector", which is what the description
    // and every article already lead with.
    default: 'ESB PowerLine — Bangladesh Power Sector News & Grid Data',
    template: '%s | ESB PowerLine',
  },
  description:
    "Bangladesh's premier source for power sector news, renewable energy, policy, projects & tenders, grid explorer, and the monthly magazine.",
  icons: { icon: '/images/fav-icon.png' },
  openGraph: {
    siteName: 'ESB PowerLine',
    images: [{ url: '/og-image.png' }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';

/**
 * Organization + WebSite, graphed together so the publisher on every article's
 * NewsArticle block resolves to a real entity. Neither existed before, which is
 * why no page other than an article carried structured data at all.
 */
const SITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'NewsMediaOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: 'ESB PowerLine',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/esb-logo.png`,
        width: 563,
        height: 162,
      },
      description:
        "Bangladesh's premier source for power sector news, renewable energy, policy, projects and tenders.",
      // The real accounts, from the same constant the footer renders. Without
      // sameAs the organisation entity floats free of its profiles (stage 5).
      sameAs: Object.values(OFFICIAL_SOCIAL_LINKS).map((l) => l.href),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'ESB PowerLine',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
      // /search?q= is a real page; this is what lets Google offer a sitelinks
      // search box.
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

const bodyClass = [
  inter.variable,
  spaceGrotesk.variable,
  jetbrainsMono.variable,
  notoSansBengali.variable,
  sourceSerif.variable,
  'min-h-screen bg-background text-foreground antialiased font-sans',
].join(' ');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="theme-white light"
      data-site-theme="white"
      data-site-locale="en"
      suppressHydrationWarning
    >
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />}
        {/* Site-level entities. Article pages add their own NewsArticle block.
            Escaped with safeJsonLd rather than raw JSON.stringify — every other
            JSON-LD block here does, and a `</script>` in any future dynamic field
            would otherwise break out of the tag. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(SITE_JSON_LD) }}
        />
        {/* Critical theme CSS injected before paint to avoid flash */}
        <style dangerouslySetInnerHTML={{ __html: SITE_THEME_CRITICAL_CSS }} suppressHydrationWarning />
        {/* Theme + locale hydration — must run before React tree */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SITE_THEME_INIT_SCRIPT }} />
        <Script id="locale-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SITE_LOCALE_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className={bodyClass}>


        <ProvidersShell>
          {children}
          <Toaster
            position="bottom-right"
            closeButton
            toastOptions={{
              classNames: {
                toast: 'cms-toast',
                title: 'cms-toast__title',
                description: 'cms-toast__description',
                success: 'cms-toast--success',
                error: 'cms-toast--error',
                info: 'cms-toast--info',
                closeButton: 'cms-toast__close',
              },
            }}
          />
        </ProvidersShell>
        {/* Vercel Web Analytics and Speed Insights are deliberately NOT
            rendered here: both are metered products and Hamim switched them
            off in the dashboard (2026-09-02). Traffic comes from GA below. */}
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=G-V04WZWK8WT`}
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            // Turn off Google Signals and ad-personalization. Without this, GA
            // fires remarketing beacons to stats.g.doubleclick.net and
            // google.com.bd/ads, which the CSP (correctly) blocks — logging a
            // console error on every page load and failing Lighthouse Best
            // Practices. This site runs no ad remarketing, so the beacons are
            // pure tracking noise; disabling them is both the privacy-preserving
            // choice and what clears the console, with no CSP loosening.
            gtag('config', 'G-V04WZWK8WT', {
              page_path: window.location.pathname,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
            });
          `}
        </Script>
      </body>
    </html>
  );
}