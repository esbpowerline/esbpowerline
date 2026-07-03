import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpower.com';
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
          '/data/daily/',
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
          'Google-Extended',
          'FacebookBot',
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
        ],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
