/**
 * Whole-site link, asset, console and auth crawler — the permanent verification
 * tool for a site nobody will develop again.
 *
 * Starts at the homepage, follows every internal <a href>, and in a real
 * headless Chromium reports:
 *   - broken internal links (non-2xx/3xx)
 *   - redirect chains longer than one hop
 *   - asset requests that 404 (images, fonts, JS, CSS, favicons, OG images)
 *   - console errors and unhandled rejections, per page
 *   - sitemap coverage: every sitemap URL must 200, and every crawled page of
 *     consequence should be in the sitemap
 *   - auth: admin/ingest routes must NOT return content to an anonymous client
 *
 * Read-only. It changes nothing; it prints a report and exits non-zero if any
 * hard failure (broken link, console error, exposed admin route) is found.
 *
 * Usage:
 *   node scripts/crawl-site.mjs                 # against http://localhost:4000
 *   BASE=http://localhost:3000 node scripts/crawl-site.mjs
 *   node scripts/crawl-site.mjs --max 60        # cap pages (default: all)
 *   node scripts/crawl-site.mjs --json
 *
 * Requires a running production server and puppeteer (a devDependency).
 */
import puppeteer from 'puppeteer';

const BASE = process.env.BASE || 'http://localhost:4000';
const PUBLIC_ORIGIN = 'https://esbpowerline.com';
const argv = process.argv.slice(2);
const MAX = argv.includes('--max') ? Number(argv[argv.indexOf('--max') + 1]) : Infinity;
const AS_JSON = argv.includes('--json');

// A real desktop UA — the site's middleware blocks known bots, correctly, so a
// crawler must present as a browser to see what a reader sees.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/** Rewrite a public-origin sitemap URL to the local server under test. */
const toLocal = (u) => u.replace(PUBLIC_ORIGIN, BASE).replace(/\/$/, '') || BASE;

const results = {
  pagesCrawled: 0,
  brokenLinks: [],
  longRedirects: [],
  brokenAssets: [],
  consoleErrors: [],
  sitemapMissing: [], // in sitemap, not 200
  notInSitemap: [], // crawled content page absent from sitemap
  exposedAdmin: [], // admin/ingest route returned content anonymously
};

async function fetchStatus(url, method = 'GET') {
  // Use fetch with manual redirect so we can measure chain length. A browser UA
  // header is essential (bot filter).
  try {
    const res = await fetch(url, { method, redirect: 'manual', headers: { 'User-Agent': UA } });
    return { status: res.status, location: res.headers.get('location') };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function main() {
  // 1. Seed URL set from the sitemap (authoritative) plus the homepage crawl.
  const sitemap = await (async () => {
    const res = await fetch(`${BASE}/sitemap.xml`, { headers: { 'User-Agent': UA } });
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toLocal(m[1]));
  })();

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  const discovered = new Set([BASE, ...sitemap]);
  const visited = new Set();
  const queue = [BASE, ...sitemap];

  while (queue.length && visited.size < MAX) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    const page = await browser.newPage();
    await page.setUserAgent(UA);
    const pageConsole = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') pageConsole.push(msg.text());
    });
    page.on('pageerror', (err) => pageConsole.push(`pageerror: ${err.message}`));
    const assetFailures = [];
    page.on('requestfailed', (req) => {
      const err = req.failure()?.errorText || '';
      // net::ERR_ABORTED is normal: Next.js <Link> prefetches in-flight when the
      // page navigates or closes are aborted by design, not broken. Only a real
      // network/DNS failure on a SAME-ORIGIN request is a site defect.
      if (err.includes('ERR_ABORTED')) return;
      if (!req.url().startsWith(BASE)) return; // third-party (GA, fonts) is not ours
      assetFailures.push(`${req.url()} (${err})`);
    });
    page.on('response', (res) => {
      const u = res.url();
      if (!u.startsWith(BASE)) return; // only our own assets
      // A tier-gated data file legitimately answers 403 to an anonymous crawler;
      // that is the paywall working, not a broken asset. Real breakage is a 404
      // (or 5xx) on a static asset the page actually needs.
      if (u.includes('/api/data/') || u.includes('/data/')) return;
      if (res.status() === 404 || res.status() >= 500) assetFailures.push(`${u} (${res.status()})`);
    });

    let hrefs = [];
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      results.pagesCrawled++;
      const status = resp?.status() ?? 0;
      if (status >= 400) results.brokenLinks.push({ url, status });

      // Filter out noise consoles that are not our bug: browser CSP reports for
      // deliberately-blocked third parties, and the well-known favicon race.
      const realErrors = pageConsole.filter((e) => {
        if (/favicon/i.test(e) && /404/.test(e)) return false;
        // A 403 on the console is the tier gate refusing an anonymous crawler a
        // paywalled data file — correct behaviour, not a page bug.
        if (/status of 403/.test(e)) return false;
        return true;
      });
      if (realErrors.length) results.consoleErrors.push({ url, errors: realErrors.slice(0, 6) });
      if (assetFailures.length) {
        for (const a of assetFailures.slice(0, 10)) results.brokenAssets.push({ page: url, asset: a });
      }

      hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    } catch (e) {
      results.brokenLinks.push({ url, status: 0, error: e.message });
    } finally {
      await page.close();
    }

    // Enqueue new internal links.
    for (const href of hrefs) {
      if (!href) continue;
      let abs;
      try {
        abs = new URL(href, url).href;
      } catch {
        continue;
      }
      abs = abs.split('#')[0].replace(/\/$/, '') || BASE;
      if (!abs.startsWith(BASE)) continue; // internal only
      if (/\.(png|jpe?g|svg|webp|avif|ico|css|js|json|xml|txt|pdf)$/i.test(abs)) continue;
      if (!discovered.has(abs) && discovered.size < 400) {
        discovered.add(abs);
        queue.push(abs);
      }
    }
  }

  // 2. Sitemap coverage — every sitemap URL must be 200.
  for (const u of sitemap) {
    const { status, location } = await fetchStatus(u);
    if (status !== 200) results.sitemapMissing.push({ url: u, status });
    // Redirect chain length: one hop to a 200 is fine; a redirect that points
    // to another redirect is not.
    if (status >= 300 && status < 400 && location) {
      const next = await fetchStatus(new URL(location, u).href);
      if (next.status >= 300 && next.status < 400) results.longRedirects.push({ url: u, via: location });
    }
  }

  // 3. Content pages crawled but absent from the sitemap (articles/categories).
  const sitemapSet = new Set(sitemap.map((u) => u.replace(/\/$/, '')));
  for (const u of visited) {
    if (/\/(articles|categories|energy-policy|about|contact)\//.test(u) && !sitemapSet.has(u)) {
      // Only flag article/category detail pages, which should be indexable.
      if (/\/articles\/[^/]+$/.test(u) || /\/categories\/[^/]+$/.test(u)) {
        results.notInSitemap.push(u);
      }
    }
  }

  // 4. Auth: admin/ingest routes must not serve content anonymously.
  const adminRoutes = [
    '/admin',
    '/admin/data',
    '/admin/users',
    '/cms',
    '/cms/articles',
    '/api/admin/data/publish-local',
    '/api/admin/data/ingest-day',
  ];
  for (const r of adminRoutes) {
    const { status } = await fetchStatus(`${BASE}${r}`);
    // 200 with real content = exposed. Redirect (3xx) to login or 401/403 = safe.
    if (status === 200) results.exposedAdmin.push({ route: r, status });
  }

  await browser.close();

  // ── report ──
  const hardFails =
    results.brokenLinks.length +
    results.brokenAssets.length +
    results.consoleErrors.length +
    results.sitemapMissing.length +
    results.exposedAdmin.length;

  if (AS_JSON) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\nCrawl of ${BASE}`);
    console.log(`  pages crawled:        ${results.pagesCrawled}`);
    console.log(`  sitemap URLs:         ${sitemap.length}`);
    const section = (title, list, fmt) => {
      console.log(`\n${title}: ${list.length}`);
      for (const x of list.slice(0, 15)) console.log('   ' + fmt(x));
      if (list.length > 15) console.log(`   … ${list.length - 15} more (--json)`);
    };
    section('BROKEN LINKS', results.brokenLinks, (x) => `${x.status} ${x.url}${x.error ? ' — ' + x.error : ''}`);
    section('BROKEN ASSETS', results.brokenAssets, (x) => `${x.asset}  (on ${x.page})`);
    section('CONSOLE ERRORS', results.consoleErrors, (x) => `${x.url}\n      ${x.errors.join('\n      ')}`);
    section('REDIRECT CHAINS >1 HOP', results.longRedirects, (x) => `${x.url} -> ${x.via} -> …`);
    section('SITEMAP URLS NOT 200', results.sitemapMissing, (x) => `${x.status} ${x.url}`);
    section('INDEXABLE PAGES NOT IN SITEMAP', results.notInSitemap, (x) => x);
    section('ADMIN ROUTES EXPOSED ANONYMOUSLY', results.exposedAdmin, (x) => `${x.status} ${x.route}`);
    console.log(`\n${hardFails === 0 ? '✓ zero hard failures' : `✗ ${hardFails} hard failure(s)`}`);
  }

  process.exit(hardFails === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('crawler failed:', e);
  process.exit(2);
});
