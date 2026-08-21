import { describe, it, expect } from 'vitest';
import { encodeQr, qrToSvgPath, type EcLevel } from '@/lib/qr/qr-code';

/**
 * The encoder, checked by decoding.
 *
 * An encoder tested against itself agrees with its own bugs, so the decoder
 * below is written from the standard rather than from the encoder: it reads the
 * format information, unmasks, walks the zig-zag, de-interleaves the blocks and
 * computes Reed-Solomon syndromes. All-zero syndromes mean the modules in the
 * matrix are exactly the codewords ISO/IEC 18004 says they should be — a
 * stronger statement than "a phone managed to read it".
 *
 * Two real defects were found this way, both of which scanners had been
 * papering over with error correction:
 *
 *   - the mandatory dark module at (8, size-8) was being cleared by the
 *     format-area reservation that ran after it;
 *   - the reservation tested `(i, 6)` while setting `(i, 8)`, so six modules of
 *     each format copy were never reserved, handed to the data placer, and then
 *     overwritten — twelve corrupt bits in every code ever produced.
 */

/* ── an independent decoder ──────────────────────────────────────────────── */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}
const gmul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

const BLOCKS: Record<EcLevel, Array<[number, number, number]>> = {
  L: [[7,1,0],[10,1,0],[15,1,0],[20,1,0],[26,1,0],[18,2,0],[20,2,0],[24,2,0],[30,2,0],[18,2,2],
      [20,4,0],[24,2,2],[26,4,0],[30,3,1],[22,5,1],[24,5,1],[28,1,5],[30,5,1],[28,3,4],[28,3,5]],
  M: [[10,1,0],[16,1,0],[26,1,0],[18,2,0],[24,2,0],[16,4,0],[18,4,0],[22,2,2],[22,3,2],[26,4,1],
      [30,1,4],[22,6,2],[22,8,1],[24,4,5],[24,5,5],[28,7,3],[28,10,1],[26,9,4],[26,3,11],[26,3,13]],
  Q: [[13,1,0],[22,1,0],[18,2,0],[26,2,0],[18,2,2],[24,4,0],[18,2,4],[22,4,2],[20,4,4],[24,6,2],
      [28,4,4],[26,4,6],[24,8,4],[20,11,5],[30,5,7],[24,15,2],[28,1,15],[28,17,1],[26,17,4],[30,15,5]],
  H: [[17,1,0],[28,1,0],[22,2,0],[16,4,0],[22,2,2],[28,4,0],[26,4,1],[26,4,2],[24,4,4],[28,6,2],
      [24,3,8],[28,7,4],[22,12,4],[24,11,5],[24,11,7],[30,3,13],[28,2,17],[28,2,19],[26,9,16],[28,15,10]],
};
const TOTAL = [26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085];
const ALIGN: number[][] = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],
  [6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],
  [6,30,56,82],[6,30,58,86],[6,34,62,90]];
const EC_BITS: Record<EcLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };
const MASKS: Array<(x: number, y: number) => boolean> = [
  (x,y)=>(x+y)%2===0,(_x,y)=>y%2===0,(x)=>x%3===0,(x,y)=>(x+y)%3===0,
  (x,y)=>(Math.floor(y/2)+Math.floor(x/3))%2===0,(x,y)=>((x*y)%2)+((x*y)%3)===0,
  (x,y)=>(((x*y)%2)+((x*y)%3))%2===0,(x,y)=>(((x+y)%2)+((x*y)%3))%2===0,
];

function functionMap(n: number, version: number): boolean[][] {
  const f = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const block = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y += 1)
      for (let x = x0; x < x0 + w; x += 1)
        if (x >= 0 && x < n && y >= 0 && y < n) f[y][x] = true;
  };
  block(0, 0, 9, 9);
  block(n - 8, 0, 8, 9);
  block(0, n - 8, 9, 8);
  for (let i = 0; i < n; i += 1) { f[6][i] = true; f[i][6] = true; }
  const cs = ALIGN[version - 1];
  for (const cy of cs)
    for (const cx of cs) {
      if ((cx <= 8 && cy <= 8) || (cx <= 8 && cy >= n - 9) || (cx >= n - 9 && cy <= 8)) continue;
      block(cx - 2, cy - 2, 5, 5);
    }
  if (version >= 7) { block(0, n - 11, 6, 3); block(n - 11, 0, 3, 6); }
  return f;
}

function readFormat(m: Uint8Array, n: number): { ec: EcLevel; mask: number } | null {
  const g = (x: number, y: number) => m[y * n + x];
  let bits = 0;
  for (let i = 0; i < 15; i += 1) {
    const v = i < 6 ? g(8, i) : i < 8 ? g(8, i + 1) : i === 8 ? g(7, 8) : g(14 - i, 8);
    bits |= v << i;
  }
  const bch = (d: number) => {
    let r = d;
    for (let i = 0; i < 10; i += 1) r = (r << 1) ^ ((r >>> 9) * 0x537);
    return (((d << 10) | r) ^ 0x5412) >>> 0;
  };
  for (const ec of ['L', 'M', 'Q', 'H'] as EcLevel[])
    for (let mask = 0; mask < 8; mask += 1)
      if (bch((EC_BITS[ec] << 3) | mask) === bits) return { ec, mask };
  return null;
}

/** Decode a matrix back to its text; throws when the codewords are corrupt. */
function decodeQr(qr: { size: number; modules: Uint8Array }): { text: string; ec: EcLevel; version: number } {
  const n = qr.size;
  const version = (n - 17) / 4;
  const fmt = readFormat(qr.modules, n);
  if (!fmt) throw new Error('format information does not decode');

  const fmap = functionMap(n, version);
  const grid = Uint8Array.from(qr.modules);
  for (let y = 0; y < n; y += 1)
    for (let x = 0; x < n; x += 1)
      if (!fmap[y][x] && MASKS[fmt.mask](x, y)) grid[y * n + x] ^= 1;

  const bits: number[] = [];
  let upward = true;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < n; step += 1) {
      const y = upward ? n - 1 - step : step;
      for (const x of [right, right - 1]) if (!fmap[y][x]) bits.push(grid[y * n + x]);
    }
    upward = !upward;
  }
  const cw: number[] = [];
  for (let i = 0; i < Math.floor(bits.length / 8); i += 1) {
    let b = 0;
    for (let j = 0; j < 8; j += 1) b = (b << 1) | bits[i * 8 + j];
    cw.push(b);
  }

  const [nec, g1, g2] = BLOCKS[fmt.ec][version - 1];
  const blocks = g1 + g2;
  const capacity = TOTAL[version - 1] - nec * blocks;
  const short = Math.floor(capacity / blocks);
  const lens = Array.from({ length: blocks }, (_, i) => (i < g1 ? short : short + 1));

  const dataBlocks: number[][] = Array.from({ length: blocks }, () => []);
  const ecBlocks: number[][] = Array.from({ length: blocks }, () => []);
  let idx = 0;
  for (let i = 0; i < Math.max(...lens); i += 1)
    for (let b = 0; b < blocks; b += 1) if (i < lens[b]) dataBlocks[b].push(cw[idx++]);
  for (let i = 0; i < nec; i += 1)
    for (let b = 0; b < blocks; b += 1) ecBlocks[b].push(cw[idx++]);

  // Syndromes: any non-zero means the matrix is not a valid codeword.
  for (let b = 0; b < blocks; b += 1) {
    const whole = [...dataBlocks[b], ...ecBlocks[b]];
    for (let i = 0; i < nec; i += 1) {
      let acc = 0;
      for (const c of whole) acc = gmul(acc, EXP[i]) ^ c;
      if (acc !== 0) throw new Error(`block ${b} has a non-zero Reed-Solomon syndrome`);
    }
  }

  const stream = dataBlocks.flat();
  const mode = stream[0] >> 4;
  if (mode !== 0b0100) throw new Error(`expected byte mode, got ${mode}`);
  const countBits = version < 10 ? 8 : 16;
  const all: number[] = [];
  for (const byte of stream) for (let i = 7; i >= 0; i -= 1) all.push((byte >>> i) & 1);
  let p = 4;
  let len = 0;
  for (let i = 0; i < countBits; i += 1) len = (len << 1) | all[p++];
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    let b = 0;
    for (let j = 0; j < 8; j += 1) b = (b << 1) | all[p++];
    bytes[i] = b;
  }
  return { text: new TextDecoder().decode(bytes), ec: fmt.ec, version };
}

/* ── the tests ───────────────────────────────────────────────────────────── */

const LEVELS: EcLevel[] = ['L', 'M', 'Q', 'H'];

describe('QR encoding', () => {
  it('round-trips a link at every error-correction level', () => {
    const url = 'https://esbpowerline.com/cms/yoy-sheet?mode=compare&a=2025-08-19&b=2026-08-19';
    for (const ec of LEVELS) {
      const back = decodeQr(encodeQr(url, ec));
      expect(back.text, ec).toBe(url);
      expect(back.ec, ec).toBe(ec);
    }
  });

  it('round-trips across every version it supports', () => {
    // Grow the payload until each version has been exercised at least once.
    for (const ec of LEVELS) {
      const seen = new Set<number>();
      for (let len = 1; len < 1400; len += 7) {
        const text = `https://esbpowerline.com/g?q=${'x'.repeat(len)}`;
        let qr;
        try {
          qr = encodeQr(text, ec);
        } catch {
          break;
        }
        const v = (qr.size - 17) / 4;
        if (seen.has(v)) continue;
        seen.add(v);
        expect(decodeQr(qr).text, `${ec} v${v}`).toBe(text);
      }
      // Small versions are reached by short strings; make sure the sweep was
      // not trivially short.
      expect(seen.size, ec).toBeGreaterThanOrEqual(10);
    }
  });

  it('carries non-Latin text', () => {
    const text = 'ইএসবি পাওয়ারলাইন — গ্রিড তুলনা ১৯ আগস্ট ২০২৬';
    expect(decodeQr(encodeQr(text, 'M')).text).toBe(text);
  });

  it('sets the mandatory dark module', () => {
    for (const ec of LEVELS) {
      const qr = encodeQr('https://esbpowerline.com', ec);
      expect(qr.modules[(qr.size - 8) * qr.size + 8], ec).toBe(1);
    }
  });

  it('keeps the timing patterns intact', () => {
    const qr = encodeQr('https://esbpowerline.com/grid-explorer', 'M');
    for (let i = 8; i < qr.size - 8; i += 1) {
      expect(qr.modules[6 * qr.size + i]).toBe(i % 2 === 0 ? 1 : 0);
      expect(qr.modules[i * qr.size + 6]).toBe(i % 2 === 0 ? 1 : 0);
    }
  });

  it('picks the smallest version that fits, and rises with the payload', () => {
    const small = encodeQr('https://esb.co', 'M').size;
    const large = encodeQr(`https://esb.co/${'x'.repeat(400)}`, 'M').size;
    expect(small).toBe(21);
    expect(large).toBeGreaterThan(small);
  });

  it('refuses a payload that will not fit rather than truncating it', () => {
    // The one failure mode that must never be silent: a QR that scans and
    // returns half a URL is worse than one that was never printed.
    expect(() => encodeQr('x'.repeat(5000), 'H')).toThrow(/will not fit/);
  });

  it('draws every dark module and nothing else', () => {
    const qr = encodeQr('https://esbpowerline.com', 'M');
    const path = qrToSvgPath(qr);
    // Each run contributes one `M…h…v1h-…z`; the horizontal extents must sum
    // to the number of dark modules.
    const runs = [...path.matchAll(/M\d+ \d+h(\d+)v1/g)].reduce((a, m) => a + Number(m[1]), 0);
    const dark = qr.modules.reduce((a, b) => a + b, 0);
    expect(runs).toBe(dark);
  });
});
