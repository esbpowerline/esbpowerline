import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { normalizeRasterImage } from '@/lib/media-storage';

// Uploads used to be stored byte-for-byte: a 12 MP phone photo became a multi-MB
// original served to every reader — the root cause of the egress blowout. These
// tests pin the normalisation contract: capped, WebP, orientation baked, and an
// undecodable "image" refused rather than stored.

const makePng = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 30, b: 60 } } })
    .png()
    .toBuffer();

describe('normalizeRasterImage', () => {
  it('caps a large image at 2560 on the longest edge and stores WebP', async () => {
    const big = await makePng(4000, 3000);
    const out = await normalizeRasterImage({ buffer: big, fileName: 'photo.png', mimeType: 'image/png' });

    expect(out.mimeType).toBe('image/webp');
    expect(out.fileName).toBe('photo.webp');
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(2560);
    expect(meta.height).toBe(1920);
    expect(out.buffer.byteLength).toBeLessThan(big.byteLength);
  });

  it('never enlarges a small image', async () => {
    const small = await makePng(320, 200);
    const out = await normalizeRasterImage({ buffer: small, fileName: 'icon.png', mimeType: 'image/png' });
    const meta = await sharp(out.buffer).metadata();
    expect(meta.width).toBe(320);
    expect(meta.height).toBe(200);
  });

  it('bakes EXIF orientation into the pixels before metadata is stripped', async () => {
    // Orientation 6 = rotate 90° CW to display. A stripper that drops the tag
    // without rotating serves every portrait phone photo sideways.
    const landscape = await sharp({
      create: { width: 400, height: 200, channels: 3, background: { r: 10, g: 10, b: 10 } },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const out = await normalizeRasterImage({ buffer: landscape, fileName: 'p.jpg', mimeType: 'image/jpeg' });
    const meta = await sharp(out.buffer).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(400);
    expect(meta.orientation).toBeUndefined();
  });

  it('passes SVG and GIF through untouched', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
    const out = await normalizeRasterImage({ buffer: svg, fileName: 'v.svg', mimeType: 'image/svg+xml' });
    expect(out.buffer).toBe(svg);
    expect(out.fileName).toBe('v.svg');
    expect(out.mimeType).toBe('image/svg+xml');
  });

  it('refuses a file that claims to be an image but cannot be decoded', async () => {
    const junk = Buffer.from('not an image at all');
    await expect(
      normalizeRasterImage({ buffer: junk, fileName: 'x.jpg', mimeType: 'image/jpeg' }),
    ).rejects.toThrow(/could not be decoded/);
  });
});
