import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** CMS / revision timestamps — e.g. "Tue, Jun 16, 2026 at 3:45:02 PM" */
export function formatEditorialTimestamp(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const body = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return `${weekday}, ${body} at ${time}`;
}

/** Formats dates as "Day Month Year" for chart tooltips (e.g. "6 July 2026") */
export function formatTooltipDate(dateStr: string): string {
  if (!dateStr) return '';

  // Only parse what is unambiguously an ISO date. `new Date()` accepts a great
  // deal else and fails silently rather than loudly: the Petrobangla window
  // label "01-02 Aug, 2026" parses as day 01, month Aug, year 02 — rendering
  // "1 August 2002" and discarding the real year. An isNaN guard cannot catch
  // that, because the parse succeeds; it is simply wrong by 24 years.
  // Anything not ISO is passed through as written, which is always readable.
  if (!/^\d{4}-\d{2}-\d{2}(T|$)/.test(dateStr)) return dateStr;

  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Formats dates for X-Axis dynamically based on the total time range being viewed */
export function formatDynamicXAxisDate(dateStr: string, totalDays: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  if (totalDays <= 14) {
    // Week preset: e.g. "Friday"
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  } else if (totalDays <= 45) {
    // Month preset: e.g. "06 Jul"
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } else {
    // 3M, 1Y, All presets: e.g. "Jul 2026"
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }
}

export function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatExactDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const now = new Date();
  
  const day = date.getDate();
  const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day - day % 10 !== 10 ? day % 10 : 0)] || 'th';
  
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.toLocaleDateString('en-US', { year: '2-digit' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  const exact = `${day}${suffix} ${month}, '${year} at ${time}`;
  
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay < 30) {
    if (diffMin < 1) return `${exact} (Just now)`;
    if (diffMin < 60) return `${exact} (${diffMin} min ago)`;
    if (diffHr < 24) return `${exact} (${diffHr}h ago)`;
    return `${exact} (${diffDay}d ago)`;
  }
  
  return exact;
}

function getRelativeDuration(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHrs < 24) return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Article timestamps render in Bangladesh time everywhere, explicitly.
 *
 * Without a fixed timeZone these strings depend on where the code runs:
 * Vercel's server renders in UTC and the visitor's browser in their own zone,
 * so the same timestamp hydrated to different text — React error #418 on every
 * page that server-renders an article date (caught by Lighthouse on the
 * homepage). Dhaka time is also simply the correct reading for a Bangladeshi
 * news site.
 */
const ARTICLE_TZ = 'Asia/Dhaka';

export function formatArticleDate(dateStr: string | Date, clockFormat: '12' | '24' = '12'): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const dateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: ARTICLE_TZ });
  const hour12 = clockFormat === '12';
  const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12, timeZone: ARTICLE_TZ });
  return `Published on ${dateString} at ${timeString}`;
}

export function formatArticleHoverDate(dateStr: string | Date, clockFormat: '12' | '24' = '12'): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: ARTICLE_TZ });
  const hhmm = date
    .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ARTICLE_TZ });

  let timeStr = '';
  if (clockFormat === '12') {
    timeStr = hhmm;
  } else {
    timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: ARTICLE_TZ });
  }
  
  const relative = getRelativeDuration(date);
  return `${weekday} at ${timeStr} (${relative})`;
}

export function truncate(text: string, length = 120): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * A date for a desk in Dhaka: "3 Sept", or "3 Sept 2025" once the year is not
 * the current one.
 *
 * The staff surface printed dates through a bare `toLocaleDateString()`, which
 * resolves to the RUNTIME locale — US month-first on both the Vercel server
 * and most browsers here, so 3 September rendered "9/3/2026" and read as March
 * to everyone using it. Pinning en-GB also keeps the server and the client in
 * agreement, which a runtime locale cannot promise: the same call on two sides
 * of a hydration boundary is a mismatch waiting to happen.
 */
export function formatDeskDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Date and clock time for an activity feed: "3 Sept, 10:45 pm".
 *
 * A "recently published" list is about WHEN, and several stories a day go out
 * on this desk — a date alone leaves five entries all reading "3 Sept" with no
 * way to tell their order apart. Asia/Dhaka is pinned for the same reason the
 * locale is: the server is in Singapore, so an unpinned clock would print a
 * time two hours off the newsroom's own.
 */
export function formatDeskDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' });
  const time = d
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' })
    .toLowerCase();
  return `${day}, ${time}`;
}

/** Subcontinental grouping (en-IN): 15,000 · 13,40,606 */
export function formatNumber(num: number, maxFractionDigits = 0): string {
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('en-IN', { maximumFractionDigits: maxFractionDigits });
}

/**
 * Format a per-unit rate (e.g. Tk/kWh) to exactly two decimals, TRUNCATING the
 * third decimal rather than rounding — so 6.517 renders as "6.51", not "6.52".
 * The intermediate toFixed(4) absorbs binary float error before the floor so a
 * value like 5.83 (stored as 5.8299999…) is not truncated down to "5.82".
 */
export function formatUnitRate(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const truncated = Math.floor(Number((value * 100).toFixed(4))) / 100;
  return truncated.toFixed(2);
}

/** Format a monetary BDT amount to exactly two decimal places. */
export function formatBdtAmount(value: number): string {
  if (!Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

export function extractKeywords(title: string, contentHtml: string): string[] {
  // Simple check to avoid import loops if called from validations
  const text = (title + ' ' + (contentHtml ? contentHtml.replace(/<[^>]+>/g, ' ') : ''))
    .toLowerCase()
    // Strip whole HTML entities first. Previously only &nbsp; was handled, so
    // the punctuation pass below shredded &#8217; / &#8220; into the bare
    // digits 8217 / 8220, which then ranked as top keywords and became tags.
    .replace(/&(?:#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, ' ')
    .replace(/[^\w\s\u0980-\u09ff-]/g, ' ')
    .replace(/\s+/g, ' ');

  const words = text
    .split(' ')
    // Bare numbers (years, quantities, figures from tables) are never useful
    // keywords and produce thin one-article tag pages.
    .filter(w => w.length >= 3 && !/^[\d-]+$/.test(w));

  const stopwords = new Set([
    'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'were', 'was', 'are', 'has', 'had',
    'will', 'would', 'shall', 'should', 'about', 'their', 'there', 'they', 'them', 'been', 'than',
    'more', 'most', 'some', 'many', 'other', 'into', 'over', 'both', 'only', 'such', 'very', 'even',
    'also', 'just', 'like', 'than', 'then', 'into', 'under', 'upon', 'through', 'after', 'before',
    'এবং', 'ও', 'কিন্তু', 'অথবা', 'জন্য', 'থেকে', 'করে', 'হয়ে', 'ছিল', 'আছে', 'হবে', 'করতে', 'করা'
  ]);
  
  const counts: Record<string, number> = {};
  for (const w of words) {
    if (stopwords.has(w)) continue;
    counts[w] = (counts[w] || 0) + 1;
  }
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
}

export function smartRearrangeText(text: string): string {
  if (!text) return '<p></p>';
  const sections = text.split(/\r?\n\s*\r?\n/);
  const paragraphs: string[] = [];

  for (const s of sections) {
    const cleanParagraph = s
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .join(' ');
      
    if (cleanParagraph) {
      paragraphs.push(cleanParagraph);
    }
  }

  return paragraphs.map(p => `<p>${p}</p>`).join('');
}

export function autoCalculateCategory(title: string, contentHtml: string, categories: string[]): string | null {
  if (categories.length === 0) return null;
  
  const text = (title + ' ' + (contentHtml ? contentHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ') : ''))
    .toLowerCase();

  const rules: { keywords: string[]; categoryMatch: string }[] = [
    {
      categoryMatch: 'power',
      keywords: ['power', 'grid', 'transmission', 'blackout', 'electricity', 'megawatt', 'mw', 'voltage', 'tariff', 'load-shedding', 'load shedding', 'substation', 'pgcb', 'bpdb', 'desco', 'dpdc']
    },
    {
      categoryMatch: 'energy',
      keywords: ['energy', 'gas', 'lng', 'coal', 'petroleum', 'oil', 'fuel', 'refinery', 'diesel', 'octane', 'bapex', 'petrobangla', 'pipeline', 'drilling', 'exploration']
    },
    {
      categoryMatch: 'solar',
      keywords: ['solar', 'renewable', 'wind', 'green', 'pv', 'panel', 'photovoltaic', 'biomass', 'hydro', 'clean energy', 'rooftop', 'net metering', 'sustainability']
    },
    {
      categoryMatch: 'finance',
      keywords: ['finance', 'tax', 'budget', 'bank', 'inflation', 'revenue', 'cost', 'dollar', 'investment', 'profit', 'trade', 'loan', 'subsidy', 'gdp', 'adp']
    },
    {
      categoryMatch: 'environment',
      keywords: ['environment', 'climate', 'carbon', 'emissions', 'warming', 'heatwave', 'flood', 'pollution', 'river', 'forest', 'disaster', 'temperature', 'cop26', 'cop27', 'cop28']
    },
    {
      categoryMatch: 'technology',
      keywords: ['technology', 'software', 'smart', 'digital', 'app', 'system', 'automation', 'meter', 'internet', 'fiber', 'network', 'data', 'ai', 'telecom']
    }
  ];

  const scores = categories.map((catName) => {
    const catLower = catName.toLowerCase();
    let score = 0;

    for (const rule of rules) {
      if (catLower.includes(rule.categoryMatch) || rule.categoryMatch.includes(catLower)) {
        for (const kw of rule.keywords) {
          const regex = new RegExp(`\\b${kw}\\b`, 'g');
          const matches = text.match(regex);
          if (matches) {
            score += matches.length * 2;
          }
        }
      }
    }

    const catNameRegex = new RegExp(`\\b${catLower}\\b`, 'g');
    const directMatches = text.match(catNameRegex);
    if (directMatches) {
      score += directMatches.length * 5;
    }

    const titleLower = title.toLowerCase();
    if (titleLower.includes(catLower)) {
      score += 15;
    }
    for (const rule of rules) {
      if (catLower.includes(rule.categoryMatch) || rule.categoryMatch.includes(catLower)) {
        for (const kw of rule.keywords) {
          if (titleLower.includes(kw)) {
            score += 8;
          }
        }
      }
    }

    return { name: catName, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].name : null;
}
