import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { mediaThumbnailUrl, MEDIA_THUMB_WIDTH } from '@/lib/media-thumbnail';
import { normalizeArticleImageUrl } from '@/lib/article-image';

const BASE = 'https://sxgokpmrbgdndstygapc.supabase.co';
const ORIGINAL = `${BASE}/storage/v1/object/public/media/library/1788009566160-photo.webp`;

describe('mediaThumbnailUrl', () => {
  const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = BASE;
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
  });

  it('never asks Supabase to transform, because transformations are disabled', () => {
    // This assertion is the inverse of what it used to be, and deliberately so.
    // The endpoint it used to require now answers 403 FeatureNotEnabled, which
    // made every thumbnail in every CMS grid a broken image. Serving the object
    // is safe: uploads are normalised to WebP q80 at 2560px on the way in, so
    // the library is 16 MB across 168 objects.
    const url = mediaThumbnailUrl(ORIGINAL, MEDIA_THUMB_WIDTH)!;
    expect(url).not.toContain('/render/image/');
    expect(url).toContain('/object/public/');
  });

  it('keeps the object path intact, including the timestamp prefix', () => {
    expect(mediaThumbnailUrl(ORIGINAL, 320)).toContain('library/1788009566160-photo.webp');
  });

  it('strips transform parameters left on an older stored URL', () => {
    // Some rows were saved with the transform query already baked in.
    const withQuery = `${ORIGINAL}?width=1200&format=webp`;
    const url = mediaThumbnailUrl(withQuery, 320)!;
    expect(url).not.toContain('?');
    expect(url).toBe(ORIGINAL);
  });

  it('leaves a local development path alone', () => {
    expect(mediaThumbnailUrl('/uploads/library/photo.jpg', 320)).toBe('/uploads/library/photo.jpg');
  });

  it('leaves a foreign host alone rather than rewriting it', () => {
    const external = 'https://images.example.com/a.jpg';
    expect(mediaThumbnailUrl(external, 320)).toBe(external);
  });

  it('returns null for nothing', () => {
    expect(mediaThumbnailUrl(null, 320)).toBeNull();
    expect(mediaThumbnailUrl('   ', 320)).toBeNull();
  });

  it('passes the original through when Supabase is not configured', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(mediaThumbnailUrl(ORIGINAL, 320)).toBe(ORIGINAL);
  });

  it('asks every grid for the same width', () => {
    // Retained: if transformations are ever re-enabled, three grids requesting
    // three widths would mean three derivatives per object rather than one.
    expect(MEDIA_THUMB_WIDTH).toBe(320);
  });
});

describe('nothing constructs a Supabase transform URL any more', () => {
  // Transformations are disabled on the project; /storage/v1/render/image/
  // answers 403 FeatureNotEnabled. Two modules used to build these URLs and
  // between them broke every thumbnail in the CMS. This fails if either comes
  // back, or if a third joins them.
  const FILES = ['lib/media-thumbnail.ts', 'lib/article-image.ts', 'next.config.ts'];

  for (const f of FILES) {
    it(`${f} contains no live render/image URL`, () => {
      const src = readFileSync(path.join(process.cwd(), f), 'utf8');
      const code = src
        .split(/\r?\n/)
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .join('\n');
      expect(code).not.toContain('/storage/v1/render/image/');
      expect(code).not.toContain('render/image/public');
    });
  }

  it('article-image maps a legacy /uploads/ path to an object URL', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = BASE;
    const url = normalizeArticleImageUrl('/uploads/photo.webp')!;
    expect(url).toContain('/storage/v1/object/public/media/library/photo.webp');
    expect(url).not.toContain('render/image');
    expect(url).not.toContain('width=');
  });

  it('article-image keeps category icons in their own folder', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = BASE;
    const url = normalizeArticleImageUrl('/uploads/categories/icon.webp')!;
    expect(url).toContain('/storage/v1/object/public/media/icon.webp');
    expect(url).not.toContain('render/image');
  });
});
