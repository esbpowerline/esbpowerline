'use client';

/*
 * The footer on a phone (below 768px; app/phone-footer.css hides it from 768px
 * up and hides the desktop footer below it). Measured 2026-11-12 at 390px: the
 * desktop footer was 1,553px tall with 13 text nodes under 10px and 24 links
 * under 44px. Same destinations and the same office details, drawn as grouped
 * 44px rows that open in place, a social row and a legal line.
 */
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { OfficialSocialLinks } from '@/components/shared/OfficialSocialLinks';
import { MemberFooterCard } from '@/components/members/MemberFooterCard';
import { useLocale } from '@/components/shared/LocaleProvider';
import '@/app/phone-footer.css';

type L = { label: string; href: string };

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="hp-foot__group">
      <summary>
        <span>{title}</span>
        <ChevronDown aria-hidden width={18} height={18} />
      </summary>
      <div className="hp-foot__body">{children}</div>
    </details>
  );
}

function Links({ links }: { links: L[] }) {
  return (
    <ul className="hp-foot__links">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} prefetch={false}>{l.label}</Link>
        </li>
      ))}
    </ul>
  );
}

export function PhoneFooter({ exploreLinks, sectorLinks, year }: { exploreLinks: L[]; sectorLinks: L[]; year: number }) {
  const { t } = useLocale();
  return (
    <div className="hp-foot">
      <div className="hp-foot__brand">
        <BrandLogo frameClassName="shrink-0 rounded-md border-0 bg-transparent px-0 py-0 shadow-none" imageClassName="h-9 w-auto" />
        <p>{t('footer.tagline')}</p>
      </div>

      <div className="hp-foot__card">
        <Group title={t('footer.explore')}><Links links={exploreLinks} /></Group>
        <Group title={t('footer.sectors')}><Links links={sectorLinks} /></Group>
        <Group title={t('footer.editorialOffice')}>
          <dl className="hp-foot__office">
            <div><dt>{t('footer.editorPublisher')}</dt><dd>Farid Uddin Ahmed</dd></div>
            <div><dt>{t('footer.email')}</dt><dd><a href="mailto:esbplbd@gmail.com">esbplbd@gmail.com</a></dd></div>
            <div>
              <dt>{t('footer.officeAddress')}</dt>
              <dd>ESB Power Line, House #36/1, Avenue #01, Block-A, Section-10, Mirpur, Pallabi, Dhaka-1216, Bangladesh.</dd>
            </div>
            <div><dt>{t('footer.advertising')}</dt><dd><a href="tel:+8801711378733">+8801711-378733</a></dd></div>
          </dl>
        </Group>
        <Group title={t('footer.members')}><MemberFooterCard /></Group>
      </div>

      <div className="hp-foot__social">
        <span>{t('footer.officialChannels')}</span>
        <OfficialSocialLinks variant="footer" />
      </div>

      <nav className="hp-foot__legal" aria-label="Site">
        <Link href="/about" prefetch={false}>{t('footer.about')}</Link>
        <Link href="/contact" prefetch={false}>{t('footer.contact')}</Link>
        <Link href="/privacy" prefetch={false}>{t('footer.privacy')}</Link>
        <a href="#top">{t('footer.backToTop')} <ChevronUp aria-hidden width={14} height={14} /></a>
      </nav>
      <p className="hp-foot__copy">
        {t('footer.copyright', { year })}
        <br />
        Developed in-house by{' '}
        <a href="https://facebook.com/chiefhamim" target="_blank" rel="noopener noreferrer">chiefhamim</a>
      </p>
    </div>
  );
}
