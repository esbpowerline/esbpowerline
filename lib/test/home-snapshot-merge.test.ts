import { describe, it, expect } from 'vitest';
import {
  DAILY_SNAPSHOT_LABELS,
  buildHomeSnapshotFromDaily,
  type HomeSnapshotStat,
} from '@/lib/data/grid/home-snapshot-core';
import {
  LIVE_BACKED_LABELS,
  SNAPSHOT_SLOTS,
  mergeHomeSnapshot,
} from '@/lib/data/grid/home-snapshot-merge';
import { SAMPLE_DAILY_REPORT, SAMPLE_SREDA } from '@/lib/test/fixtures/daily-report';

/**
 * The contract between the three pieces of the homepage snapshot.
 *
 * These are not tests of arithmetic. They are the tests that were missing when
 * `DAILY_SNAPSHOT_LABELS[0]` was renamed to 'Current Demand' and the builder
 * was left emitting 'Evening Peak Demand'. Nothing type-checked the two
 * against each other, so the real PGCB figure was silently discarded at the
 * panel's door and a hard-coded 16,740 MW rendered in its place, badged LIVE
 * and attributed to PGCB — on the homepage, for months.
 */
describe('snapshot label contract', () => {
  it('the builder emits exactly the declared labels, in the declared order', () => {
    const emitted = buildHomeSnapshotFromDaily(
      SAMPLE_DAILY_REPORT as never,
      SAMPLE_SREDA as never,
    ).map((s) => s.label);

    // Order matters: the panel renders the slots in this sequence.
    expect(emitted).toEqual([...DAILY_SNAPSHOT_LABELS]);
  });

  it('the builder emits the declared labels on a day with no SREDA register too', () => {
    const emitted = buildHomeSnapshotFromDaily(SAMPLE_DAILY_REPORT as never, null).map(
      (s) => s.label,
    );
    expect(emitted).toEqual([...DAILY_SNAPSHOT_LABELS]);
  });

  it('the slot spec covers every declared label, once, in order', () => {
    expect(SNAPSHOT_SLOTS.map((s) => s.label)).toEqual([...DAILY_SNAPSHOT_LABELS]);
  });

  it('every slot names the source that owes its figure', () => {
    for (const slot of SNAPSHOT_SLOTS) {
      expect(slot.source, `${slot.label} has no owing source`).toBeTruthy();
    }
  });
});

describe('mergeHomeSnapshot', () => {
  const stat = (label: string, value: number | null, extra: Partial<HomeSnapshotStat> = {}) =>
    ({ label, value, unit: 'MW', icon: 'Zap', ...extra }) as HomeSnapshotStat;

  it('never invents a figure for a tile the server did not fill', () => {
    // The F-01 shape exactly: nothing arrives for Current Demand, and the live
    // overlay is not in play. The tile must hold its place as a named gap.
    const slots = mergeHomeSnapshot([]);
    const current = slots.find((s) => s.label === 'Current Demand');

    expect(current).toBeDefined();
    expect(current?.value).toBeNull();
    expect(current?.awaiting).toBe('NLDC');

    // And no slot anywhere may carry a number nobody supplied.
    for (const slot of slots) {
      expect(slot.value, `${slot.label} materialised a value from nothing`).toBeNull();
    }
  });

  it('carries a real figure through unchanged', () => {
    const slots = mergeHomeSnapshot([stat('Peak Generation', 16181)]);
    const peak = slots.find((s) => s.label === 'Peak Generation');
    expect(peak?.value).toBe(16181);
    expect(peak?.awaiting).toBeUndefined();
  });

  it('preserves an explicit awaiting from the builder', () => {
    const slots = mergeHomeSnapshot([
      stat('Gas Supply', null, { unit: 'MMCFD', awaiting: 'Petrobangla' }),
    ]);
    const gas = slots.find((s) => s.label === 'Gas Supply');
    expect(gas?.value).toBeNull();
    expect(gas?.awaiting).toBe('Petrobangla');
  });

  it('always renders twelve slots, however little the sources have filed', () => {
    // The panel is a fixed 2x6. A tile that disappears on the day Petrobangla
    // ran late reflows the other eleven, so the layout changed shape most days.
    expect(mergeHomeSnapshot([]).map((s) => s.label)).toEqual([...DAILY_SNAPSHOT_LABELS]);
    expect(mergeHomeSnapshot(null).map((s) => s.label)).toEqual([...DAILY_SNAPSHOT_LABELS]);
  });

  it('marks the live-backed tiles the NLDC overlay is allowed to fill', () => {
    // `liveValueFor` in the panel must return a figure for exactly these, and
    // no others — a label listed here but missing there waits forever.
    expect(LIVE_BACKED_LABELS).toEqual(
      new Set([
        'Current Demand',
        'Peak Demand',
        'Peak Generation',
        'Load Shedding',
        'Gas Generation',
        'Coal Generation',
        'Grid Import',
        'Solar + Wind',
      ]),
    );
  });

  it('keeps the grid the same shape whether or not the slow sources have filed', () => {
    const full = buildHomeSnapshotFromDaily(SAMPLE_DAILY_REPORT as never, SAMPLE_SREDA as never);
    const noGas = full.filter((s) => s.label !== 'Gas Supply');

    // The snapshot is a fixed 2x6; losing a tile reflows the other eleven.
    expect(mergeHomeSnapshot(noGas).map((s) => s.label)).toEqual(
      mergeHomeSnapshot(full).map((s) => s.label),
    );
  });

  it('ignores a label the snapshot does not declare', () => {
    // The rename that caused F-01 would land here: an unknown label is dropped
    // rather than pushed into a slot it does not belong to.
    const slots = mergeHomeSnapshot([stat('Evening Peak Demand', 16741)]);
    expect(slots.some((s) => s.label === ('Evening Peak Demand' as never))).toBe(false);
    expect(slots.find((s) => s.label === 'Current Demand')?.value).toBeNull();
  });
});
