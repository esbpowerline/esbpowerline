/**
 * PostCSS: make every px-authored LAYOUT value root-relative.
 *
 * `font-size: 10px` → `font-size: calc(10 * var(--px))`, and the same for widths,
 * spacing, offsets and radii. `--px` is defined in app/globals.css: literally 1px
 * below 1024px, and 1/16rem from 1024px up, so N px means N px at a 16px root and
 * scales with the root above it. See "--px" and "FLUID ROOT SCALE" there for the
 * design; this file is the enforcement.
 *
 * Why a build step and not a hand edit. globals.css was converted by hand
 * (2026-09-09, 235 hunks). What that pass could not reach is Tailwind: on
 * 2026-09-11 there were ~1,200 arbitrary values — 380× `text-[10px]`, 266×
 * `text-[11px]`, 143× `text-[9px]`, `w-[240px]`, `min-w-[120px]` — across 139
 * component files, plus 625 raw px in staff-surface.css. Every one of them is a
 * label or a box that holds still while the rem box beside it grows, which is
 * precisely how a 154px slot came to clip a 159px label on a 2560px display.
 * Rewriting the compiled CSS catches all of it, including the next `text-[10px]`
 * someone types, and keeps the source in the units it was designed in.
 *
 * Deliberately untouched, because they are effects and hairlines, not layout:
 * border and outline widths, box-shadow, text-shadow, filter, backdrop-filter,
 * transform, background, stroke, and any property not on the list below. `0px`
 * and `1px` are left alone everywhere — a 1px rule stays a crisp 1px at every
 * size. At-rule params (`@media (min-width: 1024px)`) are never declarations, so
 * they are never visited. A declaration that already uses `var(--px)` is skipped
 * so the hand-converted rules are not wrapped twice.
 *
 * Custom properties (`--radius: 8px`) are not rewritten: some hold effects
 * (`--tw-ring-offset-width`), and the layout ones in globals.css are converted at
 * their definition already.
 */

const LAYOUT_PROPS = new Set([
  'font-size',
  'line-height',
  'letter-spacing',
  'width', 'min-width', 'max-width',
  'height', 'min-height', 'max-height',
  'inline-size', 'min-inline-size', 'max-inline-size',
  'block-size', 'min-block-size', 'max-block-size',
  'gap', 'row-gap', 'column-gap',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline', 'padding-inline-start', 'padding-inline-end',
  'padding-block', 'padding-block-start', 'padding-block-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-inline', 'margin-inline-start', 'margin-inline-end',
  'margin-block', 'margin-block-start', 'margin-block-end',
  'top', 'right', 'bottom', 'left',
  'inset', 'inset-inline', 'inset-inline-start', 'inset-inline-end',
  'inset-block', 'inset-block-start', 'inset-block-end',
  'flex-basis', 'flex',
  'grid-template-columns', 'grid-template-rows', 'grid-auto-columns', 'grid-auto-rows',
  'border-radius',
  'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'border-start-start-radius', 'border-start-end-radius',
  'border-end-start-radius', 'border-end-end-radius',
  'text-indent',
  'scroll-margin', 'scroll-margin-top', 'scroll-margin-bottom',
  'scroll-padding', 'scroll-padding-top', 'scroll-padding-bottom',
]);

// The root's own font-size is where --px comes FROM. Rewriting `html {
// font-size: clamp(10.67px, …, 16px) }` into rem terms still computes (rem on
// the root element means the initial 16px) but makes the scale read as
// circular, so those rules are left exactly as written.
const ROOT_SELECTOR = /^(?:html|:root)\b/;

// A px length that is not 0px or 1px, not part of a longer token (`10px` inside
// `calc(10px…)` is fine to match; `--px` and `1.5pxfoo` are not), and not the
// `1px` inside a `var(--px)` fallback. Negative values keep their sign.
const PX = /(?<![\w.-])(-?(?:\d*\.\d+|\d+))px(?![\w-])/g;

function rewrite(value) {
  return value.replace(PX, (m, n) => {
    const num = Number(n);
    if (num === 0 || num === 1 || num === -1) return m;
    return `calc(${n} * var(--px))`;
  });
}

module.exports = () => ({
  postcssPlugin: 'root-relative-px',
  Declaration(decl) {
    if (!LAYOUT_PROPS.has(decl.prop)) return;
    if (!decl.value.includes('px')) return;
    if (decl.value.includes('var(--px)')) return;
    const selector = decl.parent && decl.parent.selector;
    if (selector && selector.split(',').some((s) => ROOT_SELECTOR.test(s.trim()))) return;
    const next = rewrite(decl.value);
    if (next !== decl.value) decl.value = next;
  },
});
module.exports.postcss = true;
module.exports.rewrite = rewrite;
module.exports.LAYOUT_PROPS = LAYOUT_PROPS;
