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

export const DEFAULT_INTERVIEWS: Interview[] = [
  {
    id: 'yt-smart-grid-2026',
    title: 'Exclusive: The Future of Bangladesh\'s National Grid and Smart Transmission Networks',
    guest: 'Dr. Tariq Rahman',
    role: 'Grid Modernization Specialist',
    duration: '15:24',
    date: 'Jun 24',
    thumbnail: '/images/yt_tm_1.jpg',
    youtubeId: '9ngsY7vBm_Y',
    excerpt: 'An in-depth discussion on shifting from conventional to digital substations, minimizing transmission losses, and integrating grid-scale solar.',
  },
  {
    id: 'yt-lng-crisis-2026',
    title: 'Addressing the Fuel Crisis: LNG Imports, Domestic Gas Exploration & Policy Reforms',
    guest: 'Nasrul Hamid',
    role: 'Energy Policy Advisor',
    duration: '18:40',
    date: 'Jun 18',
    thumbnail: '/images/yt_tm_2.jpg',
    youtubeId: 'VWAOGfPdLcE',
    excerpt: 'Can Bangladesh secure long-term energy stability? Exploring strategic terminal expansion, import costs, and deep-sea exploration prospects.',
  },
  {
    id: 'yt-green-energy-2041',
    title: 'Scaling Renewables: Transitioning to 40% Green Energy by 2041',
    guest: 'Fahmida Khatun',
    role: 'Renewable Energy Director',
    duration: '12:15',
    date: 'Jun 10',
    thumbnail: '/images/yt_tm_3.jpg',
    youtubeId: '4HwoHJshSt8',
    excerpt: 'A critical analysis of the incentives, land availability constraints, and corporate power purchase agreements driving the green transition.',
  },
  {
    id: 'yt-cross-border-trade',
    title: 'The Cross-Border Power Trade: Importing Hydroelectricity from Nepal and Bhutan',
    guest: 'Salehuddin Ahmed',
    role: 'Regional Trade Economist',
    duration: '14:50',
    date: 'May 28',
    thumbnail: '/images/yt_tm_1.jpg',
    youtubeId: 'd37OcTjLv9Q',
    excerpt: 'How regional grid connectivity and tripartite agreements will help Bangladesh secure clean, low-cost hydropower from the Himalayas.',
  },
];

/**
 * Interviews pinned to the front of the rail, newest-first left to right.
 *
 * Titles, guest and role are taken verbatim from each video's own Open Graph
 * data — nothing here is written by us. Facebook truncates the guest's full
 * description ("... ও সাবেক সহ-সভাপতি, …"), so `role` stops at the part the
 * source actually states. Duration and publish date are not exposed by
 * Facebook's metadata, hence the em dash.
 *
 * Thumbnails are copied into /public because fbcdn URLs are signed and expire.
 */
export const PINNED_INTERVIEWS: Interview[] = [
  {
    id: 'fb-express-talk-manpower-1',
    title: 'Manpower Export: Crisis and Potential — Express Talk',
    guest: 'Alhaj A K M Moazzem Hossain',
    role: 'Chairman & Managing Director, Anik Industrial Enterprise Ltd',
    programme: 'Express Talk',
    duration: '38:53',
    date: 'Jul 19',
    thumbnail: '/images/interviews/express-talk-manpower-part1.jpg',
    youtubeId: '',
    excerpt: 'Part one of Express Talk on the crisis and the potential in Bangladesh’s manpower export.',
    provider: 'facebook',
    videoUrl: 'https://www.facebook.com/newsexpressofficial/videos/970961285991321/',
  },
  {
    id: 'fb-express-talk-manpower-2',
    title: 'Manpower Export: Crisis and Potential, Part 2 — Express Talk',
    guest: 'Alhaj A K M Moazzem Hossain',
    role: 'Chairman & Managing Director, Anik Industrial Enterprise Ltd',
    programme: 'Express Talk',
    duration: '34:24',
    date: 'Jul 21',
    thumbnail: '/images/interviews/express-talk-manpower-part2.jpg',
    youtubeId: '',
    excerpt: 'The second part of the same conversation.',
    provider: 'facebook',
    videoUrl: 'https://www.facebook.com/newsexpressofficial/videos/1598169481936488/',
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

/** Accept a bare ID or a full YouTube URL from admin settings. */
export function extractYoutubeId(raw: string | undefined): string | null {
  const value = raw?.trim() ?? '';
  if (!value) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function normalizeInterviewEntry(raw: unknown, index: number): Interview | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Partial<Interview>;
  const youtubeId = extractYoutubeId(item.youtubeId) ?? '';
  const provider = item.provider === 'facebook' ? 'facebook' : 'youtube';
  const videoUrl = item.videoUrl?.trim() || '';
  const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `interview-${index + 1}`;

  // A Facebook entry has no youtubeId, so it must not be dropped for lacking one.
  const playable = provider === 'facebook' ? !!videoUrl : !!youtubeId;
  if (!playable && !item.title?.trim() && !item.guest?.trim()) return null;

  return {
    id,
    title: item.title?.trim() || 'Untitled interview',
    guest: item.guest?.trim() || 'Guest',
    role: item.role?.trim() || 'Energy sector',
    duration: item.duration?.trim() || '—',
    date: item.date?.trim() || '',
    thumbnail: encodeInterviewAssetUrl(item.thumbnail?.trim() || '/images/yt_tm_1.jpg'),
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