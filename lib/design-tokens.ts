/**
 * Design tokens — the non-colour half of the system.
 *
 * Colour is already done properly in lib/data/grid/chart-palette.ts: every
 * value justified, validated, documented in place. This file holds the same
 * discipline for type, spacing and shape, and the CSS custom properties in
 * app/globals.css (`DESIGN TOKENS` block) are its rendered form — change them
 * together or not at all.
 *
 * The scale exists because the audit measured the opposite of a system:
 * ~220px of stacked chrome before the first headline, live grid telemetry set
 * at 9–10px in a rail beneath commodity prices set larger, provenance chips at
 * ~8px. Reference points for rigour (not imitation): FT, Nikkei Asia, Ember,
 * Carbon Brief, Our World in Data.
 */

/** Type scale, px. One scale, no off-scale sizes in new work. */
export const TYPE_SCALE = [11, 12.5, 14, 16, 19, 24, 32, 44] as const;

/** Spacing scale, px — 4-base. Layout gaps come from here, not ad-hoc margins. */
export const SPACE_SCALE = [4, 8, 12, 16, 24, 32, 48, 64] as const;

/** Container widths, px: article measure / section / data views. */
export const CONTAINERS = { article: 680, section: 1080, data: 1280 } as const;

/**
 * Radii: controls get 4px; editorial surfaces get none. Hairline rules over
 * shadows — elevation is not part of this system's vocabulary.
 */
export const RADII = { control: 4, editorial: 0 } as const;

/** Motion: one duration, one easing, nothing animates a data update. */
export const MOTION = { durationMs: 150, easing: 'ease-out' } as const;

export const PUBLICATION_WORDMARK = 'ESB POWERLINE';
export const PUBLICATION_TAGLINE = 'Safe Energy · Safe Nation';
