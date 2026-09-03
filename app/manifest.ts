import type { MetadataRoute } from 'next';

/**
 * Served at /manifest.webmanifest (Next links it from every page). Browsers
 * also request /site.webmanifest by convention; that path redirects here
 * (next.config.ts). It was a 404 in production until Stage 3 of the SEO fix.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ESB PowerLine',
    short_name: 'ESB PowerLine',
    description: "Bangladesh's power sector news, grid data and energy policy.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1f4fd8',
    icons: [
      { src: '/icon.png', sizes: '192x249', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
