import { POLICIES } from '@/lib/data/policy/policies';

/**
 * Contextual links from article prose to the policy library (SEO_FIX_LOG stage 6).
 *
 * The policy pages rank on page one for several queries and received almost no
 * internal links: articles that discuss the Electricity Act, the IEPMP or BERC
 * named them in plain text. This links the FIRST mention of each policy in an
 * article body to its page — once per policy, at most `MAX_LINKS` per article,
 * never inside an existing link, heading or the sanitised HTML's tags. The
 * names matched are the register's own `short` and `title` strings, nothing
 * invented; a policy the article does not name gets no link.
 */
const MAX_LINKS = 5;

type Pattern = { slug: string; re: RegExp; len: number };

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "The Electricity Act, 2018" also matches "Electricity Act 2018" and vice versa. */
function variants(name: string): string[] {
  const base = name.trim().replace(/^the\s+/i, '');
  const noComma = base.replace(/,\s*(\d{4})/g, ' $1');
  const withComma = base.replace(/\s+(\d{4})\b/g, ', $1');
  return [...new Set([base, noComma, withComma])].filter((v) => v.length >= 4);
}

const PATTERNS: Pattern[] = POLICIES.flatMap((p) =>
  [...variants(p.short), ...variants(p.title)].map((v) => ({
    slug: p.slug,
    // Word-bounded, case-insensitive, whitespace-tolerant.
    re: new RegExp(`(?<![\\w-])${escape(v).replace(/\\?\s+/g, '\\s+')}(?![\\w-])`, 'i'),
    len: v.length,
  })),
)
  // Longest names first so "BERC Tariff Orders" wins over "BERC".
  .sort((a, b) => b.len - a.len);

/**
 * Walk the HTML as tag / text segments. Text inside <a>, <h1>–<h6>, <code> or
 * <pre> is left alone. Returns the HTML with links inserted.
 */
export function linkPolicyMentions(html: string): string {
  if (!html) return html;
  const linked = new Set<string>();
  let depthNoLink = 0;
  const out: string[] = [];
  const segments = html.split(/(<[^>]+>)/g);

  for (const seg of segments) {
    if (seg.startsWith('<')) {
      const m = /^<\/?\s*([a-zA-Z0-9]+)/.exec(seg);
      const tag = m?.[1]?.toLowerCase();
      if (tag && /^(a|h[1-6]|code|pre)$/.test(tag)) {
        if (seg.startsWith('</')) depthNoLink = Math.max(0, depthNoLink - 1);
        else if (!seg.endsWith('/>')) depthNoLink += 1;
      }
      out.push(seg);
      continue;
    }
    if (depthNoLink > 0 || linked.size >= MAX_LINKS || !seg.trim()) {
      out.push(seg);
      continue;
    }
    let text = seg;
    for (const p of PATTERNS) {
      if (linked.has(p.slug) || linked.size >= MAX_LINKS) continue;
      const hit = p.re.exec(text);
      if (!hit) continue;
      const start = hit.index;
      const end = start + hit[0].length;
      text =
        text.slice(0, start) +
        `<a href="/energy-policy/${p.slug}" class="policy-link">${hit[0]}</a>` +
        text.slice(end);
      linked.add(p.slug);
    }
    out.push(text);
  }
  return out.join('');
}

/** Which policies an article names, for a "Related policy" list. */
export function policiesMentioned(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, ' ');
  const slugs: string[] = [];
  for (const p of PATTERNS) {
    if (slugs.includes(p.slug)) continue;
    if (p.re.test(text)) slugs.push(p.slug);
  }
  return slugs;
}
