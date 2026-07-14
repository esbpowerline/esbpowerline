'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function ThemeBanner() {
  const [bannerSrc, setBannerSrc] = useState('/images/banner.jpg');

  useEffect(() => {
    const html = document.documentElement;
    const updateBanner = () => {
      const currentTheme = html.dataset.siteTheme;
      if (currentTheme === 'midnight') {
        setBannerSrc('/images/banner_midnight.jpg');
      } else if (currentTheme === 'dark') {
        setBannerSrc('/images/banner_dark.jpg');
      } else {
        setBannerSrc('/images/banner.jpg');
      }
    };
    
    updateBanner();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-site-theme') {
          updateBanner();
        }
      }
    });

    observer.observe(html, { attributes: true, attributeFilter: ['data-site-theme'] });

    return () => observer.disconnect();
  }, []);

  return (
    <Image
      src={bannerSrc}
      alt="ESB PowerLine — Safe Energy Safe Nation"
      className="site-banner__image block mx-auto"
      width={3728}
      height={343}
      priority
      fetchPriority="high"
      sizes="100vw"
      style={{ width: '100%', height: 'auto' }}
      onError={() => {
        if (bannerSrc !== '/images/logo.jpg') {
          setBannerSrc('/images/logo.jpg');
        }
      }}
    />
  );
}
