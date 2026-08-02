import type { NextConfig } from 'next';

// Each dev port runs its own Next instance — separate dist dirs prevent cache corruption
const surface = process.env.APP_SURFACE ?? 'all';
const distDir = surface === 'all' ? '.next' : `.next-${surface}`;

// 'unsafe-eval' is only needed by the dev server (React Refresh / HMR). Exclude it in
// production to tighten the XSS surface — this stack (Recharts, ReactFlow, TipTap, GA/GTM)
// does not use eval at runtime.
const scriptSrc =
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com";

const cspHeader = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co https://*.esbpowerline.com https://esbpowerline.com https://www.esbpowerline.com https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  // facebook.com is needed for the video plugin used by Facebook-hosted interviews.
  "frame-src 'self' https://www.youtube.com https://www.facebook.com",
  "media-src 'self'",
].join('; ');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  distDir,
  compress: true,
  poweredByHeader: false,

  // Cron ingest uses runtime temp downloads — keep bulky local datasets out of the serverless bundle.
  outputFileTracingExcludes: {
    '/api/cron/ingest': [
      './public/data/**/*',
      './scratch/**/*',
      './public/uploads/**/*',
      './agent-tools/**/*',
    ],
  },

  // The grid export route reads daily JSON + the logo from disk at runtime; force
  // them into that function's bundle so exports work on Vercel serverless.
  outputFileTracingIncludes: {
    '/api/members/grid-export': [
      './public/data/daily/**',
      './public/data/petrobangla/daily/**',
      './public/data/petrobangla/_index.json',
      './public/images/esb-logo.png',
      './public/fonts/**',
    ],
  },

  env: {
    NEXT_PUBLIC_APP_SURFACE: surface,
  },

  // react-pdf ships fontkit/yoga and other Node-native bits — keep it out of the
  // webpack server bundle so the grid-export PDF route works on serverless.
  serverExternalPackages: ['@react-pdf/renderer'],

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'localhost:3002',
        '127.0.0.1:3000',
        '127.0.0.1:3001',
        '127.0.0.1:3002',
      ],
    },
    // Disabled: parallel split-surface dev (3 instances) can corrupt Turbopack's dev cache
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: true,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'sonner',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    unoptimized: false, // Bypass Vercel 1000 image/mo limit
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'esbpowerline.com' },
      { protocol: 'https', hostname: 'www.esbpowerline.com' },
      { protocol: 'https', hostname: '**.esbpowerline.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Only 80 is allowed, so the built-in default (75) snaps to it — every
    // <Image> is served at q80, matching the upload/import/Supabase pipeline.
    qualities: [80],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Long-lived cache for immutable static assets
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Long-lived cache for public images and fonts
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/fonts/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/data/daily/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/data/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/advertising',
        destination: '/contact#advertising',
        permanent: true,
      },
      {
        source: '/power-grid',
        destination: '/grid-explorer',
        permanent: true,
      },
      {
        source: '/power-grid/:path*',
        destination: '/grid-explorer/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

