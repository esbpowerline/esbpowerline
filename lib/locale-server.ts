import { type SiteLocale } from '@/lib/locale';

export async function getServerSiteLocale(): Promise<SiteLocale> {
  // Hardcoded to 'en' so next.js can statically cache all public pages.
  // The client will hydrate the actual locale via SITE_LOCALE_INIT_SCRIPT.
  return 'en';
}