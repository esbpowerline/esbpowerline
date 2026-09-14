import 'server-only';

/**
 * Assisted setup: everything Telegram will tell a bot about itself, asked from
 * the server, with the token that lives only in Vercel.
 *
 * The manual setup (SETUP.md) has a person run getUpdates with the token in a
 * terminal to learn the staging channel's id and their own user id, then run
 * setWebhook with the token and the secret. Both mean handling secrets by hand.
 * Here the server does it: nobody needs to see the token or the webhook secret,
 * and the ids come back already extracted.
 *
 * Reached through /api/cron/notifications/setup with the CRON_SECRET bearer.
 * The webhook it registers is always this site's own URL — it cannot be pointed
 * anywhere else.
 */

import { randomUUID } from 'node:crypto';
import { SITE_URL } from '@/lib/seo';
import { readTelegramEnv } from '@/lib/notifications/config';
import { emitEvent } from '@/lib/notifications/events';
import { TELEGRAM_WEBHOOK_PATH } from '@/lib/notifications/paths';
import { processDueDeliveries, type ProcessSummary } from '@/lib/notifications/processor';
import {
  getChat,
  getChatMember,
  getMe,
  getUpdates,
  getWebhookInfo,
  setMyCommands,
  setWebhook,
} from '@/lib/notifications/telegram/client';

/** The public command list, as BotFather's /setcommands would take it. Admin commands are not advertised. */
export const PUBLIC_COMMAND_LIST = [
  { command: 'latest', description: 'The latest reports' },
  { command: 'grid', description: 'The newest hour NLDC has posted' },
  { command: 'generation', description: 'Generation by fuel for that hour' },
  { command: 'today', description: 'Today’s posted peaks and PGCB’s forecast' },
  { command: 'help', description: 'What this bot can do' },
];

export interface SeenChat {
  id: string;
  type: string;
  title: string | null;
  username: string | null;
}

export interface SeenUser {
  id: string;
  username: string | null;
  firstName: string | null;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

function chatOf(v: unknown): SeenChat | null {
  const c = obj(v);
  if (!c || (typeof c.id !== 'number' && typeof c.id !== 'string')) return null;
  return { id: String(c.id), type: str(c.type) ?? 'unknown', title: str(c.title), username: str(c.username) };
}

/**
 * The chats and people a bot has seen, from raw getUpdates results. Pure.
 * Channels come from posts in them and from the bot being added to them;
 * people come from private messages (someone pressing Start).
 */
export function extractSeen(updates: unknown[]): { chats: SeenChat[]; users: SeenUser[] } {
  const chats = new Map<string, SeenChat>();
  const users = new Map<string, SeenUser>();
  for (const u of updates) {
    const up = obj(u);
    if (!up) continue;
    for (const key of ['channel_post', 'message', 'my_chat_member']) {
      const inner = obj(up[key]);
      if (!inner) continue;
      const chat = chatOf(inner.chat);
      if (chat && chat.type !== 'private') chats.set(chat.id, chat);
      const from = obj(inner.from);
      if (key === 'message' && chat?.type === 'private' && from && typeof from.id === 'number' && from.is_bot !== true) {
        users.set(String(from.id), { id: String(from.id), username: str(from.username), firstName: str(from.first_name) });
      }
    }
  }
  return { chats: [...chats.values()], users: [...users.values()] };
}

export interface DestinationCheck {
  destination: 'public' | 'test';
  chatId: string | null;
  ok: boolean;
  title: string | null;
  botStatus: string | null;
  canPost: boolean | null;
  error: string | null;
}

export interface SetupDiagnosis {
  configured: {
    enabled: boolean;
    botToken: boolean;
    webhookSecret: boolean;
    channelId: string | null;
    testChatId: string | null;
    adminUserIds: string[];
  };
  bot: { id: number; username: string } | null;
  webhook: { url: string; expected: string; matches: boolean; pending: number; lastError: string | null } | null;
  destinations: DestinationCheck[];
  seen: { chats: SeenChat[]; users: SeenUser[] } | null;
  notes: string[];
}

export function expectedWebhookUrl(): string {
  return `${SITE_URL.replace(/\/$/, '')}${TELEGRAM_WEBHOOK_PATH}`;
}

export async function diagnoseSetup(): Promise<SetupDiagnosis> {
  const env = readTelegramEnv();
  const out: SetupDiagnosis = {
    configured: {
      enabled: env.enabled,
      botToken: Boolean(env.botToken),
      webhookSecret: Boolean(env.webhookSecret),
      channelId: env.channelId,
      testChatId: env.testChatId,
      adminUserIds: [...env.adminUserIds],
    },
    bot: null,
    webhook: null,
    destinations: [],
    seen: null,
    notes: [],
  };
  if (!env.botToken) {
    out.notes.push('TELEGRAM_BOT_TOKEN is not set in this deployment.');
    return out;
  }
  const token = env.botToken;

  const me = await getMe(token);
  if (!me.ok) {
    out.notes.push(`Telegram rejected the token: ${me.description}`);
    return out;
  }
  out.bot = { id: me.result.id, username: me.result.username };

  const wh = await getWebhookInfo(token);
  if (wh.ok) {
    out.webhook = {
      url: wh.result.url,
      expected: expectedWebhookUrl(),
      matches: wh.result.url === expectedWebhookUrl(),
      pending: wh.result.pending_update_count,
      lastError: wh.result.last_error_message ?? null,
    };
  }

  for (const [destination, chatId] of [['public', env.channelId], ['test', env.testChatId]] as const) {
    const check: DestinationCheck = { destination, chatId, ok: false, title: null, botStatus: null, canPost: null, error: null };
    if (!chatId) {
      check.error = 'not configured';
    } else {
      const chat = await getChat(token, chatId);
      if (!chat.ok) {
        check.error = chat.description;
      } else {
        check.title = chat.result.title ?? chat.result.username ?? null;
        const member = await getChatMember(token, chatId, me.result.id);
        if (member.ok) {
          check.botStatus = member.result.status;
          check.canPost = member.result.status === 'creator' || member.result.can_post_messages === true;
          check.ok = check.canPost;
          if (!check.canPost) check.error = 'the bot is not an administrator with "Post messages"';
        } else {
          check.error = member.description;
        }
      }
    }
    out.destinations.push(check);
  }

  if (!out.webhook?.url) {
    const updates = await getUpdates(token);
    if (updates.ok) out.seen = extractSeen(updates.result);
    else out.notes.push(`getUpdates failed: ${updates.description}`);
  } else {
    out.notes.push('A webhook is set, so Telegram no longer offers the recent-chat list (expected once setup is done).');
  }
  return out;
}

/** Point Telegram at this site's webhook with the configured secret, and publish the command list. */
export async function registerWebhook(): Promise<{ ok: boolean; steps: Array<{ step: string; ok: boolean; detail: string }> }> {
  const env = readTelegramEnv();
  const steps: Array<{ step: string; ok: boolean; detail: string }> = [];
  if (!env.botToken) return { ok: false, steps: [{ step: 'token', ok: false, detail: 'TELEGRAM_BOT_TOKEN is not set' }] };
  if (!env.webhookSecret) return { ok: false, steps: [{ step: 'secret', ok: false, detail: 'TELEGRAM_WEBHOOK_SECRET is not set, or shorter than 16 characters' }] };

  const hook = await setWebhook(env.botToken, {
    url: expectedWebhookUrl(),
    secret_token: env.webhookSecret,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });
  steps.push({ step: 'setWebhook', ok: hook.ok, detail: hook.ok ? expectedWebhookUrl() : hook.description });
  const cmds = await setMyCommands(env.botToken, PUBLIC_COMMAND_LIST);
  steps.push({ step: 'setMyCommands', ok: cmds.ok, detail: cmds.ok ? PUBLIC_COMMAND_LIST.map((c) => `/${c.command}`).join(' ') : cmds.description });
  return { ok: steps.every((s) => s.ok), steps };
}

/** Queue a test message to the test destination and deliver it now. */
export async function sendSetupTest(note: string): Promise<{ ok: boolean; detail: string; process: ProcessSummary | null }> {
  const env = readTelegramEnv();
  if (!env.testChatId) return { ok: false, detail: 'TELEGRAM_TEST_CHAT_ID is not set', process: null };
  await emitEvent({
    type: 'TEST_MESSAGE',
    dedupeKey: `test:${randomUUID()}`,
    payload: { requestedBy: 'assisted setup', note: note.slice(0, 200) },
    destinations: ['test'],
  });
  const process = await processDueDeliveries({ limit: 5, trigger: 'setup-test' });
  return { ok: process.sent > 0, detail: process.blockedReason ?? `sent ${process.sent}`, process };
}
