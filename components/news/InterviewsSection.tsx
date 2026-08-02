'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Play, X, Clock, User, Users, ExternalLink } from 'lucide-react';
import {
  DEFAULT_INTERVIEWS,
  encodeInterviewAssetUrl,
  normalizeInterviews,
  interviewEmbedUrl,
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

  const embedSrc = selected ? interviewEmbedUrl(selected) : '';
  const isFacebook = selected?.provider === 'facebook';
  // Facebook links to the post itself; YouTube keeps its existing channel link
  // when an entry has no watch URL of its own.
  const watchHref = isFacebook
    ? selected?.videoUrl ?? ESB_YOUTUBE_CHANNEL_URL
    : selected?.youtubeId
      ? `https://www.youtube.com/watch?v=${selected.youtubeId}`
      : ESB_YOUTUBE_CHANNEL_URL;
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
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-border">
          <div className="min-w-0">
            <div id="interview-modal-title" className="font-semibold text-lg leading-snug tracking-tight line-clamp-2">
              {selected.title}
            </div>
            {/* Only the parts we actually have — Facebook gives no duration or date. */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-emerald-700 dark:text-emerald-500">{selected.guest}</span>
              {selected.role && <span className="truncate">· {selected.role}</span>}
              {selected.date && <span>· {selected.date}</span>}
              {selected.duration && selected.duration !== '—' && (
                <span className="inline-flex items-center gap-1">
                  · <Clock className="h-3 w-3" />
                  {selected.duration}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

        {/* Footer: the blurb, and a link that goes where the video actually lives. */}
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
            {selected.excerpt || t('interviews.watchFull')}
          </p>
          <a
            href={watchHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors',
              isFacebook ? 'bg-[#1877F2] hover:bg-[#166FE5]' : 'bg-[#FF0000] hover:bg-[#E60000]',
            )}
          >
            {isFacebook ? t('interviews.openOnFacebook') : t('interviews.openOnYoutube')}
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
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
          <div className="section-kicker text-emerald-700 dark:text-emerald-500 mb-1.5">
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
              <Image
                src={encodeInterviewAssetUrl(iv.thumbnail)}
                alt={iv.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              {/* Separator only when there is a date to separate — an empty one
                  used to leave the line starting with a stray bullet. */}
              <div className="text-xs text-emerald-700 dark:text-emerald-500 font-medium mb-1">
                {iv.date ? `${iv.date} • ` : ''}{iv.guest}
              </div>
              <h3 className="font-semibold text-[15px] leading-tight tracking-[-0.01em] line-clamp-2 group-hover:text-primary transition">
                {iv.title}
              </h3>
              <p className="mt-2 flex-1 text-xs text-muted-foreground line-clamp-2">{iv.excerpt}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                {/* Prefer the short programme label here — a full job title
                    truncates to nonsense in this chip. The modal shows `role`. */}
                <div className="min-w-0 text-ui-2xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{iv.programme || iv.role}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
                  {/* Facebook publishes no duration, so the clock is dropped
                      rather than shown against an em dash. */}
                  {iv.duration && iv.duration !== '—' && (
                    <span className="inline-flex items-center gap-1 text-ui-2xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {iv.duration}
                    </span>
                  )}
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