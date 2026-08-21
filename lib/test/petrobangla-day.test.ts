import { describe, it, expect } from 'vitest';
import {
  archiveGasLng,
  archiveGasTotal,
  loadPetrobanglaForEnergyDay,
} from '@/lib/data/grid/petrobangla-day.server';

/**
 * Which Petrobangla document covers which energy day.
 *
 * This was the most damaging defect in the comparison, because it was silent:
 * `{iso}.json` was read directly, and 2,149 of the 2,297 files are named for
 * the day the report was FILED — the morning after the 08:00–08:00 window they
 * cover. The gas-field comparison was showing the previous day's production
 * under the right heading, and mixing conventions, so a 2026 day resolved
 * correctly while a 2023 day did not.
 *
 * These read the real archive. They are cheap — three files — and they are
 * pinned to real dates on purpose: the bug was invisible to any test built on
 * a fixture, because a fixture would have been written with the convention the
 * author had in mind.
 */

describe('resolving a Petrobangla day', () => {
  it('takes the window the document says it covers, not the one the filename implies', async () => {
    // 2023-07-19.json is labelled "18-19 July, 2023" and covers the window that
    // OPENED on the 18th. That is energy day 2023-07-18.
    const found = await loadPetrobanglaForEnergyDay('2023-07-18');
    expect(found).not.toBeNull();
    expect(found!.source).toBe('2023-07-19');
    expect(found!.filedUnderNextDay).toBe(true);
    expect(found!.doc.report?.report_date_start).toBe('2023-07-18');
    expect(archiveGasTotal(found!.doc)).toBeCloseTo(3024.3, 1);
  });

  it('does not return the neighbouring day that the old lookup would have', async () => {
    // The file literally named 2023-07-18.json covers 2023-07-17 and totals
    // 3029.9. Reading it for 2023-07-18 was the bug.
    const found = await loadPetrobanglaForEnergyDay('2023-07-18');
    expect(archiveGasTotal(found!.doc)).not.toBeCloseTo(3029.9, 1);

    const previous = await loadPetrobanglaForEnergyDay('2023-07-17');
    expect(previous!.source).toBe('2023-07-18');
    expect(archiveGasTotal(previous!.doc)).toBeCloseTo(3029.9, 1);
  });

  it('handles the newer convention, where the file is named for its own window', async () => {
    // Everything `ingest_bridge.py` writes keys the archive by the gas-day
    // start, so the filename already IS the energy day.
    const found = await loadPetrobanglaForEnergyDay('2026-08-18');
    expect(found).not.toBeNull();
    expect(found!.source).toBe('2026-08-18');
    expect(found!.filedUnderNextDay).toBe(false);
    expect(found!.doc.report?.report_date_start).toBe('2026-08-18');
  });

  it('returns nothing rather than a nearby day when no document covers the window', async () => {
    // The archive starts in 2020; nothing covers 2015, and inventing a
    // neighbour would be worse than a dash.
    expect(await loadPetrobanglaForEnergyDay('2015-06-01')).toBeNull();
    expect(await loadPetrobanglaForEnergyDay('not-a-date')).toBeNull();
  });
});

describe('the figures the archive publishes', () => {
  it('reads the printed grand total and the R-LNG subtotal', async () => {
    const found = await loadPetrobanglaForEnergyDay('2022-09-22');
    expect(found).not.toBeNull();
    const total = archiveGasTotal(found!.doc);
    const lng = archiveGasLng(found!.doc);
    expect(total).toBeCloseTo(2779.3, 1);
    expect(lng).toBeCloseTo(482.9, 1);
    // Domestic is the remainder, and it is what the sheet prints as 2,296.
    expect(total! - lng!).toBeCloseTo(2296.4, 1);
  });

  it('treats a missing or zero total as no figure', () => {
    expect(archiveGasTotal({})).toBeNull();
    expect(archiveGasTotal({ production: { grand_total: { gas_mmcfd: 0 } } })).toBeNull();
    expect(archiveGasTotal({ production: { grand_total: { gas_mmcfd: null } } })).toBeNull();
    expect(archiveGasLng({ production: { subtotals: [] } })).toBeNull();
  });
});

/**
 * The printed header is not the window.
 *
 * `report_date_start` and `gas_day_start` sit side by side in every document
 * and agree on all but 89 of the 2,297. Where they part it is the header that
 * is wrong — it is transcribed from the line at the top of the PDF, and that
 * line carries Petrobangla's own typos. The resolver preferred it, which cost
 * 84 real days and invented four that no report covers.
 *
 * Pinned to real dates, like the rest of this file: a fixture would have been
 * written with whichever convention the author already believed.
 */
describe('choosing between the two date fields', () => {
  it('reads the window, not the month-opening header that names the filing day', async () => {
    // 2026-06-01.json heads itself "2026-06-01" but its window opened on
    // 31 May. Reading the header put this document on 1 June, on top of
    // 2026-06-02.json, which genuinely covers 1 June.
    const may31 = await loadPetrobanglaForEnergyDay('2026-05-31');
    expect(may31).not.toBeNull();
    expect(may31!.source).toBe('2026-06-01');
    expect(may31!.doc.report?.gas_day_start).toBe('2026-05-31');
    expect(may31!.doc.report?.report_date_start).toBe('2026-06-01');

    const jun1 = await loadPetrobanglaForEnergyDay('2026-06-01');
    expect(jun1!.source).toBe('2026-06-02');
    // Two different documents, so two different days of production.
    expect(archiveGasTotal(jun1!.doc)).not.toBe(archiveGasTotal(may31!.doc));
  });

  it('does not file a document under a header that is off by a year', async () => {
    // 2025-08-01.json heads itself 2024-08-01. Trusting that published a gas
    // day in the middle of 2024 that no report describes, and left 2025-07-31
    // looking absent.
    const jul31 = await loadPetrobanglaForEnergyDay('2025-07-31');
    expect(jul31).not.toBeNull();
    expect(jul31!.source).toBe('2025-08-01');
    expect(jul31!.doc.report?.gas_day_start).toBe('2025-07-31');

    // And nothing claims the phantom day the header pointed at.
    const phantom = await loadPetrobanglaForEnergyDay('2024-08-01');
    expect(phantom?.doc.report?.gas_day_start ?? null).not.toBe('2025-07-31');
  });
});
