import { Providers } from '@/app/providers';

/**
 * Root providers wrapper — intentionally NOT async and does NOT read cookies().
 *
 * Reading cookies() here would de-opt the entire page tree into dynamic
 * server rendering on every request, bypassing all ISR/edge caching and
 * causing massive Vercel function invocation spikes.
 *
 * Locale preference is handled entirely on the client side by
 * SITE_LOCALE_INIT_SCRIPT (runs before React hydrates) and LocaleProvider's
 * own client-side localStorage read. The server default is always 'en'.
 */
export function ProvidersShell({ children }: { children: React.ReactNode }) {
  return <Providers initialLocale="en">{children}</Providers>;
}