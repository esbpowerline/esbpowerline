'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { deleteStoredMedia } from '@/lib/media-storage';
import { statSync, existsSync } from 'fs';
import path from 'path';

async function requireAuth() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'media.upload')) throw new Error('Forbidden');
  return session.user;
}

/**
 * A media URL we are willing to write into an article. Either a relative
 * /uploads/ path, or an absolute URL on our own Supabase storage host — never an
 * arbitrary third-party origin.
 */
function isAllowedMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/uploads/')) return !trimmed.includes('..');
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const allowedHosts = new Set<string>();
    if (supabase) allowedHosts.add(new URL(supabase).hostname);
    allowedHosts.add('esbpowerline.com');
    allowedHosts.add('www.esbpowerline.com');
    return allowedHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Fill in a missing `size` for locally-stored media only.
 *
 * This used to resolve remote sizes too, and it was the single largest
 * consumer of the project's Supabase egress quota. For every row whose size
 * was null it issued a HEAD against the object, and if that carried no
 * `content-length` it followed with a **full GET and buffered the body**. It
 * ran under `Promise.all` across the entire library, on every render of
 * /cms/media and /admin/media, and it never converged: when the update at the
 * end failed - or when the fetch itself failed, which is exactly what happens
 * once the quota is spent - `size` stayed null and the whole library was
 * downloaded again on the next page view.
 *
 * A file's size is known for certain at the moment it is uploaded, which is
 * where it is now recorded (`uploadMediaBuffer`). Remote rows predating that
 * are backfilled by `scripts/backfill-media-sizes.ts`, run once, deliberately,
 * rather than as a side effect of looking at a page.
 */
/** How many media rows a library view loads at once. Each one becomes an image
 *  request from the browser, so this is an egress budget, not just a page size. */
export const MEDIA_PAGE_SIZE = 60;

async function backfillMissingMediaSizes(items: any[]) {
  for (const m of items) {
    if (m.size !== null && m.size > 0) continue;
    if (!m.url.startsWith('/')) continue;

    const localPath = `${process.cwd()}/public${m.url}`;
    if (!existsSync(localPath)) continue;

    try {
      const size = statSync(localPath).size;
      if (size > 0) {
        m.size = size;
        await prisma.media
          .update({ where: { id: m.id }, data: { size } })
          .catch((err) => console.error('Failed to save size to db:', err));
      }
    } catch (e) {
      console.error('Error getting local file size:', e);
    }
  }
}

/** Newest-first media rows. Bounded: the library grows without limit and every
 *  row rendered is an image the browser will request. */
export async function getMedia(limit = MEDIA_PAGE_SIZE) {
  await requireAuth();
  const items = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  await backfillMissingMediaSizes(items);
  return items;
}

export type MediaLibraryItem = {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType: string | null;
  size: number | null;
  altText: string | null;
  caption: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  uploadedByRole: string | null;
  createdAt: Date;
  usageCount: number;
  usedInTitles: string[];
  usedInArticles: {
    baseSlug: string;
    title: string;
    titleEn?: string;
    titleBn?: string;
    idEn?: string;
    idBn?: string;
    slugEn?: string;
    slugBn?: string;
    imageCredit?: string | null;
    seo?: any;
    isCover?: boolean;
    isBody?: boolean;
  }[];
  placementType: 'unused' | 'cover' | 'body' | 'both';
  canDelete: boolean;
};

function getNormalizedBase(url: string): string {
  let filename = url.split('/').pop()?.split('?')[0] || url;
  filename = filename.toLowerCase();
  const dotIndex = filename.lastIndexOf('.');
  let name = dotIndex > -1 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex > -1 ? filename.slice(dotIndex) : '';
  name = name.replace(/-\d+x\d+$/, '');
  name = name.replace(/-scaled$/, '');
  name = name.replace(/-\d+$/, '');
  return name + ext;
}

interface StoryUsage {
  baseSlug: string;
  title: string;
  titleEn?: string;
  titleBn?: string;
  idEn?: string;
  idBn?: string;
  slugEn?: string;
  slugBn?: string;
  imageCredit?: string | null;
  seo?: any;
  isCover?: boolean;
  isBody?: boolean;
}

async function getMediaUsageMap(): Promise<Map<string, Map<string, StoryUsage>>> {
  const articles = await prisma.article.findMany({
    where: {
      status: { not: 'TRASH' },
      editorTrash: false,
    },
    select: { id: true, slug: true, imageUrl: true, content: true, contentBn: true, title: true, imageCredit: true, seo: true, locale: true },
  });

  const usageMap = new Map<string, Map<string, StoryUsage>>();
  for (const article of articles) {
    const coverUrls = new Set<string>();
    if (article.imageUrl) {
      coverUrls.add(article.imageUrl);
    }
    const bodyUrls = new Set<string>();
    const content = article.content ?? '';
    if (content.includes('<img')) {
      const matches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
      for (const match of matches) {
        const src = match[1]?.trim();
        if (src) bodyUrls.add(src);
      }
    }
    const contentBn = article.contentBn ?? '';
    if (contentBn.includes('<img')) {
      const matches = contentBn.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
      for (const match of matches) {
        const src = match[1]?.trim();
        if (src) bodyUrls.add(src);
      }
    }

    const allUrls = new Set([...coverUrls, ...bodyUrls]);
    const baseSlug = article.slug.endsWith('-bn') ? article.slug.slice(0, -3) : article.slug;
    
    for (const url of allUrls) {
      const isCover = coverUrls.has(url);
      const isBody = bodyUrls.has(url);
      
      let imgEntry = usageMap.get(url);
      if (!imgEntry) {
        imgEntry = new Map<string, StoryUsage>();
        usageMap.set(url, imgEntry);
      }
      
      let story = imgEntry.get(baseSlug);
      if (!story) {
        story = {
          baseSlug,
          title: article.title,
          imageCredit: article.imageCredit,
          seo: article.seo,
          isCover,
          isBody,
        };
      } else {
        if (isCover) story.isCover = true;
        if (isBody) story.isBody = true;
      }
      
      if (article.locale === 'bn' || article.slug.endsWith('-bn')) {
        story.titleBn = article.title;
        story.idBn = article.id;
        story.slugBn = article.slug;
      } else {
        story.titleEn = article.title;
        story.idEn = article.id;
        story.slugEn = article.slug;
        story.title = article.title;
      }
      imgEntry.set(baseSlug, story);
    }
  }

  return usageMap;
}

export async function getMediaLibrary(): Promise<MediaLibraryItem[]> {
  const user = await requireAuth();

  const [items, usageMap, users] = await Promise.all([
    prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: MEDIA_PAGE_SIZE }),
    getMediaUsageMap(),
    prisma.user.findMany({
      select: { id: true, name: true, role: true },
    }),
  ]);

  await backfillMissingMediaSizes(items);

  const userMap = new Map<string, { name: string; role: string }>();
  for (const u of users) {
    if (u.name) userMap.set(u.id, { name: u.name, role: u.role });
  }

  const canDeleteAny = can(user.role, 'media.delete_any');
  const canDeleteOwn = can(user.role, 'media.delete_own');

  const mapped = items.map((m) => {
    const storiesMap = usageMap.get(m.url);
    const storiesList = storiesMap ? Array.from(storiesMap.values()) : [];
    const usageCount = storiesList.length;
    const ownsFile = m.uploadedById === user.id;
    const canDelete = usageCount === 0 && (canDeleteAny || (canDeleteOwn && ownsFile));

    let hasCover = false;
    let hasBody = false;
    for (const s of storiesList) {
      if (s.isCover) hasCover = true;
      if (s.isBody) hasBody = true;
    }

    let placementType: 'unused' | 'cover' | 'body' | 'both' = 'unused';
    if (hasCover && hasBody) placementType = 'both';
    else if (hasCover) placementType = 'cover';
    else if (hasBody) placementType = 'body';

    const uInfo = m.uploadedById ? userMap.get(m.uploadedById) : null;

    return {
      id: m.id,
      name: m.name,
      url: m.url,
      type: m.type,
      mimeType: m.mimeType,
      size: m.size,
      altText: m.altText,
      caption: m.caption,
      uploadedById: m.uploadedById,
      uploadedByName: uInfo ? (uInfo.name ?? 'Unknown') : 'System',
      uploadedByRole: uInfo ? (uInfo.role ?? null) : 'SYSTEM',
      createdAt: m.createdAt,
      usageCount,
      usedInTitles: storiesList.map(s => s.titleEn || s.title || ''),
      usedInArticles: storiesList,
      placementType,
      canDelete,
    };
  });

  return mapped;
}

export async function createMedia(data: {
  name: string;
  url: string;
  type: string;
  mimeType?: string;
  size?: number;
  altText?: string;
}) {
  const user = await requireAuth();
  const media = await prisma.media.create({
    data: { ...data, uploadedById: user.id },
  });
  revalidatePath('/cms/media');
  revalidatePath('/admin/media');
  return media;
}

export async function updateMedia(
  id: string,
  data: { name?: string; altText?: string; caption?: string },
) {
  const user = await requireAuth();
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error('File not found');

  const canEditAny = can(user.role, 'media.delete_any');
  const canEditOwn = media.uploadedById === user.id && can(user.role, 'media.delete_own');
  if (!canEditAny && !canEditOwn) throw new Error('You can only edit files you uploaded');

  const updated = await prisma.media.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() || media.name } : {}),
      ...(data.altText !== undefined ? { altText: data.altText.trim() || null } : {}),
      ...(data.caption !== undefined ? { caption: data.caption.trim() || null } : {}),
    },
  });

  revalidatePath('/cms/media');
  revalidatePath('/admin/media');
  return updated;
}

export async function deleteMedia(id: string) {
  const user = await requireAuth();
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error('File not found');

  const canDeleteAny = can(user.role, 'media.delete_any');
  const canDeleteOwn = media.uploadedById === user.id && can(user.role, 'media.delete_own');
  if (!canDeleteAny && !canDeleteOwn) throw new Error('You can only delete files you uploaded');

  // getMediaUsageMap keys by the full URL, so looking up a bare filename never
  // matched — usageCount was always 0 and this guard never fired. The UI's
  // canDelete flag was the only thing stopping an in-use image being deleted,
  // and that is client-side only.
  const usageMap = await getMediaUsageMap();
  const storiesMap = usageMap.get(media.url);
  const usageCount = storiesMap ? storiesMap.size : 0;

  if (usageCount > 0) {
    throw new Error(`In use by ${usageCount} article${usageCount === 1 ? '' : 's'} — remove from stories first`);
  }

  await prisma.media.delete({ where: { id } });
  await deleteStoredMedia(media.url).catch(() => undefined);
  revalidatePath('/cms/media');
  revalidatePath('/admin/media');
}

export async function replaceMediaAndFeaturedImage(
  mediaId: string,
  data: {
    name?: string;
    altText?: string;
    caption?: string;
    newUrl?: string;      // if a new file was uploaded
    newSize?: number;     // size of the new file
    newMimeType?: string; // mimeType of the new file
    imageCredit?: string;
    zoom?: number;
    fitMode?: string;
    filter?: string;
    panX?: number;
    panY?: number;
  }
) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'article.edit_own')) {
    throw new Error('Forbidden');
  }

  // 1. Get the current media record
  const media = await prisma.media.findUnique({
    where: { id: mediaId }
  });
  if (!media) throw new Error('Media not found');

  // This action rewrites the media row AND every article pointing at it. Gating
  // it on article.edit_own (the lowest staff level) with no ownership check let
  // a CONTRIBUTOR repoint the site's hero images and overwrite the seo blob of
  // articles they do not own. Require ownership of the media, or the explicit
  // right to edit other people's articles.
  const ownsMedia = media.uploadedById === session.user.id;
  const canEditAny = can(session.user.role, 'article.edit_any');
  if (!ownsMedia && !canEditAny) {
    throw new Error('You can only replace files you uploaded');
  }

  const oldUrl = media.url;
  const newUrl = data.newUrl || oldUrl;

  // A caller-supplied newUrl must stay inside our own storage — otherwise this
  // is an arbitrary-URL injection into every article using the image.
  if (data.newUrl && !isAllowedMediaUrl(data.newUrl)) {
    throw new Error('Replacement URL must point at this site’s media storage');
  }

  // 2. Update the media record itself
  await prisma.media.update({
    where: { id: mediaId },
    data: {
      name: data.name ?? media.name,
      url: newUrl,
      size: data.newSize ?? media.size,
      mimeType: data.newMimeType ?? media.mimeType,
      altText: data.altText !== undefined ? data.altText : undefined,
      caption: data.caption !== undefined ? data.caption : undefined,
    }
  });

  // 3. Find all articles using this media URL (both old and new URLs to be safe).
  //    Without article.edit_any, only the caller's own articles are touched —
  //    replacing your own upload must not rewrite someone else's published story.
  const articles = await prisma.article.findMany({
    where: {
      imageUrl: { in: [oldUrl, newUrl] },
      ...(canEditAny ? {} : { authorId: session.user.id }),
    }
  });

  // 4. Update each article
  await prisma.$transaction(
    articles.map((article) => {
      let seoObj: any = {};
      if (article.seo) {
        if (typeof article.seo === 'string') {
          try { seoObj = JSON.parse(article.seo); } catch (e) {}
        } else {
          seoObj = article.seo;
        }
      }

      seoObj.heroImage = seoObj.heroImage || {};
      
      if (data.zoom !== undefined) seoObj.heroImage.zoom = data.zoom;
      if (data.panX !== undefined) seoObj.heroImage.panX = data.panX;
      if (data.panY !== undefined) seoObj.heroImage.panY = data.panY;
      if (data.fitMode !== undefined) seoObj.heroImage.fitMode = data.fitMode;
      if (data.filter !== undefined) seoObj.heroImage.filter = data.filter;
      if (data.altText !== undefined) seoObj.heroImage.alt = data.altText;
      if (data.caption !== undefined) seoObj.heroImage.caption = data.caption;

      return prisma.article.update({
        where: { id: article.id },
        data: {
          imageUrl: newUrl,
          imageCredit: data.imageCredit !== undefined ? data.imageCredit : article.imageCredit,
          seo: seoObj,
        }
      });
    })
  );

  // 5. Create an audit log entry for this administrative activity
  await prisma.auditLog.create({
    data: {
      type: 'media.replace',
      message: `Replaced media/featured image details for media: ${media.name}`,
      userId: session.user.id,
      undoPayload: JSON.stringify({
        action: 'media.replace',
        articles: articles.map((a) => {
          let seoObj: any = {};
          if (a.seo) {
            if (typeof a.seo === 'string') {
              try { seoObj = JSON.parse(a.seo); } catch (e) {}
            } else {
              seoObj = a.seo;
            }
          }
          return {
            id: a.id,
            imageUrl: a.imageUrl,
            imageCredit: a.imageCredit,
            seo: seoObj
          };
        }),
        media: {
          id: media.id,
          name: media.name,
          url: media.url,
          size: media.size,
          mimeType: media.mimeType
        }
      })
    }
  });

  revalidatePath('/cms/media');
  revalidatePath('/admin/media');
  revalidatePath('/admin/articles');
  revalidatePath('/cms/articles');
  revalidatePath('/');
}