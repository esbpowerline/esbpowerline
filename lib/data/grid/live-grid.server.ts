import 'server-only';
import https from 'node:https';
import { unstable_cache } from 'next/cache';
import {
  buildLiveGridSnapshot,
  parseNldcDemandSupplyHtml,
  parseNldcGenerationHtml,
  parsePgcbForecastHtml,
  type LiveGridSnapshot,
} from '@/lib/data/grid/live-grid-parse';

export type { LiveGridSnapshot, LiveGridHour } from '@/lib/data/grid/live-grid-parse';

/**
 * The live layer: NLDC's hourly pages, read at most once per REVALIDATE_S
 * across all visitors, whichever surface asks first.
 *
 * The cached function THROWS on an unreachable page or an empty parse rather
 * than returning null — `unstable_cache` stores what the function returns, and
 * caching a soft failure once pinned "nothing is published" on the release
 * manifest for a whole window (see runtime-data-publishing). Callers catch and
 * degrade; the last good value keeps being served until a fetch succeeds.
 */

const GENERATION_URL = 'https://erp.powergrid.gov.bd/w/generations/view_generations_bn';
const DEMAND_SUPPLY_URL = 'https://erp.powergrid.gov.bd/web/generations/view_demand_supply_loadshed_bn';
/**
 * PGCB's forecast board — the 4 KB table pgcb.gov.bd embeds in its homepage.
 * Daily rather than hourly, and read here because it is the only same-morning
 * source for today's demand forecast and yesterday's peaks.
 */
const FORECAST_URL = 'https://erp.powergrid.gov.bd/w/forecasts/show_forecasts_bn';

/**
 * How often the upstream pages may be re-read.
 *
 * This was 600s, on the reasoning that "NLDC posts hourly, so asking more often
 * than every 10 minutes gains nothing". True of the DATA and false of the LAG:
 * what matters to a reader is how long after NLDC posts a new hour they are
 * still shown the old one, and that is bounded by this window — not by how
 * often the figures change.
 *
 * It also does not stand alone. The route that serves this sets an edge cache
 * of its own, and the two stack: at 600s each a reader could be ~20 minutes
 * behind NLDC in the ordinary case. Measured on 2026-09-07: NLDC posted the
 * 15:00 hour at about 11:50 UTC and esbpowerline.com was still serving 14:00 at
 * 12:00, while localhost — which has neither cache in front of it — had had the
 * new hour for ten minutes.
 *
 * 180s costs 20 requests an hour to a public government page that the Pi
 * already polls hourly. That is not a load worth trading a quarter of an hour
 * of staleness for.
 */
const REVALIDATE_S = 180;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

/**
 * Plain node:https, not fetch: erp.powergrid.gov.bd serves an incomplete
 * certificate chain, so Node's fetch fails UNABLE_TO_VERIFY_LEAF_SIGNATURE.
 * The archive fetcher (`fetch_pgcb_daily_workbooks.py`) hit the same wall and
 * made the same call — verification off for THIS host only, never globally
 * (NODE_TLS_REJECT_UNAUTHORIZED would strip TLS from every connection the
 * server makes, database included).
 */
function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        rejectUnauthorized: false,
        timeout: 20_000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`${url} answered ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error(`${url} timed out`)));
    req.on('error', reject);
  });
}

export const getLiveGridSnapshot = unstable_cache(
  async (): Promise<LiveGridSnapshot> => {
    // The forecast board catches its own failure and the other two do not.
    // Those two are what this snapshot IS — an empty parse there has to throw,
    // or `unstable_cache` stores the emptiness. The board backs two tiles on a
    // daily cadence, so losing it should cost those two tiles and nothing else.
    const [genHtml, dslHtml, forecastHtml] = await Promise.all([
      fetchPage(GENERATION_URL),
      fetchPage(DEMAND_SUPPLY_URL),
      fetchPage(FORECAST_URL).catch(() => null),
    ]);
    const forecast = forecastHtml ? parsePgcbForecastHtml(forecastHtml) : null;
    return buildLiveGridSnapshot(
      parseNldcGenerationHtml(genHtml),
      parseNldcDemandSupplyHtml(dslHtml),
      {
        forecast,
        forecastUrl: FORECAST_URL,
        fetchedAt: new Date().toISOString(),
        generationUrl: GENERATION_URL,
        demandSupplyUrl: DEMAND_SUPPLY_URL,
      },
    );
  },
  ['live-grid-snapshot'],
  { revalidate: REVALIDATE_S },
);
