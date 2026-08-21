import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { qrPng, exportLogo, buildBrand, footerNote } from '@/lib/data/grid/export-brand.server';
import { encodeQr } from '@/lib/qr/qr-code';

/**
 * The PNG is written by hand — zlib, two CRCs, no filtering — so it is checked
 * for structure here and decoded for real by the scratch harness.
 */
describe('the export mark and QR image', () => {
  it('finds a logo and reads its real dimensions', () => {
    const logo = exportLogo();
    expect(logo).not.toBeNull();
    expect(logo!.width).toBeGreaterThan(100);
    expect(logo!.height).toBeGreaterThan(50);
    expect(logo!.dataUri.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('writes a structurally valid PNG', () => {
    const png = qrPng('https://esbpowerline.com', 'M', 4, 4);
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.subarray(12, 16).toString('latin1')).toBe('IHDR');
    expect(png.subarray(png.length - 8, png.length - 4).toString('latin1')).toBe('IEND');
    // Square, and sized from the code itself plus the quiet zone: that URL is
    // 24 bytes, which is a version-2 code, not the version 1 a shorter string
    // would give.
    const qr = encodeQr('https://esbpowerline.com', 'M');
    const side = (qr.size + 8) * 4;
    expect(png.readUInt32BE(16)).toBe(side);
    expect(png.readUInt32BE(20)).toBe(side);
    if (process.env.QR_PNG_OUT) writeFileSync(process.env.QR_PNG_OUT, png);
  });

  it('builds a provenance block with all three calendars', () => {
    const brand = buildBrand('Year-on-year sheet', '19 Aug 2025 vs 19 Aug 2026', '/cms/yoy-sheet',
      new Date(Date.UTC(2026, 7, 21, 9)));
    expect(brand.kind).toBe('Year-on-year sheet');
    expect(brand.stamp.gregorian).toBe('21 August 2026, Friday');
    expect(brand.stampLines.length).toBeGreaterThanOrEqual(2);
    expect(footerNote(brand)).toContain('downloaded 21 August 2026, Friday');
  });

  it('leaves the link off rather than printing a relative one', () => {
    // A QR holding "/cms/..." is useless to a phone camera.
    const brand = buildBrand('x', 'y', null);
    expect(brand.link).toBeNull();
  });
});
