'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Bot, UserRound, CircleDashed } from 'lucide-react';
import type { ArtifactState, DayRow } from '@/lib/data/grid/ingest-coverage.server';
import type { DayFeedId } from '@/lib/data/grid/ingest-provenance.server';
import { cn } from '@/lib/utils';

/**
 * The last six weeks, one square a day, and what each square is made of.
 *
 * The strip used to be four CSS classes and a `title=` attribute — the
 * browser's native tooltip, which cannot be styled, takes a second to appear
 * and never appears at all on a touch screen. It also said only "✓ grid day",
 * which answers whether a file exists and not the question an operator
 * actually has: *is this day fully on the site, and who put it there?*
 *
 * So each square now carries the four artefacts, their publish times and the
 * actor behind each, plus that day's NLDC hour count. One tooltip element is
 * rendered for the whole strip and moved, rather than 45 of them mounted at
 * once; it opens on hover, on focus and on tap, so it works on a phone.
 */

const FEED_LABEL: Record<DayFeedId, string> = {
  GRID_DAILY: 'Grid day',
  GAS_DAILY: 'Gas day',
  GRID_CURVE: 'Energy curve',
  GRID_PLANTS: 'Station detail',
};

/** What a reader loses when the artefact is absent — the Grid Explorer's own words. */
const FEED_ABSENT: Record<DayFeedId, string> = {
  GRID_DAILY: 'nothing for this day',
  GAS_DAILY: 'Gas & LNG Supply blank',
  GRID_CURVE: 'Energy Curve empty',
  GRID_PLANTS: 'Power Stations empty',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function prettyDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : iso;
}

/** Publish instants are shown in Dhaka: it is when the desk, and the Pi, are. */
function whenInDhaka(isoInstant: string): string {
  const d = new Date(isoInstant);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' });
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Dhaka',
  });
  return `${day}, ${time}`;
}

function ArtifactLine({ feed, state }: { feed: DayFeedId; state: ArtifactState }) {
  const actor = state.release?.actor;
  return (
    <li className="ingest-tip__row">
      <span
        className={cn(
          'ingest-tip__mark',
          state.held ? 'ingest-tip__mark--yes' : 'ingest-tip__mark--no',
        )}
        aria-hidden
      />
      <span className="ingest-tip__label">{FEED_LABEL[feed]}</span>
      <span className="ingest-tip__meta">
        {!state.held ? (
          <span className="ingest-tip__meta--absent">{FEED_ABSENT[feed]}</span>
        ) : state.release ? (
          <>
            {actor === 'pi' ? (
              <Bot className="h-3 w-3 shrink-0" aria-hidden />
            ) : actor === 'panel' ? (
              <UserRound className="h-3 w-3 shrink-0" aria-hidden />
            ) : null}
            <span>
              {actor === 'pi' ? 'Pi' : actor === 'panel' ? 'Panel' : 'Published'} ·{' '}
              {whenInDhaka(state.release.publishedAt)}
            </span>
          </>
        ) : (
          // No release row, but the file is on disk: it came down with a
          // deployment. Saying "shipped" rather than inventing a publish time
          // keeps the distinction the release layer exists to make.
          <span>in the deploy</span>
        )}
      </span>
    </li>
  );
}

type TipState = { row: DayRow; x: number; y: number } | null;

export function IngestDayStrip({ recent }: { recent: DayRow[] }) {
  const [tip, setTip] = useState<TipState>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const show = useCallback((row: DayRow, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setTip({ row, x: r.left + r.width / 2, y: r.top });
  }, []);

  // Oldest on the left, so it reads as time passing.
  const ordered = [...recent].reverse();

  return (
    <div className="relative">
      <div
        ref={stripRef}
        className="ingest-strip"
        onMouseLeave={() => setTip(null)}
        role="list"
        aria-label={`Coverage for the last ${recent.length} energy days`}
      >
        {ordered.map((row) => {
          const state =
            row.heldCount === 4 ? 'full' : row.heldCount === 0 ? 'absent' : 'partial';
          const label = `${prettyDay(row.date)} — ${
            state === 'full'
              ? 'complete'
              : state === 'absent'
                ? 'not ingested'
                : `${row.heldCount} of 4 artefacts`
          }`;
          return (
            <button
              key={row.date}
              type="button"
              role="listitem"
              aria-label={label}
              className={cn('ingest-day', `ingest-day--${state}`, tip?.row.date === row.date && 'ingest-day--active')}
              onMouseEnter={(e) => show(row, e.currentTarget)}
              onFocus={(e) => show(row, e.currentTarget)}
              onBlur={() => setTip(null)}
              // Tap opens it on a touch screen, where hover never fires; a
              // second tap on the same square closes it again.
              onClick={(e) => {
                const el = e.currentTarget;
                setTip((cur) => {
                  if (cur?.row.date === row.date) return null;
                  const r = el.getBoundingClientRect();
                  return { row, x: r.left + r.width / 2, y: r.top };
                });
              }}
            />
          );
        })}
      </div>

      {tip && (
        <div
          className="ingest-tip"
          style={{ left: tip.x, top: tip.y }}
          role="tooltip"
          onMouseEnter={() => setTip(tip)}
        >
          <div className="ingest-tip__head">
            <span className="ingest-tip__date">{prettyDay(tip.row.date)}</span>
            <span
              className={cn(
                'ingest-tip__pill',
                tip.row.heldCount === 4
                  ? 'ingest-tip__pill--full'
                  : tip.row.heldCount === 0
                    ? 'ingest-tip__pill--absent'
                    : 'ingest-tip__pill--partial',
              )}
            >
              {tip.row.heldCount === 4
                ? 'Complete'
                : tip.row.heldCount === 0
                  ? 'Not ingested'
                  : `${tip.row.heldCount} of 4`}
            </span>
          </div>
          <ul className="ingest-tip__list">
            {(Object.keys(FEED_LABEL) as DayFeedId[]).map((feed) => (
              <ArtifactLine key={feed} feed={feed} state={tip.row.artifacts[feed]} />
            ))}
          </ul>
          <p className="ingest-tip__foot">
            <CircleDashed className="h-3 w-3 shrink-0" aria-hidden />
            {/* The hourly capture is per calendar day and independent of the
                four artefacts above: NLDC's pages are read on the hour whether
                or not PGCB has filed the workbook. */}
            {tip.row.hours > 0
              ? `${tip.row.hours} of 24 NLDC hours captured`
              : 'no NLDC hours stored for this day'}
          </p>
        </div>
      )}
    </div>
  );
}
