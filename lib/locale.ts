export type SiteLocale = 'en' | 'bn';

export const SITE_LOCALE_STORAGE_KEY = 'site-locale';

export const SITE_LOCALES: { id: SiteLocale; label: string; short: string }[] = [
  { id: 'en', label: 'English', short: 'EN' },
];

export type SiteLocalePreview = {
  background: string;
  border: string;
  foreground: string;
};

/** Tooltip pill — matches EN blue / BN emerald locale pills */
export const SITE_LOCALE_PREVIEW: Record<SiteLocale, SiteLocalePreview> = {
  en: {
    background: 'hsl(214 88% 58%)',
    border: 'hsl(214 72% 46%)',
    foreground: 'hsl(0 0% 100%)',
  },
  bn: {
    background: 'hsl(152 58% 44%)',
    border: 'hsl(152 62% 32%)',
    foreground: 'hsl(0 0% 100%)',
  },
};

const VALID_LOCALES = new Set<SiteLocale>(SITE_LOCALES.map((l) => l.id));

// The public site is English only (owner decision, 2026-11-12). The 'bn'
// member of SiteLocale survives only because staff export tools (YoY cards,
// comparison PDFs) still take a language argument of this type. Nothing a
// reader can reach selects it: every resolver below answers 'en', and a
// browser that saved 'bn' earlier is moved back to English on its next visit.
export function isSiteLocale(value: string | null | undefined): value is SiteLocale {
  return value === 'en';
}

export function parseSiteLocale(_value?: string | null): SiteLocale {
  return 'en';
}

export function applySiteLocale(_locale?: SiteLocale) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = 'en';
  root.dataset.siteLocale = 'en';
  root.classList.remove('locale-bn');
  try {
    localStorage.setItem(SITE_LOCALE_STORAGE_KEY, 'en');
    document.cookie = `${SITE_LOCALE_STORAGE_KEY}=en;path=/;max-age=31536000;SameSite=Lax`;
  } catch {}
}

/** Blocking head script - resets any saved Bangla preference before React hydrates. */
export const SITE_LOCALE_INIT_SCRIPT = `(function(){try{var k='${SITE_LOCALE_STORAGE_KEY}';var r=document.documentElement;r.lang='en';r.dataset.siteLocale='en';r.classList.remove('locale-bn');localStorage.setItem(k,'en');document.cookie=k+'=en;path=/;max-age=31536000;SameSite=Lax';}catch(e){}})();`;

export function getSavedSiteLocale(): SiteLocale {
  return 'en';
}
