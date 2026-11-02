'use client';

/**
 * One of SREDA's year-wise commissioning tables (index.php?id=11 and 12),
 * collapsed to its most recent years until asked to open.
 *
 * Its own component so the expand state is per table — large and small projects
 * open independently.
 */

import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import {
  ShowMoreRow,
  YEAR_INITIAL_ROWS,
  YEAR_INITIAL_ROWS_SMALL,
  fmt,
  useExpandable,
} from '@/components/news/power-grid/renewables/shared';
import type { SredaYearTable } from '@/lib/data/sreda/types';

export function YearWiseTable({ table }: { table: SredaYearTable }) {
  const { shown, expanded, toggle, hidden } = useExpandable(table.rows, YEAR_INITIAL_ROWS, YEAR_INITIAL_ROWS_SMALL);
  const hasQuantity = table.rows.some((r) => r.quantity !== null);
  const malformed = table.rows.filter((r) => r.yearMalformed);
  const cols = hasQuantity ? 3 : 2;

  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
        {table.category}
        <span className="ml-1.5 font-normal normal-case tabular-nums opacity-70">
          {`${table.rows.length} years`}
        </span>
      </h4>
      <div className="grid-explorer-table-wrap">
        <table className="grid-explorer-table ge-compact-table ge-rn-year">
          <thead>
            <tr>
              <th>Year</th>
              {hasQuantity && (
                <th className="text-right">
                  Installations
                  <GridProvenanceTag kind="P" className="ml-1" />
                </th>
              )}
              <th className="text-right">
                Capacity
                <GridProvenanceTag kind="P" className="ml-1" />
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={`${table.category}-${r.year}`}>
                <td className="font-semibold">
                  {r.year}
                  {r.yearMalformed && (
                    <span
                      className="ml-1.5 inline-block px-1.5 py-px rounded border text-[10px] font-bold align-middle bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                      title="SREDA's year column carries this value as printed. It is not a usable year, and the row is left exactly as published rather than reassigned to a date."
                    >
                      as printed
                    </span>
                  )}
                </td>
                {hasQuantity && (
                  <td className="text-right tabular-nums">
                    {r.quantity === null ? '' : r.quantity.toLocaleString('en-US')}
                  </td>
                )}
                <td className="text-right tabular-nums">{r.capacityPublished}</td>
              </tr>
            ))}
            <ShowMoreRow
              colSpan={cols}
              expanded={expanded}
              hidden={hidden}
              total={table.rows.length}
              noun="years"
              onToggle={toggle}
            />
            {table.publishedTotalMwp !== null && (
              <tr className="border-t border-border/80 font-bold bg-muted/20">
                <td>
                  Total
                  <GridProvenanceTag kind="P" className="ml-1" />
                </td>
                {hasQuantity && (
                  <td className="text-right tabular-nums">
                    {table.publishedTotalQuantity?.toLocaleString('en-US') ?? ''}
                  </td>
                )}
                <td className="text-right tabular-nums text-primary">
                  {table.publishedTotalCapacity ??
                    `${fmt(table.publishedTotalMwp, 2)} ${table.publishedTotalUnit ?? 'MW'}`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {malformed.length > 0 && (
        <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
          {/* One expression: a space that only exists between a JSX expression and
              the text after it renders inconsistently, and "2 rowsin" shipped
              because of it. */}
          {`${malformed.length} row${malformed.length === 1 ? '' : 's'} in SREDA’s year column (${malformed
            .map((r) => r.year)
            .join(', ')}) ${
            malformed.length === 1 ? 'is not a usable year' : 'are not usable years'
          }. Their capacity is counted in SREDA’s own total, so the rows are kept as printed rather than dropped or dated.`}
        </p>
      )}
    </div>
  );
}

export default YearWiseTable;
