import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PERMISSION_MATRIX,
  LEGACY_PERMISSION_LEVELS,
  can,
  type Role,
} from '@/lib/constants';

// The matrix replaced numeric thresholds and must start behavior-identical:
// this test RECOMPUTES the old `level >= threshold` rule for every role ×
// action pair and diffs it against the explicit grants. From here on, any
// policy change is a deliberate one-line diff in the matrix, and this file's
// snapshot of the legacy behavior is the proof the translation was faithful.

const roles = Object.keys(ROLES) as Role[];

describe('permission matrix', () => {
  it('is behavior-identical to the legacy thresholds for every role × action', () => {
    const mismatches: string[] = [];
    for (const [action, threshold] of Object.entries(LEGACY_PERMISSION_LEVELS)) {
      for (const role of roles) {
        const legacy = ROLES[role].level >= threshold;
        const now = can(role, action);
        if (legacy !== now) mismatches.push(`${role} × ${action}: legacy=${legacy} now=${now}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('covers exactly the legacy action set — nothing dropped, nothing invented', () => {
    expect(Object.keys(PERMISSION_MATRIX).sort()).toEqual(
      Object.keys(LEGACY_PERMISSION_LEVELS).sort(),
    );
  });

  it('denies unknown actions to everyone, SUPER_ADMIN included', () => {
    // The old `?? 100` fallback let SUPER_ADMIN pass a check against a typo'd
    // action name. Deny-by-default is the deliberate tightening.
    expect(can('SUPER_ADMIN', 'article.pubish')).toBe(false);
    expect(can('SUPER_ADMIN', 'no.such.action')).toBe(false);
  });

  it('denies everything to an absent role', () => {
    expect(can(undefined, 'comment.create')).toBe(false);
  });
});
