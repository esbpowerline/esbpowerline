import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminFormattedTime } from '@/components/admin/AdminFormattedTime';
import { AdminPreferencesProvider } from '@/components/admin/AdminPreferencesProvider';

// On 2026-09-12 /cms/articles threw on every row in production: the shared
// article manager rendered its Updated column through AdminFormattedTime, whose
// preferences hook threw outside a provider, and only AdminShell mounted one.
describe('AdminFormattedTime', () => {
  it('renders outside AdminPreferencesProvider instead of throwing', () => {
    const html = renderToStaticMarkup(<AdminFormattedTime value="2026-09-12T10:00:00Z" />);
    expect(html).toContain('admin-formatted-time');
    expect(html).toContain('2026');
  });

  it('renders inside the provider', () => {
    const html = renderToStaticMarkup(
      <AdminPreferencesProvider>
        <AdminFormattedTime value="2026-09-12T10:00:00Z" />
      </AdminPreferencesProvider>,
    );
    expect(html).toContain('2026');
  });

  it('prints a dash for a value that is not a date', () => {
    expect(renderToStaticMarkup(<AdminFormattedTime value="" />)).toContain('—');
  });
});
