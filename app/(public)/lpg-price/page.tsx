import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { safeJsonLd } from '@/lib/json-ld';
import { ORGANIZATION_ID, SITE_URL } from '@/lib/seo';
import { formatNumber } from '@/lib/utils';
import {
  CURRENT_CYLINDER_PRICES,
  CURRENT_LPG_NOTICE,
  CURRENT_RETICULATED,
  GOVERNMENT_CYLINDER,
  LPG_PRICE_HISTORY,
  type LpgPriceNotice,
} from '@/lib/data/tariff/berc-lpg';

/**
 * The BERC LPG price, stated and cited.
 *
 * Built for one measured demand: Search Console, 2026-09-30, 1,810 impressions
 * and 5 clicks in 28 days on the site's LPG article for queries asking the
 * current BERC price ("bangladesh lpg 12 kg price september 2026 berc"). Every
 * figure is read from `lib/data/tariff/berc-lpg.ts`, which names the notification
 * it came from; nothing here is computed except the signed change between two
 * notices, which is arithmetic on two published figures.
 */

// The data ships with the deploy; a new notice arrives as a code change.
export const revalidate = false;

const current = CURRENT_LPG_NOTICE;

/** "September 2026" — the month a notice sets the price for, in BST. */
function noticeMonth(n: LpgPriceNotice): string {
  return new Date(n.effectiveFrom).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  });
}

/** "2 September 2026, 6:00 pm" in BST, as the notices state it. */
function effectiveLabel(n: LpgPriceNotice): string {
  const d = new Date(n.effectiveFrom);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' });
  return `${day}, ${time.toLowerCase()}`;
}

const KIND_LABEL: Record<LpgPriceNotice['kind'], string> = {
  monthly: 'Monthly',
  vat: 'VAT change',
  interim: 'Interim',
};

const tk = (v: number, dp = 0) => `Tk ${formatNumber(v, dp)}`;
const tk2 = (v: number) => `Tk ${v.toFixed(2)}`;

export function generateMetadata(): Metadata {
  const month = noticeMonth(current);
  const title = `LPG price in Bangladesh: 12 kg cylinder ${tk(current.cylinder12KgTk)} (BERC, ${month})`;
  const description =
    `BERC's private LPG price from ${effectiveLabel(current)}: ${tk(current.cylinder12KgTk)} for 12 kg, ` +
    `${tk2(current.perKgTk)} per kg, autogas ${tk2(current.autogasPerLitreTk)} a litre — every size, and the history, each from BERC's notification.`;
  return {
    title: { absolute: `${title} | ESB PowerLine` },
    description: description.length > 160 ? `${description.slice(0, 157).replace(/\s+\S*$/, '')}…` : description,
    alternates: { canonical: '/lpg-price' },
    openGraph: {
      type: 'article',
      url: '/lpg-price',
      title,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  };
}

export default function LpgPricePage() {
  const month = noticeMonth(current);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Bangladesh private LPG and autogas consumer prices set by BERC',
    description:
      'Retail prices, VAT included, of private bottled LPG by cylinder size, per kg, and autogas per litre, as fixed by the Bangladesh Energy Regulatory Commission in its price notifications.',
    url: `${SITE_URL}/lpg-price`,
    temporalCoverage: `${LPG_PRICE_HISTORY.at(-1)!.effectiveFrom.slice(0, 10)}/..`,
    isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: 'Bangladesh Energy Regulatory Commission (BERC)', url: 'https://berc.org.bd' },
    publisher: { '@id': ORGANIZATION_ID },
    spatialCoverage: { '@type': 'Place', name: 'Bangladesh' },
    variableMeasured: [
      { '@type': 'PropertyValue', name: '12 kg LPG cylinder, retail', value: current.cylinder12KgTk, unitText: 'BDT' },
      { '@type': 'PropertyValue', name: 'LPG per kg, retail', value: current.perKgTk, unitText: 'BDT/kg' },
      { '@type': 'PropertyValue', name: 'Autogas per litre, retail', value: current.autogasPerLitreTk, unitText: 'BDT/L' },
    ],
  };

  return (
    <div className="container container--shell py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Breadcrumbs crumbs={[{ name: 'LPG price' }]} />

      <header className="mt-4 border-b border-border/50 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          BERC price notification · {month}
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          LPG price in Bangladesh
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-foreground/85">
          A 12 kg cylinder of private LPG costs <strong>{tk(current.cylinder12KgTk)}</strong> at the retailer, VAT
          included, from {effectiveLabel(current)} — the price the Bangladesh Energy Regulatory Commission set for{' '}
          {month}. It stands until BERC&rsquo;s next notification.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/50 sm:grid-cols-4">
          {[
            ['12 kg cylinder', tk(current.cylinder12KgTk)],
            ['Per kg', tk2(current.perKgTk)],
            ['Autogas, per litre', tk2(current.autogasPerLitreTk)],
            [
              'Saudi CP average',
              current.saudiCpUsdPerTonne ? `$${current.saudiCpUsdPerTonne.average.toFixed(2)} / t` : '—',
            ],
          ].map(([label, value]) => (
            <div key={label} className="bg-card px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-[18px] font-semibold tabular-nums leading-snug text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Source: BERC notification No. {current.memoNo}, issued{' '}
          {new Date(`${current.issuedOn}T00:00:00+06:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' })}
          .{' '}
          <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            Read the notification (PDF, Bangla) <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </p>
      </header>

      <section className="mt-8" aria-labelledby="sizes">
        <div className="flex items-center gap-3">
          <h2 id="sizes" className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Every cylinder size, {month}
          </h2>
          <span aria-hidden className="h-px flex-1 bg-border/60" />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full max-w-md text-sm">
            <caption className="sr-only">Retail price of private bottled LPG by cylinder size, {month}, VAT included</caption>
            <thead>
              <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 font-medium">Cylinder</th>
                <th scope="col" className="py-2 text-right font-medium">Retail price, VAT included</th>
              </tr>
            </thead>
            <tbody>
              {CURRENT_CYLINDER_PRICES.map(({ kg, tk: price }) => (
                <tr key={kg} className={`border-b border-border/40 ${kg === 12 ? 'font-semibold' : ''}`}>
                  <td className="py-2">{kg} kg</td>
                  <td className="py-2 text-right tabular-nums">{tk(price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
          <li>
            Piped (reticulated) private LPG: {tk2(CURRENT_RETICULATED.liquidPerKgTk)} per kg supplied as liquid;{' '}
            {tk2(CURRENT_RETICULATED.gasPerCubicMetreTk)} per cubic metre supplied as gas.
          </li>
          <li>
            Government LPG (LP Gas Ltd) is priced separately and not monthly: {tk2(GOVERNMENT_CYLINDER.tk)} for{' '}
            {GOVERNMENT_CYLINDER.kg} kg under {GOVERNMENT_CYLINDER.order}, restated unchanged in each notification.
          </li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="history">
        <div className="flex items-center gap-3">
          <h2 id="history" className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Every price BERC has set since {noticeMonth(LPG_PRICE_HISTORY.at(-1)!)}
          </h2>
          <span aria-hidden className="h-px flex-1 bg-border/60" />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <caption className="sr-only">BERC private LPG price notifications, newest first</caption>
            <thead>
              <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 font-medium">In force from</th>
                <th scope="col" className="py-2 font-medium">Notice</th>
                <th scope="col" className="py-2 text-right font-medium">12 kg</th>
                <th scope="col" className="py-2 text-right font-medium">Change</th>
                <th scope="col" className="py-2 text-right font-medium">Per kg</th>
                <th scope="col" className="py-2 text-right font-medium">Autogas / L</th>
                <th scope="col" className="py-2 text-right font-medium">Saudi CP avg</th>
                <th scope="col" className="py-2 pl-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {LPG_PRICE_HISTORY.map((n, i) => {
                const prev = LPG_PRICE_HISTORY[i + 1];
                // Signed Tk between two published figures; the oldest row has
                // nothing on this page to compare with, so it states none.
                const change = prev ? n.cylinder12KgTk - prev.cylinder12KgTk : null;
                return (
                  <tr key={n.memoNo} className="border-b border-border/40 align-top">
                    <td className="py-2 whitespace-nowrap">{effectiveLabel(n)}</td>
                    <td className="py-2">
                      {KIND_LABEL[n.kind]}
                      {n.reason && <span className="block text-[11px] leading-snug text-muted-foreground">{n.reason}</span>}
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold">{tk(n.cylinder12KgTk)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {change == null ? '—' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${formatNumber(Math.abs(change))}`}
                    </td>
                    <td className="py-2 text-right tabular-nums">{n.perKgTk.toFixed(2)}</td>
                    <td className="py-2 text-right tabular-nums">{n.autogasPerLitreTk.toFixed(2)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {n.saudiCpUsdPerTonne ? `$${n.saudiCpUsdPerTonne.average.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 pl-3">
                      <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" title={`BERC notification No. ${n.memoNo}`}>
                        PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 max-w-3xl" aria-labelledby="how">
        <div className="flex items-center gap-3">
          <h2 id="how" className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">How BERC sets it</h2>
          <span aria-hidden className="h-px flex-1 bg-border/60" />
        </div>
        <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-foreground/90">
          <p>
            Each month BERC takes the contract price Saudi Aramco announces for propane and butane — the Saudi CP —
            averages the two 35:65, and converts that into a retail price per kg, for every cylinder size, for piped
            LPG and for autogas. The notification is usually issued on the second of the month and takes effect at
            6 pm that day; the full adjustment order follows about a week later.
          </p>
          <p>
            BERC can also change the price between months. It did so twice in this record: on 23 February 2026, when
            the National Board of Revenue moved LPG&rsquo;s VAT to the import stage, and on 19 April 2026, when it raised
            the allowance for freight and the trader&rsquo;s premium during the Hormuz crisis. There was no ordinary
            February 2026 notification; January&rsquo;s price stood until the VAT change.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Figures are BERC&rsquo;s, as printed in each notification, and are never recalculated here. The notices are
            scanned documents; each was read from its scan and checked against its own arithmetic. For the wider gas
            picture, see the{' '}
            <Link prefetch={false} href="/grid-explorer" className="text-primary hover:underline">Grid Explorer</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
