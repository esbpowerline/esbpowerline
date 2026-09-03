'use client';

import { useMemo, type CSSProperties } from 'react';
import { AdminSelectMenu } from '@/components/admin/AdminSelectMenu';
import { categoryColorVars, getCategoryAccentColor } from '@/lib/category-icons';
import type { PublicCategory } from '@/lib/category-types';
import { cn } from '@/lib/utils';

type CategoryMeta = Pick<PublicCategory, 'name' | 'color' | 'icon' | 'iconImageUrl'>;

export function CmsCategorySelect({
  value,
  onChange,
  categories = [],
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  categories?: CategoryMeta[];
  className?: string;
}) {
  const metaByName = useMemo(() => {
    const map = new Map<string, CategoryMeta>();
    for (const c of categories) map.set(c.name, c);
    return map;
  }, [categories]);

  const selectedMeta = metaByName.get(value);
  const accent = getCategoryAccentColor(value, selectedMeta?.color);

  const options = useMemo(
    () =>
      [...metaByName.values()].map((c) => ({
        value: c.name,
        label: c.name,
        dot: getCategoryAccentColor(c.name, c.color),
        accent: getCategoryAccentColor(c.name, c.color),
      })),
    [metaByName],
  );

  if (options.length === 0) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
        No categories in the database. Add sectors in{' '}
        {/* The admin console is a different surface — a separate hostname in
            production and a separate dev port — so this cannot be a client
            navigation from the CMS. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/categories" className="font-medium underline">
          Admin → Categories
        </a>{' '}
        before publishing.
      </p>
    );
  }

  return (
    <div
      className={cn('cms-form-select cms-category-select', className)}
      style={{
        ...categoryColorVars(selectedMeta?.color),
        '--cat-accent': accent,
      } as CSSProperties}
    >
      <AdminSelectMenu
        value={value}
        onChange={onChange}
        options={options}
        placeholder="Category"
        menuTitle="Sector category"
        menuClassName="admin-select-menu--category"
        optionClassName="admin-select-option--category"
        minWidth="100%"
        className="w-full"
        portal
      />
    </div>
  );
}