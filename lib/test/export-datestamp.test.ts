import { describe, it, expect } from 'vitest';
import {
  downloadStamp,
  formatBangla,
  stampLines,
  toBanglaDate,
} from '@/lib/data/grid/export-datestamp';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

/**
 * The Bangla San is computed rather than looked up, so it is pinned to anchors
 * that are true by definition or checkable against a printed calendar. A date
 * stamp that is confidently wrong on every export is worse than no date stamp.
 */
describe('Bangla calendar', () => {
  it('opens the year on 14 April — the fixed point of the 2019 revision', () => {
    // Pohela Boishakh. This is the definition, not a calculation.
    expect(toBanglaDate(utc(2026, 4, 14))).toMatchObject({ day: 1, month: 1, year: 1433 });
    expect(toBanglaDate(utc(2025, 4, 14))).toMatchObject({ day: 1, month: 1, year: 1432 });
    expect(toBanglaDate(utc(2024, 4, 14))).toMatchObject({ day: 1, month: 1, year: 1431 });
  });

  it('closes the year on 13 April, the last day of Choitro', () => {
    const eve = toBanglaDate(utc(2026, 4, 13));
    expect(eve.year).toBe(1432);
    expect(eve.month).toBe(12);
    expect(eve.monthName).toBe('চৈত্র');
    // 1432 opened 14 Apr 2025 and contains February 2026, which is not a leap
    // February, so Choitro ends on the 30th.
    expect(eve.day).toBe(30);
  });

  it('places 21 August 2026 in Bhadro', () => {
    // 14 Apr is day 1; 21 Aug is day 130. The first four months are 31 days
    // each (124), so day 130 is the 6th of the fifth month.
    expect(toBanglaDate(utc(2026, 8, 21))).toMatchObject({
      day: 6,
      month: 5,
      monthName: 'ভাদ্র',
      year: 1433,
    });
  });

  it('gives Falgun its extra day only when the year contains a leap February', () => {
    // 1430 opened 14 Apr 2023 and contains February 2024 — a leap February — so
    // Falgun runs to 30 and the year is 366 days.
    const leapEnd = toBanglaDate(utc(2024, 3, 14)); // 14 March 2024
    expect(leapEnd).toMatchObject({ year: 1430, monthName: 'ফাল্গুন', day: 30 });
    expect(toBanglaDate(utc(2024, 3, 15))).toMatchObject({ day: 1, monthName: 'চৈত্র' });

    // 1431 contains February 2025, an ordinary February, so Falgun stops at 29.
    const ordinaryEnd = toBanglaDate(utc(2025, 3, 14));
    expect(ordinaryEnd).toMatchObject({ year: 1431, monthName: 'ফাল্গুন', day: 29 });
    expect(toBanglaDate(utc(2025, 3, 15))).toMatchObject({ day: 1, monthName: 'চৈত্র' });

    // There is no 30 Falgun in an ordinary year.
    let sawThirtieth = false;
    for (let d = 1; d <= 31; d += 1) {
      const b = toBanglaDate(utc(2025, 3, d));
      if (b.monthName === 'ফাল্গুন' && b.day === 30) sawThirtieth = true;
    }
    expect(sawThirtieth).toBe(false);
  });

  it('keeps the national days on the dates the 2019 revision fixed for them', () => {
    // The revision's whole purpose. The 1987 month lengths this file used to
    // carry put both a day late, and the August fixtures could not see it.
    for (const y of [2025, 2026, 2027, 2028]) {
      expect(toBanglaDate(utc(y, 2, 21)), `21 Feb ${y}`).toMatchObject({ day: 8, monthName: 'ফাল্গুন' });
      expect(toBanglaDate(utc(y, 12, 16)), `16 Dec ${y}`).toMatchObject({ day: 1, monthName: 'পৌষ' });
    }
    // Ashwin is 31 days, so Kartik opens on 17 October.
    expect(toBanglaDate(utc(2026, 10, 16))).toMatchObject({ day: 31, monthName: 'আশ্বিন' });
    expect(formatBangla(utc(2026, 10, 20))).toBe('৪ কার্তিক ১৪৩৩, মঙ্গলবার');
  });

  it('spans exactly one Gregorian year, leap or not', () => {
    // The real test of the leap rule: 14 April to 14 April must land back on
    // Pohela Boishakh whatever the intervening February did.
    for (const y of [2023, 2024, 2025, 2026, 2027]) {
      const next = toBanglaDate(utc(y + 1, 4, 14));
      expect(next.day, String(y)).toBe(1);
      expect(next.month, String(y)).toBe(1);
    }
  });

  it('rolls to the next month on the boundary, not before it', () => {
    // Boishakh is 31 days: 14 Apr + 30 = 14 May is the last day.
    expect(toBanglaDate(utc(2026, 5, 14))).toMatchObject({ day: 31, monthName: 'বৈশাখ' });
    expect(toBanglaDate(utc(2026, 5, 15))).toMatchObject({ day: 1, monthName: 'জ্যৈষ্ঠ' });
  });

  it('formats with Bengali numerals and the weekday', () => {
    // 21 August 2026 is a Friday.
    expect(formatBangla(utc(2026, 8, 21))).toBe('৬ ভাদ্র ১৪৩৩, শুক্রবার');
  });
});

describe('the download stamp', () => {
  it('names the day the file was pulled, in three calendars', () => {
    const stamp = downloadStamp(new Date(Date.UTC(2026, 7, 21, 9, 0)));
    expect(stamp.gregorian).toBe('21 August 2026, Friday');
    expect(stamp.bangla).toBe('৬ ভাদ্র ১৪৩৩, শুক্রবার');
    expect(stamp.iso).toBe('2026-08-21');
    // Umm al-Qura. Skipped rather than failed where the runtime has no
    // Islamic calendar — an export must not die over a decorative line.
    if (stamp.hijri) expect(stamp.hijri).toContain('1448');
  });

  it('reads the civil day in Dhaka, not in UTC', () => {
    // 20:30 UTC is 02:30 the next morning in Dhaka. A file pulled then belongs
    // to the 22nd, which is what the desk downloading it would write.
    const late = downloadStamp(new Date(Date.UTC(2026, 7, 21, 20, 30)));
    expect(late.iso).toBe('2026-08-22');
    expect(late.gregorian).toBe('22 August 2026, Saturday');
  });

  it('tags each line with the script it is written in', () => {
    // A PDF embeds one font per run, so a renderer has to know which face each
    // line needs — and drop a line it has no face for rather than draw
    // mojibake. Word ignores the tag and prints them all.
    const lines = stampLines(downloadStamp(new Date(Date.UTC(2026, 7, 21))));
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[0]).toEqual({ text: '21 August 2026, Friday', script: 'latin' });
    expect(lines[1]).toEqual({ text: '৬ ভাদ্র ১৪৩৩, শুক্রবার', script: 'bengali' });
    for (const l of lines) expect(['latin', 'bengali', 'arabic']).toContain(l.script);
  });

  it('keeps the Hijri date readable even without an Arabic face', () => {
    // The transliterated form is Latin and its own line, so a renderer with no
    // Arabic font still prints the Hijri date instead of losing it.
    const lines = stampLines(downloadStamp(new Date(Date.UTC(2026, 7, 21))));
    const latin = lines.filter((l) => l.script === 'latin');
    const arabic = lines.filter((l) => l.script === 'arabic');
    if (arabic.length) {
      expect(latin.some((l) => /1448/.test(l.text))).toBe(true);
      expect(arabic[0].text).toMatch(/[؀-ۿ]/);
    }
  });
});
