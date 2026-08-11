import * as fs from 'fs';
import * as path from 'path';
import {
  buildSredaProjectRegister,
  buildSredaReconciliation,
  mergeSredaSnapshots,
  parseSredaCarbonHtml,
  parseSredaGenerationMixHtml,
  parseSredaHomepageHtml,
  parseSredaOrganisationHtml,
  parseSredaTechnologyHtml,
  parseSredaYearWiseHtml,
  sredaRegisterHasNextPage,
} from '@/lib/data/sreda/parse-sreda-html';
import type {
  SredaDailyData,
  SredaOrganisationTable,
  SredaProjectRegister,
  SredaYearTable,
} from '@/lib/data/sreda/types';

const SREDA_BASE_URL = 'https://ndre.sreda.gov.bd';
const SREDA_HOME_URL = 'https://ndre.sreda.gov.bd/';
const SREDA_MIX_URL = 'https://ndre.sreda.gov.bd/index.php?id=7';
const SREDA_TECH_URL = 'https://ndre.sreda.gov.bd/index.php?id=8';
const SREDA_CARBON_URL = 'https://ndre.sreda.gov.bd/index.php?id=21';

/**
 * The organisation-wise statistics pages. These are where SREDA names the other
 * agencies — BPDB, NWPGCL, EGCB, BREB, DESCO, DPDC, NESCO, WZPDCL, IDCOL, BADC,
 * BMDA — so they are the only published route from a national capacity figure
 * to who actually owns it.
 */
const SREDA_ORG_PAGES: { id: number; category: string }[] = [
  { id: 16, category: 'Solar Parks' },
  { id: 17, category: 'Net Metered Rooftop Solar' },
  { id: 15, category: 'Solar Irrigation Pumps' },
  { id: 18, category: 'Solar Charging Stations' },
  // id=19 (Telecom BTS) publishes a Total of 0 with no organisation rows and
  // id=20 (Drinking Water) returns HTTP 500, so neither is requested. The
  // technology-wise page still carries both, and that is where they appear.
];

/** Year-wise commissioning tables. */
const SREDA_YEAR_PAGES: { id: number; category: string }[] = [
  { id: 11, category: 'Large Projects' },
  { id: 12, category: 'Small Projects' },
];

/**
 * Project-register views, one per electricity-generating technology.
 *
 * `technology` matches the name on the technology-wise page exactly, which is
 * what lets the register's running projects be reconciled against the capacity
 * that page states. Views SREDA offers for non-generating categories are left
 * out rather than listed with nothing to check them against.
 */
/** Backstop on the pagination walk. Solar Park, the largest, is three pages. */
const SREDA_REGISTER_MAX_PAGES = 12;

const SREDA_REGISTER_PAGES: { i: number; technology: string }[] = [
  { i: 1, technology: 'Solar Park' },
  { i: 11, technology: 'All Wind Projects' },
  { i: 12, technology: 'All Hydro Projects' },
  { i: 14, technology: 'Biogas to Electricity' },
  { i: 16, technology: 'Biomass to Electricity' },
];

function getSredaDailyDir(): string {
  return path.join(process.cwd(), 'public', 'data', 'sreda', 'daily');
}

function getSredaAvailableDatesPath(): string {
  return path.join(process.cwd(), 'lib', 'sreda-available-dates.json');
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function fetchSredaPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ESBPowerLine-Ingest/1.0 (+https://esbpowerline.com)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.warn(`[SREDA] HTTP ${response.status} for ${url}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`[SREDA] Fetch failed for ${url}:`, error);
    return null;
  }
}

function readAvailableDates(): string[] {
  const availableDatesPath = getSredaAvailableDatesPath();
  if (!fs.existsSync(availableDatesPath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(availableDatesPath, 'utf8'));
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

function writeAvailableDates(dates: string[]) {
  const unique = [...new Set(dates)].sort();
  fs.writeFileSync(getSredaAvailableDatesPath(), JSON.stringify(unique, null, 2) + '\n', 'utf8');
}

function writeDailySnapshot(data: SredaDailyData): string {
  const dailyDir = getSredaDailyDir();
  ensureDir(dailyDir);
  const filePath = path.join(dailyDir, `${data.date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return filePath;
}

export async function scrapeSredaDailySnapshot(): Promise<SredaDailyData | null> {
  const [homeHtml, mixHtml] = await Promise.all([
    fetchSredaPage(SREDA_HOME_URL),
    fetchSredaPage(SREDA_MIX_URL),
  ]);

  if (!homeHtml && !mixHtml) {
    console.warn('[SREDA] Both homepage and generation-mix fetches failed.');
    return null;
  }

  const scrapedAt = new Date().toISOString();
  const home = homeHtml
    ? parseSredaHomepageHtml(homeHtml, SREDA_HOME_URL)
    : {};
  const mix = mixHtml ? parseSredaGenerationMixHtml(mixHtml) : {};

  const merged = mergeSredaSnapshots(home, mix, scrapedAt);
  if (!merged) {
    console.warn('[SREDA] Could not parse Last Update timestamp from SREDA pages.');
    return null;
  }

  if (merged.totalRenewableMw <= 0 && merged.renewableTech.length === 0) {
    console.warn('[SREDA] Parsed snapshot has no renewable capacity data.');
    return null;
  }

  // The detail pages are additive. A page that fails to fetch or parse leaves
  // its section absent, which the tab renders as an empty state — it must never
  // fall back to the previous snapshot's numbers under today's timestamp.
  const [techHtml, carbonHtml] = await Promise.all([
    fetchSredaPage(SREDA_TECH_URL),
    fetchSredaPage(SREDA_CARBON_URL),
  ]);

  if (techHtml) {
    const { technologyBreakdown, technologyTotals } = parseSredaTechnologyHtml(techHtml);
    if (technologyBreakdown.length > 0) {
      merged.technologyBreakdown = technologyBreakdown;
      merged.technologyTotals = technologyTotals;
    }
  }
  if (carbonHtml) {
    const carbon = parseSredaCarbonHtml(carbonHtml);
    if (carbon.length > 0) merged.carbonEstimates = carbon;
  }

  const organisationTables: SredaOrganisationTable[] = [];
  for (const page of SREDA_ORG_PAGES) {
    const url = `${SREDA_BASE_URL}/index.php?id=${page.id}`;
    const html = await fetchSredaPage(url);
    if (!html) continue;
    const table = parseSredaOrganisationHtml(html, page.category, url);
    if (table) organisationTables.push(table);
  }
  if (organisationTables.length > 0) merged.organisationTables = organisationTables;

  const yearWiseTables: SredaYearTable[] = [];
  for (const page of SREDA_YEAR_PAGES) {
    const url = `${SREDA_BASE_URL}/index.php?id=${page.id}`;
    const html = await fetchSredaPage(url);
    if (!html) continue;
    const table = parseSredaYearWiseHtml(html, page.category, url);
    if (table) yearWiseTables.push(table);
  }
  if (yearWiseTables.length > 0) merged.yearWiseTables = yearWiseTables;

  // The register is paginated at 30 rows a page, not capped at 30: Solar Park
  // runs to 76 projects over three pages. Following "Next Page" is what makes
  // the view's own "System: N, Capacity: X" headline verifiable, and stopping
  // at page one silently published 30 of 76.
  const projectRegisters: SredaProjectRegister[] = [];
  for (const page of SREDA_REGISTER_PAGES) {
    const url = `${SREDA_BASE_URL}/index.php?id=1&i=${page.i}`;
    const pages: string[] = [];
    for (let pg = 1; pg <= SREDA_REGISTER_MAX_PAGES; pg += 1) {
      const html = await fetchSredaPage(pg === 1 ? url : `${url}&pg=${pg}`);
      if (!html) break;
      pages.push(html);
      if (!sredaRegisterHasNextPage(html, pg + 1)) break;
    }
    if (pages.length === 0) continue;
    const register = buildSredaProjectRegister(page.technology, url, pages);
    if (register) projectRegisters.push(register);
  }
  if (projectRegisters.length > 0) merged.projectRegisters = projectRegisters;

  merged.reconciliation = buildSredaReconciliation(merged);
  return merged;
}

export interface SredaIngestResult {
  ok: boolean;
  date?: string;
  filePath?: string;
  skipped?: boolean;
  error?: string;
}

/** Fetch SREDA, write daily JSON backlog entry, and update available-dates index. */
export async function runSredaIngestion(): Promise<SredaIngestResult> {
  console.log('[SREDA] Starting daily SREDA ingest...');

  const snapshot = await scrapeSredaDailySnapshot();
  if (!snapshot) {
    return { ok: false, error: 'SREDA scrape produced no usable data' };
  }

  const filePath = path.join(getSredaDailyDir(), `${snapshot.date}.json`);
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8')) as SredaDailyData;
    if (existing.lastUpdate === snapshot.lastUpdate) {
      console.log(`[SREDA] No change since ${snapshot.lastUpdate} — backlog entry already current.`);
      return { ok: true, date: snapshot.date, filePath, skipped: true };
    }
  }

  writeDailySnapshot(snapshot);
  const dates = readAvailableDates();
  if (!dates.includes(snapshot.date)) {
    dates.push(snapshot.date);
    writeAvailableDates(dates);
  }

  console.log(
    `[SREDA] Backlog updated: ${snapshot.date} — RE ${snapshot.totalRenewableMw} MW, grid share ${snapshot.reGridSharePct}%`,
  );
  return { ok: true, date: snapshot.date, filePath };
}

if (require.main === module) {
  runSredaIngestion()
    .then((result) => {
      if (!result.ok) {
        console.error('[SREDA] Ingest failed:', result.error);
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SREDA] Ingest error:', err);
      process.exit(1);
    });
}