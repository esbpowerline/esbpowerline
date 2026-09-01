import { describe, it, expect } from 'vitest';
import { verifyDayBeforePublish, describeBlockingFindings } from '@/lib/data/verify-gate.server';

/**
 * The review gate, exercised against the real archive and the real checker.
 *
 * `DataDraft.validation` is documented as what "the reviewer must see before
 * approving", and the publish route read the permission and never read the
 * validation — parse → publish, with review as a convention. These assert the
 * policy that replaced it.
 *
 * This file used to point at a genuinely broken day (2020-09-26, whose gas
 * rollup dropped Beanibazar's 8.1 MMCFD) and assert it was refused. That day is
 * fixed, and so is every other: the archive now carries zero `verify:data`
 * ERRORs across all 4,545 days, down from 45. So the refusal case can no longer
 * be demonstrated on real data, and the test that matters became the opposite
 * one — that nothing in the archive would be refused. If a future ingest lands
 * a day that asserts something no source stated, this is what says so.
 */
describe('verifyDayBeforePublish', () => {
  it('publishes a day that only disagrees with itself', async () => {
    // 2026-08-30 carries WARNs — zone sums under the evening peak, hourly rows
    // that do not balance. Those are true facts about PGCB's own document and
    // must reach the site; withholding them would be the silent repair the
    // whole doctrine forbids. Only ERROR blocks.
    const verdict = await verifyDayBeforePublish('2026-08-30');

    expect(verdict.ok).toBe(true);
    if (!verdict.ok) throw new Error('expected a clean verdict');
    expect(verdict.report.counts.ERROR).toBe(0);
    expect(verdict.report.counts.WARN).toBeGreaterThan(0);
  }, 60_000);

  it('would not refuse the days the site is currently serving', async () => {
    // The public window plus the newest days — what a reader can actually
    // reach, and what a re-publish would most likely touch.
    for (const day of ['2026-08-24', '2026-08-27', '2026-08-29', '2026-08-30']) {
      const verdict = await verifyDayBeforePublish(day);
      expect(verdict.ok, `${day} would be refused by the publish gate`).toBe(true);
    }
  }, 120_000);

  it('reports a day that was repaired as clean', async () => {
    // 2020-09-26's SGFL row read 101.4 where the document's own field rows sum
    // to 109.5 — short by exactly Beanibazar. It was the last ERROR standing.
    const verdict = await verifyDayBeforePublish('2020-09-26');
    expect(verdict.ok).toBe(true);
  }, 60_000);

  it('describes blockers one per line for the operator', () => {
    expect(
      describeBlockingFindings([
        { check: 'provenance', severity: 'ERROR', day: '2026-01-01', message: 'no sourceFiles' },
        { check: 'carry-forward', severity: 'ERROR', day: '2026-01-02', message: 'repeats the day before' },
      ]),
    ).toBe('2026-01-01 provenance: no sourceFiles; 2026-01-02 carry-forward: repeats the day before');
  });
});
