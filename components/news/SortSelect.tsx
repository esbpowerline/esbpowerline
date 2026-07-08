'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { useLocale } from '@/components/shared/LocaleProvider';

export function SortSelect() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'latest';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'views') {
      params.set('sort', 'views');
    } else {
      params.delete('sort');
    }

    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLabel =
    currentSort === 'views' ? t('sort.mostViewedShort') : t('sort.latestShort');
  const activeLabelFull =
    currentSort === 'views' ? t('sort.mostViewed') : t('sort.latest');

  return (
    <div className="sort-select relative w-full text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="articles-page__toolbar-btn sort-select__trigger w-full"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`${t('sort.label')}: ${activeLabelFull}`}
      >
        <span className="sort-select__trigger-core">
          <SlidersHorizontal className="articles-page__toolbar-icon" aria-hidden />
          <span className="sort-select__trigger-label">{activeLabel}</span>
        </span>
        <ChevronDown
          className={`articles-page__toolbar-icon articles-page__toolbar-icon--chevron${isOpen ? ' articles-page__toolbar-icon--chevron-open' : ''}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={() => handleSort('latest')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold transition-all select-none text-left ${
              currentSort !== 'views'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <span>{t('sort.latest')}</span>
            {currentSort !== 'views' && <Check className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => handleSort('views')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold transition-all select-none text-left ${
              currentSort === 'views'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <span>{t('sort.mostViewed')}</span>
            {currentSort === 'views' && <Check className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}