# Telegram — deployment

## Where each part runs

| part | runs on | why |
|---|---|---|
| event creation (publish hooks) | Vercel, inside the publish request | the only place the publish happens |
| delivery right after publishing | Vercel, `after()` in the same request | seconds, without making the editor wait |
| notification cron (`/api/cron/notifications`, every 5 min) | Vercel Cron | reconciliation, grid producers, retries, heartbeat |
| webhook (`/api/telegram/webhook`) | Vercel | needs public HTTPS; the Pi has none |
| health (`/api/cron/notifications/health`) | Vercel | for an uptime monitor |
| grid data | the Raspberry Pi (unchanged) | it already captures NLDC hourly and publishes the daily reports |

**Nothing changes on the Pi.** It gains no process, no dependency and no code path.
The notification layer only reads what the Pi already writes to the database.

**Only the production deployment processes the queue.** Development machines use the
production database, so the processor refuses to run unless `VERCEL_ENV=production`
(or `TELEGRAM_ALLOW_LOCAL_PROCESSING=true` against a database of your own).

No Docker, no systemd unit and no long-running worker are needed. The rejected
alternatives are in `ARCHITECTURE.md` §4 and §10.

## Release

This work lives on `feature/telegram-notifications`, which is opted out of Vercel
builds in its own `vercel.json`.

1. Merge the branch into `authenticating` (a fast-forward or a normal merge).
2. Release as usual: `git push origin authenticating:main`.
3. The production build:
   - runs `prisma migrate deploy`, which applies **`0023_notifications`**;
   - deploys the new cron from `vercel.json`.
4. Check the build succeeded, then follow `SETUP.md` if Telegram is not configured yet.

With `TELEGRAM_ENABLED` unset, the release changes nothing visible. The cron runs,
writes a heartbeat and posts nothing.

### The migration

`0023_notifications` is additive: three new tables and three enum types, nothing else
touched. Every statement is guarded, so a re-run is harmless (the 0022 lesson).

- **Do not** apply it by hand with `scratch/db-apply.ts` before the release. The build
  applies it; a hand-applied copy makes the build re-run it and record it twice.
- If the build fails in `migrate-deploy-prod.mjs`, its output is not printed. Read
  `_prisma_migrations` for the row with `finished_at` NULL (CLAUDE.md, "The migration").

### Rollback

- **Stop posting, keep everything:** Pause in the dashboard, `/pause`, or unset
  `TELEGRAM_ENABLED` and redeploy.
- **Roll the code back:** redeploy the previous production build in Vercel. The new tables
  stay; nothing reads them.
- **Remove the tables** (only if abandoning the feature), after the code is rolled back:

  ```sql
  DROP TABLE IF EXISTS "NotificationDelivery";
  DROP TABLE IF EXISTS "NotificationEvent";
  DROP TABLE IF EXISTS "NotificationSetting";
  DROP TYPE IF EXISTS "NotificationDeliveryStatus";
  DROP TYPE IF EXISTS "NotificationChannel";
  DROP TYPE IF EXISTS "NotificationEventType";
  DELETE FROM "_prisma_migrations" WHERE migration_name = '0023_notifications';
  ```

  Nothing else references these tables.

## Vercel settings

- **Cron.** `vercel.json` adds `/api/cron/notifications` at `*/5 * * * *`. Vercel Cron only
  runs on production deployments. The project already runs a `*/15` cron, so the plan
  supports sub-daily schedules.
- **Function duration.** The cron and webhook set `maxDuration` to 60 s and 30 s. A cycle
  normally takes a few seconds.
- **Database connections.** Each cycle uses the existing production pool (2 connections)
  for a few seconds every five minutes, with no long transactions.

## Environment variables

| variable | Production | Preview | Development (.env.local) |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | required | not set | not set |
| `TELEGRAM_WEBHOOK_SECRET` | required for commands | not set | not set |
| `TELEGRAM_CHANNEL_ID` | staging first, then public | not set | not set |
| `TELEGRAM_TEST_CHAT_ID` | staging channel | not set | not set |
| `TELEGRAM_ADMIN_USER_IDS` | numeric ids | not set | not set |
| `TELEGRAM_ENABLED` | `true` to post | not set | not set |
| `TELEGRAM_DRY_RUN` | optional, `true` renders and records without sending | — | — |
| `TELEGRAM_ALLOW_LOCAL_PROCESSING` | never | never | only with a database of your own |
| `CRON_SECRET` | already set | — | — |

Development and preview use the production database, so they must not carry Telegram
credentials. See `SECURITY.md`.

## Uptime monitoring

Point any monitor at:

```
GET https://esbpowerline.com/api/cron/notifications/health
Authorization: Bearer <CRON_SECRET>
```

200 means working or intentionally switched off. 503 means degraded or down. The body
lists the reasons. A stalled cron shows up as `down` within 15 minutes.
