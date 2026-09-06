'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Download, FlaskConical, ImageOff } from 'lucide-react';
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

interface MagazineCoverStat {
  value: string;
  label: string;
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
  /** The issue's own printed table of contents. */
  contents?: readonly MagazineContentsEntry[];
  /** The figures printed on the cover. */
  coverStats?: readonly MagazineCoverStat[];
  volumeLabel?: string;
  pageCount?: number;
  cadence?: string;
  priceLabel?: string;
  publisher?: string;
  /** Size of the downloadable PDF, so the button can warn before a big tap. */
  pdfBytes?: number;
  /** Renders the demo treatment. See lib/magazine-demo-issue.ts. */
  demo?: boolean;
  /**
   * Storage could not be reached, so there is no artwork to show. Says so
   * rather than leaving the reader and download silently inert, which is how
   * the previous Tailscale-only host failed for a full day unnoticed.
   */
  assetsUnavailable?: boolean;
}

/**
 * How many page thumbnails the landing page shows.
 *
 * It used to print all 48 — the whole magazine dumped on the page as a wall of
 * unreadable tiles, which left the reader itself with nothing to offer. Six is
 * a teaser; every page is one click away in the reader's own page picker.
 */
const PREVIEW_THUMBS = 6;

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
  contents = [],
  coverStats = [],
  volumeLabel,
  pageCount,
  cadence,
  priceLabel,
  publisher,
  pdfBytes,
  demo = false,
  assetsUnavailable = false,
}: MagazinePageClientProps) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (signedIn && issueId) {
      getMagazineSavedState(issueId).then(setSaved).catch(console.error);
    }
  }, [signedIn, issueId]);

  /** Thumbnails whose signed URL failed to load — usually an expired link. */
  const [failedThumbs, setFailedThumbs] = useState<ReadonlySet<number>>(new Set());
  const [isFlipBookOpen, setIsFlipBookOpen] = useState(false);
  const [startPage, setStartPage] = useState(0);

  const openFlipBook = (index = 0) => {
    setStartPage(index);
    setIsFlipBookOpen(true);
  };

  const readable = pageImages.length > 0;
  const pdfSize = formatMb(pdfBytes);
  const totalPages = pageCount ?? pageImages.length;

  return (
    <div className="relative z-10">
      <div className="container container--shell pt-8 md:pt-10">
        {/* The only issue the site has is a design demo. Say so before anything
            else on the page: it carries full-page adverts for real companies
            that are layout mockups, not sold placements. */}
        {demo ? (
          <div className="mb-8 flex items-start gap-3 border-l-2 border-amber-500 bg-amber-500/[0.05] py-3 pl-4 pr-5">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              <span className="mr-2 font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                Demo issue
              </span>
              A <strong className="font-semibold text-foreground">sample issue produced to demonstrate the
              magazine&rsquo;s design and layout</strong> &mdash; not a published edition. The advertisements in
              it are placeholder artwork, not paid placements, and indicate no commercial relationship.
            </p>
          </div>
        ) : null}

        {assetsUnavailable ? (
          <div className="mb-8 flex items-start gap-3 border-l-2 border-destructive bg-destructive/[0.05] py-3 pl-4 pr-5">
            <ImageOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              <span className="mr-2 font-bold uppercase tracking-[0.16em] text-destructive">Artwork unavailable</span>
              The issue&rsquo;s pages could not be loaded from storage just now, so the reader and the download are
              turned off. Nothing about the issue itself has changed &mdash; please try again shortly.
            </p>
          </div>
        ) : null}
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="container container--shell pb-14 pt-2 md:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_minmax(0,0.98fr)] lg:gap-16">
          {/* Editorial column */}
          <div className="order-2 lg:order-1">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{issueLabel}</span>
              {demo ? (
                <span className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                  Demo
                </span>
              ) : null}
            </div>

            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-5xl xl:text-[3.5rem]">
              {title}
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-[17px] leading-[1.7] text-muted-foreground">{summary}</p>

            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-muted-foreground/75">
              {totalPages ? <span className="tabular-nums">{totalPages} pages</span> : null}
              {cadence ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
                  <span>{cadence}</span>
                </>
              ) : null}
              {priceLabel ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
                  <span>Cover price {priceLabel}</span>
                </>
              ) : null}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => openFlipBook(0)}
                disabled={!readable}
                className="btn btn-primary h-12 justify-center gap-2.5 px-7 text-[15px] shadow-[0_8px_26px_-10px_var(--btn-glow,rgba(0,0,0,0.5))] disabled:opacity-50 disabled:shadow-none sm:w-auto"
              >
                <BookOpen className="h-[18px] w-[18px]" />
                Read this issue
              </button>

              {signedIn && pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary h-12 justify-center gap-2.5 px-6 text-[15px]"
                >
                  <Download className="h-[18px] w-[18px]" /> Download PDF{pdfSize ? ` · ${pdfSize}` : ''}
                </a>
              ) : pdfUrl ? (
                <Link
                  href="/members/login"
                  rel="nofollow"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.assign('/members/login?callbackUrl=/magazine');
                  }}
                  className="btn btn-secondary h-12 justify-center gap-2.5 px-6 text-[15px]"
                >
                  <Download className="h-[18px] w-[18px]" /> Member login to download
                </Link>
              ) : null}

              {signedIn && issueId ? <SaveMagazineButton magazineId={issueId} initialSaved={saved} /> : null}
            </div>
          </div>

          {/* Cover plate */}
          <div className="order-1 flex justify-center lg:order-2">
            {/* The plate needs an explicit width: it is a flex item wrapping an
                absolutely-positioned cover, so it otherwise collapses to zero. */}
            <div className="relative w-[280px] sm:w-[320px]" style={{ perspective: '1600px' }}>
              <div
                className="pointer-events-none absolute -inset-10 -z-10 opacity-70 blur-3xl"
                style={{
                  background:
                    'radial-gradient(50% 50% at 50% 45%, rgba(16,185,129,0.16), rgba(245,158,11,0.08) 55%, transparent 75%)',
                }}
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={() => openFlipBook(0)}
                disabled={!readable}
                aria-label="Open the interactive reader"
                className="group relative block w-full cursor-pointer disabled:cursor-default"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="relative transition-transform duration-500 ease-out group-hover:[transform:rotateY(-14deg)_rotateX(3deg)]"
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-7deg) rotateX(1.5deg)' }}
                >
                  {/* The block of pages behind the cover. Two offset slabs are
                      enough to read as a bound object rather than a flat jpg. */}
                  <div
                    className="pointer-events-none absolute inset-y-2 -right-[7px] rounded-r-md bg-gradient-to-r from-zinc-300 to-zinc-400/60 dark:from-zinc-500 dark:to-zinc-700"
                    style={{ width: 7 }}
                  />
                  <div
                    className="pointer-events-none absolute inset-y-3 -right-[11px] rounded-r-md bg-gradient-to-r from-zinc-300/80 to-zinc-400/30 dark:from-zinc-600 dark:to-zinc-800"
                    style={{ width: 5 }}
                  />

                  <div className="relative shadow-[0_45px_90px_-40px_rgba(0,0,0,0.7)]">
                    <MagazineCoverMockup coverUrl={coverUrl} />
                    {/* Spine shadow along the bound edge. */}
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-[9%] rounded-l-2xl"
                      style={{
                        background: 'linear-gradient(to right, rgba(0,0,0,0.42), rgba(0,0,0,0.06) 60%, transparent)',
                      }}
                    />
                    {/* Gloss sweep on hover. */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background: 'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.16) 50%, transparent 62%)',
                      }}
                    />
                  </div>
                </div>

                {readable ? (
                  <span className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 translate-y-2 items-center gap-2 rounded-full bg-emerald-600/95 px-4 py-2 text-[13px] font-semibold text-white opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <BookOpen className="h-4 w-4" /> Open the reader
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── The figures printed on the cover ─────────────────────────────── */}
      {coverStats.length > 0 ? (
        <section className="border-y border-border/50 bg-muted/[0.18]">
          <div className="container container--shell">
            <div className="grid divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {coverStats.map((stat) => (
                <div key={stat.label} className="py-7 sm:px-8 sm:first:pl-0 sm:last:pr-0">
                  <div className="text-[32px] font-bold leading-none tracking-[-0.02em] tabular-nums text-primary md:text-[38px]">
                    {stat.value}
                  </div>
                  <div className="mt-2.5 max-w-[26ch] text-[13px] leading-relaxed text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="container container--shell py-14 md:py-16">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          {/* ── Contents ─────────────────────────────────────────────────── */}
          <div>
            <div className="mb-7 flex items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">In this issue</div>
                <h2 className="mt-1.5 text-2xl font-bold tracking-[-0.01em]">Contents</h2>
              </div>
              <Link
                href="/articles"
                className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary sm:flex"
              >
                All features <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* The magazine's own printed table of contents (page 3), and every
                line opens the reader on that page. This block used to carry four
                hand-written feature titles that appeared in no issue, each
                captioned "12 pages". */}
            <div className="grid gap-x-12 sm:grid-cols-2">
              {contents.map((entry) => (
                <button
                  key={`${entry.page}-${entry.title}`}
                  type="button"
                  onClick={() => openFlipBook(entry.page - 1)}
                  disabled={!readable}
                  className="group flex items-baseline gap-4 border-b border-border/45 py-3.5 text-left transition-colors hover:border-primary/40 disabled:cursor-default"
                >
                  <span className="w-7 shrink-0 text-sm font-medium tabular-nums text-muted-foreground/60 transition-colors group-hover:text-primary">
                    {String(entry.page).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-accent/85">
                      {entry.section}
                    </span>
                    <span className="mt-0.5 block text-[15px] font-medium leading-snug transition-colors group-hover:text-primary">
                      {entry.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/50">{entry.pages} pp</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="space-y-10">
            {/* Real page thumbnails. This block used to show two invented back
                issues ("Grid Modernization", "LNG Import Future", Vol 04) that
                were never produced -- an archive the site does not have. */}
            {thumbImages.length > 0 ? (
              <div>
                <div className="mb-4 flex items-baseline justify-between border-b border-border/60 pb-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    First look
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground/60">{totalPages} pages</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {thumbImages.slice(0, PREVIEW_THUMBS).map((src, idx) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => openFlipBook(idx)}
                      className="group"
                      aria-label={`Open page ${idx + 1}`}
                    >
                      <div className="relative aspect-[587/803] w-full overflow-hidden rounded-[3px] border border-border/50 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
                        {failedThumbs.has(idx) ? (
                          // A dead thumbnail used to render as an empty box that
                          // still claimed to open that page. Show why it is empty.
                          <div className="absolute inset-0 grid place-items-center bg-muted/40 text-muted-foreground">
                            <ImageOff className="h-4 w-4" aria-label={`Page ${idx + 1} unavailable`} />
                          </div>
                        ) : (
                          /* Plain img: these are Supabase signed URLs, a per-render
                             origin the Next image optimizer cannot be configured for. */
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={src}
                            alt={`Page ${idx + 1}`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={() => setFailedThumbs((prev) => new Set(prev).add(idx))}
                          />
                        )}
                      </div>
                      <span className="mt-1 block text-center text-[10px] tabular-nums text-muted-foreground/60 transition-colors group-hover:text-primary">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>

                {/* The remaining pages live in the reader's page picker. */}
                {thumbImages.length > PREVIEW_THUMBS ? (
                  <button
                    type="button"
                    onClick={() => openFlipBook(PREVIEW_THUMBS)}
                    className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border/70 py-2.5 text-[12px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/[0.04] hover:text-primary"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Browse all {thumbImages.length} pages in the reader
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Facts printed in the issue itself. This card used to list invented
                features ("Subcontinental Energy Map", "Solar Pipeline 2026")
                that matched nothing in any issue. */}
            {masthead.length > 0 ? (
              <div>
                <div className="mb-4 border-b border-border/60 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Masthead
                </div>
                <ul className="space-y-3">
                  {masthead.map((person) => (
                    <li key={person.name} className="leading-tight">
                      <div className="text-[13px] font-semibold">{person.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{person.role}</div>
                    </li>
                  ))}
                </ul>
                {publisher ? (
                  <p className="mt-5 border-t border-border/40 pt-4 text-[11px] leading-relaxed text-muted-foreground/70">
                    {publisher}
                  </p>
                ) : null}
              </div>
            ) : null}

            {volumeLabel ? (
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/50">{volumeLabel}</div>
            ) : null}
          </aside>
        </div>
      </div>

      <MagazineFlipBook
        pages={pageImages}
        thumbs={thumbImages}
        startPage={startPage}
        isOpen={isFlipBookOpen}
        onClose={() => setIsFlipBookOpen(false)}
        issueLabel={issueLabel}
        title={title}
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
