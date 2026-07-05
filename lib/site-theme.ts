export type SiteTheme = 'midnight' | 'dark' | 'white';

export type SiteThemePreview = {
  background: string;
  card: string;
  primary: string;
  muted: string;
  border: string;
  foreground: string;
};

export const SITE_THEME_STORAGE_KEY = 'site-theme';

export const SITE_THEMES: { id: SiteTheme; label: string; color: string }[] = [
  { id: 'midnight', label: 'Midnight', color: '#04070f' },
  { id: 'dark', label: 'Dark', color: '#09090b' },
  { id: 'white', label: 'White', color: '#f8fafc' },
];

/** Tooltip swatch — card/elevated surfaces read clearer than near-black page backgrounds */
export const SITE_THEME_PREVIEW: Record<SiteTheme, SiteThemePreview> = {
  midnight: {
    background: 'hsl(220 40% 11%)',
    card: 'hsl(220 40% 9.5%)',
    primary: 'hsl(217 91% 60%)',
    muted: 'hsl(215 20% 70%)',
    border: 'hsl(220 30% 22%)',
    foreground: 'hsl(210 40% 98%)',
  },
  dark: {
    background: 'hsl(240 4% 14%)',
    card: 'hsl(240 5% 9%)',
    primary: 'hsl(220 85% 57%)',
    muted: 'hsl(240 5% 65%)',
    border: 'hsl(240 5% 22%)',
    foreground: 'hsl(0 0% 96%)',
  },
  white: {
    background: 'hsl(210 40% 98%)',
    card: 'hsl(0 0% 100%)',
    primary: 'hsl(224 85% 42%)',
    muted: 'hsl(215 16% 40%)',
    border: 'hsl(214 32% 90%)',
    foreground: 'hsl(222 47% 11%)',
  },
};

const THEME_CLASSES = ['theme-midnight', 'theme-dark', 'theme-white'] as const;
const VALID_THEMES = new Set<SiteTheme>(SITE_THEMES.map((t) => t.id));

function isSiteTheme(value: string | null | undefined): value is SiteTheme {
  return !!value && VALID_THEMES.has(value as SiteTheme);
}

/** Instant paint colors before the main stylesheet finishes loading. */
export const SITE_THEME_PAINT: Record<SiteTheme, { background: string; foreground: string }> = {
  midnight: { background: '#04070f', foreground: '#f1f5f9' },
  dark: { background: '#09090b', foreground: '#f4f4f5' },
  white: { background: '#f8fafc', foreground: '#0f172a' },
};

/** Blocking head CSS — prevents a flash of wrong background/text before Tailwind hydrates. */
export const SITE_THEME_CRITICAL_CSS = `
html,body{background-color:#f8fafc;color:#0f172a;color-scheme:light}
html.theme-midnight,html.theme-midnight body{background-color:#04070f;color:#f1f5f9;color-scheme:dark}
html.theme-dark,html.theme-dark body{background-color:#09090b;color:#f4f4f5;color-scheme:dark}
body{min-height:100vh;margin:0}
`.trim();

function persistThemeCookie(theme: SiteTheme) {
  if (typeof document === 'undefined') return;
  document.cookie = `${SITE_THEME_STORAGE_KEY}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

function paintDocumentTheme(theme: SiteTheme) {
  if (typeof document === 'undefined') return;
  const { background, foreground } = SITE_THEME_PAINT[theme];
  const root = document.documentElement;
  root.style.backgroundColor = background;
  root.style.color = foreground;
  if (document.body) {
    document.body.style.backgroundColor = background;
    document.body.style.color = foreground;
  }
}

/** Apply theme classes before React hydrates to avoid a flash of the wrong palette. */
export const SITE_THEME_INIT_SCRIPT = `(function(){try{var k='${SITE_THEME_STORAGE_KEY}';var t=sessionStorage.getItem(k);var v=['midnight','dark','white'];if(v.indexOf(t)<0)t='white';var r=document.documentElement;r.classList.remove('theme-midnight','theme-dark','theme-white','light','dark');r.classList.add('theme-'+t,t==='white'?'light':'dark');r.dataset.siteTheme=t;sessionStorage.setItem(k,t);document.cookie=k+'='+t+';path=/;max-age=31536000;SameSite=Lax';var p={midnight:['#04070f','#f1f5f9'],dark:['#09090b','#f4f4f5'],white:['#f8fafc','#0f172a']};var c=p[t]||p.white;r.style.backgroundColor=c[0];r.style.color=c[1];if(document.body){document.body.style.backgroundColor=c[0];document.body.style.color=c[1];}}catch(e){var r=document.documentElement;r.classList.add('theme-white','light');r.dataset.siteTheme='white';r.style.backgroundColor='#f8fafc';r.style.color='#0f172a';}})();`;

export function applySiteTheme(theme: SiteTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES, 'light', 'dark');
  root.classList.add(`theme-${theme}`);
  root.classList.add(theme === 'white' ? 'light' : 'dark');
  root.dataset.siteTheme = theme;
  sessionStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
  persistThemeCookie(theme);
  paintDocumentTheme(theme);
}

export function getSavedSiteTheme(): SiteTheme {
  if (typeof window === 'undefined') return 'white';

  const saved = sessionStorage.getItem(SITE_THEME_STORAGE_KEY);
  if (isSiteTheme(saved)) return saved;

  return 'white';
}