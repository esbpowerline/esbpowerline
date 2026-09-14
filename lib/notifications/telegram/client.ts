/**
 * The Telegram Bot API, and what each way of failing means for a retry.
 *
 * The classification is the part that matters. Telegram has no idempotency
 * key, so the question after any failure is not "did it fail?" but "could it
 * have been posted anyway?":
 *
 *   retryable     the request provably did not take effect — Telegram answered
 *                 429 or 5xx, or the connection was refused before it was sent.
 *   ambiguous     it may have: a timeout after the request left, a socket reset
 *                 mid-response. Never retried automatically (queue → UNCERTAIN).
 *   fatal_*       retrying cannot help: the token is wrong (integration), or
 *                 the bot was removed from the channel / the chat does not exist
 *                 (destination).
 *   bad_media     the photo was refused; the caller falls back to a text post.
 *   not_modified  an edit that changed nothing — success, for our purposes.
 *   permanent     anything else Telegram rejected (malformed HTML, a message
 *                 that can no longer be edited).
 *
 * No function here logs the request URL, which carries the token. Error
 * descriptions are redacted before they are returned.
 */

import { redact } from '@/lib/notifications/log';

export type TelegramFailureKind =
  | 'retryable'
  | 'ambiguous'
  | 'fatal_integration'
  | 'fatal_destination'
  | 'bad_media'
  | 'not_modified'
  | 'permanent';

export type TelegramResult<T> =
  | { ok: true; result: T }
  | { ok: false; kind: TelegramFailureKind; code: string; description: string; retryAfterMs?: number };

export interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string; title?: string; username?: string };
}

type FetchLike = typeof fetch;

const API_BASE = 'https://api.telegram.org';
export const DEFAULT_TIMEOUT_MS = 20_000;

// Connection failures that happen before a single byte of the request is
// sent: the post cannot have been made, so a retry is safe.
const PRE_SEND_ERROR_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH']);

const MEDIA_ERROR = /wrong file|failed to get http url content|image_process_failed|photo_invalid|wrong type of the web page|file is too big|photo_save_file_invalid|wrong remote file|not enough rights to send photos/i;
const DESTINATION_ERROR = /chat not found|bot was kicked|bot is not a member|not enough rights to send|need administrator rights|channel_private|chat_write_forbidden|group chat was upgraded/i;

function errorCause(err: unknown): string | undefined {
  const cause = (err as { cause?: { code?: string } })?.cause;
  return cause?.code ?? (err as { code?: string })?.code;
}

export function classifyTransportError(err: unknown): { kind: TelegramFailureKind; code: string; description: string } {
  const name = (err as { name?: string })?.name;
  if (name === 'AbortError' || name === 'TimeoutError') {
    return { kind: 'ambiguous', code: 'timeout', description: 'No response from Telegram before the timeout; the message may have been posted.' };
  }
  const code = errorCause(err);
  if (code && PRE_SEND_ERROR_CODES.has(code)) {
    return { kind: 'retryable', code: `network_${code}`, description: `Could not connect to Telegram (${code}).` };
  }
  return {
    kind: 'ambiguous',
    code: `network_${code ?? 'unknown'}`,
    description: redact(`Connection to Telegram failed mid-request (${code ?? (err instanceof Error ? err.message : 'unknown')}); the message may have been posted.`),
  };
}

export function classifyApiError(
  httpStatus: number,
  body: { error_code?: number; description?: string; parameters?: { retry_after?: number } } | null,
): { kind: TelegramFailureKind; code: string; description: string; retryAfterMs?: number } {
  const errorCode = body?.error_code ?? httpStatus;
  const description = redact(body?.description ?? `HTTP ${httpStatus}`);
  if (errorCode === 429) {
    const seconds = body?.parameters?.retry_after ?? 30;
    return { kind: 'retryable', code: 'rate_limited', description, retryAfterMs: Math.max(1, seconds) * 1000 };
  }
  if (errorCode >= 500) return { kind: 'retryable', code: `http_${errorCode}`, description };
  if (errorCode === 401 || (errorCode === 404 && /not found/i.test(description) && !/chat/i.test(description))) {
    return { kind: 'fatal_integration', code: 'unauthorized', description };
  }
  if (/message is not modified/i.test(description)) return { kind: 'not_modified', code: 'not_modified', description };
  if (errorCode === 403 || DESTINATION_ERROR.test(description)) return { kind: 'fatal_destination', code: `destination_${errorCode}`, description };
  if (MEDIA_ERROR.test(description)) return { kind: 'bad_media', code: 'bad_media', description };
  return { kind: 'permanent', code: `http_${errorCode}`, description };
}

interface ApiEnvelope<T> {
  ok?: boolean;
  result?: T;
  error_code?: number;
  description?: string;
  parameters?: { retry_after?: number };
}

export interface CallOptions {
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}

/** One Bot API call. `body` is JSON unless it is FormData (photo uploads). */
export async function callTelegram<T>(
  token: string,
  method: string,
  body: Record<string, unknown> | FormData,
  opts: CallOptions = {},
): Promise<TelegramResult<T>> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(`${API_BASE}/bot${token}/${method}`, {
      method: 'POST',
      headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      body: body instanceof FormData ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (err) {
    return { ok: false, ...classifyTransportError(err) };
  }

  let parsed: ApiEnvelope<T> | null = null;
  try {
    parsed = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // A proxy's HTML error page. 5xx is still a clean retry; anything else is
    // a response we cannot read, so we cannot say whether it was posted.
    if (res.status >= 500) return { ok: false, kind: 'retryable', code: `http_${res.status}`, description: `HTTP ${res.status} with no readable body` };
    return { ok: false, kind: 'ambiguous', code: `unreadable_${res.status}`, description: `HTTP ${res.status} with no readable body` };
  }
  if (parsed?.ok === true && parsed.result !== undefined) return { ok: true, result: parsed.result };
  return { ok: false, ...classifyApiError(res.status, parsed) };
}

export interface InlineButton {
  text: string;
  url: string;
}

export function inlineKeyboard(buttons: InlineButton[]): Record<string, unknown> | undefined {
  if (buttons.length === 0) return undefined;
  return { inline_keyboard: buttons.map((b) => [{ text: b.text, url: b.url }]) };
}

export function sendMessage(
  token: string,
  chatId: string,
  html: string,
  buttons: InlineButton[],
  opts?: CallOptions,
): Promise<TelegramResult<TelegramMessage>> {
  return callTelegram<TelegramMessage>(
    token,
    'sendMessage',
    {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      reply_markup: inlineKeyboard(buttons),
    },
    opts,
  );
}

export function sendPhoto(
  token: string,
  chatId: string,
  photo: { bytes: Uint8Array; filename: string },
  captionHtml: string,
  buttons: InlineButton[],
  opts?: CallOptions,
): Promise<TelegramResult<TelegramMessage>> {
  const form = new FormData();
  form.set('chat_id', chatId);
  form.set('caption', captionHtml);
  form.set('parse_mode', 'HTML');
  const markup = inlineKeyboard(buttons);
  if (markup) form.set('reply_markup', JSON.stringify(markup));
  // Copied into a fresh ArrayBuffer-backed view: Blob will not take a view
  // whose buffer might be a SharedArrayBuffer.
  form.set('photo', new Blob([new Uint8Array(photo.bytes)], { type: 'image/jpeg' }), photo.filename);
  return callTelegram<TelegramMessage>(token, 'sendPhoto', form, { timeoutMs: 45_000, ...opts });
}

export function editMessage(
  token: string,
  target: { chatId: string; messageId: string; kind: 'photo' | 'text' },
  html: string,
  buttons: InlineButton[],
  opts?: CallOptions,
): Promise<TelegramResult<TelegramMessage | true>> {
  const common = { chat_id: target.chatId, message_id: Number(target.messageId), parse_mode: 'HTML', reply_markup: inlineKeyboard(buttons) ?? { inline_keyboard: [] } };
  return target.kind === 'photo'
    ? callTelegram<TelegramMessage | true>(token, 'editMessageCaption', { ...common, caption: html }, opts)
    : callTelegram<TelegramMessage | true>(token, 'editMessageText', { ...common, text: html, link_preview_options: { is_disabled: true } }, opts);
}

export interface BotIdentity {
  id: number;
  username: string;
  first_name: string;
}

export const getMe = (token: string, opts?: CallOptions) => callTelegram<BotIdentity>(token, 'getMe', {}, opts);

export const getChat = (token: string, chatId: string, opts?: CallOptions) =>
  callTelegram<{ id: number; type: string; title?: string; username?: string }>(token, 'getChat', { chat_id: chatId }, opts);

/* ── setup and diagnosis (docs/telegram-bot/SETUP.md, assisted setup) ────── */

export interface WebhookInfo {
  url: string;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  allowed_updates?: string[];
}

export const getWebhookInfo = (token: string, opts?: CallOptions) => callTelegram<WebhookInfo>(token, 'getWebhookInfo', {}, opts);

export const setWebhook = (
  token: string,
  params: { url: string; secret_token: string; allowed_updates: string[]; drop_pending_updates: boolean },
  opts?: CallOptions,
) => callTelegram<true>(token, 'setWebhook', params, opts);

export const setMyCommands = (token: string, commands: Array<{ command: string; description: string }>, opts?: CallOptions) =>
  callTelegram<true>(token, 'setMyCommands', { commands }, opts);

/** Only answers while no webhook is set — which is exactly when setup needs it. */
export const getUpdates = (token: string, opts?: CallOptions) =>
  callTelegram<unknown[]>(token, 'getUpdates', { limit: 100, timeout: 0, allowed_updates: ['message', 'channel_post', 'my_chat_member'] }, opts);

export const getChatMember = (token: string, chatId: string, userId: number, opts?: CallOptions) =>
  callTelegram<{ status: string; can_post_messages?: boolean }>(token, 'getChatMember', { chat_id: chatId, user_id: userId }, opts);
