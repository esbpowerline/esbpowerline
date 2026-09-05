/**
 * The day-by-day narrative — computed, never written.
 *
 * The brief for this page was "cinematic", and there is a wrong way to do that
 * which this file exists to rule out: writing a sentence per day. Prose per day
 * would be an editorial claim wearing the archive's clothes, and on a page whose
 * authority rests on every figure being traceable it would be the single most
 * damaging thing we could add.
 *
 * So the drama is carried by structure and by real magnitude. Each day gets its
 * position in the story (three days of ordinary operation, then the break, then
 * however many days it lasted), its own printed figures, the day-on-day change,
 * and whatever the newsroom published that day. A day where the imported-gas
 * line falls 372 MMCFD does not need a sentence telling the reader it was bad.
 *
 * Phases are detected from the headline series itself rather than named by
 * hand — see `detectPhases`. A phase boundary is a real level shift in a
 * published series, so the chapter headings a reader scrolls past are as
 * checkable as the numbers under them.
 */

import type {
  EventStudyResult,
  EventStudySeries,
  EventStudySeriesId,
} from '@/lib/data/analysis/event-study';
import type { EventStudyDefinition } from '@/lib/data/analysis/event-registry';
import { shiftDay } from '@/lib/data/grid/observation-window';

/** One published article, as the timeline needs it. */
export interface CoverageItem {
  date: string;
  title: string;
  slug: string;
  excerpt: string | null;
}

/**
 * One item of external media coverage.
 *
 * A third strand, kept apart from both the archive and this newsroom's own
 * reporting. `reportsOn` is the date the item is ABOUT rather than a publication
 * date we could not always establish, and `dateBasis` says how that was decided
 * — so a reader can check the placement rather than take it. Nothing here is
 * ever plotted, summed, or set against an archive figure.
 */
export interface ExternalCoverageItem {
  outlet: string;
  headline: string;
  url: string;
  reportsOn: string | null;
  dateBasis: string;
}

export interface NarrativeFigure {
  seriesId: EventStudySeriesId;
  label: string;
  unit: string;
  value: number | null;
  /** Change from the previous calendar day; null when either day is unpublished. */
  dayOnDay: number | null;
  provenance: 'P' | 'D';
  publisher: string;
}

export type DayPosition =
  | { kind: 'lead-in'; daysBefore: number }
  | { kind: 'incident' }
  | { kind: 'after'; dayNumber: number };

export interface NarrativeDay {
  date: string;
  position: DayPosition;
  /** The series that carries the story. */
  headline: NarrativeFigure;
  /** The human consequence, rendered as a magnitude bar. */
  intensity: NarrativeFigure;
  /** Everything else worth printing for the day. */
  supporting: NarrativeFigure[];
  /**
   * True when the headline series moved more than `INFLECTION_PCT` against the
   * previous published day. These are the days the reader should not scroll
   * past, and they are found in the data rather than chosen.
   */
  inflection: boolean;
  /** ESB PowerLine articles published on this date, newest first. */
  coverage: CoverageItem[];
  /** External media reporting on this date. */
  external: ExternalCoverageItem[];
}

export interface NarrativePhase {
  /** Index into the day list where this phase starts, inclusive. */
  startDate: string;
  endDate: string;
  /** The mean of the headline series across the phase — DERIVED. */
  levelMean: number | null;
  dayCount: number;
}

export interface EventNarrative {
  days: NarrativeDay[];
  phases: NarrativePhase[];
  /** Coverage that falls in the window but on a day with no archive row. */
  orphanCoverage: CoverageItem[];
  /** External items with no date established — shown outside the timeline. */
  undatedExternal: ExternalCoverageItem[];
  totals: {
    /** Days in the window, and how many the headline publisher actually filed. */
    windowDays: number;
    headlinePublished: number;
    /** Sum of the intensity series across published days — DERIVED. */
    intensitySum: number | null;
    intensityUnit: string;
    /** The worst single published day of the intensity series. */
    intensityPeak: { date: string; value: number } | null;
    coverageCount: number;
    externalCount: number;
    externalOutlets: string[];
  };
}

/**
 * A day-on-day move of this size in the headline series marks an inflection.
 *
 * 12% is not a statistical threshold; it is chosen so that the days it selects
 * for this event are the ones a reader of the archive would independently
 * point at — 21 July (−37%), 6 August (+42%), 13 August (−26%), 15 August
 * (+168%), 22 August (+26%). Ordinary day-to-day drift in R-LNG supply sits
 * well under it. A different event may want a different figure; it is a
 * constant here rather than a magic number at the call site so that changing it
 * is a visible decision.
 */
const INFLECTION_PCT = 12;

/** A level shift of this size opens a new phase. */
const PHASE_SHIFT_PCT = 18;
/** No phase shorter than this; below it the series is oscillating, not shifting. */
const MIN_PHASE_DAYS = 3;

function figureOf(
  series: EventStudySeries,
  date: string,
  prevDate: string,
): NarrativeFigure {
  const at = (d: string) => series.points.find((p) => p.date === d)?.value ?? null;
  const value = at(date);
  const prev = at(prevDate);
  return {
    seriesId: series.id,
    label: series.label,
    unit: series.unit,
    value,
    dayOnDay: value !== null && prev !== null ? value - prev : null,
    provenance: series.provenance,
    publisher: series.publisher,
  };
}

function positionOf(date: string, def: EventStudyDefinition): DayPosition {
  if (date === def.incidentDate) return { kind: 'incident' };
  if (date < def.incidentDate) {
    const daysBefore = Math.round(
      (Date.parse(`${def.incidentDate}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
    );
    return { kind: 'lead-in', daysBefore };
  }
  const dayNumber = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${def.incidentDate}T00:00:00Z`)) / 86_400_000,
  );
  return { kind: 'after', dayNumber };
}

/**
 * Split the window where the headline series changes level.
 *
 * Walks the published points, keeping a running mean of the phase in progress;
 * when a point sits more than PHASE_SHIFT_PCT away from that mean and the phase
 * already has MIN_PHASE_DAYS behind it, the phase closes and a new one opens.
 * Unpublished days join whichever phase they fall inside without contributing
 * to its mean — absence is not evidence of a level.
 */
export function detectPhases(series: EventStudySeries, dates: string[]): NarrativePhase[] {
  const phases: NarrativePhase[] = [];
  let startDate: string | null = null;
  let sum = 0;
  let n = 0;
  let lastDate: string | null = null;

  const close = (endDate: string) => {
    if (startDate === null) return;
    phases.push({
      startDate,
      endDate,
      levelMean: n > 0 ? sum / n : null,
      dayCount:
        Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1,
    });
  };

  for (const date of dates) {
    const v = series.points.find((p) => p.date === date)?.value ?? null;
    if (startDate === null) {
      startDate = date;
      lastDate = date;
      if (v !== null) { sum = v; n = 1; }
      continue;
    }
    if (v !== null && n > 0) {
      const mean = sum / n;
      const shifted = mean !== 0 && Math.abs(v - mean) / Math.abs(mean) * 100 >= PHASE_SHIFT_PCT;
      if (shifted && n >= MIN_PHASE_DAYS) {
        close(lastDate ?? date);
        startDate = date;
        sum = v;
        n = 1;
        lastDate = date;
        continue;
      }
      sum += v;
      n += 1;
    }
    lastDate = date;
  }
  close(lastDate ?? (startDate as string));
  return phases;
}

export function buildNarrative(
  def: EventStudyDefinition,
  study: EventStudyResult,
  coverage: CoverageItem[],
  supportingIds: EventStudySeriesId[],
  external: ExternalCoverageItem[] = [],
): EventNarrative {
  const headlineSeries = study.series[def.headlineSeries];
  const intensitySeries = study.series[def.intensitySeries];
  const dates = headlineSeries.points.map((p) => p.date);

  const coverageByDate = new Map<string, CoverageItem[]>();
  for (const c of coverage) {
    coverageByDate.set(c.date, [...(coverageByDate.get(c.date) ?? []), c]);
  }
  const externalByDate = new Map<string, ExternalCoverageItem[]>();
  for (const e of external) {
    if (!e.reportsOn) continue;
    externalByDate.set(e.reportsOn, [...(externalByDate.get(e.reportsOn) ?? []), e]);
  }

  const days: NarrativeDay[] = dates.map((date) => {
    const prevDate = shiftDay(date, -1);
    const headline = figureOf(headlineSeries, date, prevDate);
    const prevValue = headlineSeries.points.find((p) => p.date === prevDate)?.value ?? null;
    const inflection =
      headline.value !== null &&
      prevValue !== null &&
      prevValue !== 0 &&
      Math.abs(headline.value - prevValue) / Math.abs(prevValue) * 100 >= INFLECTION_PCT;

    return {
      date,
      position: positionOf(date, def),
      headline,
      intensity: figureOf(intensitySeries, date, prevDate),
      supporting: supportingIds.map((id) => figureOf(study.series[id], date, prevDate)),
      inflection,
      coverage: coverageByDate.get(date) ?? [],
      external: externalByDate.get(date) ?? [],
    };
  });

  const inWindow = new Set(dates);
  const orphanCoverage = coverage.filter((c) => !inWindow.has(c.date));

  const intensityValues = intensitySeries.points
    .map((p) => p.value)
    .filter((v): v is number => v !== null);
  const peakPoint = intensitySeries.points
    .filter((p) => p.value !== null)
    .sort((a, b) => (b.value as number) - (a.value as number))[0];

  return {
    days,
    phases: detectPhases(headlineSeries, dates),
    orphanCoverage,
    undatedExternal: external.filter((e) => !e.reportsOn),
    totals: {
      windowDays: dates.length,
      headlinePublished: headlineSeries.windowCoverage.publishedDays,
      intensitySum: intensityValues.length ? intensityValues.reduce((a, b) => a + b, 0) : null,
      intensityUnit: intensitySeries.unit,
      intensityPeak: peakPoint ? { date: peakPoint.date, value: peakPoint.value as number } : null,
      coverageCount: coverage.length,
      externalCount: external.filter((e) => e.reportsOn).length,
      externalOutlets: [...new Set(external.map((e) => e.outlet))].sort(),
    },
  };
}

/** "3 days before" / "The break" / "Day 12" — the reader's position in the story. */
export function positionLabel(position: DayPosition): string {
  if (position.kind === 'incident') return 'The break';
  if (position.kind === 'lead-in') {
    return position.daysBefore === 1 ? '1 day before' : `${position.daysBefore} days before`;
  }
  return `Day ${position.dayNumber + 1}`;
}
