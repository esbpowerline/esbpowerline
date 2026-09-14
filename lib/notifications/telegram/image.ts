import 'server-only';

/**
 * The article's own image, made safe to upload to Telegram.
 *
 * Telegram is never handed a URL to fetch. Two reasons, both from this repo's
 * history: every upload is WebP (media-storage.ts), which Telegram's photo
 * fetcher does not reliably accept, and scrapers pulling images straight from
 * the Supabase bucket exhausted its egress quota on 2026-09-02 (lib/seo.ts).
 * So the processor fetches the image once, re-encodes it to a JPEG no larger
 * than Telegram needs, and uploads the bytes.
 *
 * `imageUrl` is editor-supplied, so the fetch is restricted to ESB's own hosts
 * over HTTPS. Anything else is refused, which makes this code useless as a way
 * to make the server request an arbitrary address.
 *
 * Every failure returns a reason instead of throwing: a missing, unreachable,
 * oversized or undecodable image means a text post, never a missing post.
 */

import { normalizeArticleImageUrl } from '@/lib/article-image';

export type PreparedPhoto =
  | { ok: true; bytes: Uint8Array; filename: string }
  | { ok: false; reason: string };

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 9 * 1024 * 1024; // Telegram's photo limit is 10 MB
const EDGE_PX = 1280;
const FETCH_TIMEOUT_MS = 10_000;

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(['esbpowerline.com', 'www.esbpowerline.com']);
  for (const v of [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SITE_URL]) {
    try {
      if (v) hosts.add(new URL(v).host);
    } catch {
      /* ignore a malformed variable */
    }
  }
  return hosts;
}

export function isAllowedImageUrl(raw: string, hosts: Set<string> = allowedHosts()): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && hosts.has(u.host);
  } catch {
    return false;
  }
}

async function readCapped(res: Response, cap: number): Promise<Uint8Array | null> {
  const declared = Number(res.headers.get('content-length') ?? '0');
  if (declared > cap) return null;
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > cap) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function prepareArticlePhoto(
  imageUrl: string | null,
  opts: { fetchImpl?: typeof fetch; slug?: string } = {},
): Promise<PreparedPhoto> {
  const url = normalizeArticleImageUrl(imageUrl);
  if (!url) return { ok: false, reason: 'no image' };
  if (!isAllowedImageUrl(url)) return { ok: false, reason: 'image host not allowed' };

  let res: Response;
  try {
    res = await (opts.fetchImpl ?? fetch)(url, {
      headers: { 'User-Agent': 'ESBPowerLine-Notifier/1.0 (+https://esbpowerline.com)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'image unreachable' };
  }
  if (!res.ok) return { ok: false, reason: `image HTTP ${res.status}` };
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) return { ok: false, reason: `not an image (${type || 'no content-type'})` };

  const source = await readCapped(res, MAX_SOURCE_BYTES);
  if (!source) return { ok: false, reason: 'image too large' };

  try {
    const sharp = (await import('sharp')).default;
    const jpeg = await sharp(source, { failOn: 'error' })
      .rotate()
      .resize({ width: EDGE_PX, height: EDGE_PX, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    if (jpeg.byteLength > MAX_OUTPUT_BYTES) return { ok: false, reason: 'encoded image too large' };
    const base = (opts.slug ?? 'esb-powerline').replace(/[^a-z0-9-]/gi, '').slice(0, 60) || 'esb-powerline';
    return { ok: true, bytes: new Uint8Array(jpeg), filename: `${base}.jpg` };
  } catch {
    return { ok: false, reason: 'image could not be decoded' };
  }
}
