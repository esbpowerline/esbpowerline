import type { NextConfig } from 'next';

// Each dev port runs its own Next instance — separate dist dirs prevent cache corruption
const surface = process.env.APP_SURFACE ?? 'all';
const distDir = surface === 'all' ? '.next' : `.next-${surface}`;

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co https://*.esbpowerline.com https://esbpowerline.com https://www.esbpowerline.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
  "frame-src 'self'",
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

  env: {
    NEXT_PUBLIC_APP_SURFACE: surface,
  },

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
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'esbpowerline.com' },
      { protocol: 'https', hostname: 'www.esbpowerline.com' },
      { protocol: 'https', hostname: '**.esbpowerline.com' },
    ],
    formats: ['image/avif', 'image/webp'],
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
        // Short cache for public images (can be purged by CDN)
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
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

