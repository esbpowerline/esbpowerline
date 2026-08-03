/**
 * Shared marquee speed for the two homepage tickers (commodities + DSE), which
 * render side by side in PublicMarketStrip.
 *
 * Both used a fixed animation duration, which makes the *visible* speed depend
 * on how much content happens to be in the track: at 20s vs 60s over tracks of
 * 3,199px and 5,213px, commodities scrolled at 160 px/s against DSE's 87 px/s —
 * nearly twice as fast, right next to each other. Item counts also vary at
 * runtime (the DSE list comes from /api/market/dse), so a fixed duration drifts.
 *
 * Deriving the duration from the measured track width instead pins both to one
 * speed and keeps them matched however many rows either one ends up with.
 */
export const TICKER_PX_PER_SECOND = 87;

/** Each track renders its items 4x; the animation travels exactly one group. */
export const TICKER_GROUP_FRACTION = 0.25;

/**
 * Per-ticker multiplier on the base speed.
 *
 * Locking both strips to the exact same px/s fixed the "one is racing" problem
 * but introduced a subtler one: two marquees moving in perfect lockstep read as
 * a single mechanical band rather than two independent feeds. Offsetting one by
 * 10% keeps them obviously related without looking glued together.
 *
 * DSE stays at the base rate — it is the reference, and this is the speed it has
 * always run at. Commodities takes the offset.
 */
export const TICKER_SPEED_FACTOR = {
  dse: 1,
  commodities: 0.9,
} as const;

/**
 * Milliseconds for one loop of a track of `scrollWidth`, at the shared speed
 * scaled by `speedFactor`. Falls back to 20s if the track has not been laid out
 * yet (width 0).
 */
export function tickerDurationMs(scrollWidth: number, speedFactor = 1): number {
  const distance = scrollWidth * TICKER_GROUP_FRACTION;
  if (!distance || !Number.isFinite(distance)) return 20000;
  return (distance / (TICKER_PX_PER_SECOND * speedFactor)) * 1000;
}
