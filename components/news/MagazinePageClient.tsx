'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Calendar, Download, FlaskConical, Sparkles, Star } from 'lucide-react';
import { MagazineCoverMockup } from './MagazineCoverMockup';
import { MagazineFlipBook } from './MagazineFlipBook';
import { SaveMagazineButton } from '@/components/members/SaveMagazineButton';
import { useSession } from '@/utils/supabase/auth-context';
import { getMagazineSavedState } from '@/lib/actions/members';

export interface MagazineContentsEntry {
  page: number;
  section: string;
  title: string;
  pages: number;
}

interface MagazinePageClientProps {
  coverUrl: string;
  title: string;
  summary: string;
  issueLabel: string;
  pdfUrl: string | null;
  issueId: string;
  /** Rendered page images, in printed order. Empty when none exist. */
  pageImages?: string[];
  thumbImages?: string[];
  masthead?: readonly { name: string; role: string }[];
  volumeLabel?: string;
  pageCount?: number;
  cadence?: string;
  priceLabel?: string;
  /** Size of the downloadable PDF, so the button can warn before a 100 MB tap. */
  pdfBytes?: number;
  /** Renders the demo treatment. See lib/magazine-demo-issue.ts. */
  demo?: boolean;
}

function formatMb(bytes?: number) {
  if (!bytes) return null;
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export function MagazinePageClient({
  coverUrl,
  title,
  summary,
  issueLabel,
  pdfUrl,
  issueId,
  pageImages = [],
  thumbImages = [],
  masthead = [],
  volumeLabel,
  pageCount,
  cadence,
  priceLabel,
  pdfBytes,
  demo = false,
}: MagazinePageClientProps) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (signedIn && issueId) {
      getMagazineSavedState(issueId).then(setSaved).catch(console.error);
    }
  }, [signedIn, issueId]);

  const [isFlipBookOpen, setIsFlipBookOpen] = useState(false);
  const [startPage, setStartPage] = useState(0);

  const openFlipBook = (index = 0) => {
    setStartPage(index);
    setIsFlipBookOpen(true);
  };

  const pdfSize = formatMb(pdfBytes);

  return (
    <div className="container container--shell py-10 md:py-12 relative z-10">
      {/* The only issue the site has is a design demo. Say so before anything
          else on the page: it carries full-page adverts for real companies
          that are layout mockups, not sold placements. */}
      {demo ? (
        <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/[0.07] px-5 py-4 flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mr-2">
              Demo issue
            </span>
            <span className="text-muted-foreground">
              This is a <strong className="text-foreground">sample issue produced to demonstrate the
              magazine&rsquo;s design and layout</strong> &mdash; it is not a published edition.
              Advertisements shown in it are placeholder artwork, not paid placements, and do not
              indicate any commercial relationship.
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">

        {/* Left Info Column */}
        <div className="lg:w-2/5 order-2 lg:order-1">
          <div className="sticky top-8">
            <div className="uppercase text-xs tracking-[2px] text-accent font-semibold mb-2.5 flex items-center gap-2 flex-wrap">
              <Calendar className="h-3.5 w-3.5 text-primary" /> {issueLabel}
              {demo ? (
                <span className="rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                  DEMO
                </span>
              ) : null}
            </div>

            <h1 className="h2 mb-4 text-balance font-bold leading-tight">{title}</h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">{summary}</p>

            {/* Facts printed in the issue itself. This card used to list invented
                features ("Subcontinental Energy Map", "Solar Pipeline 2026")
                that matched nothing in any issue. */}
            {masthead.length > 0 ? (
              <div className="border border-border/40 rounded-2xl p-5 bg-card/45 dark:bg-card/20 backdrop-blur-sm mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500/20" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">Masthead</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-2">
                  {masthead.map((m) => (
                    <li key={m.name} className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">&bull;</span>
                      <span>
                        <strong className="text-foreground/90">{m.name}</strong> &mdash; {m.role}
                      </span>
                    </li>
                  ))}
                </ul>
                {cadence || priceLabel ? (
                  <div className="mt-3 pt-3 border-t border-border/25 text-[11px] text-muted-foreground/80">
                    {[cadence, priceLabel ? `Cover price ${priceLabel}` : null].filter(Boolean).join(' • ')}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              {signedIn && pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary gap-2 px-5 w-full sm:w-auto justify-center">
                  <Download className="h-4 w-4" /> Download PDF{pdfSize ? ` (${pdfSize})` : ''}
                </a>
              ) : pdfUrl ? (
                <Link
                  href="/members/login"
                  rel="nofollow"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.assign('/members/login?callbackUrl=/magazine');
                  }}
                  className="btn btn-primary gap-2 px-5 w-full sm:w-auto justify-center"
                >
                  <Download className="h-4 w-4" /> Member login to download
                </Link>
              ) : (
                <button type="button" className="btn btn-primary gap-2 px-5 w-full sm:w-auto justify-center" disabled>
                  <Download className="h-4 w-4" /> PDF coming soon
                </button>
              )}

              <button
                onClick={() => openFlipBook(0)}
                className="btn btn-emerald gap-2 px-5 shadow-[0_2px_10px_-2px_rgba(16,185,129,0.2)] w-full sm:w-auto justify-center"
                disabled={pageImages.length === 0}
              >
                <BookOpen className="h-4 w-4" /> Read all {pageCount ?? pageImages.length} pages
              </button>

              {signedIn && issueId ? (
                <SaveMagazineButton magazineId={issueId} initialSaved={saved} />
              ) : null}
            </div>

            {/* Facts about the issue. A fabricated "18,400 readers" used to sit
                here; the site publishes no circulation figure. */}
            <div className="mt-8 text-xs text-muted-foreground/80 flex items-center gap-4 border-t border-border/20 pt-5 flex-wrap">
              {pageCount ? <div><span className="font-semibold text-foreground/80">{pageCount} pages</span></div> : null}
              {volumeLabel ? (
                <>
                  <div className="text-muted-foreground/50">&bull;</div>
                  <div>{volumeLabel}</div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Cover Preview & page thumbnails */}
        <div className="lg:w-3/5 flex flex-col items-center order-1 lg:order-2">

          <div className="w-full max-w-[420px] p-6 rounded-3xl border border-border/40 bg-gradient-to-b from-card/80 to-card/25 shadow-xl dark:shadow-none relative group mb-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-primary/5 to-transparent blur-2xl opacity-75 rounded-3xl pointer-events-none" />

            <div
              onClick={() => openFlipBook(0)}
              className="relative cursor-pointer transition-transform duration-300 hover:scale-[1.015] z-10"
            >
              <MagazineCoverMockup coverUrl={coverUrl} />

              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none">
                <div className="bg-emerald-600/90 text-white border border-emerald-500/30 rounded-full px-5 py-2.5 flex items-center gap-2 font-semibold shadow-lg text-sm scale-95 group-hover:scale-100 transition-transform duration-300">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
                  <span>Open Interactive Reader</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4 text-[10px] text-muted-foreground/85 flex items-center justify-center gap-1.5 z-10 relative">
              <span>{demo ? 'Demo issue' : 'Print • Digital Preview'}</span>
              <span>&bull;</span>
              <button
                onClick={() => openFlipBook(0)}
                className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                disabled={pageImages.length === 0}
              >
                <BookOpen className="h-3 w-3" /> Turn pages
              </button>
            </div>
          </div>

          {/* Real page thumbnails. This block used to show two invented back
              issues ("Grid Modernization", "LNG Import Future", Vol 04) that
              were never produced -- an archive the site does not have. */}
          {thumbImages.length > 0 ? (
            <div className="w-full max-w-[420px] border-t border-border/30 pt-8 mt-2 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent tracking-[2px] uppercase">Every page</span>
                  <span className="text-sm font-bold text-foreground">Jump into the issue</span>
                </div>
                <Link
                  href="/members/magazine"
                  rel="nofollow"
                  className="text-[11px] text-primary hover:text-primary-foreground font-semibold inline-flex items-center gap-1 group/link"
                >
                  Members archive <ArrowUpRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {thumbImages.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => openFlipBook(idx)}
                    className="flex flex-col items-center group"
                    aria-label={`Open page ${idx + 1}`}
                  >
                    <div className="w-full aspect-[587/803] relative rounded-lg overflow-hidden border border-border/40 shadow-sm transition-all duration-200 group-hover:border-primary/50 group-hover:scale-[1.03]">
                      {/* Plain img: served from the staging host, which is not an
                          origin the Next image optimizer is configured for. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Page ${idx + 1}`} loading="lazy" className="object-cover w-full h-full" />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 group-hover:text-primary transition-colors">{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

        </div>
      </div>

      <MagazineFlipBook
        pages={pageImages}
        thumbs={thumbImages}
        startPage={startPage}
        isOpen={isFlipBookOpen}
        onClose={() => setIsFlipBookOpen(false)}
        title={title}
        issueLabel={volumeLabel ?? issueLabel}
      />
    </div>
  );
}

export function MagazineLibraryButton() {
  const { status } = useSession();
  const signedIn = status === 'authenticated';

  if (signedIn) {
    return <Link href="/members" className="btn btn-primary px-8">Open my library</Link>;
  }
  return <Link href="/members/login" className="btn btn-primary px-8">Sign in for full access</Link>;
}
