'use client';

import dynamic from 'next/dynamic';

/**
 * Below-the-fold home sections.
 *
 * These were previously `dynamic(..., { ssr: false })` *and* gated behind an
 * IntersectionObserver that rendered an empty spacer until scrolled into view.
 * The combination meant the entire category grid, trending rail, interviews and
 * bottom row emitted no server HTML at all: the homepage's rendered markup
 * carried exactly one article link, while the server still ran every category
 * query and serialised all those article props into the RSC payload. Crawlers
 * saw an empty page on the site's highest-authority URL.
 *
 * They now server-render. Offscreen work is still deferred, but by the browser
 * via `content-visibility: auto`, which skips layout and paint for offscreen
 * subtrees *without* removing them from the DOM — so crawlers, no-JS readers and
 * the LCP all get real markup. `contain-intrinsic-size` keeps the scrollbar
 * honest so this costs no layout shift.
 */
function DeferredPaint({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight: string;
}) {
  return (
    <div style={{ contentVisibility: 'auto', containIntrinsicSize: `0 ${minHeight}` }}>
      {children}
    </div>
  );
}

// Still code-split (these are large), but server-rendered.
const HomeBottomRowClient = dynamic(() =>
  import('@/components/home/HomeBottomRow').then((m) => m.HomeBottomRow),
);
const HomePowerSectorClient = dynamic(() =>
  import('@/components/home/HomePowerSector').then((m) => m.HomePowerSector),
);
const HomeTrendingSectionClient = dynamic(() =>
  import('@/components/home/HomeTrendingSection').then((m) => m.HomeTrendingSection),
);
const InterviewsSectionClient = dynamic(() =>
  import('@/components/news/InterviewsSection').then((m) => m.InterviewsSection),
);

export function DeferredHomeBottomRow(props: any) {
  return (
    <DeferredPaint minHeight="800px">
      <HomeBottomRowClient {...props} />
    </DeferredPaint>
  );
}

export function DeferredHomePowerSector(props: any) {
  return (
    <DeferredPaint minHeight="1200px">
      <HomePowerSectorClient {...props} />
    </DeferredPaint>
  );
}

export function DeferredHomeTrendingSection(props: any) {
  return (
    <DeferredPaint minHeight="800px">
      <HomeTrendingSectionClient {...props} />
    </DeferredPaint>
  );
}

export function DeferredInterviewsSection(props: any) {
  return (
    <DeferredPaint minHeight="600px">
      <InterviewsSectionClient {...props} />
    </DeferredPaint>
  );
}
