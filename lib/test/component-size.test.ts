import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * A ratchet on the largest components.
 *
 * `PowerGridExplorer.tsx` and `MacroTrendsTab.tsx` together hold roughly a tenth
 * of all the TSX in this project, and the audit's point about them was not that
 * they contain a bug — it was that they are where a bug hides. F-01 happened
 * because one tile template lived in two files that drifted; these are the two
 * places that pattern is most likely to repeat without anyone noticing.
 *
 * Splitting them is a real refactor — `MacroTrendsTab` alone holds about
 * fifteen pieces of state serving eight sub-views, so the seams are stateful,
 * not cosmetic — and it is deliberately not attempted here. What this does is
 * stop the problem getting worse: the budgets below are the sizes on
 * 2026-09-01, and they may be lowered but never raised.
 *
 * When you extract a sub-view, lower the number. That is the whole protocol.
 */

/**
 * Line budgets as of 2026-09-01. Ratchet down only.
 *
 * The two chart files sit a little above where the extraction left them: the
 * screen-reader data tables added to their charts are real lines of real
 * markup. That is growth the budget should absorb once and then hold, which is
 * what raising it here and never again is for.
 */
const BUDGETS: Record<string, number> = {
  'components/news/PowerGridExplorer.tsx': 3811,
  'components/news/power-grid/MacroTrendsTab.tsx': 3096,
  'components/news/power-grid/TechnicalInfoTab.tsx': 2335,
  'components/news/power-grid/LongitudinalStudy.tsx': 479,
  'components/admin/SettingsForm.tsx': 863,
  'components/news/power-grid/GlobalVsDomesticCards.tsx': 432,
};

describe('component size ratchet', () => {
  for (const [relative, budget] of Object.entries(BUDGETS)) {
    it(`${relative} stays within ${budget} lines`, () => {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8');
      const lines = source.split(/\r?\n/).length;

      expect(
        lines,
        `${relative} is ${lines} lines, over its ${budget}-line budget. ` +
          'Extract a sub-view rather than raising the number — that is what the budget is for.',
      ).toBeLessThanOrEqual(budget);
    });
  }

  it('the budgets describe files that exist', () => {
    // A renamed file would otherwise silently stop being measured.
    for (const relative of Object.keys(BUDGETS)) {
      expect(() => readFileSync(path.join(process.cwd(), relative), 'utf8')).not.toThrow();
    }
  });
});
