import { POLICIES } from '@/lib/data/policy/policies';

/**
 * Tags suggested from the story itself.
 *
 * The old extractor counted single lowercased words and took the top ten, so a
 * piece about the LNG terminal was tagged `gas`, `supply`, `power`, `said`.
 * Those are not subjects: they are the vocabulary every story on this site
 * shares, they make thin one-article tag pages, and as `keywords` on the
 * article's JSON-LD and OpenGraph they say nothing a search engine can use.
 *
 * Three changes, in the order they matter:
 *
 * 1. **Entities the publication actually writes about are recognised, not
 *    counted.** The regulators, operators, fuels and instruments below are the
 *    sector's own nouns; `Petrobangla` and `load shedding` are subjects in a
 *    way that `supply` is not. The policy register supplies its own short
 *    names, so a tag follows the library rather than being typed twice.
 * 2. **Phrases, not just words.** `LNG import` and `evening peak` carry the
 *    meaning; their halves do not.
 * 3. **Canonical casing is kept.** A tag renders on the page and ships in the
 *    article's structured data — `PGCB` should not reach a reader as `pgcb`.
 *
 * Suggestions only. The editor's own tags always win; this fills the field for
 * the 89 of 161 stories that were filed with none.
 */

/** Canonical spellings, matched case-insensitively and emitted as written. */
const SECTOR_TERMS: string[] = [
  // Institutions and operators.
  'Petrobangla', 'PGCB', 'BPDB', 'BERC', 'SREDA', 'EMRD', 'RPGCL', 'BAPEX',
  'Titas Gas', 'DESCO', 'DPDC', 'NESCO', 'WZPDCL', 'REB', 'NLDC',
  'Power Division', 'Energy Division', 'Power Cell', 'BIFPCL',
  // Fuels and carriers.
  'LNG', 'RLNG', 'HFO', 'HSD', 'Furnace oil', 'Diesel', 'Natural gas',
  'Coal', 'Nuclear', 'Solar', 'Wind', 'Hydropower', 'Renewable energy',
  'Condensate', 'Octane', 'Petrol', 'Kerosene', 'Jet fuel', 'LPG',
  // What the sector measures and argues about.
  'Load shedding', 'Power generation', 'Electricity generation', 'Peak demand',
  'Evening peak', 'Capacity charge', 'Power purchase agreement', 'Tariff',
  'Bulk tariff', 'Retail tariff', 'Subsidy', 'Transmission line', 'Substation',
  'Grid stability', 'System loss', 'Gas supply', 'Gas production',
  'Gas crisis', 'Energy security', 'Power plant', 'IPP', 'Quick rental',
  'Net metering', 'Rooftop solar', 'Energy efficiency', 'Electric vehicle',
  'Cross-border electricity trade', 'Interconnector', 'HVDC',
  // Named assets that recur in the coverage.
  'Bibiyana', 'Bheramara', 'Rooppur', 'Matarbari', 'Payra', 'Rampal',
  'Adani', 'Godda', 'Moheshkhali', 'Maheshkhali', 'Kutubdia', 'Ghorashal',
  'Summit', 'Excelerate', 'FSRU',
  // Places that appear as the subject of supply stories.
  'Dhaka', 'Chattogram', 'Chittagong', 'Khulna', 'Sylhet', 'Rajshahi',
  'Barisal', 'Rangpur', 'Mymensingh', 'Bangladesh', 'India', 'Nepal', 'Bhutan',
];

/** Short names from the policy library, so a tag follows the register. */
function policyTerms(): string[] {
  const out: string[] = [];
  for (const policy of POLICIES) {
    const short = policy.short?.trim();
    // Only the short forms: a full act title is a sentence, not a tag.
    if (short && short.length >= 3 && short.length <= 40) out.push(short);
  }
  return out;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'were', 'was', 'are', 'has', 'had',
  'will', 'would', 'shall', 'should', 'about', 'their', 'there', 'they', 'them', 'been', 'than',
  'more', 'most', 'some', 'many', 'other', 'into', 'over', 'both', 'only', 'such', 'very', 'even',
  'also', 'just', 'like', 'then', 'under', 'upon', 'through', 'after', 'before', 'said', 'says',
  'told', 'according', 'reported', 'while', 'during', 'between', 'against', 'which', 'when',
  'where', 'what', 'who', 'whom', 'been', 'being', 'per', 'cent', 'percent', 'year', 'years',
  'day', 'days', 'month', 'months', 'week', 'weeks', 'time', 'times', 'new', 'now', 'one', 'two',
  'three', 'its', 'his', 'her', 'our', 'out', 'can', 'could', 'may', 'might', 'must', 'not',
  'এবং', 'ও', 'কিন্তু', 'অথবা', 'জন্য', 'থেকে', 'করে', 'হয়ে', 'ছিল', 'আছে', 'হবে', 'করতে', 'করা',
]);

function plainText(html: string): string {
  return (html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A term counts only on a word boundary, so "IPP" does not match "shipping". */
function occurrences(haystack: string, term: string): number {
  const re = new RegExp(`(?<![\\p{L}\\d])${escapeRe(term)}(?![\\p{L}\\d])`, 'giu');
  return (haystack.match(re) ?? []).length;
}

/** Two- and three-word phrases that do not run across a stopword. */
function phraseCandidates(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const sentence of text.split(/[.!?;:\n]+/)) {
    const words = sentence
      .split(/[^\p{L}\p{N}'-]+/u)
      .map((w) => w.trim())
      .filter(Boolean);
    for (let i = 0; i < words.length; i += 1) {
      for (const size of [2, 3]) {
        if (i + size > words.length) break;
        const parts = words.slice(i, i + size);
        if (parts.some((w) => {
          const lw = w.toLowerCase();
          return STOPWORDS.has(lw) || MEASURE_WORDS.has(lw) || w.length < 3;
        })) continue;
        // A phrase of pure digits, or one that starts with one, is a figure.
        if (/^\d/.test(parts[0])) continue;
        const phrase = parts.join(' ');
        counts.set(phrase.toLowerCase(), (counts.get(phrase.toLowerCase()) ?? 0) + 1);
      }
    }
  }
  return counts;
}

/**
 * Months and ordinals, so "October 1st" is not offered as a subject. A date is
 * when the story happened, not what it is about.
 */
const DATEISH = new Set([
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]);

/**
 * Units and quantity words. They appear beside every figure this publication
 * prints, so they form phrases constantly — "Mmcfd Gas", "Next Six" — and none
 * of them is a subject.
 */
const MEASURE_WORDS = new Set([
  'mmcfd', 'mmscfd', 'mw', 'kw', 'gw', 'mwh', 'gwh', 'kwh', 'bcf', 'tcf',
  'mmbtu', 'btu', 'tk', 'taka', 'usd', 'crore', 'lakh', 'billion', 'million',
  'thousand', 'hundred', 'next', 'last', 'first', 'second', 'third', 'fourth',
  'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'total', 'around',
]);

function isDateish(phrase: string): boolean {
  const words = phrase.toLowerCase().split(' ');
  return words.some((w) => DATEISH.has(w))
    && words.every((w) => DATEISH.has(w) || /^\d+(st|nd|rd|th)?$/.test(w));
}

/** Title Case for a phrase we discovered rather than recognised. */
function titleCase(phrase: string): string {
  return phrase
    .split(' ')
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export interface KeywordOptions {
  /** How many tags to return. */
  limit?: number;
}

/**
 * Suggested tags for a story, best first.
 *
 * Known entities outrank discovered phrases, and anything in the headline
 * outranks the same thing found only in the body — a headline is the editor
 * telling us what the piece is about.
 */
export function suggestArticleKeywords(
  title: string,
  contentHtml: string,
  { limit = 10 }: KeywordOptions = {},
): string[] {
  const titleText = plainText(title);
  const bodyText = plainText(contentHtml);
  const haystack = `${titleText} ${bodyText}`.trim();
  if (!haystack) return [];

  const scored = new Map<string, { score: number; label: string }>();
  const add = (label: string, score: number) => {
    const key = label.toLowerCase();
    const prev = scored.get(key);
    if (!prev || score > prev.score) scored.set(key, { score, label });
  };

  // 1. Recognised entities. Longer names first, so "Titas Gas" is preferred to
  //    the "gas" inside it when both would otherwise match.
  const known = [...SECTOR_TERMS, ...policyTerms()].sort((a, b) => b.length - a.length);
  const claimed: string[] = [];
  for (const term of known) {
    const hits = occurrences(haystack, term);
    if (!hits) continue;
    // Skip a term wholly inside one already taken, so a story about Titas Gas
    // is not also tagged "gas".
    if (claimed.some((t) => t.toLowerCase().includes(term.toLowerCase()))) continue;
    claimed.push(term);
    const inTitle = occurrences(titleText, term) > 0;
    const words = term.trim().split(/\s+/).length;
    // Entities start well clear of any discovered phrase: they are subjects we
    // know this publication covers, not words that happened to repeat.
    add(term, 1000 + hits + (inTitle ? 500 : 0) + words * 50);
  }

  // 2. Discovered phrases, for the subjects no list anticipates.
  //
  // Longest first, and each one claims its own words: without that the same
  // subject arrives two and three times over — "Titas-28 Well Inaugurated"
  // beside "Titas-28 Well", "Mir Shahe Alam" beside "Mir Shahe" — which is
  // three tag pages for one thing and reads as padding.
  const phrases = [...phraseCandidates(haystack)].sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [phrase, hits] of phrases) {
    if (hits < 2 && occurrences(titleText, phrase) === 0) continue;
    if (isDateish(phrase)) continue;
    if (claimed.some((t) => t.toLowerCase().includes(phrase) || phrase.includes(t.toLowerCase()))) continue;
    claimed.push(phrase);
    const inTitle = occurrences(titleText, phrase) > 0;
    add(titleCase(phrase), hits * 2 + (inTitle ? 100 : 0) + phrase.split(' ').length * 5);
  }

  // 3. Single words, only from the headline, and only to fill a thin result.
  if (scored.size < limit) {
    for (const word of titleText.split(/[^\p{L}\p{N}'-]+/u)) {
      const w = word.trim();
      const lw = w.toLowerCase();
      // A month or a unit standing alone is not what the story is about.
      if (w.length < 4 || STOPWORDS.has(lw) || MEASURE_WORDS.has(lw) || DATEISH.has(lw) || /^\d/.test(w)) continue;
      if (claimed.some((t) => t.toLowerCase().includes(w.toLowerCase()))) continue;
      add(titleCase(w.toLowerCase()), 1);
    }
  }

  return [...scored.values()]
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((e) => e.label);
}
