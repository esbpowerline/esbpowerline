/**
 * Axis conventions shared by every time-series chart on the explorer.
 *
 * The load curve publishes 47 half-hourly points. Drawn with a fixed
 * `interval`, the number of labels is decided once and never changes: the
 * energy curve asked for every fourth point, which is twelve labels of "00:00"
 * in whatever width the chart happens to have. On a desktop that is airy; on a
 * 393px phone the plot is about 337px wide once the value axis is subtracted,
 * twelve labels need roughly 360px, and they overlap into "0:00:02" — two
 * legible times rendering as one unreadable string.
 *
 * Two rules fix it together, and neither works alone:
 *
 *   1. Only whole hours are offered as ticks. A reader looking at a day wants
 *      06:00 and 19:00, never 06:30 — half-hour labels carry no information
 *      the shape of the line does not already give.
 *   2. Recharts thins those candidates itself, by measured gap rather than by
 *      a count fixed in advance. `interval="preserveStartEnd"` keeps the first
 *      and last so the axis still says where the day begins and ends.
 *
 * The result adapts to any width without measuring the container: the same
 * chart shows every hour on a wide screen and roughly every fourth on a phone,
 * and the label never collides at either end of that range.
 */

/** Ticks for a series whose points are "HH:MM". Whole hours, in order. */
export function wholeHourTicks(times: readonly string[], everyHours = 1): string[] {
  const out: string[] = [];
  for (const t of times) {
    const m = /^(\d{1,2}):(\d{2})/.exec(t);
    if (!m) continue;
    if (m[2] !== '00') continue;
    if (Number(m[1]) % everyHours !== 0) continue;
    out.push(t);
  }
  // A series that publishes no whole hour at all — or one already hourly and
  // formatted differently — gets the raw list back rather than an empty axis.
  return out.length > 1 ? out : [...times];
}

/**
 * XAxis props for a time series. Spread onto `<XAxis>` after `dataKey`, and
 * pass `ticks={wholeHourTicks(times)}` alongside.
 *
 * `minTickGap` is the width of one "00:00" at 10px plus breathing room. Recharts
 * drops any tick that would land closer than this to its neighbour, so the
 * count follows the width instead of being declared.
 */
export const TIME_AXIS_PROPS = {
  interval: 'preserveStartEnd',
  minTickGap: 44,
  tickLine: false,
  axisLine: false,
  tickMargin: 6,
} as const;

/**
 * Tick styling. Kept here so every axis on the explorer reads at the same
 * weight — an axis that shouts competes with the data it is measuring.
 */
export function axisTickStyle(fill: string) {
  return { fontSize: 10, fill } as const;
}
