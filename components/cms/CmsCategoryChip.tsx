import { cn } from '@/lib/utils';

/**
 * A category, in its own colour, at its full name.
 *
 * The staff lists rendered the category as plain uppercase grey text in a
 * fixed column, which truncated the longer half of the taxonomy — "Energy
 * Policy & Regulat…", "Fossil Fuels & Commodit…" — and gave the ten
 * categories no visual identity at all, even though every one of them has
 * carried a colour in the database since it was created.
 *
 * The dot does the identifying and the label stays readable, which is why the
 * colour is not used as a text or background fill: several of these hues
 * (#f59e0b, #10b981, #14b8a6) fail contrast as small text on white, and a
 * row of ten filled chips would out-shout the headlines they belong to.
 */
export function CmsCategoryChip({
  name,
  color,
  className,
}: {
  name: string;
  color?: string | null;
  className?: string;
}) {
  if (!name) return null;
  return (
    <span className={cn('admin-cat-chip', className)} title={name}>
      <span
        className="admin-cat-chip__dot"
        style={color ? { background: color } : undefined}
        aria-hidden
      />
      <span className="admin-cat-chip__label">{name}</span>
    </span>
  );
}
