import Link from 'next/link';
import { Bookmark, BookOpen, Download, MessageSquare, ArrowRight, BarChart3 } from 'lucide-react';
import { requireMemberSession } from '@/lib/member-auth';
import { getMemberOverview } from '@/lib/actions/members';
import { MEMBER_NAV } from '@/lib/member-nav';

export const metadata = {
  title: 'Member library | ESB PowerLine',
  description: 'Your saved articles, magazine archive, downloads, and comments.',
};

export default async function MemberOverviewPage() {
  const session = await requireMemberSession();
  const overview = await getMemberOverview();

  const stats = [
    { label: 'Saved items', value: overview.savedCount, href: '/members/saved', icon: Bookmark },
    { label: 'Downloads', value: overview.downloadCount, href: '/members/downloads', icon: Download },
    { label: 'Comments', value: overview.commentCount, href: '/members/comments', icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <section className="member-card-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href} className="member-stat-card">
              <div className="member-stat-card__icon">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="member-stat-card__value">{stat.value}</p>
                <p className="member-stat-card__label">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </section>

      {overview.pendingComments > 0 && (
        <div className="member-notice">
          You have {overview.pendingComments} comment{overview.pendingComments === 1 ? '' : 's'} awaiting moderation.
        </div>
      )}

      <section className="member-section">
        <h2 className="member-section__title">Quick links</h2>
        <div className="member-quick-grid">
          {MEMBER_NAV.filter((item) => item.href !== '/members' && item.href !== '/members/account').map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="member-quick-card">
                <Icon className="h-4 w-4 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="member-section">
        <h2 className="member-section__title">Grid data access</h2>
        <Link href="/members/subscription" className="member-quick-card">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Extend your archive</p>
            <p className="text-xs text-muted-foreground">
              Free members get 2 weeks · ৳499 for 5 years · ৳999 for full backlog
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="member-section">
        <h2 className="member-section__title">Continue exploring</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/articles" className="btn btn-secondary text-sm">Latest news</Link>
          <Link href="/magazine" className="btn btn-secondary text-sm">Monthly magazine</Link>
          <Link href="/grid-explorer" className="btn btn-secondary text-sm">Grid Explorer</Link>
        </div>
      </section>
    </div>
  );
}
