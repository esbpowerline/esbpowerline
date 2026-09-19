import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbsentFiguresStrip } from '@/components/news/power-grid/PendingDayPanel';

/**
 * A day whose figures are not held prints dashes, never zeros.
 *
 * The Grid Explorer's Overview used to fall back to a hand-written object of
 * zeros when `activeData` was null, so a tier-locked day rendered "Evening
 * Peak Gen: 0 MW" for a figure it had never fetched (live in production until
 * 2026-09-19). Zero asserts a measurement; the dash says nobody filed one.
 */
describe('AbsentFiguresStrip', () => {
  const html = renderToStaticMarkup(<AbsentFiguresStrip hint="locked for this plan" />);

  it('holds all six tiles of the Overview layout', () => {
    for (const label of ['Peak Supply', 'Peak Demand', 'Peak Deficit', 'Capacity Idle', 'Gas Supply']) {
      expect(html, label).toContain(label);
    }
    expect(html.match(/—/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
  });

  it('prints no numeric figure and no unit', () => {
    // Any digit here would be a measurement this day does not have. The
    // strip's own "Show N more" collapse control is chrome, not a figure.
    const text = html.replace(/<[^>]+>/g, ' ').replace(/Show \d+ more/g, '');
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/\bMW\b|\bMKWh\b|\bMMCFD\b/);
  });

  it('names what the reader is waiting on', () => {
    expect(html).toContain('locked for this plan');
  });
});
