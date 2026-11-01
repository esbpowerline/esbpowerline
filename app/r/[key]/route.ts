import { recordOutreachEvent } from '@/lib/outreach/record-event.server';
import {
  FALLBACK_REDIRECT,
  clickLinkLabel,
  parseCampaignId,
  parseTrackingKey,
  redirectResponse,
  resolveClickTarget,
} from '@/lib/outreach/tracking';

/**
 * Click redirect for Studio outreach letters: GET /r/{key}?u={url}&c={campaign}.
 *
 * Never an open redirect. `u` is followed only when it parses as an https URL
 * whose hostname is exactly on CLICK_HOST_ALLOWLIST (lib/outreach/tracking.ts);
 * anything else — another host, http, javascript:, userinfo, a missing or
 * garbled `u` — goes to the homepage. The target's own query (UTM) is kept as
 * sent. A click is recorded only for a well-formed key AND an allowed target,
 * best-effort, and only host + path are stored. No auth, no cookies; outside
 * the middleware matcher.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, ctx: { params: Promise<{ key: string }> }) {
  let location = FALLBACK_REDIRECT;
  try {
    const url = new URL(request.url);
    const target = resolveClickTarget(url.searchParams.get('u'));
    if (target) {
      location = target.href;
      const { key: raw } = await ctx.params;
      const key = parseTrackingKey(raw);
      if (key) {
        await recordOutreachEvent(request, {
          message_key: key,
          campaign_id: parseCampaignId(url.searchParams.get('c')),
          type: 'click',
          link: clickLinkLabel(target),
        });
      }
    }
  } catch {
    // a failure after the target was resolved still sends the reader on
  }
  return redirectResponse(location);
}
