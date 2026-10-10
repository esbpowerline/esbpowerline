import { describe, expect, it } from 'vitest';
import { dataPagesForArticle } from '@/lib/data-page-links';
import { decodeRouteParam } from '@/lib/route-param';

describe('dataPagesForArticle', () => {
  it('sends an LPG price story to /lpg-price', () => {
    const links = dataPagesForArticle('BERC Adjusts LPG Prices for September', '<p>12 kg cylinder</p>');
    expect(links.map((l) => l.href)).toEqual(['/lpg-price']);
  });

  it('matches autogas and Titas in the body', () => {
    const links = dataPagesForArticle('Gas prices', '<p>autogas rises; <b>Titas</b> system loss</p>');
    expect(links.map((l) => l.href)).toEqual(['/lpg-price', '/titas-gas']);
  });

  it('does not read LNG or a word containing the letters as LPG', () => {
    expect(dataPagesForArticle('LNG cargo arrives', '<p>Moheshkhali FSRU</p>')).toEqual([]);
    expect(dataPagesForArticle('Titase', '<p>helpful</p>')).toEqual([]);
  });
});

describe('decodeRouteParam', () => {
  it('decodes an encoded tag and leaves a malformed one alone', () => {
    expect(decodeRouteParam('Natural%20gas')).toBe('Natural gas');
    expect(decodeRouteParam('Natural gas')).toBe('Natural gas');
    expect(decodeRouteParam('100%')).toBe('100%');
  });
});
