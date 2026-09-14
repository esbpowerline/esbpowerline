# Telegram — troubleshooting

Start at **Admin → Notifications**. The status card lists the reasons, and the deliveries
table shows each failure's code and message.

## Nothing is being posted

Check in this order:

1. **Status says "Switched off".** `TELEGRAM_ENABLED` is not `true`, or the change was not
   redeployed.
2. **Status says paused.** Resume.
3. **The feature's switch is off** (News, Hourly grid update, …).
4. **"The notification cron has never run" / "last ran N min ago".** The cron is not
   running:
   - Is `vercel.json` with `/api/cron/notifications` on `main`, and deployed?
   - Is `CRON_SECRET` set? Without it the route answers 503.
   - Vercel → project → **Cron Jobs** shows each run and its response.
5. **An article was not announced.** Check the gate (`SECURITY.md` → Editorial safety):
   - Is it `PUBLISHED` and not in the editor trash?
   - Is its title in English script? A Bengali-script title 404s at its public URL, so it
     is never announced.
   - Was it published within `articleMaxAgeHours`, and after "Announcing articles since"
     on the status card?
   - Is it dated in the future? It is announced when that time comes.
6. **"Not the production deployment".** Expected anywhere but production. See
   `SECURITY.md`.

## A delivery failed

| error | cause | fix |
|---|---|---|
| `destination_unconfigured` | `TELEGRAM_CHANNEL_ID` or `TELEGRAM_TEST_CHAT_ID` is empty | set it, redeploy, Retry |
| `destination_403` "bot was kicked" / "not a member" | the bot was removed from the channel | re-add it as admin with Post messages, Retry |
| "not enough rights to send" / "need administrator rights" | the bot is a member but not an admin, or lacks Post messages | grant Post messages, Retry |
| "chat not found" | wrong id, or a private channel given as a name | use the `-100…` id (`SETUP.md` step 5) |
| `unauthorized` (401) | wrong or revoked token | fix `TELEGRAM_BOT_TOKEN`, redeploy. Sends resume by themselves once the token changes |
| `rate_limited` (429) | Telegram asked us to slow down | nothing — it retries after the time Telegram gave |
| `http_5xx` | Telegram had a problem | nothing — it retries with backoff, up to 6 attempts |
| `timeout` / `network_…` → **uncertain** | the outcome is unknown | look at the channel; Retry only if the post is not there |
| `lease_expired` → **uncertain** | the run died mid-send | same |
| "can't parse entities" | a message the formatter produced that Telegram rejected | a bug: note the delivery id and the text of the article, and report it |
| `invalid_payload` | a stored event no longer matches its schema | a bug after a code change; cancel it |

## Posts arrive as text, not with the photo

The processor fetched the article image and could not use it. Search the logs for
`delivery.image_fallback`; the `reason` says why:

- `no image`: the article has none.
- `image host not allowed`: the image is not on esbpowerline.com or the Supabase project.
- `image HTTP 404` / `image unreachable`: the file is gone or storage was down.
- `image too large` / `image could not be decoded`.

A text post is the designed fallback. The article is still announced.

## The bot does not answer commands

1. Run `curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`:
   - `url` empty: the webhook is not registered (`SETUP.md` step 9).
   - `last_error_message: "Wrong response from the webhook: 401"`: the secret registered
     with Telegram differs from `TELEGRAM_WEBHOOK_SECRET`. Register it again.
   - `…: 404`: `TELEGRAM_WEBHOOK_SECRET` is not set, or is shorter than 16 characters, so
     the route behaves as if it did not exist.
   - `…: 403`: the request was refused before reaching the route. The middleware must let
     `POST /api/telegram/webhook` through (`TELEGRAM_WEBHOOK_PATH`); check it was not
     removed.
2. **Bot commands** switched off: public commands say they are unavailable.
3. **In a group:** the bot answers only in private chats, by design.
4. **Too many commands:** more than 20 a minute from one user are dropped silently.

## Admin commands answer "Unknown command"

Your numeric user id is not in `TELEGRAM_ADMIN_USER_IDS`, or you used a username. Find
your id (`SETUP.md` step 6), add it, and redeploy. Each refused attempt is logged as
`telegram.unauthorized_command` with the id that tried.

## No grid update this hour

- **Hourly grid update** is off.
- **NLDC is behind.** Its posting lag is usually 3–6 hours. If the newest stored hour is
  older than `gridMaxAgeHours`, nothing is posted, and the log says
  `grid.hourly_skipped … stale`.
- **The minimum interval has not passed** since the last update (60 minutes by default).
- **The Pi's hourly capture stopped.** Check it per CLAUDE.md, "Checking the Pi from
  anywhere". Read the counts, not the exit code.

## Grid times look six hours off

The database stores UTC with no zone attached. A tool that reads those values as local
time on a Dhaka machine shows every hour six hours early. The messages are right; the
tool is misreading. Select the column `::text`.

## A post appeared twice

Open both in the deliveries table.

- **Two rows for one event:** one was uncertain and someone retried it.
- **Two events:** two different articles, or a changed dedupe key. Report it as a bug with
  both delivery ids.

Delete the duplicate in Telegram by hand. The bot has no delete permission.
