/**
 * The event registry — one entry per documented event.
 *
 * This exists so that the second event study costs a config block rather than
 * a rewrite. Everything the page renders is derived from the definition below
 * plus the archive: the window, the lead-in, which series carries the story,
 * and which of the newsroom's own articles belong to it. Nothing about the
 * July-August 2026 shortfall is compiled into the components.
 *
 * The archive holds 4,550 energy days. Every one of them is inside some story
 * nobody has told yet — the point of the registry is that telling the next one
 * is a matter of naming its window, not of building another page.
 */

import type { DateRange, EventStudySeriesId } from '@/lib/data/analysis/event-study';
import { shiftDay } from '@/lib/data/grid/observation-window';

export interface EventStudyDefinition {
  /** URL segment under /analysis. */
  slug: string;
  title: string;
  /** One sentence, factual, under the title. */
  standfirst: string;
  /**
   * The first day the break is visible IN THE DATA — not the day it was
   * reported, and not the day a cause was announced. For this event that is
   * the gas day starting 2026-07-21, when the RPGCL R-LNG line fell 993.5 →
   * 621.6 MMCFD against an unchanged printed capacity of 1,100.
   */
  incidentDate: string;
  /**
   * Days of ordinary operation shown before it. A reader cannot see that
   * something broke without seeing what unbroken looked like, and three days
   * is enough to establish a level without burying the break.
   */
  leadInDays: number;
  /** Last day of the study. */
  endDate: string;
  /** The 30 days before the lead-in, for the signed baseline differences. */
  baseline: DateRange;
  /** The series the day-by-day line leads with — the one that moved first. */
  headlineSeries: EventStudySeriesId;
  /**
   * The series whose magnitude the timeline renders as a bar: the human
   * consequence, not the cause.
   */
  intensitySeries: EventStudySeriesId;
  /**
   * Which of ESB PowerLine's own published articles belong to this event.
   *
   * Terms, not a hand-picked slug list, so the timeline picks up coverage
   * filed after this was written. Matched case-insensitively against title and
   * excerpt. Kept deliberately narrow: 'gas' alone would sweep in every
   * pipeline and billing story in the window, and a timeline padded with
   * unrelated coverage is a worse claim than no timeline.
   */
  coverageTerms: string[];
}

export const GAS_CRISIS_2026: EventStudyDefinition = {
  slug: 'gas-crisis-2026',
  title: 'The R-LNG shortfall',
  standfirst:
    'Three ordinary days, then the imported-gas line halved. What the national record shows, day by day, against what was reported at the time.',
  incidentDate: '2026-07-21',
  leadInDays: 3,
  endDate: '2026-08-31',
  baseline: { start: '2026-06-18', end: '2026-07-17' },
  headlineSeries: 'gasRlng',
  intensitySeries: 'unserved',
  /**
   * Three groups, and the middle one is the reason this is a list rather than
   * a single word. The cause terms catch the supply story; the consequence
   * terms catch what the shortfall did to people, which is most of what was
   * actually published — the 12 August order shortening shop hours and the
   * fertiliser plants shutting down are this event, and a filter built only
   * from 'lng' would have thrown both away. 'gas' alone is deliberately absent:
   * it sweeps in every pipeline, billing and exploration story in the window,
   * and a timeline padded with unrelated coverage is a worse claim than a
   * narrow one.
   */
  coverageTerms: [
    // the supply itself
    'lng', 'terminal', 'fsru', 'moheshkhali', 'moheskhali', 'excelerate', 'summit',
    'gas supply', 'gas grid', 'gas shortage', 'gas and raw material',
    // the shortfall, named
    'load shedding', 'load-shedding', 'loadshedding',
    'gas crisis', 'power crisis', 'energy crisis', 'energy shortage',
    'energy shortages', 'supply crisis', 'gas and power crisis',
    // what it did
    'production halts', 'factories', 'industrial output', 'shops may open',
  ],
};

export const EVENT_STUDIES: EventStudyDefinition[] = [GAS_CRISIS_2026];

export function findEventStudy(slug: string): EventStudyDefinition | undefined {
  return EVENT_STUDIES.find((e) => e.slug === slug);
}

/** The full window: lead-in days, the incident day, and everything after. */
export function eventWindow(def: EventStudyDefinition): DateRange {
  return { start: shiftDay(def.incidentDate, -def.leadInDays), end: def.endDate };
}

/**
 * The documented event a given energy day falls inside, if any.
 *
 * Used by the Grid Explorer's date row, which is a client component — this is
 * why the registry type-imports the study engine rather than importing it:
 * nothing here should pull the analysis modules into the explorer's chunk.
 */
export function findEventStudyForDate(iso: string): EventStudyDefinition | undefined {
  return EVENT_STUDIES.find((def) => {
    const { start, end } = eventWindow(def);
    return iso >= start && iso <= end;
  });
}
