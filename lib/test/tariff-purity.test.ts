import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMPONENT_VERSIONS, INSTRUMENTS } from '@/lib/tariff/rules';

const TARIFF_DIR = path.resolve(__dirname, '../tariff');

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return tsFiles(full);
    return e.isFile() && e.name.endsWith('.ts') ? [full] : [];
  });
}

/**
 * The architectural boundary, asserted rather than agreed.
 *
 * `lib/tariff/` is pure so that the same arithmetic runs in a route handler, a
 * test, a script and one day a React Native app with identical output — and so
 * that the engine can be extracted to a package later by moving a directory.
 * A convention that is only written in a comment is one `import` away from
 * being untrue, and the import that breaks it will look entirely reasonable in
 * review ("just needs the current date from the request").
 */
describe('the pure core stays pure', () => {
  const files = tsFiles(TARIFF_DIR);

  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  const FORBIDDEN: Array<[RegExp, string]> = [
    [/@prisma\/client|from ['"]prisma|lib\/prisma/, 'Prisma'],
    [/from ['"]react['"]|from ['"]react\//, 'React'],
    [/from ['"]next(\/|['"])/, 'Next.js'],
    [/@supabase\//, 'Supabase'],
    [/from ['"]server-only['"]/, 'server-only'],
    [/\bfetch\s*\(|from ['"]node:https?['"]|\bXMLHttpRequest\b/, 'network access'],
    [/from ['"]node:fs['"]|require\(['"]fs['"]\)/, 'the filesystem'],
    [/anthropic|openai/i, 'a model provider'],
  ];

  for (const file of files) {
    const rel = path.relative(TARIFF_DIR, file);
    const src = readFileSync(file, 'utf8');
    for (const [pattern, what] of FORBIDDEN) {
      it(`lib/tariff/${rel} does not reach for ${what}`, () => {
        expect(src, `${rel} must not depend on ${what}`).not.toMatch(pattern);
      });
    }
  }

  it('imports nothing outside lib/tariff except its own modules', () => {
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      const imports = [...src.matchAll(/from ['"]([^'"]+)['"]/g)].map((m) => m[1]);
      for (const spec of imports) {
        const ok = spec.startsWith('@/lib/tariff/') || spec.startsWith('./') || spec.startsWith('../');
        expect(ok, `${path.relative(TARIFF_DIR, file)} imports "${spec}"`).toBe(true);
      }
    }
  });

  it('does not read the clock — a rule engine must be deterministic', () => {
    // `Date.now()` in resolution would make "what governs June 2026" depend on
    // when you asked, which is exactly the confusion the two temporal axes exist
    // to prevent. The caller supplies `asOf`.
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      expect(src, path.relative(TARIFF_DIR, file)).not.toMatch(/Date\.now\(\)|new Date\(\)/);
    }
  });
});

/**
 * The rule set must never contain a rate that cites nothing. This is the
 * structural version of rule 5 of the data doctrine — every day names its
 * source document — applied to tariffs.
 */
describe('rule-set integrity', () => {
  it('every component belongs to an instrument in the set', () => {
    const ids = new Set(INSTRUMENTS.map((i) => i.id));
    for (const c of COMPONENT_VERSIONS) expect(ids.has(c.instrumentId), c.id).toBe(true);
  });

  it('every instrument names a hashed, archived source document', () => {
    for (const i of INSTRUMENTS) {
      expect(i.evidence.contentSha256, i.id).toMatch(/^[0-9a-f]{64}$/);
      expect(i.evidence.sourceUrl, i.id).toMatch(/^https:\/\//);
      expect(i.evidence.archivePath, i.id).toContain('Grid-Explorer');
      expect(i.evidence.locator, i.id).toBeTruthy();
    }
  });

  it('every instrument distinguishes issue, publication and retrieval', () => {
    for (const i of INSTRUMENTS) {
      expect(i.issuedOn, i.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(i.publishedOn, i.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(i.retrievedAt, i.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(i.publishedOn >= i.issuedOn, `${i.id} published before it was issued`).toBe(true);
    }
  });

  it('no instrument is stored as CURRENT — currency is derived, never written down', () => {
    for (const i of INSTRUMENTS) expect(i.lifecycle).not.toBe('CURRENT');
  });

  it('every amendment relationship points both ways', () => {
    const byId = new Map(INSTRUMENTS.map((i) => [i.id, i]));
    for (const i of INSTRUMENTS) {
      for (const other of i.amendedBy ?? []) {
        expect(byId.get(other)?.amends, `${other} should declare it amends ${i.id}`).toContain(i.id);
      }
      for (const other of i.supersededBy ?? []) {
        expect(byId.get(other)?.supersedes, `${other} should declare it supersedes ${i.id}`).toContain(i.id);
      }
    }
  });

  it('every superseded component names its replacement, and the replacement exists', () => {
    const ids = new Set(COMPONENT_VERSIONS.map((c) => c.id));
    for (const c of COMPONENT_VERSIONS) {
      if (!c.supersededBy) continue;
      expect(ids.has(c.supersededBy.componentVersionId), c.id).toBe(true);
      // A closed knowledge interval and a supersession record must agree.
      expect(c.knowledge.knownUntil, `${c.id} is superseded but still believed`).not.toBeNull();
      expect(c.knowledge.knownUntil).toBe(c.supersededBy.on);
    }
  });

  it('every UNKNOWN component states a reason and what would settle it', () => {
    for (const c of COMPONENT_VERSIONS) {
      if (c.kind === 'ENERGY_SLAB' || c.kind === 'DEMAND_CHARGE') continue;
      expect(c.reason, c.id).toBeTruthy();
      expect(c.wouldBeSettledBy, c.id).toBeTruthy();
    }
  });

  it('every knowledge interval says what made the rule knowable', () => {
    for (const c of COMPONENT_VERSIONS) expect(c.knowledge.basis, c.id).toBeTruthy();
  });

  it('no two components of the same kind overlap on both axes', () => {
    const key = (c: (typeof COMPONENT_VERSIONS)[number]) =>
      [c.utility, c.category, c.meterType, c.phase, c.kind === 'ENERGY_SLAB' ? `slab${c.slabIndex}` : c.kind].join('|');

    const groups = new Map<string, typeof COMPONENT_VERSIONS[number][]>();
    for (const c of COMPONENT_VERSIONS) {
      const g = groups.get(key(c)) ?? [];
      g.push(c);
      groups.set(key(c), g);
    }

    const overlaps = (a: string, aEnd: string | null, b: string, bEnd: string | null) =>
      a < (bEnd ?? '9999-99') && b < (aEnd ?? '9999-99');

    for (const [k, list] of groups) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const x = list[i];
          const y = list[j];
          const billingOverlap = overlaps(
            x.billingValidity.from, x.billingValidity.to,
            y.billingValidity.from, y.billingValidity.to,
          );
          const knowledgeOverlap = overlaps(
            x.knowledge.knownFrom, x.knowledge.knownUntil,
            y.knowledge.knownFrom, y.knowledge.knownUntil,
          );
          expect(
            billingOverlap && knowledgeOverlap,
            `${k}: ${x.id} and ${y.id} overlap on both axes — resolution would be ambiguous`,
          ).toBe(false);
        }
      }
    }
  });
});
