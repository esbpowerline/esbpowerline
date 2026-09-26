export type Interview = {
  id: string;
  title: string;
  guest: string;
  role: string;
  duration: string;
  date: string;
  thumbnail: string;
  /** Empty for entries that live on another platform — see `videoUrl`. */
  youtubeId: string;
  excerpt: string;
  /**
   * Short label for the card's cramped role chip — a programme or series name.
   * The card prefers this over `role`, which is often a full job title too long
   * to fit; the player modal always shows the full `role`.
   */
  programme?: string;
  /** Defaults to 'youtube' when absent, so existing entries are unaffected. */
  provider?: 'youtube' | 'facebook';
  /** Canonical watch URL. Required for Facebook, which has no short id we can embed by. */
  videoUrl?: string;
};

/**
 * The YouTube half of the rail: the current channel's own uploads, from its
 * official feed (youtube.com/feeds/videos.xml, channel UCkf1jM8-ebkMnYaGftvj6OA,
 * @esbplbd). Titles are the videos' own, verbatim. The feed gives no duration.
 *
 * Replaced 2026-09-16. The four entries before this paired invented
 * energy-sector titles and guests ("Dr. Tariq Rahman, Grid Modernization
 * Specialist") with real video ids from the old @ESBPowerLine channel — and
 * those ids opened unrelated political videos. A card must describe the video
 * it plays, in that video's words.
 */
export const DEFAULT_INTERVIEWS: Interview[] = [
  {
    id: 'yt-P2_wGjesKQ',
    title: 'সক্ষমতা আছে, উৎপাদন নেই—বাড়ছে লোকসান ড  এনামুল হক',
    guest: 'ESB Power Line',
    role: 'YouTube',
    duration: '—',
    date: 'Sep 14',
    thumbnail: '/images/interviews/youtube-2026-09-14.jpg',
    youtubeId: '-P2_wGjesKQ',
    excerpt: '',
  },
  {
    id: 'yt-0PpigU6MgLk',
    title: 'সিপিডির আলোচনা সভায় শিল্পপতিদের গ্যাসও বিদ্যুৎ নিয়ে আলোচনা',
    guest: 'ESB Power Line',
    role: 'YouTube Short',
    duration: '—',
    date: 'Sep 13',
    thumbnail: '/images/interviews/youtube-2026-09-13-short.jpg',
    youtubeId: '0PpigU6MgLk',
    excerpt: '',
  },
];

/**
 * Interviews pinned to the front of the rail, newest-first left to right.
 *
 * Every field is copied from the video's own Open Graph data, in the words and
 * spelling it uses (including "জালানী") — nothing here is written by us.
 * Facebook canonicalises this to News Express's page. Facebook's metadata
 * exposes no duration or publish date, so both are left absent rather than guessed.
 *
 * Thumbnails are copied into /public because fbcdn URLs are signed and expire.
 */
export const PINNED_INTERVIEWS: Interview[] = [
  {
    id: 'fb-express-talk-energy-crisis',
    title: 'বর্তমান জ্বালানী সংকট ও উত্তরনের উপায়',
    guest: 'অধ্যাপক আনু মুহাম্মদ',
    role: 'অর্থনীতি ও জালানী বিশেষজ্ঞ',
    programme: 'এক্সপ্রেস টক',
    duration: '—',
    date: '',
    thumbnail: '/images/interviews/express-talk-energy-crisis.jpg',
    youtubeId: '',
    excerpt: 'উপস্থাপনা- ফরিদ উদ্দিন আহমেদ · সৌজন্যে- নিউজ এক্সপ্রেস ও ইএসবি পাওয়ার লাইন',
    provider: 'facebook',
    videoUrl: 'https://www.facebook.com/esbpowerlineofficial/videos/28273693645615960',
  },
];

/** The rail holds one row — more than this spills into a ragged second row. */
export const INTERVIEW_RAIL_LIMIT = 4;

/**
 * Put the pinned interviews first, then whatever the channel feed returned,
 * de-duplicated so a pinned video can never appear twice, and capped so the
 * rail shows a single tidy row.
 */
export function withPinnedInterviews(list: Interview[], limit = INTERVIEW_RAIL_LIMIT): Interview[] {
  const pinnedIds = new Set(PINNED_INTERVIEWS.map((i) => i.id));
  return [...PINNED_INTERVIEWS, ...list.filter((i) => !pinnedIds.has(i.id))].slice(0, limit);
}

/** Encode local asset paths that may contain spaces or special characters. */
export function encodeInterviewAssetUrl(url: string): string {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return encodeURI(trimmed);
}

/** Accept a bare ID or a full YouTube/Shorts URL from admin settings or imports. */
export function extractYoutubeId(raw: string | undefined): string | null {
  const value = raw?.trim() ?? '';
  if (!value) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function getYoutubeThumbnailUrl(youtubeId: string): string {
  const id = extractYoutubeId(youtubeId);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

function normalizeInterviewEntry(raw: unknown, index: number): Interview | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Partial<Interview>;
  const provider = item.provider === 'facebook' ? 'facebook' : 'youtube';
  const rawYoutube = (item.youtubeId || (provider === 'youtube' ? item.videoUrl : '')) ?? '';
  const youtubeId = extractYoutubeId(rawYoutube) ?? '';
  const videoUrl = item.videoUrl?.trim() || '';
  const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `interview-${index + 1}`;

  // A Facebook entry has no youtubeId, so it must not be dropped for lacking one.
  const playable = provider === 'facebook' ? !!videoUrl : !!youtubeId;
  if (!playable && !item.title?.trim() && !item.guest?.trim()) return null;

  const thumbnailFallback = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : '/images/yt_tm_1.jpg';

  return {
    id,
    title: item.title?.trim() || 'Untitled interview',
    guest: item.guest?.trim() || 'Guest',
    role: item.role?.trim() || 'Energy sector',
    duration: item.duration?.trim() || '—',
    date: item.date?.trim() || '',
    thumbnail: encodeInterviewAssetUrl(item.thumbnail?.trim() || thumbnailFallback),
    youtubeId,
    excerpt: item.excerpt?.trim() || '',
    provider,
    ...(item.programme?.trim() ? { programme: item.programme.trim() } : {}),
    ...(videoUrl ? { videoUrl } : {}),
  };
}

/** Coerce CMS/Prisma JSON into a safe interview list for the homepage. */
export function normalizeInterviews(source: unknown): Interview[] {
  const rows = Array.isArray(source) ? source : [];
  const normalized = rows
    .map((row, index) => normalizeInterviewEntry(row, index))
    .filter((row): row is Interview => row !== null);

  return normalized.length > 0 ? normalized : DEFAULT_INTERVIEWS;
}

export function isLegacyDummyInterviews(list: unknown): boolean {
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item.youtubeId === 'dQw4w9wgxcQ' ||
        item.guest === 'Dr. Shahana Rahman' ||
        item.title?.includes('SREDA’s 2030 Renewable Roadmap') ||
        item.title?.includes("SREDA's 2030 Renewable Roadmap")),
  );
}

/**
 * Resolves interviews for display on the homepage.
 * If the admin has configured interviews in Site Settings (non-empty list of valid interviews),
 * those configured interviews take full precedence in real time.
 * If no configured interviews exist in settings, falls back to pinned interviews + fallback YouTube feed.
 */
export function resolveHomepageInterviews(
  configuredInterviews: unknown,
  fallbackInterviews: Interview[] = DEFAULT_INTERVIEWS,
  limit = INTERVIEW_RAIL_LIMIT,
): Interview[] {
  if (
    Array.isArray(configuredInterviews) &&
    configuredInterviews.length > 0 &&
    !isLegacyDummyInterviews(configuredInterviews)
  ) {
    const normalized = configuredInterviews
      .map((row, index) => normalizeInterviewEntry(row, index))
      .filter((row): row is Interview => row !== null);
    if (normalized.length > 0) {
      return normalized.slice(0, limit);
    }
  }

  return withPinnedInterviews(normalizeInterviews(fallbackInterviews), limit);
}

/**
 * Facebook has no embeddable short id — its video plugin takes the full watch
 * URL. Needs `https://www.facebook.com` in the CSP frame-src to render.
 */
export function facebookEmbedUrl(videoUrl: string, autoplay = true): string {
  const href = videoUrl?.trim();
  if (!href) return '';
  const params = new URLSearchParams({
    href,
    show_text: 'false',
    autoplay: autoplay ? 'true' : 'false',
    allowfullscreen: 'true',
  });
  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}

/** The right embed for whichever platform an interview lives on. */
export function interviewEmbedUrl(interview: Interview, autoplay = true): string {
  if (interview.provider === 'facebook') return facebookEmbedUrl(interview.videoUrl ?? '', autoplay);
  return youtubeEmbedUrl(interview.youtubeId, autoplay);
}

export function youtubeEmbedUrl(youtubeId: string, autoplay = true): string {
  const id = extractYoutubeId(youtubeId);
  if (!id) return '';
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}