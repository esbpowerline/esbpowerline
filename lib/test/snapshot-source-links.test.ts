import { describe, it, expect } from 'vitest';
import { sourceSiteFor } from '@/lib/data/grid/source-sites';
import { HOMEPAGE_DEFAULTS } from '@/lib/homepage-defaults';
import { localizeSnapshotLabel } from '@/lib/i18n/homepage-copy';

/**
 * The snapshot footer credits its sources, and each credit links to where that
 * agency publishes so a reader can check a figure rather than trust it.
 *
 * The failure this guards is quiet: the credits come from a settings string
 * split on bullets, so renaming an agency, translating it, or adding a new one
 * costs nothing at the call site and simply drops the link. The panel keeps
 * looking right and stops being checkable.
 */

const agenciesIn = (label: string) =>
  label
    .split(/\s*•\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    // The first segment is the live word, not an agency.
    .slice(1);

describe('snapshot source credits link to the official sites', () => {
  it('resolves every agency in the English default', () => {
    const agencies = agenciesIn(HOMEPAGE_DEFAULTS.snapshotLabel);
    expect(agencies.length).toBeGreaterThan(0);
    for (const agency of agencies) {
      expect(sourceSiteFor(agency), `${agency} has no official link`).toBeTruthy();
    }
  });

  it('resolves every agency in the Bengali translation too', () => {
    // The Bengali label transliterates the agency names, so it needs its own
    // keys — an English-only map would leave the bn footer as plain text.
    const agencies = agenciesIn(localizeSnapshotLabel(HOMEPAGE_DEFAULTS.snapshotLabel, 'bn'));
    expect(agencies.length).toBeGreaterThan(0);
    for (const agency of agencies) {
      expect(sourceSiteFor(agency), `${agency} has no official link`).toBeTruthy();
    }
  });

  it('points the two agencies whose www host does not resolve at the bare host', () => {
    // Checked 2026-09-07: www.pgcb.gov.bd and www.petrobangla.org.bd both fail
    // to connect. A "www." added later for tidiness would break both links.
    expect(sourceSiteFor('PGCB')).toBe('https://pgcb.gov.bd');
    expect(sourceSiteFor('Petrobangla')).toBe('https://petrobangla.org.bd');
  });

  it('sends NLDC to the hourly table the tiles are actually read from', () => {
    // Not the corporate homepage: ten of the twelve tiles come off this page,
    // so this is the one that lets a reader check them.
    expect(sourceSiteFor('NLDC')).toBe(
      'https://erp.powergrid.gov.bd/w/generations/view_generations',
    );
  });

  it('is case- and whitespace-insensitive, and invents nothing', () => {
    expect(sourceSiteFor('  bpdb  ')).toBe('https://www.bpdb.gov.bd');
    // An agency we have no verified URL for renders as plain text. Guessing one
    // would be a fabricated citation.
    expect(sourceSiteFor('Ministry of Power')).toBeUndefined();
    expect(sourceSiteFor('')).toBeUndefined();
  });

  it('only ever links over https', () => {
    for (const agency of ['NLDC', 'PGCB', 'Petrobangla', 'BPDB', 'SREDA', 'EMRD']) {
      expect(sourceSiteFor(agency)?.startsWith('https://'), agency).toBe(true);
    }
  });
});
