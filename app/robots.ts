import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/cms',
          '/members',
          '/api',
          '/search',
          // The whole /data tree is referer-gated in middleware and 403s any
          // direct crawl — keeping only /data/daily/ out of robots left
          // /data/petrobangla/** crawlable, which is what GSC reports as
          // "Blocked due to other 4xx issue".
          '/data/',
          // Legacy auth paths that only ever 307 to the real login screens.
          '/login',
          '/auth/',
          '/sign-in',
          '/sign-up',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'PerplexityBot',
          'CohereBot',
          'Applebot',
          'Applebot-Extended',
          'Google-Extended',
          'Google-CloudVertexBot',
          'FacebookBot',
          'Meta-ExternalAgent',
          'Omgilibot',
          'Omgili',
          'CCBot',
          'Anthropic-AI',
          'Claude-Web',
          'Bytespider',
          'Diffbot',
          'AhrefsBot',
          'SemrushBot',
          'MJ12bot',
          'Dotbot',
          'Baiduspider',
          'YandexBot',
          'Amazonbot',
          'OAI-SearchBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

