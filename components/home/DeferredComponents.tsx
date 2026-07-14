'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

function useInView(options = { rootMargin: '200px' }) {
  const [isIntersecting, setIntersecting] = useState(false);
  const [canLoad, setCanLoad] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const handleLoad = () => {
      setCanLoad(true);
      cleanup();
    };

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleLoad, { capture: true });
      window.removeEventListener('mousemove', handleLoad, { capture: true });
      window.removeEventListener('touchstart', handleLoad, { capture: true });
    };

    // Ensure main thread is free for LCP. Load on user interaction or fallback timeout.
    timer = setTimeout(handleLoad, 7000);
    
    window.addEventListener('scroll', handleLoad, { capture: true, once: true });
    window.addEventListener('mousemove', handleLoad, { capture: true, once: true });
    window.addEventListener('touchstart', handleLoad, { capture: true, once: true });

    return cleanup;
  }, []);

  useEffect(() => {
    if (!canLoad) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
        observer.disconnect();
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options.rootMargin, canLoad]);

  return { ref, isIntersecting };
}

function InViewWrapper({ children, minHeight }: { children: React.ReactNode, minHeight: string }) {
  const { ref, isIntersecting } = useInView({ rootMargin: '50px' });

  if (isIntersecting) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} style={{ minHeight, contentVisibility: 'auto', containIntrinsicSize: `0 ${minHeight}` }} />
  );
}

const HomeBottomRowClient = dynamic(() => import('@/components/home/HomeBottomRow').then(m => m.HomeBottomRow), { ssr: false });
const HomePowerSectorClient = dynamic(() => import('@/components/home/HomePowerSector').then(m => m.HomePowerSector), { ssr: false });
const HomeTrendingSectionClient = dynamic(() => import('@/components/home/HomeTrendingSection').then(m => m.HomeTrendingSection), { ssr: false });
const InterviewsSectionClient = dynamic(() => import('@/components/news/InterviewsSection').then(m => m.InterviewsSection), { ssr: false });

export function DeferredHomeBottomRow(props: any) {
  return (
    <InViewWrapper minHeight="800px">
      <HomeBottomRowClient {...props} />
    </InViewWrapper>
  );
}

export function DeferredHomePowerSector(props: any) {
  return (
    <InViewWrapper minHeight="1200px">
      <HomePowerSectorClient {...props} />
    </InViewWrapper>
  );
}

export function DeferredHomeTrendingSection(props: any) {
  return (
    <InViewWrapper minHeight="800px">
      <HomeTrendingSectionClient {...props} />
    </InViewWrapper>
  );
}

export function DeferredInterviewsSection(props: any) {
  return (
    <InViewWrapper minHeight="600px">
      <InterviewsSectionClient {...props} />
    </InViewWrapper>
  );
}
