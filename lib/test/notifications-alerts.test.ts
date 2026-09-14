import { describe, expect, it } from 'vitest';
import {
  INITIAL_GENERATION_DROP_STATE,
  INITIAL_LOAD_SHED_STATE,
  evaluateGenerationDrop,
  evaluateLoadShed,
  type LoadShedAlertState,
} from '@/lib/notifications/grid/alerts';

const T = { loadShedAlertMw: 3000, loadShedClearMw: 2500, loadShedEscalationMw: 500, loadShedRealertHours: 3 };
const at = (h: number) => new Date(Date.UTC(2026, 8, 14, h));

function run(values: Array<number | null>, start = 12) {
  let state: LoadShedAlertState = INITIAL_LOAD_SHED_STATE;
  const alerts: Array<{ hour: number; transition: string; value: number }> = [];
  values.forEach((v, i) => {
    const d = evaluateLoadShed(state, { observedAt: at(start + i), loadShedMw: v }, T);
    state = d.state;
    if (d.alert) alerts.push({ hour: start + i, transition: d.alert.transition, value: d.alert.valueMw });
  });
  return { state, alerts };
}

describe('HIGH_LOAD_SHED', () => {
  it('alerts once on entering, not on every hour above the line', () => {
    const { alerts } = run([2800, 3100, 3150, 3120, 3180]);
    expect(alerts).toEqual([{ hour: 13, transition: 'ENTER', value: 3100 }]);
  });

  it('re-alerts only after a real rise AND the interval', () => {
    // +600 at hour 14 is a real rise but only an hour after the alert: silent.
    // Hour 16 is 3 h after the alert and ≥500 above it: escalates.
    const { alerts } = run([3100, 3700, 3650, 3650]);
    expect(alerts.map((a) => a.transition)).toEqual(['ENTER', 'ESCALATE']);
    expect(alerts[1]).toMatchObject({ hour: 15, value: 3650 });
  });

  it('clears below the lower threshold and says so once', () => {
    const { alerts, state } = run([3100, 2700, 2400, 2300]);
    expect(alerts.map((a) => a.transition)).toEqual(['ENTER', 'RECOVER']);
    expect(state.active).toBe(false);
  });

  it('does not flap around the line (hysteresis)', () => {
    const { alerts } = run([3050, 2950, 3010, 2900, 3020, 2600]);
    expect(alerts.map((a) => a.transition)).toEqual(['ENTER']);
  });

  it('a missing reading is not evidence and changes nothing', () => {
    const { alerts, state } = run([3100, null, null]);
    expect(alerts).toHaveLength(1);
    expect(state.active).toBe(true);
  });

  it('never alerts twice for the same hour (replay safety)', () => {
    const first = evaluateLoadShed(INITIAL_LOAD_SHED_STATE, { observedAt: at(13), loadShedMw: 3200 }, T);
    const replay = evaluateLoadShed(first.state, { observedAt: at(13), loadShedMw: 3200 }, T);
    expect(first.alert?.transition).toBe('ENTER');
    expect(replay.alert).toBeNull();
    expect(replay.state).toEqual(first.state);
  });

  it('gives the same answer for the same hours, however they arrive', () => {
    const batch = run([2800, 3100, 3700, 3700, 3700, 2200]).alerts;
    const again = run([2800, 3100, 3700, 3700, 3700, 2200]).alerts;
    expect(again).toEqual(batch);
  });
});

describe('GENERATION_DROP', () => {
  const g = (h: number, mw: number | null, consistent = true) => ({ observedAt: at(h), generationMw: mw, consistent });

  it('alerts on a drop at or beyond the threshold', () => {
    const d = evaluateGenerationDrop(INITIAL_GENERATION_DROP_STATE, g(14, 14440), g(15, 12100), 2000);
    expect(d.alert).toEqual({ valueMw: 12100, previousMw: 14440, thresholdMw: 2000 });
  });

  it('ignores an ordinary evening ramp-down', () => {
    expect(evaluateGenerationDrop(INITIAL_GENERATION_DROP_STATE, g(22, 15000), g(23, 13900), 2000).alert).toBeNull();
  });

  it('a gap in NLDC’s posting is not a drop', () => {
    expect(evaluateGenerationDrop(INITIAL_GENERATION_DROP_STATE, g(13, 15000), g(15, 11000), 2000).alert).toBeNull();
  });

  it('never compares a total that disagrees with its own parts', () => {
    expect(evaluateGenerationDrop(INITIAL_GENERATION_DROP_STATE, g(14, 15000), g(15, 11000, false), 2000).alert).toBeNull();
    expect(evaluateGenerationDrop(INITIAL_GENERATION_DROP_STATE, g(14, 15000), g(15, null), 2000).alert).toBeNull();
  });

  it('evaluates each hour once', () => {
    const first = evaluateGenerationDrop(INITIAL_GENERATION_DROP_STATE, g(14, 14440), g(15, 12100), 2000);
    expect(evaluateGenerationDrop(first.state, g(14, 14440), g(15, 12100), 2000).alert).toBeNull();
  });
});
