import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The phone Grid Explorer's design system, enforced (2026-11-12).
 *
 * The system was written down in app/grid-phone.css from the start, but each
 * screen was built by a different hand and drifted: 15 text sizes, six corner
 * radii, six chart heights. The owner's word for the result was "mediocre".
 * These checks fail the build when a value off the scale is added, so the
 * next section cannot invent one.
 */
const TYPE = new Set([11, 12, 13, 15, 17, 22, 34, 44]);
const RADII = new Set([0, 1, 2, 3, 4, 8, 12, 20, 999]);

const css = readdirSync('app')
  .filter((f) => /^grid-phone.*\.css$/.test(f))
  .map((f) => [f, readFileSync(join('app', f), 'utf8')] as const);
const tsx = readdirSync('components/news/grid-phone')
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => [f, readFileSync(join('components/news/grid-phone', f), 'utf8')] as const);

describe('phone Grid Explorer design system', () => {
  it('uses only the type scale', () => {
    const off: string[] = [];
    for (const [f, s] of css) for (const m of s.matchAll(/font-size:\s*([0-9.]+)px/g)) if (!TYPE.has(Number(m[1]))) off.push(`${f}: ${m[0]}`);
    for (const [f, s] of tsx) for (const m of s.matchAll(/fontSize:\s*([0-9.]+)/g)) if (!TYPE.has(Number(m[1]))) off.push(`${f}: ${m[0]}`);
    expect(off).toEqual([]);
  });

  it('uses only the radius scale', () => {
    const off: string[] = [];
    for (const [f, s] of css) for (const m of s.matchAll(/border-radius:\s*([0-9.]+)px\s*[;}]/g)) if (!RADII.has(Number(m[1]))) off.push(`${f}: ${m[0]}`);
    expect(off).toEqual([]);
  });
});
