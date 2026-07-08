'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, X, Clock, User, Users } from 'lucide-react';
import {
  DEFAULT_INTERVIEWS,
  encodeInterviewAssetUrl,
  normalizeInterviews,
  youtubeEmbedUrl,
  type Interview,
} from '@/lib/interview-content';
import { ESB_YOUTUBE_CHANNEL_URL } from '@/lib/youtube-channel';
import { useLocale } from '@/components/shared/LocaleProvider';
import { cn } from '@/lib/utils';

export function InterviewsSection({
  initialInterviews,
  className,
}: {
  initialInterviews?: Interview[] | unknown;
  className?: string;
}) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<Interview | null>(null);
  const [mounted, setMounted] = useState(false);
  const interviewsList = useMemo(
    () => normalizeInterviews(initialInterviews ?? DEFAULT_INTERVIEWS),
    [initialInterviews],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selected) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelected(null);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [selected]);

  const embedSrc = selected ? youtubeEmbedUrl(selected.youtubeId) : '';
  const isEditorial = className?.includes('home-editorial__interviews');

  const modal = selected ? (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-modal-title"
      onClick={() => setSelected(null)}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden bg-card border border-border shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border gap-3">
          <div className="min-w-0">
            <div id="interview-modal-title" className="font-semibold text-lg tracking-tight truncate">
              {selected.title}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {selected.guest} • {selected.role} • {selected.duration}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="p-2 text-muted-foreground hover:text-foreground shrink-0"
            aria-label={t('interviews.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          {embedSrc ? (
            <iframe
              className="h-full w-full border-0"
              src={embedSrc}
              title={selected.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {t('interviews.noVideo')}
            </div>
          )}
        </div>

        <div className="p-5 text-sm text-muted-foreground">
          {selected.excerpt} — {t('interviews.watchFull')}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={cn('relative z-0', className ?? 'container py-8')}>
      <div
        className={cn(
          'flex items-end justify-between gap-3 mb-3.5 md:mb-4',
          isEditorial && 'home-editorial__section-head',
        )}
      >
        <div className="min-w-0">
          <div className="section-kicker text-emerald-500 dark:text-emerald-400 mb-1.5">
            {t('interviews.kicker').toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary shrink-0" aria-hidden />
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{t('interviews.title')}</h2>
          </div>
        </div>
        <a
          href={ESB_YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary flex items-center gap-1 hover:underline font-medium shrink-0"
        >
          {t('interviews.watchAll')} <span>→</span>
        </a>
      </div>

      <div className="home-editorial__interview-grid grid">
        {interviewsList.map((iv) => (
          <button
            key={iv.id}
            type="button"
            onClick={() => setSelected(iv)}
            className="interview-card w-full group flex h-full flex-col text-left rounded-2xl overflow-hidden border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="relative aspect-video shrink-0 overflow-hidden">
              <img
                src={encodeInterviewAssetUrl(iv.thumbnail)}
                alt={iv.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                {iv.date} • {iv.guest}
              </div>
              <h4 className="font-semibold text-[15px] leading-tight tracking-[-0.01em] line-clamp-2 group-hover:text-primary transition">
                {iv.title}
              </h4>
              <p className="mt-2 flex-1 text-xs text-muted-foreground line-clamp-2">{iv.excerpt}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0 text-ui-2xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{iv.role}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
                  <span className="inline-flex items-center gap-1 text-ui-2xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {iv.duration}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Play className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </div>
  );
}