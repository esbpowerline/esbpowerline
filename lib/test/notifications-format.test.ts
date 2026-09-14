import { describe, expect, it } from 'vitest';
import {
  CAPTION_LIMIT,
  TEXT_LIMIT,
  articleContentHash,
  esc,
  renderArticle,
  renderDailySummary,
  renderGridAlert,
  renderGridHourly,
  renderWithdrawn,
  truncatePlain,
  visibleLength,
  withUtm,
} from '@/lib/notifications/telegram/format';
import { dhakaDateKey, dhakaDateTime, dhakaTime } from '@/lib/notifications/time';

const SITE = 'https://esbpowerline.com';
const NOW = new Date('2026-09-14T14:30:00Z'); // 20:30 in Dhaka

const article = {
  slug: 'demand-peak',
  title: 'Bangladesh power demand reaches a new evening peak',
  excerpt: 'NLDC reported 18,178 MW at 20:00.',
  category: 'Power Generation',
  isBreaking: false,
  publishedAt: new Date('2026-09-14T14:15:00Z'), // 20:15 BST
};

describe('escaping', () => {
  it('escapes the three characters Telegram HTML needs', () => {
    expect(esc('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
  });

  it('an editor’s markup in a headline becomes text, never a tag', () => {
    const r = renderArticle({ ...article, title: '<b>Gas</b> & <script>alert(1)</script>' }, { siteUrl: SITE, asCaption: false, now: NOW });
    expect(r.html).toContain('&lt;b&gt;Gas&lt;/b&gt; &amp; &lt;script&gt;');
    expect(r.html).not.toContain('<script>');
  });

  it('counts an entity as one visible character', () => {
    expect(visibleLength('<b>A &amp; B</b>')).toBe(5);
  });
});

describe('Dhaka time', () => {
  it('is the instant plus six hours, whatever the machine zone', () => {
    const instant = new Date('2026-09-13T18:30:00Z');
    expect(dhakaTime(instant)).toBe('00:30');
    expect(dhakaDateKey(instant)).toBe('2026-09-14');
    expect(dhakaDateTime(instant)).toBe('14 Sep, 00:30');
  });
});

describe('news posts', () => {
  it('has the kicker, the headline, the standfirst and the BST time', () => {
    const r = renderArticle(article, { siteUrl: SITE, asCaption: false, now: NOW });
    expect(r.html.split('\n')[0]).toBe('<b>NEWS</b>');
    expect(r.html).toContain('<b>Bangladesh power demand reaches a new evening peak</b>');
    expect(r.html).toContain('<i>Power Generation · 20:15 BST</i>');
  });

  it('marks breaking articles, and nothing else, as BREAKING', () => {
    expect(renderArticle({ ...article, isBreaking: true }, { siteUrl: SITE, asCaption: false, now: NOW }).html).toMatch(/^<b>BREAKING<\/b>/);
  });

  it('prints the day as well when the article is not from today', () => {
    const r = renderArticle({ ...article, publishedAt: new Date('2026-09-12T14:15:00Z') }, { siteUrl: SITE, asCaption: false, now: NOW });
    expect(r.html).toContain('12 Sep, 20:15 BST');
  });

  it('links the canonical URL with Telegram attribution', () => {
    const r = renderArticle({ ...article, slug: 'gas & power' }, { siteUrl: SITE, asCaption: false, now: NOW });
    const url = new URL(r.buttons[0].url);
    expect(url.origin + url.pathname).toBe('https://esbpowerline.com/articles/gas%20%26%20power');
    expect(url.searchParams.get('utm_source')).toBe('telegram');
    expect(url.searchParams.get('utm_medium')).toBe('social');
    expect(url.searchParams.get('utm_campaign')).toBe('instant_news');
  });

  it('keeps a photo caption within Telegram’s 1,024 visible characters', () => {
    const long = { ...article, excerpt: 'word '.repeat(2000), title: 'T'.repeat(300) };
    expect(renderArticle(long, { siteUrl: SITE, asCaption: true, now: NOW }).visibleLength).toBeLessThanOrEqual(CAPTION_LIMIT);
    expect(renderArticle(long, { siteUrl: SITE, asCaption: false, now: NOW }).visibleLength).toBeLessThanOrEqual(TEXT_LIMIT);
  });

  it('stays within the limit when the standfirst is full of characters that escape', () => {
    const r = renderArticle({ ...article, excerpt: '<&>'.repeat(1000) }, { siteUrl: SITE, asCaption: true, now: NOW });
    expect(r.visibleLength).toBeLessThanOrEqual(CAPTION_LIMIT);
  });

  it('cuts on a word boundary', () => {
    expect(truncatePlain('one two three four', 12)).toBe('one two…');
  });

  it('hashes the fields the post shows, and only those', () => {
    const h = articleContentHash(article);
    expect(articleContentHash({ ...article })).toBe(h);
    expect(articleContentHash({ ...article, title: 'Different' })).not.toBe(h);
  });

  it('a withdrawn post keeps the headline, struck, and loses its link', () => {
    const r = renderWithdrawn('A & B');
    expect(r.html).toContain('<s>A &amp; B</s>');
    expect(r.buttons).toEqual([]);
  });
});

describe('UTM', () => {
  it('keeps an existing query string', () => {
    const u = new URL(withUtm('https://esbpowerline.com/grid-explorer?tab=gen', 'grid_hourly'));
    expect(u.searchParams.get('tab')).toBe('gen');
    expect(u.searchParams.get('utm_campaign')).toBe('grid_hourly');
  });
});

const hour = {
  observedAt: '2026-09-14T00:00:00.000Z', // 06:00 BST
  demandMw: 14338,
  supplyMw: 14206,
  loadShedMw: 132,
  generationMw: 14206,
  generationState: 'consistent' as const,
  componentSumMw: 14206,
  importsMw: 2469,
  previous: { observedAt: '2026-09-13T23:00:00.000Z', demandMw: 14218, generationMw: 14533 },
};

describe('grid update', () => {
  it('labels the hour it describes in Dhaka time', () => {
    const r = renderGridHourly(hour, { siteUrl: SITE });
    expect(r.html).toContain('<b>GRID UPDATE</b> · 14 Sep, 06:00 BST');
    expect(r.html).toContain('NLDC hourly report for 06:00');
  });

  it('prints the figures in an aligned block', () => {
    const r = renderGridHourly(hour, { siteUrl: SITE });
    expect(r.html).toMatch(/<pre>Demand\s+14,338 MW\nGeneration\s+14,206 MW\nLoad shed\s+132 MW\nImports\s+2,469 MW<\/pre>/);
  });

  it('gives the change against the hour before, with a true minus sign', () => {
    const r = renderGridHourly(hour, { siteUrl: SITE });
    expect(r.html).toContain('On the hour before: demand +120 MW, generation −327 MW.');
  });

  it('prints a dash, never zero, for a figure NLDC did not post', () => {
    const r = renderGridHourly({ ...hour, loadShedMw: null }, { siteUrl: SITE });
    expect(r.html).toMatch(/Load shed\s+—/);
    expect(r.html).not.toMatch(/Load shed\s+0 MW/);
    expect(r.html).toContain('Not posted for this hour: load shed.');
  });

  it('omits the change when the hour before is not stored', () => {
    expect(renderGridHourly({ ...hour, previous: null }, { siteUrl: SITE }).html).not.toContain('On the hour before');
  });

  it('shows an inconsistent total as filed, flagged with what its parts sum to', () => {
    const r = renderGridHourly({ ...hour, generationState: 'inconsistent', generationMw: 14854, componentSumMw: 14584 }, { siteUrl: SITE });
    expect(r.html).toContain('14,854 MW*');
    expect(r.html).toContain('As filed. NLDC’s parts sum to 14,584 MW.');
    expect(r.html).not.toContain('generation −');
  });

  it('withholds an unusable total instead of printing it', () => {
    const r = renderGridHourly({ ...hour, generationState: 'unusable', generationMw: 64526500 }, { siteUrl: SITE });
    expect(r.html).not.toContain('64,526,500');
    expect(r.html).toContain('withheld');
  });
});

describe('grid alerts', () => {
  const base = { observedAt: '2026-09-14T14:00:00.000Z', thresholdMw: 3000 };

  it('ENTER names the level and the hour', () => {
    const r = renderGridAlert({ ...base, rule: 'HIGH_LOAD_SHED', transition: 'ENTER', valueMw: 3120 }, { siteUrl: SITE });
    expect(r.html).toContain('<b>Load shedding reached 3,120 MW</b>');
    expect(r.html).toContain('above the 3,000 MW alert level');
    expect(r.html).toContain('20:00');
    expect(new URL(r.buttons[0].url).searchParams.get('utm_campaign')).toBe('grid_alert');
  });

  it('ESCALATE says what it rose from', () => {
    const r = renderGridAlert({ ...base, rule: 'HIGH_LOAD_SHED', transition: 'ESCALATE', valueMw: 3640, previousMw: 3120 }, { siteUrl: SITE });
    expect(r.html).toContain('up from 3,120 MW at the last alert');
  });

  it('RECOVER is marked cleared', () => {
    const r = renderGridAlert({ ...base, rule: 'HIGH_LOAD_SHED', transition: 'RECOVER', valueMw: 1980, thresholdMw: 2500 }, { siteUrl: SITE });
    expect(r.html).toMatch(/^<b>GRID ALERT CLEARED<\/b>/);
    expect(r.html).toContain('back below 2,500 MW');
  });

  it('a generation drop states both hours', () => {
    const r = renderGridAlert({ ...base, rule: 'GENERATION_DROP', transition: 'ENTER', valueMw: 12100, previousMw: 14440, thresholdMw: 2000 }, { siteUrl: SITE });
    expect(r.html).toContain('<b>Generation fell 2,340 MW in one hour</b>');
    expect(r.html).toContain('down from 14,440 MW an hour earlier');
  });
});

describe('daily summary', () => {
  const day = {
    energyDay: '2026-09-13',
    eveningPeakDemandMw: 18178,
    eveningPeakGenMw: 17000,
    eveningPeakTime: '20:00',
    dayPeakGenMw: 15000,
    maxGenMw: 17100,
    energyGenGwh: 385.24,
    energyUnservedGwh: 24.639,
    fuelMix: [
      { name: 'Gas', gwh: 150 },
      { name: 'Coal', gwh: 100 },
      { name: 'HFO', gwh: 50 },
    ],
    sourceFile: 'Daily Report 14-09-2026.xlsx',
  };

  it('prints PGCB’s figures and cites the workbook', () => {
    const r = renderDailySummary(day, { siteUrl: SITE });
    expect(r.html).toContain('<b>DAILY SUMMARY</b> · 13 Sep 2026');
    expect(r.html).toMatch(/Energy not served\s+24\.6 GWh/);
    expect(r.html).toContain('Daily Report 14-09-2026.xlsx');
    expect(r.html).toContain('Generation mix: gas 50%, coal 33%, hfo 17%.');
  });

  it('says the figure is not printed rather than showing zero', () => {
    const r = renderDailySummary({ ...day, energyUnservedGwh: null }, { siteUrl: SITE });
    expect(r.html).toMatch(/Energy not served\s+—/);
    expect(r.html).toContain('prints no energy-not-served figure');
  });
});
