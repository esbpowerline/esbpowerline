/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    // scripts/postcss-root-relative-px, installed as a local package. After
    // Tailwind so `text-[10px]` has become `font-size: 10px` by the time it
    // runs; before autoprefixer so the calc() it writes gets prefixed like any
    // other. Why it exists is at the top of its index.cjs. It is a bare name
    // and not './scripts/…' because Turbopack (the production bundler) evaluates
    // this config inside its own chunk directory and cannot resolve a relative
    // path from here — webpack dev accepted one on 2026-09-11 and `next build`
    // would have died on it.
    'postcss-root-relative-px': {},
    autoprefixer: {},
  },
};

export default config;
