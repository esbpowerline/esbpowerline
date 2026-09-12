'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Star, Pin, Clock, Zap, FileEdit, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/actions/articles';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { CmsCard, CmsStatCard, CmsStatGrid } from '@/components/cms/CmsUI';
import { ModernTooltip } from '@/components/shared/ModernTooltip';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'editorial-cal-event--published',
  SCHEDULED: 'editorial-cal-event--scheduled',
  DRAFT: 'editorial-cal-event--draft',
};

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status: string) {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'SCHEDULED') return 'Scheduled';
  return 'Draft activity';
}

function formatEventWhen(date: string) {
  return new Date(date).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/*
 * The calendar in the shared page shape: a stat strip, then the month in the
 * main column and the chosen day in the rail — the same two-column split as
 * the dashboard and Performance.
 *
 * It used to be its own layout: a toolbar floating between the page header
 * and the stats, a stat strip fixed at four columns (four across on a phone
 * too) with its own radius and blur, a 1.4fr/1fr grid gapped at
 * --shell-section, and the legend loose under everything — each section
 * spaced by its own margin.
 */
export function EditorialCalendar({
  events,
  year: initialYear,
  month: initialMonth,
  seeAll,
}: {
  events: CalendarEvent[];
  year: number;
  month: number;
  seeAll: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = useMemo(() => new Date(), []);

  const [selectedDay, setSelectedDay] = useState<Date | null>(today);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const d = new Date(event.date);
      const key = dateKey(d);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const monthStats = useMemo(() => {
    let scheduled = 0;
    let published = 0;
    let drafts = 0;
    for (const e of events) {
      if (e.status === 'SCHEDULED') scheduled += 1;
      else if (e.status === 'PUBLISHED') published += 1;
      else if (e.status === 'DRAFT') drafts += 1;
    }
    return { scheduled, published, drafts, total: events.length };
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDay.get(dateKey(selectedDay)) ?? [];
  }, [selectedDay, eventsByDay]);

  function navigateMonth(delta: number) {
    const d = startOfMonth(initialYear, initialMonth);
    d.setMonth(d.getMonth() + delta);
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', String(d.getFullYear()));
    params.set('month', String(d.getMonth()));
    router.push(`/cms/calendar?${params.toString()}`);
    setSelectedDay(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function goToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', String(today.getFullYear()));
    params.set('month', String(today.getMonth()));
    router.push(`/cms/calendar?${params.toString()}`);
    setSelectedDay(today);
  }

  const firstWeekday = startOfMonth(initialYear, initialMonth).getDay();
  const totalDays = daysInMonth(initialYear, initialMonth);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) {
    cells.push(new Date(initialYear, initialMonth, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <CmsStatGrid>
        <CmsStatCard title="Events" value={monthStats.total} icon={CalendarDays} change="This month" />
        <CmsStatCard title="Scheduled" value={monthStats.scheduled} icon={Clock} accent="amber" />
        <CmsStatCard title="Published" value={monthStats.published} icon={Zap} accent="emerald" />
        <CmsStatCard title="Drafts touched" value={monthStats.drafts} icon={FileEdit} />
      </CmsStatGrid>

      <div className="admin-split">
        <div className="admin-split__main">
          {/* The month is the card's title and its arrows the card's action —
              they were a separate toolbar floating above the stats. */}
          <CmsCard
            title={formatMonthLabel(initialYear, initialMonth)}
            icon={CalendarDays}
            bodyClassName="p-0"
            action={
              <div className="editorial-calendar__nav">
                <button type="button" className="editorial-calendar__nav-btn" onClick={() => navigateMonth(-1)} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" className="editorial-calendar__today-btn" onClick={goToday}>
                  Today
                </button>
                <button type="button" className="editorial-calendar__nav-btn" onClick={() => navigateMonth(1)} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            }
          >
            <div className="editorial-calendar__weekdays">
              {WEEKDAYS.map((d) => (
                <div key={d} className="editorial-calendar__weekday">{d}</div>
              ))}
            </div>
            <div className="editorial-calendar__grid">
              {cells.map((date, i) => {
                if (!date) {
                  return <div key={`empty-${i}`} className="editorial-calendar__cell editorial-calendar__cell--empty" />;
                }
                const key = dateKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const isToday = isSameDay(date, today);
                const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
                const inMonth = date.getMonth() === initialMonth;

                return (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      'editorial-calendar__cell',
                      isToday && 'editorial-calendar__cell--today',
                      isSelected && 'editorial-calendar__cell--selected',
                      !inMonth && 'editorial-calendar__cell--muted',
                    )}
                    onClick={() => setSelectedDay(date)}
                  >
                    <span className="editorial-calendar__day-num">{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="editorial-calendar__chips">
                        {dayEvents.slice(0, 3).map((e) => {
                          const flags = [
                            e.isFeatured ? 'Featured' : null,
                            e.isPinned ? 'Pinned' : null,
                          ].filter(Boolean).join(' · ');
                          const hint = [
                            statusLabel(e.status),
                            e.category,
                            seeAll ? e.authorName : null,
                            formatEventWhen(e.date),
                            flags || null,
                          ].filter(Boolean).join(' · ');

                          return (
                            <ModernTooltip
                              key={e.id}
                              label={e.title}
                              hint={hint}
                              variant="editor"
                              fast
                              side="top"
                              showDelayMs={180}
                              className="editorial-cal-event-tooltip"
                            >
                              <span
                                className={cn(
                                  'editorial-cal-event',
                                  STATUS_COLORS[e.status] ?? 'editorial-cal-event--draft',
                                )}
                              >
                                {e.title}
                              </span>
                            </ModernTooltip>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <ModernTooltip
                            label={`${dayEvents.length - 3} more on this day`}
                            hint={dayEvents.slice(3).map((e) => e.title).join(' · ')}
                            variant="editor"
                            fast
                            side="top"
                            showDelayMs={180}
                            className="editorial-cal-event-tooltip"
                          >
                            <span className="editorial-cal-event editorial-cal-event--more">
                              +{dayEvents.length - 3} more
                            </span>
                          </ModernTooltip>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* The key belongs to the grid it explains — it sat loose under
                both cards. */}
            <div className="editorial-calendar__legend">
              <span className="editorial-cal-legend-item editorial-cal-event--published">Published</span>
              <span className="editorial-cal-legend-item editorial-cal-event--scheduled">Scheduled</span>
              <span className="editorial-cal-legend-item editorial-cal-event--draft">Draft activity</span>
            </div>
          </CmsCard>
        </div>

        <aside className="admin-split__rail">
          <CmsCard title={selectedDay ? formatDayLabel(selectedDay) : 'Select a day'} icon={Clock}>
            {selectedEvents.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-2">
                {seeAll ? 'No editorial activity on this day.' : 'No stories on this day.'}
              </p>
            ) : (
              <div className="editorial-calendar__detail-list">
                {selectedEvents.map((event) => (
                  <div key={event.id} className="editorial-calendar__detail-item">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link
                        href={`/cms/articles/${event.id}/edit`}
                        className="admin-text-link font-medium text-[13px] line-clamp-2"
                      >
                        {event.title}
                      </Link>
                      <StatusBadge status={event.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{event.category}</span>
                      {seeAll && <span>· {event.authorName}</span>}
                      {/* Flags, not statuses — muted like the rest of the line
                          (they were violet and amber). */}
                      {event.isPinned && (
                        <span className="inline-flex items-center gap-0.5">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                      {event.isFeatured && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3" /> Featured
                        </span>
                      )}
                    </div>
                    <time className="text-[10px] text-muted-foreground tabular-nums mt-1 block">
                      {new Date(event.date).toLocaleString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </CmsCard>
        </aside>
      </div>
    </>
  );
}
