import type { NextConfig } from 'next';

// Each dev port runs its own Next instance — separate dist dirs prevent cache corruption
const surface = process.env.APP_SURFACE ?? 'all';
const distDir = surface === 'all' ? '.next' : `.next-${surface}`;

const isProd = process.env.NODE_ENV === 'production';

// 'unsafe-eval' is only needed by the dev server (React Refresh / HMR). Exclude it in
// production to tighten the XSS surface — this stack (Recharts, ReactFlow, TipTap, GA/GTM)
// does not use eval at runtime.
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com";

/**
 * A year of `immutable`, applied only when built for production.
 *
 * Safe there because every one of these URLs changes when its content does —
 * Next content-hashes chunk filenames at build time, and the images and fonts
 * under /public are replaced by deploying a new file. In development none of
 * that holds: chunk names are stable across edits, so the same URL serves
 * different bytes every time a file is saved, and a browser told to cache it
 * for a year will not ask again.
 */
const immutableAsset = (source: string) =>
  isProd
    ? [{ source, headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }]
    : [];

// Host of the Supabase project that serves media, derived from the same env var
// the app uses. Falls back to null so a missing var drops the pattern entirely
// rather than silently re-opening the proxy.
const supabaseImageHost = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    return raw ? new URL(raw).hostname : null;
  } catch {
    return null;
  }
})();

const cspHeader = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co https://*.esbpowerline.com https://esbpowerline.com https://www.esbpowerline.com https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  // GA4 posts to the BARE hosts too (`analytics.google.com/g/collect`,
  // `google-analytics.com`), which the `*.` wildcards do not match — so every
  // page silently failed its analytics beacon with a CSP violation. Add the
  // apex hosts explicitly. Verified by the crawler: 20 blocked-connect console
  // errors before, 0 after.
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://google-analytics.com https://*.googletagmanager.com",
  // facebook.com is needed for the video plugin used by Facebook-hosted interviews.
  "frame-src 'self' https://www.youtube.com https://www.facebook.com",
  "media-src 'self'",
  // default-src does not cover these three. Without base-uri an injected
  // <base href> re-points every relative script URL; without form-action a
  // form can post credentials cross-origin; frame-ancestors is the modern
  // clickjacking control (X-Frame-Options is ignored by newer engines).
  // object-src 'none' kills the legacy <object>/<embed> plugin vector.
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  distDir,
  compress: true,
  poweredByHeader: false,

  // Cron ingest uses runtime temp downloads — keep bulky local datasets out of the serverless bundle.
  //
  // The wildcard entries matter as much as the cron one. The daily loader
  // builds its path with `path.join(process.cwd(), 'public', 'data', 'daily', …)`,
  // which the tracer cannot resolve statically, so it pulls the WHOLE archive
  // into every function that transitively imports it — `admin/media` alone was
  // tracing 4,814 files it never reads, and at 256MB it broke the 250MB
  // function limit and failed the deploy. Only the routes that genuinely read
  // the archive from disk keep it, via outputFileTracingIncludes below.
  outputFileTracingExcludes: {
    '/api/cron/ingest': [
      './public/data/**/*',
      './scratch/**/*',
      './public/uploads/**/*',
      './agent-tools/**/*',
    ],
    '/admin/**': ['./public/data/**/*', './public/uploads/**/*'],
    // Plain `/cms/**`, extglobs deliberately avoided. This build runs on
    // Turbopack, whose tracer matches these route keys with a Rust glob engine
    // that has no `!(...)`: a key of `/cms!(/yoy-sheet)` — the obvious way to
    // hold one page out — compiles to a pattern that matches NOTHING, so every
    // CMS route silently loses its exclusion. It reads as correct, the build
    // still succeeds, and `/cms/media` quietly goes from 78MB to 311MB. The
    // year-on-year sheet is given its archive by the include below instead.
    '/cms/**': ['./public/data/**/*', './public/uploads/**/*'],
    // The upload routes reach the same unresolvable `path.join(process.cwd(),
    // 'public', 'data', …)` through their auth chain, so they traced the whole
    // archive too. `category-icon` is the one that broke first because
    // `media-storage` also pulls in sharp: 267.37MB against the 250MB limit,
    // which failed the production deploy of 2026-08-15 after the build itself
    // had already succeeded. Excluding the archive drops ~239MB from it.
    //
    // Note these keys are route paths, so `/admin/**` above does NOT cover
    // `/api/admin/**` — those routes still carry the archive and sit closer to
    // the limit than they look.
    '/api/upload/**': ['./public/data/**/*', './public/uploads/**/*'],
    // Station detail and the half-hourly fuel curve are fetched over HTTP by
    // the browser and never read from disk on the server, so they belong in no
    // function bundle at all. Both are per-day files large enough to matter:
    // 19MB and 14MB against a 250MB function limit that a deploy has already
    // hit once.
    '**': ['./public/data/plants/**/*', './public/data/curves/**/*'],
  },

  // The grid export route reads daily JSON + the logo from disk at runtime; force
  // them into that function's bundle so exports work on Vercel serverless.
  outputFileTracingIncludes: {
    // The year-on-year sheet reads the same two archives as the export route,
    // for the same reason: the sheet pairs a day with the same day a year
    // earlier, and the free comparison beside it reads gas from the Petrobangla
    // day that covers the energy day. `pgcb-monthly` is deliberately NOT here —
    // the Months tab falls back to published releases, and the 31MB it would add
    // buys a tab this page is not primarily for.
    //
    // This include and the `/cms/**` exclude above BOTH match this route, and
    // the include wins — measured, because the two tracers disagree and only
    // one of them runs here. `collect-build-traces.js` applies excludes last,
    // which would cancel this; that file is the webpack path and never executes
    // in a Turbopack build. Under Turbopack the page traces at 195MB with all
    // 4,543 daily files present, the same size as grid-export below. If this
    // build is ever moved back off Turbopack, re-measure the .nft.json before
    // trusting this pair.
    '/cms/yoy-sheet': [
      './public/data/daily/**',
      './public/data/petrobangla/daily/**',
      './public/data/petrobangla/_index.json',
    ],
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
      // Origin allowlist is the CSRF control for every server action. In
      // production only the deployed origins may invoke them; the localhost
      // entries are for the three-surface dev setup and must not be trusted by
      // the production build, or a page on localhost could drive a signed-in
      // visitor's server actions. Empty in prod means "same-origin only".
      allowedOrigins: isProd
        ? []
        : [
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
    // Pin host AND path. A bare `**.supabase.co` with no pathname turns
    // /_next/image into an open proxy: anyone could pass any Supabase project's
    // URL and bill this project's Vercel transformation quota.
    //
    // The `/storage/v1/render/image/public/**` pattern was removed on
    // 2026-09-06: Image Transformations are disabled on the project and that
    // endpoint answers 403, so nothing may construct such a URL. Allowlisting a
    // path nothing is permitted to use only invites it back.
    remotePatterns: [
      ...(supabaseImageHost
        ? ([
            {
              protocol: 'https' as const,
              hostname: supabaseImageHost,
              pathname: '/storage/v1/object/public/**',
            },
          ])
        : []),
      { protocol: 'https', hostname: 'esbpowerline.com' },
      { protocol: 'https', hostname: 'www.esbpowerline.com' },
      { protocol: 'https', hostname: '**.esbpowerline.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Only 80 is allowed, so the built-in default (75) snaps to it — every
    // <Image> is served at q80, matching the upload/import/Supabase pipeline.
    qualities: [80],
    // 2560 exists for retina desktops: the masthead banner (1480 CSS px) and the
    // article hero (1224 CSS px) both need >1920 at DPR 2, and without a larger
    // candidate they were being upscaled from 1920. Only those two request it —
    // everything else is gated below 1920 by its own `sizes`.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Stored media filenames are content-addressed (`${Date.now()}-${name}`) and
    // never mutate, so the 4h default just re-runs transforms for nothing.
    minimumCacheTTL: 31536000,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      // Long-lived caching for build output and static assets — production
      // only; see `immutableAsset`. Next warns about the /_next/static rule at
      // dev startup and the warning is exact: with stable dev chunk names, a
      // year of `immutable` means saved edits never reach the browser. It does
      // not present as a caching problem — a hard reload, a server restart,
      // deleting .next and a fresh tab all still served pre-edit chunks, so it
      // reads as code that simply does not run.
      ...immutableAsset('/_next/static/(.*)'),
      ...immutableAsset('/images/(.*)'),
      ...immutableAsset('/fonts/(.*)'),
      // No Cache-Control on the daily files here: middleware sets it per
      // request — shared-cacheable inside the public window, `private,
      // no-store` for a gated date — and a static rule would override that
      // with one answer for both. The gate itself runs before the edge cache.
      {
        source: '/data/daily/(.*)',
        headers: [
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
      // The WordPress-era URL scheme. Search Console (export of 2026-09-02)
      // still holds /YYYY/MM/DD/<slug>/, /posts/all/ and /category/<x> from
      // the old site, all answering 404 — 140 "Not found" pages in Coverage,
      // and 10% of Googlebot's requests. Article slugs were carried over
      // unchanged in the migration (verified against the database), so the
      // date-prefixed form maps 1:1 onto /articles/<slug>. Permanent, so the
      // history and any inbound links those URLs earned transfer.
      {
        source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
      // WordPress date archives with no slug — /2026/06/08/, /2026/04/ — are
      // listings of the news of that day or month. The nearest page here is
      // the news index; Search Console's "Not found (404)" list (read
      // 2026-09-19) still carries them. A slugged date URL is handled above.
      {
        source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})',
        destination: '/articles',
        permanent: true,
      },
      {
        source: '/:year(\\d{4})/:month(\\d{2})',
        destination: '/articles',
        permanent: true,
      },
      // WordPress minted `grid-transmission-2` when a second category took a
      // slug already used; the content is the one Grid & Transmission
      // category. Same Search Console list.
      {
        source: '/categories/grid-transmission-2',
        destination: '/categories/grid-transmission',
        permanent: true,
      },
      {
        source: '/posts/all',
        destination: '/articles',
        permanent: true,
      },
      {
        source: '/category/:slug',
        destination: '/categories/:slug',
        permanent: true,
      },
      // The feed lives at /feed.xml (app/feed.xml/route.ts); readers and the
      // old site's subscribers ask for the WordPress paths.
      { source: '/feed', destination: '/feed.xml', permanent: true },
      { source: '/rss.xml', destination: '/feed.xml', permanent: true },
      { source: '/rss', destination: '/feed.xml', permanent: true },
      // WordPress nested categories (/category/news/power-generation): the
      // leaf is the category. Tag and paginated-index URLs map directly.
      {
        source: '/category/:parent/:slug',
        destination: '/categories/:slug',
        permanent: true,
      },
      {
        source: '/tag/:tag',
        destination: '/tags/:tag',
        permanent: true,
      },
      // WordPress author archives. The old login slugs survive as the local
      // part of the e-mail the importer minted for each byline
      // (`scripts/import-esbpowerline-news.ts`: `${wpUser.slug}@esbpowerline.com`,
      // with `hamim` special-cased), so the three that carried published
      // stories map to real author pages. Until 2026-09-19 every /author/*
      // went to the news index — a redirect to a page about something else,
      // which Google treats as a soft 404 and which sent nobody where they
      // asked to go. Slugs with no evidence get no guess: they fall through to
      // the branded 404 like any other retired URL.
      { source: '/author/hamim', destination: '/authors/mehedi-hasan-hamim', permanent: true },
      { source: '/author/rasel', destination: '/authors/sheikh-rasel', permanent: true },
      { source: '/author/admin', destination: '/authors/esb-news-desk', permanent: true },
      { source: '/author/esb-news-desk', destination: '/authors/esb-news-desk', permanent: true },
      {
        source: '/page/:n(\\d+)',
        destination: '/articles?page=:n',
        permanent: true,
      },
      // Browsers and crawlers ask for these by convention regardless of the
      // <link> tags; all three were 404 in production (Stage 3). The app
      // router serves /icon.png, /apple-icon.png and /manifest.webmanifest.
      { source: '/favicon.ico', destination: '/icon.png', permanent: true },
      { source: '/apple-touch-icon.png', destination: '/apple-icon.png', permanent: true },
      { source: '/apple-touch-icon-precomposed.png', destination: '/apple-icon.png', permanent: true },
      { source: '/site.webmanifest', destination: '/manifest.webmanifest', permanent: true },
    ];
  },
};

export default nextConfig;

