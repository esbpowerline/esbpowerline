import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

// The privacy policy, including how to have your data deleted (#data-deletion).
//
// Written 2026-11-06 from what the code actually does, not from a template: Meta requires a working privacy-policy and
// data-deletion URL before the newsroom's own posting tool ("ESB Ai Studio", which publishes our posts to our Facebook
// Page) may leave Development mode — in Development mode Facebook shows its posts only to people with a role on the
// app, so 13K followers could not see them. Every statement below maps to code; change the page when the code changes:
//   Google Analytics, signals and ad personalisation off ........ app/layout.tsx
//   esb_vid view-count cookie, stored hashed .................... lib/article-view-tracking.ts
//   theme / language cookies, text-size and reader preferences .. lib/site-theme.ts, lib/locale.ts, components/news/*
//   member accounts (name, email, optional phone) ............... prisma/schema.prisma `User`, Supabase Auth
//   saved items, comments, downloads, data-plan status ........... prisma/schema.prisma
//   contact form ................................................ app/api/contact/route.ts `ContactMessage`
//   open/click measurement in emails we send .................... app/api/o/[key], app/r/[key]

export const revalidate = 86400;

const UPDATED = '6 November 2026';
const EMAIL = 'esbplbd@gmail.com';

export const metadata = {
  title: 'Privacy Policy',
  description: 'What ESB Power Line collects when you read, sign up or write to us, why, who processes it, and how to have your data deleted.',
  alternates: { canonical: '/privacy' },
  openGraph: { title: 'Privacy Policy — ESB Power Line', url: '/privacy' },
};

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-primary/70">{children}</ul>;
}

export default function PrivacyPage() {
  return (
    <div className="container container--shell py-10 md:py-14 max-w-3xl mx-auto space-y-10">
      <Breadcrumbs crumbs={[{ name: 'Privacy Policy' }]} />

      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated {UPDATED}</p>
        <p className="text-[15px] leading-relaxed text-foreground/80">
          ESB Power Line (esbpowerline.com, the ESB Power Line monthly magazine and our social media pages) is published by
          Express Broadcast and Communication Ltd., House #36/1, Avenue #01, Block-A, Section-10, Mirpur, Pallabi, Dhaka-1216, Bangladesh. This page
          explains what we collect, why, who handles it for us, and how to have it deleted. We do not sell personal data
          and we do not use it for advertising.
        </p>
      </header>

      <Section title="When you read the site">
        <p>You can read every free article without an account. When you do:</p>
        <List>
          <li>
            <b>Google Analytics</b> records page views, the pages you came from, your device, browser and approximate
            location (city level), so we know which stories are read. Google signals and ad personalisation are switched
            off. Google&apos;s own policy applies to what it processes.
          </li>
          <li>
            A cookie called <code>esb_vid</code> holds a random number so a story&apos;s view count goes up once per reader,
            not on every reload. We store it only in hashed form and it is not linked to your name or account.
          </li>
          <li>
            Your choices of light or dark theme, language and text size are remembered in cookies or your browser&apos;s
            storage. They never leave your device except as the theme and language your browser asks for.
          </li>
          <li>Our hosting provider keeps short-lived server logs (such as IP address and time) to run and protect the site.</li>
        </List>
      </Section>

      <Section title="When you create an account">
        <p>Member and staff accounts hold your name, email address and, if you give it, your phone number. Passwords are handled by our sign-in provider and are never stored in readable form. With an account we also keep:</p>
        <List>
          <li>stories you save and comments you post (comments are public under your name);</li>
          <li>the list of data files you have downloaded, so you can find them again;</li>
          <li>if you take a data plan, the plan, its status and its dates.</li>
        </List>
      </Section>

      <Section title="When you write to us">
        <p>
          The <Link href="/contact" className="text-primary underline underline-offset-2">contact form</Link> sends us your
          name, email address, an optional phone number, a subject and your message. We use them only to answer you.
        </p>
      </Section>

      <Section title="Emails we send">
        <p>
          Our newsroom writes to people and organisations in the energy sector. Those emails may carry a tiny image and
          links routed through esbpowerline.com, which tell us approximately whether an email was opened and which link was
          followed. Many email apps load images on their own, so this is an estimate, not a record of reading. To stop
          receiving them, reply with the word &ldquo;unsubscribe&rdquo; and we will not write to that address again.
        </p>
      </Section>

      <Section title="Facebook and our publishing tool">
        <p>
          ESB Ai Studio is our own newsroom software. It publishes our stories, banners and comments to the ESB Power Line
          Facebook Page through Meta&apos;s Graph API, using our Page&apos;s own access. It does not offer Facebook Login,
          does not read the profiles, messages or friends of people who see or react to our posts, and stores no data about
          Facebook users. What happens on Facebook itself is covered by Meta&apos;s privacy policy.
        </p>
      </Section>

      <Section title="Who processes data for us">
        <List>
          <li>Supabase: our database, sign-in and file storage;</li>
          <li>Vercel: website hosting;</li>
          <li>Google: Analytics, and the email account our newsroom sends from;</li>
          <li>Meta: our Facebook Page.</li>
        </List>
        <p>They process data on our behalf under their own security and privacy terms. We share personal data with no one else unless the law requires it.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Account data is kept while the account exists. Contact messages are kept as long as needed to answer and follow
          up. Analytics data is kept under Google Analytics&apos; retention setting. When you ask us to delete your data, we
          do so as described below.
        </p>
      </Section>

      <Section id="data-deletion" title="Your rights and deleting your data">
        <p>You can ask to see the personal data we hold about you, to correct it, or to have it deleted.</p>
        <p>
          <b>To have your data deleted,</b> email <a href={`mailto:${EMAIL}?subject=Delete%20my%20data`} className="text-primary underline underline-offset-2">{EMAIL}</a>{' '}
          with the subject &ldquo;Delete my data&rdquo;, from the email address you used with us (or tell us which address it
          was). We will confirm and delete your account, saved stories, comments, download history, contact messages and
          any email-tracking records for that address within 30 days, except where the law requires us to keep something,
          and tell you when it is done.
        </p>
        <p>
          If you only reacted to or commented on our Facebook posts, we hold no data about you: our publishing tool does not
          collect it. You can remove your own comments and reactions on Facebook at any time.
        </p>
      </Section>

      <Section title="Children">
        <p>Our site is written for professionals and is not directed at children under 13. We do not knowingly collect their data.</p>
      </Section>

      <Section title="Changes and contact">
        <p>
          We will update this page when what we collect changes, and change the date at the top. Questions:{' '}
          <a href={`mailto:${EMAIL}`} className="text-primary underline underline-offset-2">{EMAIL}</a>, or the{' '}
          <Link href="/contact" className="text-primary underline underline-offset-2">contact page</Link>.
        </p>
      </Section>
    </div>
  );
}
