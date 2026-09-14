# Telegram — setup

For an ESB administrator. No source code needed. Allow about 30 minutes.

You will create two Telegram channels (the public one and a private staging one), one
bot, and six environment variables in Vercel. Then you test on staging and switch to
the public channel.

**Never paste the bot token into a website, a chat, a ticket or Git.** It goes into
Vercel and, briefly, into your own terminal. If it leaks, see "Rotate the token" in
`OPERATIONS.md`.

---

## The short path: assisted setup

Most of the manual steps below exist to read Telegram's answers: the staging channel's
id, your user id, and the webhook registration. The server can do all of that itself
with the token that lives in Vercel, so nobody has to read the token or the webhook
secret back once they are stored.

**What only a person can do:**

1. Create the bot with @BotFather (step 3), the public channel (step 1) and the staging
   channel (step 2). Add the bot to both channels as an administrator with **Post
   messages** only (step 4).
2. In Vercel → Settings → Environment Variables, add two variables for
   **Production**, both marked **Sensitive**, then redeploy:
   - `TELEGRAM_BOT_TOKEN`: the token from BotFather.
   - `TELEGRAM_WEBHOOK_SECRET`: the output of
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
     Paste it straight in; it never needs to be seen again.
3. Post any message in **each** channel, then open the bot in Telegram and press
   **Start**. Everyone who should administer the bot presses Start too.

**What the server does**, called with the `CRON_SECRET` bearer:

```
GET  /api/cron/notifications/setup                          # bot, channels it can post to, people who pressed Start
POST /api/cron/notifications/setup  {"action":"register"}   # sets the webhook and the command list
POST /api/cron/notifications/setup  {"action":"test"}       # sends a test to the test destination
```

The GET lists the channels the bot has seen with their ids, and the user ids of everyone
who pressed Start. Put those into `TELEGRAM_CHANNEL_ID` (staging first),
`TELEGRAM_TEST_CHAT_ID` and `TELEGRAM_ADMIN_USER_IDS`, set `TELEGRAM_ENABLED=true`,
redeploy, then POST `register` and `test`. The GET also checks that the bot really can
post in each configured channel.

The recent-chat list is only available until the webhook is registered. That is
Telegram's rule, not ours. So run the GET before `register`.

The manual steps follow, for reference or if you would rather do it by hand.

---

## 1. Create the public channel

In the Telegram app: **New Channel**.

- Name: `ESB PowerLine`
- Description: `Bangladesh energy news and power-system data from the official record. esbpowerline.com`
- Type: **Public**, link `t.me/esbpowerline` (or the closest free name)
- Photo: the ESB PowerLine mark

A public channel's chat id is its username, e.g. `@esbpowerline`.

## 2. Create a private staging channel

**New Channel** again: name `ESB PowerLine — staging`, type **Private**. Only you and
the other administrators should be members. Every change is tested here first.

## 3. Create the bot

Open **@BotFather** (check the blue verification tick) and send:

```
/newbot
```

- Name: `ESB PowerLine`
- Username: must end in `bot`, e.g. `ESBPowerLineBot`

BotFather replies with the **token** (`123456789:AA…`). Copy it somewhere private for
the next 20 minutes.

Then, still in BotFather:

```
/setjoingroups      → choose your bot → Disable
/setdescription     → "Energy news and Bangladesh grid data from ESB PowerLine. Send /help."
/setabouttext       → "Official bot of esbpowerline.com"
/setuserpic         → the ESB PowerLine mark
/setcommands        → choose your bot, then paste:
```

```
latest - The latest reports
grid - The newest hour NLDC has posted
generation - Generation by fuel for that hour
today - Today's posted peaks and PGCB's forecast
help - What this bot can do
```

Do not list the administrator commands there. They are for admins only.

**Use a new bot.** The Raspberry Pi already sends operations alerts from its own bot
(`~/esb-ingest/notify.env`). Keep the two separate: the public bot's token should never
be on the Pi, and the Pi's should never be public.

## 4. Add the bot to both channels, with one permission

For **each** channel: channel info → **Administrators** → **Add Admin** → search the bot's
username → add it. Grant only:

| permission | set |
|---|---|
| Post messages | **on** |
| Edit messages of others | off |
| Delete messages of others | off |
| Invite users via link, Manage live streams, Add admins, everything else | off |

Posting lets the bot post and edit its own posts, which is all it does. It never deletes:
a withdrawn article's post is edited to say it was withdrawn.

## 5. Find the staging channel's id

A private channel has no username, so you need its numeric id (`-100…`).

1. Post any message in the staging channel.
2. On your own computer, run (replace `<TOKEN>`):

   ```bash
   curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```

   PowerShell:

   ```powershell
   Invoke-RestMethod "https://api.telegram.org/bot<TOKEN>/getUpdates" | ConvertTo-Json -Depth 8
   ```

3. Find `"channel_post"` → `"chat"` → `"id"`. It starts with `-100`. That is
   `TELEGRAM_TEST_CHAT_ID`.

This only works **before** the webhook is set in step 9. If `getUpdates` answers
"can't use getUpdates method while webhook is active", run
`curl -s "https://api.telegram.org/bot<TOKEN>/deleteWebhook"`, repeat, then do step 9 again.

## 6. Find your own Telegram user id

Admin commands are allowed by **numeric user id**, never by username, because a username
can be changed or taken by someone else.

1. Open your bot in Telegram and press **Start**.
2. Run `getUpdates` again, as in step 5.
3. Find `"message"` → `"from"` → `"id"`: a number such as `412345678`.

Collect the ids of everyone who should administer the bot.

## 7. Generate the webhook secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

The result, 43 characters of letters, digits, `-` and `_`, is `TELEGRAM_WEBHOOK_SECRET`.
Anything shorter than 16 characters is rejected by the app.

## 8. Set the environment variables in Vercel

Vercel → the `esbpowerline` project → **Settings → Environment Variables**. Add each one
for the **Production** environment only:

| variable | value | secret? |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | the token from step 3 | **yes** — mark Sensitive |
| `TELEGRAM_WEBHOOK_SECRET` | from step 7 | **yes** — mark Sensitive |
| `TELEGRAM_CHANNEL_ID` | **for now, the staging id** from step 5 | no |
| `TELEGRAM_TEST_CHAT_ID` | the staging id from step 5 | no |
| `TELEGRAM_ADMIN_USER_IDS` | ids from step 6, comma-separated | no |
| `TELEGRAM_ENABLED` | `true` | no |

`TELEGRAM_CHANNEL_ID` starts as the **staging** channel on purpose: everything the
system would post publicly goes to staging until you have seen it work.

`CRON_SECRET` already exists; the notification cron uses it.

Environment variables take effect on the **next deployment**. Redeploy (Deployments →
latest production → Redeploy) after changing them.

## 9. Register the webhook

After the deployment in step 8 is live:

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://esbpowerline.com/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message"]' \
  -d "drop_pending_updates=true"
```

It should answer `{"ok":true,"result":true,"description":"Webhook was set"}`. Check it:

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

`pending_update_count` should be 0 and there should be no `last_error_message`.

## 10. Test on staging

Follow `TESTING.md` → "Live verification". In short:

1. Send your bot `/help` and `/status` in a private chat.
2. Admin → **Notifications** → **Send test**. It appears in staging.
3. Publish a test article and watch it appear in staging within seconds.
4. Switch on **Hourly grid update** for a few hours and read the posts.

## 11. Promote to the public channel

When staging looks right:

1. Vercel: change `TELEGRAM_CHANNEL_ID` to `@esbpowerline`. Leave `TELEGRAM_TEST_CHAT_ID`
   on staging.
2. Redeploy.
3. Admin → Notifications: the status card shows the new channel.
4. Send `/status` to the bot.

The next article published goes to the public channel. Nothing already sent is re-sent.
Articles published before announcements were first switched on are never posted.
