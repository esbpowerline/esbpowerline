'use client';

import Link from 'next/link';
import {
  Zap, Sun, Flame, Cable, Scale, Globe, TrendingUp,
  Building2, Lightbulb, Leaf,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_DETAILS } from '@/lib/constants';
import { localizeCategoryName } from '@/lib/i18n/categories';
import { useLocale } from '@/components/shared/LocaleProvider';
import { slugify } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  Zap,
  Flame,
  Sun,
  Cable,
  Building2,
  Lightbulb,
  TrendingUp,
  Globe,
  Leaf,
};

export function CategoryHub() {
  const { locale } = useLocale();

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const meta = CATEGORY_DETAILS[cat];
        const Icon = ICONS[meta.icon] || Zap;
        const slug = slugify(cat);
        const label = localizeCategoryName(locale, cat);

        return (
          <Link
            key={cat}
            href={`/categories/${slug}`}
            className="group flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-1.5 text-sm hover:border-primary/40 hover:bg-muted/40 transition-all min-w-[150px] max-w-full flex-shrink-0"
          >
            <div className="icon-wrap !h-7 !w-7 shrink-0 bg-muted/60 group-hover:bg-primary/10">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium leading-tight tracking-tight group-hover:text-primary transition-colors text-[12.5px] min-w-0">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}