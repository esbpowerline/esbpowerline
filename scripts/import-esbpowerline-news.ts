/**
 * Import the latest articles from esbpowerline.com (WordPress REST API)
 * into the Prisma database with full scale multilingual support, WebP conversion,
 * keyword-based energy filtering, automatic author profiles, and CMS integration.
 *
 * Usage (development dry-run):
 *   cross-env PRISMA_SCHEMA_PROVIDER=sqlite DATABASE_URL=file:./dev.db DRY_RUN=true LIMIT=5 npx tsx --conditions react-server scripts/import-esbpowerline-news.ts
 *
 * Usage (development batch run):
 *   cross-env PRISMA_SCHEMA_PROVIDER=sqlite DATABASE_URL=file:./dev.db LIMIT=5 npx tsx --conditions react-server scripts/import-esbpowerline-news.ts
 *
 * Usage (production):
 *   ALLOW_PRODUCTION_SEED=true cross-env PRISMA_SCHEMA_PROVIDER=postgresql npx tsx --conditions react-server scripts/import-esbpowerline-news.ts
 */

import { config, parse } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import type { PrismaClient } from '@prisma/client';
import { CATEGORIES, CATEGORY_DETAILS } from '../lib/constants';
import { EDITOR_EMAIL, EDITOR_NAME } from '../lib/staff-accounts';
import { slugify } from '../lib/utils';
import path from 'path';
import sharp from 'sharp';
import { uploadMediaBuffer } from '../lib/media-storage';
import { registerArticleMedia } from '../lib/media-registry-core';

/** Preserve npm/cross-env targets — .env.production.local can contain empty placeholders. */
const cliDatabaseUrl = process.env.DATABASE_URL?.trim() || '';

config({ path: '.env' });
if (existsSync('.env.local')) config({ path: '.env.local', override: true });
if (existsSync('.env.production.local')) {
  config({ path: '.env.production.local', override: true });
}
if (cliDatabaseUrl) process.env.DATABASE_URL = cliDatabaseUrl;

function toPostgresqlUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return '';
  return value.replace(/^postgres:\/\//, 'postgresql://');
}

function readEnvValue(file: string, key: string): string {
  if (!existsSync(file)) return '';
  try {
    return parse(readFileSync(file))[key]?.trim() ?? '';
  } catch {
    return '';
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = toPostgresqlUrl(
    readEnvValue('.env.production.local', 'DATABASE_URL') ||
      readEnvValue('.env.production.local', 'POSTGRES_PRISMA_URL') ||
      process.env.POSTGRES_PRISMA_URL ||
      readEnvValue('.env.local', 'DATABASE_URL') ||
      readEnvValue('.env.local', 'POSTGRES_PRISMA_URL') ||
      readEnvValue('.env', 'DATABASE_URL') ||
      readEnvValue('.env', 'POSTGRES_PRISMA_URL'),
  );
}
if (!process.env.DIRECT_URL?.trim()) {
  process.env.DIRECT_URL = toPostgresqlUrl(
    readEnvValue('.env.production.local', 'DIRECT_URL') ||
      readEnvValue('.env.production.local', 'POSTGRES_URL_NON_POOLING') ||
      process.env.POSTGRES_URL_NON_POOLING ||
      readEnvValue('.env.local', 'DIRECT_URL') ||
      readEnvValue('.env.local', 'POSTGRES_URL_NON_POOLING') ||
      readEnvValue('.env', 'DIRECT_URL') ||
      readEnvValue('.env', 'POSTGRES_URL_NON_POOLING'),
  );
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('❌ DATABASE_URL is not set. Please configure your PostgreSQL connection string in .env or .env.local.');
  process.exit(1);
}

const WP_BASE = 'https://esbpowerline.com/wp-json/wp/v2';
const limitVal = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : undefined;
const dryRun = process.env.DRY_RUN === 'true';

if (dryRun) {
  console.log('⚠️ RUNNING IN DRY-RUN MODE — NO WRITES TO DATABASE OR STORAGE UPLOADS.');
}

/** WordPress category slug → app category name */
const WP_CATEGORY_MAP: Record<string, (typeof CATEGORIES)[number]> = {
  'power-generation': 'Power Generation',
  'renewable-energy': 'Renewables & Nuclear',
  'renewable-energy-focus': 'Renewables & Nuclear',
  'nuclear-energy': 'Renewables & Nuclear',
  'energy-storage': 'Renewables & Nuclear',
  lng: 'Fossil Fuels & Commodities',
  'oil-gas': 'Fossil Fuels & Commodities',
  transmission: 'Grid & Transmission',
  'smart-grid': 'Grid & Transmission',
  distribution: 'Distribution & Utilities',
  policy: 'Energy Policy & Regulators',
  'data-reports': 'Consumers & Tariffs',
  'finance-investment': 'Market, Finance & Subsidies',
  'market-investment-updates': 'Market, Finance & Subsidies',
  'global-energy-update': 'International & Cross-Border',
  'industry-news': 'Power Generation',
  'industry-insights': 'Power Generation',
  'energy-efficiency': 'Environment & Efficiency',
  projects: 'Power Generation',
  news: 'Power Generation',
  uncategorized: 'Power Generation',
  // Bengali "Electricity & Energy" slugs (URL-encoded and decoded)
  '%e0%a6%ac%e0%a6%bf%e0%a6%a6%e0%a7%8d%e0%a6%af%e0%a7%81%e0%a7%8e-%e0%a6%93-%e0%a6%9c%e0%a7%8d%e0%a6%ac%e0%a6%be%e0%a6%b2%e0%a6%be%e0%a6%a8%e0%a6%bf':
    'Consumers & Tariffs',
  'বিদ্যুৎ-ও-জ্বালানি': 'Consumers & Tariffs',
};

/** Prefer editorial categories over generic labels when a post has multiple WP cats */
const WP_CATEGORY_PRIORITY: Record<string, number> = {
  'data-reports': 10,
  'consumers-tariffs': 10,
  lng: 9,
  'oil-gas': 9,
  'renewable-energy': 9,
  'power-generation': 8,
  policy: 8,
  'smart-grid': 7,
  transmission: 7,
  'global-energy-update': 6,
  'energy-efficiency': 6,
  'industry-news': 2,
  news: 1,
  uncategorized: 0,
};

type WpPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
  featured_media: number;
  author: number;
};

type WpCategory = { id: number; slug: string; name: string };
type WpMedia = { source_url: string };

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function sanitizeContent(html: string): string {
  return html
    .replace(/<div[^>]*sharethis[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/\sdata-path-to-node="[^"]*"/gi, '')
    .replace(/\sdata-index-in-node="[^"]*"/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();
}

/** Pull the first real editorial image from post HTML (WordPress uploads). */
function extractContentImage(html: string): string | null {
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of matches) {
    const src = match[1]?.trim();
    if (!src) continue;
    if (src.includes('wp-content/uploads')) return src;
    if (src.startsWith('https://esbpowerline.com/')) return src;
  }
  return null;
}

function isDemoImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const u = url.trim().toLowerCase();
  return (
    u.startsWith('/images/') ||
    u.includes('/images/download') ||
    u.includes('placeholder') ||
    u.includes('demo_') ||
    u.includes('unsplash.com') ||
    u.includes('placehold')
  );
}

function normalizeSlug(raw: string): string {
  try {
    const decoded = decodeURIComponent(raw);
    const ascii = slugify(decoded);
    if (ascii.length >= 3) return ascii;
    return decoded.toLowerCase().replace(/\s+/g, '-');
  } catch {
    return slugify(raw);
  }
}

function estimateReadTime(content: string): number {
  const words = stripTags(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

async function fetchAllWpPosts(limit?: number): Promise<WpPost[]> {
  let page = 1;
  const allPosts: WpPost[] = [];
  console.log('📰 Fetching posts page-by-page from WordPress API...');
  
  while (true) {
    const perPage = limit && limit < 100 ? limit : 100;
    const url = `${WP_BASE}/posts?per_page=${perPage}&page=${page}&orderby=date&order=desc&_embed=0`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        if (res.status === 400) {
          // Out of pages
          break;
        }
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      const posts = await res.json() as WpPost[];
      if (!Array.isArray(posts) || posts.length === 0) break;
      allPosts.push(...posts);
      console.log(`  ✓ Fetched page ${page} (${posts.length} posts, total: ${allPosts.length})`);
      if (limit && allPosts.length >= limit) {
        allPosts.splice(limit);
        break;
      }
      page++;
      // Wait to respect rate-limits
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (err: any) {
      console.warn(`  ⚠️ Stopped fetching at page ${page} due to:`, err.message);
      break;
    }
  }
  return allPosts;
}

async function fetchWpCategories(): Promise<Map<number, WpCategory>> {
  const cats = await fetchJson<WpCategory[]>(`${WP_BASE}/categories?per_page=100`);
  return new Map(cats.map((c) => [c.id, c]));
}

async function fetchFeaturedImage(mediaId: number): Promise<string | null> {
  if (!mediaId) return null;
  try {
    const media = await fetchJson<WpMedia>(`${WP_BASE}/media/${mediaId}`);
    return media.source_url || null;
  } catch {
    return null;
  }
}

function resolveAppCategory(
  wpCategoryIds: number[],
  wpCatById: Map<number, WpCategory>,
): (typeof CATEGORIES)[number] {
  const candidates = wpCategoryIds
    .map((id) => wpCatById.get(id))
    .filter((c): c is WpCategory => Boolean(c))
    .map((c) => ({
      slug: c.slug,
      app: WP_CATEGORY_MAP[c.slug] ?? WP_CATEGORY_MAP[decodeURIComponent(c.slug)],
      priority: WP_CATEGORY_PRIORITY[c.slug] ?? 5,
    }))
    .filter((c) => c.app);

  if (candidates.length === 0) return 'Power Generation';

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0].app;
}

function getEnergyScore(title: string, content: string): number {
  const t = title.toLowerCase();
  const c = content.toLowerCase();

  const enKeywords = [
    'power', 'electricity', 'energy', 'grid', 'gas', 'lng', 'utility', 'utilities',
    'transmission', 'distribution', 'renewable', 'renewables', 'nuclear', 'solar', 'wind', 'coal',
    'fuel', 'fuels', 'fossil', 'tariff', 'subsidies', 'petrobangla', 'bpdb', 'pgcb', 'berc',
    'bapex', 'generation', 'petroleum', 'oil', 'biomass', 'hydro', 'reactor', 'tariff',
    'megawatt', 'mw', 'powerplant', 'powerline', 'energy-storage', 'power-generation'
  ];

  const bnKeywords = [
    'বিদ্যুৎ', 'জ্বালানি', 'গ্রিড', 'গ্যাস', 'এলএনজি', 'কয়লা', 'তেল', 'পেট্রোবাংলা',
    'বিপিডিবি', 'সোলার', 'পারমাণবিক', 'নবায়নযোগ্য', 'ট্যারিফ', 'দাম বৃদ্ধি', 'রিয়্যাক্টর',
    'বিদ্যুৎকেন্দ্র', 'পাওয়ারলাইন', 'মেগাওয়াট'
  ];

  let score = 0;

  // Title check
  for (const kw of enKeywords) {
    if (t.includes(kw)) score += 5;
  }
  for (const kw of bnKeywords) {
    if (t.includes(kw)) score += 5;
  }

  // Content check
  for (const kw of enKeywords) {
    const matches = c.match(new RegExp(escapeRegExp(kw), 'gi'));
    if (matches) score += matches.length;
  }
  for (const kw of bnKeywords) {
    const matches = c.match(new RegExp(escapeRegExp(kw), 'gi'));
    if (matches) score += matches.length;
  }

  return score;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureCategories(prisma: PrismaClient) {
  const existing = await prisma.category.findMany();
  const byName = new Map(existing.map((c) => [c.name, c]));

  for (const [idx, name] of CATEGORIES.entries()) {
    if (byName.has(name)) continue;
    const meta = CATEGORY_DETAILS[name];
    const created = await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
        description: meta.description,
        color: meta.color,
        icon: meta.icon,
        order: idx,
      },
    });
    byName.set(name, created);
  }

  return Object.fromEntries([...byName.entries()].map(([name, cat]) => [name, cat.id]));
}

async function ensureEditor(prisma: PrismaClient) {
  const existing = await prisma.user.findUnique({ where: { email: EDITOR_EMAIL } });
  if (existing) {
    if (existing.name !== EDITOR_NAME) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: EDITOR_NAME, bio: 'Senior Energy Correspondent — ESB PowerLine' },
      });
      console.log(`✓ Updated editor name → ${EDITOR_NAME}`);
    }
    return existing.id;
  }

  const bcrypt = await import('bcryptjs');
  const { seedPasswordForEmail } = await import('../lib/seed-credentials');
  const editorPassword = seedPasswordForEmail(EDITOR_EMAIL);
  if (!editorPassword) {
    throw new Error('Editor seed password not configured (EDITOR_PASSWORD or dev default).');
  }
  const passwordHash = await bcrypt.hash(editorPassword, 10);

  const editor = await prisma.user.create({
    data: {
      name: EDITOR_NAME,
      email: EDITOR_EMAIL,
      passwordHash,
      role: 'EDITOR',
      status: 'ACTIVE',
      bio: 'Senior Energy Correspondent — ESB PowerLine',
    },
  });
  console.log(`✓ Created editor account (${EDITOR_EMAIL})`);
  return editor.id;
}

async function purgeDemoArticles(prisma: PrismaClient) {
  const demoArticles = await prisma.article.findMany({
    where: {
      OR: [
        { imageUrl: { startsWith: '/images/' } },
        { imageUrl: { startsWith: '/uploads/' } },
        { imageUrl: null },
      ],
    },
    select: { id: true },
  });

  const articleIds = demoArticles.map((a) => a.id);
  if (articleIds.length === 0) {
    console.log('✓ No demo articles to remove');
    return 0;
  }

  await prisma.editorialNotice.deleteMany({ where: { articleId: { in: articleIds } } });
  await prisma.revision.deleteMany({ where: { articleId: { in: articleIds } } });
  await prisma.comment.deleteMany({ where: { articleId: { in: articleIds } } });
  await prisma.articleHistory.deleteMany({ where: { articleId: { in: articleIds } } });
  await prisma.bookmark.deleteMany({ where: { articleId: { in: articleIds } } });
  const deleted = await prisma.article.deleteMany({ where: { id: { in: articleIds } } });
  console.log(`✓ Removed ${deleted.count} demo/fake article(s)`);
  return deleted.count;
}

function isBreakingNews(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes('breaking') ||
    t.includes('tariff') ||
    t.includes('price hike') ||
    t.includes('prices hiked') ||
    t.includes('lng carg')
  );
}

const authorCache = new Map<number, string>();

async function getOrCreateAuthor(prisma: PrismaClient, wpAuthorId: number, dryRun: boolean, defaultEditorId: string): Promise<string> {
  if (authorCache.has(wpAuthorId)) {
    return authorCache.get(wpAuthorId)!;
  }

  try {
    const wpUser = await fetchJson<any>(`${WP_BASE}/users/${wpAuthorId}`);
    let name = wpUser.name || 'Unknown Author';
    const slug = wpUser.slug || `author-${wpAuthorId}`;
    if (
      name.toLowerCase() === 'esb news desk' ||
      slug === 'esb-news-desk' ||
      name === 'ইএসবি নিউজ ডেস্ক' ||
      name === 'ইএসব' ||
      slug === 'admin'
    ) {
      name = 'ESB NEWS DESK';
    }
    if (name === 'Rasel Sheikh' || slug === 'rasel') {
      name = 'Sheikh Rasel';
    }
    let email = `${slug}@esbpowerline.com`;
    if (slug === 'hamim') {
      email = 'hamim2964@gmail.com';
    }
    const avatar = wpUser.avatar_urls?.['96'] || wpUser.avatar_urls?.['48'] || null;
    const bio = wpUser.description || 'Contributor — ESB PowerLine';

    if (dryRun) {
      console.log(`  [DryRun] Would ensure author profile: ${name} (${email})`);
      return `dry-run-author-${wpAuthorId}`;
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(`editor-fallback-${slug}`, 10);
      user = await prisma.user.create({
        data: {
          name,
          email,
          avatar,
          bio,
          passwordHash,
          role: email === 'admin@esbpowerline.com' ? 'SUPER_ADMIN' : 'EDITOR',
          status: 'ACTIVE',
        },
      });
      console.log(`  ✓ Created new EDITOR profile: ${name} (${email})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          avatar: avatar || user.avatar,
          bio: bio || user.bio,
          role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EDITOR',
          status: 'ACTIVE',
        },
      });
    }

    authorCache.set(wpAuthorId, user.id);
    return user.id;
  } catch (err: any) {
    console.warn(`  ⚠️ Failed to fetch author ${wpAuthorId} from WP API: ${err.message}. Using default editor.`);
    return defaultEditorId;
  }
}

async function downloadAndProcessImage(url: string, fallbackTitle: string, dryRun: boolean): Promise<string | null> {
  if (!url?.trim()) return null;
  const targetUrl = url.trim();

  if (dryRun) {
    console.log(`  [DryRun] Would convert WebP and upload: ${targetUrl}`);
    return targetUrl;
  }

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert image buffer to WebP via sharp. q100 since 2026-10-04 to match
    // the upload path in lib/media-storage.ts — an imported image is a stored
    // master like any other and is never re-encoded from.
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 100 })
      .toBuffer();

    let fileName = path.basename(new URL(targetUrl).pathname);
    if (!fileName || fileName === '/' || !fileName.includes('.')) {
      fileName = `${slugify(fallbackTitle)}.jpg`;
    }
    const webpFileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";

    const uploadResult = await uploadMediaBuffer({
      buffer: webpBuffer,
      fileName: webpFileName,
      mimeType: 'image/webp',
      folder: 'library',
    });

    return uploadResult.url;
  } catch (err: any) {
    console.warn(`  ⚠️ Image processing failed for ${targetUrl}:`, err.message);
    return null;
  }
}

async function processContentImages(content: string, fallbackTitle: string, dryRun: boolean): Promise<string> {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let matches;
  const imageUrls: string[] = [];
  while ((matches = imgRegex.exec(content)) !== null) {
    const src = matches[1]?.trim();
    if (src && !imageUrls.includes(src)) {
      imageUrls.push(src);
    }
  }

  let updatedContent = content;
  for (const src of imageUrls) {
    if (src.includes('uploads/') || src.includes('supabase.co')) continue;
    const newUrl = await downloadAndProcessImage(src, fallbackTitle, dryRun);
    if (newUrl) {
      updatedContent = updatedContent.split(src).join(newUrl);
    }
  }
  return updatedContent;
}

async function importArticles(
  prisma: PrismaClient,
  posts: WpPost[],
  wpCatById: Map<number, WpCategory>,
  categoryIdByName: Record<string, string>,
  defaultEditorId: string,
) {
  let imported = 0;
  let skipped = 0;

  for (const [index, post] of posts.entries()) {
    const title = stripTags(post.title.rendered);
    const slug = normalizeSlug(post.slug);
    const excerpt = stripTags(post.excerpt.rendered).slice(0, 500) || null;
    const rawContent = post.content.rendered;
    const contentTextOnly = stripTags(rawContent);

    // 1. Scoring & power-only filtering
    const score = getEnergyScore(title, contentTextOnly);
    if (score < 5) {
      console.log(`  🛑 Skipped off-topic post [Score: ${score}]: "${title.slice(0, 60)}…"`);
      skipped += 1;
      continue;
    }

    // 2. Multilingual locale classification
    const isBengali = /[\u0980-\u09FF]/.test(title) || /[\u0980-\u09FF]/.test(contentTextOnly);
    const locale = isBengali ? 'bn' : 'en';

    console.log(`  ⚙️ Processing [locale: ${locale}, score: ${score}]: "${title.slice(0, 60)}…"`);

    // 3. Resolve category
    const categoryName = resolveAppCategory(post.categories, wpCatById);
    const categoryId = categoryIdByName[categoryName];

    // 4. Retrieve or create Author profile from API
    const finalAuthorId = await getOrCreateAuthor(prisma, post.author, dryRun, defaultEditorId);

    let imageUrl: string | null = null;
    let processedContent = rawContent;

    const existingArticle = !dryRun ? await prisma.article.findUnique({
      where: { slug },
      select: { imageUrl: true, content: true }
    }) : null;

    if (existingArticle && existingArticle.imageUrl?.startsWith('https://')) {
      imageUrl = existingArticle.imageUrl;
      processedContent = existingArticle.content;
      console.log(`  ⚡ Reusing existing processed image and content for: "${title.slice(0, 60)}…"`);
    } else {
      // 5. Image pipeline (Featured / Cover Image)
      imageUrl = await fetchFeaturedImage(post.featured_media);
      if (isDemoImage(imageUrl)) {
        imageUrl = extractContentImage(rawContent);
      }
      if (imageUrl && !isDemoImage(imageUrl)) {
        const newFeaturedUrl = await downloadAndProcessImage(imageUrl, title, dryRun);
        if (newFeaturedUrl) {
          imageUrl = newFeaturedUrl;
        }
      }

      // 6. Image pipeline (Inline body images)
      processedContent = await processContentImages(sanitizeContent(rawContent), title, dryRun);
    }

    const publishedAt = new Date(post.date);
    const importedAt = new Date();
    const readTime = estimateReadTime(processedContent);

    const isFeatured = index < 3;
    const isBreaking = isBreakingNews(title) && index < 5;

    if (dryRun) {
      console.log(`  [DryRun] Would upsert article: "${title}" (locale: ${locale}, category: ${categoryName}, author: ${finalAuthorId})`);
      imported += 1;
      continue;
    }

    // 7. Transaction safety: execute atomic upsert + initial revision + media registration
    await prisma.$transaction(async (tx) => {
      const article = await tx.article.upsert({
        where: { slug },
        create: {
          title,
          slug,
          excerpt,
          content: processedContent,
          authorId: finalAuthorId,
          publishedAt,
          status: 'PUBLISHED',
          category: categoryName,
          categoryId,
          imageUrl,
          readTime,
          isFeatured,
          isBreaking,
          locale,
          views: 0,
          likes: 0,
          createdAt: importedAt,
          updatedAt: importedAt,
        },
        update: {
          title,
          excerpt,
          content: processedContent,
          authorId: finalAuthorId,
          publishedAt,
          status: 'PUBLISHED',
          category: categoryName,
          categoryId,
          imageUrl,
          readTime,
          isFeatured,
          isBreaking,
          locale,
          updatedAt: importedAt,
        },
      });

      // Transaction: Create initial revision if none exist
      const existingRevCount = await tx.revision.count({
        where: { articleId: article.id },
      });
      if (existingRevCount === 0) {
        await tx.revision.create({
          data: {
            articleId: article.id,
            content: processedContent,
            userId: finalAuthorId,
            note: "Initial news crawl import from esbpowerline.com",
            createdAt: publishedAt,
          },
        });
      }

      // Transaction: Register cover and inline media inside CMS content library
      await registerArticleMedia(tx as any, {
        imageUrl,
        content: processedContent,
        uploadedById: finalAuthorId,
        title,
      });
    });

    imported += 1;
    console.log(`  ✓ [${imported}/${posts.length}] Saved article successfully`);
  }

  if (!dryRun) {
    // Post-import sync operations
    const { syncAuthorArticleCounts } = await import('../lib/author-stats-core');
    await syncAuthorArticleCounts(prisma, defaultEditorId);
    for (const cachedUserId of authorCache.values()) {
      await syncAuthorArticleCounts(prisma, cachedUserId);
    }
  }

  console.log(`\nImport statistics:`);
  console.log(`- Total Posts Checked: ${posts.length}`);
  console.log(`- Ingested Articles: ${imported}`);
  console.log(`- Skipped Off-Topic: ${skipped}`);

  return { imported, skipped };
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    console.error('❌ Set ALLOW_PRODUCTION_SEED=true to import on production.');
    process.exit(1);
  }

  const { createScriptPrismaClient } = await import('../prisma/client');
  const prisma = createScriptPrismaClient();

  console.log('📰 Upgrading and running news import pipeline from esbpowerline.com…\n');

  try {
    const [posts, wpCatById] = await Promise.all([
      fetchAllWpPosts(limitVal),
      fetchWpCategories()
    ]);
    console.log(`✓ Fetched ${posts.length} total posts and ${wpCatById.size} WP categories`);

    let categoryIdByName: Record<string, string> = {};
    let authorId = 'dry-run-author-id';

    if (!dryRun) {
      categoryIdByName = await ensureCategories(prisma);
      console.log('✓ Categories ready');
      authorId = await ensureEditor(prisma);
      await purgeDemoArticles(prisma);
      console.log('✓ Demo articles purged (clean baseline established)');
    }

    const { imported, skipped } = await importArticles(
      prisma,
      posts,
      wpCatById,
      categoryIdByName,
      authorId
    );

    if (!dryRun) {
      await prisma.auditLog.create({
        data: {
          type: 'import',
          message: `Imported ${imported} articles (skipped ${skipped} off-topic) from esbpowerline.com.`,
          timestamp: new Date(),
        },
      });
    }

    console.log(`\n✅ Pipeline finished. Ingested ${imported} live articles successfully.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});