'use client';

import '@/app/grid-explorer-charts.css';

/**
 * The plotted figures as a table, for readers the graphic cannot serve.
 *
 * The Grid Explorer's charts are canvas and hand-built SVG. `role="img"` and a
 * name stop a screen reader stepping into hundreds of unlabelled `<path>`
 * elements, but a name is not the data — it says what the chart is about, not
 * what it says. `LoadCurveCanvas` has had a proper `sr-only` table since before
 * this audit and it is the model; this is that pattern made reusable for the
 * Recharts charts, which had nothing.
 *
 * For a public-interest data portal this is a reach problem before it is a
 * compliance one. The figures already exist in structured form — they are what
 * the chart was drawn from — so the alternative costs almost nothing.
 *
 * Not a summary: the data. A reader who cannot see the line can read every
 * point it was drawn through.
 */

export interface ChartTableSeries {
  /** Series name, as the legend prints it. */
  label: string;
  /** Appended to each value, e.g. "MW", "MMCFD", "Tk/kWh". */
  unit?: string;
  /** One value per category; null where the source published none. */
  values: readonly (number | null | undefined)[];
}

export function ChartDataTable({
  caption,
  categoryHeader,
  categories,
  series,
  decimals = 1,
  visible = false,
}: {
  caption: string;
  categoryHeader: string;
  categories: readonly (string | number)[];
  series: readonly ChartTableSeries[];
  decimals?: number;
  /**
   * Show the table on screen (the "Table" view of a chart card). Default stays
   * screen-reader-only. Visible, it scrolls sideways inside its own container
   * with the first column pinned, so a wide table never widens the page.
   */
  visible?: boolean;
}) {
  if (!categories.length || !series.length) return null;

  const table = (
    <table className={visible ? 'ge-chart-table' : 'sr-only'}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{categoryHeader}</th>
          {series.map((s) => (
            <th key={s.label} scope="col">
              {s.unit ? `${s.label} (${s.unit})` : s.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {categories.map((category, row) => (
          <tr key={String(category)}>
            <th scope="row">{String(category)}</th>
            {series.map((s) => {
              const value = s.values[row];
              return (
                <td key={s.label}>
                  {typeof value === 'number' && Number.isFinite(value)
                    ? value.toFixed(decimals)
                    : /* Spoken aloud, an em dash is silence. The words are what
                         distinguish an unpublished figure from a zero. */
                      'not published'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return visible ? <div className="ge-chart-table-wrap">{table}</div> : table;
}

/** Pull one key out of a Recharts `data` array, preserving gaps as null. */
export function columnOf<T>(rows: readonly T[], key: keyof T): (number | null)[] {
  return rows.map((r) => {
    const v = r[key] as unknown;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });
}
