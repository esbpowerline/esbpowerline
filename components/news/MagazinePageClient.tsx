'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Calendar, Users, Sparkles, BookOpen, Star, HelpCircle, ArrowUpRight } from 'lucide-react';
import { MagazineCoverMockup } from './MagazineCoverMockup';
import { MagazineFlipBook } from './MagazineFlipBook';
import { SaveMagazineButton } from '@/components/members/SaveMagazineButton';
import { useSession } from '@/utils/supabase/auth-context';
import { getMagazineSavedState } from '@/lib/actions/members';
import { useEffect } from 'react';

interface MagazinePageClientProps {
  coverUrl: string;
  title: string;
  summary: string;
  issueLabel: string;
  pdfUrl: string | null;
  issueId: string;
  features: { title: string; excerpt: string }[];
}

export function MagazinePageClient({
  coverUrl,
  title,
  summary,
  issueLabel,
  pdfUrl,
  issueId,
  features,
}: MagazinePageClientProps) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (signedIn && issueId) {
      getMagazineSavedState(issueId).then(setSaved).catch(console.error);
    }
  }, [signedIn, issueId]);

  const [activeCover, setActiveCover] = useState(coverUrl);
  const [isFlipBookOpen, setIsFlipBookOpen] = useState(false);

  const openFlipBook = (cover: string) => {
    setActiveCover(cover);
    setIsFlipBookOpen(true);
  };

  const previousIssues = [
    {
      cover: '/images/COVER001.jpg',
      title: 'Grid Modernization',
      subtitle: '& Smart Metering',
      kicker: 'May 2026 Issue',
      date: 'May 2026',
      volume: 'Vol. 04 • Issue 05',
    },
    {
      cover: '/images/COVER002.jpg',
      title: 'LNG Import Future',
      subtitle: '& Gas Infrastructure',
      kicker: 'April 2026 Issue',
      date: 'April 2026',
      volume: 'Vol. 04 • Issue 04',
    },
  ];

  return (
    <div className="container container--shell py-10 md:py-12 relative z-10">
      <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">
        
        {/* Left Info Column */}
        <div className="lg:w-2/5 order-2 lg:order-1">
          <div className="sticky top-8">
            <div className="uppercase text-xs tracking-[2px] text-accent font-semibold mb-2.5 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" /> {issueLabel} ISSUE
            </div>
            
            <h1 className="h2 mb-4 text-balance font-bold leading-tight">{title}</h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">{summary}</p>

            {/* Premium Perks Card */}
            <div className="border border-border/40 rounded-2xl p-5 bg-card/45 dark:bg-card/20 backdrop-blur-sm mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500/20" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Interactive Preview Features</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>8-Page 3D Flipbook</strong>: Experience realistic page-flipping visuals.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Subcontinental Energy Map</strong>: Interactive maps on transmission grids.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Solar Pipeline 2026</strong>: In-depth data charts on upcoming wind and solar projects.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              {signedIn && pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary gap-2 px-5 w-full sm:w-auto justify-center">
                  <Download className="h-4 w-4" /> Download PDF
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
                onClick={() => openFlipBook(coverUrl)}
                className="btn btn-emerald gap-2 px-5 shadow-[0_2px_10px_-2px_rgba(16,185,129,0.2)] w-full sm:w-auto justify-center"
              >
                <BookOpen className="h-4 w-4" /> Flipbook Preview
              </button>

              {signedIn && issueId ? (
                <SaveMagazineButton magazineId={issueId} initialSaved={saved} />
              ) : null}
            </div>

            <div className="mt-8 text-xs text-muted-foreground/80 flex items-center gap-4 border-t border-border/20 pt-5">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> 
                <span className="font-semibold text-foreground/80">18,400 readers</span>
              </div>
              <div className="text-muted-foreground/50">•</div>
              <div>Vol. 04 • Issue 06</div>
            </div>
          </div>
        </div>

        {/* Right Cover Preview & Previous Releases Column */}
        <div className="lg:w-3/5 flex flex-col items-center order-1 lg:order-2">
          
          {/* Main Cover Holder Container */}
          <div className="w-full max-w-[420px] p-6 rounded-3xl border border-border/40 bg-gradient-to-b from-card/80 to-card/25 shadow-xl dark:shadow-none relative group mb-10">
            {/* Soft Ambient glow behind the cover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-primary/5 to-transparent blur-2xl opacity-75 rounded-3xl pointer-events-none" />
            
            <div 
              onClick={() => openFlipBook(coverUrl)}
              className="relative cursor-pointer transition-transform duration-300 hover:scale-[1.015] z-10"
            >
              <MagazineCoverMockup coverUrl={coverUrl} />
              
              {/* Blur-overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none">
                <div className="bg-emerald-600/90 text-white border border-emerald-500/30 rounded-full px-5 py-2.5 flex items-center gap-2 font-semibold shadow-lg text-sm scale-95 group-hover:scale-100 transition-transform duration-300">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
                  <span>Open Interactive Reader</span>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4 text-[10px] text-muted-foreground/85 flex items-center justify-center gap-1.5 z-10 relative">
              <span>Print • Digital Preview</span>
              <span>•</span>
              <button 
                onClick={() => openFlipBook(coverUrl)}
                className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" /> Turn Pages (3D Flipbook)
              </button>
            </div>
          </div>

          {/* Previous Releases Curated Section */}
          <div className="w-full max-w-[420px] border-t border-border/30 pt-8 mt-2 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-accent tracking-[2px] uppercase">Curated Archive</span>
                <span className="text-sm font-bold text-foreground">Previous Releases</span>
              </div>
              {/* Members-only, redirects anonymous readers to the login page:
                  nofollow so crawlers do not chase a redirect from a public
                  page (Search Console "page with redirect", Stage 3). */}
              <Link
                href="/members/magazine"
                rel="nofollow"
                className="text-[11px] text-primary hover:text-primary-foreground font-semibold inline-flex items-center gap-1 group/link"
              >
                Full Archive <ArrowUpRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {previousIssues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col items-center group cursor-pointer"
                  onClick={() => openFlipBook(issue.cover)}
                >
                  <div className="w-full aspect-[3/4] relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:border-primary/30 border border-border/40 transition-all duration-300 hover:scale-[1.02]">
                    <MagazineCoverMockup 
                      coverUrl={issue.cover} 
                      title={issue.title}
                      subtitle={issue.subtitle}
                      kicker={issue.kicker}
                    />
                    {/* Tiny launch indicator */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="h-3 w-3 text-amber-300" />
                    </div>
                  </div>
                  <span className="text-[12px] font-bold mt-3 text-foreground group-hover:text-primary transition-colors">{issue.date}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{issue.volume}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Interactive 3D flipbook modal */}
      <MagazineFlipBook 
        coverUrl={activeCover}
        isOpen={isFlipBookOpen}
        onClose={() => setIsFlipBookOpen(false)}
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
