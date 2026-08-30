import 'server-only';

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { encodeQr, type EcLevel } from '@/lib/qr/qr-code';
import { downloadStamp, stampLines, type Stamp, type StampLine } from '@/lib/data/grid/export-datestamp';
import type { Lang } from '@/lib/data/grid/comparison-i18n';

/**
 * What every downloadable page carries: the mark, the palette, the provenance
 * block and the QR back to the live view.
 *
 * One module because the four writers — comparison .docx, comparison .pdf,
 * sheet .docx, sheet .pdf — must not drift into four slightly different
 * letterheads. The members' Grid Explorer export already had its own cover and
 * running head; this is what brings the CMS exports up to it.
 *
 * Deliberately NOT applied to .csv or .json. A CSV cannot hold a logo, and
 * preamble rows above the header row stop it loading in pandas, in Excel's
 * import wizard and in every script that reads it — which is the entire reason
 * someone chose CSV. Those two stay clean; the provenance travels in the
 * filename and in the human-readable formats.
 */

/* ── palette ─────────────────────────────────────────────────────────────── */

export const BRAND = {
  /** The green the site's own primary uses. */
  green: '#0F7A4F',
  greenHex: '0F7A4F',
  ink: '#111827',
  inkHex: '111827',
  secondary: '#475569',
  secondaryHex: '475569',
  muted: '#94A3B8',
  mutedHex: '94A3B8',
  hair: '#E2E8F0',
  hairHex: 'E2E8F0',
  band: '#F1F5F9',
  bandHex: 'F1F5F9',
} as const;

/* ── the mark ────────────────────────────────────────────────────────────── */

type Logo = { bytes: Buffer; dataUri: string; width: number; height: number };

let logoCache: Logo | null | undefined;

/**
 * The export mark.
 *
 * `esb-logo-ng.png` is the current one; the older `esb-logo.png` stays as a
 * fallback so a missing file degrades to the previous mark rather than to a
 * blank letterhead.
 */
export function exportLogo(): Logo | null {
  if (logoCache !== undefined) return logoCache;
  for (const name of ['esb-logo-ng.png', 'esb-logo.png']) {
    const path = join(process.cwd(), 'public', 'images', name);
    if (!existsSync(path)) continue;
    try {
      const bytes = readFileSync(path);
      // PNG header: width and height are big-endian 32-bit at offset 16.
      const width = bytes.readUInt32BE(16);
      const height = bytes.readUInt32BE(20);
      logoCache = { bytes, dataUri: `data:image/png;base64,${bytes.toString('base64')}`, width, height };
      return logoCache;
    } catch {
      // Try the fallback.
    }
  }
  logoCache = null;
  return logoCache;
}

/* ── QR ──────────────────────────────────────────────────────────────────── */

/**
 * A QR as a PNG, for the .docx — which embeds images, not vectors.
 *
 * Written by hand for the same reason the QR is: it is a 1-bit image with no
 * filtering, which is a few lines of zlib and two CRCs. Level M and a four
 * module quiet zone are the printable defaults.
 */
export function qrPng(text: string, ec: EcLevel = 'M', scale = 8, quiet = 4): Buffer {
  const qr = encodeQr(text, ec);
  const side = (qr.size + quiet * 2) * scale;

  // Greyscale, 8 bits, one filter byte per row.
  const raw = Buffer.alloc((side + 1) * side, 0xff);
  for (let y = 0; y < side; y += 1) raw[y * (side + 1)] = 0; // filter type 0

  for (let my = 0; my < qr.size; my += 1) {
    for (let mx = 0; mx < qr.size; mx += 1) {
      if (!qr.modules[my * qr.size + mx]) continue;
      for (let dy = 0; dy < scale; dy += 1) {
        const y = (my + quiet) * scale + dy;
        const rowStart = y * (side + 1) + 1;
        raw.fill(0x00, rowStart + (mx + quiet) * scale, rowStart + (mx + quiet) * scale + scale);
      }
    }
  }

  const chunk = (type: string, body: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const typed = Buffer.concat([Buffer.from(type, 'latin1'), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typed) >>> 0);
    return Buffer.concat([len, typed, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(side, 0);
  ihdr.writeUInt32BE(side, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** The QR as an SVG path, for the .pdf — which draws vectors, not pixels. */
export { qrToSvgPath } from '@/lib/qr/qr-code';
export { encodeQr } from '@/lib/qr/qr-code';

/* ── the provenance block ────────────────────────────────────────────────── */

export type ExportBrand = {
  /** What this document is, e.g. "Year-on-year sheet". Runs in the head. */
  kind: string;
  /** The period, in the terse form the running head needs. */
  covers: string;
  /** "Energy days compared" — the label over the period. */
  periodLabel: string;
  /** "Tuesday, 19 August 2025 → Wednesday, 19 August 2026" */
  periodValue: string;
  /** One line saying what that period is, e.g. "A full year apart". */
  periodNote: string | null;
  /** "Retrieved from esbpowerline.com on" */
  retrievedLabel: string;
  /** How the figures were arrived at, and what a blank means. */
  method: string;
  /** Caption under the QR. */
  qrCaption: string;
  /** Absolute URL that reopens this view. */
  link: string | null;
  stamp: Stamp;
  /** Gregorian, Bangla, Hijri and its Arabic form — each tagged with its script. */
  stampLines: StampLine[];
};

/* ── the words on the page ───────────────────────────────────────────────── */

const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EN_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const BN_DAYS = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];

/**
 * A date the way a person writes it, not the way a database stores it.
 *
 * The provenance block used to print `2025-08-19 vs 2026-08-19`. That is the
 * key the archive is filed under, and it reads like a filename on a page that
 * is otherwise typeset — so the block spells the day out and names the weekday,
 * which is also the detail that makes two dates a year apart obviously so.
 */
function spellDate(iso: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    if (lang === 'bn') {
      const bnDigits = (v: string | number) =>
        String(v).replace(/[0-9]/g, (x) => '০১২৩৪৫৬৭৮৯'[Number(x)]);
      return `${BN_DAYS[d.getUTCDay()]}, ${bnDigits(Number(m[3]))} ${BN_MONTHS[Number(m[2]) - 1]} ${bnDigits(m[1])}`;
    }
    return `${EN_DAYS[d.getUTCDay()]}, ${Number(m[3])} ${EN_MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  }
  // A month key, for the monthly comparison.
  const mm = /^(\d{4})-(\d{2})$/.exec(iso);
  if (mm) {
    if (lang === 'bn') {
      const bnDigits = (v: string) => v.replace(/[0-9]/g, (x) => '০১২৩৪৫৬৭৮৯'[Number(x)]);
      return `${BN_MONTHS[Number(mm[2]) - 1]} ${bnDigits(mm[1])}`;
    }
    return `${EN_MONTHS[Number(mm[2]) - 1]} ${mm[1]}`;
  }
  return iso;
}

/** Whole years between two ISO days, when it is a whole number of them. */
function yearsApart(a: string, b: string): number | null {
  const pa = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a);
  const pb = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b);
  if (!pa || !pb) return null;
  if (pa[2] !== pb[2] || pa[3] !== pb[3]) return null;
  const n = Number(pb[1]) - Number(pa[1]);
  return n > 0 ? n : null;
}

const COPY = {
  en: {
    period: (isDay: boolean) => (isDay ? 'Energy days compared' : 'Reporting months compared'),
    retrieved: 'Retrieved from esbpowerline.com on',
    method:
      'Compiled from the Power Grid Company of Bangladesh daily report and the Petrobangla ' +
      'daily gas intake–offtake report. A figure the source did not publish is shown as — ' +
      'and is never read as zero.',
    qr: 'Scan to open this comparison, live and current',
    apart: (n: number) => (n === 1 ? 'One year apart, to the day.' : `${n} years apart, to the day.`),
    sameWindow: 'Grid and gas are read from the same 08:00–08:00 energy day.',
  },
  bn: {
    period: (isDay: boolean) => (isDay ? 'তুলনা করা জ্বালানি দিবস' : 'তুলনা করা প্রতিবেদন মাস'),
    retrieved: 'esbpowerline.com থেকে সংগ্রহ করা হয়েছে',
    method:
      'সূত্র: বাংলাদেশ পাওয়ার গ্রিড কোম্পানির দৈনিক প্রতিবেদন ও পেট্রোবাংলার দৈনিক গ্যাস ' +
      'গ্রহণ–সরবরাহ প্রতিবেদন। যে সংখ্যা সূত্রে প্রকাশিত হয়নি তা — হিসেবে দেখানো হয়েছে; ' +
      'এটি কখনো শূন্য ধরা হয়নি।',
    qr: 'স্ক্যান করে হালনাগাদ তুলনাটি দেখুন',
    apart: (n: number) => `ঠিক ${String(n).replace(/[0-9]/g, (x) => '০১২৩৪৫৬৭৮৯'[Number(x)])} বছরের ব্যবধান।`,
    sameWindow: 'গ্রিড ও গ্যাস — দুটিই একই ৮টা–৮টা জ্বালানি দিবস থেকে নেওয়া।',
  },
} as const;

/**
 * The site's own origin, for the QR link.
 *
 * A QR holding a relative path is useless — a phone camera has nothing to
 * resolve it against — so an absolute URL is the only kind worth printing. The
 * deployment supplies it; without one there is no honest link to encode and the
 * QR is simply left off.
 */
export function siteOrigin(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null);
  if (!raw) return null;
  const trimmed = raw.replace(/\/+$/, '');
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function buildBrand(
  kind: string,
  covers: string,
  path: string | null,
  now?: Date,
  lang: Lang = 'en',
  period?: [string, string],
): ExportBrand {
  const origin = siteOrigin();
  const stamp = downloadStamp(now);
  const t = COPY[lang];

  const isDay = Boolean(period && /^\d{4}-\d{2}-\d{2}$/.test(period[0]));
  const apart = period ? yearsApart(period[0], period[1]) : null;
  const notes = [apart ? t.apart(apart) : null, isDay ? t.sameWindow : null].filter(Boolean);

  return {
    kind,
    covers,
    periodLabel: t.period(isDay),
    // The separator has to exist in the face that draws it. Noto Sans Bengali
    // has no U+2192, and react-pdf has no glyph fallback, so a Bengali page
    // drew a stray mark between the two dates. "বনাম" is the word the
    // published sheet already uses for it.
    periodValue: period
      // Single spaces around the separator. Doubled, the arrow read as a gap
      // between two headings rather than as one line joining two dates.
      ? `${spellDate(period[0], lang)}${lang === 'bn' ? ' বনাম ' : ' → '}${spellDate(period[1], lang)}`
      : covers,
    periodNote: notes.length ? notes.join('  ') : null,
    retrievedLabel: t.retrieved,
    method: t.method,
    qrCaption: t.qr,
    link: origin && path ? `${origin}${path}` : null,
    stamp,
    stampLines: stampLines(stamp),
  };
}

/** The footer line every page carries. */
export function footerNote(brand: ExportBrand): string {
  return `ESB PowerLine · ${brand.kind} · downloaded ${brand.stamp.gregorian}`;
}
