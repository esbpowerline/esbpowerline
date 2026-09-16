# Telegram — production checklist

A box is ticked only when someone actually verified it; the date and who says when.
Unticked means not yet verified, not failed.

**Current state: IMPLEMENTATION READY — not LIVE PRODUCTION VERIFIED.** Everything
that needs Telegram credentials, the release, or a person looking at the channel is still
open.

## Infrastructure
- [x] `/api/cron/notifications` runs in production: first heartbeat written by `trigger: cron` at 2026-09-14 06:35:34Z — 2026-09-14
- [x] That run reported no errors, released its lease and set `newsSince` — 2026-09-14
- [x] The Vercel plan runs the `*/5` schedule: consecutive cron heartbeats at 06:35:34Z and 06:40:08Z, both clean — 2026-09-14
- [x] No change to the Raspberry Pi — 2026-09-14, by design (DISCOVERY §6, DEPLOYMENT)

## Database migration
- [x] `0023_notifications` is additive: three new tables and three new types, nothing altered — 2026-09-14, reviewed
- [x] Every statement is re-runnable — 2026-09-14, reviewed (guarded `CREATE TYPE` and `ADD CONSTRAINT`, `IF NOT EXISTS` elsewhere)
- [x] The SQL matches what Prisma generates for the schema change (`prisma migrate diff`, statement for statement) — 2026-09-14
- [x] Executed against a real PostgreSQL: the production release applied it cleanly (above) — 2026-09-14
- [x] Applied by the production release build: `_prisma_migrations` shows `0023_notifications` started 06:31:42Z, finished 06:31:43Z, the three tables present — 2026-09-14
- [x] Rollback SQL written (DEPLOYMENT.md) — 2026-09-14

## Message formatting
- [x] Fuel codes stay in capitals in the daily summary ("HFO 15%, HSD 2%", not "hfo"/"hsd") — 2026-09-14, found in the first real preview; released to production 2026-09-16 (`de9f8262`)
- [x] `scripts/telegram-preview.ts` prints today's posts from real data, and `--send <chat>` posts them to a test chat — 2026-09-14, used against an admin's private chat before any variable existed. It refuses the public channel, which the production queue feeds and dedupes.

## Secrets
- [x] No Telegram token in any tracked file (sweep of `git grep` for token-shaped strings; test fixtures are fake) — 2026-09-14
- [x] `.env.example` carries names only, commented out — 2026-09-14
- [x] `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` on the `NEXT_PUBLIC_` leak guard (`lib/auth-env.ts`) — 2026-09-14
- [x] Token redacted from logs and stored errors (tested: `notifications-telegram-client.test.ts`) — 2026-09-14
- [ ] `TELEGRAM_BOT_TOKEN` set in Vercel Production, marked Sensitive
- [ ] `TELEGRAM_WEBHOOK_SECRET` set in Vercel Production, marked Sensitive, ≥16 characters
- [ ] No Telegram variable in Vercel Preview or Development

## Telegram bot
- [x] Bot created with @BotFather; `getMe` answers `ok` — 2026-09-14: @ESBPowerLineBot, id 8812692312, `can_join_groups: false`
- [x] Joining groups disabled; description, about text and public command list set — 2026-09-14
- [ ] Profile picture set (the ESB PowerLine mark)
- [x] A different bot from the Pi's ops-alert bot — 2026-09-14, created new
- [x] Token rotated after exposure — 2026-09-14, twice (17:58, 18:52): it leaked into a session transcript through screenshots of the BotFather chat. The live token is the 18:52 one.

## Channels
- [x] Public channel `@esbpowerline` ("ESB PowerLine") exists and is public — 2026-09-14, checked from t.me
- [x] Private staging channel "ESB PowerLine — staging" exists — 2026-09-14; Bot API id probably `-1003946310243` (read from Telegram Web; confirm with the setup GET)

## Channel permissions
- [ ] Bot is an administrator of the public channel with **Post messages** only
- [ ] Bot is an administrator of the staging channel with **Post messages** only
- [ ] `TELEGRAM_ADMIN_USER_IDS` holds numeric ids of the intended administrators

## Staging
- [ ] `TELEGRAM_CHANNEL_ID` pointed at the staging channel first
- [ ] TESTING.md live verification, steps 1–10, all passed (record date and name per step)
- [ ] Hourly grid update read on staging for at least a few hours before being enabled publicly

## Tests
- [x] Notification suite: 11 files, 134 tests, all passing — 2026-09-14
- [x] Full suite: 84 files, 935 tests, all passing — 2026-09-14
- [ ] Live Telegram verification (TESTING.md) — **pending: no credentials were available**

## Build, lint, types
- [x] `npm run build` passes: compiled, 396 static pages, the four new routes listed as dynamic — 2026-09-14
- [x] `npm run lint` on every new and changed file: clean — 2026-09-14
- [x] `tsc --noEmit`: clean — 2026-09-14

## Worker supervision
- [x] Not applicable: no long-running worker. Delivery runs in `after()` and a Vercel cron; commands run in the webhook — 2026-09-14, by design
- [x] A run that dies mid-send leaves its delivery UNCERTAIN, never re-sent (tested) — 2026-09-14
- [x] Heartbeat observed updating every 5 minutes in production (06:35:34Z, 06:40:08Z) — 2026-09-14

## Logging
- [x] Structured JSON lines with event, delivery and article ids — 2026-09-14
- [ ] Observed in Vercel logs (`"scope":"notifications"`) after the release

## Retries
- [x] 429 honours retry-after; 5xx backs off; attempts capped at 6; ambiguous outcomes parked (tested) — 2026-09-14
- [ ] Observed live (TESTING.md step 6)

## Health
- [x] `/api/cron/notifications/health` implemented, bearer-protected, 200/503 by status — 2026-09-14
- [x] Live in production: `/api/cron/notifications/health` and `/api/cron/notifications/setup` answer 401 without the bearer; the webhook answers 405 to GET and 404 to POST while unconfigured — 2026-09-14
- [ ] An uptime monitor pointed at it

## Admin controls
- [x] `/admin/notifications` requires `notifications.manage` on the page and in every action; changes audited — 2026-09-14, reviewed
- [x] Logged out, `/admin/notifications` redirects to `/login` (307) in production — 2026-09-14
- [ ] Page viewed in a browser by an administrator (not done: no admin session could be created in this environment)
- [ ] Pause and resume exercised from the dashboard and from `/pause` and `/resume`

## Feature flags
- [x] Defaults: news and commands on; hourly update, alerts and daily summary off until switched on — 2026-09-14
- [x] Master switch `TELEGRAM_ENABLED` unset means nothing is sent, whatever the dashboard says (tested) — 2026-09-14
- [x] Only the production deployment processes the queue (tested) — 2026-09-14

## Rollback
- [x] Pause, hard stop, code rollback and table removal documented (DEPLOYMENT, OPERATIONS) — 2026-09-14
- [ ] Pause and resume rehearsed on production

## Production smoke test
- [ ] `TELEGRAM_CHANNEL_ID` switched to the public channel and redeployed
- [ ] One article published and seen in the public channel within a minute
- [ ] `/status` from an admin reports Working
- [ ] The health endpoint answers 200 `ok`
