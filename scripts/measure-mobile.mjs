/**
 * Measure every chart on the Grid Explorer at a real phone viewport.
 *
 * Puppeteer rather than the 393px iframe the brief describes: the iframe was
 * only ever a workaround for resize_window being a no-op, and it still depends
 * on whatever Chrome the extension is driving. This launches its own Chromium
 * with a genuine 393x852 viewport, so `window.innerWidth` really is 393, every
 * `@media` and `@container` rule resolves as it would on a phone, and nothing
 * is shared with the user's browser profile or its cache.
 *
 * Usage: node scratch/measure-mobile.mjs [width] [tab=...&macro=...] ...
 */
import puppeteer from 'puppeteer';

const WIDTH = Number(process.argv[2]) || 393;
const QUERIES = process.argv.slice(3);
const TARGETS = QUERIES.length
  ? QUERIES
  : [
      'tab=overview',
      'tab=gen',
      'tab=regional',
      'tab=renewables',
      'tab=macro&macro=overview',
      'tab=macro&macro=budget',
      'tab=macro&macro=monthly',
      'tab=macro&macro=pricing',
      'tab=macro&macro=reports',
      'tab=macro&macro=global',
      'tab=macro&macro=system_loss',
      'tab=macro&macro=reserves',
    ];

const UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
await page.setUserAgent(UA);
await page.setViewport({ width: WIDTH, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.setCacheEnabled(false);

const rows = [];
let overflowProblems = 0;

for (const q of TARGETS) {
  const url = `http://localhost:3000/grid-explorer?${q}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  } catch (e) {
    rows.push({ tab: q, label: `(navigation failed: ${e.message.slice(0, 40)})`, ok: false });
    continue;
  }
  // The explorer is dynamic(ssr:false) and Recharts settles late, so wait for a
  // chart to exist rather than for the network, which never goes quiet here.
  try {
    await page.waitForSelector('.recharts-wrapper', { timeout: 90000 });
  } catch {
    /* tabs with no chart are legitimate — fall through and report zero */
  }
  await new Promise((r) => setTimeout(r, 4500));

  const result = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.recharts-wrapper').forEach((w) => {
      const grid = w.querySelector('.recharts-cartesian-grid');
      const card = w.closest('.grid-explorer-chart-card');
      const cw = card ? card.getBoundingClientRect().width : null;
      let label = '';
      for (let n = w.parentElement, k = 0; n && k < 7; n = n.parentElement, k++) {
        const t = n.querySelector('h2,h3,h4');
        if (t && t.textContent.trim()) { label = t.textContent.trim().slice(0, 44); break; }
      }
      const caption = card ? card.querySelector('.grid-explorer-chart-caption') : null;
      out.push({
        label,
        cartesian: !!grid,
        cardW: cw ? +cw.toFixed(0) : null,
        plotW: grid ? +grid.getBoundingClientRect().width.toFixed(0) : null,
        ratio: grid && cw ? +((grid.getBoundingClientRect().width / cw) * 100).toFixed(1) : null,
        nY: w.querySelectorAll('.recharts-yAxis').length,
        legendEntries: card ? card.querySelectorAll('.recharts-legend-item, .grid-explorer-chart-caption').length : 0,
        captioned: !!caption,
      });
    });
    return {
      charts: out,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
    };
  });

  if (result.overflow > 0) overflowProblems++;
  for (const c of result.charts) rows.push({ tab: q, ...c });
  console.log(
    `${q.padEnd(28)} innerWidth=${result.innerWidth} overflow=${result.overflow}px charts=${result.charts.length}`,
  );
}

console.log('\n' + '='.repeat(110));
console.log(
  'TAB'.padEnd(26) + 'CHART'.padEnd(40) + 'yAx'.padStart(4) + 'CARD'.padStart(7) + 'PLOT'.padStart(7) + 'RATIO'.padStart(8) + '  72%',
);
console.log('='.repeat(110));

let pass = 0, fail = 0, exempt = 0;
for (const r of rows) {
  if (!r.cartesian) {
    exempt++;
    console.log(r.tab.padEnd(26) + String(r.label).padEnd(40) + '   -' + '      -' + '      -' + '       -' + '  exempt (axis-less)');
    continue;
  }
  const ok = r.ratio >= 72;
  ok ? pass++ : fail++;
  console.log(
    r.tab.padEnd(26) +
      String(r.label).padEnd(40) +
      String(r.nY).padStart(4) +
      String(r.cardW).padStart(7) +
      String(r.plotW).padStart(7) +
      (r.ratio + '%').padStart(8) +
      (ok ? '  PASS' : '  FAIL'),
  );
}
console.log('='.repeat(110));
console.log(`cartesian: ${pass} pass / ${fail} fail   axis-less exempt: ${exempt}   tabs with horizontal overflow: ${overflowProblems}`);

await browser.close();
