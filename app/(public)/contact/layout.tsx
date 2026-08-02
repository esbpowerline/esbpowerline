import type { Metadata } from 'next';

// The contact page itself is a client component, so its metadata (and the
// canonical Google needs) has to live on the layout.
export const metadata: Metadata = {
  title: 'Contact | ESB PowerLine',
  description:
    'Get in touch with the ESB PowerLine newsroom — editorial tips, subscriptions, advertising and general enquiries.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
