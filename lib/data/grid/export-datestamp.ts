/**
 * When a file was downloaded, in the three calendars this desk reads.
 *
 * The point is not decoration. An export names two different dates — the days
 * being compared, and the day the file was pulled — and someone opening it six
 * months later has to be able to tell them apart at a glance. A sheet comparing
 * 19 August, downloaded on 21 August, has been misread as data for the 21st.
 * So the download stamp is labelled as such, in full, and never printed in the
 * same style as the comparison dates.
 *
 * Gregorian and Hijri come from `Intl`. The Bangla San does not: CLDR has no
 * Bangla calendar, so it is computed here from the Bangla Academy's 2019
 * revision, which is the one Bangladesh keeps.
 */

export type Stamp = {
  /** `21 August 2026, Friday` */
  gregorian: string;
  /** `৬ ভাদ্র ১৪৩৩, শুক্রবার` */
  bangla: string;
  /** `8 Rabiʻ I 1448 AH` — null where the runtime has no Islamic calendar. */
  hijri: string | null;
  /** `٨ ربيع الأول ١٤٤٨ هـ` — the same date in Arabic. */
  hijriArabic: string | null;
  /** ISO, for anything that needs to sort or parse it. */
  iso: string;
};

/* ── Bangla San ──────────────────────────────────────────────────────────── */

const BANGLA_MONTHS = [
  'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
  'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র',
];

const BANGLA_WEEKDAYS = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার',
];

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

const isGregorianLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Month lengths under the 2019 revision.
 *
 * Boishakh to Ashwin are 31 days, Kartik to Magh and Choitro are 30, and Falgun
 * is 29 — 30 in a year that contains a leap February. That comes to 365/366.
 * The lengths were chosen so the national days fall on fixed Bangla dates:
 * 21 February is 8 Falgun and 16 December is 1 Poush, every year.
 *
 * This used to encode the 1987 revision instead (five months of 31, Falgun
 * taking the leap day), which put every date from Kartik to Falgun one day
 * late: 20 Oct 2026 printed as ৫ কার্তিক where Bangladesh's calendar says ৪,
 * and 21 February as 9 Falgun. The two schemes agree from Boishakh to the end
 * of Bhadro, which is why the August fixtures below never saw it.
 *
 * A Bangla year opens on 14 April of Gregorian year Y and closes on 13 April of
 * Y+1, so the February it contains is February of Y+1 — that is the February
 * whose length decides the leap day, and it is also exactly what makes 14 April
 * to 14 April come to 366 days.
 */
function banglaMonthLengths(startYear: number): number[] {
  const leap = isGregorianLeap(startYear + 1);
  return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
}

const MS_DAY = 86_400_000;

/** Whole days between two UTC dates. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_DAY);
}

export type BanglaDate = { day: number; month: number; year: number; monthName: string };

/**
 * Gregorian to Bangla San.
 *
 * Anchored on Pohela Boishakh being fixed to 14 April, which is the whole point
 * of the 2019 revision — before it the date drifted against the Gregorian
 * calendar and Bangladesh and West Bengal disagreed about it.
 */
export function toBanglaDate(date: Date): BanglaDate {
  const y = date.getUTCFullYear();
  const utc = new Date(Date.UTC(y, date.getUTCMonth(), date.getUTCDate()));

  // Before 14 April the date still belongs to the year that opened last April.
  const thisYearStart = new Date(Date.UTC(y, 3, 14));
  const startYear = utc.getTime() >= thisYearStart.getTime() ? y : y - 1;
  const start = new Date(Date.UTC(startYear, 3, 14));

  let remaining = daysBetween(start, utc); // 0 on Pohela Boishakh
  const lengths = banglaMonthLengths(startYear);

  let month = 0;
  while (month < 12 && remaining >= lengths[month]) {
    remaining -= lengths[month];
    month += 1;
  }
  // Guards the boundary: a date on 13 April lands on the last day of Choitro.
  if (month > 11) month = 11;

  return {
    day: remaining + 1,
    month: month + 1,
    year: startYear - 593,
    monthName: BANGLA_MONTHS[month],
  };
}

export function formatBangla(date: Date): string {
  const b = toBanglaDate(date);
  const weekday = BANGLA_WEEKDAYS[date.getUTCDay()];
  return `${toBnDigits(b.day)} ${b.monthName} ${toBnDigits(b.year)}, ${weekday}`;
}

/* ── the stamp ───────────────────────────────────────────────────────────── */

const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * The Hijri date, or null.
 *
 * `Intl` carries the Islamic calendars, but a runtime built with a trimmed ICU
 * may not, and an export must not fail over a decorative line. Umm al-Qura is
 * the variant chosen deliberately: it is the Saudi civil calendar and the one
 * almanacs and newspapers in this region print.
 */
function hijriOf(date: Date, locale: string): string | null {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return null;
  }
}

/**
 * Build the stamp for an instant.
 *
 * Dhaka time, because the desk that downloads the file is in Dhaka and a file
 * pulled at 1 a.m. should not be stamped with yesterday's date because the
 * server happens to be in UTC.
 */
export function downloadStamp(now: Date = new Date()): Stamp {
  // Shift into Dhaka (UTC+6, no DST) and then read the parts as if UTC, so
  // every calendar below sees the same civil day.
  const dhaka = new Date(now.getTime() + 6 * 3_600_000);
  const civil = new Date(
    Date.UTC(dhaka.getUTCFullYear(), dhaka.getUTCMonth(), dhaka.getUTCDate()),
  );

  const d = civil.getUTCDate();
  const m = civil.getUTCMonth();
  const y = civil.getUTCFullYear();

  return {
    gregorian: `${d} ${GREGORIAN_MONTHS[m]} ${y}, ${WEEKDAYS[civil.getUTCDay()]}`,
    bangla: formatBangla(civil),
    hijri: hijriOf(civil, 'en'),
    hijriArabic: hijriOf(civil, 'ar'),
    iso: civil.toISOString().slice(0, 10),
  };
}

/**
 * The lines an export prints under "Downloaded", each tagged with its script.
 *
 * The tag is not decoration. The stamp is multi-script whatever language the
 * document itself is in — a Gregorian line in Latin, a Bangla line in Bengali,
 * a Hijri line that exists in both — and a PDF embeds one font per run. Drawn
 * with the document's own face, the Bangla and Arabic lines came out as
 * mojibake on the English pages. The renderer picks a face per line, and drops
 * a line it has no face for rather than printing rubbish.
 *
 * Word needs none of this and takes all three: it resolves fonts from the
 * reader's own system.
 */
export type StampLine = { text: string; script: 'latin' | 'bengali' | 'arabic' };

export function stampLines(stamp: Stamp): StampLine[] {
  const lines: StampLine[] = [
    { text: stamp.gregorian, script: 'latin' },
    { text: stamp.bangla, script: 'bengali' },
  ];
  // The transliterated Hijri is Latin and always printable; the Arabic script
  // form is a separate line so a renderer without an Arabic face can omit it
  // without losing the Hijri date itself.
  if (stamp.hijri) lines.push({ text: stamp.hijri, script: 'latin' });
  if (stamp.hijriArabic) lines.push({ text: stamp.hijriArabic, script: 'arabic' });
  return lines;
}
