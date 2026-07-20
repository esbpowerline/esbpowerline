import {
  BarChart3,
  BookOpen,
  Bookmark,
  Download,
  Mail,
  MessageSquare,
} from 'lucide-react';

const MEMBER_PERKS = [
  { icon: Mail, label: 'Weekly newsletter' },
  { icon: Bookmark, label: 'Saved library' },
  { icon: BookOpen, label: 'Magazine archive' },
  { icon: BarChart3, label: '1 month of grid data' },
  { icon: Download, label: 'Data downloads' },
  { icon: MessageSquare, label: 'Comments' },
] as const;

/** Member perks — left column, under news portal & magazine copy. */
export function MemberValuePanel() {
  return (
    <section className="login-member-perks" aria-labelledby="member-perks-heading">
      <h3 id="member-perks-heading" className="login-member-perks__title">
        Included with your free account
      </h3>
      <ul className="login-member-perks__list">
        {MEMBER_PERKS.map((perk) => {
          const Icon = perk.icon;
          return (
            <li key={perk.label} className="login-member-perk">
              <span className="login-member-perk__icon" aria-hidden>
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="login-member-perk__label">{perk.label}</span>
            </li>
          );
        })}
      </ul>
      <p className="login-member-perks__note">
        Newsletter opt-in at sign-up · Unsubscribe anytime
      </p>
    </section>
  );
}