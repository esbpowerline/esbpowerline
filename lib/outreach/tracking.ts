import { createHmac } from 'node:crypto';

/**
 * Email open/click tracking for the ESB Banner Studio's outreach letters.
 *
 * The Studio mints a `message_key` per message at send time (22 random
 * base64url characters), points the letter's one remote image at
 * /api/o/{key} and rewrites allowlisted links through /r/{key}. Keys are not
 * secret and not registered in advance: an event whose key matches no
 * `outreach_sends.message_key` is simply never shown. So nothing here
 * authenticates anything; what it must guarantee is that the pixel always
 * renders, the redirect is never an open redirect, and a visitor's IP is never
 * stored. The contract both sides build against is
 * OUTREACH_SYNC_CONTRACT.md §2 (kept with the Studio).
 *
 * Pure apart from node:crypto, so every rule is unit-testable without a
 * request scope or a database.
 */

/** 22 base64url characters — exactly what the Studio generates. */
export const TRACKING_KEY_RE = /^[A-Za-z0-9_-]{22}$/;

/**
 * The only hosts /r/ will send anyone to. Matched exactly against the parsed
 * hostname, never by suffix or substring, so `esbpowerline.com.evil.com` and
 * `evil.com/?u=esbpowerline.com` both miss. Mirrored by the Studio's link
 * rewriter; change both or neither.
 */
export const CLICK_HOST_ALLOWLIST: ReadonlySet<string> = new Set([
  'esbpowerline.com',
  'www.esbpowerline.com',
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'wa.me',
  'api.whatsapp.com',
]);

/** Where anything that is not an allowlisted https URL is sent instead. */
export const FALLBACK_REDIRECT = 'https://esbpowerline.com/';

const MAX_TARGET_LENGTH = 2048;
const MAX_LINK_LENGTH = 500;
const MAX_UA_LENGTH = 200;
const CAMPAIGN_ID_RE = /^[A-Za-z0-9_.:-]{1,100}$/;

/**
 * Accepts `key` or `key.gif` (some clients only load an image whose URL looks
 * like one). Returns the key when it is well-formed, otherwise null.
 */
export function parseTrackingKey(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const key = raw.endsWith('.gif') ? raw.slice(0, -4) : raw;
  return TRACKING_KEY_RE.test(key) ? key : null;
}

/** `?c=` is optional and informational; anything odd is dropped, not stored. */
export function parseCampaignId(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  return CAMPAIGN_ID_RE.test(raw) ? raw : null;
}

/**
 * The redirect target, or null when it must not be followed.
 *
 * Only `https:`, only an allowlisted hostname, no credentials (the
 * `https://esbpowerline.com@evil.com` trick puts the real host after the `@`;
 * the parser sees `evil.com`, but a URL carrying userinfo is refused outright
 * anyway), no explicit port. The target's own query string — the UTM tags —
 * is kept exactly as sent.
 */
export function resolveClickTarget(raw: string | null | undefined): URL | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_TARGET_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username !== '' || url.password !== '') return null;
  if (url.port !== '') return null;
  if (!CLICK_HOST_ALLOWLIST.has(url.hostname.toLowerCase())) return null;
  return url;
}

/** What a click event records about its target: host + path, never the query. */
export function clickLinkLabel(url: URL): string {
  return `${url.hostname.toLowerCase()}${url.pathname}`.slice(0, MAX_LINK_LENGTH);
}

export function truncateUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null;
  return ua.slice(0, MAX_UA_LENGTH);
}

/**
 * A keyed SHA-256 (HMAC) of the client IP, so repeat opens from one address
 * can be told apart from many readers without the address itself ever being
 * stored. The key is the deployment's AUTH_SECRET, which production already
 * requires to be long and random (lib/env-auth.ts); without it — a dev
 * machine — a fixed app-level salt stands in. Rotating AUTH_SECRET only means
 * old and new hashes of one IP no longer match, which costs nothing here.
 */
const FALLBACK_IP_SALT = 'esbpowerline-outreach-ip-v1';

export function hashIp(ip: string | null | undefined, secret: string | undefined = process.env.AUTH_SECRET): string | null {
  if (!ip || ip === 'unknown') return null;
  const key = secret?.trim() || FALLBACK_IP_SALT;
  return createHmac('sha256', key).update(`outreach-ip:v1:${ip}`).digest('hex');
}

/** The canonical 43-byte 1x1 transparent GIF89a. */
export const TRANSPARENT_GIF = Uint8Array.from(
  Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64'),
);

const NO_STORE = 'no-store, max-age=0';

/** Shared by both routes: nothing may be cached, by a browser or a mail proxy. */
function trackingHeaders(extra: Record<string, string>): Headers {
  return new Headers({
    'Cache-Control': NO_STORE,
    Pragma: 'no-cache',
    Expires: '0',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
    ...extra,
  });
}

export function gifResponse(): Response {
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: trackingHeaders({
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_GIF.byteLength),
    }),
  });
}

export function redirectResponse(location: string): Response {
  return new Response(null, { status: 302, headers: trackingHeaders({ Location: location }) });
}

export type OutreachEventRow = {
  message_key: string;
  campaign_id: string | null;
  type: 'open' | 'click';
  link: string | null;
  ua: string | null;
  ip_hash: string | null;
};

export type EventWriter = (row: OutreachEventRow) => Promise<void>;

/**
 * Best-effort: a slow or failing database must never delay the image past a
 * mail client's patience or turn it into an error. Every failure — a throw, a
 * rejected promise, a timeout — is swallowed here.
 */
export async function recordBestEffort(write: EventWriter, row: OutreachEventRow, timeoutMs = 1500): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(() => write(row)),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeoutMs);
      }),
    ]);
  } catch {
    // Tracking is approximate by design; losing one event is acceptable.
  } finally {
    if (timer) clearTimeout(timer);
  }
}
