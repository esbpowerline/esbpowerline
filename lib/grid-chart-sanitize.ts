/** Coerce chart-bound numeric fields — null/NaN become 0 so Recharts never breaks. */
export function sanitizeChartNumber(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function sanitizeChartSeries<T extends Record<string, unknown>>(
  rows: T[],
  numericKeys: (keyof T)[],
): T[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const out = { ...row };
    for (const key of numericKeys) {
      (out as Record<string, unknown>)[key as string] = sanitizeChartNumber(out[key]);
    }
    return out;
  });
}

export function hasChartData(rows: unknown[], valueKey = 'value'): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) => {
    if (!row || typeof row !== 'object') return false;
    return sanitizeChartNumber((row as Record<string, unknown>)[valueKey]) > 0;
  });
}