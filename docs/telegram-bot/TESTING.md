# Telegram — testing

## Automated

```bash
npx vitest run lib/test/notifications-    # the notification suite
npm test                                  # everything
```

Telegram is a `fetch` mock throughout. No test calls Telegram, and no test touches a
database: the queue and tables are replaced by in-memory fakes that enforce the same
unique and ownership rules.

| file | proves |
|---|---|
| `notifications-format.test.ts` | HTML escaping of editor text. Caption ≤1,024 and message ≤4,096 visible characters, even when the text is full of escapable characters. Word-boundary truncation. Dhaka time labels. Canonical URL with UTM. Null printed as a dash, never 0. Inconsistent totals flagged; unusable totals withheld. Alert and summary copy |
| `notifications-telegram-client.test.ts` | Classification of every Telegram outcome: 429 with retry-after, 5xx, 401, 403, chat not found, bad media, malformed HTML, not modified. Timeout versus pre-send network failure. Token redaction in errors and logs |
| `notifications-alerts.test.ts` | One alert on entering, not one per hour. Escalation only after a real rise and the interval. Recovery with hysteresis, and no flapping. A missing reading changes nothing. Replaying an hour never re-alerts. Generation drop needs consistent, consecutive hours |
| `notifications-events.test.ts` | Idempotency: emitting twice, or concurrently, gives one event and one delivery. A crash between the two writes heals on the next emit. A bad payload writes nothing. Backoff schedule and cap |
| `notifications-processor.test.ts` | Success records the message id. 429 waits as asked. 5xx retries. Attempts are capped. A timeout becomes uncertain and is never re-sent. **Telegram accepted but our write failed → not re-sent.** **Two concurrent processors → one send.** 401 stops the run and hands the rest back unspent. 403 is recorded. Image missing → text. Photo refused → text in the same attempt. Unpublished before sending → cancelled. Dry run, pause, disabled, stale hour, poisoned payload. Non-production never touches the queue |
| `notifications-articles.test.ts` | The editorial gate: drafts, in review, scheduled, archived, trashed, Bengali titles, future-dated, backdated, and before the feature was switched on. One keyed event per article. Breaking priority. Never throws into a publish path. The reconciler finds missed announcements, withdrawals (including after a hard delete), headline edits, and leaves unchanged posts alone |
| `notifications-publish-hooks.test.ts` | The scheduled-publish cron's conditional update: a row another run already published is neither counted nor announced |
| `notifications-commands.test.ts` | Command parsing. Admin ids are numeric only. A non-admin's admin command gets the unknown-command reply, is logged, and changes nothing. Group chats get silence. Commands can be switched off while `/resume` still works. `/grid` states NLDC's lag and never prints zeros |
| `notifications-webhook.test.ts` | Not configured → 404. Missing or wrong secret → 401, before the body is read. Unreadable body → 200 so Telegram does not retry. Oversized body → 413 |
| `notifications-scheduler.test.ts` | Stale hours are not posted. No stored hour posts nothing. One bulletin per hour. The minimum interval holds through NLDC's batches. Four hours above the alert level make one alert. A second run over the same hours alerts nothing. Old hours advance the state silently |
| `notifications-snapshot.test.ts` | The generation integrity rule. A row the archive already excluded is withheld. Absent is null, and imports with no interconnector reported are null |

## Dry run

`TELEGRAM_DRY_RUN=true` on production renders every message and records it as *skipped
(dry_run)* without calling Telegram. Useful for watching what the grid automation would
post for a day before switching it on.

## Live verification

**Status: pending.** This build was not run against a real Telegram bot: no credentials
were available when it was written. Until every step below has been done, the system is
**implementation-ready**, not **live-verified**.

Do these on the **staging** channel (`TELEGRAM_CHANNEL_ID` = the staging id), after
`SETUP.md`.

| # | check | how | expect |
|---|---|---|---|
| 1 | the bot is valid | `curl -s "https://api.telegram.org/bot<TOKEN>/getMe"` | `"ok":true` and the bot's username |
| 2 | Vercel reaches Telegram | Dashboard → **Send test** | the status card shows no Telegram errors |
| 3 | it can post to staging | same | the TEST message appears in staging; its row shows *sent* |
| 4 | an article triggers a post | publish a test article with an English title, a standfirst and an image | a NEWS post with the photo appears in staging within seconds; the row shows *sent* |
| 5 | no duplicates | on that article: bulk **Publish** again; edit the headline; unpublish | nothing new is posted; within 5 min the post's headline is edited in place; after unpublishing, it reads WITHDRAWN |
| 6 | failure and retry | set `TELEGRAM_TEST_CHAT_ID` to `-1000000000000` and redeploy, then **Send test**; restore it, redeploy, **Retry** | a *failed* row with "chat not found"; after the retry, *sent* |
| 7 | commands | send `/help`, `/latest`, `/grid`, `/generation`, `/today` | concise answers; every grid figure names its hour |
| 8 | admin authorisation | from an account **not** in `TELEGRAM_ADMIN_USER_IDS`, send `/pause`; then from an admin, send `/status` | "Unknown command", a `telegram.unauthorized_command` log line, still not paused; then the status table |
| 9 | hourly grid | switch on **Hourly grid update**; wait for the Pi's next capture and the next cron | a GRID UPDATE for the newest hour, matching `/grid`; no second post for the same hour |
| 10 | records | Vercel logs, `"scope":"notifications"`; the SQL in `OPERATIONS.md` | `delivery.sent` lines carry the event, delivery and article ids; the rows hold Telegram's message ids |

Then switch `TELEGRAM_CHANNEL_ID` to the public channel (`SETUP.md` step 11) and repeat
step 3 with **Send test** to the public channel's test destination, if you want.

Record the date and who ran each step in `PRODUCTION_CHECKLIST.md`.
