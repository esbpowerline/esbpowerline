import { describe, expect, it } from 'vitest';
import {
  buildGridExplorerQuery,
  parseGridExplorerTab,
  readGridExplorerUrlBoot,
  type GridExplorerTab,
} from '@/lib/grid-explorer-url';

/**
 * The tab union and the TAB_IDS allowlist are two lists of the same thing, and
 * widening one without the other fails silently.
 *
 * The Time Machine shipped exactly that way: `GridExplorerTab` gained
 * `timemachine`, TAB_IDS did not, so `?tab=timemachine` parsed as null and the
 * tab could not be linked to at all. Nothing threw and no test failed — the page
 * just quietly opened on Overview, which is the hardest kind of bug to notice
 * because it looks like a working link.
 */
describe('grid explorer URL boot', () => {
  const TABS: GridExplorerTab[] = [
    'overview', 'gen', 'gas', 'imports', 'renewables',
    'transmission', 'regional', 'macro', 'plants', 'timemachine',
  ];

  it('parses every tab the union declares', () => {
    for (const t of TABS) {
      expect(parseGridExplorerTab(t), t).toBe(t);
    }
  });

  it('keeps the Time Machine linkable', () => {
    expect(readGridExplorerUrlBoot('?tab=timemachine')).toMatchObject({ tab: 'timemachine' });
  });

  it('rejects a tab it does not know', () => {
    expect(parseGridExplorerTab('my-energy')).toBeNull();
    expect(parseGridExplorerTab(null)).toBeNull();
  });

  it('round-trips a tab through build and read', () => {
    const q = buildGridExplorerQuery('timemachine', '2026-09-04', 'overview', '2026-09-04');
    expect(readGridExplorerUrlBoot(`?${q}`)).toMatchObject({ tab: 'timemachine' });
  });

  it('omits defaults so the canonical URL stays short', () => {
    // Overview on the latest day is the bare path — no query at all.
    expect(buildGridExplorerQuery('overview', '2026-09-04', 'overview', '2026-09-04')).toBe('');
  });

  it('carries a non-latest date', () => {
    const q = buildGridExplorerQuery('timemachine', '2017-02-09', 'overview', '2026-09-04');
    expect(readGridExplorerUrlBoot(`?${q}`)).toMatchObject({
      tab: 'timemachine',
      date: '2017-02-09',
    });
  });
});
