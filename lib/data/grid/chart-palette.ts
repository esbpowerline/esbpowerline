/**
 * The one place a chart colour is decided.
 *
 * Before this file the grid charts carried 14 hand-picked hexes spread across
 * `PowerGridExplorer.tsx` and the `power-grid/` components, with near-duplicates
 * doing different jobs — three purples, two oranges, two ambers, two greens. The
 * worst of it was measurable: Gas `#0ea5e9` and Hydro `#06b6d4` sat 6.4 ΔE apart
 * (OKLab x100), which is two indistinguishable cyans on the first and fourth
 * largest fuels in the mix.
 *
 * Every value below was checked with a contrast/CVD validator against the
 * surfaces these charts actually render on (`--card`: `#ffffff` light,
 * `#18212f` dark) rather than the generic defaults. Measured results are
 * recorded beside each block so the next person can re-run rather than re-argue.
 *
 * WHY THIS IS NOT IN THE PAYLOAD
 * ------------------------------
 * `generationData[].color` exists in the stored release payloads and is hashed
 * by `payloadChecksum`. Restyling a chart must never alter a data checksum, so
 * the payload colour is frozen legacy: read colour from here, keyed by fuel
 * name, and leave the payload untouched. `resolveFuelColor` is the accessor.
 */

export type ChartMode = 'light' | 'dark';

/** A colour with a step chosen for each surface, not an automatic flip. */
export interface ModalColor {
  readonly light: string;
  readonly dark: string;
}

/**
 * Fuel colours, keyed by the name PGCB publishes.
 *
 * The mnemonics are deliberate — gas blue, oil orange, diesel red, sun yellow,
 * water aqua, wind green — because they are what a power-sector reader already
 * expects, and a chart that fights that costs more than it gains.
 *
 * The honest limit: eight categories is past what colour alone can separate. An
 * exhaustive search over all 40,320 orderings of these eight hues found only 160
 * that clear both the CVD floor and the normal-vision floor on adjacent pairs,
 * and every one of them assigns colours that mislead — Gas red, or Imports green
 * and Wind pink. Holding just Gas=blue and Solar=yellow leaves exactly two, both
 * of which paint Imports green. So the trade is made in the open: keep the
 * mnemonics, and never let colour be the only thing carrying identity.
 *
 * That makes the direct label a hard requirement, not a nicety. See
 * FUEL_IDENTITY_RELIEF below.
 *
 * Measured (adjacent pairs, FUEL_DISPLAY_ORDER):
 *   light on #ffffff - lightness band PASS, chroma floor PASS
 *   dark  on #18212f - lightness band PASS, chroma floor PASS, contrast PASS
 * The current in-repo palette fails both the lightness band (Solar `#eab308`)
 * and the chroma floor (Coal `#64748b` reads as gridline grey) in light mode.
 */
export const FUEL_COLORS: Readonly<Record<string, ModalColor>> = {
  Gas: { light: '#2a78d6', dark: '#3987e5' },
  Coal: { light: '#4a3aa7', dark: '#9085e9' },
  HFO: { light: '#eb6834', dark: '#d95926' },
  'HSD (Diesel)': { light: '#e34948', dark: '#e66767' },
  Hydro: { light: '#1baf7a', dark: '#199e70' },
  Solar: { light: '#eda100', dark: '#c98500' },
  Wind: { light: '#008300', dark: '#008300' },
  Imports: { light: '#e87ba4', dark: '#d55181' },
} as const;

/**
 * PGCB renamed this fuel with the 2025 layout and the archive carries both
 * spellings, so colour lookup has to accept either — same rule the completeness
 * check in `types.ts` already applies.
 */
const FUEL_NAME_ALIASES: Readonly<Record<string, string>> = {
  HSD: 'HSD (Diesel)',
  Diesel: 'HSD (Diesel)',
  'Furnace Oil': 'HFO',
  // The energy-curve sheet folds the two oils into one band on layouts that do
  // not split them; it takes the HFO colour because HFO is the bulk of it.
  'Oil (HFO+HSD)': 'HFO',
} as const;

/**
 * Render order for the fuel mix: fossil heaviest-first, then renewables, then
 * imports. Charts should follow this rather than payload order so the sequence
 * of colours is stable from one report layout to the next.
 */
export const FUEL_DISPLAY_ORDER = [
  'Gas',
  'Coal',
  'HFO',
  'HSD (Diesel)',
  'Hydro',
  'Solar',
  'Wind',
  'Imports',
] as const;

/**
 * Because the eight fuel hues cannot be told apart by colour alone (see above),
 * any chart drawing more than four of them must name each one in place — a
 * direct label on the mark, or a visible legend row paired with the value. A
 * tooltip does not count: it is not there until you hover, and it is not there
 * at all in print or on the PDF export.
 */
export const FUEL_IDENTITY_RELIEF = 'direct-label-required' as const;

/** Fallback for a fuel the archive introduces that this map has not met yet. */
const UNKNOWN_FUEL: ModalColor = { light: '#898781', dark: '#898781' };

/**
 * Colour for a fuel row. Pass the payload's `name`; the payload's `color` is
 * intentionally ignored so a restyle cannot change a release checksum.
 */
export function resolveFuelColor(name: string, mode: ChartMode = 'light'): string {
  const canonical = FUEL_NAME_ALIASES[name] ?? name;
  return (FUEL_COLORS[canonical] ?? UNKNOWN_FUEL)[mode];
}

/** True when the fuel has a colour of its own rather than the unknown grey. */
export function isKnownFuel(name: string): boolean {
  return (FUEL_NAME_ALIASES[name] ?? name) in FUEL_COLORS;
}

/**
 * The payload's fuel name resolved to the one this module keys on — 'HSD' to
 * 'HSD (Diesel)', and so on. Needed by anything that orders fuels by
 * FUEL_DISPLAY_ORDER: the archive writes the short spellings, so matching
 * against that list without normalising silently drops the fuel from the
 * ordering, and with it the column or series it was meant to produce.
 *
 * An unrecognised name is returned unchanged rather than mapped to a
 * placeholder, so a fuel PGCB adds later still carries its own label.
 */
export function canonicalFuelName(name: string): string {
  return FUEL_NAME_ALIASES[name] ?? name;
}

/**
 * Slots for series that are not fuels — gas companies, distribution zones,
 * scenario arms. Assign in order and never cycle: a ninth series folds into
 * "Other" or the chart becomes small multiples.
 *
 * Measured on adjacent pairs: worst CVD ΔE 9.1 light / 8.4 dark (>= 8 target),
 * worst normal-vision ΔE 19.6 light / 19.3 dark (>= 15 floor).
 */
export const CATEGORICAL_SLOTS: readonly ModalColor[] = [
  { light: '#2a78d6', dark: '#3987e5' },
  { light: '#eb6834', dark: '#d95926' },
  { light: '#1baf7a', dark: '#199e70' },
  { light: '#eda100', dark: '#c98500' },
  { light: '#e87ba4', dark: '#d55181' },
  { light: '#008300', dark: '#008300' },
  { light: '#4a3aa7', dark: '#9085e9' },
  { light: '#e34948', dark: '#e66767' },
] as const;

/** Nth categorical series. Past the last slot the caller must fold, not wrap. */
export function categoricalSlot(index: number, mode: ChartMode = 'light'): string {
  const slot = CATEGORICAL_SLOTS[index];
  return slot ? slot[mode] : UNKNOWN_FUEL[mode];
}

/**
 * Status colours, reserved. Never reuse one of these for a data series — a
 * reader who has learnt that this red means "critical" should not meet it again
 * as a fuel. Each ships with an icon and a label; on the light surface warning
 * and serious sit below 3:1 by design, so colour never carries the state alone.
 */
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

/**
 * Chart chrome. Gridlines and axes stay recessive so the data is the darkest
 * thing in the frame; ink tokens are for text, which never wears a series
 * colour — a colour chip beside the label carries identity instead.
 */
export const CHART_INK = {
  gridline: { light: '#e1e0d9', dark: '#2c2c2a' },
  axis: { light: '#c3c2b7', dark: '#383835' },
  muted: { light: '#898781', dark: '#898781' },
  primaryInk: { light: '#0b0b0b', dark: '#ffffff' },
  secondaryInk: { light: '#52514e', dark: '#c3c2b7' },
  surface: { light: '#ffffff', dark: '#18212f' },
} as const satisfies Record<string, ModalColor>;

/**
 * The two load-curve series. Generation takes categorical slot 1 so it matches
 * the fuel mix's dominant colour; demand takes the yellow slot. Both are named
 * here rather than at the call site so the hover panel and the line itself
 * cannot drift apart, which is exactly how demand once ended up printed in
 * amber while its line was yellow.
 */
export const LOAD_CURVE_COLORS = {
  generation: { light: '#2a78d6', dark: '#3987e5' },
  demand: { light: '#eda100', dark: '#c98500' },
} as const satisfies Record<string, ModalColor>;

/**
 * The gold of the 19:30 half-hour sample marked in the Overview chart's prose. It is a
 * label colour, not a series fill, and was a raw literal inside the Overview block
 * until that block moved under power-grid/ (2026-11-02).
 */
export const SAMPLE_1930_COLOR = '#c98a1a';

/** Pick the right step of a modal colour without threading `mode` everywhere. */
export function pick(color: ModalColor, mode: ChartMode = 'light'): string {
  return color[mode];
}

/**
 * Named series colours for the charts that plot something other than fuel.
 *
 * Eleven components carried 155 raw hex literals — Tailwind's default ramp,
 * not this file's — and none of them had been through the CVD or contrast
 * validation recorded above. Two of those literals were `#0ea5e9` and
 * `#06b6d4`, which is precisely the pair this file opens by documenting: 6.4
 * ΔE apart, two indistinguishable cyans. The palette declared itself "the one
 * place a chart colour is decided" and the largest charts in the product had
 * never asked it.
 *
 * Every entry below resolves to a `CATEGORICAL_SLOTS` index, so these inherit
 * the validation rather than adding a new unvalidated set. Slots repeat across
 * charts on purpose — what has to be distinguishable is the series *within one
 * frame*, and no chart here draws more than four. Where two series appear
 * together their slots differ; that is the invariant the test asserts.
 */
const SERIES_SLOT = {
  // Macro trends — oil
  brent: 0,
  retailDiesel: 2,
  // Macro trends — gas
  globalLng: 6,
  bdGasTariff: 3,
  // Macro trends — budget vs build-out
  powerBudget: 6,
  installedCapacity: 0,
  peakGeneration: 1,
  // Macro trends — supply mix
  domesticGas: 0,
  importedLng: 6,
  // Longitudinal — transmission by voltage
  kv400: 6,
  kv230: 0,
  kv132: 2,
  // Longitudinal — additions
  gridLinesAdded: 0,
  genCapacityAdded: 1,
  // Longitudinal — indexed growth
  budgetIndex: 3,
  genCapacityIndex: 6,
  peakDemandIndex: 1,
  transmissionIndex: 2,
  // Renewables
  renewableShare: 6,
} as const;

export type SeriesName = keyof typeof SERIES_SLOT;

/** A validated colour for a named non-fuel series. */
export function seriesColor(name: SeriesName, mode: ChartMode = 'light'): string {
  return CATEGORICAL_SLOTS[SERIES_SLOT[name]][mode];
}

/**
 * The light-mode value, for the many call sites that interpolate a colour into
 * a style prop or an SVG attribute and have no `mode` to hand. Charts render
 * on the card surface, which the palette validated against in light mode.
 */
export const SERIES_COLORS = Object.fromEntries(
  (Object.keys(SERIES_SLOT) as SeriesName[]).map((k) => [k, seriesColor(k)]),
) as Record<SeriesName, string>;

/** Groups that share a frame. Each group's slots must be distinct. */
export const SERIES_GROUPS: Readonly<Record<string, readonly SeriesName[]>> = {
  macroOil: ['brent', 'retailDiesel'],
  macroGas: ['globalLng', 'bdGasTariff'],
  macroBudget: ['powerBudget', 'installedCapacity', 'peakGeneration'],
  macroSupplyMix: ['domesticGas', 'importedLng'],
  transmissionVoltage: ['kv400', 'kv230', 'kv132'],
  additions: ['gridLinesAdded', 'genCapacityAdded'],
  indexedGrowth: ['budgetIndex', 'genCapacityIndex', 'peakDemandIndex', 'transmissionIndex'],
} as const;

/** Slot index for a named series — exported so the group test can check it. */
export function seriesSlotIndex(name: SeriesName): number {
  return SERIES_SLOT[name];
}

/**
 * Neutral for a category the payload names but the palette does not — a zone
 * with no assigned colour, an "other" bucket. Deliberately grey: an unmapped
 * series must not borrow a hue that means something.
 */
export const SERIES_UNMAPPED = { light: '#898781', dark: '#898781' } as const;
