import { PUBLICATION_TAGLINE, PUBLICATION_WORDMARK } from '@/lib/design-tokens';

/**
 * The typographic masthead.
 *
 * This replaces a 3728×343 illustrated banner — cartoon sun, refinery stacks,
 * wind turbines, a map, in a gradient, swapped per theme by a MutationObserver
 * (ThemeBanner.tsx, retired). It read as a banner ad and cost ~78px of the
 * ~220px of chrome a reader scrolled before the first headline. Serious
 * mastheads are typography: a wordmark, a rule, a date line.
 *
 * Deliberately a server-safe, hookless component. The date is Dhaka's calendar
 * day (all site instants are BST, UTC+06:00, no DST); suppressHydrationWarning
 * covers the sliver of a day where server and client render across midnight.
 */
export function Masthead() {
  const dateLine = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date());

  return (
    <div className="masthead">
      <p className="masthead__wordmark">{PUBLICATION_WORDMARK}</p>
      <div className="masthead__rule" aria-hidden />
      <p className="masthead__dateline">
        <span className="masthead__tagline">{PUBLICATION_TAGLINE}</span>
        <span suppressHydrationWarning>
          Dhaka · {dateLine} · BST
        </span>
      </p>
    </div>
  );
}
