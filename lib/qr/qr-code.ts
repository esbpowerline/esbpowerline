/**
 * A QR code, byte mode, no dependencies.
 *
 * The exports carry a link back to the comparison they were made from, and a
 * QR is how a printed page hands a URL to a phone. This repo already writes its
 * own .docx rather than pull a library for it, so it writes its own QR too.
 *
 * Scope, deliberately narrow: byte mode only, error-correction level chosen by
 * the caller, versions 1–20. A URL is bytes, and 20 is a 97×97 grid — well past
 * anything a link needs and past what prints legibly at export size.
 *
 * The parts are all standard (ISO/IEC 18004): a Reed-Solomon coder over
 * GF(256), the fixed function patterns, block interleaving, eight mask
 * candidates scored by the four penalty rules. It is tested against published
 * reference codes rather than against itself, because an encoder that agrees
 * with its own bugs is easy to write.
 */

export type EcLevel = 'L' | 'M' | 'Q' | 'H';

/* ── GF(256) ─────────────────────────────────────────────────────────────── */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    // The QR generator polynomial, x^8 + x^4 + x^3 + x^2 + 1.
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

const mul = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** The generator polynomial for `degree` error-correction codewords. */
function generatorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let d = 0; d < degree; d += 1) {
    const next = new Uint8Array(poly.length + 1);
    for (let i = 0; i < poly.length; i += 1) {
      next[i] ^= poly[i];
      next[i + 1] ^= mul(poly[i], EXP[d]);
    }
    poly = next;
  }
  return poly;
}

function ecCodewords(data: Uint8Array, count: number): Uint8Array {
  const gen = generatorPoly(count);
  const rem = new Uint8Array(count);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    rem.copyWithin(0, 1);
    rem[count - 1] = 0;
    for (let i = 0; i < count; i += 1) rem[i] ^= mul(gen[i + 1], factor);
  }
  return rem;
}

/* ── version tables ──────────────────────────────────────────────────────── */

/**
 * Per version and EC level: [ec codewords per block, group-1 blocks,
 * group-2 blocks]. Group 2 blocks hold one more data codeword than group 1.
 * Straight from the standard's table 9; versions 1–20 only.
 */
const BLOCKS: Record<EcLevel, Array<[number, number, number]>> = {
  L: [
    [7, 1, 0], [10, 1, 0], [15, 1, 0], [20, 1, 0], [26, 1, 0], [18, 2, 0], [20, 2, 0],
    [24, 2, 0], [30, 2, 0], [18, 2, 2], [20, 4, 0], [24, 2, 2], [26, 4, 0], [30, 3, 1],
    [22, 5, 1], [24, 5, 1], [28, 1, 5], [30, 5, 1], [28, 3, 4], [28, 3, 5],
  ],
  M: [
    [10, 1, 0], [16, 1, 0], [26, 1, 0], [18, 2, 0], [24, 2, 0], [16, 4, 0], [18, 4, 0],
    [22, 2, 2], [22, 3, 2], [26, 4, 1], [30, 1, 4], [22, 6, 2], [22, 8, 1], [24, 4, 5],
    [24, 5, 5], [28, 7, 3], [28, 10, 1], [26, 9, 4], [26, 3, 11], [26, 3, 13],
  ],
  Q: [
    [13, 1, 0], [22, 1, 0], [18, 2, 0], [26, 2, 0], [18, 2, 2], [24, 4, 0], [18, 2, 4],
    [22, 4, 2], [20, 4, 4], [24, 6, 2], [28, 4, 4], [26, 4, 6], [24, 8, 4], [20, 11, 5],
    [30, 5, 7], [24, 15, 2], [28, 1, 15], [28, 17, 1], [26, 17, 4], [30, 15, 5],
  ],
  H: [
    [17, 1, 0], [28, 1, 0], [22, 2, 0], [16, 4, 0], [22, 2, 2], [28, 4, 0], [26, 4, 1],
    [26, 4, 2], [24, 4, 4], [28, 6, 2], [24, 3, 8], [28, 7, 4], [22, 12, 4], [24, 11, 5],
    [24, 11, 7], [30, 3, 13], [28, 2, 17], [28, 2, 19], [26, 9, 16], [28, 15, 10],
  ],
};

/** Total codewords per version (data + error correction), versions 1–20. */
const TOTAL_CODEWORDS = [
  26, 44, 70, 100, 134, 172, 196, 242, 292, 346,
  404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
];

/** Alignment-pattern centre coordinates per version, 1–20. */
const ALIGN: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46],
  [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
  [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
];

const EC_BITS: Record<EcLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };

function dataCapacity(version: number, ec: EcLevel): number {
  const [ecPerBlock, g1, g2] = BLOCKS[ec][version - 1];
  return TOTAL_CODEWORDS[version - 1] - ecPerBlock * (g1 + g2);
}

/* ── matrix ──────────────────────────────────────────────────────────────── */

type Grid = { size: number; on: Uint8Array; fixed: Uint8Array };

const at = (g: Grid, x: number, y: number) => g.on[y * g.size + x];
const set = (g: Grid, x: number, y: number, v: number, isFixed = false) => {
  g.on[y * g.size + x] = v;
  if (isFixed) g.fixed[y * g.size + x] = 1;
};

function placeFunctionPatterns(g: Grid, version: number): void {
  const n = g.size;

  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const px = ox + x;
        const py = oy + y;
        if (px < 0 || py < 0 || px >= n || py >= n) continue;
        const ring = x >= 0 && x <= 6 && (y === 0 || y === 6);
        const side = y >= 0 && y <= 6 && (x === 0 || x === 6);
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        set(g, px, py, ring || side || core ? 1 : 0, true);
      }
    }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);

  // Timing patterns.
  for (let i = 8; i < n - 8; i += 1) {
    const v = i % 2 === 0 ? 1 : 0;
    set(g, i, 6, v, true);
    set(g, 6, i, v, true);
  }

  // Alignment patterns, skipping the three that would sit on a finder.
  const centres = ALIGN[version - 1];
  for (const cy of centres) {
    for (const cx of centres) {
      const onFinder =
        (cx <= 8 && cy <= 8) || (cx <= 8 && cy >= n - 9) || (cx >= n - 9 && cy <= 8);
      if (onFinder) continue;
      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const edge = Math.max(Math.abs(x), Math.abs(y));
          set(g, cx + x, cy + y, edge === 1 ? 0 : 1, true);
        }
      }
    }
  }

  /**
   * Reserve the format-information area.
   *
   * Written out cell by cell rather than guarded, because the guard was wrong
   * in a way that was almost invisible: it tested `(i, 6)` while setting
   * `(i, 8)`. For i of 0 to 5 that tests modules inside the top-left finder,
   * which are always fixed, so `(0,8)` through `(5,8)` and `(8,0)` through
   * `(8,5)` were never reserved at all. Twelve modules were handed to the data
   * placer as free slots and then overwritten by the format bits — twelve
   * corrupt bits in every code, which Reed-Solomon quietly repaired at M, Q and
   * H and could not always repair at L.
   *
   * Row 6 and column 6 are skipped on purpose: those are the timing patterns,
   * and the format bits step around them.
   */
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      set(g, i, 8, 0, true);
      set(g, 8, i, 0, true);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    set(g, n - 1 - i, 8, 0, true);
    set(g, 8, n - 1 - i, 0, true);
  }

  /**
   * The dark module, written last.
   *
   * It sits at (8, size-8), which is one cell inside the vertical format strip
   * the loop above reserves — so setting it first, as this did, meant the loop
   * immediately wrote a 0 over it and every code shipped without it. The format
   * bits never restore it either: the second copy occupies (8, size-7) upward.
   *
   * Most decoders forgive the omission, which is why 26 of 29 test codes still
   * scanned; the three that failed were strict about it. A module the standard
   * calls mandatory should not be left to a reader's tolerance.
   */
  set(g, 8, n - 8, 1, true);

  // Version information, versions 7 and up.
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = ((version << 12) | rem) >>> 0;
    for (let i = 0; i < 18; i += 1) {
      const bit = (bits >>> i) & 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + n - 11;
      set(g, a, b, bit, true);
      set(g, b, a, bit, true);
    }
  }
}

const MASKS: Array<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function placeFormatInfo(g: Grid, ec: EcLevel, mask: number): void {
  const n = g.size;
  const data = (EC_BITS[ec] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = (((data << 10) | rem) ^ 0x5412) >>> 0;

  for (let i = 0; i < 15; i += 1) {
    const bit = (bits >>> i) & 1;
    // Around the top-left finder.
    if (i < 6) set(g, 8, i, bit, true);
    else if (i < 8) set(g, 8, i + 1, bit, true);
    else if (i === 8) set(g, 7, 8, bit, true);
    else set(g, 14 - i, 8, bit, true);
    // The split copy.
    if (i < 8) set(g, n - 1 - i, 8, bit, true);
    else set(g, 8, n - 15 + i, bit, true);
  }
}

/** The four penalty rules; the lowest total wins. */
function penalty(g: Grid): number {
  const n = g.size;
  let score = 0;

  const runScore = (line: number[]) => {
    let s = 0;
    let run = 1;
    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === line[i - 1]) run += 1;
      else {
        if (run >= 5) s += run - 2;
        run = 1;
      }
    }
    if (run >= 5) s += run - 2;
    return s;
  };

  for (let y = 0; y < n; y += 1) {
    const row: number[] = [];
    const col: number[] = [];
    for (let x = 0; x < n; x += 1) {
      row.push(at(g, x, y));
      col.push(at(g, y, x));
    }
    score += runScore(row) + runScore(col);
  }

  // 2x2 blocks of one colour.
  for (let y = 0; y < n - 1; y += 1) {
    for (let x = 0; x < n - 1; x += 1) {
      const v = at(g, x, y);
      if (v === at(g, x + 1, y) && v === at(g, x, y + 1) && v === at(g, x + 1, y + 1)) score += 3;
    }
  }

  // The finder-like 1:1:3:1:1 sequence, with four light modules either side.
  const patternA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const patternB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (line: number[], at0: number, pat: number[]) =>
    pat.every((p, i) => line[at0 + i] === p);
  for (let y = 0; y < n; y += 1) {
    const row: number[] = [];
    const col: number[] = [];
    for (let x = 0; x < n; x += 1) {
      row.push(at(g, x, y));
      col.push(at(g, y, x));
    }
    for (let i = 0; i + 11 <= n; i += 1) {
      if (matches(row, i, patternA) || matches(row, i, patternB)) score += 40;
      if (matches(col, i, patternA) || matches(col, i, patternB)) score += 40;
    }
  }

  // Balance of dark to light.
  let dark = 0;
  for (let i = 0; i < g.on.length; i += 1) dark += g.on[i];
  const ratio = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;

  return score;
}

/* ── the encoder ─────────────────────────────────────────────────────────── */

/**
 * Encode `text` as a matrix of 0/1, row-major, without a quiet zone.
 *
 * The caller adds the quiet zone when it draws — four modules is the standard
 * minimum, and the drawing code knows how much room it has.
 */
export function encodeQr(text: string, ec: EcLevel = 'M'): { size: number; modules: Uint8Array } {
  const bytes = new TextEncoder().encode(text);

  let version = 0;
  for (let v = 1; v <= 20; v += 1) {
    // 4 bits of mode + the character count (8 bits below version 10, else 16).
    const countBits = v < 10 ? 8 : 16;
    if (dataCapacity(v, ec) * 8 >= 4 + countBits + bytes.length * 8) {
      version = v;
      break;
    }
  }
  if (!version) {
    throw new Error(
      `${bytes.length} bytes will not fit in a version-20 QR at level ${ec}. ` +
        'A QR carries a link, not a document.',
    );
  }

  const countBits = version < 10 ? 8 : 16;
  const capacity = dataCapacity(version, ec);

  // Bit stream: mode indicator, length, payload, terminator, pad.
  const bits: number[] = [];
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, countBits);
  for (const b of bytes) push(b, 8);
  for (let i = 0; i < 4 && bits.length < capacity * 8; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const data = new Uint8Array(capacity);
  for (let i = 0; i < bits.length / 8; i += 1) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i * 8 + j];
    data[i] = byte;
  }
  // The standard's alternating pad bytes.
  for (let i = Math.ceil(bits.length / 8); i < capacity; i += 1) {
    data[i] = i % 2 === Math.ceil(bits.length / 8) % 2 ? 0xec : 0x11;
  }

  // Split into blocks, compute EC, interleave.
  const [ecPerBlock, g1, g2] = BLOCKS[ec][version - 1];
  const blocks = g1 + g2;
  const shortLen = Math.floor(capacity / blocks);
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let i = 0; i < blocks; i += 1) {
    const len = i < g1 ? shortLen : shortLen + 1;
    const block = data.subarray(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(ecCodewords(block, ecPerBlock));
  }

  const interleaved: number[] = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i += 1) {
    for (const b of dataBlocks) if (i < b.length) interleaved.push(b[i]);
  }
  for (let i = 0; i < ecPerBlock; i += 1) {
    for (const b of ecBlocks) interleaved.push(b[i]);
  }

  // Lay the codewords into the grid, two columns at a time, upward then down.
  const size = version * 4 + 17;
  const grid: Grid = { size, on: new Uint8Array(size * size), fixed: new Uint8Array(size * size) };
  placeFunctionPatterns(grid, version);

  const stream: number[] = [];
  for (const byte of interleaved) for (let i = 7; i >= 0; i -= 1) stream.push((byte >>> i) & 1);

  let idx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    // Column 6 is the vertical timing pattern and is skipped entirely.
    if (right === 6) right = 5;
    for (let step = 0; step < size; step += 1) {
      const y = upward ? size - 1 - step : step;
      for (const x of [right, right - 1]) {
        if (grid.fixed[y * size + x]) continue;
        grid.on[y * size + x] = idx < stream.length ? stream[idx] : 0;
        idx += 1;
      }
    }
    upward = !upward;
  }

  // Try every mask, keep the best-scoring.
  let best = -1;
  let bestScore = Infinity;
  let bestOn: Uint8Array | null = null;
  const base = grid.on.slice();
  for (let m = 0; m < 8; m += 1) {
    const trial: Grid = { size, on: base.slice(), fixed: grid.fixed };
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (trial.fixed[y * size + x]) continue;
        if (MASKS[m](x, y)) trial.on[y * size + x] ^= 1;
      }
    }
    placeFormatInfo(trial, ec, m);
    const score = penalty(trial);
    if (score < bestScore) {
      bestScore = score;
      best = m;
      bestOn = trial.on;
    }
  }
  void best;

  return { size, modules: bestOn! };
}

/** The matrix as an SVG path, one `M…h…v…h…z` per dark module run. */
export function qrToSvgPath(qr: { size: number; modules: Uint8Array }): string {
  const parts: string[] = [];
  for (let y = 0; y < qr.size; y += 1) {
    let x = 0;
    while (x < qr.size) {
      if (!qr.modules[y * qr.size + x]) {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < qr.size && qr.modules[y * qr.size + x + run]) run += 1;
      parts.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  return parts.join('');
}
