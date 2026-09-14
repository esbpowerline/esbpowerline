/**
 * Grid alert state machines — pure functions, no IO, no clock.
 *
 * Every decision is made against the hour the reading describes, never
 * against the wall clock. NLDC posts in batches, three to six hours late; a
 * cooldown measured in wall-clock time would treat six hours posted at once as
 * six simultaneous readings, and replaying the same batch would give a
 * different answer. Measured against `observedAt`, the same hours always
 * produce the same alerts.
 *
 * Thresholds come from the runtime config, whose defaults cite the measured
 * distributions (docs/telegram-bot/DISCOVERY.md §4):
 *   HIGH_LOAD_SHED   2.6% of posted hours were ≥3,000 MW over 2026-04-22..09-14.
 *                    32% were ≥1,000 MW — a threshold there would fire most days.
 *   GENERATION_DROP  a fall of ≥2,000 MW in one hour happened twice in the year
 *                    to 2026-09-14; the 2022-10-04 collapse was 7,176 MW.
 *
 * Anti-spam, by construction:
 *   - an alert fires on ENTERING the state, not on being in it;
 *   - while active it re-alerts only if the value rose by the escalation step
 *     AND the re-alert interval has passed since the last alert;
 *   - it clears below a lower threshold than it entered at (hysteresis), so a
 *     value hovering at the line does not flap;
 *   - a missing reading is not evidence of anything and changes nothing.
 */

import type { AlertTransition } from '@/lib/notifications/types';

const HOUR_MS = 3_600_000;

export interface LoadShedAlertState {
  active: boolean;
  lastAlertedMw: number | null;
  /** observedAt of the reading that last produced an alert. */
  lastAlertAt: string | null;
  /** observedAt of the newest reading evaluated. */
  lastObservedAt: string | null;
}

export const INITIAL_LOAD_SHED_STATE: LoadShedAlertState = { active: false, lastAlertedMw: null, lastAlertAt: null, lastObservedAt: null };

export interface LoadShedThresholds {
  loadShedAlertMw: number;
  loadShedClearMw: number;
  loadShedEscalationMw: number;
  loadShedRealertHours: number;
}

export interface LoadShedDecision {
  state: LoadShedAlertState;
  alert: { transition: AlertTransition; valueMw: number; previousMw: number | null; thresholdMw: number } | null;
}

export function evaluateLoadShed(
  state: LoadShedAlertState,
  reading: { observedAt: Date; loadShedMw: number | null },
  t: LoadShedThresholds,
): LoadShedDecision {
  const at = reading.observedAt.toISOString();
  if (state.lastObservedAt && at <= state.lastObservedAt) return { state, alert: null };
  const seen = { ...state, lastObservedAt: at };
  const v = reading.loadShedMw;
  if (v === null) return { state: seen, alert: null };

  if (!state.active) {
    if (v >= t.loadShedAlertMw) {
      return {
        state: { active: true, lastAlertedMw: v, lastAlertAt: at, lastObservedAt: at },
        alert: { transition: 'ENTER', valueMw: v, previousMw: null, thresholdMw: t.loadShedAlertMw },
      };
    }
    return { state: seen, alert: null };
  }

  if (v < t.loadShedClearMw) {
    return {
      state: { active: false, lastAlertedMw: null, lastAlertAt: at, lastObservedAt: at },
      alert: { transition: 'RECOVER', valueMw: v, previousMw: state.lastAlertedMw, thresholdMw: t.loadShedClearMw },
    };
  }

  const rose = state.lastAlertedMw !== null && v >= state.lastAlertedMw + t.loadShedEscalationMw;
  const waited = !state.lastAlertAt || reading.observedAt.getTime() - new Date(state.lastAlertAt).getTime() >= t.loadShedRealertHours * HOUR_MS;
  if (rose && waited) {
    return {
      state: { active: true, lastAlertedMw: v, lastAlertAt: at, lastObservedAt: at },
      alert: { transition: 'ESCALATE', valueMw: v, previousMw: state.lastAlertedMw, thresholdMw: t.loadShedAlertMw },
    };
  }
  return { state: seen, alert: null };
}

export interface GenerationDropState {
  lastObservedAt: string | null;
}

export const INITIAL_GENERATION_DROP_STATE: GenerationDropState = { lastObservedAt: null };

export interface GenerationDropDecision {
  state: GenerationDropState;
  alert: { valueMw: number; previousMw: number; thresholdMw: number } | null;
}

/**
 * One event per qualifying hour: a drop is something that happened, not a
 * condition that persists. Both totals must be consistent with their own parts
 * and exactly one hour apart — a gap in NLDC's posting is not a drop.
 */
export function evaluateGenerationDrop(
  state: GenerationDropState,
  previous: { observedAt: Date; generationMw: number | null; consistent: boolean } | null,
  current: { observedAt: Date; generationMw: number | null; consistent: boolean },
  thresholdMw: number,
): GenerationDropDecision {
  const at = current.observedAt.toISOString();
  if (state.lastObservedAt && at <= state.lastObservedAt) return { state, alert: null };
  const next = { lastObservedAt: at };
  if (!previous || current.observedAt.getTime() - previous.observedAt.getTime() !== HOUR_MS) return { state: next, alert: null };
  if (!previous.consistent || !current.consistent || previous.generationMw === null || current.generationMw === null) {
    return { state: next, alert: null };
  }
  const drop = previous.generationMw - current.generationMw;
  if (drop >= thresholdMw) {
    return { state: next, alert: { valueMw: current.generationMw, previousMw: previous.generationMw, thresholdMw } };
  }
  return { state: next, alert: null };
}
