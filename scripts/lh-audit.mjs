/**
 * Lighthouse across the four representative pages, mobile and desktop.
 *
 * Kept in the repo as the standing performance/SEO/a11y baseline tool. Runs
 * against a LOCAL PRODUCTION server (never dev — dev scores are meaningless).
 * Uses puppeteer's bundled Chromium so it needs no system Chrome.
 *
 * Usage:
 *   node scripts/lh-audit.mjs                       # all 4 pages, both form factors
 *   BASE=http://localhost:4000 node scripts/lh-audit.mjs
 *   node scripts/lh-audit.mjs --only /grid-explorer
 */
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';

const BASE = process.env.BASE || 'http://localhost:4000';
const argv = process.argv.slice(2);
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'grid-explorer', path: '/grid-explorer' },
  { name: 'article', path: process.env.ARTICLE_PATH || '/articles' },
  { name: 'category', path: process.env.CATEGORY_PATH || '/categories' },
].filter((p) => !ONLY || p.path === ONLY);

const FORM_FACTORS = ['mobile', 'desktop'];

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const port = Number(new URL(browser.wsEndpoint()).port);

  const rows = [];
  for (const page of PAGES) {
    for (const ff of FORM_FACTORS) {
      const url = `${BASE}${page.path}`;
      const flags = {
        port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: ff,
        screenEmulation:
          ff === 'desktop'
            ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
            : { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
      };
      try {
        const { lhr } = await lighthouse(url, flags);
        const c = lhr.categories;
        const s = (k) => Math.round((c[k]?.score ?? 0) * 100);
        rows.push({
          page: page.name,
          ff,
          perf: s('performance'),
          a11y: s('accessibility'),
          bp: s('best-practices'),
          seo: s('seo'),
          lcp: lhr.audits['largest-contentful-paint']?.displayValue ?? '',
          cls: lhr.audits['cumulative-layout-shift']?.displayValue ?? '',
          tbt: lhr.audits['total-blocking-time']?.displayValue ?? '',
        });
      } catch (e) {
        rows.push({ page: page.name, ff, error: e.message });
      }
    }
  }
  await browser.close();

  console.log(`\nLighthouse — ${BASE}\n`);
  console.log(
    'page'.padEnd(15) + 'form'.padEnd(9) + 'Perf'.padStart(5) + 'A11y'.padStart(6) +
      'BP'.padStart(5) + 'SEO'.padStart(5) + '   LCP'.padEnd(12) + '  CLS'.padEnd(8) + ' TBT',
  );
  console.log('-'.repeat(78));
  for (const r of rows) {
    if (r.error) {
      console.log(`${r.page.padEnd(15)}${r.ff.padEnd(9)}ERROR ${r.error.slice(0, 40)}`);
      continue;
    }
    const mark = (n) => (n >= 95 ? `${n}` : `${n}*`);
    console.log(
      r.page.padEnd(15) +
        r.ff.padEnd(9) +
        mark(r.perf).padStart(5) +
        mark(r.a11y).padStart(6) +
        mark(r.bp).padStart(5) +
        mark(r.seo).padStart(5) +
        `   ${r.lcp}`.padEnd(12) +
        `  ${r.cls}`.padEnd(8) +
        ` ${r.tbt}`,
    );
  }
  console.log('\n* = below 95');
  console.log(JSON.stringify(rows));
}

run().catch((e) => {
  console.error('lighthouse run failed:', e);
  process.exit(1);
});
