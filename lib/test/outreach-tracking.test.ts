import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Outreach open pixel (/api/o/{key}) and click redirect (/r/{key}).
 *
 * The three promises these routes make, each pinned below: the image always
 * renders, the redirect is never an open redirect, and the database can fail
 * in any way without either response noticing.
 */

const db = vi.hoisted(() => ({
  insert: vi.fn(),
  client: null as null | { from: (t: string) => { insert: (row: unknown) => unknown } },
}));
vi.mock('@/lib/supabase/admin-client', () => ({
  createServiceRoleClient: () => db.client,
}));

import {
  CLICK_HOST_ALLOWLIST,
  FALLBACK_REDIRECT,
  TRANSPARENT_GIF,
  clickLinkLabel,
  hashIp,
  parseCampaignId,
  parseTrackingKey,
  recordBestEffort,
  resolveClickTarget,
  truncateUserAgent,
} from '@/lib/outreach/tracking';
import { GET as openPixel } from '@/app/api/o/[key]/route';
import { GET as clickRedirect } from '@/app/r/[key]/route';

const KEY = 'AbCdEfGhIjKlMnOpQrSt_-';
let ipCounter = 0;

function ctx(key: string) {
  return { params: Promise.resolve({ key }) };
}
function req(url: string, headers: Record<string, string> = {}) {
  // A fresh IP per request so the per-IP limiter never interferes across tests.
  ipCounter += 1;
  return new Request(url, {
    headers: { 'x-vercel-forwarded-for': `203.0.113.${ipCounter % 250}`, 'user-agent': 'TestAgent/1.0', ...headers },
  });
}

beforeEach(() => {
  db.insert.mockReset().mockResolvedValue({ error: null });
  db.client = { from: () => ({ insert: db.insert }) };
});
afterEach(() => vi.restoreAllMocks());

describe('tracking key validation', () => {
  it('accepts exactly 22 base64url characters, with or without .gif', () => {
    expect(parseTrackingKey(KEY)).toBe(KEY);
    expect(parseTrackingKey(`${KEY}.gif`)).toBe(KEY);
  });

  it.each([
    ['too short', KEY.slice(1)],
    ['too long', `${KEY}A`],
    ['standard base64 +', `${KEY.slice(0, 21)}+`],
    ['standard base64 /', `${KEY.slice(0, 21)}/`],
    ['padding', `${KEY.slice(0, 21)}=`],
    ['dot inside', `${KEY.slice(0, 21)}.`],
    ['other extension', `${KEY}.png`],
    ['double gif', `${KEY}.gif.gif`],
    ['empty', ''],
    ['sql-ish', "'; drop table x;--aaaaa"],
  ])('rejects %s', (_label, raw) => {
    expect(parseTrackingKey(raw)).toBeNull();
  });

  it('rejects non-strings', () => {
    expect(parseTrackingKey(undefined)).toBeNull();
    expect(parseTrackingKey(null)).toBeNull();
  });

  it('keeps a plain campaign id and drops anything odd', () => {
    expect(parseCampaignId('cmp_2026-11:a.b')).toBe('cmp_2026-11:a.b');
    expect(parseCampaignId('<script>')).toBeNull();
    expect(parseCampaignId('a'.repeat(101))).toBeNull();
    expect(parseCampaignId(null)).toBeNull();
  });
});

describe('click allowlist', () => {
  it('follows every allowlisted host over https', () => {
    for (const host of CLICK_HOST_ALLOWLIST) {
      expect(resolveClickTarget(`https://${host}/some/path`)?.hostname).toBe(host);
    }
  });

  it('keeps the target query string (UTM) intact', () => {
    const t = resolveClickTarget('https://esbpowerline.com/articles/x?utm_source=email&utm_campaign=nov%20launch#top');
    expect(t?.href).toBe('https://esbpowerline.com/articles/x?utm_source=email&utm_campaign=nov%20launch#top');
  });

  it('matches the hostname case-insensitively', () => {
    expect(resolveClickTarget('https://WWW.ESBPowerLine.com/')).not.toBeNull();
  });

  it.each([
    ['suffix trick', 'https://esbpowerline.com.evil.com/'],
    ['host in query', 'https://evil.com/?u=esbpowerline.com'],
    ['host in path', 'https://evil.com/esbpowerline.com'],
    ['userinfo trick', 'https://esbpowerline.com@evil.com/'],
    ['userinfo on an allowed host', 'https://user:pass@esbpowerline.com/'],
    ['javascript:', 'javascript:alert(1)'],
    ['javascript: dressed as the host', 'javascript://esbpowerline.com/%0Aalert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['plain http', 'http://esbpowerline.com/'],
    ['protocol-relative', '//esbpowerline.com/'],
    ['relative path', '/articles'],
    ['explicit port', 'https://esbpowerline.com:8443/'],
    ['subdomain not listed', 'https://cms.esbpowerline.com/'],
    ['lookalike', 'https://esbpowerline.co/'],
    ['facebook suffix', 'https://notfacebook.com/'],
    ['backslash trick', 'https://evil.com\\@esbpowerline.com/'],
    ['empty', ''],
    ['garbage', 'not a url'],
  ])('refuses %s', (_label, raw) => {
    expect(resolveClickTarget(raw)).toBeNull();
  });

  it('refuses an oversized target', () => {
    expect(resolveClickTarget(`https://esbpowerline.com/${'a'.repeat(2100)}`)).toBeNull();
  });

  it('labels a click with host and path only, never the query', () => {
    const t = resolveClickTarget('https://www.youtube.com/watch?v=abc&utm_source=email')!;
    expect(clickLinkLabel(t)).toBe('www.youtube.com/watch');
  });
});

describe('privacy helpers', () => {
  it('truncates the user agent to 200 characters', () => {
    expect(truncateUserAgent('x'.repeat(500))).toHaveLength(200);
    expect(truncateUserAgent('')).toBeNull();
    expect(truncateUserAgent(null)).toBeNull();
  });

  it('hashes the IP with a key and never returns it', () => {
    const h = hashIp('198.51.100.7', 'secret-a');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain('198.51.100.7');
    expect(hashIp('198.51.100.7', 'secret-a')).toBe(h);
    expect(hashIp('198.51.100.7', 'secret-b')).not.toBe(h);
    expect(hashIp('198.51.100.7', undefined)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp('unknown')).toBeNull();
    expect(hashIp(null)).toBeNull();
  });
});

describe('the open pixel', () => {
  async function expectGif(res: Response) {
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/gif');
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(res.headers.get('set-cookie')).toBeNull();
    const body = new Uint8Array(await res.arrayBuffer());
    expect(body).toEqual(TRANSPARENT_GIF);
    expect(body.byteLength).toBe(43);
    expect(new TextDecoder().decode(body.slice(0, 6))).toBe('GIF89a');
  }

  it('answers the GIF and records an open for a valid key', async () => {
    const res = await openPixel(req(`https://esbpowerline.com/api/o/${KEY}?c=cmp1`), ctx(KEY));
    await expectGif(res);
    expect(db.insert).toHaveBeenCalledOnce();
    const row = db.insert.mock.calls[0][0];
    expect(row).toMatchObject({ message_key: KEY, campaign_id: 'cmp1', type: 'open', link: null, ua: 'TestAgent/1.0' });
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain('203.0.113.');
  });

  it('accepts the .gif form', async () => {
    await expectGif(await openPixel(req(`https://esbpowerline.com/api/o/${KEY}.gif`), ctx(`${KEY}.gif`)));
    expect(db.insert.mock.calls[0][0]).toMatchObject({ message_key: KEY, campaign_id: null });
  });

  it('answers the GIF but records nothing for a bad key', async () => {
    await expectGif(await openPixel(req('https://esbpowerline.com/api/o/short'), ctx('short')));
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('still answers the GIF when the insert returns an error', async () => {
    db.insert.mockResolvedValue({ error: { message: 'relation does not exist' } });
    await expectGif(await openPixel(req(`https://esbpowerline.com/api/o/${KEY}`), ctx(KEY)));
  });

  it('still answers the GIF when the client throws', async () => {
    db.insert.mockImplementation(() => {
      throw new Error('pooler exhausted');
    });
    await expectGif(await openPixel(req(`https://esbpowerline.com/api/o/${KEY}`), ctx(KEY)));
  });

  it('still answers the GIF when the service role is not configured', async () => {
    db.client = null;
    await expectGif(await openPixel(req(`https://esbpowerline.com/api/o/${KEY}`), ctx(KEY)));
  });

  it('does not wait on a hung database', async () => {
    db.insert.mockReturnValue(new Promise(() => {}));
    const started = Date.now();
    await expectGif(await openPixel(req(`https://esbpowerline.com/api/o/${KEY}`), ctx(KEY)));
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('still answers the GIF when the params promise rejects', async () => {
    await expectGif(await openPixel(req(`https://esbpowerline.com/api/o/${KEY}`), { params: Promise.reject(new Error('x')) }));
  });

  it('stops recording, but keeps answering, past the per-IP ceiling', async () => {
    const headers = { 'x-vercel-forwarded-for': '192.0.2.99' };
    for (let i = 0; i < 70; i++) {
      await expectGif(await openPixel(req(`https://esbpowerline.com/api/o/${KEY}`, headers), ctx(KEY)));
    }
    expect(db.insert).toHaveBeenCalledTimes(60);
  });
});

describe('the click redirect', () => {
  const r = (u: string | null, key = KEY) => {
    const qs = u === null ? '?c=cmp1' : `?u=${encodeURIComponent(u)}&c=cmp1`;
    return clickRedirect(req(`https://esbpowerline.com/r/${key}${qs}`), ctx(key));
  };

  function expectRedirect(res: Response, location: string) {
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(location);
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(res.headers.get('set-cookie')).toBeNull();
  }

  it('sends an allowlisted target on, query intact, and records the click', async () => {
    const target = 'https://www.facebook.com/esbpowerline?utm_source=email&utm_medium=outreach';
    expectRedirect(await r(target), target);
    expect(db.insert).toHaveBeenCalledOnce();
    expect(db.insert.mock.calls[0][0]).toMatchObject({
      message_key: KEY,
      campaign_id: 'cmp1',
      type: 'click',
      link: 'www.facebook.com/esbpowerline',
    });
  });

  it.each([
    'https://esbpowerline.com.evil.com/',
    'https://evil.com/?u=esbpowerline.com',
    'https://esbpowerline.com@evil.com/',
    'javascript:alert(1)',
    'http://esbpowerline.com/',
    'https://example.org/',
  ])('falls back to the homepage for %s and records nothing', async (target) => {
    expectRedirect(await r(target), FALLBACK_REDIRECT);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('falls back when u is missing', async () => {
    expectRedirect(await r(null), FALLBACK_REDIRECT);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('follows an allowed target but records nothing for a bad key', async () => {
    expectRedirect(await r('https://wa.me/8801000000000', 'bad'), 'https://wa.me/8801000000000');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('still redirects to the target when the database fails', async () => {
    db.insert.mockRejectedValue(new Error('connection reset'));
    expectRedirect(await r('https://youtu.be/abc'), 'https://youtu.be/abc');
  });
});

describe('recordBestEffort', () => {
  const row = { message_key: KEY, campaign_id: null, type: 'open' as const, link: null, ua: null, ip_hash: null };

  it('swallows a synchronous throw and a rejection', async () => {
    await expect(recordBestEffort(() => { throw new Error('x'); }, row)).resolves.toBeUndefined();
    await expect(recordBestEffort(() => Promise.reject(new Error('y')), row)).resolves.toBeUndefined();
  });

  it('gives up after the timeout', async () => {
    const started = Date.now();
    await recordBestEffort(() => new Promise(() => {}), row, 50);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('no platform rule caches the tracking routes', () => {
  // vercel.json gives every unlisted /api/* path `public, s-maxage=60`. On the
  // pixel that would let the CDN answer repeat opens without the function, and
  // contradict the route's own no-store. The paths are excluded there; this
  // pins it. Sources are path patterns whose regex groups read as plain regex.
  it('leaves Cache-Control on /api/o and /r to the routes themselves', async () => {
    const { readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const config = JSON.parse(readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8')) as {
      headers?: { source: string; headers: { key: string }[] }[];
    };
    for (const p of [`/api/o/${KEY}`, `/api/o/${KEY}.gif`, `/r/${KEY}`]) {
      const caching = (config.headers ?? []).filter(
        (rule) =>
          new RegExp(`^${rule.source}$`).test(p) &&
          rule.headers.some((h) => h.key.toLowerCase() === 'cache-control'),
      );
      expect(caching.map((r) => r.source), p).toEqual([]);
    }
    // ...while the rule still covers its ordinary API paths.
    const generic = config.headers!.find((r) => r.source.startsWith('/api/((?!admin'))!;
    expect(new RegExp(`^${generic.source}$`).test('/api/market/quotes')).toBe(true);
  });
});
