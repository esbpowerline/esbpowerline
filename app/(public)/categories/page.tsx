import Link from 'next/link';
import { getPublicCategories } from '@/lib/category-content';
import { localizeCategoryFields } from '@/lib/i18n/categories';
import { createTranslator } from '@/lib/i18n/messages';
import { getServerSiteLocale } from '@/lib/locale-server';
import {
  categoryColorVars,
  categoryIconWrapStyle,
  categoryTextStyle,
  getCategoryHoverBorderClass,
  getCategoryHoverTextClass,
  getCategoryTextClass,
} from '@/lib/category-icons';
import { CategoryIconDisplay } from '@/components/category/CategoryIconDisplay';

export const revalidate = 86400;

export const metadata = {
  title: 'Categories | ESB PowerLine',
  description:
    "Browse Bangladesh power & energy coverage by category — generation, renewables, policy, grid, projects and tenders.",
  alternates: {
    canonical: '/categories',
  },
};

export default async function CategoriesIndex() {
  const locale = await getServerSiteLocale();
  const t = createTranslator(locale);
  const categories = await getPublicCategories();

  return (
    <div className="container container--shell py-8 md:py-10">
      <div className="mb-8">
        <h1 className="h2 mb-2">{t('categories.title')}</h1>
        <p className="text-muted-foreground max-w-prose">{t('categories.subtitle')}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const localized = localizeCategoryFields(locale, cat);
          const defaultTextClass = getCategoryTextClass(cat.name, cat.color);
          const hoverBorderClass = getCategoryHoverBorderClass(cat.name, cat.color);
          const hoverTextClass = getCategoryHoverTextClass(cat.name, cat.color);
          const iconWrapStyle = categoryIconWrapStyle(cat.color);
          const textStyle = categoryTextStyle(cat.color);

          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              style={categoryColorVars(cat.color)}
              className={`card category-card p-4 group transition-all hover:shadow-md flex flex-col ${hoverBorderClass}`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`p-2 rounded-lg bg-muted transition flex-shrink-0 ${defaultTextClass}`}
                  style={iconWrapStyle}
                >
                  <CategoryIconDisplay
                    icon={cat.icon}
                    iconImageUrl={cat.iconImageUrl}
                    name={localized.name}
                    size={16}
                    className="h-4 w-4"
                    style={textStyle}
                  />
                </div>
                <div
                  className={`font-semibold text-[15px] leading-tight tracking-tight transition-colors ${defaultTextClass}`}
                  style={textStyle}
                >
                  {localized.name}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-snug line-clamp-2 flex-1">
                {localized.description ??
                  t('coverage.categoryDescription', { category: localized.name })}
              </p>
              <div className={`mt-2.5 text-[10px] text-muted-foreground inline-flex items-center gap-1 transition-colors ${hoverTextClass}`}>
                {t('categories.articles', { count: cat.articleCount ?? 0 })}{' '}
                <span className="group-hover:translate-x-0.5 transition">→</span>
              </div>
            </Link>
          );
        })}
      </div>

      {categories.length === 0 && (
        <p className="text-muted-foreground text-center py-12">{t('categories.empty')}</p>
      )}

      <div className="mt-8 text-center text-xs text-muted-foreground">
        {t('categories.footer', { count: categories.length })}
      </div>
    </div>
  );
}