'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MagazineFlipBookProps {
  coverUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MagazineFlipBook({ coverUrl, isOpen, onClose }: MagazineFlipBookProps) {
  // Page index for double-page sheet flips: 
  // 0 = Closed (showing cover on right)
  // 1 = Sheet 1 flipped (showing INNER001 on left, INNER002 on right)
  // 2 = Sheet 2 flipped (showing INNER003 on left, INNER004 on right)
  // 3 = Sheet 3 flipped (showing INNER005 on left, INNER006 on right)
  // 4 = Sheet 4 flipped (showing back cover on left, empty on right)
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Prevent body and html scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.documentElement.style.height = '100%';
      
      // Hide sticky public nav bar completely
      const navBar = document.querySelector('.public-nav-bar') as HTMLElement;
      if (navBar) {
        navBar.style.display = 'none';
      }

      // Block all wheel and touch scroll gestures
      const preventDefault = (e: Event) => {
        e.preventDefault();
      };
      window.addEventListener('wheel', preventDefault, { passive: false });
      window.addEventListener('touchmove', preventDefault, { passive: false });

      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.height = '';
        document.documentElement.style.height = '';
        if (navBar) {
          navBar.style.display = '';
        }
        window.removeEventListener('wheel', preventDefault);
        window.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nextPage = () => {
    if (currentPage < 4) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Helper to resolve sheet container depth class
  const getSheetZIndex = (sheetIndex: number) => {
    // Top-most sheet is the one currently active or closest to being active
    if (sheetIndex === 1) {
      return currentPage >= 1 ? "z-10" : "z-50";
    }
    if (sheetIndex === 2) {
      return currentPage >= 2 ? "z-20" : (currentPage === 1 ? "z-40" : "z-30");
    }
    if (sheetIndex === 3) {
      return currentPage >= 3 ? "z-30" : (currentPage === 2 ? "z-30" : "z-20");
    }
    if (sheetIndex === 4) {
      return currentPage >= 4 ? "z-45" : "z-10";
    }
    return "z-10";
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300 p-4 md:p-6 select-none overflow-hidden">
      {/* Background close area */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Header controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 text-white text-xs font-semibold">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span>Interactive Preview</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors duration-200"
          aria-label="Close interactive reader"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Flipbook Wrapper */}
      <div className="relative w-full max-w-5xl aspect-[4/3] flex flex-col items-center justify-center z-10">
        
        {/* Book Component */}
        <div className="relative w-full h-[80%] flex items-center justify-center perspective-[1500px]">
          
          {/* Desktop/Tablet Double-Page Flipbook */}
          <div className="hidden md:flex relative w-[760px] h-[500px] transform-style-preserve-3d transition-transform duration-500">
            
            {/* Left static background page (always acts as the backing page/spine shadow when open) */}
            <div className="absolute top-0 right-1/2 w-1/2 h-full bg-[#161616] border-y border-l border-border/10 rounded-l-2xl shadow-xl pointer-events-none" />
            
            {/* Right static background page (always acts as the backing page/back cover when open) */}
            <div className="absolute top-0 left-1/2 w-1/2 h-full bg-[#161616] border-y border-r border-border/10 rounded-r-2xl shadow-xl pointer-events-none" />
            
            {/* ========================================================================= */}
            {/* STATIC UNDERLAYS (behind flipping sheets to prevent white flashing)      */}
            {/* ========================================================================= */}

            {/* Static Left page INNER001 (visible when currentPage === 1 or Sheet 2 is flipping) */}
            {currentPage >= 1 && (
              <div className="absolute top-0 right-1/2 w-1/2 h-full bg-zinc-900 border-y border-l border-border/40 rounded-l-2xl overflow-hidden pointer-events-none">
                <Image
                  src={currentPage >= 3 ? "/images/INNER005.jpg" : (currentPage === 2 ? "/images/INNER003.jpg" : "/images/INNER001.jpg")}
                  alt="Page Left Static"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/45 to-transparent" />
              </div>
            )}

            {/* Static Right page INNER002 (visible when currentPage === 0) */}
            {currentPage === 0 && (
              <div className="absolute top-0 left-1/2 w-1/2 h-full bg-zinc-900 border-y border-r border-border/40 rounded-r-2xl overflow-hidden pointer-events-none">
                <Image
                  src="/images/INNER002.jpg"
                  alt="Page 2 static"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover opacity-80"
                />
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
              </div>
            )}

            {/* Static Right page INNER004 (visible when currentPage === 1) */}
            {currentPage === 1 && (
              <div className="absolute top-0 left-1/2 w-1/2 h-full bg-zinc-900 border-y border-r border-border/40 rounded-r-2xl overflow-hidden pointer-events-none">
                <Image
                  src="/images/INNER004.jpg"
                  alt="Page 4 static"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
              </div>
            )}

            {/* Static Right page INNER006 (visible when currentPage === 2) */}
            {currentPage === 2 && (
              <div className="absolute top-0 left-1/2 w-1/2 h-full bg-zinc-900 border-y border-r border-border/40 rounded-r-2xl overflow-hidden pointer-events-none">
                <Image
                  src="/images/INNER006.jpg"
                  alt="Page 6 static"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
              </div>
            )}

            {/* Static Back Cover (visible on the right when currentPage === 3) */}
            {currentPage === 3 && (
              <div className="absolute top-0 left-1/2 w-1/2 h-full bg-[#121212] border-y border-r border-border/30 rounded-r-2xl pointer-events-none flex items-center justify-center text-zinc-600 font-semibold text-xs">
                ESB PowerLine © 2026
              </div>
            )}

            {/* ========================================================================= */}
            {/* FLIPPING SHEETS                                                           */}
            {/* ========================================================================= */}

            {/* Sheet 1: Cover / INNER001 (Rotates around left edge = origin-left) */}
            <div 
              className={cn(
                "absolute top-0 left-1/2 w-1/2 h-full transform-style-preserve-3d origin-left transition-transform duration-700 ease-in-out-cubic pointer-events-none",
                currentPage >= 1 ? "rotate-y-180" : "rotate-y-0",
                getSheetZIndex(1)
              )}
            >
              {/* Cover - Front of Sheet 1 */}
              <div className="absolute inset-0 backface-hidden bg-zinc-900 border-y border-r border-border/40 rounded-r-2xl overflow-hidden shadow-2xl pointer-events-auto">
                <Image
                  src={coverUrl}
                  alt="Magazine Cover"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  
                  className="object-cover"
                  priority
                />
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
                <div 
                  onClick={nextPage}
                  className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-end p-6 cursor-pointer"
                >
                  <div className="bg-primary text-white p-3 rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* INNER001 - Back of Sheet 1 */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-900 border-y border-l border-border/40 rounded-l-2xl overflow-hidden shadow-2xl pointer-events-auto">
                <Image
                  src="/images/INNER001.jpg"
                  alt="Page 1"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/45 to-transparent" />
                <div onClick={prevPage} className="absolute inset-0 cursor-pointer" />
              </div>
            </div>

            {/* Sheet 2: INNER002 / INNER003 (Rotates around left edge) */}
            <div 
              className={cn(
                "absolute top-0 left-1/2 w-1/2 h-full transform-style-preserve-3d origin-left transition-transform duration-700 ease-in-out-cubic pointer-events-none",
                currentPage >= 2 ? "rotate-y-180" : "rotate-y-0",
                getSheetZIndex(2)
              )}
            >
              {/* INNER002 - Front of Sheet 2 */}
              <div className="absolute inset-0 backface-hidden bg-zinc-900 border-y border-r border-border/40 rounded-r-2xl overflow-hidden shadow-2xl pointer-events-auto">
                <Image
                  src="/images/INNER002.jpg"
                  alt="Page 2"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
                <div onClick={nextPage} className="absolute inset-0 cursor-pointer" />
              </div>

              {/* INNER003 - Back of Sheet 2 */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-900 border-y border-l border-border/40 rounded-l-2xl overflow-hidden shadow-2xl pointer-events-auto">
                <Image
                  src="/images/INNER003.jpg"
                  alt="Page 3"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/45 to-transparent" />
                <div onClick={prevPage} className="absolute inset-0 cursor-pointer" />
              </div>
            </div>

            {/* Sheet 3: INNER004 / INNER005 (Rotates around left edge) */}
            <div 
              className={cn(
                "absolute top-0 left-1/2 w-1/2 h-full transform-style-preserve-3d origin-left transition-transform duration-700 ease-in-out-cubic pointer-events-none",
                currentPage >= 3 ? "rotate-y-180" : "rotate-y-0",
                getSheetZIndex(3)
              )}
            >
              {/* INNER004 - Front of Sheet 3 */}
              <div className="absolute inset-0 backface-hidden bg-zinc-900 border-y border-r border-border/40 rounded-r-2xl overflow-hidden shadow-2xl pointer-events-auto">
                <Image
                  src="/images/INNER004.jpg"
                  alt="Page 4"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
                <div onClick={nextPage} className="absolute inset-0 cursor-pointer" />
              </div>

              {/* INNER005 - Back of Sheet 3 */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-900 border-y border-l border-border/40 rounded-l-2xl overflow-hidden shadow-2xl pointer-events-auto">
                <Image
                  src="/images/INNER005.jpg"
                  alt="Page 5"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/45 to-transparent" />
                <div onClick={prevPage} className="absolute inset-0 cursor-pointer" />
              </div>
            </div>

            {/* Sheet 4: INNER006 / Back Cover (Rotates around left edge) */}
            <div 
              className={cn(
                "absolute top-0 left-1/2 w-1/2 h-full transform-style-preserve-3d origin-left transition-transform duration-700 ease-in-out-cubic pointer-events-none",
                currentPage >= 4 ? "rotate-y-180" : "rotate-y-0",
                getSheetZIndex(4)
              )}
            >
              {/* INNER006 - Front of Sheet 4 */}
              <div className="absolute inset-0 backface-hidden bg-zinc-900 border-y border-r border-border/40 rounded-r-2xl overflow-hidden shadow-2xl pointer-events-auto">
                <Image
                  src="/images/INNER006.jpg"
                  alt="Page 6"
                  fill
                  sizes="(max-width: 767px) 290px, 380px"
                  className="object-cover"
                />
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/45 to-transparent" />
                <div onClick={nextPage} className="absolute inset-0 cursor-pointer" />
              </div>

              {/* Back Cover - Back of Sheet 4 */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#121212] border-y border-l border-border/30 rounded-l-2xl shadow-2xl pointer-events-auto flex flex-col items-center justify-center text-zinc-500">
                <div className="text-xl font-bold uppercase tracking-widest mb-1 text-primary">ESB PowerLine</div>
                <div className="text-xs uppercase tracking-[2px] font-semibold text-zinc-600">Energy & Power Portal</div>
                <div className="text-[10px] text-zinc-700 mt-6">Dhaka, Bangladesh • © 2026</div>
                <div onClick={prevPage} className="absolute inset-0 cursor-pointer" />
              </div>
            </div>

            {/* Back cover shadow placeholder */}
            {currentPage === 4 && (
              <div className="absolute top-0 right-1/2 w-1/2 h-full bg-[#121212] border-y border-l border-border/30 rounded-l-2xl shadow-2xl pointer-events-none flex flex-col items-center justify-center text-zinc-500">
                <div className="text-xl font-bold uppercase tracking-widest mb-1 text-primary">ESB PowerLine</div>
                <div className="text-xs uppercase tracking-[2px] font-semibold text-zinc-600">Energy & Power Portal</div>
                <div className="text-[10px] text-zinc-700 mt-6">Dhaka, Bangladesh • © 2026</div>
              </div>
            )}
          </div>

          {/* Mobile Single-Page Slide view */}
          <div className="flex md:hidden relative w-[290px] h-[395px] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900">
            <Image
              src={
                currentPage === 0
                  ? coverUrl
                  : currentPage === 1
                  ? "/images/INNER001.jpg"
                  : currentPage === 2
                  ? "/images/INNER002.jpg"
                  : currentPage === 3
                  ? "/images/INNER003.jpg"
                  : currentPage === 4
                  ? "/images/INNER004.jpg"
                  : currentPage === 5
                  ? "/images/INNER005.jpg"
                  : currentPage === 6
                  ? "/images/INNER006.jpg"
                  : coverUrl // default fallback or wrap
              }
              alt={`Page ${currentPage}`}
              fill
              sizes="(max-width: 767px) 290px, 380px"
              className="object-cover transition-all duration-300"
            />
            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
              Page {currentPage === 0 ? "Cover" : currentPage} of 6
            </div>
          </div>
        </div>

        {/* Bottom Navigation controls */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="text-white text-sm font-medium tracking-wide">
              {currentPage === 0 
                ? 'Cover Page' 
                : currentPage === 4 
                ? 'Back Cover' 
                : `Pages ${currentPage * 2 - 1}–${currentPage * 2}`}
            </span>

            <button
              onClick={nextPage}
              disabled={currentPage === 4}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next Page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-zinc-400 text-xs mt-2 text-center max-w-sm hidden md:block">
            Click on the right side of the page to flip forward, or the left side to flip back.
          </p>
        </div>
      </div>
    </div>
  );
}
