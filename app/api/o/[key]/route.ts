import { recordOutreachEvent } from '@/lib/outreach/record-event.server';
import { gifResponse, parseCampaignId, parseTrackingKey } from '@/lib/outreach/tracking';

/**
 * Open pixel for Studio outreach letters: GET /api/o/{key} or /api/o/{key}.gif.
 *
 * Always answers the same 1x1 transparent GIF, uncacheable, whatever the key
 * and whatever the database is doing — a broken image in a letter is worse
 * than a lost open. A well-formed key records an `open` (best-effort). No
 * auth, no cookies; excluded from the middleware matcher so no session is
 * refreshed onto the response. Mail proxies (GoogleImageProxy, Apple MPP)
 * count as opens on purpose; the Studio labels them "Opened (approx.)".
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    const { key: raw } = await ctx.params;
    const key = parseTrackingKey(raw);
    if (key) {
      const campaign = parseCampaignId(new URL(request.url).searchParams.get('c'));
      await recordOutreachEvent(request, { message_key: key, campaign_id: campaign, type: 'open', link: null });
    }
  } catch {
    // never fail the image
  }
  return gifResponse();
}
