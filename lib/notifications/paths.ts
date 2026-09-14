/**
 * Paths the notification layer owns. Pure constants: middleware (edge) and
 * route handlers (node) both import this, so it may import nothing.
 */

/** Telegram's webhook target. The one path exempted from the bot user-agent guard. */
export const TELEGRAM_WEBHOOK_PATH = '/api/telegram/webhook';
