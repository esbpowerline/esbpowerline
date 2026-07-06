import type { Metadata } from 'next';
import Script from 'next/script';

import { Inter, Noto_Sans_Bengali, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { ProvidersShell } from './ProvidersShell';
import { SITE_THEME_CRITICAL_CSS, SITE_THEME_INIT_SCRIPT } from '@/lib/site-theme';
import { SITE_LOCALE_INIT_SCRIPT } from '@/lib/locale';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const notoSansBengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bengali', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'ESB PowerLine — Bangladesh Energy & Power News',
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

const bodyClass = [
  inter.variable,
  spaceGrotesk.variable,
  jetbrainsMono.variable,
  notoSansBengali.variable,
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
        {/* Critical theme CSS injected before paint to avoid flash */}
        <style dangerouslySetInnerHTML={{ __html: SITE_THEME_CRITICAL_CSS }} suppressHydrationWarning />
        {/* Theme + locale hydration — must run before React tree */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SITE_THEME_INIT_SCRIPT }} />
        <Script id="locale-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SITE_LOCALE_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className={bodyClass}>


        <ProvidersShell>
          {children}
          <Analytics />
          <SpeedInsights />
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
      </body>
    </html>
  );
}