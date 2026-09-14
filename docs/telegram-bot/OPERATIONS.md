# Telegram — operations

Everything here can be done from **Admin → Notifications** (`/admin/notifications`)
or from a private chat with the bot, unless it says otherwise.

## At a glance

The status card says one of:

| status | meaning |
|---|---|
| Working | the cron ran in the last 15 minutes, no Telegram errors are recorded, nothing is stuck |
| Needs attention | something is wrong but posts can still go out — the reasons are listed |
| Not working | the cron has stopped, or Telegram rejected the bot token |
| Switched off | `TELEGRAM_ENABLED` is not set; nothing is sent, by design |

The same answer is at `GET /api/cron/notifications/health` (`Authorization: Bearer
<CRON_SECRET>`), for an uptime monitor. The bot answers `/status` to admins.

## Pause everything

**Dashboard → Pause all**, or send the bot `/pause`.

- Nothing is posted until you resume. Queued posts wait; nothing is deleted.
- When you resume, anything that went stale while paused is skipped, not posted late:
  - grid updates and alerts older than `gridMaxAgeHours` (8 h by default);
  - daily summaries more than 3 days old;
  - articles published more than `articleMaxAgeHours` ago (24 h by default).

**Hard stop**, for example if the dashboard itself is unavailable: remove
`TELEGRAM_ENABLED` in Vercel and redeploy. This takes precedence over everything else.

## Resume

**Dashboard → Resume**, or `/resume`. Queued posts go out within seconds.

## Switch off one automation

Use the switch for **News**, **Hourly grid update**, **Grid alerts**, **Daily summary** or
**Bot commands**.

A switched-off feature's queued posts are marked *skipped* when their turn comes. They
are not held for later. To send one after switching the feature back on, retry it from
the table.

Admin commands keep working when bot commands are switched off, so `/resume` is always
available.

## Inspect failures

The **Recent deliveries** table lists the last 30 posts.

| status | meaning | what to do |
|---|---|---|
| pending | waiting its turn, or waiting to retry | nothing |
| sending | being sent now | nothing; if it stays for more than 5 minutes it becomes uncertain |
| sent | in the channel; the time links to the post for a public channel | nothing |
| uncertain | the outcome is unknown: a timeout after the request left, or a run that died mid-send | **look at the channel.** If the post is there, leave it. If not, Retry. |
| failed | Telegram refused it, or it failed 6 times | read the error; fix the cause; Retry |
| cancelled | the article was unpublished before it went out, or an admin cancelled it | nothing |
| skipped | its feature was off, it went stale, dry run, or there was nothing to edit | nothing |

Send `/retry` with no argument for the five most recent failed or uncertain deliveries.

Logs: in Vercel, search for `"scope":"notifications"`. Every line names the `eventId`,
`deliveryId` and, for articles, the `articleId`. The event names are listed in
`ARCHITECTURE.md` §13.

For a direct look at the database (read only):

```sql
SELECT d.id, e.type, d.status, d."attemptCount", d."lastErrorCode", d."lastError",
       d."createdAt", d."sentAt"
FROM "NotificationDelivery" d JOIN "NotificationEvent" e ON e.id = d."eventId"
ORDER BY d."createdAt" DESC LIMIT 30;
```

The timestamps are UTC with no zone attached. A client set to Dhaka time will display
them six hours early; add six hours, or read them as text.

## Retry

**Retry** on the row, or `/retry <id>`. The delivery starts again from attempt one.

Retrying an **uncertain** delivery is the only way this system can post twice. Check the
channel first.

## Duplicate-post risk, and where it comes from

The system is built to post each thing at most once:

- Every event has a unique key, such as `article.published:<id>` or `grid.hourly:<hour>`.
  Publishing twice, re-publishing, a double click, or two overlapping cron runs all land
  on the same row.
- Each event has one delivery per destination.
- Deliveries are claimed exclusively. Two processors never send the same one.
- Any outcome that might have posted is marked **uncertain** and never retried
  automatically.

So a duplicate needs a person. Either someone retried an uncertain delivery that had in
fact posted, or someone published the same story as two separate articles.

## Rotate the bot token

Do this at once if the token may have leaked.

1. @BotFather → `/revoke` → choose the bot. The old token stops working immediately.
2. @BotFather → `/token` → copy the new one.
3. Vercel → `TELEGRAM_BOT_TOKEN` → new value → **Redeploy**.
4. Register the webhook again with the new token (`SETUP.md` step 9).
5. Dashboard → **Send test**.

Any "token rejected" error recorded under the old token clears by itself once the new
token is configured.

## Rotate the webhook secret

Generate a new one (`SETUP.md` step 7), update `TELEGRAM_WEBHOOK_SECRET` in Vercel,
redeploy, then register the webhook again with the new `secret_token`. Commands fail
between the redeploy and the re-registration, a minute at most. Posting is unaffected.

## Change the channel

1. Add the bot to the new channel as an administrator with **Post messages** only.
2. Vercel → `TELEGRAM_CHANNEL_ID` → the new `@username` or `-100…` id → **Redeploy**.
3. Dashboard → check the status card shows it.

Queued posts go to the new channel. Nothing already sent is re-sent. Edits and
withdrawals of old posts still target the channel each post was actually sent to.

## Test on staging

- **One message:** Dashboard → **Send test**, or `/test`. It always goes to
  `TELEGRAM_TEST_CHAT_ID`, never the public channel.
- **The whole flow:** point `TELEGRAM_CHANNEL_ID` at the staging channel, redeploy, and
  follow `TESTING.md` → "Live verification". Point it back when done.
- **Without sending anything:** set `TELEGRAM_DRY_RUN=true` and redeploy. Everything is
  rendered and recorded as *skipped (dry_run)*; nothing reaches Telegram.

## After a restart

- **Vercel:** nothing to do. There is no worker process, only the cron and the webhook.
  If a function was killed mid-send, that delivery becomes uncertain after 5 minutes.
  Check the channel and retry it if it is not there.
- **Raspberry Pi:** nothing to do for notifications. The Pi only supplies grid data. While
  it is down, hourly updates stop because no new hour exists. When it comes back, stale
  hours are skipped, not burst-posted. Check the Pi itself per CLAUDE.md, "Checking the
  Pi from anywhere".

## Change a threshold

**Thresholds** card → edit → **Save thresholds**. Each field shows the measurement
behind its default. The clear level must stay below the alert level, and the form
refuses otherwise.
