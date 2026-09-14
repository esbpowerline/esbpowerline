import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('@/lib/seo', () => ({ SITE_URL: 'https://esbpowerline.com' }));

import { PUBLIC_COMMAND_LIST, expectedWebhookUrl, extractSeen } from '@/lib/notifications/setup';

describe('assisted setup', () => {
  it('finds the channels a bot was added to or posted in, and the people who pressed Start', () => {
    const updates = [
      { update_id: 1, my_chat_member: { chat: { id: -1001234567890, type: 'channel', title: 'ESB PowerLine — staging' } } },
      { update_id: 2, channel_post: { chat: { id: -1001234567890, type: 'channel', title: 'ESB PowerLine — staging' }, text: 'hello' } },
      { update_id: 3, channel_post: { chat: { id: -1009999, type: 'channel', title: 'ESB PowerLine', username: 'esbpowerline' } } },
      { update_id: 4, message: { chat: { id: 412345678, type: 'private' }, from: { id: 412345678, is_bot: false, username: 'hamim', first_name: 'Hamim' }, text: '/start' } },
      { update_id: 5, message: { chat: { id: 7, type: 'private' }, from: { id: 7, is_bot: true } } },
      { garbage: true },
      null,
    ];
    const seen = extractSeen(updates);
    expect(seen.chats).toEqual([
      { id: '-1001234567890', type: 'channel', title: 'ESB PowerLine — staging', username: null },
      { id: '-1009999', type: 'channel', title: 'ESB PowerLine', username: 'esbpowerline' },
    ]);
    expect(seen.users).toEqual([{ id: '412345678', username: 'hamim', firstName: 'Hamim' }]);
  });

  it('registers only this site’s own webhook URL', () => {
    expect(expectedWebhookUrl()).toBe('https://esbpowerline.com/api/telegram/webhook');
  });

  it('advertises the public commands only', () => {
    const names = PUBLIC_COMMAND_LIST.map((c) => c.command);
    expect(names).toEqual(['latest', 'grid', 'generation', 'today', 'help']);
    for (const admin of ['status', 'pause', 'resume', 'retry', 'test']) expect(names).not.toContain(admin);
  });
});
