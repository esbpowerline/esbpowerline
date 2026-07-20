export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

export type TimeBucket = {
  key: string;
  label: string;
  count: number;
};

const PERIODS: AnalyticsPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function parseAnalyticsQuery(params?: { period?: string; month?: string | null }) {
  const period = PERIODS.includes(params?.period as AnalyticsPeriod)
    ? (params!.period as AnalyticsPeriod)
    : 'monthly';
  const month = params?.month?.match(/^\d{4}-\d{2}$/) ? params.month : null;
  return { period, month };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getMonthRange(ym: string): DateRange {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = endOfDay(new Date(y, m, 0));
  return { start, end, label: monthLabel(y, m - 1) };
}

export function getPreviousMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getRollingRange(period: AnalyticsPeriod, now = new Date()): DateRange {
  const end = endOfDay(now);
  const start = startOfDay(now);

  switch (period) {
    case 'daily':
      start.setDate(start.getDate() - 29);
      return { start, end, label: 'Last 30 days' };
    case 'weekly':
      start.setDate(start.getDate() - 7 * 11);
      return { start, end, label: 'Last 12 weeks' };
    case 'monthly':
      start.setMonth(start.getMonth() - 11);
      start.setDate(1);
      return { start, end, label: 'Last 12 months' };
    case 'yearly':
      start.setFullYear(start.getFullYear() - 4);
      start.setMonth(0, 1);
      return { start, end, label: 'Last 5 years' };
  }
}

export function getPreviousRollingRange(period: AnalyticsPeriod, current: DateRange): DateRange {
  const spanMs = current.end.getTime() - current.start.getTime();
  const end = endOfDay(new Date(current.start.getTime() - 1));
  const start = startOfDay(new Date(end.getTime() - spanMs));
  return { start, end, label: `Prior ${current.label.toLowerCase()}` };
}

export function resolveAnalyticsRange(period: AnalyticsPeriod, month: string | null, now = new Date()) {
  if (month) {
    const current = getMonthRange(month);
    const prevYm = getPreviousMonth(month);
    const previous = getMonthRange(prevYm);
    return { current, previous, compareLabel: `vs ${previous.label}` };
  }
  const current = getRollingRange(period, now);
  const previous = getPreviousRollingRange(period, current);
  return { current, previous, compareLabel: previous.label };
}

export type MonthOption = {
  value: string;
  label: string;
  count?: number;
  description?: string;
  dot?: string;
};

export function getMonthOptions(count = 12, now = new Date()): MonthOption[] {
  const options: MonthOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value, label: monthLabel(d.getFullYear(), d.getMonth()) });
  }
  return options;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function weekKey(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return isoDate(x);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function yearKey(d: Date) {
  return String(d.getFullYear());
}

export function buildTimeSeries(
  items: { at: Date }[],
  period: AnalyticsPeriod,
  range: DateRange,
  focusedMonth: string | null,
): TimeBucket[] {
  const buckets = new Map<string, { label: string; count: number }>();

  if (focusedMonth) {
    const { start, end } = getMonthRange(focusedMonth);
    for (let d = startOfDay(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = isoDate(d);
      buckets.set(key, {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 0,
      });
    }
    for (const item of items) {
      const key = isoDate(item.at);
      if (buckets.has(key)) buckets.get(key)!.count += 1;
    }
    return sortedBuckets(buckets);
  }

  const granularity = period;
  const cursor = startOfDay(range.start);
  const end = range.end;

  if (granularity === 'daily') {
    for (let d = new Date(cursor); d <= end; d.setDate(d.getDate() + 1)) {
      const key = isoDate(d);
      buckets.set(key, {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 0,
      });
    }
    for (const item of items) {
      if (item.at < range.start || item.at > range.end) continue;
      const key = isoDate(item.at);
      if (buckets.has(key)) buckets.get(key)!.count += 1;
    }
  } else if (granularity === 'weekly') {
    seedWeeklyBuckets(buckets, cursor, end);
    for (const item of items) {
      if (item.at < range.start || item.at > range.end) continue;
      const key = weekKey(item.at);
      if (!buckets.has(key)) {
        buckets.set(key, {
          label: new Date(`${key}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: 0,
        });
      }
      buckets.get(key)!.count += 1;
    }
  } else if (granularity === 'monthly') {
    const m = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (m <= end) {
      const key = monthKey(m);
      buckets.set(key, {
        label: monthLabel(m.getFullYear(), m.getMonth()),
        count: 0,
      });
      m.setMonth(m.getMonth() + 1);
    }
    for (const item of items) {
      if (item.at < range.start || item.at > range.end) continue;
      const key = monthKey(item.at);
      if (buckets.has(key)) buckets.get(key)!.count += 1;
    }
  } else {
    for (let y = cursor.getFullYear(); y <= end.getFullYear(); y++) {
      const key = String(y);
      buckets.set(key, { label: key, count: 0 });
    }
    for (const item of items) {
      if (item.at < range.start || item.at > range.end) continue;
      const key = yearKey(item.at);
      if (buckets.has(key)) buckets.get(key)!.count += 1;
    }
  }

  return sortedBuckets(buckets);
}

export function pctDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatDelta(n: number) {
  if (!Number.isFinite(n)) return '—';
  const rounded = Math.round(n);
  const normalized = rounded === 0 ? 0 : rounded; // avoid "-0%"
  const sign = normalized > 0 ? '+' : '';
  return `${sign}${normalized}%`;
}

export const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const PERIOD_ACCENTS: Record<AnalyticsPeriod, string> = {
  daily: '#3b82f6',
  weekly: '#8b5cf6',
  monthly: '#f43f5e',
  yearly: '#10b981',
};

function sortedBuckets(buckets: Map<string, { label: string; count: number }>): TimeBucket[] {
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, label: v.label, count: v.count }));
}

function seedWeeklyBuckets(buckets: Map<string, { label: string; count: number }>, start: Date, end: Date) {
  let cursor = weekKey(start);
  const last = weekKey(end);
  while (cursor <= last) {
    if (!buckets.has(cursor)) {
      buckets.set(cursor, {
        label: new Date(`${cursor}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 0,
      });
    }
    const next = new Date(`${cursor}T12:00:00`);
    next.setDate(next.getDate() + 7);
    const nextKey = weekKey(next);
    if (nextKey === cursor) break;
    cursor = nextKey;
  }
}

function bucketKeyForDate(at: Date, period: AnalyticsPeriod, focusedMonth: string | null): string {
  if (focusedMonth) return isoDate(at);
  if (period === 'daily') return isoDate(at);
  if (period === 'weekly') return weekKey(at);
  if (period === 'monthly') return monthKey(at);
  return yearKey(at);
}

export type PublishingTrendPoint = {
  key: string;
  label: string;
  count: number;
  views: number;
};

/** Published posts per bucket + total views on those same posts */
export function buildPublishingTrendWithViews(
  articles: { publishedAt: Date | null; views: number }[],
  period: AnalyticsPeriod,
  range: DateRange,
  focusedMonth: string | null,
): PublishingTrendPoint[] {
  const dated = articles
    .filter((a) => a.publishedAt)
    .map((a) => ({ at: a.publishedAt!, views: a.views }));

  const countSeries = buildTimeSeries(
    dated.map((d) => ({ at: d.at })),
    period,
    range,
    focusedMonth,
  );

  const viewsMap = new Map(countSeries.map((b) => [b.key, 0]));
  for (const item of dated) {
    if (item.at < range.start || item.at > range.end) continue;
    const key = bucketKeyForDate(item.at, period, focusedMonth);
    if (!viewsMap.has(key)) continue;
    viewsMap.set(key, viewsMap.get(key)! + item.views);
  }

  return countSeries.map((b) => ({
    key: b.key,
    label: b.label,
    count: b.count,
    views: viewsMap.get(b.key) ?? 0,
  }));
}