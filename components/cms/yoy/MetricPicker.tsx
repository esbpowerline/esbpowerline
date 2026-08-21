'use client';

import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The section chips and the metric list, in one place.
 *
 * There were three copies of this markup — daily compare, monthly compare,
 * monthly range — and they had already drifted: one offered per-section
 * headings, one did not, and the "Show all" affordance was worded differently
 * in each. They are one component now, and the differences that were real
 * (sections vs no sections) are props.
 *
 * The controls themselves changed too. A bare `<input type="checkbox">` in a
 * three-column grid is not a serious way to choose from 225 metrics: nothing is
 * searchable, the whole set has to be scrolled, and the browser's own checkbox
 * is the one element on the page that ignores the site's styling. So: a search
 * box, per-section select/clear, a running count, and rows that are pressable
 * across their whole width.
 */

export type PickerMetric = { id: string; section: string; label: string; unit?: string };
export type PickerSection = { id: string; label: string; description?: string };

/* ── section chips ───────────────────────────────────────────────────────── */

export function SectionChips<T extends string>({
  sections,
  selected,
  onToggle,
  onAll,
  disabled,
}: {
  sections: ReadonlyArray<{ id: T; label: string; description?: string }>;
  selected: T[];
  onToggle: (id: T) => void;
  onAll: () => void;
  disabled?: boolean;
}) {
  const allOn = selected.length === sections.length;
  return (
    <div className="grid-chipset">
      {sections.map((s) => {
        const on = selected.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            title={s.description}
            aria-pressed={on}
            onClick={() => onToggle(s.id)}
            className={cn('grid-chip', on && 'grid-chip--on')}
          >
            {/* The tick is the state. A chip that only changed colour was read
                as "highlighted" rather than "selected" — the same complaint the
                checkbox grid had, in prettier clothes. */}
            <span className="grid-chip__box" aria-hidden>
              {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
            {s.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAll}
        disabled={disabled || allOn}
        className="grid-chip grid-chip--ghost"
      >
        Select all
      </button>
    </div>
  );
}

/* ── metric list ─────────────────────────────────────────────────────────── */

export function MetricPicker({
  metrics,
  sections,
  /** Empty means "everything", which is how the engine reads it too. */
  selected,
  onChange,
  disabled,
}: {
  metrics: PickerMetric[];
  /** When given, rows are grouped under their section heading. */
  sections?: PickerSection[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');

  const isOn = useMemo(() => {
    if (!selected.length) return () => true;
    const set = new Set(selected);
    return (id: string) => set.has(id);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return metrics;
    return metrics.filter(
      (m) => m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
    );
  }, [metrics, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PickerMetric[]>();
    for (const m of filtered) {
      const list = map.get(m.section) ?? [];
      list.push(m);
      map.set(m.section, list);
    }
    return map;
  }, [filtered]);

  /**
   * Toggling starts from the full set when nothing is picked.
   *
   * "No picks" means "all", so the first click has to mean "all except this
   * one" — otherwise unticking a metric silently selected only that metric,
   * which is the opposite of what the click looked like.
   */
  function toggle(id: string) {
    const base = selected.length ? selected : metrics.map((m) => m.id);
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    onChange(next.length === metrics.length ? [] : next);
  }

  function setMany(ids: string[], on: boolean) {
    const base = new Set(selected.length ? selected : metrics.map((m) => m.id));
    for (const id of ids) {
      if (on) base.add(id);
      else base.delete(id);
    }
    const next = [...base];
    onChange(next.length === metrics.length ? [] : next);
  }

  const chosen = selected.length || metrics.length;
  const sectionOrder = sections?.filter((s) => grouped.has(s.id)) ?? null;

  return (
    <div className="grid-picker">
      <div className="grid-picker__head">
        <div className="grid-picker__search">
          <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${metrics.length} metrics…`}
            className="grid-picker__input"
            aria-label="Search metrics"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="grid-picker__clear"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="grid-picker__count">
          <span className="grid-picker__count-value">{chosen}</span>
          <span className="grid-picker__count-of">of {metrics.length} selected</span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled || !selected.length}
            className="grid-picker__reset"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid-picker__body">
        {filtered.length === 0 && (
          <p className="grid-picker__empty">No metric matches “{query}”.</p>
        )}

        {sectionOrder
          ? sectionOrder.map((s) => (
              <MetricGroup
                key={s.id}
                heading={s.label}
                rows={grouped.get(s.id) ?? []}
                isOn={isOn}
                onToggle={toggle}
                onSetMany={setMany}
                disabled={disabled}
              />
            ))
          : filtered.length > 0 && (
              <MetricGroup
                rows={filtered}
                isOn={isOn}
                onToggle={toggle}
                onSetMany={setMany}
                disabled={disabled}
              />
            )}
      </div>
    </div>
  );
}

function MetricGroup({
  heading,
  rows,
  isOn,
  onToggle,
  onSetMany,
  disabled,
}: {
  heading?: string;
  rows: PickerMetric[];
  isOn: (id: string) => boolean;
  onToggle: (id: string) => void;
  onSetMany: (ids: string[], on: boolean) => void;
  disabled?: boolean;
}) {
  if (!rows.length) return null;
  const ids = rows.map((r) => r.id);
  const onCount = ids.filter(isOn).length;

  return (
    <section className="grid-picker__group">
      {heading && (
        <header className="grid-picker__group-head">
          <span className="grid-picker__group-title">{heading}</span>
          <span className="grid-picker__group-count">
            {onCount}/{rows.length}
          </span>
          {/* Per section, because "all 225" and "this one metric" were the only
              two gestures available and the sections are how the desk thinks
              about the report. */}
          <button
            type="button"
            disabled={disabled || onCount === rows.length}
            onClick={() => onSetMany(ids, true)}
            className="grid-picker__group-action"
          >
            All
          </button>
          <button
            type="button"
            disabled={disabled || onCount === 0}
            onClick={() => onSetMany(ids, false)}
            className="grid-picker__group-action"
          >
            None
          </button>
        </header>
      )}
      <div className="grid-picker__rows">
        {rows.map((m) => {
          const on = isOn(m.id);
          return (
            <button
              key={m.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onToggle(m.id)}
              className={cn('grid-picker__row', on && 'grid-picker__row--on')}
              title={m.label}
            >
              <span className="grid-picker__tick" aria-hidden>
                {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span className="grid-picker__row-label">{m.label}</span>
              {m.unit && <span className="grid-picker__row-unit">{m.unit}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
