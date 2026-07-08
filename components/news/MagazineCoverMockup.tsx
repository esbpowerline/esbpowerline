'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MagazineCoverMockupProps {
  coverUrl: string;
  title?: string;
  subtitle?: string;
  kicker?: string;
}

export function MagazineCoverMockup({ 
  coverUrl,
  title = "Renewables Surge",
  subtitle = "& Tariff Reform",
  kicker = "ESB PowerLine"
}: MagazineCoverMockupProps) {
  const [aspect, setAspect] = useState<'portrait' | 'landscape'>('portrait');

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth >= naturalHeight) {
      setAspect('landscape');
    } else {
      setAspect('portrait');
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div 
        className={cn(
          "rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-[var(--bg-elev)] relative transition-all duration-300 w-full",
          aspect === 'portrait' 
            ? "aspect-[3/4] max-w-full sm:max-w-[380px]" 
            : "aspect-[16/10] max-w-full sm:max-w-[480px]"
        )}
      >
        <Image 
          src={coverUrl} 
          alt="Magazine cover" 
          onLoad={handleImageLoad}
          fill
          unoptimized={coverUrl.startsWith('http')}
          className="absolute inset-0 w-full h-full object-cover opacity-95 block mx-auto" 
          sizes="(max-width: 768px) 50vw, 380px"
        />
        {/* Skeuomorphic bound/spine shading for realistic bound feel */}
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-r from-black/35 via-transparent to-transparent opacity-90 pointer-events-none" />
        
        {/* Subtle vignette/darkening to ensure readability if overlay text is shown */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-6 left-6 right-6 text-left pointer-events-none select-none">
          {kicker && <div className="text-accent text-[10px] tracking-[2px] font-bold mb-1 uppercase">{kicker}</div>}
          {title && <div className="text-white text-2xl font-semibold tracking-[-0.01em] leading-tight">{title}</div>}
          {subtitle && <div className="text-foreground/90 text-sm tracking-tight">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
