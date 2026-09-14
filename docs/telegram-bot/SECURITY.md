# Telegram — security

## Secrets

| secret | where it lives | never |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Vercel, Production, marked Sensitive | Git, `.env.local`, the Pi, logs, the database, a chat |
| `TELEGRAM_WEBHOOK_SECRET` | Vercel, Production, marked Sensitive | as above |
| `CRON_SECRET` | Vercel (existing) | as above |

- Both Telegram secrets are on the `NEXT_PUBLIC_` leak guard (`lib/auth-env.ts`). The app
  refuses to boot if either appears with a public prefix.
- The token appears in every Bot API URL. Every log line and every stored error passes
  through `redact()` (`lib/notifications/log.ts`). It removes the configured secret
  values wherever they appear, and anything shaped like a bot token even if it is not
  ours. Covered by tests.
- The dashboard shows whether each secret is **set**, never its value.
  `NotificationSetting` never holds a secret.
- Development machines and preview builds use the production database. They must not
  carry Telegram credentials. The processor also refuses to run anywhere but production
  (`processingAllowed`), so a local server cannot claim or skip the channel's deliveries.

## Webhook

- HTTPS only (Vercel).
- `X-Telegram-Bot-Api-Secret-Token` is compared with the configured secret **before the
  body is read**. The comparison is constant-time over SHA-256 digests, so its timing
  reveals neither the secret nor its length.
- An unconfigured webhook answers 404, as if the route did not exist.
- Bodies over 64 KB are refused. The update is validated with zod, and anything
  unexpected is acknowledged and ignored.
- The middleware lets exactly one path and one method (`POST /api/telegram/webhook`) past
  its bot user-agent guard. The matcher is not widened. The route is not under
  `/api/admin` or any other protected prefix, and it grants nothing without the secret.
- The existing per-IP Upstash limit on `/api/*` still applies. Commands are also limited
  per Telegram user, 20 a minute.

## Administrator commands

- Authorised by **numeric Telegram user id** (`TELEGRAM_ADMIN_USER_IDS`). A username can
  be changed or reassigned; an id cannot. Non-numeric entries in the variable are
  discarded, so a typo grants nothing.
- Only in a **private chat** with the bot. In a group the bot says nothing at all.
- A non-admin who tries one gets the same reply as for an unknown command, so the admin
  commands are not advertised. The attempt is logged as
  `telegram.unauthorized_command` with the user id.
- **No `/broadcast`.** A compromised admin Telegram account must not be able to post to
  the public channel. Public content goes through the CMS, where it is reviewed and
  recorded.
- Admin actions over Telegram are logged (`config.changed`, with `by: telegram:<id>`).
  They do not write `AuditLog`, which needs an ESB user id.

## Dashboard

- `/admin/notifications` requires `notifications.manage` (SUPER_ADMIN, ADMIN), on the
  page and again inside every server action.
- The nav entry has an explicit permission (`lib/admin-nav.ts`). Without one it would
  default to visible for every admin.
- Every change writes `AuditLog` (`notifications.update`).
- The dashboard may change only an allowlist of settings. The "announce only after"
  floor (`newsSince`) cannot be changed from a browser.

## Health endpoint

`/api/cron/notifications/health` requires the `CRON_SECRET` bearer. It returns whether
secrets are set, never their values.

## Outbound requests

- The processor calls only `api.telegram.org`.
- Article images are fetched by the server, never by Telegram, and only over HTTPS from
  ESB's own hosts: the site, `NEXT_PUBLIC_SITE_URL`, and the Supabase project. An
  editor-supplied image URL cannot make the server request an arbitrary address. Size is
  capped at 15 MB before decoding.

## Editorial safety

- Only `PUBLISHED`, non-trashed articles with an English title are announced. The gate
  runs when the event is created and again immediately before sending, so an article
  unpublished in between is cancelled, not posted.
- Scheduled articles are announced when the cron publishes them, never before.
- An article dated in the future is held until its time.
- Articles published more than `articleMaxAgeHours` ago, or before announcements were
  first switched on, are never announced. Imports and backdating cannot flood the channel.
- Edits change the existing post in place (48 hours); nothing is ever posted twice.
- A withdrawn article's post is edited to say so; it is not silently deleted.

## Database

The layer uses the app's existing Prisma connection. No service-role key is involved and
no new database role is needed.

## Reporting a problem

If the token may have leaked, rotate it at once (`OPERATIONS.md`). The old token stops
working the moment BotFather issues a new one.
