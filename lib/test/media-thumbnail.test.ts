import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mediaThumbnailUrl, MEDIA_THUMB_WIDTH } from '@/lib/media-thumbnail';

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

  it('never points a thumbnail at the full original', () => {
    // The whole defect: a ~200px card requesting the stored object, which is
    // whatever came off someone's phone, because uploads are not resized.
    const url = mediaThumbnailUrl(ORIGINAL, MEDIA_THUMB_WIDTH)!;
    expect(url).not.toContain('/object/public/');
    expect(url).toContain('/render/image/public/');
    expect(url).toContain(`width=${MEDIA_THUMB_WIDTH}`);
    expect(url).toContain('format=webp');
  });

  it('keeps the object path intact, including the timestamp prefix', () => {
    expect(mediaThumbnailUrl(ORIGINAL, 320)).toContain('library/1788009566160-photo.webp');
  });

  it('does not stack a second query onto a URL that already has one', () => {
    const withQuery = `${ORIGINAL}?width=1200&format=webp`;
    const url = mediaThumbnailUrl(withQuery, 320)!;
    expect(url.match(/\?/g)).toHaveLength(1);
    expect(url).toContain('width=320');
    expect(url).not.toContain('width=1200');
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

  it('asks every grid for the same derivative width', () => {
    // Three grids render the same library. Different widths would mean three
    // transformations per object instead of one shared cache entry.
    expect(MEDIA_THUMB_WIDTH).toBe(320);
  });
});
