import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const plugin = require('../../scripts/postcss-root-relative-px/index.cjs');

const run = (css: string) => postcss([plugin()]).process(css, { from: undefined }).css;

describe('postcss-root-relative-px', () => {
  it('rewrites the Tailwind arbitrary values that the hand pass could not reach', () => {
    expect(run('.text-\\[10px\\]{font-size:10px}')).toBe('.text-\\[10px\\]{font-size:calc(10 * var(--px))}');
    expect(run('.w-\\[240px\\]{width:240px}')).toBe('.w-\\[240px\\]{width:calc(240 * var(--px))}');
    expect(run('a{padding:4px 12px;gap:6px;border-radius:9999px}')).toBe(
      'a{padding:calc(4 * var(--px)) calc(12 * var(--px));gap:calc(6 * var(--px));border-radius:calc(9999 * var(--px))}',
    );
  });

  it('keeps decimals, negatives and px inside calc()', () => {
    expect(run('a{margin-top:-10px;letter-spacing:0.5px;max-width:calc(100% - 20px)}')).toBe(
      'a{margin-top:calc(-10 * var(--px));letter-spacing:calc(0.5 * var(--px));max-width:calc(100% - calc(20 * var(--px)))}',
    );
  });

  it('leaves hairlines, zero and effects alone', () => {
    const css = 'a{height:1px;width:0px;margin:-1px;border:2px solid;outline:3px solid;box-shadow:0 4px 12px #000;transform:translateY(-2px);backdrop-filter:blur(8px);background-position:10px 10px}';
    expect(run(css)).toBe(css);
  });

  it('does not wrap a value that is already root-relative, and never touches the root rules', () => {
    const css = ':root{--space-1:4px}html{font-size:clamp(10.67px, 1.0417vw, 16px)}@media (min-width:1536px){html{font-size:max(16px, 12px)}}.a{width:calc(4 * var(--px))}';
    expect(run(css)).toBe(css);
  });

  it('never sees at-rule params', () => {
    const css = '@media (min-width:1024px){.a{width:100px}}';
    expect(run(css)).toBe('@media (min-width:1024px){.a{width:calc(100 * var(--px))}}');
  });
});
