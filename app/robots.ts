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

