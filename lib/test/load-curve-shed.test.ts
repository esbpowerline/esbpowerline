import { describe, it, expect } from 'vitest';
import { shedBaselineRuns } from '@/components/news/power-grid/LoadCurveCanvas';

/**
 * The load curve's shed strip has to say three different things:
 *
 *   a figure          the grid shed this much
 *   a published zero  the grid shed nothing, and the report says so
 *   no figure         the report is silent for this hour
 *
 * The first two are visible on any recent day. The third only occurs on
 * 2026-06-28 and 2026-06-29, both outside the visitor window, so it cannot be
 * checked by looking — which is exactly why it is checked here. Drawing one
 * unbroken baseline across a silent stretch claims a record that does not
 * exist; the line has to break where the data does.
 */

/** A day's worth of hourly readings, an hour apart, mapped 1 minute to 1 unit. */
const x = (mins: number) => mins;
const LEFT = 0;
const RIGHT = 1380;

function rows(sheds: (number | null)[]) {
  return sheds.map((loadShed, i) => ({ mins: i * 60, loadShed }));
}

describe('shed baseline runs', () => {
  it('draws one unbroken line when every hour reported', () => {
    const runs = shedBaselineRuns(rows([100, 0, 250, 0, 40]), x, LEFT, RIGHT);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toEqual({ from: LEFT, to: RIGHT });
  });

  it('treats a published zero as reported, not as silence', () => {
    // All zeros is a real day — 91 days of 2026 contain published zeros and
    // some are zero throughout. The baseline must still be continuous.
    const runs = shedBaselineRuns(rows([0, 0, 0, 0]), x, LEFT, RIGHT);
    expect(runs).toHaveLength(1);
  });

  it('breaks the line where an hour published no figure', () => {
    const runs = shedBaselineRuns(rows([100, 200, null, 300, 400]), x, LEFT, RIGHT);
    expect(runs).toHaveLength(2);
    // The gap opens between the two readings that straddle the silence.
    expect(runs[0].to).toBeLessThan(runs[1].from);
  });

  it('opens a gap for every separate silence', () => {
    const runs = shedBaselineRuns(rows([10, null, 20, null, 30]), x, LEFT, RIGHT);
    expect(runs).toHaveLength(3);
  });

  it('draws nothing at all when the whole column is null', () => {
    // 2026-06-28 and 06-29: 24 null rows each. An empty strip with no baseline
    // is the honest picture — the alternative reads as "shed nothing all day".
    expect(shedBaselineRuns(rows([null, null, null, null]), x, LEFT, RIGHT)).toEqual([]);
  });

  it('anchors the first and last spans to the plot edges', () => {
    const runs = shedBaselineRuns(rows([5, 5, null, 5]), x, LEFT, RIGHT);
    expect(runs[0].from).toBe(LEFT);
    expect(runs[runs.length - 1].to).toBe(RIGHT);
  });
});
