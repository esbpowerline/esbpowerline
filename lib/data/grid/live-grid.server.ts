import 'server-only';
import https from 'node:https';
import { unstable_cache } from 'next/cache';
import {
  buildLiveGridSnapshot,
  parseNldcDemandSupplyHtml,
  parseNldcGenerationHtml,
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

/** NLDC posts hourly; asking more often than every 10 minutes gains nothing. */
const REVALIDATE_S = 600;

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
    const [genHtml, dslHtml] = await Promise.all([
      fetchPage(GENERATION_URL),
      fetchPage(DEMAND_SUPPLY_URL),
    ]);
    return buildLiveGridSnapshot(
      parseNldcGenerationHtml(genHtml),
      parseNldcDemandSupplyHtml(dslHtml),
      {
        fetchedAt: new Date().toISOString(),
        generationUrl: GENERATION_URL,
        demandSupplyUrl: DEMAND_SUPPLY_URL,
      },
    );
  },
  ['live-grid-snapshot'],
  { revalidate: REVALIDATE_S },
);
