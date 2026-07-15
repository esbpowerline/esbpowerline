'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

function useInView(options = { rootMargin: '100px' }) {
  const [isIntersecting, setIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, just load it immediately (fallback for very old browsers)
    if (typeof IntersectionObserver === 'undefined') {
      setIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
        observer.disconnect(); // Only load once
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options.rootMargin]);

  return { ref, isIntersecting };
}

function InViewWrapper({ children, minHeight }: { children: React.ReactNode, minHeight: string }) {
  const { ref, isIntersecting } = useInView({ rootMargin: '100px' }); // Load when within 100px

  if (isIntersecting) {
    return <>{children}</>;
  }

  // Pre-allocate space to prevent Cumulative Layout Shift (CLS)
  return (
    <div ref={ref} style={{ minHeight, width: '100%', containIntrinsicSize: `0 ${minHeight}`, contentVisibility: 'auto' }} />
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
