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

import type { ChainCardSet, DateRange, EventStudySeriesId } from '@/lib/data/analysis/event-study';
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
   * Which reading order the chain cards follow. 'daily-energy' reads the
   * shortfall from P1's daily energy demand and unserved, which PGCB only
   * prints from 2025; 'evening-peak' reads it at the evening peak hour, which
   * P1 has printed in every era.
   */
  chainCards: ChainCardSet;
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
  chainCards: 'daily-energy',
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

/**
 * The May-October 2024 R-LNG shortfall, around Cyclone Remal.
 *
 * Named for what the documents show and for the one cause a document in this
 * archive does name. PGCB's own outage log cites "Cyclone Remal" for two
 * Barishal 132 kV trips on 26 May and one on 28 May. Petrobangla's report
 * names nothing: it prints one aggregated "R-LNG Terminal" row, capacity
 * 1,100 MMCFD throughout, and a footnote "* RPGCL Shutdown." that it printed on
 * nearly every day from April to 14 July 2024 whatever the line delivered —
 * a standing note, not a report of this event, and it must not be read as one.
 *
 * The break is the gas day starting 2024-05-24, not the landfall: R-LNG fell
 * 1,039.0 → 646.7 MMCFD on that day and 325.5 on the next, two days before
 * PGCB's log first names the cyclone. It rebounded to 906.6 on 27 May, then
 * held at 597-612 from 30 May until 1 October 2024 — four months — apart from
 * dips to 243.5 on 10-11 July and 327.6 on 15 September. The window closes on
 * 5 October so the step back up to ~700 on 2 October is inside it.
 *
 * PGCB printed no daily energy unserved in 2024, so the consequence is read at
 * the evening peak (see `chainCards`). The reporting that names the terminal
 * lives in evidence/events/remal-2024/external-coverage.json, dated and
 * sourced, and is never merged into a figure. EVENT_STUDY_REMAL_2024.md holds
 * the evidence pass behind every choice here.
 */
export const REMAL_2024: EventStudyDefinition = {
  slug: 'remal-2024',
  title: 'The R-LNG line after Remal',
  standfirst:
    'Over Cyclone Remal the imported-gas line fell to a third of its level, came back for three days, then held near 600 MMCFD for four months. What the national record shows, day by day, beside what was reported at the time.',
  incidentDate: '2024-05-24',
  leadInDays: 3,
  endDate: '2024-10-05',
  // The 30 days before the lead-in. It contains two one-day R-LNG dips of its
  // own — 828.4 on 1 May and 818.9 on 19 May — and a printed capacity of
  // 1,000 until 26 April. Carried, not trimmed.
  baseline: { start: '2024-04-21', end: '2024-05-20' },
  headlineSeries: 'gasRlng',
  intensitySeries: 'eveningShed',
  chainCards: 'evening-peak',
  // The newsroom's first published article is 2024-11-13, so this matches
  // nothing today. Declared anyway, so the rule is stated rather than absent.
  coverageTerms: [
    'remal', 'cyclone', 'lng', 'fsru', 'terminal', 'moheshkhali', 'moheskhali',
    'summit', 'excelerate', 'gas supply', 'gas shortage', 'gas crisis',
    'load shedding', 'load-shedding',
  ],
};

// Order matters: the explorer's date control falls back to the first entry
// when a day belongs to no study.
export const EVENT_STUDIES: EventStudyDefinition[] = [GAS_CRISIS_2026, REMAL_2024];

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
